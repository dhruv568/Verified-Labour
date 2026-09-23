import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getSessionUser } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const sessionUser = await getSessionUser(req);
    if (!sessionUser) {
      return NextResponse.json({ success: false, error: 'Unauthorized: Authentication required' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const statusParam = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '50', 10);

    const whereClause: any = {};

    if (sessionUser.role === 'CUSTOMER') {
      const customerId = sessionUser.customerProfile?.id;
      if (!customerId) {
        return NextResponse.json({ success: false, error: 'Customer profile record not found' }, { status: 404 });
      }
      whereClause.customerId = customerId;
    } else if (sessionUser.role === 'WORKER') {
      const workerId = sessionUser.workerProfile?.id;
      if (!workerId) {
        return NextResponse.json({ success: false, error: 'Worker profile record not found' }, { status: 404 });
      }
      whereClause.workerId = workerId;
    } else if (sessionUser.role === 'ADMIN') {
      // Admin can query all or filter by customerId or workerId
      const customerId = searchParams.get('customerId');
      const workerId = searchParams.get('workerId');
      if (customerId) whereClause.customerId = customerId;
      if (workerId) whereClause.workerId = workerId;
    } else {
      return NextResponse.json({ success: false, error: 'Role not authorized to access jobs' }, { status: 403 });
    }

    if (statusParam) {
      if (statusParam === 'ACTIVE') {
        whereClause.status = {
          in: ['REQUESTED', 'ACCEPTED', 'SCHEDULED', 'WORKER_ON_THE_WAY', 'ARRIVED', 'WORK_STARTED'],
        };
      } else if (statusParam === 'COMPLETED') {
        whereClause.status = { in: ['COMPLETED', 'PAID', 'REVIEWED'] };
      } else {
        whereClause.status = statusParam;
      }
    }

    const jobs = await prisma.job.findMany({
      where: whereClause,
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
        payment: true,
        review: true,
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return NextResponse.json({
      success: true,
      total: jobs.length,
      jobs,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: 'Failed to retrieve jobs: ' + err.message },
      { status: 500 }
    );
  }
}
