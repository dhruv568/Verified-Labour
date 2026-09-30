'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Camera,
  StopCircle,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Loader2,
  Lock,
  FileCode,
} from 'lucide-react';
import Button from './ui/Button';

interface VerificationResult {
  verified: boolean;
  signatureValid: boolean;
  data?: {
    name: string;
    dob: string;
    gender: string;
    maskedAadhaar: string;
  };
  error?: string;
}

export default function AadhaarQrTestScanner() {
  const [scannerState, setScannerState] = useState<
    'IDLE' | 'SCANNING' | 'VERIFYING' | 'RESULT' | 'ERROR'
  >('IDLE');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [manualPayload, setManualPayload] = useState('');
  const [showManualInput, setShowManualInput] = useState(false);

  const html5QrcodeRef = useRef<any>(null);
  const isProcessingScanRef = useRef<boolean>(false);

  // Safely stop scanner instance and release hardware video stream
  const stopScanner = useCallback(async () => {
    if (html5QrcodeRef.current) {
      try {
        if (html5QrcodeRef.current.isScanning) {
          await html5QrcodeRef.current.stop();
        }
        await html5QrcodeRef.current.clear();
      } catch {
        // Ignore cleanup errors
      } finally {
        html5QrcodeRef.current = null;
      }
    }
  }, []);

  // Clean up scanner hardware on component unmount
  useEffect(() => {
    return () => {
      stopScanner();
    };
  }, [stopScanner]);

  // Send detected payload ONCE to server-side Phase 2 API
  const sendPayloadToApi = async (scannedPayload: string) => {
    if (isProcessingScanRef.current) return;
    isProcessingScanRef.current = true;

    // Immediately stop camera scan
    await stopScanner();

    setScannerState('VERIFYING');
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/verifications/aadhaar/secure-qr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ payload: scannedPayload }),
      });

      const data = await res.json();

      if (res.status === 401) {
        throw new Error('Authentication session required. Please log in to test verification.');
      }

      if (res.status === 429) {
        throw new Error(data.error || 'Rate limit exceeded. Please wait a moment before trying again.');
      }

      if (!res.ok && !data.success) {
        throw new Error(data.error || 'Failed to process QR code payload.');
      }

      setResult({
        verified: Boolean(data.verified),
        signatureValid: Boolean(data.signatureValid),
        data: data.data || undefined,
      });

      setScannerState('RESULT');
    } catch (err: any) {
      setErrorMessage(err.message || 'An unexpected error occurred during verification.');
      setScannerState('ERROR');
    } finally {
      setIsSubmitting(false);
      isProcessingScanRef.current = false;
    }
  };

  // Start browser camera scanner using dynamic import of html5-qrcode
  const startScanner = async () => {
    setErrorMessage(null);
    setResult(null);
    isProcessingScanRef.current = false;

    try {
      await stopScanner(); // Cleanup any existing stream

      // Dynamic import to prevent SSR server evaluation issues
      const { Html5Qrcode } = await import('html5-qrcode');

      const scannerContainerId = 'aadhaar-qr-reader-viewport';
      const scanner = new Html5Qrcode(scannerContainerId);
      html5QrcodeRef.current = scanner;

      setScannerState('SCANNING');

      const config = {
        fps: 10,
        qrbox: { width: 260, height: 260 },
        aspectRatio: 1.0,
      };

      await scanner.start(
        { facingMode: 'environment' }, // Prefer rear camera on mobile
        config,
        async (decodedText: string) => {
          if (!isProcessingScanRef.current) {
            await sendPayloadToApi(decodedText);
          }
        },
        () => {
          // Frame parse error - ignore transient frames
        }
      );
    } catch (err: any) {
      await stopScanner();
      setScannerState('ERROR');
      if (err?.name === 'NotAllowedError' || err?.toString().includes('Permission')) {
        setErrorMessage('Camera access was denied. Please grant camera permission in your browser settings.');
      } else if (err?.name === 'NotFoundError' || err?.toString().includes('NotFound')) {
        setErrorMessage('No camera device detected on this system.');
      } else {
        setErrorMessage(err.message || 'Unable to access device camera for QR scanning.');
      }
    }
  };

  const handleReset = async () => {
    await stopScanner();
    setResult(null);
    setErrorMessage(null);
    setManualPayload('');
    setScannerState('IDLE');
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualPayload.trim()) return;
    sendPayloadToApi(manualPayload.trim());
  };

  return (
    <div className="w-full max-w-xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="bg-slate-900 text-white p-5 rounded-3xl shadow-xl border border-slate-800">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-2xl bg-[#1264D6] flex items-center justify-center text-white shrink-0 shadow-md">
            <ShieldCheck className="w-6 h-6 stroke-[2.5]" />
          </div>
          <div>
            <h2 className="text-lg font-black tracking-tight text-white">
              Aadhaar Secure QR Verification
            </h2>
            <p className="text-xs text-slate-300">
              Test Scanner • Cryptographic Signature Proof (Phase 3)
            </p>
          </div>
        </div>
        <p className="text-xs text-slate-400 mt-2 leading-relaxed">
          Scan the official Secure QR code on your Aadhaar card or e-Aadhaar document to verify UIDAI digital signature validity server-side.
        </p>
      </div>

      {/* Main Viewport Container */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">

        {/* State 1: IDLE */}
        {scannerState === 'IDLE' && (
          <div className="text-center py-8 space-y-4">
            <div className="w-20 h-20 rounded-full bg-blue-50 border-2 border-blue-200 flex items-center justify-center mx-auto text-[#1264D6]">
              <Camera className="w-10 h-10" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Ready to Scan</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                Click below to request camera permission and scan an Aadhaar Secure QR code.
              </p>
            </div>

            <div className="pt-2">
              <Button
                variant="brand"
                size="lg"
                onClick={startScanner}
                icon={<Camera className="w-5 h-5" />}
              >
                Start Camera Scanner
              </Button>
            </div>
          </div>
        )}

        {/* State 2: SCANNING */}
        {scannerState === 'SCANNING' && (
          <div className="space-y-4 animate-in fade-in">
            <div className="relative rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 min-h-[300px] flex items-center justify-center">
              <div id="aadhaar-qr-reader-viewport" className="w-full h-full text-white" />
            </div>

            <div className="flex items-center justify-between gap-3 pt-1">
              <div className="flex items-center gap-2 text-xs font-semibold text-emerald-600">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                <span>Camera Live — Hold QR in frame</span>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={handleReset}
                icon={<StopCircle className="w-4 h-4 text-red-500" />}
              >
                Stop Scanner
              </Button>
            </div>
          </div>
        )}

        {/* State 3: VERIFYING */}
        {scannerState === 'VERIFYING' && (
          <div className="text-center py-10 space-y-4 animate-in zoom-in-95">
            <Loader2 className="w-12 h-12 text-[#1264D6] animate-spin mx-auto" />
            <div>
              <h3 className="text-base font-bold text-slate-900">Verifying UIDAI Signature</h3>
              <p className="text-xs text-slate-500 mt-1">
                Sending raw payload to backend server for RSA-2048 cryptographic signature validation...
              </p>
            </div>
          </div>
        )}

        {/* State 4: RESULT */}
        {scannerState === 'RESULT' && result && (
          <div className="space-y-4 animate-in fade-in">
            {result.verified && result.signatureValid ? (
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 space-y-3">
                <div className="flex items-center gap-3 text-emerald-800 font-bold text-base">
                  <CheckCircle2 className="w-6 h-6 text-emerald-600 stroke-[2.5]" />
                  <span>✓ QR Signature Verified</span>
                </div>

                <p className="text-xs text-emerald-700">
                  UIDAI RSA-2048 Digital Signature matches official public certificate.
                </p>

                {result.data && (
                  <div className="bg-white p-4 rounded-xl border border-emerald-200/60 space-y-2 text-xs text-slate-800">
                    <div className="grid grid-cols-2 gap-2 border-b pb-2 border-slate-100">
                      <span className="text-slate-500 font-medium">Name:</span>
                      <strong className="font-bold text-slate-900">{result.data.name || 'N/A'}</strong>
                    </div>
                    <div className="grid grid-cols-2 gap-2 border-b pb-2 border-slate-100">
                      <span className="text-slate-500 font-medium">Date of Birth:</span>
                      <strong className="font-bold text-slate-900">{result.data.dob || 'N/A'}</strong>
                    </div>
                    <div className="grid grid-cols-2 gap-2 border-b pb-2 border-slate-100">
                      <span className="text-slate-500 font-medium">Gender:</span>
                      <strong className="font-bold text-slate-900">{result.data.gender || 'N/A'}</strong>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <span className="text-slate-500 font-medium">Masked Aadhaar:</span>
                      <strong className="font-mono font-bold text-blue-700">{result.data.maskedAadhaar}</strong>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-red-50 border border-red-200 rounded-2xl p-5 space-y-2">
                <div className="flex items-center gap-3 text-red-800 font-bold text-base">
                  <AlertCircle className="w-6 h-6 text-red-600 stroke-[2.5]" />
                  <span>QR Verification Failed</span>
                </div>
                <p className="text-xs text-red-700">
                  Digital signature invalid, tampered, or unsupported format.
                </p>
              </div>
            )}

            <div className="pt-2">
              <Button
                variant="brand"
                fullWidth
                onClick={handleReset}
                icon={<RefreshCw className="w-4 h-4" />}
              >
                Scan Another QR Code
              </Button>
            </div>
          </div>
        )}

        {/* State 5: ERROR */}
        {scannerState === 'ERROR' && (
          <div className="space-y-4 animate-in fade-in">
            <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-xs text-red-700 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              <div>
                <strong className="font-bold block text-sm">Scan Error</strong>
                <span>{errorMessage || 'Unable to scan or verify QR code.'}</span>
              </div>
            </div>

            <Button
              variant="brand"
              fullWidth
              onClick={handleReset}
              icon={<RefreshCw className="w-4 h-4" />}
            >
              Try Again
            </Button>
          </div>
        )}
      </div>

      {/* Development Manual Input (Behind Toggle) */}
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
        <button
          type="button"
          onClick={() => setShowManualInput(!showManualInput)}
          className="text-xs font-bold text-slate-600 hover:text-slate-900 flex items-center justify-between w-full cursor-pointer"
        >
          <span className="flex items-center gap-2">
            <FileCode className="w-4 h-4 text-blue-600" />
            <span>Developer Test Mode: Paste QR Payload</span>
          </span>
          <span className="text-[10px] bg-slate-200 text-slate-700 px-2 py-0.5 rounded-full font-mono">
            {showManualInput ? 'Hide' : 'Show'}
          </span>
        </button>

        {showManualInput && (
          <form onSubmit={handleManualSubmit} className="mt-3 space-y-3 animate-in fade-in">
            <p className="text-[11px] text-slate-500">
              Paste raw base-10 integer string or base64 QR payload to test server-side verification:
            </p>
            <textarea
              rows={3}
              value={manualPayload}
              onChange={(e) => setManualPayload(e.target.value)}
              placeholder="Paste QR payload string here..."
              className="w-full p-2.5 text-xs font-mono bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
            <Button
              type="submit"
              variant="outline"
              size="sm"
              disabled={isSubmitting || !manualPayload.trim()}
              icon={<Lock className="w-3.5 h-3.5" />}
            >
              Verify Test Payload
            </Button>
          </form>
        )}
      </div>

      {/* Safety Notice */}
      <div className="text-center text-[11px] text-slate-400 flex items-center justify-center gap-1.5">
        <Lock className="w-3.5 h-3.5" />
        <span>Test Mode • No worker profiles or database records are modified.</span>
      </div>
    </div>
  );
}
