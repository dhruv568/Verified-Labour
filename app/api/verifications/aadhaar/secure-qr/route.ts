import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSessionUser } from '@/lib/auth';
import { decodeAndVerifyAadhaarQr } from '@/lib/aadhaar/secure-qr/decoder';
import { checkRateLimit } from '@/lib/rate-limiter';

const qrPayloadSchema = z.object({
  payload: z.string().min(1, 'QR payload string is required'),
});

export async function POST(req: NextRequest) {
  try {
    // 1. Session Authentication Check
    const sessionUser = await getSessionUser(req);
    if (!sessionUser) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Authentication session required' },
        { status: 401 }
      );
    }

    // 2. Input Validation
    const body = await req.json().catch(() => ({}));
    const parsed = qrPayloadSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.errors[0]?.message || 'Invalid payload input' },
        { status: 400 }
      );
    }

    const { payload } = parsed.data;

    // 3. Rate Limiting (max 10 verification requests per 5 minutes per user)
    const userId = sessionUser.id;
    const rateLimit = checkRateLimit(`qr_decode_${userId}`, 10, 300);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: `Too many verification attempts. Please retry in ${rateLimit.retryAfterSeconds} seconds.`,
        },
        { status: 429 }
      );
    }

    // 4. Server-Side Cryptographic Signature Verification & Decoding
    const result = decodeAndVerifyAadhaarQr(payload);

    if (!result.signatureValid || !result.verified || !result.data) {
      return NextResponse.json({
        success: true,
        verified: false,
        signatureValid: false,
      });
    }

    // 5. Sanitized Response (No sensitive internal cryptographic data or full Aadhaar numbers)
    return NextResponse.json({
      success: true,
      verified: true,
      signatureValid: true,
      data: {
        name: result.data.name,
        dob: result.data.dob,
        gender: result.data.gender,
        maskedAadhaar: result.data.maskedAadhaar,
      },
    });
  } catch {
    // Return sanitized response on any internal exception
    return NextResponse.json({
      success: true,
      verified: false,
      signatureValid: false,
    });
  }
}
