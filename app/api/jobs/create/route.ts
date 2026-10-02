import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/db';
import { getSessionUser } from '@/lib/auth';
import { calculateHaversineDistanceKm } from '@/lib/location';
import { isTestWorkerOverrideEnabled } from '@/lib/worker-verification';
import { NotificationService } from '@/services/notification';

const createJobSchema = z
  .object({
    workerId: z.string().min(1, 'Worker ID is required'),
    serviceId: z.string().optional().nullable(),
    categoryId: z.string().optional().nullable(),
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
    (data) =>
      (data.description && data.description.trim().length >= 3) ||
      !!data.voiceNoteUrl,
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

    // Fetch worker profile first to determine primary category and available skills
    const worker = await prisma.workerProfile.findUnique({
      where: { id: data.workerId },
      include: {
        user: true,
        primaryCategory: {
          include: { services: true },
        },
        skills: {
          include: {
            category: { include: { services: true } },
            service: true,
          },
        },
      },
    });

    if (!worker) {
      return NextResponse.json({ success: false, error: 'Selected worker not found' }, { status: 404 });
    }

    if (worker.status !== 'VERIFIED' && !isTestWorkerOverrideEnabled(worker.id)) {
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

    // Resolve & validate real database Service object for Job creation
    const rawServiceId = (data.serviceId || '').trim();
    const rawCategoryId = (data.categoryId || '').trim();
    let selectedServiceObj = null;

    // 1. Direct active service match by ID or slug
    if (rawServiceId && rawServiceId.toUpperCase() !== 'OTHER') {
      selectedServiceObj = await prisma.service.findFirst({
        where: {
          OR: [
            { id: rawServiceId },
            { slug: rawServiceId },
          ],
          isActive: true,
        },
        include: { category: true },
      });
    }

    // 2. Reject explicitly inactive services if serviceId was directly specified and found inactive
    if (!selectedServiceObj && rawServiceId && rawServiceId.toUpperCase() !== 'OTHER') {
      const inactiveService = await prisma.service.findFirst({
        where: {
          OR: [
            { id: rawServiceId },
            { slug: rawServiceId },
          ],
          isActive: false,
        },
      });
      if (inactiveService) {
        return NextResponse.json(
          {
            success: false,
            error: 'Selected service is unavailable. Please select another worker.',
          },
          { status: 400 }
        );
      }
    }

    // 3. Category / Trade match: if serviceId or categoryId passed is a Category ID, Category slug, or trade term
    const TRADE_SLUG_MAP: Record<string, string> = {
      electrician: 'electrical',
      electrical: 'electrical',
      plumber: 'plumbing',
      plumbing: 'plumbing',
      carpenter: 'carpenter',
      painter: 'painting',
      painting: 'painting',
      cook: 'cook',
      cleaner: 'cleaning',
      cleaning: 'cleaning',
      driver: 'driver',
      mason: 'construction',
      construction: 'construction',
      mechanic: 'mechanic',
      'ac-technician': 'electrical',
      'ac technician': 'electrical',
      watchman: 'watchman',
      'office-boy': 'office-boy',
      washerman: 'washerman',
    };

    if (!selectedServiceObj) {
      const categoryTerm = rawServiceId || rawCategoryId;
      if (categoryTerm && categoryTerm.toUpperCase() !== 'OTHER') {
        let mappedSlug = TRADE_SLUG_MAP[categoryTerm.toLowerCase()];
        if (!mappedSlug) {
          const lower = categoryTerm.toLowerCase();
          for (const [trade, catSlug] of Object.entries(TRADE_SLUG_MAP)) {
            if (lower.includes(trade)) {
              mappedSlug = catSlug;
              break;
            }
          }
        }

        let matchedCategory = await prisma.category.findFirst({
          where: {
            OR: [
              { id: categoryTerm },
              { slug: categoryTerm.toLowerCase() },
              ...(mappedSlug ? [{ slug: mappedSlug }] : []),
              { name: { equals: categoryTerm } },
            ],
            isActive: true,
          },
        });

        if (!matchedCategory && worker) {
          const workerCatId = worker.primaryCategoryId || worker.primaryCategory?.id;
          const workerCatSlug = worker.primaryCategory?.slug?.toLowerCase();
          const categoryTermLower = categoryTerm.toLowerCase();

          if (
            (workerCatId && categoryTerm === workerCatId) ||
            (workerCatSlug && categoryTermLower === workerCatSlug) ||
            (mappedSlug && workerCatSlug === mappedSlug) ||
            (rawServiceId && rawCategoryId && rawServiceId === rawCategoryId)
          ) {
            if (workerCatId) {
              matchedCategory = await prisma.category.findFirst({
                where: { id: workerCatId, isActive: true },
              });
            }
          }
        }

        if (matchedCategory) {
          selectedServiceObj = await prisma.service.findFirst({
            where: { categoryId: matchedCategory.id, isActive: true },
            include: { category: true },
          });
        }
      }
    }

    // If a non-empty, non-OTHER serviceId was explicitly provided, but failed both Service and Category matching, reject it as invalid.
    const isCategoryUsage = rawServiceId && ((rawCategoryId && rawServiceId === rawCategoryId) || rawServiceId === worker.primaryCategoryId);
    if (!selectedServiceObj && rawServiceId && rawServiceId.toUpperCase() !== 'OTHER' && !isCategoryUsage) {
      return NextResponse.json(
        {
          success: false,
          error: 'Selected service is unavailable. Please select another worker.',
        },
        { status: 400 }
      );
    }

    // 4. Automatic Fallback for empty/OTHER serviceId: use worker's primary category or trade
    if (!selectedServiceObj) {
      const workerCatId = worker.primaryCategoryId || worker.primaryCategory?.id;
      if (workerCatId) {
        selectedServiceObj = await prisma.service.findFirst({
          where: { categoryId: workerCatId, isActive: true },
          include: { category: true },
        });
      }

      if (!selectedServiceObj) {
        const rawCatTerm = (worker.primaryCategory?.slug || worker.primaryCategory?.name || worker.bio || '').toLowerCase();

        let mappedCatSlug = '';
        for (const [trade, catSlug] of Object.entries(TRADE_SLUG_MAP)) {
          if (rawCatTerm.includes(trade)) {
            mappedCatSlug = catSlug;
            break;
          }
        }

        if (mappedCatSlug) {
          selectedServiceObj = await prisma.service.findFirst({
            where: { category: { slug: mappedCatSlug }, isActive: true },
            include: { category: true },
          });
        } else if (worker.primaryCategory?.slug) {
          selectedServiceObj = await prisma.service.findFirst({
            where: { category: { slug: worker.primaryCategory.slug.toLowerCase() }, isActive: true },
            include: { category: true },
          });
        }
      }

      if (!selectedServiceObj) {
        selectedServiceObj = await prisma.service.findFirst({
          where: { slug: 'other-work-service', isActive: true },
          include: { category: true },
        }) || await prisma.service.findFirst({
          where: { isActive: true },
          include: { category: true },
        });
      }
    }

    console.log('[DEBUG_BOOKING]', {
      workerId: data.workerId,
      rawServiceId,
      workerPrimaryCatId: worker.primaryCategoryId,
      workerPrimaryCatSlug: worker.primaryCategory?.slug,
      resolvedServiceId: selectedServiceObj?.id,
      resolvedServiceName: selectedServiceObj?.name,
    });

    if (!selectedServiceObj) {
      return NextResponse.json(
        {
          success: false,
          error: 'Selected service is unavailable. Please select another worker.',
        },
        { status: 400 }
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

    // Booking conflicts & Double Booking Prevention
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

    const resolvedCategoryId = selectedServiceObj.categoryId;
    const basePrice = selectedServiceObj.basePrice || worker.hourlyRate || 350.0;
    const finalAmount = data.budget || basePrice;
    const serviceNameForNotification = selectedServiceObj.name;
    const fullDescription = data.description?.trim() || 'Voice note requirement attached';

    // Create JobRequest and Job in database transaction
    const result = await prisma.$transaction(async (tx) => {
      const jobRequest = await tx.jobRequest.create({
        data: {
          customerId: customerProfileId,
          categoryId: resolvedCategoryId,
          serviceId: selectedServiceObj.id,
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
          serviceId: selectedServiceObj.id,
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
