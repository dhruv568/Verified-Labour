import { NextRequest, NextResponse } from 'next/server';
import activeOtps, { tokenToEmail } from '@/lib/otp-store';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get('token')?.trim();
    const emailParam = searchParams.get('email')?.trim();

    let email = emailParam ? emailParam.toLowerCase() : undefined;

    if (token) {
      const mappedEmail = tokenToEmail.get(token);
      if (mappedEmail) {
        email = mappedEmail;
      }
    }

    if (!email) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid or missing verification link. Please request a new verification code.',
        },
        { status: 400 }
      );
    }

    const stored = activeOtps.get(email);
    if (!stored) {
      return NextResponse.json(
        {
          success: false,
          error: 'Verification code has expired or is invalid. Please request a new code.',
        },
        { status: 400 }
      );
    }

    if (Date.now() > stored.expiresAt) {
      if (stored.token) tokenToEmail.delete(stored.token);
      activeOtps.delete(email);
      return NextResponse.json(
        {
          success: false,
          error: 'Verification code has expired. Please request a new code.',
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      email,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: 'Internal server error verifying token: ' + err.message },
      { status: 500 }
    );
  }
}
