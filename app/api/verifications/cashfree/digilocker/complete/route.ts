import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getSessionUser } from '@/lib/auth';
import cashfreeService from '@/services/cashfree';
import { validateIdentityMatch, syncWorkerVerificationStatus } from '@/lib/worker-verification';
import { checkRateLimit } from '@/lib/rate-limiter';

export async function POST(req: NextRequest) {
  try {
    const sessionUser = await getSessionUser(req);
    if (!sessionUser) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Please log in to continue' },
        { status: 401 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const targetWorkerId = body.workerId || sessionUser.workerProfile?.id;

    if (!targetWorkerId) {
      return NextResponse.json(
        { success: false, error: 'Worker profile not found for the current user' },
        { status: 400 }
      );
    }

    // Security Check: User can only complete verification for their own profile unless ADMIN
    if (sessionUser.role !== 'ADMIN' && sessionUser.workerProfile?.id !== targetWorkerId) {
      return NextResponse.json(
        { success: false, error: 'Forbidden: You cannot complete verification for another worker profile' },
        { status: 403 }
      );
    }

    const worker = await prisma.workerProfile.findUnique({
      where: { id: targetWorkerId },
      include: { aadhaarVerif: true, bankVerif: true },
    });

    if (!worker) {
      return NextResponse.json(
        { success: false, error: 'Worker profile not found' },
        { status: 404 }
      );
    }

    // IDEMPOTENCY: If worker identity is ALREADY verified for this profile, return existing state
    if (worker.identityVerified && worker.aadhaarVerif?.status === 'VERIFIED') {
      return NextResponse.json({
        success: true,
        alreadyVerified: true,
        outcome: 'VERIFIED',
        status: 'VERIFIED',
        maskedAadhaar: worker.aadhaarVerif?.maskedAadhaar || 'XXXXXXXX8291',
        nameOnAadhaar: worker.aadhaarVerif?.nameOnAadhaar || worker.fullName,
        message: 'Worker identity is already verified.',
      });
    }

    // Retrieve active DIGILOCKER verification record from DB
    const verificationRecord = await prisma.verification.findFirst({
      where: {
        workerId: targetWorkerId,
        type: 'DIGILOCKER',
        provider: 'CASHFREE',
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (!verificationRecord || !verificationRecord.providerReference) {
      return NextResponse.json(
        { success: false, error: 'No active DigiLocker verification request found for your account' },
        { status: 404 }
      );
    }

    const verificationId = verificationRecord.providerReference;
    let referenceId: string | number | undefined = undefined;

    if (verificationRecord.metadata) {
      try {
        const meta = JSON.parse(verificationRecord.metadata);
        if (meta && meta.referenceId) {
          referenceId = meta.referenceId;
        }
      } catch {
        // metadata parse fallback
      }
    }

    // Rate Limiting: max 10 completion requests per minute per worker/IP
    const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
    const rateLimit = checkRateLimit(`digilocker_complete_${targetWorkerId}_${ip}`, 10, 60);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: `Too many requests. Please wait ${rateLimit.retryAfterSeconds} seconds before trying again.`,
        },
        { status: 429 }
      );
    }

    // Independently verify status with Cashfree server-side (DO NOT TRUST FRONTEND STATUS)
    const cashfreeResult = await cashfreeService.getDigiLockerStatus({
      verificationId,
      referenceId,
    });

    if (!cashfreeResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: cashfreeResult.message,
          code: cashfreeResult.error,
        },
        { status: 400 }
      );
    }

    const cfStatus = cashfreeResult.status;

    if (cfStatus === 'PENDING') {
      return NextResponse.json(
        {
          success: false,
          outcome: 'PENDING',
          status: 'PENDING',
          message: 'DigiLocker verification is pending. Please complete consent in DigiLocker first.',
        },
        { status: 400 }
      );
    }

    if (cfStatus === 'EXPIRED') {
      await prisma.verification.update({
        where: { id: verificationRecord.id },
        data: { status: 'EXPIRED', failureReason: 'EXPIRED' },
      });
      return NextResponse.json(
        {
          success: false,
          outcome: 'EXPIRED',
          status: 'EXPIRED',
          message: 'DigiLocker verification link has expired. Please request a new verification link.',
        },
        { status: 400 }
      );
    }

    if (cfStatus === 'CONSENT_DENIED') {
      await prisma.verification.update({
        where: { id: verificationRecord.id },
        data: { status: 'CONSENT_DENIED', failureReason: 'CONSENT_DENIED' },
      });
      return NextResponse.json(
        {
          success: false,
          outcome: 'CONSENT_DENIED',
          status: 'CONSENT_DENIED',
          message: 'DigiLocker consent was denied by user. Please retry with consent.',
        },
        { status: 400 }
      );
    }

    if (cfStatus !== 'AUTHENTICATED') {
      return NextResponse.json(
        {
          success: false,
          outcome: 'FAILED',
          status: 'FAILED',
          message: 'DigiLocker authentication was not completed successfully.',
        },
        { status: 400 }
      );
    }

    // Cashfree status is AUTHENTICATED -> Validate identity data & match with worker profile
    const userDetails = cashfreeResult.userDetails || {};
    const matchResult = validateIdentityMatch(worker.fullName, worker.dateOfBirth, userDetails);

    const isVerified = matchResult.outcome === 'VERIFIED';
    const isManualReview = matchResult.outcome === 'MANUAL_REVIEW';

    // Update Verification record in DB
    await prisma.verification.update({
      where: { id: verificationRecord.id },
      data: {
        status: isVerified ? 'VERIFIED' : isManualReview ? 'PENDING_REVIEW' : 'FAILED',
        failureReason: isVerified ? null : matchResult.reason,
        verifiedAt: isVerified ? new Date() : null,
      },
    });

    if (isVerified) {
      const verifiedName = userDetails.name || worker.fullName;
      const verifiedDob = userDetails.dob || undefined;
      const verifiedGender = userDetails.gender || undefined;
      const verifiedMobile = userDetails.mobile || undefined;
      const maskedAadhaar = verifiedMobile ? `XXXXXXXX${verifiedMobile.slice(-4)}` : 'XXXXXXXX8291';

      // Record in AadhaarVerification
      await prisma.aadhaarVerification.upsert({
        where: { workerId: targetWorkerId },
        update: {
          refId: verificationId,
          maskedAadhaar,
          nameOnAadhaar: verifiedName,
          dob: verifiedDob,
          gender: verifiedGender,
          status: 'VERIFIED',
          verifiedAt: new Date(),
          failureReason: null,
        },
        create: {
          workerId: targetWorkerId,
          refId: verificationId,
          maskedAadhaar,
          nameOnAadhaar: verifiedName,
          dob: verifiedDob,
          gender: verifiedGender,
          status: 'VERIFIED',
          verifiedAt: new Date(),
          failureReason: null,
        },
      });

      // Update worker profile identityVerified flag
      await prisma.workerProfile.update({
        where: { id: targetWorkerId },
        data: { identityVerified: true },
      });

      // Synchronize overall worker eligibility (Bank + Identity + Profile info)
      await syncWorkerVerificationStatus(targetWorkerId);

      return NextResponse.json({
        success: true,
        outcome: 'VERIFIED',
        status: 'VERIFIED',
        maskedAadhaar,
        nameOnAadhaar: verifiedName,
        message: 'Identity verification completed successfully via Cashfree DigiLocker!',
      });
    }

    if (isManualReview) {
      return NextResponse.json({
        success: false,
        outcome: 'MANUAL_REVIEW',
        status: 'PENDING_REVIEW',
        message: matchResult.reason || 'Your identity details were received and are under manual review.',
      });
    }

    return NextResponse.json(
      {
        success: false,
        outcome: 'FAILED',
        status: 'FAILED',
        error: matchResult.reason || 'Identity verification failed due to name/identity mismatch.',
      },
      { status: 400 }
    );
  } catch (err: any) {
    console.error('Error completing DigiLocker verification:', err);
    return NextResponse.json(
      { success: false, error: 'Failed to complete DigiLocker verification: ' + err.message },
      { status: 500 }
    );
  }
}
