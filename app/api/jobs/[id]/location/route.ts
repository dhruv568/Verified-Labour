import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/db';
import { getSessionUser } from '@/lib/auth';

const locationUpdateSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  accuracy: z.number().optional().nullable(),
});

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const sessionUser = await getSessionUser(req);
    if (!sessionUser) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { id: jobId } = params;
    const workerProfileId = sessionUser.workerProfile?.id;

    if (!workerProfileId) {
      return NextResponse.json({ success: false, error: 'Only worker profiles can submit location updates' }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const parsed = locationUpdateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.errors[0]?.message || 'Invalid location coordinates' },
        { status: 400 }
      );
    }

    const { latitude, longitude, accuracy } = parsed.data;

    const job = await prisma.job.findUnique({
      where: { id: jobId },
      select: {
        id: true,
        workerId: true,
        status: true,
      },
    });

    if (!job) {
      return NextResponse.json({ success: false, error: 'Job not found' }, { status: 404 });
    }

    // Backend validation: Verify the job and worker relationship
    if (job.workerId !== workerProfileId) {
      return NextResponse.json(
        { success: false, error: 'Forbidden: You are not the assigned worker for this job' },
        { status: 403 }
      );
    }

    // Backend validation: Location tracking ONLY allowed when job status is WORKER_ON_THE_WAY
    if (job.status !== 'WORKER_ON_THE_WAY') {
      return NextResponse.json(
        {
          success: false,
          error: `Live location updates are only permitted while status is 'WORKER_ON_THE_WAY'. Current status: '${job.status}'`,
        },
        { status: 400 }
      );
    }

    const activeLocation = await prisma.activeJobLocation.upsert({
      where: { jobId },
      update: {
        latitude,
        longitude,
        accuracy: accuracy || null,
      },
      create: {
        jobId,
        workerId: workerProfileId,
        latitude,
        longitude,
        accuracy: accuracy || null,
      },
    });

    return NextResponse.json({
      success: true,
      active: true,
      location: {
        latitude: activeLocation.latitude,
        longitude: activeLocation.longitude,
        accuracy: activeLocation.accuracy,
        updatedAt: activeLocation.updatedAt,
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: 'Failed to update live location: ' + err.message },
      { status: 500 }
    );
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const sessionUser = await getSessionUser(req);
    if (!sessionUser) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { id: jobId } = params;

    const job = await prisma.job.findUnique({
      where: { id: jobId },
      include: {
        jobRequest: {
          select: { latitude: true, longitude: true, formattedAddress: true },
        },
        worker: {
          select: { fullName: true, id: true },
        },
        activeLocation: true,
      },
    });

    if (!job) {
      return NextResponse.json({ success: false, error: 'Job not found' }, { status: 404 });
    }

    // Privacy & Authorization check: Only assigned customer, assigned worker, or admin can access
    const isCustomer = sessionUser.customerProfile?.id === job.customerId;
    const isWorker = sessionUser.workerProfile?.id === job.workerId;
    const isAdmin = sessionUser.role === 'ADMIN';

    if (!isCustomer && !isWorker && !isAdmin) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    if (job.status !== 'WORKER_ON_THE_WAY') {
      return NextResponse.json({
        success: true,
        active: false,
        status: job.status,
        message: 'Live worker location tracking is not active.',
      });
    }

    return NextResponse.json({
      success: true,
      active: true,
      status: job.status,
      workerName: job.worker.fullName,
      location: job.activeLocation
        ? {
            latitude: job.activeLocation.latitude,
            longitude: job.activeLocation.longitude,
            accuracy: job.activeLocation.accuracy,
            updatedAt: job.activeLocation.updatedAt,
          }
        : null,
      customerLocation: {
        latitude: job.jobRequest.latitude,
        longitude: job.jobRequest.longitude,
        address: job.jobRequest.formattedAddress,
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch location: ' + err.message },
      { status: 500 }
    );
  }
}
