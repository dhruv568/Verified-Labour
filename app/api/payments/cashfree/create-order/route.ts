import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/db';
import { getSessionUser } from '@/lib/auth';
import cashfreePaymentService from '@/services/cashfree-payment';

const createOrderSchema = z.object({
  jobId: z.string().min(1, 'Job ID is required'),
});

export async function POST(req: NextRequest) {
  try {
    const sessionUser = await getSessionUser(req);
    if (!sessionUser) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const parsed = createOrderSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.errors[0]?.message || 'Invalid request body' },
        { status: 400 }
      );
    }

    const { jobId } = parsed.data;

    const job = await prisma.job.findUnique({
      where: { id: jobId },
      include: {
        customer: { include: { user: true } },
        worker: { include: { user: true } },
        service: true,
        payment: true,
      },
    });

    if (!job) {
      return NextResponse.json({ success: false, error: 'Job not found' }, { status: 404 });
    }

    // Role-based authorization: Only job customer or platform admin
    if (sessionUser.role !== 'ADMIN' && sessionUser.customerProfile?.id !== job.customerId) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    // Prevent paying already settled / paid bookings
    if (['PAID', 'REVIEWED', 'COMPLETED'].includes(job.status)) {
      return NextResponse.json(
        { success: false, error: 'This booking has already been paid and completed.' },
        { status: 400 }
      );
    }

    if (job.payment && ['CAPTURED', 'PAID', 'SUCCESS'].includes(job.payment.status)) {
      return NextResponse.json(
        { success: false, error: 'Payment has already been captured for this booking.' },
        { status: 400 }
      );
    }

    // Only allow payment when work is completed or payment pending
    if (!['WORK_COMPLETED', 'PAYMENT_PENDING'].includes(job.status)) {
      return NextResponse.json(
        {
          success: false,
          error: `Payment cannot be initiated while job is in '${job.status}' status. The professional must mark the work as completed first.`,
        },
        { status: 400 }
      );
    }

    // Server-verified amount (never trust client-supplied amount!)
    const amount = Number(job.finalAmount);
    if (isNaN(amount) || amount <= 0) {
      return NextResponse.json(
        { success: false, error: 'Invalid final job amount configured on server.' },
        { status: 400 }
      );
    }

    const origin = req.nextUrl.origin || process.env.NEXTAUTH_URL || 'http://localhost:3000';

    // Create Cashfree Payment Order
    const orderResult = await cashfreePaymentService.createOrder({
      jobId: job.id,
      amount,
      customer: {
        id: sessionUser.id,
        name: sessionUser.customerProfile?.fullName || 'Verified Labour Customer',
        phone: sessionUser.phone || '9999999999',
        email: sessionUser.email || undefined,
      },
      returnUrl: `${origin}/customer/jobs/${job.id}?order_id={order_id}`,
      notifyUrl: `${origin}/api/payments/cashfree/webhook`,
      orderNote: `Payment for ${job.service?.name || 'Verified Labour Service'} (#${job.id.slice(0, 8)})`,
    });

    if (!orderResult.success || !orderResult.paymentSessionId) {
      return NextResponse.json(
        {
          success: false,
          error: orderResult.message || 'Failed to initialize Cashfree payment order.',
        },
        { status: 500 }
      );
    }

    // Store/update payment record in database
    await prisma.payment.upsert({
      where: { jobId },
      update: {
        paymentProvider: 'CASHFREE',
        providerOrderId: orderResult.orderId,
        paymentSessionId: orderResult.paymentSessionId,
        amount,
        status: 'CREATED',
        failureCode: null,
        failureDescription: null,
      },
      create: {
        jobId,
        paymentProvider: 'CASHFREE',
        providerOrderId: orderResult.orderId,
        paymentSessionId: orderResult.paymentSessionId,
        amount,
        status: 'CREATED',
      },
    });

    // Return only client-safe information required for Cashfree checkout
    return NextResponse.json({
      success: true,
      orderId: orderResult.orderId,
      paymentSessionId: orderResult.paymentSessionId,
      amount,
      currency: orderResult.currency,
      environment: orderResult.environment,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: 'Error creating Cashfree payment order: ' + err.message },
      { status: 500 }
    );
  }
}
