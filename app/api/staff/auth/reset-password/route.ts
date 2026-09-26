import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/db';
import { hashToken } from '@/lib/tokens';
import { hashPassword } from '@/lib/auth';

const passwordSchema = z.string()
  .min(8, 'Password must be at least 8 characters long')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character');

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { token, password, confirmPassword } = body;

    if (!token) {
      return NextResponse.json({ success: false, error: 'Reset token is required.' }, { status: 400 });
    }

    if (password !== confirmPassword) {
      return NextResponse.json({ success: false, error: 'Passwords do not match.' }, { status: 400 });
    }

    const parsedPass = passwordSchema.safeParse(password);
    if (!parsedPass.success) {
      return NextResponse.json(
        { success: false, error: parsedPass.error.errors[0].message },
        { status: 400 }
      );
    }

    const tokenHash = hashToken(token);
    const resetRecord = await prisma.passwordResetToken.findUnique({
      where: { tokenHash },
    });

    if (!resetRecord || resetRecord.usedAt) {
      return NextResponse.json(
        { success: false, error: 'Invalid or already used password reset link.' },
        { status: 400 }
      );
    }

    if (Date.now() > new Date(resetRecord.expiresAt).getTime()) {
      return NextResponse.json(
        { success: false, error: 'Password reset link has expired.' },
        { status: 410 }
      );
    }

    const user = await prisma.user.findFirst({
      where: { email: resetRecord.email },
    });

    if (!user) {
      return NextResponse.json({ success: false, error: 'User account not found.' }, { status: 404 });
    }

    const passwordHashValue = await hashPassword(password);

    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: user.id },
        data: { passwordHash: passwordHashValue },
      });

      await tx.passwordResetToken.update({
        where: { id: resetRecord.id },
        data: { usedAt: new Date() },
      });

      // Invalidate existing sessions
      await tx.session.deleteMany({
        where: { userId: user.id },
      });
    });

    // Audit Log
    const clientIp = req.headers.get('x-forwarded-for') || '127.0.0.1';
    await prisma.auditLog.create({
      data: {
        adminId: null,
        action: 'STAFF_PASSWORD_RESET',
        targetType: 'USER',
        targetId: user.id,
        newState: JSON.stringify({ email: user.email }),
        ipAddress: clientIp,
        userAgent: req.headers.get('user-agent') || 'Browser',
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Password updated successfully! Please sign in with your new password.',
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
