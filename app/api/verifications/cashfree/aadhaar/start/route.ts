import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/db';
import { getSessionUser } from '@/lib/auth';
import cashfreeService from '@/services/cashfree';

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
        { success: false, error: parsed.error.errors[0].message },
        { status: 400 }
      );
    }

    const { workerId, aadhaarNumber, consent } = parsed.data;

    // Verify permission: session user must own workerId or be admin
    if (sessionUser && sessionUser.role !== 'ADMIN' && sessionUser.workerProfile?.id !== workerId) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const worker = await prisma.workerProfile.findUnique({ where: { id: workerId } });
    if (!worker) {
      return NextResponse.json({ success: false, error: 'Worker profile not found' }, { status: 404 });
    }

    // Call Cashfree Secure ID service
    const result = await cashfreeService.startAadhaarVerification({
      workerId,
      aadhaarNumber,
      consent,
    });

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.message },
        { status: 400 }
      );
    }

    // Upsert AadhaarVerification record
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
      refId: result.refId,
      message: result.message,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: 'Failed to initiate Aadhaar verification: ' + err.message },
      { status: 500 }
    );
  }
}
