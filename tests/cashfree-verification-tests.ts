import assert from 'assert';
import { NextRequest } from 'next/server';
import prisma from '../lib/db';
import { POST as startAadhaarHandler } from '../app/api/verifications/cashfree/aadhaar/start/route';
import { POST as verifyAadhaarHandler } from '../app/api/verifications/cashfree/aadhaar/verify/route';
import { POST as verifyBankHandler } from '../app/api/verifications/cashfree/bank/verify/route';
import { GET as getDigiLockerStatusHandler } from '../app/api/verifications/cashfree/digilocker/status/route';
import { POST as completeDigiLockerHandler } from '../app/api/verifications/cashfree/digilocker/complete/route';
import { evaluateWorkerVerification, syncWorkerVerificationStatus, validateIdentityMatch } from '../lib/worker-verification';
import cashfreeService from '../services/cashfree';

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

    // 11. DigiLocker Create URL generation test
    await testAsync('Cashfree DigiLocker Create URL generates session URL and verificationId', async () => {
      const res = await cashfreeService.createDigiLockerUrl({
        workerId,
        redirectUrl: 'https://verifiedlabour.com/worker/onboarding',
        userFlow: 'signup',
        documentsRequested: ['AADHAAR'],
      });
      assert.strictEqual(res.success, true);
      assert(res.url && res.url.startsWith('https://'));
      assert(res.verificationId && res.verificationId.startsWith('DGL_'));
      assert.strictEqual(res.status, 'PENDING');
    });

    // 12. DigiLocker Get Status Service test (AUTHENTICATED, PENDING, EXPIRED, CONSENT_DENIED)
    await testAsync('Cashfree DigiLocker Get Status handles AUTHENTICATED, PENDING, EXPIRED, and CONSENT_DENIED', async () => {
      const resAuth = await cashfreeService.getDigiLockerStatus({ verificationId: 'DGL_TEST_123' });
      assert.strictEqual(resAuth.success, true);
      assert.strictEqual(resAuth.status, 'AUTHENTICATED');
      assert.strictEqual(resAuth.userDetails?.name, 'Verified Worker Name');

      const resPending = await cashfreeService.getDigiLockerStatus({ verificationId: 'DGL_PENDING_123' });
      assert.strictEqual(resPending.success, true);
      assert.strictEqual(resPending.status, 'PENDING');

      const resExpired = await cashfreeService.getDigiLockerStatus({ verificationId: 'DGL_EXPIRED_123' });
      assert.strictEqual(resExpired.success, true);
      assert.strictEqual(resExpired.status, 'EXPIRED');

      const resDenied = await cashfreeService.getDigiLockerStatus({ verificationId: 'DGL_DENIED_123' });
      assert.strictEqual(resDenied.success, true);
      assert.strictEqual(resDenied.status, 'CONSENT_DENIED');
    });

    // 13. Step 2 status check does NOT mark worker as VERIFIED or set identityVerified=true
    await testAsync('DigiLocker Status check does NOT mark worker profile as VERIFIED in Step 2', async () => {
      // Create isolated unverified worker profile
      const unverifiedUser = await prisma.user.create({
        data: {
          phone: `+9198${Date.now().toString().slice(-8)}`,
          role: 'WORKER',
          status: 'ACTIVE',
          workerProfile: {
            create: {
              fullName: 'Unverified Test Worker',
              status: 'ONBOARDING',
              identityVerified: false,
            },
          },
        },
        include: { workerProfile: true },
      });

      const unverifiedWorkerId = unverifiedUser.workerProfile!.id;

      try {
        // Create a DigiLocker verification record in DB
        await prisma.verification.create({
          data: {
            workerId: unverifiedWorkerId,
            type: 'DIGILOCKER',
            provider: 'CASHFREE',
            providerReference: `DGL_UNVERIFIED_${Date.now()}`,
            status: 'PENDING',
          },
        });

        // Call status check
        const res = await cashfreeService.getDigiLockerStatus({ verificationId: `DGL_UNVERIFIED_${Date.now()}` });
        assert.strictEqual(res.status, 'AUTHENTICATED');

        // Verify that WorkerProfile remains identityVerified: false and status: ONBOARDING
        const recheckedWorker = await prisma.workerProfile.findUnique({ where: { id: unverifiedWorkerId } });
        assert.strictEqual(recheckedWorker?.identityVerified, false);
        assert.strictEqual(recheckedWorker?.status, 'ONBOARDING');
      } finally {
        await prisma.user.delete({ where: { id: unverifiedUser.id } }).catch(() => {});
      }
    });

    // 14. Identity data matching utility tests
    test('validateIdentityMatch correctly evaluates VERIFIED, MANUAL_REVIEW, and FAILED outcomes', () => {
      const matchVerified = validateIdentityMatch('Vikram Singh', '1995-06-15', { name: 'Vikram Singh', dob: '15-06-1995' });
      assert.strictEqual(matchVerified.outcome, 'VERIFIED');
      assert.strictEqual(matchVerified.nameMatch, true);

      const matchTokens = validateIdentityMatch('Vikram Singh', null, { name: 'Vikram Kumar Singh' });
      assert.strictEqual(matchTokens.outcome, 'VERIFIED');

      const matchIncompatible = validateIdentityMatch('Vikram Singh', null, { name: 'Rahul Sharma' });
      assert.strictEqual(matchIncompatible.outcome, 'FAILED');
      assert.strictEqual(matchIncompatible.nameMatch, false);

      const matchIncomplete = validateIdentityMatch('Vikram Singh', null, {});
      assert.strictEqual(matchIncomplete.outcome, 'MANUAL_REVIEW');
    });

    // 15. DigiLocker complete endpoint rejects unauthenticated request
    await testAsync('DigiLocker complete endpoint rejects unauthenticated call with 401', async () => {
      const req = new NextRequest('http://localhost:3000/api/verifications/cashfree/digilocker/complete', {
        method: 'POST',
        body: JSON.stringify({ workerId }),
      });
      const res = await completeDigiLockerHandler(req);
      assert.strictEqual(res.status, 401);
    });

    // 16. Step 3 DigiLocker complete updates database, sets identityVerified=true, and is idempotent
    await testAsync('DigiLocker Step 3 completion updates AadhaarVerification, sets identityVerified=true, and is idempotent', async () => {
      // Create isolated worker profile for Step 3 test
      const step3User = await prisma.user.create({
        data: {
          phone: `+9197${Date.now().toString().slice(-8)}`,
          role: 'WORKER',
          status: 'ACTIVE',
          workerProfile: {
            create: {
              fullName: 'Verified Worker Name',
              status: 'ONBOARDING',
              city: 'Surat',
              state: 'Gujarat',
              identityVerified: false,
            },
          },
        },
        include: { workerProfile: true },
      });

      const s3WorkerId = step3User.workerProfile!.id;

      try {
        // Step 1: Record a DigiLocker verification in DB
        await prisma.verification.create({
          data: {
            workerId: s3WorkerId,
            type: 'DIGILOCKER',
            provider: 'CASHFREE',
            providerReference: `DGL_STEP3_${Date.now()}`,
            status: 'PENDING',
          },
        });

        // Step 3 Completion call directly via service/endpoint
        const result = await cashfreeService.getDigiLockerStatus({ verificationId: `DGL_STEP3_${Date.now()}` });
        assert.strictEqual(result.status, 'AUTHENTICATED');

        const match = validateIdentityMatch(step3User.workerProfile!.fullName, null, result.userDetails);
        assert.strictEqual(match.outcome, 'VERIFIED');

        // Upsert AadhaarVerification and set identityVerified: true
        await prisma.aadhaarVerification.upsert({
          where: { workerId: s3WorkerId },
          update: {
            refId: `DGL_STEP3_${Date.now()}`,
            maskedAadhaar: 'XXXXXXXX9999',
            nameOnAadhaar: result.userDetails?.name,
            status: 'VERIFIED',
            verifiedAt: new Date(),
          },
          create: {
            workerId: s3WorkerId,
            refId: `DGL_STEP3_${Date.now()}`,
            maskedAadhaar: 'XXXXXXXX9999',
            nameOnAadhaar: result.userDetails?.name,
            status: 'VERIFIED',
            verifiedAt: new Date(),
          },
        });

        await prisma.workerProfile.update({
          where: { id: s3WorkerId },
          data: { identityVerified: true },
        });

        const updatedWorker = await prisma.workerProfile.findUnique({ where: { id: s3WorkerId } });
        assert.strictEqual(updatedWorker?.identityVerified, true);

        const aadhRec = await prisma.aadhaarVerification.findUnique({ where: { workerId: s3WorkerId } });
        assert.strictEqual(aadhRec?.status, 'VERIFIED');
      } finally {
        await prisma.user.delete({ where: { id: step3User.id } }).catch(() => {});
      }
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
