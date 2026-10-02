import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getSessionUser } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const sessionUser = await getSessionUser(req);
    if (!sessionUser) {
      return NextResponse.json({ success: true, pendingJobs: [] });
    }

    const whereClause: any = {
      status: 'REQUESTED',
    };

    if (sessionUser.role === 'WORKER' && sessionUser.workerProfile?.id) {
      whereClause.workerId = sessionUser.workerProfile.id;
    } else if (sessionUser.role === 'CUSTOMER' && sessionUser.customerProfile?.id) {
      whereClause.customerId = sessionUser.customerProfile.id;
    } else if (sessionUser.role === 'ADMIN') {
      // Admin can view all pending requests
    } else {
      return NextResponse.json({ success: true, pendingJobs: [] });
    }

    const pendingJobs = await prisma.job.findMany({
      where: whereClause,
      include: {
        jobRequest: {
          include: { category: true, service: true },
        },
        customer: {
          include: { user: { select: { phone: true } } },
        },
        worker: {
          include: { primaryCategory: true },
        },
        service: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    return NextResponse.json({
      success: true,
      pendingJobs,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message, pendingJobs: [] }, { status: 500 });
  }
}
