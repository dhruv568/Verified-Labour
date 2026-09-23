import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/db';
import { getSessionUser } from '@/lib/auth';
import razorpayService from '@/services/razorpay';

const createOrderSchema = z.object({
  jobId: z.string(),
});

export async function POST(req: NextRequest) {
  try {
    const sessionUser = await getSessionUser(req);
    if (!sessionUser) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const parsed = createOrderSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.errors[0].message },
        { status: 400 }
      );
    }

    const { jobId } = parsed.data;

    const job = await prisma.job.findUnique({
      where: { id: jobId },
      include: { customer: true, worker: true, service: true },
    });

    if (!job) {
      return NextResponse.json({ success: false, error: 'Job not found' }, { status: 404 });
    }

    // RBAC: customer or admin
    if (sessionUser.role !== 'ADMIN' && sessionUser.customerProfile?.id !== job.customerId) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    // Only allow payment when work is completed or payment pending
    if (!['WORK_COMPLETED', 'PAYMENT_PENDING'].includes(job.status)) {
      return NextResponse.json(
        {
          success: false,
          error: `Payment cannot be initiated while job is in '${job.status}' status. Work must be marked completed first.`,
        },
        { status: 400 }
      );
    }

    const amount = job.finalAmount;

    // Create Razorpay Order
    const orderResult = await razorpayService.createOrder({
      jobId: job.id,
      amount,
      notes: {
        jobId: job.id,
        serviceName: job.service.name,
      },
    });

    if (!orderResult.success) {
      return NextResponse.json(
        { success: false, error: orderResult.message || 'Failed to create payment order' },
        { status: 500 }
      );
    }

    // Upsert Payment record
    await prisma.payment.upsert({
      where: { jobId },
      update: {
        razorpayOrderId: orderResult.orderId,
        amount,
        status: 'CREATED',
      },
      create: {
        jobId,
        razorpayOrderId: orderResult.orderId,
        amount,
        status: 'CREATED',
      },
    });

    return NextResponse.json({
      success: true,
      orderId: orderResult.orderId,
      amount: orderResult.amount, // in paise
      amountInRupees: amount,
      currency: orderResult.currency,
      keyId: orderResult.keyId,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: 'Error creating payment order: ' + err.message },
      { status: 500 }
    );
  }
}
