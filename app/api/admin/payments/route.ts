import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { requirePermission } from '@/lib/rbac';

export async function GET(req: NextRequest) {
  try {
    const auth = await requirePermission(req, 'payments.view');
    if (auth.error) return auth.error;

    const transactions = await prisma.transaction.findMany({
      include: {
        payment: {
          select: {
            id: true,
            paymentProvider: true,
            providerOrderId: true,
            providerPaymentId: true,
            amount: true,
            currency: true,
            status: true,
            method: true,
            createdAt: true,
          },
        },
        job: {
          select: {
            id: true,
            customer: { select: { fullName: true } },
            worker: { select: { fullName: true } },
            service: { select: { name: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      success: true,
      payments: transactions.map((t) => ({
        id: t.id,
        jobId: t.jobId,
        customerName: t.job?.customer?.fullName || 'Customer',
        workerName: t.job?.worker?.fullName || 'Worker',
        serviceName: t.job?.service?.name || 'Service',
        providerOrderId: t.payment?.providerOrderId || 'N/A',
        providerPaymentId: t.payment?.providerPaymentId || 'N/A',
        paymentProvider: t.payment?.paymentProvider || 'CASHFREE',
        paymentMethod: t.payment?.method || 'UPI/Card',
        grossAmount: t.grossAmount,
        platformFee: t.platformFee,
        taxAmount: t.taxAmount,
        workerAmount: t.workerAmount,
        paymentStatus: t.paymentStatus,
        settlementStatus: t.settlementStatus,
        createdAt: t.createdAt,
      })),
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch payments: ' + err.message },
      { status: 500 }
    );
  }
}
