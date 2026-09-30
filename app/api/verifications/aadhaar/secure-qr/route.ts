import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/db';
import { getSessionUser } from '@/lib/auth';
import { decodeAndVerifyAadhaarQr } from '@/lib/aadhaar/secure-qr/decoder';
import { validateIdentityMatch, syncWorkerVerificationStatus } from '@/lib/worker-verification';
import { checkRateLimit } from '@/lib/rate-limiter';

const qrPayloadSchema = z
  .object({
    payload: z.string().optional(),
    payloadBase64: z.string().optional(),
    workerId: z.string().optional(),
    testOnly: z.boolean().optional(),
  })
  .refine((data) => Boolean(data.payload || data.payloadBase64), {
    message: 'QR payload string or payloadBase64 is required',
  });

export async function POST(req: NextRequest) {
  const startTime = Date.now();
  if (process.env.NODE_ENV !== 'production') {
    console.log(`[AADHAAR_QR] Request received (${Date.now() - startTime}ms)`);
  }

  try {
    // 1. Session Authentication Check
    const sessionUser = await getSessionUser(req);
    if (!sessionUser) {
      if (process.env.NODE_ENV !== 'production') {
        console.log(`[AADHAAR_QR] Unauthorized session check failed (${Date.now() - startTime}ms)`);
      }
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Authentication session required' },
        { status: 401 }
      );
    }

    // 2. Input Validation
    const body = await req.json().catch(() => ({}));
    const parsed = qrPayloadSchema.safeParse(body);

    if (!parsed.success) {
      if (process.env.NODE_ENV !== 'production') {
        console.log(`[AADHAAR_QR] Input validation failed (${Date.now() - startTime}ms)`);
      }
      return NextResponse.json(
        { success: false, error: parsed.error.errors[0]?.message || 'Invalid payload input' },
        { status: 400 }
      );
    }

    const rawInput = (parsed.data.payloadBase64 || parsed.data.payload || '').trim();
    const testOnly = parsed.data.testOnly;
    const targetWorkerId = parsed.data.workerId || sessionUser.workerProfile?.id;

    if (process.env.NODE_ENV !== 'production') {
      console.log(`[AADHAAR_QR] Payload parsed (${Date.now() - startTime}ms)`);
    }

    // Authorization check
    if (sessionUser.role !== 'ADMIN' && sessionUser.workerProfile?.id !== targetWorkerId) {
      if (process.env.NODE_ENV !== 'production') {
        console.log(`[AADHAAR_QR] Authorization failed (${Date.now() - startTime}ms)`);
      }
      return NextResponse.json(
        { success: false, error: 'Forbidden: You cannot verify another worker\'s profile' },
        { status: 403 }
      );
    }

    // 3. Rate Limiting (max 10 verification requests per 5 minutes per user)
    const userId = sessionUser.id;
    const rateLimit = checkRateLimit(`qr_decode_${userId}`, 10, 300);
    if (!rateLimit.allowed) {
      if (process.env.NODE_ENV !== 'production') {
        console.log(`[AADHAAR_QR] Rate limit exceeded (${Date.now() - startTime}ms)`);
      }
      return NextResponse.json(
        {
          success: false,
          error: `Too many verification attempts. Please retry in ${rateLimit.retryAfterSeconds} seconds.`,
        },
        { status: 429 }
      );
    }

    // 4. If target worker exists, check for existing verification (IDEMPOTENCY)
    let worker: any = null;
    if (targetWorkerId && !testOnly) {
      worker = await prisma.workerProfile.findUnique({
        where: { id: targetWorkerId },
        include: { aadhaarVerif: true, bankVerif: true },
      });

      if (worker && (worker.identityVerified || worker.aadhaarVerif?.status === 'VERIFIED')) {
        if (process.env.NODE_ENV !== 'production') {
          console.log(`[AADHAAR_QR] Already verified idempotency match (${Date.now() - startTime}ms)`);
        }
        return NextResponse.json({
          success: true,
          alreadyVerified: true,
          verified: true,
          signatureValid: true,
          identityMatch: true,
          status: 'VERIFIED',
          maskedAadhaar: worker.aadhaarVerif?.maskedAadhaar || 'XXXXXXXX8291',
          nameOnAadhaar: worker.aadhaarVerif?.nameOnAadhaar || worker.fullName,
          message: 'Aadhaar identity is already verified for this worker profile.',
        });
      }
    }

    // 5. Server-Side Cryptographic Signature Verification & Decoding
    const result = decodeAndVerifyAadhaarQr(rawInput);
    if (process.env.NODE_ENV !== 'production') {
      console.log(
        `[AADHAAR_QR] Signature verification complete: valid=${result.signatureValid} (${Date.now() - startTime}ms)`
      );
    }

    if (!result.signatureValid || !result.verified || !result.data) {
      return NextResponse.json({
        success: true,
        verified: false,
        signatureValid: false,
        identityMatch: false,
        error: 'UIDAI digital signature verification failed or unsupported QR code.',
      });
    }

    // If running in test mode or no worker profile context, return decode result without DB updates
    if (testOnly || !worker) {
      return NextResponse.json({
        success: true,
        verified: true,
        signatureValid: true,
        identityMatch: true,
        data: {
          name: result.data.name,
          dob: result.data.dob,
          gender: result.data.gender,
          maskedAadhaar: result.data.maskedAadhaar,
        },
      });
    }

    // 6. Identity Matching: Compare extracted QR details vs registered worker profile
    const matchResult = validateIdentityMatch(worker.fullName, worker.dateOfBirth, {
      name: result.data.name,
      dob: result.data.dob,
      gender: result.data.gender,
    });

    if (process.env.NODE_ENV !== 'production') {
      console.log(
        `[AADHAAR_QR] Identity match complete: outcome=${matchResult.outcome} (${Date.now() - startTime}ms)`
      );
    }

    if (matchResult.outcome !== 'VERIFIED') {
      return NextResponse.json({
        success: true,
        verified: false,
        signatureValid: true,
        identityMatch: false,
        error: matchResult.reason || 'The details on the Aadhaar QR do not match your registered information.',
      });
    }

    // 7. Database Updates: Record verification results in AadhaarVerification & Verification
    const finalWorkerId: string = targetWorkerId!;
    const refId = result.data.referenceId || `QR_${Date.now()}`;
    const verifiedName = result.data.name || worker.fullName;
    const verifiedDob = result.data.dob || undefined;
    const verifiedGender = result.data.gender || undefined;
    const maskedAadhaar = result.data.maskedAadhaar;

    await prisma.aadhaarVerification.upsert({
      where: { workerId: finalWorkerId },
      update: {
        refId,
        maskedAadhaar,
        nameOnAadhaar: verifiedName,
        dob: verifiedDob,
        gender: verifiedGender,
        status: 'VERIFIED',
        verifiedAt: new Date(),
        failureReason: null,
      },
      create: {
        workerId: finalWorkerId,
        refId,
        maskedAadhaar,
        nameOnAadhaar: verifiedName,
        dob: verifiedDob,
        gender: verifiedGender,
        status: 'VERIFIED',
        verifiedAt: new Date(),
        failureReason: null,
      },
    });

    await prisma.verification.create({
      data: {
        workerId: finalWorkerId,
        type: 'AADHAAR_SECURE_QR',
        provider: 'UIDAI_OFFLINE',
        providerReference: refId,
        status: 'VERIFIED',
        verifiedAt: new Date(),
      },
    });

    if (process.env.NODE_ENV !== 'production') {
      console.log(`[AADHAAR_QR] Database update complete (${Date.now() - startTime}ms)`);
    }

    // 8. Synchronize overall worker eligibility (Bank + Identity + Profile completeness)
    await syncWorkerVerificationStatus(finalWorkerId);

    if (process.env.NODE_ENV !== 'production') {
      console.log(`[AADHAAR_QR] Response returned successfully (${Date.now() - startTime}ms)`);
    }

    return NextResponse.json({
      success: true,
      verified: true,
      signatureValid: true,
      identityMatch: true,
      status: 'VERIFIED',
      maskedAadhaar,
      nameOnAadhaar: verifiedName,
      message: '✓ Aadhaar identity verified successfully via UIDAI Secure QR!',
    });
  } catch (err: any) {
    console.error('Error verifying Secure QR:', err);
    return NextResponse.json(
      { success: false, error: 'Failed to verify Secure QR: ' + err.message },
      { status: 500 }
    );
  }
}
