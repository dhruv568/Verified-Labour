import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/db';
import { requirePermission } from '@/lib/rbac';

const workerActionSchema = z.object({
  workerId: z.string(),
  action: z.enum(['APPROVE', 'REJECT', 'SUSPEND', 'REACTIVATE', 'REQUEST_INFO']),
  reason: z.string().optional(),
});

export async function GET(req: NextRequest) {
  try {
    const auth = await requirePermission(req, 'workers.view');
    if (auth.error) return auth.error;

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');

    const workers = await prisma.workerProfile.findMany({
      where: {
        ...(status && { status }),
      },
      include: {
        user: { select: { phone: true, email: true, createdAt: true } },
        primaryCategory: true,
        aadhaarVerif: true,
        bankVerif: true,
        documents: true,
        _count: { select: { jobs: true, reviews: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      success: true,
      workers: workers.map((w) => ({
        id: w.id,
        fullName: w.fullName,
        phone: w.user.phone,
        email: w.user.email,
        primaryCategory: w.primaryCategory?.name || 'Unassigned',
        experienceYears: w.experienceYears,
        city: w.city,
        status: w.status,
        identityStatus: w.aadhaarVerif?.status || 'NOT_STARTED',
        maskedAadhaar: w.aadhaarVerif?.maskedAadhaar || 'N/A',
        bankStatus: w.bankVerif?.status || 'NOT_STARTED',
        maskedBank: w.bankVerif?.maskedAccountNo || 'N/A',
        bankName: w.bankVerif?.bankName || 'N/A',
        nameMatchScore: w.bankVerif?.nameMatchScore,
        skillVerified: w.skillVerified,
        documentCount: w.documents.length,
        jobsCompleted: w._count.jobs,
        registeredAt: w.user.createdAt,
      })),
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch workers: ' + err.message },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = workerActionSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.errors[0].message },
        { status: 400 }
      );
    }

    const { workerId, action, reason } = parsed.data;

    // Check specific permission for action
    let requiredPerm = 'workers.edit';
    if (action === 'APPROVE') requiredPerm = 'workers.verify';
    else if (action === 'REJECT') requiredPerm = 'workers.reject';
    else if (action === 'SUSPEND') requiredPerm = 'workers.disable';

    const auth = await requirePermission(req, requiredPerm);
    if (auth.error) return auth.error;

    const worker = await prisma.workerProfile.findUnique({
      where: { id: workerId },
      include: { aadhaarVerif: true, bankVerif: true, user: true },
    });

    if (!worker) {
      return NextResponse.json({ success: false, error: 'Worker not found' }, { status: 404 });
    }

    const previousStatus = worker.status;
    let newStatus = previousStatus;

    if (action === 'APPROVE') {
      const hasAadhaar = worker.aadhaarVerif?.status === 'VERIFIED';
      const hasBank = worker.bankVerif?.status === 'VERIFIED';

      if (!hasAadhaar || !hasBank) {
        return NextResponse.json(
          {
            success: false,
            error:
              'Cannot approve worker without completed Cashfree Identity (Aadhaar) and Bank verifications. Both must be verified by Cashfree first.',
          },
          { status: 400 }
        );
      }
      newStatus = 'VERIFIED';
    } else if (action === 'REJECT') {
      newStatus = 'REJECTED';
    } else if (action === 'SUSPEND') {
      newStatus = 'SUSPENDED';
    } else if (action === 'REACTIVATE') {
      newStatus = 'VERIFIED';
    } else if (action === 'REQUEST_INFO') {
      newStatus = 'PENDING_REVIEW';
    }

    await prisma.$transaction([
      prisma.workerProfile.update({
        where: { id: workerId },
        data: { status: newStatus },
      }),
      ...(action === 'SUSPEND' || action === 'REACTIVATE'
        ? [
            prisma.user.update({
              where: { id: worker.userId },
              data: { status: action === 'SUSPEND' ? 'SUSPENDED' : 'ACTIVE' },
            }),
          ]
        : []),
      prisma.auditLog.create({
        data: {
          adminId: auth.user.adminUser?.id || null,
          action: `WORKER_${action}`,
          targetType: 'WORKER_PROFILE',
          targetId: workerId,
          previousState: JSON.stringify({ status: previousStatus }),
          newState: JSON.stringify({ status: newStatus, reason: reason || 'Admin decision' }),
          ipAddress: req.headers.get('x-forwarded-for') || '127.0.0.1',
          userAgent: req.headers.get('user-agent') || 'Browser',
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      previousStatus,
      newStatus,
      message: `Worker successfully updated to ${newStatus}`,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: 'Worker action failed: ' + err.message },
      { status: 500 }
    );
  }
}
