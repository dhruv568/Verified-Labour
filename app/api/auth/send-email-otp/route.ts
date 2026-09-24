import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { checkRateLimit } from '@/lib/rate-limiter';
import { sendEmailOtp } from '@/services/resend-service';

const emailOtpSchema = z.object({
  email: z
    .string({ required_error: 'Email address is required' })
    .trim()
    .toLowerCase()
    .regex(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/, 'Please enter a valid email address'),
  name: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = emailOtpSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.errors[0].message },
        { status: 400 }
      );
    }

    const { email, name } = parsed.data;
    const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';

    // Rate limiting: max 5 OTP requests per 10 minutes per email & IP
    const rateLimit = checkRateLimit(`email_otp_${email}_${ip}`, 5, 600);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: `Too many email verification requests. Please wait ${rateLimit.retryAfterSeconds} seconds before trying again.`,
        },
        { status: 429 }
      );
    }

    const result = await sendEmailOtp({ email, name, isResend: false });

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error || 'Failed to dispatch email verification code.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Verification code sent to ${email}`,
      expiresInSeconds: result.expiresInSeconds,
      email,
      // Include sandbox dev helper data when in non-production
      ...(process.env.NODE_ENV !== 'production' && { devOtp: result.otp }),
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: 'Internal server error while sending email OTP: ' + err.message },
      { status: 500 }
    );
  }
}
