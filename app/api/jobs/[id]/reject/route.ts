import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getSessionUser } from '@/lib/auth';
import NotificationService from '@/services/notification';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const sessionUser = await getSessionUser(req);
    if (!sessionUser) {
      return NextResponse.json({ success: false, error: 'Unauthorized: Please log in' }, { status: 401 });
    }

    const workerProfileId = sessionUser.workerProfile?.id;
    if (!workerProfileId && sessionUser.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Only assigned workers can reject job requests' },
        { status: 403 }
      );
    }

    const { id: jobId } = params;
    const body = await req.json().catch(() => ({}));
    const reason = body?.reason || 'Worker declined request';

    const existingJob = await prisma.job.findUnique({
      where: { id: jobId },
      include: {
        customer: { include: { user: true } },
        worker: { include: { user: true } },
        service: true,
      },
    });

    if (!existingJob) {
      return NextResponse.json({ success: false, error: 'Job request not found' }, { status: 404 });
    }

    if (workerProfileId && existingJob.workerId !== workerProfileId && sessionUser.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'You are not assigned to this job request' },
        { status: 403 }
      );
    }

    // Atomic update conditional on status === 'REQUESTED' (prevents race conditions & double actions)
    const updateResult = await prisma.job.updateMany({
      where: {
        id: jobId,
        workerId: existingJob.workerId,
        status: 'REQUESTED',
      },
      data: {
        status: 'REJECTED',
        rejectionReason: reason,
        updatedAt: new Date(),
      },
    });

    if (updateResult.count === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Booking request is no longer available or has already been accepted/rejected.',
        },
        { status: 409 }
      );
    }

    // Create job status history record
    await prisma.jobStatusHistory.create({
      data: {
        jobId,
        fromStatus: 'REQUESTED',
        toStatus: 'REJECTED',
        changedByUserId: sessionUser.id,
        note: `Declined by worker. Reason: ${reason}`,
      },
    });

    // Notify customer
    await NotificationService.notifyJobEvent({
      customerId: existingJob.customer.user.id,
      workerId: sessionUser.id,
      jobId,
      eventType: 'REJECTED',
      serviceName: existingJob.service.name,
    });

    const updatedJob = await prisma.job.findUnique({
      where: { id: jobId },
      include: {
        jobRequest: { include: { category: true, service: true } },
        customer: { include: { user: { select: { phone: true } } } },
        worker: { include: { primaryCategory: true } },
        service: true,
      },
    });

    return NextResponse.json({
      success: true,
      status: 'REJECTED',
      job: updatedJob,
      message: 'Job request declined',
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: 'Failed to reject job: ' + err.message }, { status: 500 });
  }
}
