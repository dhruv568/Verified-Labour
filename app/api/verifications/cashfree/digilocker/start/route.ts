import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/db';
import { getSessionUser } from '@/lib/auth';
import cashfreeService from '@/services/cashfree';
import { checkRateLimit } from '@/lib/rate-limiter';

export const dynamic = 'force-dynamic';

const createDigiLockerUrlSchema = z.object({
  workerId: z.string().optional(),
  redirectUrl: z.string().url('redirectUrl must be a valid URL starting with https').optional(),
  userFlow: z.enum(['signup', 'signin']).optional(),
});

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
    const parsed = createDigiLockerUrlSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.errors[0]?.message || 'Invalid request parameters' },
        { status: 400 }
      );
    }

    const targetWorkerId = parsed.data.workerId || sessionUser.workerProfile?.id;

    if (!targetWorkerId) {
      return NextResponse.json(
        { success: false, error: 'Worker profile not found for the current user' },
        { status: 400 }
      );
    }

    // Authorization check: user can only create URL for their own profile unless ADMIN
    if (sessionUser.role !== 'ADMIN' && sessionUser.workerProfile?.id !== targetWorkerId) {
      return NextResponse.json(
        { success: false, error: 'Forbidden: You cannot initiate verification for another worker' },
        { status: 403 }
      );
    }

    const worker = await prisma.workerProfile.findUnique({
      where: { id: targetWorkerId },
    });

    if (!worker) {
      return NextResponse.json(
        { success: false, error: 'Worker profile not found' },
        { status: 404 }
      );
    }

    // Rate limiting: max 5 DigiLocker URL requests per 10 minutes per worker/IP
    const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
    const rateLimit = checkRateLimit(`digilocker_url_${targetWorkerId}_${ip}`, 5, 600);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: `Too many requests. Please wait ${rateLimit.retryAfterSeconds} seconds before requesting a new URL.`,
        },
        { status: 429 }
      );
    }

    // Default redirect URL based on https://verifiedlabour.com/
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://verifiedlabour.com';
    const defaultRedirectUrl = `${baseUrl.replace(/\/$/, '')}/worker/onboarding`;
    const finalRedirectUrl = parsed.data.redirectUrl || defaultRedirectUrl;

    const result = await cashfreeService.createDigiLockerUrl({
      workerId: targetWorkerId,
      redirectUrl: finalRedirectUrl,
      userFlow: parsed.data.userFlow || 'signup',
      documentsRequested: ['AADHAAR'],
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

    // Persist verification request record server-side for status tracking
    await prisma.verification.create({
      data: {
        workerId: targetWorkerId,
        type: 'DIGILOCKER',
        provider: 'CASHFREE',
        providerReference: result.verificationId,
        status: 'PENDING',
        metadata: JSON.stringify({
          referenceId: result.referenceId,
          url: result.url,
          redirectUrl: result.redirectUrl,
          userFlow: result.userFlow,
        }),
      },
    });

    return NextResponse.json({
      success: true,
      verificationId: result.verificationId,
      referenceId: result.referenceId,
      url: result.url,
      status: result.status,
      redirectUrl: result.redirectUrl,
      userFlow: result.userFlow,
      message: result.message,
    });
  } catch (err: any) {
    console.error('Error in DigiLocker start route:', err);
    return NextResponse.json(
      { success: false, error: 'Failed to create DigiLocker URL: ' + err.message },
      { status: 500 }
    );
  }
}
