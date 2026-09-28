import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/db';
import { checkRateLimit } from '@/lib/rate-limiter';
import { sendEmailOtp } from '@/services/resend-service';
import activeOtps from '@/lib/otp-store';

const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

const changeEmailSchema = z.object({
  oldEmail: z
    .string({ required_error: 'Current email address is required' })
    .trim()
    .toLowerCase()
    .regex(emailRegex, 'Invalid email format'),
  newEmail: z
    .string({ required_error: 'New email address is required' })
    .trim()
    .toLowerCase()
    .regex(emailRegex, 'Please enter a valid email address (e.g. name@example.com)'),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = changeEmailSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.errors[0]?.message || 'Invalid email details' },
        { status: 400 }
      );
    }

    const { oldEmail, newEmail } = parsed.data;
    const normalizedOldEmail = oldEmail.toLowerCase().trim();
    const normalizedNewEmail = newEmail.toLowerCase().trim();

    if (normalizedOldEmail === normalizedNewEmail) {
      return NextResponse.json(
        { success: false, error: 'New email address must be different from current email address.' },
        { status: 400 }
      );
    }

    const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';

    // Rate limiting: max 5 email change attempts per 10 minutes per IP
    const rateLimit = checkRateLimit(`change_email_${ip}`, 5, 600);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: `Too many email change requests. Please wait ${rateLimit.retryAfterSeconds} seconds before trying again.`,
        },
        { status: 429 }
      );
    }

    // Security Rule 1: Invalidate previous OTP immediately so old OTP cannot verify new email
    activeOtps.delete(normalizedOldEmail);

    // Find pending user with old email (if created during registration)
    const pendingUser = await prisma.user.findFirst({
      where: { email: normalizedOldEmail },
      include: {
        customerProfile: true,
        workerProfile: true,
        businessProfile: true,
      },
    });

    // Security Rule 2: Check if newEmail is already registered by another user
    const existingUserWithNewEmail = await prisma.user.findFirst({
      where: { email: normalizedNewEmail },
    });

    if (existingUserWithNewEmail) {
      if (!pendingUser || existingUserWithNewEmail.id !== pendingUser.id) {
        return NextResponse.json(
          {
            success: false,
            error: 'An account with this email address already exists. Please use a different email address or log in.',
          },
          { status: 409 }
        );
      }
    }

    let userName: string | undefined = undefined;

    // Security Rule 3: Do NOT create duplicate user accounts; update existing pending user in DB
    if (pendingUser) {
      userName =
        pendingUser.customerProfile?.fullName ||
        pendingUser.workerProfile?.fullName ||
        pendingUser.businessProfile?.companyName;

      await prisma.user.update({
        where: { id: pendingUser.id },
        data: { email: normalizedNewEmail },
      });

      if (pendingUser.customerProfile) {
        await prisma.customerProfile.update({
          where: { userId: pendingUser.id },
          data: { email: normalizedNewEmail },
        });
      }

      if (pendingUser.businessProfile) {
        await prisma.businessProfile.update({
          where: { userId: pendingUser.id },
          data: { contactEmail: normalizedNewEmail },
        });
      }
    }

    // Security Rule 4: Send NEW OTP to the corrected email & reset OTP cooldown
    const otpResult = await sendEmailOtp({ email: normalizedNewEmail, name: userName, isResend: false });

    if (!otpResult.success) {
      return NextResponse.json(
        { success: false, error: otpResult.error || 'Failed to send verification code to the new email. Please try again.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `A new verification code has been sent to ${normalizedNewEmail}`,
      email: normalizedNewEmail,
      expiresInSeconds: otpResult.expiresInSeconds,
      ...(process.env.NODE_ENV !== 'production' && { devOtp: otpResult.otp }),
    });
  } catch (err: any) {
    console.error('Change email error:', err);
    return NextResponse.json(
      { success: false, error: 'Failed to update email address: ' + err.message },
      { status: 500 }
    );
  }
}
