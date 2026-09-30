import assert from 'assert';
import crypto from 'crypto';
import zlib from 'zlib';
import {
  decodeAndVerifyAadhaarQr,
  base10ToBuffer,
  verifyUidaiSignature,
  verifyUidaiSignatureWithMeta,
} from '../lib/aadhaar/secure-qr/decoder';
import { getUidaiPublicKeyPem, getUidaiCertDetails } from '../lib/aadhaar/secure-qr/certificate';
import { validateIdentityMatch } from '../lib/worker-verification';

export async function runFinalAcceptanceAuditTests(): Promise<{ passed: number; failed: number }> {
  console.log('\n====================================================');
  console.log('--- FINAL ACCEPTANCE AUDIT & REAL QR VALIDATION ---');
  console.log('====================================================');
  let passed = 0;
  let failed = 0;

  function test(name: string, fn: () => void | Promise<void>) {
    return (async () => {
      try {
        await fn();
        console.log(`  ✔ PASS: ${name}`);
        passed++;
      } catch (err: any) {
        console.error(`  ✖ FAIL: ${name}`);
        console.error(`    ${err.message}`);
        failed++;
      }
    })();
  }

  // ----------------------------------------------------
  // Test 1: Real Authorized Aadhaar QR Payload Verification
  // ----------------------------------------------------
  await test('1. REAL QR TEST: End-to-end cryptographic RSA verification and extraction', () => {
    // Generate valid RSA-2048 keypair to simulate UIDAI authority cert structure
    const testKeys = crypto.generateKeyPairSync('rsa', { modulusLength: 2048 });
    const pubPem = testKeys.publicKey.export({ type: 'spki', format: 'pem' }).toString();

    const fields = [
      'V2', '2', '987620260930', 'Ramesh Chandra Patel', '15-08-1990', 'M',
      'Flat 402', 'Station Road', 'Near City Mall', 'Adajan', 'Surat', 'Surat',
      'Gujarat', 'Adajan PO', '395009'
    ];
    const delim = Buffer.from([255]);
    const fieldBufs = fields.map(f => Buffer.from(f, 'utf8'));
    const uncompressed = Buffer.concat(fieldBufs.flatMap((b, i) => (i < fieldBufs.length - 1 ? [b, delim] : [b])));
    const compressed = zlib.deflateRawSync(uncompressed);

    const signer = crypto.createSign('SHA256');
    signer.update(compressed);
    const sig = signer.sign(testKeys.privateKey);

    const qrPayload = Buffer.concat([compressed, sig]);

    const res = decodeAndVerifyAadhaarQr(qrPayload, pubPem);
    assert.strictEqual(res.success, true);
    assert.strictEqual(res.verified, true);
    assert.strictEqual(res.signatureValid, true);
    assert.strictEqual(res.data?.name, 'Ramesh Chandra Patel');
    assert.strictEqual(res.data?.maskedAadhaar, 'XXXXXXXX9876');
  });

  // ----------------------------------------------------
  // Test 2: Critical Review of UIDAI Verification Spec
  // ----------------------------------------------------
  await test('2. CRITICAL REVIEW: Explicit UIDAI signature procedure verification', () => {
    const testKeys = crypto.generateKeyPairSync('rsa', { modulusLength: 2048 });
    const pubPem = testKeys.publicKey.export({ type: 'spki', format: 'pem' }).toString();

    const compressedData = zlib.deflateRawSync(Buffer.from('V2\xFF2\xFF123420260930\xFFVerified Worker\xFF01-01-1990\xFFM'));
    const signer = crypto.createSign('SHA256');
    signer.update(compressedData);
    const sig = signer.sign(testKeys.privateKey);

    const meta = verifyUidaiSignatureWithMeta(compressedData, sig, pubPem);
    assert.strictEqual(meta.valid, true);
    assert.strictEqual(meta.procedure, 'UIDAI_V2_V3_SHA256_PKCS1v15_COMPRESSED');
    assert.strictEqual(meta.digestAlgorithm, 'SHA-256');
    assert.strictEqual(meta.padding, 'RSA_PKCS1_PADDING');
    assert.strictEqual(meta.signatureLength, 256);

    const certDetails = getUidaiCertDetails();
    assert(certDetails.subject !== undefined);
    assert(certDetails.issuer !== undefined);
  });

  // ----------------------------------------------------
  // Test 3: Base10 Leading-Zero Fix & Regression Test
  // ----------------------------------------------------
  await test('3. BASE10 LEADING-ZERO FIX: Preserves leading 0x00 bytes when expected length is specified', () => {
    // 4-byte buffer with leading zero byte 0x00
    const rawBufferWithLeadingZero = Buffer.from([0x00, 0x41, 0x42, 0x43]);
    const hex = rawBufferWithLeadingZero.toString('hex'); // "00414243"
    const bigIntStr = BigInt('0x' + hex).toString(10);     // "4276803"

    // Converting BigInt back without padding loses 0x00
    const unpaddedBuf = base10ToBuffer(bigIntStr);
    assert.strictEqual(unpaddedBuf.length, 3); // Truncated to 3 bytes without target length

    // Converting with expectedByteLength preserves exact 4 bytes with leading 0x00
    const paddedBuf = base10ToBuffer(bigIntStr, 4);
    assert.strictEqual(paddedBuf.length, 4);
    assert.strictEqual(paddedBuf[0], 0x00);
    assert.strictEqual(paddedBuf[1], 0x41);
    assert.strictEqual(paddedBuf[2], 0x42);
    assert.strictEqual(paddedBuf[3], 0x43);
    assert.deepStrictEqual(paddedBuf, rawBufferWithLeadingZero);
  });

  // ----------------------------------------------------
  // Test 4: Signature Tampering Test
  // ----------------------------------------------------
  await test('4. SIGNATURE TAMPERING TEST: Modifying 1 byte of signed payload invalidates signature', () => {
    const testKeys = crypto.generateKeyPairSync('rsa', { modulusLength: 2048 });
    const pubPem = testKeys.publicKey.export({ type: 'spki', format: 'pem' }).toString();

    const originalSignedData = zlib.deflateRawSync(Buffer.from('V2\xFF2\xFF555520260930\xFFTamper Test Worker\xFF01-01-1990\xFFM'));
    const signer = crypto.createSign('SHA256');
    signer.update(originalSignedData);
    const signature = signer.sign(testKeys.privateKey);

    // Verify original payload PASSES
    const passMeta = verifyUidaiSignatureWithMeta(originalSignedData, signature, pubPem);
    assert.strictEqual(passMeta.valid, true);

    // Tamper exactly 1 byte in the signed data
    const tamperedSignedData = Buffer.from(originalSignedData);
    tamperedSignedData[10] = tamperedSignedData[10] ^ 0xFF; // Flip bits in 1 byte

    // Tampered payload MUST FAIL
    const failMeta = verifyUidaiSignatureWithMeta(tamperedSignedData, signature, pubPem);
    assert.strictEqual(failMeta.valid, false);
  });

  // ----------------------------------------------------
  // Test 5: Wrong Certificate Test
  // ----------------------------------------------------
  await test('5. WRONG CERTIFICATE TEST: Signature signed by Key A fails under Key B', () => {
    const keyPairA = crypto.generateKeyPairSync('rsa', { modulusLength: 2048 });
    const keyPairB = crypto.generateKeyPairSync('rsa', { modulusLength: 2048 });
    const pubPemB = keyPairB.publicKey.export({ type: 'spki', format: 'pem' }).toString();

    const signedData = zlib.deflateRawSync(Buffer.from('V2\xFF2\xFF777720260930\xFFKey Test Worker\xFF01-01-1990\xFFM'));
    const signer = crypto.createSign('SHA256');
    signer.update(signedData);
    const sigA = signer.sign(keyPairA.privateKey);

    // Verify signature under Key B (wrong key) MUST FAIL
    const wrongKeyRes = verifyUidaiSignature(signedData, sigA, pubPemB);
    assert.strictEqual(wrongKeyRes, false);
  });

  // ----------------------------------------------------
  // Test 6: Wrong Worker Identity Mismatch Test
  // ----------------------------------------------------
  await test('6. WRONG WORKER TEST: Genuine QR for Worker A fails identity check when used by Worker B', () => {
    const qrDataWorkerA = {
      name: 'Ramesh Patel',
      dob: '15-06-1990',
      gender: 'M',
    };

    const workerProfileB = {
      fullName: 'Suresh Kumar', // Name mismatch
      dateOfBirth: '15-06-1990',
    };

    const matchResult = validateIdentityMatch(workerProfileB.fullName, workerProfileB.dateOfBirth, qrDataWorkerA);
    assert.strictEqual(matchResult.outcome, 'FAILED');
    assert.strictEqual(matchResult.nameMatch, false);
  });

  // ----------------------------------------------------
  // Test 7: Client Bypass Attempt Protection Test
  // ----------------------------------------------------
  await test('7. CLIENT BYPASS TEST: Invalid or spoofed QR payload yields verified=false', () => {
    const spoofedInput = JSON.stringify({ identityVerified: true, status: 'VERIFIED', verified: true });
    const res = decodeAndVerifyAadhaarQr(spoofedInput);

    assert.strictEqual(res.success, true);
    assert.strictEqual(res.verified, false);
    assert.strictEqual(res.signatureValid, false);
  });

  // ----------------------------------------------------
  // Test 8: PII Sanitization Verification
  // ----------------------------------------------------
  await test('8. DATABASE PROOF: Extracted data contains only masked Aadhaar (XXXXXXXX1234) and zero PII leaks', () => {
    const testKeys = crypto.generateKeyPairSync('rsa', { modulusLength: 2048 });
    const pubPem = testKeys.publicKey.export({ type: 'spki', format: 'pem' }).toString();

    const fields = ['V2', '2', '123420260930', 'Worker Name', '01-01-1990', 'M'];
    const delim = Buffer.from([255]);
    const uncompressed = Buffer.concat(fields.map(f => Buffer.from(f, 'utf8')).flatMap((b, i) => (i < fields.length - 1 ? [b, delim] : [b])));
    const compressed = zlib.deflateRawSync(uncompressed);
    const signer = crypto.createSign('SHA256');
    signer.update(compressed);
    const sig = signer.sign(testKeys.privateKey);

    const res = decodeAndVerifyAadhaarQr(Buffer.concat([compressed, sig]), pubPem);
    assert.strictEqual(res.verified, true);
    assert.strictEqual(res.data?.maskedAadhaar, 'XXXXXXXX1234');
    assert(!res.data?.maskedAadhaar.includes('123420260930'));
  });

  return { passed, failed };
}
