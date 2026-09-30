import { NextRequest, NextResponse } from 'next/server';
import { runAadhaarQrDiagnostics } from '@/lib/aadhaar/secure-qr/diagnostic';

/**
 * DEVELOPMENT-ONLY Aadhaar QR Diagnostic Endpoint
 * 
 * Accepts raw QR payload or payloadBase64 in JSON body and returns
 * structure diagnostics, compression classification, certificate audit,
 * and matched cryptographic signature strategies.
 * 
 * RESTRICTION: Non-production environments only!
 */

export async function POST(req: NextRequest) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { success: false, error: 'Diagnostic endpoint is disabled in production.' },
      { status: 403 }
    );
  }

  try {
    const body = await req.json().catch(() => ({}));
    const rawInput = body.payloadBase64 || body.payload || '';

    if (!rawInput) {
      return NextResponse.json(
        { success: false, error: 'payload or payloadBase64 string is required.' },
        { status: 400 }
      );
    }

    const report = runAadhaarQrDiagnostics(rawInput);

    return NextResponse.json({
      success: true,
      report,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: 'Diagnostic analysis failed: ' + err.message },
      { status: 500 }
    );
  }
}
