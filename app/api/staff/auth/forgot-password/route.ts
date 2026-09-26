import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/db';
import { generateSecureToken, hashToken } from '@/lib/tokens';
import { sendStaffPasswordResetEmail } from '@/services/resend-service';
import { checkRateLimit } from '@/lib/rate-limiter';

const forgotPassSchema = z.object({
  email: z.string().email('Invalid email address'),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = forgotPassSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.errors[0].message },
        { status: 400 }
      );
    }

    const { email } = parsed.data;
    const normalizedEmail = email.toLowerCase().trim();

    // Rate Limiter
    const clientIp = req.headers.get('x-forwarded-for') || '127.0.0.1';
    const rateKey = `staff_forgot_pass:${clientIp}:${normalizedEmail}`;
    const rateCheck = checkRateLimit(rateKey, 3, 900);

    if (!rateCheck.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: `Too many password reset requests. Please try again in ${rateCheck.retryAfterSeconds} seconds.`,
        },
        { status: 429 }
      );
    }

    // Check if staff user exists
    const user = await prisma.user.findFirst({
      where: {
        email: normalizedEmail,
      },
      include: {
        staffAssignment: true,
        adminUser: true,
      },
    });

    // Always respond with success to prevent user enumeration
    if (user && (user.staffAssignment || user.adminUser)) {
      const rawToken = generateSecureToken(32);
      const tokenHash = hashToken(rawToken);
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      await prisma.passwordResetToken.create({
        data: {
          email: normalizedEmail,
          tokenHash,
          expiresAt,
        },
      });

      await sendStaffPasswordResetEmail({
        email: normalizedEmail,
        name: user.email?.split('@')[0] || 'Staff Member',
        resetToken: rawToken,
      });
    }

    return NextResponse.json({
      success: true,
      message: 'If a staff account exists for this email, password reset instructions have been sent.',
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
