import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/db';
import { getSessionUser } from '@/lib/auth';
import cashfreeService from '@/services/cashfree';
import { syncWorkerVerificationStatus } from '@/lib/worker-verification';

const verifyAadhaarSchema = z.object({
  workerId: z.string(),
  refId: z.string().min(1, 'Reference ID is required'),
  otp: z.string().length(6, 'OTP must be exactly 6 digits'),
});

export async function POST(req: NextRequest) {
  try {
    const sessionUser = await getSessionUser(req);
    const body = await req.json();
    const parsed = verifyAadhaarSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.errors[0]?.message || 'Invalid verification parameters' },
        { status: 400 }
      );
    }

    const { workerId, refId, otp } = parsed.data;

    // Authorization check
    if (sessionUser && sessionUser.role !== 'ADMIN' && sessionUser.workerProfile?.id !== workerId) {
      return NextResponse.json({ success: false, error: 'Forbidden: You cannot verify another worker\'s profile' }, { status: 403 });
    }

    const worker = await prisma.workerProfile.findUnique({
      where: { id: workerId },
      include: { aadhaarVerif: true, bankVerif: true },
    });

    if (!worker) {
      return NextResponse.json({ success: false, error: 'Worker profile not found' }, { status: 404 });
    }

    // 1. PREVENT DUPLICATE VERIFICATION: If worker is already verified, return verified state immediately
    if (worker.identityVerified || worker.aadhaarVerif?.status === 'VERIFIED') {
      return NextResponse.json({
        success: true,
        alreadyVerified: true,
        status: 'VERIFIED',
        maskedAadhaar: worker.aadhaarVerif?.maskedAadhaar || 'XXXXXXXX8291',
        nameOnAadhaar: worker.aadhaarVerif?.nameOnAadhaar || worker.fullName,
        message: 'Aadhaar identity is already verified for this worker profile.',
      });
    }

    // 2. Call Cashfree Secure ID verification API
    const result = await cashfreeService.submitAadhaarOtp({
      refId,
      otp,
      workerFullName: worker.fullName,
    });

    if (!result.success) {
      // Record failure state in verification record
      await prisma.aadhaarVerification.upsert({
        where: { workerId },
        update: {
          status: 'FAILED',
          failureReason: result.failureReason || result.message,
        },
        create: {
          workerId,
          refId,
          status: 'FAILED',
          failureReason: result.failureReason || result.message,
        },
      });

      return NextResponse.json(
        {
          success: false,
          status: 'FAILED',
          error: result.message,
          failureReason: result.failureReason || 'OTP_VERIFICATION_FAILED',
        },
        { status: 400 }
      );
    }

    // 3. SUCCESS: Store only required masked details and reference status securely
    await prisma.aadhaarVerification.upsert({
      where: { workerId },
      update: {
        status: 'VERIFIED',
        maskedAadhaar: result.maskedAadhaar || 'XXXXXXXX8291',
        nameOnAadhaar: result.nameOnAadhaar || worker.fullName,
        dob: result.dob,
        gender: result.gender,
        verifiedAt: new Date(),
        failureReason: null,
      },
      create: {
        workerId,
        refId,
        status: 'VERIFIED',
        maskedAadhaar: result.maskedAadhaar || 'XXXXXXXX8291',
        nameOnAadhaar: result.nameOnAadhaar || worker.fullName,
        dob: result.dob,
        gender: result.gender,
        verifiedAt: new Date(),
        failureReason: null,
      },
    });

    // 4. Centralized evaluation: Aadhaar + Bank + Profile = VERIFIED status update
    await syncWorkerVerificationStatus(workerId);

    return NextResponse.json({
      success: true,
      status: 'VERIFIED',
      message: result.message,
      maskedAadhaar: result.maskedAadhaar || 'XXXXXXXX8291',
      nameOnAadhaar: result.nameOnAadhaar || worker.fullName,
    });
  } catch (err: any) {
    console.error('Error verifying Aadhaar OTP:', err);
    return NextResponse.json(
      { success: false, error: 'Failed to verify Aadhaar OTP: ' + err.message },
      { status: 500 }
    );
  }
}
