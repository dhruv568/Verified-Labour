import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/db';
import { verifyPassword, signAuthToken, setAuthCookie } from '@/lib/auth';
import { checkRateLimit } from '@/lib/rate-limiter';

const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

const loginSchema = z.object({
  email: z.string().optional(),
  identifier: z.string().optional(),
  password: z.string().min(1, 'Password is required'),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = loginSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.errors[0]?.message || 'Invalid login details' },
        { status: 400 }
      );
    }

    const rawInput = (parsed.data.email || parsed.data.identifier || '').trim();
    const { password } = parsed.data;

    if (!rawInput) {
      return NextResponse.json(
        { success: false, error: 'Email address is required' },
        { status: 400 }
      );
    }

    // Check if user entered a phone number instead of email
    const isDigitsOnly = /^(?:\+91|91|0)?[6-9]\d{9}$/.test(rawInput.replace(/[\s\-()]/g, ''));
    if (isDigitsOnly && !rawInput.includes('@')) {
      return NextResponse.json(
        {
          success: false,
          error: 'Phone number cannot be used as a login ID. Please log in with your registered email address and password.',
        },
        { status: 400 }
      );
    }

    // Validate email format
    if (!emailRegex.test(rawInput)) {
      return NextResponse.json(
        { success: false, error: 'Please enter a valid email address (e.g. name@example.com)' },
        { status: 400 }
      );
    }

    const normalizedEmail = rawInput.toLowerCase();
    const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';

    // Rate limit: max 6 attempts per 5 minutes per email/IP
    const rateLimit = checkRateLimit(`login_${normalizedEmail}_${ip}`, 6, 300);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: `Too many login attempts. Please wait ${rateLimit.retryAfterSeconds} seconds before trying again.`,
        },
        { status: 429 }
      );
    }

    // Look up user by email
    const user = await prisma.user.findFirst({
      where: { email: normalizedEmail },
      include: {
        customerProfile: { include: { addresses: true } },
        workerProfile: {
          include: {
            primaryCategory: true,
            aadhaarVerif: true,
            bankVerif: true,
            skills: { include: { category: true } },
          },
        },
        businessProfile: true,
        adminUser: true,
      },
    });

    if (!user || !user.passwordHash) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid email or password. Please verify your credentials.',
        },
        { status: 401 }
      );
    }

    const isMatch = await verifyPassword(password, user.passwordHash);
    if (!isMatch) {
      return NextResponse.json(
        { success: false, error: 'Incorrect password. Please try again.' },
        { status: 401 }
      );
    }

    if (user.status === 'SUSPENDED') {
      return NextResponse.json(
        { success: false, error: 'Your account has been suspended. Please contact platform support.' },
        { status: 403 }
      );
    }

    const token = await signAuthToken({
      userId: user.id,
      phone: user.phone,
      email: user.email || undefined,
      role: user.role as any,
    });

    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        phone: user.phone,
        email: user.email,
        role: user.role,
        isPhoneVerified: user.isPhoneVerified,
        customerProfile: user.customerProfile,
        workerProfile: user.workerProfile,
        businessProfile: user.businessProfile,
        adminUser: user.adminUser,
      },
      message: 'Login successful',
    });

    setAuthCookie(response, token);
    return response;
  } catch (err: any) {
    console.error('Login error:', err);
    return NextResponse.json(
      { success: false, error: 'Login failed due to a server error. Please try again.' },
      { status: 500 }
    );
  }
}
