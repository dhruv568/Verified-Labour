import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/db';
import { getSessionUser } from '@/lib/auth';
import cashfreeService, { CashfreeVerificationService } from '@/services/cashfree';
import { syncWorkerVerificationStatus } from '@/lib/worker-verification';

const verifyBankSchema = z.object({
  workerId: z.string(),
  accountHolderName: z.string().min(2, 'Please enter the full name as per bank records'),
  accountNumber: z.string().min(8, 'Account number must be at least 8 digits').max(20),
  ifsc: z.string().regex(/^[A-Z]{4}0[A-Z0-9]{6}$/i, 'Please enter a valid 11-character IFSC code (e.g. SBIN0001824)'),
  phone: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const sessionUser = await getSessionUser(req);
    const body = await req.json();
    const parsed = verifyBankSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.errors[0].message },
        { status: 400 }
      );
    }

    const { workerId, accountHolderName, accountNumber, ifsc, phone } = parsed.data;

    if (sessionUser && sessionUser.role !== 'ADMIN' && sessionUser.workerProfile?.id !== workerId) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const worker = await prisma.workerProfile.findUnique({
      where: { id: workerId },
      include: { aadhaarVerif: true },
    });

    if (!worker) {
      return NextResponse.json({ success: false, error: 'Worker profile not found' }, { status: 404 });
    }

    // Call Cashfree Bank Verification
    const result = await cashfreeService.verifyBankAccount({
      accountNumber,
      ifsc: ifsc.toUpperCase(),
      accountHolderName,
      phone,
    });

    if (!result.success) {
      // Record failed attempt
      await prisma.bankVerification.upsert({
        where: { workerId },
        update: {
          status: 'FAILED',
          failureReason: result.message,
          ifsc: ifsc.toUpperCase(),
          accountHolderName,
          maskedAccountNo: CashfreeVerificationService.maskBankAccount(accountNumber),
        },
        create: {
          workerId,
          status: 'FAILED',
          failureReason: result.message,
          ifsc: ifsc.toUpperCase(),
          accountHolderName,
          maskedAccountNo: CashfreeVerificationService.maskBankAccount(accountNumber),
        },
      });

      return NextResponse.json(
        {
          success: false,
          status: 'FAILED',
          error: result.message,
        },
        { status: 400 }
      );
    }

    // Success: Store masked account and update status
    await prisma.bankVerification.upsert({
      where: { workerId },
      update: {
        refId: result.refId,
        status: 'VERIFIED',
        maskedAccountNo: result.maskedAccountNo!,
        ifsc: result.ifsc!,
        accountHolderName: result.accountHolderName!,
        bankName: result.bankName,
        nameMatchScore: result.nameMatchScore,
        verifiedAt: new Date(),
        failureReason: null,
      },
      create: {
        workerId,
        refId: result.refId,
        status: 'VERIFIED',
        maskedAccountNo: result.maskedAccountNo!,
        ifsc: result.ifsc!,
        accountHolderName: result.accountHolderName!,
        bankName: result.bankName,
        nameMatchScore: result.nameMatchScore,
        verifiedAt: new Date(),
      },
    });

    // Centralized evaluation: Aadhaar + Bank + Profile = VERIFIED
    await syncWorkerVerificationStatus(workerId);

    return NextResponse.json({
      success: true,
      status: 'VERIFIED',
      message: 'Bank account verified successfully with Cashfree.',
      maskedAccountNo: result.maskedAccountNo,
      accountHolderName: result.accountHolderName,
      bankName: result.bankName,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: 'Internal error during bank verification: ' + err.message },
      { status: 500 }
    );
  }
}
