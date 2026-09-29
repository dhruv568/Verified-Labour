import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/db';
import { getSessionUser } from '@/lib/auth';
import { calculateHaversineDistanceKm } from '@/lib/location';
import { NotificationService } from '@/services/notification';

const createJobSchema = z
  .object({
    workerId: z.string(),
    serviceId: z.string(),
    categoryId: z.string().optional(),
    customService: z.string().optional(),
    description: z.string().optional().default(''),
    voiceNoteUrl: z.string().optional().nullable(),
    voiceNoteDuration: z.number().optional().nullable(),
    formattedAddress: z.string().min(5, 'Address is required'),
    city: z.string().default('Surat'),
    postalCode: z.string().optional(),
    latitude: z.number(),
    longitude: z.number(),
    preferredDate: z.string(), // YYYY-MM-DD
    preferredTime: z.string(), // e.g. "10:00 AM"
    urgency: z.enum(['IMMEDIATE', 'TODAY', 'SCHEDULED']).default('SCHEDULED'),
    budget: z.number().optional(),
  })
  .refine(
    (data) => (data.serviceId === 'OTHER' ? !!data.customService && data.customService.trim().length >= 1 : true),
    {
      message: 'Please describe your work',
      path: ['customService'],
    }
  )
  .refine(
    (data) =>
      (data.description && data.description.trim().length >= 3) ||
      !!data.voiceNoteUrl ||
      (!!data.customService && data.customService.trim().length >= 1),
    {
      message: 'Please describe your requirement in text or attach a voice note',
      path: ['description'],
    }
  );

