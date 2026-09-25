import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/db';
import { getSessionUser, hashPassword, verifyPassword } from '@/lib/auth';

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(6, 'New password must be at least 6 characters'),
});

export async function POST(req: NextRequest) {
  try {
    const sessionUser = await getSessionUser(req);
    if (!sessionUser || sessionUser.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Admin privileges required' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const parsed = changePasswordSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.errors[0].message },
        { status: 400 }
      );
    }

    const { currentPassword, newPassword } = parsed.data;

    if (!sessionUser.passwordHash) {
      return NextResponse.json(
        { success: false, error: 'User does not have a password configured.' },
        { status: 400 }
      );
    }

    // Verify current password
    const match = await verifyPassword(currentPassword, sessionUser.passwordHash);
    if (!match) {
      return NextResponse.json(
        { success: false, error: 'Current password does not match.' },
        { status: 400 }
      );
    }

    // Hash new password
    const newHash = await hashPassword(newPassword);

    await prisma.$transaction([
      prisma.user.update({
        where: { id: sessionUser.id },
        data: { passwordHash: newHash },
      }),
      prisma.auditLog.create({
        data: {
          adminId: sessionUser.adminUser?.id || null,
          action: 'ADMIN_PASSWORD_CHANGED',
          targetType: 'USER',
          targetId: sessionUser.id,
          ipAddress: req.headers.get('x-forwarded-for') || '127.0.0.1',
          userAgent: req.headers.get('user-agent') || 'Browser',
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      message: 'Admin password updated successfully.',
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: 'Failed to update password: ' + err.message },
      { status: 500 }
    );
  }
}
