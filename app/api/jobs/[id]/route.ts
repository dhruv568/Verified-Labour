import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getSessionUser } from '@/lib/auth';
import { ALLOWED_TRANSITIONS, JobStatus } from '@/services/job-state-machine';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const sessionUser = await getSessionUser(req);
    if (!sessionUser) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;

    const job = await prisma.job.findUnique({
      where: { id },
      include: {
        jobRequest: {
          include: { category: true, service: true },
        },
        customer: {
          include: { user: { select: { phone: true } } },
        },
        worker: {
          include: {
            user: { select: { phone: true } },
            primaryCategory: true,
          },
        },
        service: true,
        history: {
          orderBy: { createdAt: 'desc' },
        },
        payment: true,
        review: true,
      },
    });

    if (!job) {
      return NextResponse.json({ success: false, error: 'Job not found' }, { status: 404 });
    }

    // RBAC: only participant or Admin can view
    const isCustomer = sessionUser.customerProfile?.id === job.customerId;
    const isWorker = sessionUser.workerProfile?.id === job.workerId;
    const isAdmin = sessionUser.role === 'ADMIN';

    if (!isCustomer && !isWorker && !isAdmin) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const currentStatus = job.status as JobStatus;
    const allowedNextStatuses = ALLOWED_TRANSITIONS[currentStatus] || [];

    // Filter allowed transitions based on user role
    const actionableNextStatuses = allowedNextStatuses.filter((s) => {
      if (isAdmin) return true;
      if (isWorker) {
        return [
          'ACCEPTED',
          'REJECTED',
          'WORKER_ON_THE_WAY',
          'ARRIVED',
          'WORK_STARTED',
          'WORK_COMPLETED',
          'CANCELLED_BY_WORKER',
          'DISPUTED',
        ].includes(s);
      }
      if (isCustomer) {
        return [
          'SCHEDULED',
          'CANCELLED_BY_CUSTOMER',
          'PAYMENT_PENDING',
          'PAID',
          'REVIEWED',
          'COMPLETED',
          'DISPUTED',
        ].includes(s);
      }
      return false;
    });

    return NextResponse.json({
      success: true,
      job,
      currentStatus,
      allowedNextStatuses,
      actionableNextStatuses,
      canChat: !['REJECTED', 'CANCELLED_BY_CUSTOMER', 'CANCELLED_BY_WORKER', 'EXPIRED'].includes(
        currentStatus
      ),
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch job details: ' + err.message },
      { status: 500 }
    );
  }
}
