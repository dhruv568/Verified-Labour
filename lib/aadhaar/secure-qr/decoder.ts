import zlib from 'zlib';
import crypto from 'crypto';
import { getUidaiPublicKeyPem, getUidaiPublicKeyObject } from './certificate';

/**
 * UIDAI Secure QR Code Decoder & Cryptographic Verifier (Server-Side Only)
 * 
 * Implements UIDAI Secure QR Code specification (V2/V3):
 * 1. Payload validation (size & formatting bounds)
 * 2. BigInteger / Base-10 / Base64 / Binary byte conversion
 * 3. Raw Deflate / GZIP decompression
 * 4. Delimiter-separated binary field parsing (Byte 255 / 0xFF)
 * 5. RSA-2048 SHA-256 digital signature validation using UIDAI Public Certificate
 * 6. Sanitized data extraction (Name, DOB, Gender, Address, Masked Aadhaar)
 * 
 * Security Guardrails:
 * - Server-side execution only.
 * - Maximum payload size limit (15 KB) to prevent DoS/decompression bomb attacks.
 * - Zero raw QR payload logging.
 * - Zero 12-digit Aadhaar number logging or storage.
 */

if (typeof window !== 'undefined') {
  throw new Error('UIDAI Secure QR Decoder can only be executed on the server side.');
}

export const MAX_QR_PAYLOAD_BYTES = 15360; // 15 KB limit

export interface AadhaarQrAddress {
  house?: string;
  street?: string;
  landmark?: string;
  locality?: string;
  vtc?: string;
  district?: string;
  state?: string;
  postOffice?: string;
  pincode?: string;
}

export interface AadhaarQrExtractedData {
  referenceId: string;
  name: string;
  dob: string;
  gender: string;
  maskedAadhaar: string;
  address: AadhaarQrAddress;
  photoBase64?: string;
  version?: string;
}

export interface AadhaarQrDecodeResult {
  success: boolean;
  verified: boolean;
  signatureValid: boolean;
  data?: AadhaarQrExtractedData;
  error?: string;
}

/**
 * Converts a base-10 numeric string (BigInt representation of QR bytes) into a Node.js Buffer.
 */
export function base10ToBuffer(numericStr: string): Buffer {
  const cleanStr = numericStr.trim();
  if (!/^\d+$/.test(cleanStr)) {
    throw new Error('Input is not a valid base-10 numeric string.');
  }

  const bigInt = BigInt(cleanStr);
  let hex = bigInt.toString(16);
  if (hex.length % 2 !== 0) {
    hex = '0' + hex;
  }
  return Buffer.from(hex, 'hex');
}

/**
 * Safely parses input payload (Base10 string, Base64 string, or raw Buffer) into a byte Buffer.
 */
export function parseRawPayloadToBuffer(rawPayload: string | Buffer): Buffer {
  if (Buffer.isBuffer(rawPayload)) {
    if (rawPayload.length > MAX_QR_PAYLOAD_BYTES) {
      throw new Error(`Payload size exceeds maximum allowed limit of ${MAX_QR_PAYLOAD_BYTES} bytes.`);
    }
    return rawPayload;
  }

  if (typeof rawPayload !== 'string') {
    throw new Error('Payload must be a string or Buffer.');
  }

  const trimmed = rawPayload.trim();
  if (!trimmed) {
    throw new Error('Payload is empty.');
  }

  if (trimmed.length > MAX_QR_PAYLOAD_BYTES * 2) {
    throw new Error(`Payload size exceeds maximum allowed limit of ${MAX_QR_PAYLOAD_BYTES} bytes.`);
  }

  // 1. Check if base-10 integer string
  if (/^\d+$/.test(trimmed)) {
    return base10ToBuffer(trimmed);
  }

  // 2. Check if Base64 string
  try {
    const b64Buf = Buffer.from(trimmed, 'base64');
    if (b64Buf.length > 0 && (b64Buf.toString('base64') === trimmed || trimmed.endsWith('='))) {
      return b64Buf;
    }
  } catch {}

  // 3. Fallback: treat as raw binary string Buffer
  return Buffer.from(trimmed, 'binary');
}

/**
 * Decompresses raw QR binary byte payload using ZLIB Inflate or GZIP.
 */
export function decompressQrBytes(compressedBytes: Buffer): Buffer {
  try {
    // Try raw deflate inflate first (UIDAI standard with nowrap = true)
    return zlib.inflateRawSync(compressedBytes);
  } catch (err1) {
    try {
      // Try standard zlib inflate
      return zlib.inflateSync(compressedBytes);
    } catch (err2) {
      try {
        // Try gzip gunzip
        return zlib.gunzipSync(compressedBytes);
      } catch (err3) {
        // Return original buffer if already uncompressed
        return compressedBytes;
      }
    }
  }
}

/**
 * Splits a decompressed byte buffer by delimiter byte 255 (0xFF).
 */
