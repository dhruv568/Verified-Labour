import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/db';
import { getSessionUser } from '@/lib/auth';

const jobActionSchema = z.object({
  jobId: z.string(),
  action: z.enum(['UPDATE_STATUS', 'CANCEL', 'RESOLVE']),
  newStatus: z.string().optional(),
  reason: z.string().optional(),
});

export async function GET(req: NextRequest) {
  try {
    const sessionUser = await getSessionUser(req);
    if (!sessionUser || sessionUser.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Admin access required' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');

    const jobs = await prisma.job.findMany({
      where: {
        ...(status && status !== 'ALL' ? { status } : {}),
      },
      include: {
        customer: { select: { fullName: true, email: true, user: { select: { phone: true } } } },
        worker: { select: { fullName: true, user: { select: { phone: true } } } },
        service: { select: { name: true } },
        jobRequest: true,
        payment: true,
        transaction: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      success: true,
      jobs: jobs.map((j) => ({
        id: j.id,
        customerName: j.customer.fullName,
        customerPhone: j.customer.user.phone,
        workerName: j.worker.fullName,
        workerPhone: j.worker.user.phone,
        serviceName: j.service.name,
        address: j.jobRequest?.formattedAddress || 'N/A',
        preferredDate: j.jobRequest?.preferredDate || 'N/A',
        preferredTime: j.jobRequest?.preferredTime || 'N/A',
        baseAmount: j.baseAmount,
        finalAmount: j.finalAmount,
        status: j.status,
        cancellationReason: j.cancellationReason,
        createdAt: j.createdAt,
        paymentStatus: j.payment?.status || 'UNPAID',
      })),
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch jobs: ' + err.message },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const sessionUser = await getSessionUser(req);
    if (!sessionUser || sessionUser.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Admin access required' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const parsed = jobActionSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.errors[0].message },
        { status: 400 }
      );
    }

    const { jobId, action, newStatus, reason } = parsed.data;

    const job = await prisma.job.findUnique({
      where: { id: jobId },
    });

    if (!job) {
      return NextResponse.json({ success: false, error: 'Job not found' }, { status: 404 });
    }

    let targetStatus = job.status;
    let cancelReason = job.cancellationReason;

    if (action === 'CANCEL') {
      targetStatus = 'CANCELLED_BY_ADMIN';
      cancelReason = reason || 'Cancelled by Admin';
    } else if (action === 'UPDATE_STATUS' && newStatus) {
      targetStatus = newStatus;
    } else if (action === 'RESOLVE') {
      targetStatus = 'COMPLETED';
    }

    await prisma.$transaction([
      prisma.job.update({
        where: { id: jobId },
        data: {
          status: targetStatus,
          ...(cancelReason ? { cancellationReason: cancelReason, cancelInitiatedBy: 'ADMIN' } : {}),
        },
      }),
      prisma.jobStatusHistory.create({
        data: {
          jobId,
          fromStatus: job.status,
          toStatus: targetStatus,
          changedByUserId: sessionUser.id,
          note: reason || `Admin action: ${action}`,
        },
      }),
      prisma.auditLog.create({
        data: {
          adminId: sessionUser.adminUser?.id || null,
          action: `JOB_${action}`,
          targetType: 'JOB',
          targetId: jobId,
          previousState: JSON.stringify({ status: job.status }),
          newState: JSON.stringify({ status: targetStatus, reason }),
          ipAddress: req.headers.get('x-forwarded-for') || '127.0.0.1',
          userAgent: req.headers.get('user-agent') || 'Browser',
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      newStatus: targetStatus,
      message: `Job updated to ${targetStatus}`,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: 'Failed to update job: ' + err.message },
      { status: 500 }
    );
  }
}
