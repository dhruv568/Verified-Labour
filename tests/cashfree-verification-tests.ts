import assert from 'assert';
import { NextRequest } from 'next/server';
import prisma from '../lib/db';
import { POST as startAadhaarHandler } from '../app/api/verifications/cashfree/aadhaar/start/route';
import { POST as verifyAadhaarHandler } from '../app/api/verifications/cashfree/aadhaar/verify/route';
import { POST as verifyBankHandler } from '../app/api/verifications/cashfree/bank/verify/route';
import { evaluateWorkerVerification, syncWorkerVerificationStatus } from '../lib/worker-verification';

export async function runCashfreeVerificationTests() {
  console.log('\n--- 7. Cashfree Aadhaar & Bank API Verification Tests ---');

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

  // Create an isolated test worker for verification flow tests
  const testPhone = `+9190${Date.now().toString().slice(-8)}`;
  const testUser = await prisma.user.create({
    data: {
      phone: testPhone,
      email: `cf.worker.${Date.now()}@example.com`,
      role: 'WORKER',
      status: 'ACTIVE',
      isPhoneVerified: true,
      workerProfile: {
        create: {
          fullName: 'Vikram Singh',
          status: 'ONBOARDING',
          isAvailable: true,
          city: 'Surat',
          state: 'Gujarat',
          serviceRadiusKm: 15.0,
        },
      },
    },
    include: { workerProfile: true },
  });

  const workerId = testUser.workerProfile!.id;
  let savedRefId = '';

  try {
    // 1. Aadhaar Start: rejects if consent is false
    await testAsync('Aadhaar API start rejects when consent is false', async () => {
      const req = new NextRequest('http://localhost:3000/api/verifications/cashfree/aadhaar/start', {
        method: 'POST',
        body: JSON.stringify({
          workerId,
          aadhaarNumber: '123456789012',
          consent: false,
        }),
      });
      const res = await startAadhaarHandler(req);
      const data = await res.json();
      assert.strictEqual(res.status, 400);
      assert.strictEqual(data.success, false);
      assert(data.error.includes('Consent is required'));
    });

    // 2. Aadhaar Start: rejects invalid 12-digit Aadhaar
    await testAsync('Aadhaar API start rejects invalid Aadhaar length', async () => {
      const req = new NextRequest('http://localhost:3000/api/verifications/cashfree/aadhaar/start', {
        method: 'POST',
        body: JSON.stringify({
          workerId,
          aadhaarNumber: '12345',
          consent: true,
        }),
      });
      const res = await startAadhaarHandler(req);
      const data = await res.json();
      assert.strictEqual(res.status, 400);
      assert.strictEqual(data.success, false);
      assert(data.error.includes('12-digit'));
    });

    // 3. Aadhaar Start: success in sandbox mode
    await testAsync('Aadhaar API start generates OTP and stores OTP_SENT status', async () => {
      const req = new NextRequest('http://localhost:3000/api/verifications/cashfree/aadhaar/start', {
        method: 'POST',
        body: JSON.stringify({
          workerId,
          aadhaarNumber: '543287651234',
          consent: true,
        }),
      });
      const res = await startAadhaarHandler(req);
      const data = await res.json();
      assert.strictEqual(res.status, 200);
      assert.strictEqual(data.success, true);
      assert.strictEqual(data.status, 'OTP_SENT');
      assert(data.refId && data.refId.length > 5);
      savedRefId = data.refId;

      // Verify DB record
      const dbRec = await prisma.aadhaarVerification.findUnique({ where: { workerId } });
      assert.strictEqual(dbRec?.status, 'OTP_SENT');
      assert.strictEqual(dbRec?.refId, savedRefId);
    });

    // 4. Aadhaar Verify: rejects incorrect OTP
    await testAsync('Aadhaar API verify rejects incorrect OTP and updates status to FAILED', async () => {
      const req = new NextRequest('http://localhost:3000/api/verifications/cashfree/aadhaar/verify', {
        method: 'POST',
        body: JSON.stringify({
          workerId,
          refId: savedRefId,
          otp: '999999',
        }),
      });
      const res = await verifyAadhaarHandler(req);
      const data = await res.json();
      assert.strictEqual(res.status, 400);
      assert.strictEqual(data.success, false);
      assert.strictEqual(data.status, 'FAILED');

      const dbRec = await prisma.aadhaarVerification.findUnique({ where: { workerId } });
      assert.strictEqual(dbRec?.status, 'FAILED');
    });

    // 5. Aadhaar Verify: succeeds with valid sandbox OTP 123456
    await testAsync('Aadhaar API verify succeeds with valid OTP and stores masked Aadhaar', async () => {
      const req = new NextRequest('http://localhost:3000/api/verifications/cashfree/aadhaar/verify', {
        method: 'POST',
        body: JSON.stringify({
          workerId,
          refId: savedRefId,
          otp: '123456',
        }),
      });
      const res = await verifyAadhaarHandler(req);
      const data = await res.json();
      assert.strictEqual(res.status, 200);
      assert.strictEqual(data.success, true);
      assert.strictEqual(data.status, 'VERIFIED');
      assert.strictEqual(data.maskedAadhaar, 'XXXXXXXX8291');

      const dbRec = await prisma.aadhaarVerification.findUnique({ where: { workerId } });
      assert.strictEqual(dbRec?.status, 'VERIFIED');
      assert.strictEqual(dbRec?.maskedAadhaar, 'XXXXXXXX8291');
      assert(dbRec?.verifiedAt !== null);

      const worker = await prisma.workerProfile.findUnique({ where: { id: workerId } });
      assert.strictEqual(worker?.identityVerified, true);
    });

    // 6. Duplicate Aadhaar verification prevention
    await testAsync('Aadhaar API start prevents duplicate verification for verified worker', async () => {
      const req = new NextRequest('http://localhost:3000/api/verifications/cashfree/aadhaar/start', {
        method: 'POST',
        body: JSON.stringify({
          workerId,
          aadhaarNumber: '543287651234',
          consent: true,
        }),
      });
      const res = await startAadhaarHandler(req);
      const data = await res.json();
      assert.strictEqual(res.status, 200);
      assert.strictEqual(data.alreadyVerified, true);
      assert.strictEqual(data.status, 'VERIFIED');
      assert(data.message.includes('already verified'));
    });

    // 7. Bank Verify: rejects invalid IFSC
    await testAsync('Bank API verify rejects invalid IFSC format', async () => {
      const req = new NextRequest('http://localhost:3000/api/verifications/cashfree/bank/verify', {
        method: 'POST',
        body: JSON.stringify({
          workerId,
          accountHolderName: 'Vikram Singh',
          accountNumber: '12345678901',
          ifsc: 'INVALID0000',
        }),
      });
      const res = await verifyBankHandler(req);
      const data = await res.json();
      assert.strictEqual(res.status, 400);
      assert.strictEqual(data.success, false);
      assert.strictEqual(data.status, 'FAILED');
    });

    // 8. Bank Verify: succeeds with valid account and IFSC
    await testAsync('Bank API verify validates account, stores masked number and updates VERIFIED', async () => {
      const req = new NextRequest('http://localhost:3000/api/verifications/cashfree/bank/verify', {
        method: 'POST',
        body: JSON.stringify({
          workerId,
          accountHolderName: 'Vikram Singh',
          accountNumber: '987654321098',
          ifsc: 'SBIN0001824',
        }),
      });
      const res = await verifyBankHandler(req);
      const data = await res.json();
      assert.strictEqual(res.status, 200);
      assert.strictEqual(data.success, true);
      assert.strictEqual(data.status, 'VERIFIED');
      assert.strictEqual(data.maskedAccountNo, 'XXXXXXXX1098');

      const dbRec = await prisma.bankVerification.findUnique({ where: { workerId } });
      assert.strictEqual(dbRec?.status, 'VERIFIED');
      assert.strictEqual(dbRec?.maskedAccountNo, 'XXXXXXXX1098');
      assert(dbRec?.verifiedAt !== null);

      const worker = await prisma.workerProfile.findUnique({ where: { id: workerId } });
      assert.strictEqual(worker?.bankVerified, true);
    });

    // 9. Duplicate Bank verification prevention
    await testAsync('Bank API verify prevents duplicate verification for verified bank account', async () => {
      const req = new NextRequest('http://localhost:3000/api/verifications/cashfree/bank/verify', {
        method: 'POST',
        body: JSON.stringify({
          workerId,
          accountHolderName: 'Vikram Singh',
          accountNumber: '987654321098',
          ifsc: 'SBIN0001824',
        }),
      });
      const res = await verifyBankHandler(req);
      const data = await res.json();
      assert.strictEqual(res.status, 200);
      assert.strictEqual(data.alreadyVerified, true);
      assert.strictEqual(data.status, 'VERIFIED');
      assert(data.message.includes('already verified'));
    });

    // 10. Worker status synchronization
    await testAsync('Worker status sync marks profile VERIFIED when Aadhaar + Bank are completed', async () => {
      const categories = await prisma.category.findMany();
      if (categories.length > 0) {
        await prisma.workerProfile.update({
          where: { id: workerId },
          data: { primaryCategoryId: categories[0].id },
        });
      }

      const evalResult = await evaluateWorkerVerification(workerId);
      assert.strictEqual(evalResult.isAadhaarVerified, true);
      assert.strictEqual(evalResult.isBankVerified, true);
      assert.strictEqual(evalResult.isProfileComplete, true);
      assert.strictEqual(evalResult.status, 'VERIFIED');

      const syncedStatus = await syncWorkerVerificationStatus(workerId);
      assert.strictEqual(syncedStatus, 'VERIFIED');
    });
  } finally {
    // Clean up test worker from database
    try {
      await prisma.user.delete({ where: { id: testUser.id } });
    } catch {
      // Ignore cleanup error
    }
  }

  if (failed > 0) {
    throw new Error(`${failed} Cashfree verification tests failed!`);
  }

  return { passed, failed };
}
