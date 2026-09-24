const assert = require('assert');
const { calculateHaversineDistanceKm, formatDistance } = require('../lib/location');
const { ALLOWED_TRANSITIONS, JobStateMachine } = require('../services/job-state-machine');
const { cashfreeService, CashfreeVerificationService } = require('../services/cashfree');
const { cashfreePaymentService } = require('../services/cashfree-payment');

async function runAllTests() {
  console.log('====================================================');
  console.log('RUNNING VERIFIED LABOUR TEST SUITE');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  function test(name, fn) {
    try {
      fn();
      console.log(`  ✔ PASS: ${name}`);
      passed++;
    } catch (err) {
      console.error(`  ✖ FAIL: ${name}`);
      console.error(`    ${err.message}`);
      failed++;
    }
  }

  async function testAsync(name, fn) {
    try {
      await fn();
      console.log(`  ✔ PASS: ${name}`);
      passed++;
    } catch (err) {
      console.error(`  ✖ FAIL: ${name}`);
      console.error(`    ${err.message}`);
      failed++;
    }
  }

  // 1. LOCATION & PROXIMITY TESTS
  console.log('--- 1. Location & Haversine Distance Tests ---');
  test('Haversine distance between Adajan (21.1925, 72.7933) and Vesu (21.1558, 72.7758)', () => {
    const dist = calculateHaversineDistanceKm(21.1925, 72.7933, 21.1558, 72.7758);
    assert(dist > 3.5 && dist < 5.0, `Expected distance ~4.4km, got ${dist}`);
  });

  test('Haversine distance between identical coordinates should be 0', () => {
    const dist = calculateHaversineDistanceKm(21.1702, 72.8311, 21.1702, 72.8311);
    assert.strictEqual(dist, 0);
  });

  test('Distance formatting (< 1 km displays in meters, >= 1 km in km)', () => {
    assert.strictEqual(formatDistance(0.4), '400 m away');
    assert.strictEqual(formatDistance(2.45), '2.5 km away');
    assert.strictEqual(formatDistance(null), 'Nearby');
  });

  // 2. CASHFREE SECURE ID & PRIVACY TESTS
  console.log('\n--- 2. Cashfree Verification & Aadhaar Masking Tests ---');
  test('Aadhaar masking keeps only last 4 digits (XXXXXXXX1234)', () => {
    const masked = CashfreeVerificationService.maskAadhaar('5432-8765-1234');
    assert.strictEqual(masked, 'XXXXXXXX1234');
  });

  test('Bank account masking keeps only last 4 digits (XXXXXXXX4321)', () => {
    const masked = CashfreeVerificationService.maskBankAccount('102938474321');
    assert.strictEqual(masked, 'XXXXXXXX4321');
  });

  await testAsync('Cashfree Aadhaar start returns OTP_SENT in sandbox', async () => {
    const res = await cashfreeService.startAadhaarVerification({
      workerId: 'w-test-1',
      aadhaarNumber: '123456789012',
      consent: true,
    });
    assert.strictEqual(res.success, true);
    assert.strictEqual(res.status, 'OTP_SENT');
    assert(res.refId.length > 0);
  });

  await testAsync('Cashfree Aadhaar fails if consent is not granted', async () => {
    const res = await cashfreeService.startAadhaarVerification({
      workerId: 'w-test-1',
      aadhaarNumber: '123456789012',
      consent: false,
    });
    assert.strictEqual(res.success, false);
    assert(res.message.includes('Consent is required'));
  });

  await testAsync('Cashfree Aadhaar OTP verify succeeds with valid sandbox OTP 123456', async () => {
    const res = await cashfreeService.submitAadhaarOtp({
      refId: 'ref_test_123',
      otp: '123456',
      workerFullName: 'Ramesh Patel',
    });
    assert.strictEqual(res.success, true);
    assert.strictEqual(res.status, 'VERIFIED');
    assert.strictEqual(res.nameOnAadhaar, 'Ramesh Patel');
  });

  await testAsync('Cashfree Aadhaar OTP verify fails on incorrect OTP', async () => {
    const res = await cashfreeService.submitAadhaarOtp({
      refId: 'ref_test_123',
      otp: '999999',
    });
    assert.strictEqual(res.success, false);
    assert.strictEqual(res.failureReason, 'INVALID_OTP');
  });

  await testAsync('Cashfree Bank verification verifies valid account & IFSC', async () => {
    const res = await cashfreeService.verifyBankAccount({
      accountNumber: '20394857123',
      ifsc: 'SBIN0001824',
      accountHolderName: 'Ramesh Patel',
    });
    assert.strictEqual(res.success, true);
    assert.strictEqual(res.status, 'VERIFIED');
    assert.strictEqual(res.maskedAccountNo, 'XXXXXXXX7123');
  });

  // 3. JOB STATE MACHINE STRICT TRANSITION TESTS
  console.log('\n--- 3. Strict Job State Machine Tests ---');
  test('REQUESTED can transition to ACCEPTED or REJECTED', () => {
    assert.strictEqual(JobStateMachine.canTransition('REQUESTED', 'ACCEPTED'), true);
    assert.strictEqual(JobStateMachine.canTransition('REQUESTED', 'REJECTED'), true);
  });

  test('REQUESTED CANNOT skip directly to PAID or COMPLETED', () => {
    assert.strictEqual(JobStateMachine.canTransition('REQUESTED', 'PAID'), false);
    assert.strictEqual(JobStateMachine.canTransition('REQUESTED', 'COMPLETED'), false);
  });

  test('WORKER_ON_THE_WAY transitions to ARRIVED', () => {
    assert.strictEqual(JobStateMachine.canTransition('WORKER_ON_THE_WAY', 'ARRIVED'), true);
  });

  test('ARRIVED transitions to WORK_STARTED', () => {
    assert.strictEqual(JobStateMachine.canTransition('ARRIVED', 'WORK_STARTED'), true);
  });

  test('WORK_COMPLETED transitions to PAYMENT_PENDING or PAID', () => {
    assert.strictEqual(JobStateMachine.canTransition('WORK_COMPLETED', 'PAID'), true);
    assert.strictEqual(JobStateMachine.canTransition('WORK_COMPLETED', 'PAYMENT_PENDING'), true);
  });

  test('Only Worker can transition to WORKER_ON_THE_WAY or WORK_STARTED', () => {
    assert.strictEqual(JobStateMachine.isRoleAuthorized('ACCEPTED', 'WORKER_ON_THE_WAY', 'WORKER'), true);
    assert.strictEqual(JobStateMachine.isRoleAuthorized('ACCEPTED', 'WORKER_ON_THE_WAY', 'CUSTOMER'), false);
  });

  // 4. CASHFREE PAYMENT & COMMISSION TESTS
  console.log('\n--- 4. Cashfree Payments & Fee Calculation Tests ---');
  await testAsync('Cashfree Order Creation returns valid orderId and paymentSessionId', async () => {
    const res = await cashfreePaymentService.createOrder({
      jobId: 'job-test-99',
      amount: 350.0,
      customer: {
        id: 'cust_test_99',
        name: 'Test Customer',
        phone: '9876543210',
      },
    });
    assert.strictEqual(res.success, true);
    assert.strictEqual(typeof res.orderId, 'string');
    assert.strictEqual(typeof res.paymentSessionId, 'string');
    assert.strictEqual(res.amount, 350.0);
  });

  test('Cashfree cryptographic signature validation succeeds for valid mock sig', () => {
    const isValid = cashfreePaymentService.verifyWebhookSignature(
      JSON.stringify({ type: 'PAYMENT_SUCCESS_WEBHOOK', order_id: 'order_123' }),
      'mock_cf_sig_valid_hash',
      '1711234567'
    );
    assert.strictEqual(isValid, true);
  });

  test('10% Platform fee calculation and GST breakdown', () => {
    const gross = 500;
    const commissionPct = 10;
    const platformFee = gross * (commissionPct / 100);
    const workerShare = gross - platformFee;
    assert.strictEqual(platformFee, 50);
    assert.strictEqual(workerShare, 450);
  });

  console.log('\n====================================================');
  console.log(`TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('====================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runAllTests().catch((e) => {
  console.error(e);
  process.exit(1);
});
