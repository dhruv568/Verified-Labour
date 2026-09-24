import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/db';
import { getSessionUser } from '@/lib/auth';
import cashfreePaymentService from '@/services/cashfree-payment';
import JobStateMachine from '@/services/job-state-machine';
import NotificationService from '@/services/notification';

const verifyPaymentSchema = z.object({
  jobId: z.string().min(1, 'Job ID is required'),
  orderId: z.string().min(1, 'Order ID is required'),
});

export async function POST(req: NextRequest) {
  try {
    const sessionUser = await getSessionUser(req);
    if (!sessionUser) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const parsed = verifyPaymentSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.errors[0]?.message || 'Invalid parameters' },
        { status: 400 }
      );
    }

    const { jobId, orderId } = parsed.data;

    const job = await prisma.job.findUnique({
      where: { id: jobId },
      include: {
        customer: true,
        worker: { include: { user: true } },
        service: true,
        payment: true,
      },
    });

    if (!job) {
      return NextResponse.json({ success: false, error: 'Job not found' }, { status: 404 });
    }

    // Role-based authorization
    if (sessionUser.role !== 'ADMIN' && sessionUser.customerProfile?.id !== job.customerId) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    // Idempotency: If already verified and marked PAID, return success
    if (['PAID', 'REVIEWED', 'COMPLETED'].includes(job.status)) {
      return NextResponse.json({
        success: true,
        status: 'PAID',
        grossAmount: job.finalAmount,
        message: 'Payment has already been verified and captured.',
      });
    }

    // Server-side verification using Cashfree API
    const verification = await cashfreePaymentService.verifyPayment(orderId);

    if (!verification.verified) {
      const isPending = verification.paymentStatus === 'PENDING' || verification.orderStatus === 'ACTIVE';

      await prisma.payment.update({
        where: { jobId },
        data: {
          status: isPending ? 'PENDING' : 'FAILED',
          failureCode: isPending ? 'PAYMENT_PENDING' : 'VERIFICATION_FAILED',
          failureDescription: verification.message,
        },
      });

      return NextResponse.json(
        {
          success: false,
          status: isPending ? 'PENDING' : 'FAILED',
          error: verification.message || 'Payment is not verified as successful.',
        },
        { status: isPending ? 202 : 400 }
      );
    }

    // Fee breakdown calculation
    const grossAmount = job.finalAmount;
    const commissionPct = 10.0; // 10% standard platform commission
    const platformFee = Math.round(grossAmount * (commissionPct / 100) * 100) / 100;
    const taxAmount = Math.round(platformFee * 0.18 * 100) / 100; // 18% GST on platform commission
    const workerAmount = Math.round((grossAmount - platformFee) * 100) / 100;

    // Database transaction: update Payment, upsert Transaction
    await prisma.$transaction([
      prisma.payment.update({
        where: { jobId },
        data: {
          paymentProvider: 'CASHFREE',
          providerOrderId: orderId,
          providerPaymentId: verification.cfPaymentId,
          method: verification.paymentMethod || 'ONLINE',
          status: 'CAPTURED',
          failureCode: null,
          failureDescription: null,
        },
      }),
      prisma.transaction.upsert({
        where: { jobId },
        update: {
          grossAmount,
          platformFee,
          taxAmount,
          workerAmount,
          paymentStatus: 'CAPTURED',
          settlementStatus: 'PENDING',
        },
        create: {
          jobId,
          grossAmount,
          platformFee,
          taxAmount,
          workerAmount,
          paymentStatus: 'CAPTURED',
          settlementStatus: 'PENDING',
        },
      }),
    ]);

    // Transition state machine to PAID
    await JobStateMachine.transition({
      jobId,
      toStatus: 'PAID',
      changedByUserId: sessionUser.id,
      userRole: 'CUSTOMER',
      note: `Payment of ₹${grossAmount} successfully verified via Cashfree (${verification.cfPaymentId || orderId})`,
    });

    // Notify Worker of payment
    await NotificationService.notifyJobEvent({
      customerId: sessionUser.id,
      workerId: job.worker.user.id,
      jobId,
      eventType: 'PAID',
      serviceName: job.service?.name,
    });

    return NextResponse.json({
      success: true,
      status: 'PAID',
      paymentId: verification.cfPaymentId || orderId,
      grossAmount,
      workerAmount,
      message: 'Payment verified and captured successfully via Cashfree. Job marked as PAID.',
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: 'Cashfree payment verification error: ' + err.message },
      { status: 500 }
    );
  }
}
