import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { requirePermission } from '@/lib/rbac';

export async function GET(req: NextRequest) {
  try {
    const auth = await requirePermission(req, 'dashboard.view');
    if (auth.error) return auth.error;

    const [
      totalUsers,
      totalCustomers,
      totalWorkers,
      verifiedWorkers,
      totalBusinesses,
      activeJobs,
      completedJobs,
      cancelledJobs,
      revenueResult,
      pendingVerifications,
      pendingDisputes,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.customerProfile.count(),
      prisma.workerProfile.count(),
      prisma.workerProfile.count({ where: { status: 'VERIFIED' } }),
      prisma.businessProfile.count(),
      prisma.job.count({
        where: {
          status: { in: ['REQUESTED', 'ACCEPTED', 'SCHEDULED', 'WORKER_ON_THE_WAY', 'ARRIVED', 'WORK_STARTED'] },
        },
      }),
      prisma.job.count({
        where: { status: { in: ['COMPLETED', 'PAID', 'REVIEWED'] } },
      }),
      prisma.job.count({
        where: { status: { in: ['CANCELLED_BY_CUSTOMER', 'CANCELLED_BY_WORKER', 'REJECTED'] } },
      }),
      prisma.transaction.aggregate({
        _sum: {
          grossAmount: true,
          platformFee: true,
        },
      }),
      prisma.workerProfile.count({
        where: { status: 'PENDING_REVIEW' },
      }),
      prisma.dispute.count({
        where: { status: 'OPEN' },
      }),
    ]);

    const totalGrossRevenue = revenueResult._sum.grossAmount || 0;
    const totalPlatformRevenue = revenueResult._sum.platformFee || 0;

    return NextResponse.json({
      success: true,
      metrics: {
        totalUsers,
        totalCustomers,
        totalWorkers,
        verifiedWorkers,
        totalBusinesses,
        activeJobs,
        completedJobs,
        cancelledJobs,
        totalGrossRevenue,
        totalPlatformRevenue,
        pendingVerifications,
        pendingDisputes,
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: 'Failed to aggregate metrics: ' + err.message },
      { status: 500 }
    );
  }
}
