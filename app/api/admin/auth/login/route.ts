import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/db';
import { verifyPassword } from '@/lib/auth';
import { checkRateLimit } from '@/lib/rate-limiter';
import { sendEmailOtp } from '@/services/resend-service';
import { ensureInitialAdminUser } from '@/lib/init-admin';

const adminLoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1, 'Password is required'),
});

export async function POST(req: NextRequest) {
  try {
    // 1. Ensure initial admin exists if DB is clean
    await ensureInitialAdminUser();

    const body = await req.json();
    const parsed = adminLoginSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.errors[0].message },
        { status: 400 }
      );
    }

    const { email, password } = parsed.data;
    const normalizedEmail = email.toLowerCase().trim();

    // 2. Rate Limit: 5 failed attempts per 15 minutes (900s) per IP/email
    const clientIp = req.headers.get('x-forwarded-for') || '127.0.0.1';
    const rateKey = `admin_login:${clientIp}:${normalizedEmail}`;
    const rateCheck = checkRateLimit(rateKey, 5, 900);

    if (!rateCheck.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: `Too many login attempts. Please try again in ${rateCheck.retryAfterSeconds} seconds.`,
        },
        { status: 429 }
      );
    }

    // 3. Find User
    const user = await prisma.user.findFirst({
      where: {
        email: normalizedEmail,
        role: 'ADMIN',
      },
      include: {
        adminUser: true,
      },
    });

    if (!user || !user.passwordHash) {
      return NextResponse.json(
        { success: false, error: 'Invalid admin email or password.' },
        { status: 401 }
      );
    }

    if (user.status === 'SUSPENDED' || user.status === 'BLOCKED') {
      return NextResponse.json(
        { success: false, error: 'Your admin account has been suspended or disabled.' },
        { status: 403 }
      );
    }

    // 4. Verify password hash
    const passwordValid = await verifyPassword(password, user.passwordHash);

    if (!passwordValid) {
      return NextResponse.json(
        { success: false, error: 'Invalid admin email or password.' },
        { status: 401 }
      );
    }

    // 5. Password is valid! Require Email OTP verification on EVERY admin login
    const otpResult = await sendEmailOtp({
      email: normalizedEmail,
      name: 'Admin',
    });

    if (!otpResult.success && !otpResult.otp) {
      return NextResponse.json(
        { success: false, error: 'Failed to generate OTP email. Please try again.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      requiresOtp: true,
      email: normalizedEmail,
      message: 'Admin OTP dispatched to ' + normalizedEmail,
      // Provide devOtp in dev environment for automated testing/UI speed
      devOtp: process.env.NODE_ENV !== 'production' ? otpResult.otp : undefined,
    });
  } catch (err: any) {
    console.error('Admin login error:', err);
    return NextResponse.json(
      { success: false, error: 'Admin authentication failed: ' + err.message },
      { status: 500 }
    );
  }
}
