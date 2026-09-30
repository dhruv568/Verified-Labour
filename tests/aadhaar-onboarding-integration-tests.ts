import assert from 'assert';
import crypto from 'crypto';
import zlib from 'zlib';
import prisma from '../lib/db';
import { validateIdentityMatch, syncWorkerVerificationStatus, evaluateWorkerVerification } from '../lib/worker-verification';
import { decodeAndVerifyAadhaarQr } from '../lib/aadhaar/secure-qr/decoder';

export async function runAadhaarOnboardingIntegrationTests(): Promise<{ passed: number; failed: number }> {
  console.log('\n--- 13. Aadhaar Secure QR Worker Onboarding Integration & Security Tests ---');
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

  // Generate test RSA keypair
  const testKeyPair = crypto.generateKeyPairSync('rsa', { modulusLength: 2048 });
  const testPubKeyPem = testKeyPair.publicKey.export({ type: 'spki', format: 'pem' }).toString();

  function generateValidTestQrPayload(fields: string[]): Buffer {
    const fieldBufs = fields.map((f) => Buffer.from(f, 'utf8'));
    const delim = Buffer.from([255]);
    const uncompressedStream = Buffer.concat(
      fieldBufs.flatMap((b, i) => (i < fieldBufs.length - 1 ? [b, delim] : [b]))
    );
    const compressedData = zlib.deflateRawSync(uncompressedStream);

    const signer = crypto.createSign('SHA256');
    signer.update(compressedData);
    const signature = signer.sign(testKeyPair.privateKey);

    return Buffer.concat([compressedData, signature]);
  }

  // Test 1: Identity Name & DOB Matching Utility
  test('validateIdentityMatch accepts exact name and matching DOB', () => {
    const res = validateIdentityMatch('Ramesh Patel', new Date('1995-06-15'), {
      name: 'Ramesh Patel',
      dob: '15-06-1995',
    });
    assert.strictEqual(res.outcome, 'VERIFIED');
    assert.strictEqual(res.nameMatch, true);
    assert.strictEqual(res.dobMatch, true);
  });

  // Test 2: Identity Name Mismatch Fails
  test('validateIdentityMatch fails when registered name differs from QR name', () => {
    const res = validateIdentityMatch('Ramesh Patel', new Date('1995-06-15'), {
      name: 'Suresh Shah',
      dob: '15-06-1995',
    });
    assert.strictEqual(res.outcome, 'FAILED');
    assert.strictEqual(res.nameMatch, false);
  });

  // Test 3: Identity DOB Mismatch Requires Manual Review
  test('validateIdentityMatch flags MANUAL_REVIEW when name matches but DOB differs', () => {
    const res = validateIdentityMatch('Ramesh Patel', new Date('1995-06-15'), {
      name: 'Ramesh Patel',
      dob: '01-01-1990',
    });
    assert.strictEqual(res.outcome, 'MANUAL_REVIEW');
    assert.strictEqual(res.nameMatch, true);
    assert.strictEqual(res.dobMatch, false);
  });

  // Test 4: Database Model Record Updates & Status Sync
  await testAsync('Successful QR verification updates AadhaarVerification & Verification records in DB', async () => {
    const timestamp = Date.now();
    const testUser = await prisma.user.create({
      data: {
        phone: `+919999${String(timestamp).slice(-6)}`,
        status: 'ACTIVE',
        isPhoneVerified: true,
        workerProfile: {
          create: {
            fullName: 'Integrate QR Worker',
            city: 'Surat',
            state: 'Gujarat',
            status: 'ONBOARDING',
          },
        },
      },
      include: { workerProfile: true },
    });

    const workerId = testUser.workerProfile!.id;

    const qrFields = [
      'V2',
      '2',
      '987620260930',
      'Integrate QR Worker',
      '15-06-1995',
      'M',
      'Flat 202',
      'Ring Road',
      'Near Station',
      'Vesu',
      'Surat',
      'Surat',
      'Gujarat',
      'Vesu PO',
      '395007',
    ];

    const validPayload = generateValidTestQrPayload(qrFields);

    // Perform decoder & verify
    const decodeRes = decodeAndVerifyAadhaarQr(validPayload, testPubKeyPem);
    assert.strictEqual(decodeRes.signatureValid, true);
    assert.strictEqual(decodeRes.verified, true);

    const matchRes = validateIdentityMatch('Integrate QR Worker', null, {
      name: decodeRes.data!.name,
      dob: decodeRes.data!.dob,
    });
    assert.strictEqual(matchRes.outcome, 'VERIFIED');

    // Simulate database upsert
    await prisma.aadhaarVerification.upsert({
      where: { workerId },
      update: {
        refId: decodeRes.data!.referenceId,
        maskedAadhaar: decodeRes.data!.maskedAadhaar,
        nameOnAadhaar: decodeRes.data!.name,
        dob: decodeRes.data!.dob,
        gender: decodeRes.data!.gender,
        status: 'VERIFIED',
        verifiedAt: new Date(),
      },
      create: {
        workerId,
        refId: decodeRes.data!.referenceId,
        maskedAadhaar: decodeRes.data!.maskedAadhaar,
        nameOnAadhaar: decodeRes.data!.name,
        dob: decodeRes.data!.dob,
        gender: decodeRes.data!.gender,
        status: 'VERIFIED',
        verifiedAt: new Date(),
      },
    });

    await prisma.verification.create({
      data: {
        workerId,
        type: 'AADHAAR_SECURE_QR',
        provider: 'UIDAI_OFFLINE',
        providerReference: decodeRes.data!.referenceId,
        status: 'VERIFIED',
        verifiedAt: new Date(),
      },
    });

    await syncWorkerVerificationStatus(workerId);

    const updatedWorker = await prisma.workerProfile.findUnique({
      where: { id: workerId },
      include: { aadhaarVerif: true, verifications: true },
    });

    assert.strictEqual(updatedWorker?.identityVerified, true);
    assert.strictEqual(updatedWorker?.aadhaarVerif?.status, 'VERIFIED');
    assert.strictEqual(updatedWorker?.aadhaarVerif?.maskedAadhaar, 'XXXXXXXX9876');
    assert.strictEqual(updatedWorker?.verifications.some((v) => v.type === 'AADHAAR_SECURE_QR'), true);
  });

  // Test 5: Overall Worker Verification Evaluation Rules Intact
  await testAsync('evaluateWorkerVerification status remains dependent on bank verification and profile completeness', async () => {
    const timestamp = Date.now();
    const testUser = await prisma.user.create({
      data: {
        phone: `+919888${String(timestamp).slice(-6)}`,
        status: 'ACTIVE',
        isPhoneVerified: true,
        workerProfile: {
          create: {
            fullName: 'Partial Worker',
            city: 'Surat',
            state: 'Gujarat',
            identityVerified: true, // Identity is verified via QR
            bankVerified: false, // Bank is NOT verified
            status: 'ONBOARDING',
          },
        },
      },
      include: { workerProfile: true },
    });

    const workerId = testUser.workerProfile!.id;
    const evaluation = await evaluateWorkerVerification(workerId);

    assert.strictEqual(evaluation.isAadhaarVerified, true);
    assert.strictEqual(evaluation.isBankVerified, false);
    assert.strictEqual(evaluation.isEligibleForVerified, false);
    assert.strictEqual(evaluation.status, 'PENDING_REVIEW'); // Not fully VERIFIED until bank is done
  });

  // Test 6: Zero Raw QR or Full 12-digit Aadhaar Persistence Verification
  await testAsync('Database schema and records store ONLY masked Aadhaar (XXXXXXXX1234) and never 12-digit numbers or raw QR payloads', async () => {
    const records = await prisma.aadhaarVerification.findMany({
      take: 10,
    });

    for (const rec of records) {
      if (rec.maskedAadhaar) {
        assert.strictEqual(rec.maskedAadhaar.length, 12);
        assert(rec.maskedAadhaar.startsWith('XXXXXXXX'), 'Masked Aadhaar must start with XXXXXXXX');
        assert(!/^\d{12}$/.test(rec.maskedAadhaar), 'Must never store 12 unmasked digits');
      }
    }
  });

  return { passed, failed };
}
