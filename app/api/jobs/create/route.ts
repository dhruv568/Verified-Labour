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
    categoryId: z.string(),
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
    (data) => (data.description && data.description.trim().length >= 3) || !!data.voiceNoteUrl,
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

    const customerProfileId = sessionUser.customerProfile?.id;
    if (!customerProfileId) {
      return NextResponse.json(
        { success: false, error: 'Customer profile record missing' },
        { status: 400 }
      );
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
      include: { user: true },
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
        status: { in: ['ACCEPTED', 'SCHEDULED', 'WORKER_ON_THE_WAY', 'ARRIVED', 'WORK_STARTED'] },
        jobRequest: {
          preferredDate: data.preferredDate,
          preferredTime: data.preferredTime,
        },
      },
    });

    if (existingConflict) {
      return NextResponse.json(
        {
          success: false,
          error: `The worker already has a confirmed booking for ${data.preferredDate} at ${data.preferredTime}. Please choose another time slot or another worker.`,
        },
        { status: 409 }
      );
    }

    // Fetch service base price
    const service = await prisma.service.findUnique({ where: { id: data.serviceId } });
    const basePrice = service ? service.basePrice : 350.0;
    const finalAmount = data.budget || basePrice;

    // Create JobRequest and Job in database
    const result = await prisma.$transaction(async (tx) => {
      const jobRequest = await tx.jobRequest.create({
        data: {
          customerId: customerProfileId,
          categoryId: data.categoryId,
          serviceId: data.serviceId,
          description: data.description?.trim() || 'Voice note requirement attached',
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
          serviceId: data.serviceId,
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
      serviceName: service?.name || 'Home Service',
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
