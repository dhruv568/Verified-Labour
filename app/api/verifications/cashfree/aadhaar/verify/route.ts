import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/db';
import { getSessionUser } from '@/lib/auth';
import cashfreeService from '@/services/cashfree';
import { syncWorkerVerificationStatus } from '@/lib/worker-verification';

const verifyAadhaarSchema = z.object({
  workerId: z.string(),
  refId: z.string(),
  otp: z.string().length(6, 'OTP must be exactly 6 digits'),
});

export async function POST(req: NextRequest) {
  try {
    const sessionUser = await getSessionUser(req);
    const body = await req.json();
    const parsed = verifyAadhaarSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.errors[0].message },
        { status: 400 }
      );
    }

    const { workerId, refId, otp } = parsed.data;

    if (sessionUser && sessionUser.role !== 'ADMIN' && sessionUser.workerProfile?.id !== workerId) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const worker = await prisma.workerProfile.findUnique({
      where: { id: workerId },
      include: { bankVerif: true },
    });

    if (!worker) {
      return NextResponse.json({ success: false, error: 'Worker profile not found' }, { status: 404 });
    }

    const result = await cashfreeService.submitAadhaarOtp({
      refId,
      otp,
      workerFullName: worker.fullName,
    });

    if (!result.success) {
      // Record failure in verification table
      await prisma.aadhaarVerification.update({
        where: { workerId },
        data: {
          status: 'FAILED',
          failureReason: result.failureReason || result.message,
        },
      });

      return NextResponse.json(
        { success: false, error: result.message, failureReason: result.failureReason },
        { status: 400 }
      );
    }

    // Success: Record masked details and update worker status
    await prisma.aadhaarVerification.update({
      where: { workerId },
      data: {
        status: 'VERIFIED',
        maskedAadhaar: result.maskedAadhaar,
        nameOnAadhaar: result.nameOnAadhaar,
        dob: result.dob,
        gender: result.gender,
        verifiedAt: new Date(),
        failureReason: null,
      },
    });

    // Centralized evaluation: Aadhaar + Bank + Profile = VERIFIED
    await syncWorkerVerificationStatus(workerId);

    return NextResponse.json({
      success: true,
      message: result.message,
      maskedAadhaar: result.maskedAadhaar,
      nameOnAadhaar: result.nameOnAadhaar,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: 'Failed to verify Aadhaar OTP: ' + err.message },
      { status: 500 }
    );
  }
}
