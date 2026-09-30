import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

/**
 * UIDAI Certificate Management Utility (Server-Side Only)
 * 
 * Provides safe, server-only access to the official UIDAI X.509 Public Certificate
 * used to verify 2048-bit RSA digital signatures on Aadhaar Secure QR codes.
 * 
 * Security Guardrails:
 * - Server-side execution only (never exposed to browser client).
 * - Never logs raw certificate contents or public key strings.
 * - Reads from environment variable `UIDAI_CERT_PATH` or fallback filesystem paths.
 */

// Server-side guard
if (typeof window !== 'undefined') {
  throw new Error('UIDAI Certificate Utility can only be executed in a server-side environment.');
}

export interface UidaiCertDetails {
  subject: string;
  issuer: string;
  validFrom: string;
  validTo: string;
  serialNumber: string;
  fingerprint256: string;
  isExpired: boolean;
}

export class UidaiCertificateError extends Error {
  constructor(message: string) {
    super(`[UIDAI Certificate Error] ${message}`);
    this.name = 'UidaiCertificateError';
  }
}

/**
 * Resolves the absolute filesystem path for the UIDAI X.509 public certificate.
 */
export function getUidaiCertPath(): string {
  const configuredPath = process.env.UIDAI_CERT_PATH;
  
  if (configuredPath) {
    const resolvedPath = path.isAbsolute(configuredPath)
      ? configuredPath
      : path.join(process.cwd(), configuredPath);
    if (fs.existsSync(resolvedPath)) {
      return resolvedPath;
    }
  }

  // Preferred production location
  const defaultPath = path.join(process.cwd(), 'config', 'certificates', 'uidai_offline_publickey_2026.cer');
  if (fs.existsSync(defaultPath)) {
    return defaultPath;
  }

  // Root fallback location
  const rootFallback = path.join(process.cwd(), 'uidai_offline_publickey_2026.cer');
  if (fs.existsSync(rootFallback)) {
    return rootFallback;
  }

  throw new UidaiCertificateError(
    'UIDAI Public Certificate file not found. Ensure config/certificates/uidai_offline_publickey_2026.cer exists.'
  );
}

/**
 * Reads and parses the UIDAI X.509 Public Certificate.
 */
export function loadUidaiCertificate(): crypto.X509Certificate {
  const certPath = getUidaiCertPath();
  try {
    const certBuffer = fs.readFileSync(certPath);
    if (!certBuffer || certBuffer.length === 0) {
      throw new Error('Certificate file is empty.');
    }
    return new crypto.X509Certificate(certBuffer);
  } catch (err: any) {
    if (err instanceof UidaiCertificateError) {
      throw err;
    }
    throw new UidaiCertificateError(`Failed to load/parse X.509 certificate: ${err.message}`);
  }
}

/**
 * Extracts the UIDAI Public Key in SPKI PEM format for RSA signature verification.
 */
export function getUidaiPublicKeyPem(): string {
  const x509 = loadUidaiCertificate();
  return x509.publicKey.export({ type: 'spki', format: 'pem' }).toString();
}

/**
 * Extracts the UIDAI Public Key as a Node.js KeyObject.
 */
export function getUidaiPublicKeyObject(): crypto.KeyObject {
  const x509 = loadUidaiCertificate();
  return x509.publicKey;
}

/**
 * Returns non-sensitive certificate metadata and expiration status.
 */
export function getUidaiCertDetails(): UidaiCertDetails {
  const x509 = loadUidaiCertificate();
  const now = new Date();
  const validToDate = new Date(x509.validTo);
  const isExpired = now > validToDate;

  return {
    subject: x509.subject,
    issuer: x509.issuer,
    validFrom: x509.validFrom,
    validTo: x509.validTo,
    serialNumber: x509.serialNumber,
    fingerprint256: x509.fingerprint256,
    isExpired,
  };
}

/**
 * Validates that the UIDAI Public Certificate exists, can be parsed, and is not expired.
 */
export function validateUidaiCertificate(): {
  isValid: boolean;
  details?: UidaiCertDetails;
  error?: string;
} {
  try {
    const details = getUidaiCertDetails();
    if (details.isExpired) {
      return {
        isValid: false,
        details,
        error: `UIDAI Public Certificate has expired on ${details.validTo}.`,
      };
    }
    return {
      isValid: true,
      details,
    };
  } catch (err: any) {
    return {
      isValid: false,
      error: err.message || 'Unknown UIDAI certificate validation error.',
    };
  }
}
