import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/db';
import { getSessionUser } from '@/lib/auth';
import cashfreeService from '@/services/cashfree';
import { checkRateLimit } from '@/lib/rate-limiter';

const startAadhaarSchema = z.object({
  workerId: z.string(),
  aadhaarNumber: z.string().regex(/^\d{12}$/, 'Aadhaar must be a 12-digit number'),
  consent: z.boolean().refine((val) => val === true, 'Consent is required for UIDAI Aadhaar verification'),
});

export async function POST(req: NextRequest) {
  try {
    const sessionUser = await getSessionUser(req);
    const body = await req.json();
    const parsed = startAadhaarSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.errors[0]?.message || 'Invalid Aadhaar details' },
        { status: 400 }
      );
    }

    const { workerId, aadhaarNumber, consent } = parsed.data;

    // Verify authorization: session user must own workerId or be platform ADMIN
    if (sessionUser && sessionUser.role !== 'ADMIN' && sessionUser.workerProfile?.id !== workerId) {
      return NextResponse.json({ success: false, error: 'Forbidden: You cannot verify another worker\'s profile' }, { status: 403 });
    }

    const worker = await prisma.workerProfile.findUnique({
      where: { id: workerId },
      include: { aadhaarVerif: true },
    });

    if (!worker) {
      return NextResponse.json({ success: false, error: 'Worker profile not found' }, { status: 404 });
    }

    // 1. PREVENT DUPLICATE VERIFICATION: If worker is already verified, do not send another OTP
    if (worker.identityVerified || worker.aadhaarVerif?.status === 'VERIFIED') {
      return NextResponse.json({
        success: true,
        alreadyVerified: true,
        status: 'VERIFIED',
        maskedAadhaar: worker.aadhaarVerif?.maskedAadhaar || 'XXXXXXXX8291',
        message: 'Aadhaar identity is already verified for this worker profile.',
      });
    }

    // 2. RATE LIMITING: max 5 OTP generation requests per 10 minutes per worker/IP
    const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
    const rateLimit = checkRateLimit(`aadhaar_otp_${workerId}_${ip}`, 5, 600);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: `Too many Aadhaar OTP requests. Please wait ${rateLimit.retryAfterSeconds} seconds before requesting a new code.`,
        },
        { status: 429 }
      );
    }

    // 3. Call Cashfree Secure ID service (Server-to-Server, secrets kept backend only)
    const result = await cashfreeService.startAadhaarVerification({
      workerId,
      aadhaarNumber,
      consent,
    });

    if (!result.success) {
      // Record failure state
      await prisma.aadhaarVerification.upsert({
        where: { workerId },
        update: {
          status: 'FAILED',
          failureReason: result.message,
        },
        create: {
          workerId,
          status: 'FAILED',
          failureReason: result.message,
        },
      });

      return NextResponse.json(
        { success: false, status: 'FAILED', error: result.message },
        { status: 400 }
      );
    }

    // 4. Store ONLY required status and reference ID securely (Full Aadhaar is NEVER stored)
    await prisma.aadhaarVerification.upsert({
      where: { workerId },
      update: {
        refId: result.refId,
        status: 'OTP_SENT',
        failureReason: null,
      },
      create: {
        workerId,
        refId: result.refId,
        status: 'OTP_SENT',
      },
    });

    return NextResponse.json({
      success: true,
      status: 'OTP_SENT',
      refId: result.refId,
      message: result.message,
    });
  } catch (err: any) {
    console.error('Error starting Aadhaar verification:', err);
    return NextResponse.json(
      { success: false, error: 'Failed to initiate Aadhaar verification: ' + err.message },
      { status: 500 }
    );
  }
}