export async function POST(req: NextRequest) {
  try {
    const sessionUser = await getSessionUser(req);
    if (!sessionUser) {
      return NextResponse.json(
        { success: false, error: 'Please log in or verify your mobile number to request a worker' },
        { status: 401 }
      );
    }

    if (!sessionUser.customerProfile && !sessionUser.businessProfile) {
      return NextResponse.json(
        { success: false, error: 'Only customers or businesses can book workers' },
        { status: 403 }
      );
    }

    let customerProfileId = sessionUser.customerProfile?.id;
    if (!customerProfileId) {
      const newCustomerProfile = await prisma.customerProfile.upsert({
        where: { userId: sessionUser.id },
        update: {},
        create: {
          userId: sessionUser.id,
          fullName: sessionUser.businessProfile?.contactPerson || 'Verified Customer',
          email: sessionUser.email || undefined,
        },
      });
      customerProfileId = newCustomerProfile.id;
    }

    const body = await req.json();
    const parsed = createJobSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.errors[0].message },
        { status: 400 }
      );
    }

    const data = parsed.data;

    // SECTION 65: Re-check worker state at booking time
    const worker = await prisma.workerProfile.findUnique({
      where: { id: data.workerId },
      include: {
        user: true,
        primaryCategory: true,
        skills: {
          include: {
            category: true,
          },
        },
      },
    });

    if (!worker) {
      return NextResponse.json({ success: false, error: 'Selected worker not found' }, { status: 404 });
    }

    if (worker.status !== 'VERIFIED') {
      return NextResponse.json(
        { success: false, error: 'This worker is currently not verified for new bookings.' },
        { status: 400 }
      );
    }

    if (!worker.isAvailable) {
      return NextResponse.json(
        {
          success: false,
          error: 'This worker is currently marked unavailable. Please choose another worker nearby.',
        },
        { status: 409 }
      );
    }

    // Distance check: verify job coordinates are within worker's service radius
    if (worker.latitude !== null && worker.longitude !== null) {
      const distance = calculateHaversineDistanceKm(
        data.latitude,
        data.longitude,
        worker.latitude,
        worker.longitude
      );
      if (distance > worker.serviceRadiusKm) {
        return NextResponse.json(
          {
            success: false,
            error: `Your location is ${distance.toFixed(1)} km away, which exceeds the worker's service radius of ${worker.serviceRadiusKm} km. Please select a closer worker.`,
          },
          { status: 400 }
        );
      }
    }

    // SECTION 64: Booking conflicts & Double Booking Prevention
    const existingConflict = await prisma.job.findFirst({
      where: {
        workerId: data.workerId,
        status: { in: ['REQUESTED', 'ACCEPTED', 'SCHEDULED', 'WORKER_ON_THE_WAY', 'ARRIVED', 'WORK_STARTED'] },
        jobRequest: {
          preferredDate: data.preferredDate,
          preferredTime: data.preferredTime,
        },
      },
      include: {
        jobRequest: true,
      },
    });

    if (existingConflict) {
      const isSameCustomer = existingConflict.customerId === customerProfileId;
      const isPending = existingConflict.status === 'REQUESTED';
      const statusLabel = isPending ? 'pending request' : 'confirmed booking';

      const userErrorMessage = isSameCustomer
        ? `You already have a ${statusLabel} with this worker for ${data.preferredDate} at ${data.preferredTime}. Please check your active bookings.`
        : `This worker already has a ${statusLabel} for ${data.preferredDate} at ${data.preferredTime}. Please select another time slot or worker.`;

      return NextResponse.json(
        {
          success: false,
          error: userErrorMessage,
        },
        { status: 409 }
      );
    }

    // Resolve & Validate Category ID for JobRequest strictly from selected worker record (Requirements #7 & #8)
    let resolvedCategoryId: string | null = null;
    let selectedServiceObj = null;

    if (data.serviceId && data.serviceId !== 'OTHER') {
      selectedServiceObj = await prisma.service.findUnique({
        where: { id: data.serviceId },
      });
    }

    // 1. Worker's primary category ID or relation
    if (worker.primaryCategoryId) {
      resolvedCategoryId = worker.primaryCategoryId;
    } else if (worker.primaryCategory?.id) {
      resolvedCategoryId = worker.primaryCategory.id;
    }

    // 2. Check worker's skills
    if (!resolvedCategoryId && worker.skills && worker.skills.length > 0) {
      for (const skill of worker.skills) {
        const skillCatId = skill.categoryId || skill.category?.id;
        if (skillCatId) {
          resolvedCategoryId = skillCatId;
          break;
        }
      }
    }

    // 3. Check selected service's category ID if worker has no primary category/skills
    if (!resolvedCategoryId && selectedServiceObj?.categoryId) {
      resolvedCategoryId = selectedServiceObj.categoryId;
    }

    // 4. Try matching worker's primary category slug / name with Category table
    if (!resolvedCategoryId && worker.primaryCategory) {
      const targetSlug = typeof worker.primaryCategory === 'object' ? worker.primaryCategory.slug : null;
      const targetName = typeof worker.primaryCategory === 'object' ? worker.primaryCategory.name : String(worker.primaryCategory);
      if (targetSlug || targetName) {
        const catMatch = await prisma.category.findFirst({
          where: {
            OR: [
              { slug: targetSlug || '' },
              { name: targetName || '' },
            ],
          },
          select: { id: true },
        });
        if (catMatch) {
          resolvedCategoryId = catMatch.id;
        }
      }
    }

    // 5. Fallback if frontend passed a valid category ID
    if (!resolvedCategoryId && data.categoryId && data.categoryId !== 'ALL' && data.categoryId !== 'OTHER') {
      const catCheck = await prisma.category.findUnique({
        where: { id: data.categoryId },
        select: { id: true },
      });
      if (catCheck) {
        resolvedCategoryId = catCheck.id;
      }
    }

    // 6. Final fallback: pick any active Category from DB
    if (!resolvedCategoryId) {
      const defaultCat = await prisma.category.findFirst({ where: { isActive: true }, orderBy: { sortOrder: 'asc' } });
      if (defaultCat) {
        resolvedCategoryId = defaultCat.id;
      }
    }

    // Server-Side Verification: Ensure resolvedCategoryId exists in Category table
    const categoryExists = await prisma.category.findUnique({
      where: { id: resolvedCategoryId! },
      select: { id: true },
    });

    if (!categoryExists) {
      const fallbackCat = await prisma.category.findFirst({ where: { isActive: true } });
      if (!fallbackCat) {
        return NextResponse.json(
          { success: false, error: 'System contains no active service categories.' },
          { status: 500 }
        );
      }
      resolvedCategoryId = fallbackCat.id;
    }

    // Resolve fallback serviceId for Job model relation if OTHER was selected or serviceId was custom
    let serviceIdToUse = data.serviceId;
    let serviceNameForNotification = 'Home Service';
    let basePrice = worker.hourlyRate || 350.0;

    if (data.serviceId === 'OTHER' || data.customService || !selectedServiceObj) {
      const catService = await prisma.service.findFirst({
        where: { categoryId: resolvedCategoryId, isActive: true },
      });
      if (catService) {
        serviceIdToUse = catService.id;
        basePrice = catService.basePrice || basePrice;
        serviceNameForNotification = catService.name;
      } else {
        const anyService = await prisma.service.findFirst({ where: { isActive: true } });
        if (anyService) {
          serviceIdToUse = anyService.id;
          basePrice = anyService.basePrice || basePrice;
          serviceNameForNotification = anyService.name;
        }
      }
      if (data.customService?.trim()) {
        serviceNameForNotification = `Custom Work: ${data.customService.trim()}`;
      }
    } else {
      basePrice = selectedServiceObj.basePrice || basePrice;
      serviceNameForNotification = selectedServiceObj.name;
    }

    const finalAmount = data.budget || basePrice;

    // Build job request description incorporating custom service if specified
    let fullDescription = data.description?.trim() || '';
    if (data.customService?.trim()) {
      const customPrefix = `[विशिष्ट काम / Custom Work: ${data.customService.trim()}]`;
      fullDescription = fullDescription ? `${customPrefix} ${fullDescription}` : customPrefix;
    }
    if (!fullDescription) {
      fullDescription = 'Voice note requirement attached';
    }

    // Create JobRequest and Job in database
    const result = await prisma.$transaction(async (tx) => {
      const jobRequest = await tx.jobRequest.create({
        data: {
          customerId: customerProfileId,
          categoryId: resolvedCategoryId,
          serviceId: selectedServiceObj ? selectedServiceObj.id : null,
          description: fullDescription,
          voiceNoteUrl: data.voiceNoteUrl || null,
          voiceNoteDuration: data.voiceNoteDuration || null,
          formattedAddress: data.formattedAddress,
          city: data.city,
          postalCode: data.postalCode,
          latitude: data.latitude,
          longitude: data.longitude,
          preferredDate: data.preferredDate,
          preferredTime: data.preferredTime,
          urgency: data.urgency,
          budget: finalAmount,
          status: 'MATCHED',
        },
      });

      const job = await tx.job.create({
        data: {
          jobRequestId: jobRequest.id,
          customerId: customerProfileId,
          workerId: data.workerId,
          serviceId: serviceIdToUse,
          status: 'REQUESTED',
          baseAmount: basePrice,
          finalAmount: finalAmount,
          history: {
            create: {
              fromStatus: 'NONE',
              toStatus: 'REQUESTED',
              changedByUserId: sessionUser.id,
              note: 'Job request submitted by customer',
            },
          },
        },
      });

      // Initialize Conversation between customer and worker
      await tx.conversation.create({
        data: {
          jobId: job.id,
          customerId: customerProfileId,
          workerId: data.workerId,
        },
      });

      return { jobRequest, job };
    });

    // Send notification to Worker
    await NotificationService.notifyJobEvent({
      customerId: sessionUser.id,
      workerId: worker.userId,
      jobId: result.job.id,
      eventType: 'REQUESTED',
      serviceName: serviceNameForNotification,
    });

    return NextResponse.json({
      success: true,
      jobId: result.job.id,
      status: result.job.status,
      message: 'Job request sent to worker. Worker will review and accept shortly.',
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: 'Failed to create job request: ' + err.message },
      { status: 500 }
    );
  }
}
