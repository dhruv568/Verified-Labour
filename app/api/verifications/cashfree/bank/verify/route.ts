import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/db';
import { getSessionUser } from '@/lib/auth';
import cashfreeService, { CashfreeVerificationService } from '@/services/cashfree';
import { syncWorkerVerificationStatus } from '@/lib/worker-verification';
import { checkRateLimit } from '@/lib/rate-limiter';

const verifyBankSchema = z.object({
  workerId: z.string(),
  accountHolderName: z.string().trim().min(2, 'Please enter the full name as per bank records'),
  accountNumber: z.string().trim().regex(/^\d{7,25}$/, 'Account number must be between 7 and 25 digits'),
  ifsc: z.string().trim().regex(/^[A-Z]{4}0[A-Z0-9]{6}$/i, 'Please enter a valid 11-character IFSC code (e.g. SBIN0001824)'),
  phone: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const sessionUser = await getSessionUser(req);
    const body = await req.json();
    const parsed = verifyBankSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, status: 'FAILED', error: parsed.error.errors[0]?.message || 'Invalid bank account parameters' },
        { status: 400 }
      );
    }

    const { workerId, accountHolderName, accountNumber, ifsc, phone } = parsed.data;

    // Authorization check
    if (sessionUser && sessionUser.role !== 'ADMIN' && sessionUser.workerProfile?.id !== workerId) {
      return NextResponse.json({ success: false, error: 'Forbidden: You cannot verify another worker\'s profile' }, { status: 403 });
    }

    const worker = await prisma.workerProfile.findUnique({
      where: { id: workerId },
      include: { bankVerif: true, aadhaarVerif: true },
    });

    if (!worker) {
      return NextResponse.json({ success: false, error: 'Worker profile not found' }, { status: 404 });
    }

    // 1. PREVENT DUPLICATE VERIFICATION: If worker bank account is already verified, return verified state
    if (worker.bankVerified || worker.bankVerif?.status === 'VERIFIED') {
      return NextResponse.json({
        success: true,
        alreadyVerified: true,
        status: 'VERIFIED',
        message: 'Bank account is already verified for this worker profile.',
        maskedAccountNo: worker.bankVerif?.maskedAccountNo || 'XXXXXXXX4512',
        accountHolderName: worker.bankVerif?.accountHolderName || worker.fullName,
        bankName: worker.bankVerif?.bankName || 'Verified Bank',
        ifsc: worker.bankVerif?.ifsc || ifsc.toUpperCase(),
      });
    }

    // 2. RATE LIMITING: max 6 verification attempts per 10 minutes per worker/IP
    const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
    const rateLimit = checkRateLimit(`bank_verif_${workerId}_${ip}`, 6, 600);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: `Too many bank verification attempts. Please wait ${rateLimit.retryAfterSeconds} seconds before trying again.`,
        },
        { status: 429 }
      );
    }

    const cleanIfsc = ifsc.toUpperCase();

    // 3. Call Cashfree Bank Verification API (Server-to-Server, secrets backend only)
    const result = await cashfreeService.verifyBankAccount({
      accountNumber,
      ifsc: cleanIfsc,
      accountHolderName,
      phone,
    });

    if (!result.success) {
      // Record failed attempt in database
      await prisma.bankVerification.upsert({
        where: { workerId },
        update: {
          status: 'FAILED',
          failureReason: result.message,
          ifsc: cleanIfsc,
          accountHolderName,
          maskedAccountNo: CashfreeVerificationService.maskBankAccount(accountNumber),
        },
        create: {
          workerId,
          status: 'FAILED',
          failureReason: result.message,
          ifsc: cleanIfsc,
          accountHolderName,
          maskedAccountNo: CashfreeVerificationService.maskBankAccount(accountNumber),
        },
      });

      return NextResponse.json(
        {
          success: false,
          status: 'FAILED',
          error: result.message,
          failureReason: result.failureReason || 'BANK_VERIFICATION_FAILED',
        },
        { status: 400 }
      );
    }

    // 4. SUCCESS: Store only required masked details and reference status securely
    // Full account number is NEVER stored! Only masked string XXXXXXXX1234
    await prisma.bankVerification.upsert({
      where: { workerId },
      update: {
        refId: result.refId,
        status: 'VERIFIED',
        maskedAccountNo: result.maskedAccountNo || CashfreeVerificationService.maskBankAccount(accountNumber),
        ifsc: cleanIfsc,
        accountHolderName: result.accountHolderName || accountHolderName,
        bankName: result.bankName || 'Verified Bank',
        nameMatchScore: result.nameMatchScore,
        verifiedAt: new Date(),
        failureReason: null,
      },
      create: {
        workerId,
        refId: result.refId,
        status: 'VERIFIED',
        maskedAccountNo: result.maskedAccountNo || CashfreeVerificationService.maskBankAccount(accountNumber),
        ifsc: cleanIfsc,
        accountHolderName: result.accountHolderName || accountHolderName,
        bankName: result.bankName || 'Verified Bank',
        nameMatchScore: result.nameMatchScore,
        verifiedAt: new Date(),
        failureReason: null,
      },
    });

    // 5. Centralized evaluation: Aadhaar + Bank + Profile = VERIFIED status update
    await syncWorkerVerificationStatus(workerId);

    return NextResponse.json({
      success: true,
      status: 'VERIFIED',
      message: result.message || 'Bank account verified successfully with Cashfree.',
      maskedAccountNo: result.maskedAccountNo || CashfreeVerificationService.maskBankAccount(accountNumber),
      accountHolderName: result.accountHolderName || accountHolderName,
      bankName: result.bankName || 'Verified Bank',
      ifsc: cleanIfsc,
    });
  } catch (err: any) {
    console.error('Error verifying bank account:', err);
    return NextResponse.json(
      { success: false, error: 'Internal error during bank verification: ' + err.message },
      { status: 500 }
    );
  }
}
