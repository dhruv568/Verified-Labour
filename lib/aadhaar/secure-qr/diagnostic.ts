import zlib from 'zlib';
import crypto from 'crypto';
import { loadUidaiCertificate, getUidaiCertDetails, UidaiCertDetails } from './certificate';
import { parseRawPayloadToBuffer, splitBufferByDelimiter } from './decoder';

/**
 * DEVELOPMENT-ONLY Aadhaar Secure QR Diagnostic Engine
 * 
 * Safely analyzes raw QR payload byte structures, compression methods,
 * format classifications, and cryptographic signature branch matching.
 * 
 * PRIVACY & SECURITY GUARANTEES:
 * - NO raw Aadhaar 12-digit numbers
 * - NO full raw QR binary/string payload
 * - NO user names, DOBs, photos, or physical addresses
 * - Safe metadata only (lengths, hex head/tail, algorithm names, cert serials)
 */

export interface AadhaarQrDiagnosticReport {
  timestamp: string;
  rawInputLength: number;
  bufferLength: number;
  detectedInputEncoding: 'BASE64' | 'BASE64URL' | 'BASE10_NUMERIC' | 'XML_STRING' | 'RAW_BINARY';
  headHex: string;
  tailHex: string;
  decompression: {
    isDeflateRawValid: boolean;
    isDeflateValid: boolean;
    isGzipValid: boolean;
    decompressedLength: number;
    decompressedHeadHex?: string;
  };
  formatClassification: {
    isXmlV1: boolean;
    isDelimiter255V2V3: boolean;
    delimiter255Count: number;
    isCborCose: boolean;
    isJwtJws: boolean;
    detectedVersion: 'V1_XML' | 'V2_SECURE_QR' | 'V3_SECURE_QR' | 'OPENID4VP_VC' | 'UNKNOWN';
  };
  certificateAudit: {
    loaded: boolean;
    details?: UidaiCertDetails;
    error?: string;
  };
  cryptographicAudit: {
    extractedSignatureLength: number;
    extractedSignedDataLength: number;
    matchedStrategies: string[];
    signatureValid: boolean;
  };
}

