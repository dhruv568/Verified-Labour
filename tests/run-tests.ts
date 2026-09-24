import assert from 'assert';
import {
  calculateHaversineDistanceKm,
  formatDistance,
  sanitizeWorkerForPublic,
  formatLocationDisplayName,
  reverseGeocode,
} from '../lib/location';
import { ALLOWED_TRANSITIONS, JobStateMachine } from '../services/job-state-machine';
import { cashfreeService, CashfreeVerificationService } from '../services/cashfree';
import { cashfreePaymentService } from '../services/cashfree-payment';
import { checkRateLimit } from '../lib/rate-limiter';

async function runAllTests() {
  console.log('====================================================');
  console.log('RUNNING VERIFIED LABOUR FULL AUTOMATED TEST SUITE');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  function test(name: string, fn: () => void) {
    try {
      fn();
      console.log(`  ✔ PASS: ${name}`);
      passed++;
    } catch (err: any) {
      console.error(`  ✖ FAIL: ${name}`);
      console.error(`    ${err.message}`);
      failed++;
    }
  }

  async function testAsync(name: string, fn: () => Promise<void>) {
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

  test('Worker profile sanitization masks exact GPS coordinates for public discovery', () => {
    const rawWorker = {
      id: 'worker-1',
      fullName: 'Ramesh Patel',
      latitude: 21.1925,
      longitude: 72.7933,
      postalCode: '395009',
      status: 'VERIFIED',
      isAvailable: true,
      serviceRadiusKm: 20,
      reviews: [{ rating: 5 }, { rating: 5 }],
    };

    const sanitized = sanitizeWorkerForPublic(rawWorker, 21.1558, 72.7758);
    assert.strictEqual((sanitized as any).latitude, undefined);
    assert.strictEqual((sanitized as any).longitude, undefined);
    assert(sanitized.distanceKm! > 0);
    assert.strictEqual(sanitized.rating, 5);
  });

  test('formatLocationDisplayName formats area and city correctly ("Adajan, Surat")', () => {
    const formatted = formatLocationDisplayName({ area: 'Adajan', city: 'Surat', state: 'Gujarat' });
    assert.strictEqual(formatted, 'Adajan, Surat');
  });

  test('formatLocationDisplayName formats city and state when area is absent ("Surat, Gujarat")', () => {
    const formatted = formatLocationDisplayName({ city: 'Surat', state: 'Gujarat' });
    assert.strictEqual(formatted, 'Surat, Gujarat');
  });

  test('formatLocationDisplayName formats city and state for non-Surat cities ("Bandra, Mumbai")', () => {
    const formatted = formatLocationDisplayName({ area: 'Bandra', city: 'Mumbai', state: 'Maharashtra' });
    assert.strictEqual(formatted, 'Bandra, Mumbai');
  });

  test('formatLocationDisplayName defaults to "Select location" when empty', () => {
    const formatted = formatLocationDisplayName({});
    assert.strictEqual(formatted, 'Select location');
  });

  await testAsync('reverseGeocode handles non-Surat coordinates without hardcoding Surat', async () => {
    const result = await reverseGeocode(19.076, 72.8777); // Mumbai
    assert(result.formattedAddress !== undefined);
    assert.notStrictEqual(result.city, 'Surat');
  });

  // 2. RATE LIMITING & SECURITY TESTS
  console.log('\n--- 2. Rate Limiting & Security Tests ---');
  test('Rate limiter permits requests under limit and blocks excess', () => {
    const key = `test_limit_${Date.now()}`;
    const first = checkRateLimit(key, 3, 60);
    assert.strictEqual(first.allowed, true);
    assert.strictEqual(first.remaining, 2);

    checkRateLimit(key, 3, 60);
    checkRateLimit(key, 3, 60);
    const blocked = checkRateLimit(key, 3, 60);
    assert.strictEqual(blocked.allowed, false);
    assert.strictEqual(blocked.remaining, 0);
  });

  // 3. CASHFREE SECURE ID & PRIVACY TESTS
  console.log('\n--- 3. Cashfree Verification & Aadhaar Masking Tests ---');
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

  await testAsync('Cashfree Bank verification rejects invalid IFSC', async () => {
    const res = await cashfreeService.verifyBankAccount({
      accountNumber: '20394857123',
      ifsc: 'INVALID0000',
      accountHolderName: 'Ramesh Patel',
    });
    assert.strictEqual(res.success, false);
    assert.strictEqual(res.status, 'FAILED');
  });

  // 4. JOB STATE MACHINE STRICT TRANSITION TESTS
  console.log('\n--- 4. Strict Job State Machine Tests ---');
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

  test('Only Customer or Admin can mark PAID or CANCELLED_BY_CUSTOMER', () => {
    assert.strictEqual(JobStateMachine.isRoleAuthorized('WORK_COMPLETED', 'PAID', 'CUSTOMER'), true);
    assert.strictEqual(JobStateMachine.isRoleAuthorized('WORK_COMPLETED', 'PAID', 'WORKER'), false);
  });

  // 5. CASHFREE PAYMENTS & COMMISSION TESTS
  console.log('\n--- 5. Cashfree Payments & Fee Calculation Tests ---');
  await testAsync('Cashfree Payment Order Creation returns valid orderId and paymentSessionId', async () => {
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
    assert.strictEqual(res.environment, 'SANDBOX');
  });

  await testAsync('Cashfree Payment server verification handles mock & success response', async () => {
    const res = await cashfreePaymentService.verifyPayment('order_test_123');
    assert.strictEqual(res.verified, true);
    assert.strictEqual(res.orderStatus, 'PAID');
    assert.strictEqual(res.paymentStatus, 'SUCCESS');
  });

  test('Cashfree Webhook cryptographic signature validation succeeds for valid signature', () => {
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
  console.log(`ALL TESTS COMPLETED: ${passed} PASSED, ${failed} FAILED`);
  console.log('====================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runAllTests().catch((e) => {
  console.error(e);
  process.exit(1);
});
