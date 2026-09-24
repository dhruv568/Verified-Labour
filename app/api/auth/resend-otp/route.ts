import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { checkRateLimit } from '@/lib/rate-limiter';
import { sendEmailOtp } from '@/services/resend-service';
import activeOtps from '@/lib/otp-store';

const resendSchema = z.object({
  email: z.string().email().optional(),
  phone: z.string().optional(),
}).refine(data => data.email || data.phone, {
  message: 'Either email or phone is required to resend OTP',
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = resendSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.errors[0].message },
        { status: 400 }
      );
    }

    const { email, phone } = parsed.data;
    const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';

    if (email) {
      const normalizedEmail = email.toLowerCase().trim();
      const rateLimit = checkRateLimit(`resend_email_${normalizedEmail}_${ip}`, 5, 600);
      if (!rateLimit.allowed) {
        return NextResponse.json(
          {
            success: false,
            error: `Too many resend requests. Please wait ${rateLimit.retryAfterSeconds} seconds before requesting a new code.`,
          },
          { status: 429 }
        );
      }

      // Invalidate existing OTP explicitly
      activeOtps.delete(normalizedEmail);

      // Generate new OTP and dispatch via Resend
      const result = await sendEmailOtp({ email: normalizedEmail, isResend: true });

      return NextResponse.json({
        success: true,
        message: `A new verification code has been sent to ${normalizedEmail}`,
        expiresInSeconds: result.expiresInSeconds,
        email: normalizedEmail,
        ...(process.env.NODE_ENV !== 'production' && { devOtp: result.otp }),
      });
    }

    if (phone) {
      let normalizedPhone = phone.replace(/\s+/g, '');
      if (!normalizedPhone.startsWith('+91')) {
        normalizedPhone = `+91${normalizedPhone.replace(/^0+/, '')}`;
      }

      const rateLimit = checkRateLimit(`resend_phone_${normalizedPhone}_${ip}`, 5, 600);
      if (!rateLimit.allowed) {
        return NextResponse.json(
          {
            success: false,
            error: `Too many resend requests. Please wait ${rateLimit.retryAfterSeconds} seconds before requesting a new code.`,
          },
          { status: 429 }
        );
      }

      // Invalidate existing phone OTP
      activeOtps.delete(normalizedPhone);

      const otp = process.env.NODE_ENV === 'production'
        ? Math.floor(100000 + Math.random() * 900000).toString()
        : '123456';
      const expiresAt = Date.now() + 5 * 60 * 1000;
      activeOtps.set(normalizedPhone, { otp, expiresAt, attempts: 0 });

      return NextResponse.json({
        success: true,
        message: `A new OTP has been sent to ${normalizedPhone}`,
        expiresInSeconds: 300,
        phone: normalizedPhone,
      });
    }

    return NextResponse.json({ success: false, error: 'Invalid payload' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: 'Failed to resend OTP: ' + err.message },
      { status: 500 }
    );
  }
}
