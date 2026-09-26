import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getSessionUser } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const sessionUser = await getSessionUser(req);
    if (!sessionUser) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { action } = (await req.json().catch(() => ({}))) || {};

    if (action === 'CANCEL') {
      await prisma.user.update({
        where: { id: sessionUser.id },
        data: { status: 'ACTIVE' },
      });

      await prisma.auditLog.create({
        data: {
          action: 'CANCEL_DELETION_REQUEST',
          targetType: 'USER',
          targetId: sessionUser.id,
          newState: JSON.stringify({ status: 'ACTIVE' }),
        },
      });

      return NextResponse.json({
        success: true,
        message: 'Account deletion request cancelled. Your account remains active.',
      });
    }

    // Default: Request account deletion (15-day notice)
    await prisma.user.update({
      where: { id: sessionUser.id },
      data: { status: 'DELETION_PENDING' },
    });

    await prisma.auditLog.create({
      data: {
        action: 'REQUEST_ACCOUNT_DELETION',
        targetType: 'USER',
        targetId: sessionUser.id,
        newState: JSON.stringify({ status: 'DELETION_PENDING', deletionScheduledDays: 15 }),
      },
    });

    return NextResponse.json({
      success: true,
      deletionNoticeDays: 15,
      message: 'Your profile deletion request has been received. Your profile will be deleted within 15 days.',
    });
  } catch (err: any) {
    console.error('Delete account request error:', err);
    return NextResponse.json(
      { success: false, error: 'Failed to process deletion request: ' + err.message },
      { status: 500 }
    );
  }
}