export function runAadhaarQrDiagnostics(rawInput: string | Buffer): AadhaarQrDiagnosticReport {
  const timestamp = new Date().toISOString();
  let buffer: Buffer;
  let detectedEncoding: AadhaarQrDiagnosticReport['detectedInputEncoding'] = 'RAW_BINARY';

  const rawStr = typeof rawInput === 'string' ? rawInput.trim() : '';

  if (Buffer.isBuffer(rawInput)) {
    buffer = rawInput;
    detectedEncoding = 'RAW_BINARY';
  } else if (rawStr.includes('<PrintLetterBarcodeData') || rawStr.includes('<?xml')) {
    detectedEncoding = 'XML_STRING';
    buffer = Buffer.from(rawStr, 'utf8');
  } else if (/^\d+$/.test(rawStr.replace(/\s+/g, ''))) {
    detectedEncoding = 'BASE10_NUMERIC';
    buffer = parseRawPayloadToBuffer(rawInput);
  } else if (/^[A-Za-z0-9_-]+$/.test(rawStr) && (rawStr.includes('-') || rawStr.includes('_'))) {
    detectedEncoding = 'BASE64URL';
    buffer = parseRawPayloadToBuffer(rawInput);
  } else {
    detectedEncoding = 'BASE64';
    buffer = parseRawPayloadToBuffer(rawInput);
  }

  const bufferLength = buffer.length;
  const headHex = buffer.subarray(0, 8).toString('hex');
  const tailHex = buffer.length >= 8 ? buffer.subarray(buffer.length - 8).toString('hex') : '';

  // 1. Decompression Audit
  let isDeflateRawValid = false;
  let isDeflateValid = false;
  let isGzipValid = false;
  let decompressedBuffer = buffer;
  let decompressedHeadHex: string | undefined;

  try {
    const res = zlib.inflateRawSync(buffer);
    isDeflateRawValid = true;
    decompressedBuffer = res;
  } catch {
    try {
      const res = zlib.inflateSync(buffer);
      isDeflateValid = true;
      decompressedBuffer = res;
    } catch {
      try {
        const res = zlib.gunzipSync(buffer);
        isGzipValid = true;
        decompressedBuffer = res;
      } catch {}
    }
  }

  if (decompressedBuffer.length > 0 && decompressedBuffer !== buffer) {
    decompressedHeadHex = decompressedBuffer.subarray(0, 8).toString('hex');
  }

  // 2. Format Classification
  const decompressedStr = decompressedBuffer.toString('utf8');
  const isXmlV1 = decompressedStr.includes('<PrintLetterBarcodeData') || decompressedStr.includes('<?xml');
  const parts255 = splitBufferByDelimiter(decompressedBuffer, 255);
  const delimiter255Count = parts255.length - 1;
  const isDelimiter255V2V3 = delimiter255Count >= 5;
  const isCborCose = bufferLength > 2 && (buffer[0] === 0xd8 || buffer[0] === 0xa2 || buffer[0] === 0xd0);
  const isJwtJws = decompressedStr.startsWith('ey') && decompressedStr.includes('.');

  let detectedVersion: AadhaarQrDiagnosticReport['formatClassification']['detectedVersion'] = 'UNKNOWN';
  if (isXmlV1) detectedVersion = 'V1_XML';
  else if (isDelimiter255V2V3 && parts255[0]?.toString('utf8').includes('V3')) detectedVersion = 'V3_SECURE_QR';
  else if (isDelimiter255V2V3) detectedVersion = 'V2_SECURE_QR';
  else if (isJwtJws || isCborCose) detectedVersion = 'OPENID4VP_VC';

  // 3. Certificate Audit
  let certDetails: UidaiCertDetails | undefined;
  let certLoaded = false;
  let certErr: string | undefined;

  try {
    certDetails = getUidaiCertDetails();
    certLoaded = true;
  } catch (err: any) {
    certErr = err.message || 'Failed to load UIDAI certificate';
  }

  // 4. Cryptographic Verifier Audit
  const matchedStrategies: string[] = [];
  let sigLength = 0;
  let signedDataLength = 0;

  if (bufferLength >= 260) {
    sigLength = 256;
    signedDataLength = bufferLength - 256;
    const signatureBytes = buffer.subarray(bufferLength - 256);
    const signedDataBytes = buffer.subarray(0, bufferLength - 256);

    const sigVariants = [
      { name: 'NORMAL_SIG', buf: signatureBytes },
      { name: 'REVERSED_SIG', buf: Buffer.from(signatureBytes).reverse() },
    ];

    const dataTargets: Array<{ name: string; buf: Buffer }> = [];
    if (signedDataBytes.length > 0) {
      dataTargets.push({ name: 'RAW_SIGNED_DATA', buf: signedDataBytes });
      if (signedDataBytes.length > 1) {
        dataTargets.push({ name: 'STRIPPED_PREFIX_DATA', buf: signedDataBytes.subarray(1) });
      }
    }
    if (decompressedBuffer.length > 0 && decompressedBuffer !== buffer) {
      dataTargets.push({ name: 'DECOMPRESSED_DATA', buf: decompressedBuffer });
    }

    if (certLoaded) {
      try {
        const x509 = loadUidaiCertificate();
        const pubKey = x509.publicKey;

        const algos = ['SHA256', 'SHA1', 'SHA512'];
        const paddings = [
          { name: 'PKCS1', pad: crypto.constants.RSA_PKCS1_PADDING },
          { name: 'PSS', pad: crypto.constants.RSA_PKCS1_PSS_PADDING },
        ];

        for (const sigVar of sigVariants) {
          for (const targetVar of dataTargets) {
            for (const algo of algos) {
              for (const padVar of paddings) {
                try {
                  const valid = crypto.verify(
                    algo,
                    targetVar.buf,
                    {
                      key: pubKey as any,
                      padding: padVar.pad,
                      saltLength: padVar.pad === crypto.constants.RSA_PKCS1_PSS_PADDING
                        ? crypto.constants.RSA_PSS_SALTLEN_DIGEST
                        : undefined,
                    },
                    sigVar.buf
                  );

                  if (valid) {
                    matchedStrategies.push(
                      `${algo}_${padVar.name}_${targetVar.name}_${sigVar.name}`
                    );
                  }
                } catch {}
              }
            }
          }
        }
      } catch {}
    }
  }

  return {
    timestamp,
    rawInputLength: typeof rawInput === 'string' ? rawInput.length : rawInput.length,
    bufferLength,
    detectedInputEncoding: detectedEncoding,
    headHex,
    tailHex,
    decompression: {
      isDeflateRawValid,
      isDeflateValid,
      isGzipValid,
      decompressedLength: decompressedBuffer.length,
      decompressedHeadHex,
    },
    formatClassification: {
      isXmlV1,
      isDelimiter255V2V3,
      delimiter255Count,
      isCborCose,
      isJwtJws,
      detectedVersion,
    },
    certificateAudit: {
      loaded: certLoaded,
      details: certDetails,
      error: certErr,
    },
    cryptographicAudit: {
      extractedSignatureLength: sigLength,
      extractedSignedDataLength: signedDataLength,
      matchedStrategies,
      signatureValid: matchedStrategies.length > 0,
    },
  };
}
