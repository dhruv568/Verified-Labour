import assert from 'assert';
import crypto from 'crypto';
import zlib from 'zlib';
import { runAadhaarQrDiagnostics } from '../lib/aadhaar/secure-qr/diagnostic';
import { loadUidaiCertificate } from '../lib/aadhaar/secure-qr/certificate';

export async function runAadhaarDiagnosticTests(): Promise<{ passed: number; failed: number }> {
  console.log('\n--- 14. Aadhaar Secure QR Diagnostic Engine & Crypto Branch Tests ---');
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

  // Generate test RSA Key Pair matching UIDAI spec
  const testKeyPair = crypto.generateKeyPairSync('rsa', { modulusLength: 2048 });
  const testPubKeyPem = testKeyPair.publicKey.export({ type: 'spki', format: 'pem' }).toString();

  function generateSyntheticPayload(fields: string[]): Buffer {
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

  // Test 1: Synthetic Valid Payload Format Classification
  test('A) Diagnostic Engine classifies synthetic valid Secure QR payload format', () => {
    const fields = [
      'V2',
      '1',
      '123420260930',
      'Diagnostic Worker',
      '01-01-1990',
      'M',
      'House 10',
      'Main Street',
      'Landmark',
      'Locality',
      'VTC',
      'District',
      'State',
      'PO',
      '395007',
    ];
    const validBuf = generateSyntheticPayload(fields);

    const report = runAadhaarQrDiagnostics(validBuf);
    assert.strictEqual(report.bufferLength, validBuf.length);
    assert.strictEqual(report.decompression.isDeflateRawValid, true);
    assert.strictEqual(report.formatClassification.isDelimiter255V2V3, true);
    assert(report.cryptographicAudit.extractedSignatureLength === 256);
  });

  // Test 2: Synthetic Invalid Signature Audit
  test('B) Diagnostic Engine flags signature failure for tampered/invalid signature', () => {
    const fields = ['V2', '1', '123420260930', 'Tampered Worker'];
    const validBuf = generateSyntheticPayload(fields);
    
    // Corrupt last 10 bytes of signature
    const corruptBuf = Buffer.from(validBuf);
    for (let i = corruptBuf.length - 10; i < corruptBuf.length; i++) {
      corruptBuf[i] = corruptBuf[i] ^ 0xff;
    }

    const report = runAadhaarQrDiagnostics(corruptBuf);
    assert.strictEqual(report.cryptographicAudit.matchedStrategies.length, 0);
    assert.strictEqual(report.cryptographicAudit.signatureValid, false);
  });

  // Test 3: Public Certificate Validation & Fingerprint Audit
  test('C) UIDAI Certificate details loaded safely without PII exposure', () => {
    const cert = loadUidaiCertificate();
    assert(cert.subject.includes('UNIQUE IDENTIFICATION AUTHORITY OF INDIA') || cert.subject.includes('UIDAI'));
    assert(cert.validTo !== undefined);
  });

  // Test 4: Privacy Guard Guarantee in Diagnostic Reports
  test('Diagnostic report output never exposes unmasked Aadhaar or raw PII keys', () => {
    const reportStr = JSON.stringify(runAadhaarQrDiagnostics(Buffer.from('test_payload_string')));
    assert(!reportStr.includes('fullAadhaar'), 'Must not contain fullAadhaar key');
    assert(!reportStr.includes('photoBase64'), 'Must not contain raw photo bytes');
  });

  return { passed, failed };
}
