import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/db';
import { getSessionUser } from '@/lib/auth';
import razorpayService from '@/services/razorpay';
import JobStateMachine from '@/services/job-state-machine';
import NotificationService from '@/services/notification';

const verifyPaymentSchema = z.object({
  jobId: z.string(),
  orderId: z.string(),
  paymentId: z.string(),
  signature: z.string(),
});

export async function POST(req: NextRequest) {
  try {
    const sessionUser = await getSessionUser(req);
    if (!sessionUser) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const parsed = verifyPaymentSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.errors[0].message },
        { status: 400 }
      );
    }

    const { jobId, orderId, paymentId, signature } = parsed.data;

    const job = await prisma.job.findUnique({
      where: { id: jobId },
      include: { customer: true, worker: { include: { user: true } }, service: true },
    });

    if (!job) {
      return NextResponse.json({ success: false, error: 'Job not found' }, { status: 404 });
    }

    // Cryptographic signature check
    const isValidSignature = razorpayService.verifyPaymentSignature({
      orderId,
      paymentId,
      signature,
    });

    if (!isValidSignature) {
      await prisma.payment.update({
        where: { jobId },
        data: {
          status: 'FAILED',
          failureCode: 'INVALID_SIGNATURE',
          failureDescription: 'Payment signature verification failed.',
        },
      });

      return NextResponse.json(
        { success: false, error: 'Payment verification failed: Invalid payment signature.' },
        { status: 400 }
      );
    }

    // Calculate Platform fee and worker payout share
    const grossAmount = job.finalAmount;
    const commissionPct = 10.0; // 10% configurable platform commission
    const platformFee = Math.round(grossAmount * (commissionPct / 100) * 100) / 100;
    const taxAmount = Math.round(platformFee * 0.18 * 100) / 100; // 18% GST on platform fee
    const workerAmount = Math.round((grossAmount - platformFee) * 100) / 100;

    // Database transaction: update Payment, create Transaction, and transition Job state to PAID
    await prisma.$transaction([
      prisma.payment.update({
        where: { jobId },
        data: {
          razorpayPaymentId: paymentId,
          razorpaySignature: signature,
          status: 'CAPTURED',
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

    // Transition state machine
    await JobStateMachine.transition({
      jobId,
      toStatus: 'PAID',
      changedByUserId: sessionUser.id,
      userRole: 'CUSTOMER',
      note: `Payment of ₹${grossAmount} successfully captured via Razorpay (${paymentId})`,
    });

    // Notify Worker
    await NotificationService.notifyJobEvent({
      customerId: sessionUser.id,
      workerId: job.worker.user.id,
      jobId,
      eventType: 'PAID',
      serviceName: job.service.name,
    });

    return NextResponse.json({
      success: true,
      status: 'PAID',
      paymentId,
      grossAmount,
      workerAmount,
      message: 'Payment verified and captured successfully. Job marked as PAID.',
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: 'Payment verification error: ' + err.message },
      { status: 500 }
    );
  }
}
