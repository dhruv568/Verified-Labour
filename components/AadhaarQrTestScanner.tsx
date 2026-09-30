'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import jsQR from 'jsqr';
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

export type ScannerLifecycleState =
  | 'IDLE'
  | 'REQUESTING'
  | 'STARTING'
  | 'SCANNING'
  | 'VERIFYING'
  | 'RESULT'
  | 'ERROR';

export default function AadhaarQrTestScanner() {
  const [scannerState, setScannerState] = useState<ScannerLifecycleState>('IDLE');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [manualPayload, setManualPayload] = useState('');
  const [showManualInput, setShowManualInput] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const activeStreamRef = useRef<MediaStream | null>(null);
  const scanIntervalRef = useRef<any>(null);
  const startupTimeoutRef = useRef<any>(null);
  const isInitializingRef = useRef<boolean>(false);
  const isProcessingScanRef = useRef<boolean>(false);
  const mountedRef = useRef<boolean>(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const stopCamera = useCallback(() => {
    isInitializingRef.current = false;

    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }

    if (startupTimeoutRef.current) {
      clearTimeout(startupTimeoutRef.current);
      startupTimeoutRef.current = null;
    }

    if (activeStreamRef.current) {
      try {
        activeStreamRef.current.getTracks().forEach((track) => track.stop());
      } catch {}
      activeStreamRef.current = null;
    }

    if (videoRef.current) {
      try {
        if (videoRef.current.srcObject) {
          const stream = videoRef.current.srcObject as MediaStream;
          stream.getTracks().forEach((t) => t.stop());
          videoRef.current.srcObject = null;
        }
      } catch {}
    }
  }, []);

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  const mapCameraError = (err: any): string => {
    const name = (err?.name || '').toLowerCase();
    const msg = (err?.message || err?.toString() || '').toLowerCase();

    if (name.includes('notallowed') || msg.includes('permission') || msg.includes('denied')) {
      return 'Camera permission is blocked. Please allow camera access in your browser settings.';
    }
    if (name.includes('notfound') || msg.includes('no camera') || msg.includes('notfound')) {
      return 'No camera device was detected on this system.';
    }
    if (name.includes('notreadable') || msg.includes('in use') || msg.includes('trackstart')) {
      return 'Camera is currently being used by another application.';
    }
    return 'Unable to access device camera for QR scanning.';
  };

  const sendPayloadToApi = async (scannedPayload: string) => {
    if (isProcessingScanRef.current) return;
    isProcessingScanRef.current = true;

    stopCamera();
    if (mountedRef.current) {
      setScannerState('VERIFYING');
      setIsSubmitting(true);
      setErrorMessage(null);
    }

    try {
      const res = await fetch('/api/verifications/aadhaar/secure-qr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ payload: scannedPayload, testOnly: true }),
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

      if (mountedRef.current) {
        setResult({
          verified: Boolean(data.verified),
          signatureValid: Boolean(data.signatureValid),
          data: data.data || undefined,
        });

        setScannerState('RESULT');
      }
    } catch (err: any) {
      if (mountedRef.current) {
        setErrorMessage(err.message || 'An unexpected error occurred during verification.');
        setScannerState('ERROR');
      }
    } finally {
      if (mountedRef.current) {
        setIsSubmitting(false);
      }
      isProcessingScanRef.current = false;
    }
  };

  const startFrameScanningLoop = useCallback(() => {
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
    }

    const canvas = document.createElement('canvas');

    scanIntervalRef.current = setInterval(() => {
      if (!mountedRef.current || isProcessingScanRef.current || !videoRef.current) return;

      const video = videoRef.current;
      if (video.readyState < 2 || video.videoWidth === 0 || video.videoHeight === 0) return;

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

      const code = jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: 'dontInvert',
      });

      if (code && code.data && code.data.trim()) {
        sendPayloadToApi(code.data.trim());
      }
    }, 180);
  }, []);

  const startScanner = async () => {
    if (isInitializingRef.current) return;
    isInitializingRef.current = true;

    setErrorMessage(null);
    setResult(null);
    isProcessingScanRef.current = false;

    setScannerState('REQUESTING');
  };

  useEffect(() => {
    if (scannerState !== 'REQUESTING') return;

    let isEffectActive = true;

    const startNativeCameraSession = async () => {
      try {
        stopCamera();

        setScannerState('STARTING');
        await new Promise((resolve) => setTimeout(resolve, 80));
        if (!isEffectActive || !mountedRef.current) return;

        startupTimeoutRef.current = setTimeout(() => {
          if (isEffectActive && mountedRef.current) {
            stopCamera();
            setScannerState('ERROR');
            setErrorMessage('Camera startup timed out after 5 seconds.');
          }
        }, 5000);

        let stream: MediaStream;
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: {
              facingMode: { ideal: 'environment' },
              width: { ideal: 1280 },
              height: { ideal: 720 },
            },
            audio: false,
          });
        } catch {
          stream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: false,
          });
        }

        if (!isEffectActive || !mountedRef.current) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        activeStreamRef.current = stream;

        const video = videoRef.current;
        if (!video) throw new Error('Video element missing');

        video.srcObject = stream;
        video.setAttribute('playsinline', 'true');
        video.setAttribute('webkit-playsinline', 'true');
        video.setAttribute('autoplay', 'true');
        video.muted = true;

        try {
          await video.play();
        } catch {}

        const startTime = Date.now();
        let isVideoReady = false;

        while (Date.now() - startTime < 4500) {
          if (!isEffectActive || !mountedRef.current) return;

          if (
            video.readyState >= 2 &&
            video.videoWidth > 0 &&
            video.videoHeight > 0
          ) {
            isVideoReady = true;
            break;
          }
          await new Promise((r) => setTimeout(r, 100));
        }

        if (!isVideoReady) {
          throw new Error('Camera video stream could not be rendered.');
        }

        if (startupTimeoutRef.current) {
          clearTimeout(startupTimeoutRef.current);
          startupTimeoutRef.current = null;
        }

        if (isEffectActive && mountedRef.current) {
          setScannerState('SCANNING');
          startFrameScanningLoop();
        }
      } catch (err: any) {
        if (!isEffectActive || !mountedRef.current) return;
        stopCamera();
        setScannerState('ERROR');
        setErrorMessage(mapCameraError(err));
      } finally {
        isInitializingRef.current = false;
      }
    };

    startNativeCameraSession();

    return () => {
      isEffectActive = false;
    };
  }, [scannerState, stopCamera, startFrameScanningLoop]);

  const handleReset = async () => {
    stopCamera();
    if (mountedRef.current) {
      setResult(null);
      setErrorMessage(null);
      setManualPayload('');
      setScannerState('IDLE');
    }
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

        {/* State 2 & 3: REQUESTING / STARTING */}
        {(scannerState === 'REQUESTING' || scannerState === 'STARTING') && (
          <div className="space-y-4 animate-in fade-in">
            <div className="relative rounded-2xl overflow-hidden bg-black border border-slate-800 aspect-[4/3] flex items-center justify-center">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover block bg-black"
              />
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/80 backdrop-blur-sm space-y-3 text-white z-10">
                <Loader2 className="w-8 h-8 text-emerald-400 animate-spin mx-auto" />
                <p className="text-xs font-bold">Starting Camera...</p>
              </div>
            </div>
          </div>
        )}

        {/* State 4: SCANNING */}
        {scannerState === 'SCANNING' && (
          <div className="space-y-4 animate-in fade-in">
            <div className="relative rounded-2xl overflow-hidden bg-black border border-slate-800 aspect-[4/3] flex items-center justify-center">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover block bg-black"
              />

              <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                <div className="w-56 h-56 border-2 border-emerald-400/90 rounded-2xl shadow-2xl relative">
                  <div className="absolute top-0 left-0 w-4 h-4 border-t-4 border-l-4 border-emerald-400 -mt-1 -ml-1 rounded-tl-sm" />
                  <div className="absolute top-0 right-0 w-4 h-4 border-t-4 border-r-4 border-emerald-400 -mt-1 -mr-1 rounded-tr-sm" />
                  <div className="absolute bottom-0 left-0 w-4 h-4 border-b-4 border-l-4 border-emerald-400 -mb-1 -ml-1 rounded-bl-sm" />
                  <div className="absolute bottom-0 right-0 w-4 h-4 border-b-4 border-r-4 border-emerald-400 -mb-1 -mr-1 rounded-br-sm" />
                </div>
              </div>
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

        {/* State 5: VERIFYING */}
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

        {/* State 6: RESULT */}
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

        {/* State 7: ERROR */}
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
              onClick={startScanner}
              icon={<RefreshCw className="w-4 h-4" />}
            >
              Try Camera Again
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
