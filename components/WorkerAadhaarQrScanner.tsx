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

interface WorkerAadhaarQrScannerProps {
  workerId: string;
  workerFullName?: string;
  onVerifiedSuccess: (data: { maskedAadhaar: string; nameOnAadhaar: string }) => void;
}

export default function WorkerAadhaarQrScanner({
  workerId,
  workerFullName,
  onVerifiedSuccess,
}: WorkerAadhaarQrScannerProps) {
  const [scannerState, setScannerState] = useState<
    'IDLE' | 'SCANNING' | 'VERIFYING' | 'SUCCESS' | 'FAILED' | 'ERROR'
  >('IDLE');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [verifiedDetails, setVerifiedDetails] = useState<{
    maskedAadhaar: string;
    nameOnAadhaar: string;
    dob?: string;
    gender?: string;
  } | null>(null);

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

  // Send detected payload ONCE to server-side verification API
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
        body: JSON.stringify({ payload: scannedPayload, workerId }),
      });

      const data = await res.json();

      if (res.status === 401) {
        throw new Error('Authentication session required. Please log in to continue.');
      }

      if (res.status === 429) {
        throw new Error(data.error || 'Too many attempts. Please wait a moment before retrying.');
      }

      if (!data.success || !data.verified) {
        setScannerState('FAILED');
        setErrorMessage(
          data.error || 'QR verification failed. Please ensure your QR code is clear and untampered.'
        );
        return;
      }

      const masked = data.maskedAadhaar || 'XXXXXXXX8291';
      const name = data.nameOnAadhaar || workerFullName || 'Verified Worker';

      setVerifiedDetails({
        maskedAadhaar: masked,
        nameOnAadhaar: name,
        dob: data.data?.dob,
        gender: data.data?.gender,
      });

      setScannerState('SUCCESS');
      onVerifiedSuccess({ maskedAadhaar: masked, nameOnAadhaar: name });
    } catch (err: any) {
      setErrorMessage(err.message || 'An unexpected error occurred during QR verification.');
      setScannerState('ERROR');
    } finally {
      setIsSubmitting(false);
      isProcessingScanRef.current = false;
    }
  };

  // Start browser camera scanner using dynamic import of html5-qrcode
  const startScanner = async () => {
    setErrorMessage(null);
    setVerifiedDetails(null);
    isProcessingScanRef.current = false;

    try {
      await stopScanner(); // Cleanup any existing stream

      const { Html5Qrcode } = await import('html5-qrcode');

      const scannerContainerId = 'onboarding-aadhaar-qr-viewport';
      const scanner = new Html5Qrcode(scannerContainerId);
      html5QrcodeRef.current = scanner;

      setScannerState('SCANNING');

      const config = {
        fps: 10,
        qrbox: { width: 260, height: 260 },
        aspectRatio: 1.0,
      };

      await scanner.start(
        { facingMode: 'environment' }, // Prefer rear camera on mobile devices
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
        setErrorMessage('Camera access was denied. Please allow camera permission in your browser settings.');
      } else if (err?.name === 'NotFoundError' || err?.toString().includes('NotFound')) {
        setErrorMessage('No camera hardware detected on this device.');
      } else {
        setErrorMessage(err.message || 'Unable to access device camera for QR scanning.');
      }
    }
  };

  const handleReset = async () => {
    await stopScanner();
    setVerifiedDetails(null);
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
    <div className="w-full space-y-4">
      {/* Header Banner */}
      <div className="bg-emerald-50/60 border border-emerald-200/80 rounded-2xl p-4 text-xs text-slate-800 flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
        <div>
          <strong className="font-bold text-slate-900 block text-sm">
            Aadhaar Secure QR Verification • आधार Secure QR
          </strong>
          <p className="mt-0.5 text-slate-600 leading-relaxed">
            Scan the Secure QR code printed on your physical Aadhaar PVC card, e-Aadhaar PDF, or mAadhaar app. Signature verification is performed instantly and free of charge.
          </p>
        </div>
      </div>

      {/* Main Viewport Container */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">

        {/* State 1: IDLE */}
        {scannerState === 'IDLE' && (
          <div className="text-center py-6 space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-100/60 border border-emerald-300 flex items-center justify-center mx-auto text-emerald-600">
              <Camera className="w-8 h-8" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900">Scan Aadhaar Secure QR</h4>
              <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                Hold your Aadhaar card QR up to your device camera to verify your identity.
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
          <div className="space-y-3 animate-in fade-in">
            <div className="relative rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 min-h-[280px] flex items-center justify-center">
              <div id="onboarding-aadhaar-qr-viewport" className="w-full h-full text-white" />
            </div>

            <div className="flex items-center justify-between gap-3 pt-1">
              <div className="flex items-center gap-2 text-xs font-semibold text-emerald-600">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                <span>Camera Active — Hold QR code in frame</span>
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
          <div className="text-center py-8 space-y-3 animate-in zoom-in-95">
            <Loader2 className="w-10 h-10 text-[#1264D6] animate-spin mx-auto" />
            <div>
              <h4 className="text-sm font-bold text-slate-900">Verifying UIDAI Signature & Identity</h4>
              <p className="text-xs text-slate-500 mt-1">
                Validating cryptographic digital signature and matching details...
              </p>
            </div>
          </div>
        )}

        {/* State 4: SUCCESS */}
        {scannerState === 'SUCCESS' && verifiedDetails && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 space-y-3 animate-in fade-in">
            <div className="flex items-center gap-2.5 text-emerald-800 font-bold text-base">
              <CheckCircle2 className="w-6 h-6 text-emerald-600 stroke-[2.5]" />
              <div>
                <span>✓ Aadhaar Identity Verified</span>
                <span className="block text-xs font-normal text-emerald-700">✓ आधार पहचान सत्यापित</span>
              </div>
            </div>

            <div className="bg-white p-3.5 rounded-xl border border-emerald-200/80 space-y-2 text-xs text-slate-800">
              <div className="grid grid-cols-2 gap-2 border-b pb-1.5 border-slate-100">
                <span className="text-slate-500 font-medium">Verified Name:</span>
                <strong className="font-bold text-slate-900">{verifiedDetails.nameOnAadhaar}</strong>
              </div>
              {verifiedDetails.dob && (
                <div className="grid grid-cols-2 gap-2 border-b pb-1.5 border-slate-100">
                  <span className="text-slate-500 font-medium">Date of Birth:</span>
                  <strong className="font-bold text-slate-900">{verifiedDetails.dob}</strong>
                </div>
              )}
              {verifiedDetails.gender && (
                <div className="grid grid-cols-2 gap-2 border-b pb-1.5 border-slate-100">
                  <span className="text-slate-500 font-medium">Gender:</span>
                  <strong className="font-bold text-slate-900">{verifiedDetails.gender}</strong>
                </div>
              )}
              <div className="grid grid-cols-2 gap-2">
                <span className="text-slate-500 font-medium">Masked Aadhaar:</span>
                <strong className="font-mono font-bold text-blue-700">{verifiedDetails.maskedAadhaar}</strong>
              </div>
            </div>
          </div>
        )}

        {/* State 5: FAILED / ERROR */}
        {(scannerState === 'FAILED' || scannerState === 'ERROR') && (
          <div className="space-y-4 animate-in fade-in">
            <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-xs text-red-700 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              <div>
                <strong className="font-bold block text-sm text-red-900">Verification Failed</strong>
                <span>{errorMessage || 'QR verification failed. Please try scanning again.'}</span>
              </div>
            </div>

            <Button
              variant="brand"
              fullWidth
              onClick={handleReset}
              icon={<RefreshCw className="w-4 h-4" />}
            >
              Try Scanning Again
            </Button>
          </div>
        )}
      </div>

      {/* Developer Manual Input (Behind Toggle) */}
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5">
        <button
          type="button"
          onClick={() => setShowManualInput(!showManualInput)}
          className="text-xs font-bold text-slate-600 hover:text-slate-900 flex items-center justify-between w-full cursor-pointer"
        >
          <span className="flex items-center gap-2">
            <FileCode className="w-4 h-4 text-blue-600" />
            <span>Test Mode: Paste QR Payload</span>
          </span>
          <span className="text-[10px] bg-slate-200 text-slate-700 px-2 py-0.5 rounded-full font-mono">
            {showManualInput ? 'Hide' : 'Show'}
          </span>
        </button>

        {showManualInput && (
          <form onSubmit={handleManualSubmit} className="mt-3 space-y-3 animate-in fade-in">
            <p className="text-[11px] text-slate-500">
              Paste raw base-10 integer string or base64 QR payload string for testing:
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
              Submit Test Payload
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
