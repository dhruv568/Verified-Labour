import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/db';
import { getSessionUser } from '@/lib/auth';
import JobStateMachine, { JobStatus } from '@/services/job-state-machine';
import NotificationService from '@/services/notification';

const transitionSchema = z.object({
  toStatus: z.string(),
  reason: z.string().optional(),
  note: z.string().optional(),
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
    const body = await req.json();
    const parsed = transitionSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.errors[0].message },
        { status: 400 }
      );
    }

    const { toStatus, reason, note } = parsed.data;

    // Fetch existing job to check participants
    const job = await prisma.job.findUnique({
      where: { id: jobId },
      include: {
        customer: { include: { user: true } },
        worker: { include: { user: true } },
        service: true,
      },
    });

    if (!job) {
      return NextResponse.json({ success: false, error: 'Job not found' }, { status: 404 });
    }

    // Role verification
    const isCustomer = sessionUser.customerProfile?.id === job.customerId;
    const isWorker = sessionUser.workerProfile?.id === job.workerId;
    const isAdmin = sessionUser.role === 'ADMIN';

    if (!isCustomer && !isWorker && !isAdmin) {
      return NextResponse.json(
        { success: false, error: 'You are not a participant in this job' },
        { status: 403 }
      );
    }

    const userRole = isAdmin
      ? 'ADMIN'
      : isWorker
      ? 'WORKER'
      : 'CUSTOMER';

    // Execute state machine transition
    const result = await JobStateMachine.transition({
      jobId,
      toStatus: toStatus as JobStatus,
      changedByUserId: sessionUser.id,
      userRole,
      note,
      reason,
    });

    // Notify counterpart
    if (['ACCEPTED', 'REJECTED', 'WORKER_ON_THE_WAY', 'ARRIVED', 'WORK_COMPLETED'].includes(toStatus)) {
      await NotificationService.notifyJobEvent({
        customerId: job.customer.user.id,
        workerId: job.worker.user.id,
        jobId,
        eventType: toStatus as any,
        serviceName: job.service.name,
      });
    }

    return NextResponse.json({
      success: true,
      status: result.job.status,
      job: result.job,
      message: `Job status transitioned to ${result.job.status}`,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 400 }
    );
  }
}