export function splitBufferByDelimiter(buffer: Buffer, delimiter: number = 255): Buffer[] {
  const parts: Buffer[] = [];
  let start = 0;

  for (let i = 0; i < buffer.length; i++) {
    if (buffer[i] === delimiter) {
      parts.push(buffer.subarray(start, i));
      start = i + 1;
    }
  }

  if (start <= buffer.length) {
    parts.push(buffer.subarray(start));
  }

  return parts;
}

/**
 * Validates RSA-2048 SHA-256 digital signature against signed data bytes using UIDAI Public Key.
 */
export function verifyUidaiSignature(
  signedDataBytes: Buffer,
  signatureBytes: Buffer,
  publicKeyPemOrObj?: string | crypto.KeyObject
): boolean {
  try {
    if (!signatureBytes || signatureBytes.length !== 256) {
      return false;
    }

    const key = publicKeyPemOrObj || getUidaiPublicKeyPem();
    const verifier = crypto.createVerify('SHA256');
    verifier.update(signedDataBytes);
    return verifier.verify(key, signatureBytes);
  } catch {
    return false;
  }
}

/**
 * Extracts masked Aadhaar display string (e.g. XXXXXXXX4321) from Reference ID.
 */
export function extractMaskedAadhaarFromRefId(refId: string): string {
  const digits = refId.replace(/\D/g, '');
  if (digits.length >= 4) {
    const last4 = digits.slice(0, 4);
    return `XXXXXXXX${last4}`;
  }
  return 'XXXXXXXX0000';
}

/**
 * Core Decoder Function: Accepts QR Payload string or Buffer, verifies signature, and extracts demographic data.
 */
export function decodeAndVerifyAadhaarQr(
  rawInput: string | Buffer,
  overridePublicKeyPem?: string
): AadhaarQrDecodeResult {
  try {
    // 1. Input parsing & size bounds check
    const rawBuffer = parseRawPayloadToBuffer(rawInput);

    if (rawBuffer.length < 260) {
      return {
        success: true,
        verified: false,
        signatureValid: false,
        error: 'Payload size too small to contain UIDAI signature.',
      };
    }

    // 2. Separate 256-byte signature from signed data
    const signatureBytes = rawBuffer.subarray(rawBuffer.length - 256);
    const signedDataBytes = rawBuffer.subarray(0, rawBuffer.length - 256);

    // 3. Cryptographic RSA-2048 SHA-256 signature verification
    const publicKey = overridePublicKeyPem || getUidaiPublicKeyPem();
    const isSignatureValid = verifyUidaiSignature(signedDataBytes, signatureBytes, publicKey);

    if (!isSignatureValid) {
      return {
        success: true,
        verified: false,
        signatureValid: false,
        error: 'UIDAI digital signature verification failed.',
      };
    }

    // 4. Decompress signed data payload
    const decompressed = decompressQrBytes(signedDataBytes);
    const parts = splitBufferByDelimiter(decompressed, 255);

    // 5. Extract fields based on UIDAI V2/V3 spec
    // Format: Version, Email/Mobile Present, RefId, Name, DOB, Gender, House, Street, Landmark, Locality, VTC, District, State, PostOffice, Pincode, MobileHash, ImageBytes
    const version = parts[0]?.toString('utf8').trim() || 'V2';
    const refId = parts[2]?.toString('utf8').trim() || parts[0]?.toString('utf8').trim() || '';
    const name = parts[3]?.toString('utf8').trim() || parts[1]?.toString('utf8').trim() || '';
    const dob = parts[4]?.toString('utf8').trim() || parts[2]?.toString('utf8').trim() || '';
    const gender = parts[5]?.toString('utf8').trim() || parts[3]?.toString('utf8').trim() || '';

    const house = parts[6]?.toString('utf8').trim() || '';
    const street = parts[7]?.toString('utf8').trim() || '';
    const landmark = parts[8]?.toString('utf8').trim() || '';
    const locality = parts[9]?.toString('utf8').trim() || '';
    const vtc = parts[10]?.toString('utf8').trim() || '';
    const district = parts[11]?.toString('utf8').trim() || '';
    const state = parts[12]?.toString('utf8').trim() || '';
    const postOffice = parts[13]?.toString('utf8').trim() || '';
    const pincode = parts[14]?.toString('utf8').trim() || '';

    // Extract photo image bytes if available
    let photoBase64: string | undefined;
    if (parts.length > 15 && parts[15] && parts[15].length > 100) {
      photoBase64 = `data:image/jp2;base64,${parts[15].toString('base64')}`;
    }

    const maskedAadhaar = extractMaskedAadhaarFromRefId(refId);

    const extractedData: AadhaarQrExtractedData = {
      referenceId: refId,
      name,
      dob,
      gender,
      maskedAadhaar,
      address: {
        house,
        street,
        landmark,
        locality,
        vtc,
        district,
        state,
        postOffice,
        pincode,
      },
      photoBase64,
      version,
    };

    return {
      success: true,
      verified: true,
      signatureValid: true,
      data: extractedData,
    };
  } catch (err: any) {
    return {
      success: true,
      verified: false,
      signatureValid: false,
      error: 'Malformed or unparseable QR payload structure.',
    };
  }
}
