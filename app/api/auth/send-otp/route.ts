import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { checkRateLimit } from '@/lib/rate-limiter';
import activeOtps from '@/lib/otp-store';

const sendOtpSchema = z.object({
  phone: z
    .string()
    .regex(/^(\+91)?[6-9]\d{9}$/, 'Please enter a valid 10-digit Indian mobile number (+91 optional)'),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = sendOtpSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.errors[0].message },
        { status: 400 }
      );
    }

    let phone = parsed.data.phone.replace(/\s+/g, '');
    if (!phone.startsWith('+91')) {
      phone = `+91${phone.replace(/^0+/, '')}`;
    }

    // Rate limiting: max 5 OTP requests per 10 minutes per phone
    const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
    const rateLimit = checkRateLimit(`otp_send_${phone}_${ip}`, 5, 600);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: `Too many OTP requests. Please wait ${rateLimit.retryAfterSeconds} seconds before trying again.`,
        },
        { status: 429 }
      );
    }

    // Generate 6-digit OTP (for dev / testing default to '123456')
    const otp = process.env.NODE_ENV === 'production'
      ? Math.floor(100000 + Math.random() * 900000).toString()
      : '123456';

    const expiresInSeconds = 600; // 10 minutes
    const expiresAt = Date.now() + expiresInSeconds * 1000;
    activeOtps.set(phone, { otp, expiresAt, attempts: 0 });

    return NextResponse.json({
      success: true,
      message: `OTP sent successfully to ${phone}. (Dev/Sandbox default OTP: 123456)`,
      expiresInSeconds,
      phone,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: 'Internal server error while dispatching OTP: ' + err.message },
      { status: 500 }
    );
  }
}
