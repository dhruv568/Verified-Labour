import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getSessionUser } from '@/lib/auth';
import cashfreeService from '@/services/cashfree';
import { checkRateLimit } from '@/lib/rate-limiter';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const sessionUser = await getSessionUser(req);
    if (!sessionUser) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Please log in to continue' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const queryVerificationId = searchParams.get('verification_id') || searchParams.get('verificationId');
    const queryWorkerId = searchParams.get('workerId');

    const targetWorkerId =
      sessionUser.role === 'ADMIN' && queryWorkerId
        ? queryWorkerId
        : sessionUser.workerProfile?.id;

    if (!targetWorkerId) {
      return NextResponse.json(
        { success: false, error: 'Worker profile not found for the current user' },
        { status: 400 }
      );
    }

    // Security Authorization Check: Logged-in worker can only access their own profile unless ADMIN
    if (sessionUser.role !== 'ADMIN' && sessionUser.workerProfile?.id !== targetWorkerId) {
      return NextResponse.json(
        { success: false, error: 'Forbidden: You cannot check verification status for another worker profile' },
        { status: 403 }
      );
    }

    // Look up server-side verification record belonging to this worker
    let verificationRecord = null;

    if (queryVerificationId) {
      verificationRecord = await prisma.verification.findFirst({
        where: {
          workerId: targetWorkerId,
          type: 'DIGILOCKER',
          provider: 'CASHFREE',
          providerReference: queryVerificationId,
        },
      });

      if (!verificationRecord) {
        return NextResponse.json(
          {
            success: false,
            error: 'Forbidden: Verification request not found or does not belong to your account',
          },
          { status: 403 }
        );
      }
    } else {
      // Find latest DigiLocker verification record for this worker
      verificationRecord = await prisma.verification.findFirst({
        where: {
          workerId: targetWorkerId,
          type: 'DIGILOCKER',
          provider: 'CASHFREE',
        },
        orderBy: {
          createdAt: 'desc',
        },
      });
    }

    if (!verificationRecord || !verificationRecord.providerReference) {
      return NextResponse.json(
        {
          success: false,
          error: 'No active DigiLocker verification request found for your account',
        },
        { status: 404 }
      );
    }

    const verificationId = verificationRecord.providerReference;
    let referenceId: string | number | undefined = undefined;

    if (verificationRecord.metadata) {
      try {
        const parsedMeta = JSON.parse(verificationRecord.metadata);
        if (parsedMeta && parsedMeta.referenceId) {
          referenceId = parsedMeta.referenceId;
        }
      } catch {
        // metadata parse fallback
      }
    }

    // Rate Limiting: max 15 status checks per minute per IP/worker
    const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
    const rateLimit = checkRateLimit(`digilocker_status_${targetWorkerId}_${ip}`, 15, 60);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: `Too many status checks. Please wait ${rateLimit.retryAfterSeconds} seconds before trying again.`,
        },
        { status: 429 }
      );
    }

    // Server-side Cashfree API Status Fetch (Credentials kept strictly server-side)
    const result = await cashfreeService.getDigiLockerStatus({
      verificationId,
      referenceId,
    });

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.message,
          code: result.error,
        },
        { status: 400 }
      );
    }

    // Persist current status update to DB Verification record
    await prisma.verification.update({
      where: { id: verificationRecord.id },
      data: {
        status: result.status,
        failureReason:
          result.status === 'EXPIRED'
            ? 'EXPIRED'
            : result.status === 'CONSENT_DENIED'
            ? 'CONSENT_DENIED'
            : null,
      },
    });

    // NOTE: STEP 2 explicitly DOES NOT mark worker as VERIFIED or set identityVerified=true.

    return NextResponse.json({
      success: true,
      status: result.status,
      verificationId: result.verificationId || verificationId,
      referenceId: result.referenceId || referenceId,
      userDetails: result.userDetails || undefined,
      message: result.message,
    });
  } catch (err: any) {
    console.error('Error fetching DigiLocker verification status:', err);
    return NextResponse.json(
      { success: false, error: 'Failed to retrieve DigiLocker verification status: ' + err.message },
      { status: 500 }
    );
  }
}
