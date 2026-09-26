import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/db';
import { verifyPassword, signAuthToken, setAuthCookie } from '@/lib/auth';
import { checkRateLimit } from '@/lib/rate-limiter';
import { getUserPermissions } from '@/lib/rbac';

const staffLoginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = staffLoginSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.errors[0].message },
        { status: 400 }
      );
    }

    const { email, password } = parsed.data;
    const normalizedEmail = email.toLowerCase().trim();

    // Rate Limiter: 5 attempts per 15 mins per IP/email
    const clientIp = req.headers.get('x-forwarded-for') || '127.0.0.1';
    const rateKey = `staff_login:${clientIp}:${normalizedEmail}`;
    const rateCheck = checkRateLimit(rateKey, 5, 900);

    if (!rateCheck.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: `Too many failed login attempts. Please try again in ${rateCheck.retryAfterSeconds} seconds.`,
        },
        { status: 429 }
      );
    }

    // Find User with staff assignment
    const user = await prisma.user.findFirst({
      where: {
        email: normalizedEmail,
      },
      include: {
        staffAssignment: {
          include: {
            role: true,
          },
        },
        adminUser: true,
      },
    });

    if (!user || !user.passwordHash) {
      return NextResponse.json(
        { success: false, error: 'Invalid email or password.' },
        { status: 401 }
      );
    }

    if (user.status === 'SUSPENDED' || user.status === 'BLOCKED') {
      return NextResponse.json(
        { success: false, error: 'Your staff account has been suspended or disabled.' },
        { status: 403 }
      );
    }

    // Verify Password
    const passwordValid = await verifyPassword(password, user.passwordHash);
    if (!passwordValid) {
      return NextResponse.json(
        { success: false, error: 'Invalid email or password.' },
        { status: 401 }
      );
    }

    // Ensure staff assignment is active (or super admin)
    if (!user.adminUser && (!user.staffAssignment || user.staffAssignment.status !== 'ACTIVE')) {
      return NextResponse.json(
        { success: false, error: 'Your staff portal access has been disabled by an administrator.' },
        { status: 403 }
      );
    }

    // Fetch user permissions
    const permData = await getUserPermissions(user.id);

    if (permData.isDisabled) {
      return NextResponse.json(
        { success: false, error: 'Your staff role has been disabled.' },
        { status: 403 }
      );
    }

    // Sign JWT token
    const token = await signAuthToken({
      userId: user.id,
      phone: user.phone,
      email: user.email || undefined,
      role: 'ADMIN', // Or STAFF, using ADMIN level token for admin panel navigation
    });

    // Update lastLoginAt if staff assignment exists
    if (user.staffAssignment) {
      await prisma.staffAssignment.update({
        where: { id: user.staffAssignment.id },
        data: { lastLoginAt: new Date() },
      });
    }

    // Audit Log
    await prisma.auditLog.create({
      data: {
        adminId: user.adminUser?.id || null,
        action: 'STAFF_LOGIN_SUCCESS',
        targetType: 'SESSION',
        targetId: user.id,
        newState: JSON.stringify({ email: normalizedEmail, roleName: permData.roleName }),
        ipAddress: clientIp,
        userAgent: req.headers.get('user-agent') || 'Browser',
      },
    });

    const response = NextResponse.json({
      success: true,
      message: 'Staff login successful',
      user: {
        id: user.id,
        email: user.email,
        roleName: permData.roleName,
        isSuperAdmin: permData.isSuperAdmin,
        permissions: permData.permissions,
      },
    });

    setAuthCookie(response, token);
    return response;
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
