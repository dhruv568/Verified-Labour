import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/db';
import { verifyPassword, signAuthToken, setAuthCookie } from '@/lib/auth';

const loginSchema = z.object({
  identifier: z.string(), // phone or email
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = loginSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.errors[0].message },
        { status: 400 }
      );
    }

    const { identifier, password } = parsed.data;

    let phone = identifier;
    if (!identifier.includes('@') && !phone.startsWith('+91')) {
      phone = `+91${phone.replace(/\s+/g, '').replace(/^0+/, '')}`;
    }

    // Lookup user by phone or email
    const user = await prisma.user.findFirst({
      where: {
        OR: [{ phone }, { email: identifier }],
      },
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
          error: 'Invalid credentials. If you registered via OTP, please log in with Mobile OTP.',
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
      role: user.role as any,
    });

    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        phone: user.phone,
        email: user.email,
        role: user.role,
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
    return NextResponse.json(
      { success: false, error: 'Internal server error: ' + err.message },
      { status: 500 }
    );
  }
}
