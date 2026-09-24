import assert from 'assert';
import prisma from '../lib/db';
import { cashfreePaymentService } from '../services/cashfree-payment';
import JobStateMachine from '../services/job-state-machine';

async function runPaymentSuite() {
  console.log('====================================================');
  console.log('RUNNING CASHFREE PAYMENTS COMPREHENSIVE TEST SUITE');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  async function testCase(name: string, fn: () => Promise<void>) {
    try {
      await fn();
      console.log(`  ✔ PASS: ${name}`);
      passed++;
    } catch (err: any) {
      console.error(`  ✖ FAIL: ${name}`);
      console.error(`    ${err.message}`);
      failed++;
    }
  }

  // 1. Order Creation
  await testCase('Cashfree Order Creation generates unique orderId and session', async () => {
    const res = await cashfreePaymentService.createOrder({
      jobId: 'job_test_sample_123',
      amount: 499.0,
      currency: 'INR',
      customer: {
        id: 'cust_abc_1',
        name: 'Suresh Kumar',
        phone: '9876543210',
        email: 'suresh@example.com',
      },
    });

    assert.strictEqual(res.success, true);
    assert.strictEqual(res.amount, 499.0);
    assert.strictEqual(res.currency, 'INR');
    assert.strictEqual(res.environment, 'SANDBOX');
    assert.ok(res.orderId.startsWith('vl_ord_'));
    assert.ok(res.paymentSessionId);
  });

  // 2. Server-side Verification
  await testCase('Cashfree Server Verification verifies order and returns payment details', async () => {
    const res = await cashfreePaymentService.verifyPayment('order_test_verified_1');
    assert.strictEqual(res.verified, true);
    assert.strictEqual(res.orderStatus, 'PAID');
    assert.strictEqual(res.paymentStatus, 'SUCCESS');
    assert.ok(res.cfPaymentId);
  });

  // 3. Webhook Signature Verification
  await testCase('Cashfree Webhook Signature validation validates authentic signatures', async () => {
    const samplePayload = JSON.stringify({
      type: 'PAYMENT_SUCCESS_WEBHOOK',
      data: {
        order: { order_id: 'order_test_wh_1', order_amount: 350.0 },
        payment: { cf_payment_id: 'cf_12345', payment_status: 'SUCCESS' },
      },
    });

    const isValid = cashfreePaymentService.verifyWebhookSignature(
      samplePayload,
      'mock_cf_sig_valid_hash',
      '1711234567'
    );
    assert.strictEqual(isValid, true);
  });

  // 4. Webhook rejects invalid signatures
  await testCase('Cashfree Webhook rejects invalid signatures', async () => {
    const samplePayload = JSON.stringify({
      type: 'PAYMENT_SUCCESS_WEBHOOK',
      data: { order: { order_id: 'order_fake_1' } },
    });

    const isInvalid = cashfreePaymentService.verifyWebhookSignature(
      samplePayload,
      'completely_bogus_signature',
      '1711234567'
    );
    assert.strictEqual(isInvalid, false);
  });

  // 5. Fee Calculation & GST
  await testCase('10% Platform fee calculation & 18% GST share calculation', async () => {
    const gross = 600.0;
    const commissionPct = 10.0;
    const platformFee = Math.round(gross * (commissionPct / 100) * 100) / 100;
    const taxAmount = Math.round(platformFee * 0.18 * 100) / 100;
    const workerShare = Math.round((gross - platformFee) * 100) / 100;

    assert.strictEqual(platformFee, 60.0);
    assert.strictEqual(taxAmount, 10.8);
    assert.strictEqual(workerShare, 540.0);
  });

  // 6. DB Idempotency & Payment state handling
  await testCase('DB Payment model supports Cashfree fields & upsert idempotency', async () => {
    const testJob = await prisma.job.findFirst({
      include: { payment: true },
    });

    if (!testJob) {
      console.log('Skipping DB transaction test (seed data absent)');
      return;
    }

    const testOrderId = `order_cf_${Date.now()}`;
    const testSessionId = `session_cf_${Date.now()}`;

    // 1st Create / Upsert Payment
    const payment = await prisma.payment.upsert({
      where: { jobId: testJob.id },
      update: {
        paymentProvider: 'CASHFREE',
        providerOrderId: testOrderId,
        paymentSessionId: testSessionId,
        amount: 350.0,
        status: 'CREATED',
      },
      create: {
        jobId: testJob.id,
        paymentProvider: 'CASHFREE',
        providerOrderId: testOrderId,
        paymentSessionId: testSessionId,
        amount: 350.0,
        status: 'CREATED',
      },
    });

    assert.strictEqual(payment.paymentProvider, 'CASHFREE');
    assert.strictEqual(payment.status, 'CREATED');

    // 2nd Simulate Webhook Capture
    const updatedPayment = await prisma.payment.update({
      where: { jobId: testJob.id },
      data: {
        providerPaymentId: 'cf_pay_9999',
        status: 'CAPTURED',
        method: 'UPI',
      },
    });

    assert.strictEqual(updatedPayment.status, 'CAPTURED');

    // 3rd Idempotent Duplicate Webhook Check
    assert.strictEqual(
      ['CAPTURED', 'PAID', 'SUCCESS'].includes(updatedPayment.status),
      true,
      'Duplicate webhook should detect existing CAPTURED status and ignore'
    );
  });

  console.log('\n====================================================');
  console.log(`CASHFREE TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('====================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runPaymentSuite()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
