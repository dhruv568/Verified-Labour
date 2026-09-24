import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import cashfreePaymentService from '@/services/cashfree-payment';
import JobStateMachine from '@/services/job-state-machine';
import NotificationService from '@/services/notification';

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature =
      req.headers.get('x-webhook-signature') ||
      req.headers.get('x-cashfree-signature') ||
      '';
    const timestamp = req.headers.get('x-webhook-timestamp') || undefined;

    // Cryptographic verification of Cashfree webhook signature
    const isValidSignature = cashfreePaymentService.verifyWebhookSignature(
      rawBody,
      signature,
      timestamp
    );

    if (!isValidSignature) {
      console.warn('[Cashfree Webhook] Invalid webhook signature rejected.');
      return NextResponse.json(
        { success: false, error: 'Invalid webhook signature' },
        { status: 401 }
      );
    }

    let payload: any;
    try {
      payload = JSON.parse(rawBody);
    } catch {
      return NextResponse.json({ success: false, error: 'Malformed JSON payload' }, { status: 400 });
    }

    const eventType = payload.type || payload.event || '';
    const orderData = payload.data?.order || payload.order || {};
    const paymentData = payload.data?.payment || payload.payment || {};

    const orderId = orderData.order_id || payload.order_id;
    if (!orderId) {
      return NextResponse.json({ success: false, error: 'Missing order_id in webhook' }, { status: 400 });
    }

    console.log(`[Cashfree Webhook] Received event: ${eventType} for order: ${orderId}`);

    // Find the associated payment record
    const payment = await prisma.payment.findFirst({
      where: { providerOrderId: orderId },
      include: {
        job: {
          include: {
            worker: { include: { user: true } },
            service: true,
          },
        },
      },
    });

    if (!payment || !payment.job) {
      console.warn(`[Cashfree Webhook] No matching payment record found for order ${orderId}`);
      return NextResponse.json(
        { success: true, message: 'Order processed / no matching local job' },
        { status: 200 }
      );
    }

    const job = payment.job;
    const isPaymentSuccess =
      eventType === 'PAYMENT_SUCCESS_WEBHOOK' ||
      eventType === 'ORDER_PAID' ||
      paymentData.payment_status === 'SUCCESS';

    if (isPaymentSuccess) {
      // Idempotency: Do not duplicate if already captured
      if (['CAPTURED', 'PAID', 'SUCCESS'].includes(payment.status) || ['PAID', 'REVIEWED', 'COMPLETED'].includes(job.status)) {
        return NextResponse.json(
          { success: true, message: 'Payment already recorded (idempotent)' },
          { status: 200 }
        );
      }

      const grossAmount = job.finalAmount;
      const commissionPct = 10.0;
      const platformFee = Math.round(grossAmount * (commissionPct / 100) * 100) / 100;
      const taxAmount = Math.round(platformFee * 0.18 * 100) / 100;
      const workerAmount = Math.round((grossAmount - platformFee) * 100) / 100;

      const cfPaymentId = paymentData.cf_payment_id ? String(paymentData.cf_payment_id) : undefined;
      let methodStr = 'ONLINE';
      if (paymentData.payment_method) {
        const keys = Object.keys(paymentData.payment_method);
        if (keys.length > 0) methodStr = keys[0].toUpperCase();
      }

      await prisma.$transaction([
        prisma.payment.update({
          where: { id: payment.id },
          data: {
            paymentProvider: 'CASHFREE',
            providerPaymentId: cfPaymentId,
            providerSignature: signature || null,
            method: methodStr,
            status: 'CAPTURED',
            failureCode: null,
            failureDescription: null,
          },
        }),
        prisma.transaction.upsert({
          where: { jobId: job.id },
          update: {
            grossAmount,
            platformFee,
            taxAmount,
            workerAmount,
            paymentStatus: 'CAPTURED',
            settlementStatus: 'PENDING',
          },
          create: {
            jobId: job.id,
            grossAmount,
            platformFee,
            taxAmount,
            workerAmount,
            paymentStatus: 'CAPTURED',
            settlementStatus: 'PENDING',
          },
        }),
      ]);

      if (!['PAID', 'REVIEWED', 'COMPLETED'].includes(job.status)) {
        await JobStateMachine.transition({
          jobId: job.id,
          toStatus: 'PAID',
          changedByUserId: job.customerId,
          userRole: 'CUSTOMER',
          note: `Payment captured via Cashfree webhook (${cfPaymentId || orderId})`,
        });

        await NotificationService.notifyJobEvent({
          customerId: job.customerId,
          workerId: job.worker.user.id,
          jobId: job.id,
          eventType: 'PAID',
          serviceName: job.service?.name,
        });
      }

      return NextResponse.json({ success: true, message: 'Payment successfully captured via webhook' });
    }

    // Handle Failure events
    const isPaymentFailed =
      eventType === 'PAYMENT_FAILED_WEBHOOK' ||
      eventType === 'PAYMENT_USER_DROPPED_WEBHOOK' ||
      paymentData.payment_status === 'FAILED';

    if (isPaymentFailed && payment.status !== 'CAPTURED') {
      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: 'FAILED',
          failureCode: paymentData.payment_status || 'FAILED',
          failureDescription: paymentData.payment_message || 'Payment failed or dropped by user',
        },
      });

      return NextResponse.json({ success: true, message: 'Payment failure recorded' });
    }

    return NextResponse.json({ success: true, message: 'Event acknowledged' });
  } catch (err: any) {
    console.error('[Cashfree Webhook Error]', err);
    return NextResponse.json(
      { success: false, error: 'Internal webhook processing error' },
      { status: 500 }
    );
  }
}
