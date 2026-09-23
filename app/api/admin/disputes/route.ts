import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/db';
import { getSessionUser } from '@/lib/auth';

const resolveDisputeSchema = z.object({
  disputeId: z.string(),
  resolution: z.enum(['REFUND_CUSTOMER', 'PAY_WORKER', 'SPLIT', 'DISMISS']),
  notes: z.string().min(5),
});

export async function GET(req: NextRequest) {
  try {
    const sessionUser = await getSessionUser(req);
    if (!sessionUser || sessionUser.role !== 'ADMIN') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 });
    }

    const disputes = await prisma.dispute.findMany({
      include: {
        initiator: { select: { phone: true, role: true } },
        job: {
          include: {
            customer: true,
            worker: true,
            service: true,
            payment: true,
            transaction: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ success: true, disputes });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const sessionUser = await getSessionUser(req);
    if (!sessionUser || sessionUser.role !== 'ADMIN') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 });
    }

    const body = await req.json();
    const parsed = resolveDisputeSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.error.errors[0].message }, { status: 400 });
    }

    const { disputeId, resolution, notes } = parsed.data;

    const dispute = await prisma.dispute.findUnique({
      where: { id: disputeId },
      include: { job: true },
    });

    if (!dispute) {
      return NextResponse.json({ success: false, error: 'Dispute not found' }, { status: 404 });
    }

    const adminId = sessionUser.adminUser?.id || null;

    await prisma.$transaction([
      prisma.dispute.update({
        where: { id: disputeId },
        data: {
          status: 'RESOLVED',
          resolution: `${resolution}: ${notes}`,
          resolvedByAdminId: adminId,
          resolvedAt: new Date(),
        },
      }),
      prisma.auditLog.create({
        data: {
          adminId,
          action: 'DISPUTE_RESOLVED',
          targetType: 'DISPUTE',
          targetId: disputeId,
          previousState: JSON.stringify({ status: dispute.status }),
          newState: JSON.stringify({ status: 'RESOLVED', resolution, notes }),
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      message: 'Dispute resolved and recorded in audit log',
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
