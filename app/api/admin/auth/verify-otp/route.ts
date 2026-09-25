import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/db';
import { signAuthToken, setAuthCookie } from '@/lib/auth';
import { checkRateLimit } from '@/lib/rate-limiter';
import { verifyEmailOtpCode } from '@/services/resend-service';

const verifyOtpSchema = z.object({
  email: z.string().email(),
  otp: z.string().min(4).max(8),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = verifyOtpSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.errors[0].message },
        { status: 400 }
      );
    }

    const { email, otp } = parsed.data;
    const normalizedEmail = email.toLowerCase().trim();

    // Rate Limit: 5 attempts per 15 minutes per IP/email
    const clientIp = req.headers.get('x-forwarded-for') || '127.0.0.1';
    const rateKey = `admin_otp_verify:${clientIp}:${normalizedEmail}`;
    const rateCheck = checkRateLimit(rateKey, 5, 900);

    if (!rateCheck.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: `Too many OTP attempts. Please try again in ${rateCheck.retryAfterSeconds} seconds.`,
        },
        { status: 429 }
      );
    }

    // Verify OTP code
    const otpVerification = verifyEmailOtpCode(normalizedEmail, otp);
    if (!otpVerification.success) {
      return NextResponse.json(
        { success: false, error: otpVerification.error || 'Invalid OTP verification code.' },
        { status: 400 }
      );
    }

    // Fetch Admin User from DB
    const user = await prisma.user.findFirst({
      where: {
        email: normalizedEmail,
        role: 'ADMIN',
      },
      include: {
        adminUser: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Admin user record not found.' },
        { status: 404 }
      );
    }

    // Sign JWT token
    const token = await signAuthToken({
      userId: user.id,
      phone: user.phone,
      email: user.email || undefined,
      role: 'ADMIN',
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        adminId: user.adminUser?.id || null,
        action: 'ADMIN_LOGIN_SUCCESS',
        targetType: 'SESSION',
        targetId: user.id,
        newState: JSON.stringify({ email: normalizedEmail, timestamp: new Date().toISOString() }),
        ipAddress: clientIp,
        userAgent: req.headers.get('user-agent') || 'Browser',
      },
    });

    const response = NextResponse.json({
      success: true,
      message: 'Admin authentication successful',
      user: {
        id: user.id,
        email: user.email,
        phone: user.phone,
        role: user.role,
        permissions: user.adminUser?.permissions || 'ALL',
      },
    });

    setAuthCookie(response, token);
    return response;
  } catch (err: any) {
    console.error('Admin OTP verification error:', err);
    return NextResponse.json(
      { success: false, error: 'OTP verification failed: ' + err.message },
      { status: 500 }
    );
  }
}
