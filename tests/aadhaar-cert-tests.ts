import assert from 'assert';
import fs from 'fs';
import crypto from 'crypto';
import {
  getUidaiCertPath,
  loadUidaiCertificate,
  getUidaiPublicKeyPem,
  getUidaiPublicKeyObject,
  getUidaiCertDetails,
  validateUidaiCertificate,
} from '../lib/aadhaar/secure-qr/certificate';

export async function runAadhaarCertTests(): Promise<{ passed: number; failed: number }> {
  console.log('\n--- 10. UIDAI Secure QR Public Certificate Foundation Tests ---');
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

  // Test 1: Certificate File Existence
  test('UIDAI Public Certificate file exists at expected path', () => {
    const certPath = getUidaiCertPath();
    assert(fs.existsSync(certPath), `Certificate file not found at: ${certPath}`);
    const stats = fs.statSync(certPath);
    assert(stats.size > 500, `Certificate file is suspiciously small (${stats.size} bytes).`);
  });

  // Test 2: Certificate Parsing as X.509
  test('UIDAI Certificate can be parsed as a valid X.509 certificate', () => {
    const x509 = loadUidaiCertificate();
    assert(x509 instanceof crypto.X509Certificate, 'Expected instance of crypto.X509Certificate');
    assert(x509.subject.includes('UNIQUE IDENTIFICATION AUTHORITY OF INDIA'), 'Subject should match UIDAI authority');
  });

  // Test 3: Public Key Extraction
  test('UIDAI Certificate contains a valid RSA Public Key', () => {
    const pubKeyPem = getUidaiPublicKeyPem();
    assert(pubKeyPem.startsWith('-----BEGIN PUBLIC KEY-----'), 'Public Key PEM must start with header');
    assert(pubKeyPem.endsWith('-----END PUBLIC KEY-----\n') || pubKeyPem.endsWith('-----END PUBLIC KEY-----'), 'Public Key PEM must end with footer');

    const keyObj = getUidaiPublicKeyObject();
    assert.strictEqual(keyObj.type, 'public', 'Exported key must be a public key');
    assert.strictEqual(keyObj.asymmetricKeyType, 'rsa', 'UIDAI Key must be an RSA key');
  });

  // Test 4: Expiry Information & Validation
  test('UIDAI Certificate expiry information and validation details can be read', () => {
    const details = getUidaiCertDetails();
    assert(details.subject.length > 0, 'Subject details must not be empty');
    assert(details.issuer.length > 0, 'Issuer details must not be empty');
    assert(details.validFrom.length > 0, 'ValidFrom date string must be present');
    assert(details.validTo.length > 0, 'ValidTo date string must be present');
    assert.strictEqual(details.isExpired, false, 'UIDAI certificate for 2026 should not be expired');

    const validation = validateUidaiCertificate();
    assert.strictEqual(validation.isValid, true, `Validation failed: ${validation.error}`);
    assert(validation.details !== undefined, 'Validation result must include cert details');
  });

  return { passed, failed };
}
