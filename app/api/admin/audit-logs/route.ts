import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { requirePermission } from '@/lib/rbac';

export async function GET(req: NextRequest) {
  try {
    const auth = await requirePermission(req, 'audit.view');
    if (auth.error) return auth.error;

    const logs = await prisma.auditLog.findMany({
      take: 100,
      orderBy: { createdAt: 'desc' },
      include: {
        admin: {
          include: {
            user: { select: { phone: true, email: true } },
          },
        },
      },
    });

    return NextResponse.json({ success: true, logs });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
