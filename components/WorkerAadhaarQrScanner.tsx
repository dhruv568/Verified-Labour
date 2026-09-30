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
  Upload,
  Activity,
} from 'lucide-react';
import Button from './ui/Button';

interface WorkerAadhaarQrScannerProps {
  workerId: string;
  workerFullName?: string;
  onVerifiedSuccess: (data: { maskedAadhaar: string; nameOnAadhaar: string }) => void;
}

export type ScannerLifecycleState =
  | 'IDLE'
  | 'REQUESTING'
  | 'STARTING'
  | 'SCANNING'
  | 'PROCESSING'
  | 'SUCCESS'
  | 'FAILED'
  | 'ERROR';

interface CameraDiagnosticInfo {
  isSecureContext: boolean;
  hasMediaDevices: boolean;
  camerasCount: number;
  selectedCameraLabel: string;
  videoReadyState: number;
  videoWidth: number;
  videoHeight: number;
  streamActive: boolean;
}

export default function WorkerAadhaarQrScanner({
  workerId,
  workerFullName,
  onVerifiedSuccess,
}: WorkerAadhaarQrScannerProps) {
  const [scannerState, setScannerState] = useState<ScannerLifecycleState>('IDLE');
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

  // Development Diagnostics State
  const [diagnostics, setDiagnostics] = useState<CameraDiagnosticInfo | null>(null);

  // Instance and lifecycle refs
  const html5QrcodeRef = useRef<any>(null);
  const activeStreamRef = useRef<MediaStream | null>(null);
  const isInitializingRef = useRef<boolean>(false);
  const isProcessingScanRef = useRef<boolean>(false);
  const mountedRef = useRef<boolean>(true);
  const initAttemptsRef = useRef<number>(0);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Update mounted ref on lifecycle
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Safely stop scanner instance and release hardware video stream tracks completely
  const stopScanner = useCallback(async () => {
    isInitializingRef.current = false;

    // 1. Stop html5-qrcode scanner instance
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

    // 2. Stop active stream tracks directly if stored
    if (activeStreamRef.current) {
      try {
        activeStreamRef.current.getTracks().forEach((track) => track.stop());
      } catch {}
      activeStreamRef.current = null;
    }

    // 3. Inspect DOM container and clear video srcObject
    if (typeof document !== 'undefined') {
      const containerEl = document.getElementById('onboarding-aadhaar-qr-viewport');
      if (containerEl) {
        const videoEl = containerEl.querySelector('video') as HTMLVideoElement | null;
        if (videoEl) {
          try {
            if (videoEl.srcObject) {
              const stream = videoEl.srcObject as MediaStream;
              stream.getTracks().forEach((t) => t.stop());
              videoEl.srcObject = null;
            }
          } catch {}
        }
      }
    }
  }, []);

  // Clean up scanner hardware on component unmount
  useEffect(() => {
    return () => {
      stopScanner();
    };
  }, [stopScanner]);

  // Map browser camera errors safely to user-friendly diagnostic messages
  const mapCameraError = (err: any): string => {
    const name = (err?.name || '').toLowerCase();
    const msg = (err?.message || err?.toString() || '').toLowerCase();

    if (name.includes('notallowed') || msg.includes('permission') || msg.includes('denied')) {
      return 'Camera permission is blocked. Please allow camera access for Verified Labour in your browser settings and try again.';
    }

    if (name.includes('notfound') || msg.includes('no camera') || msg.includes('notfound')) {
      return 'No camera was found on this device.';
    }

    if (name.includes('notreadable') || msg.includes('in use') || msg.includes('trackstart')) {
      return 'Camera is currently being used by another application. Close other camera apps and try again.';
    }

    if (name.includes('overconstrained')) {
      return 'Selected camera is unavailable. Please try uploading a QR photo below.';
    }

    if (name.includes('security') || msg.includes('secure')) {
      return 'Camera scanner requires a secure HTTPS connection.';
    }

    if (name.includes('abort')) {
      return 'Camera startup was interrupted. Please try again.';
    }

    return 'Camera scanner could not start. Please try again or upload a photo of your QR code below.';
  };

  // Send detected payload ONCE to server-side verification API
  const sendPayloadToApi = async (scannedPayload: string) => {
    if (isProcessingScanRef.current) return;
    isProcessingScanRef.current = true;

    // Immediately stop camera scan & update state to PROCESSING
    await stopScanner();
    if (mountedRef.current) {
      setScannerState('PROCESSING');
      setIsSubmitting(true);
      setErrorMessage(null);
    }

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
        if (mountedRef.current) {
          setScannerState('FAILED');
          setErrorMessage(
            data.error || 'Identity details on the Aadhaar QR do not match your registered information.'
          );
        }
        return;
      }

      const masked = data.maskedAadhaar || 'XXXXXXXX8291';
      const name = data.nameOnAadhaar || workerFullName || 'Verified Worker';

      if (mountedRef.current) {
        setVerifiedDetails({
          maskedAadhaar: masked,
          nameOnAadhaar: name,
          dob: data.data?.dob,
          gender: data.data?.gender,
        });

        setScannerState('SUCCESS');
        onVerifiedSuccess({ maskedAadhaar: masked, nameOnAadhaar: name });
      }
    } catch (err: any) {
      if (mountedRef.current) {
        setErrorMessage(err.message || 'An unexpected error occurred during QR verification.');
        setScannerState('ERROR');
      }
    } finally {
      if (mountedRef.current) {
        setIsSubmitting(false);
      }
      isProcessingScanRef.current = false;
    }
  };

  // Poll and verify actual video element dimensions and readyState
  const verifyVideoRendering = async (containerId: string, maxWaitMs = 3000): Promise<boolean> => {
    const startTime = Date.now();
    while (Date.now() - startTime < maxWaitMs) {
      if (!mountedRef.current) return false;

      const containerEl = document.getElementById(containerId);
      if (containerEl) {
        const videoEl = containerEl.querySelector('video') as HTMLVideoElement | null;
        if (videoEl) {
          // iOS Safari inline playback attributes enforcement
          if (!videoEl.hasAttribute('playsinline')) {
            videoEl.setAttribute('playsinline', 'true');
            videoEl.setAttribute('webkit-playsinline', 'true');
          }
          if (!videoEl.hasAttribute('autoplay')) {
            videoEl.setAttribute('autoplay', 'true');
          }
          if (!videoEl.muted) {
            videoEl.muted = true;
          }

          // Enforce visible CSS styling
          videoEl.style.width = '100%';
          videoEl.style.height = '100%';
          videoEl.style.objectFit = 'cover';
          videoEl.style.display = 'block';
          videoEl.style.background = '#000';

          // Attempt explicit play call on iOS Safari if paused
          if (videoEl.paused) {
            try {
              await videoEl.play();
            } catch {}
          }

          // Track stream reference if available
          if (videoEl.srcObject) {
            activeStreamRef.current = videoEl.srcObject as MediaStream;
          }

          // Update dev diagnostics info
          if (process.env.NODE_ENV !== 'production' && mountedRef.current) {
            setDiagnostics((prev) => ({
              isSecureContext: typeof window !== 'undefined' ? window.isSecureContext : false,
              hasMediaDevices: typeof navigator !== 'undefined' && !!navigator?.mediaDevices,
              camerasCount: prev?.camerasCount || 0,
              selectedCameraLabel: prev?.selectedCameraLabel || 'Active Camera',
              videoReadyState: videoEl.readyState,
              videoWidth: videoEl.videoWidth,
              videoHeight: videoEl.videoHeight,
              streamActive: !!videoEl.srcObject,
            }));
          }

          // Strict verification: stream must have readyState >= 2 and width/height > 0
          if (
            videoEl.readyState >= 2 &&
            videoEl.videoWidth > 0 &&
            videoEl.videoHeight > 0
          ) {
            return true;
          }
        }
      }
      await new Promise((resolve) => setTimeout(resolve, 150));
    }
    return false;
  };

  // Main camera scan startup workflow
  const initiateCameraScan = async () => {
    if (isInitializingRef.current) return;
    isInitializingRef.current = true;

    setErrorMessage(null);
    setVerifiedDetails(null);
    isProcessingScanRef.current = false;
    initAttemptsRef.current = 0;

    // Step 1: Pre-flight security & browser capability checks
    if (typeof window === 'undefined') return;

    if (!window.isSecureContext) {
      setScannerState('ERROR');
      setErrorMessage(
        'Camera access requires a secure HTTPS connection. Please ensure you are accessing Verified Labour via HTTPS.'
      );
      isInitializingRef.current = false;
      return;
    }

    if (!navigator?.mediaDevices || !navigator?.mediaDevices?.getUserMedia) {
      setScannerState('ERROR');
      setErrorMessage(
        'Your browser does not support camera scanning. Please try using the latest Safari or Chrome, or upload a photo of your QR code below.'
      );
      isInitializingRef.current = false;
      return;
    }

    // Step 2: Transition state to REQUESTING
    setScannerState('REQUESTING');
  };

  // Camera start execution effect when state is REQUESTING or STARTING
  useEffect(() => {
    if (scannerState !== 'REQUESTING') return;

    let isEffectActive = true;

    const startSession = async () => {
      try {
        await stopScanner();

        // 1. Explicitly request camera permission to populate device labels
        try {
          const stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: 'environment' },
          });
          // Release initial test stream immediately
          stream.getTracks().forEach((track) => track.stop());
        } catch (permErr: any) {
          // If permission explicitly denied, throw immediately
          if (
            permErr?.name === 'NotAllowedError' ||
            permErr?.toString().includes('Permission')
          ) {
            throw permErr;
          }
        }

        if (!isEffectActive || !mountedRef.current) return;

        // 2. Set state to STARTING to mount viewport container element in DOM
        setScannerState('STARTING');

        // Allow DOM repaint for container element
        await new Promise((resolve) => setTimeout(resolve, 100));
        if (!isEffectActive || !mountedRef.current) return;

        const containerId = 'onboarding-aadhaar-qr-viewport';
        const containerEl = document.getElementById(containerId);
        if (!containerEl) {
          throw new Error('Scanner container element initialization failed.');
        }

        const { Html5Qrcode } = await import('html5-qrcode');
        if (!isEffectActive || !mountedRef.current) return;

        const scanner = new Html5Qrcode(containerId);
        html5QrcodeRef.current = scanner;

        const config = {
          fps: 10,
          qrbox: { width: 260, height: 260 },
          aspectRatio: 1.0,
        };

        const onScanSuccess = async (decodedText: string) => {
          if (!isProcessingScanRef.current && mountedRef.current) {
            await sendPayloadToApi(decodedText);
          }
        };

        // 3. Enumerate camera devices
        let cameras: any[] = [];
        try {
          cameras = await Html5Qrcode.getCameras();
        } catch {}

        if (process.env.NODE_ENV !== 'production' && mountedRef.current) {
          setDiagnostics((prev) => ({
            isSecureContext: window.isSecureContext,
            hasMediaDevices: !!navigator?.mediaDevices,
            camerasCount: cameras.length,
            selectedCameraLabel: 'Selecting...',
            videoReadyState: 0,
            videoWidth: 0,
            videoHeight: 0,
            streamActive: false,
          }));
        }

        let startedSuccessfully = false;

        // Attempt Strategy 1: Camera enumeration selecting rear camera ID
        if (cameras && cameras.length > 0) {
          const rearCamera =
            cameras.find(
              (c) =>
                c.label.toLowerCase().includes('back') ||
                c.label.toLowerCase().includes('rear') ||
                c.label.toLowerCase().includes('environment') ||
                c.label.toLowerCase().includes('wide') ||
                c.label.toLowerCase().includes('0')
            ) || cameras[cameras.length - 1];

          if (process.env.NODE_ENV !== 'production' && mountedRef.current) {
            setDiagnostics((prev: any) => ({
              ...prev,
              selectedCameraLabel: rearCamera.label || rearCamera.id,
            }));
          }

          try {
            await scanner.start(
              rearCamera.id,
              config,
              onScanSuccess,
              () => {}
            );
            startedSuccessfully = true;
          } catch (camIdErr) {
            // Strategy 1 failed, proceed to Strategy 2
          }
        }

        // Attempt Strategy 2: facingMode "environment"
        if (!startedSuccessfully) {
          try {
            await scanner.start(
              { facingMode: 'environment' },
              config,
              onScanSuccess,
              () => {}
            );
            startedSuccessfully = true;
          } catch (facingErr) {
            // Strategy 2 failed, proceed to Strategy 3
          }
        }

        // Attempt Strategy 3: Plain fallback config for strict iOS WebKit
        if (!startedSuccessfully) {
          await scanner.start(
            { facingMode: 'user' },
            config,
            onScanSuccess,
            () => {}
          );
        }

        if (!isEffectActive || !mountedRef.current) return;

        // 4. CRITICAL: Verify actual video stream dimensions & rendering
        const isVideoActive = await verifyVideoRendering(containerId, 3000);

        if (isVideoActive && isEffectActive && mountedRef.current) {
          setScannerState('SCANNING');
        } else {
          // If video dimensions are zero, retry initialization up to 3 bounded retries
          if (initAttemptsRef.current < 2) {
            initAttemptsRef.current += 1;
            await stopScanner();
            await new Promise((resolve) => setTimeout(resolve, 300));
            if (isEffectActive && mountedRef.current) {
              setScannerState('REQUESTING');
            }
          } else {
            throw new Error('Camera video stream could not be rendered. Please try uploading a QR photo.');
          }
        }
      } catch (err: any) {
        if (!isEffectActive || !mountedRef.current) return;
        await stopScanner();
        setScannerState('ERROR');
        setErrorMessage(mapCameraError(err));
      } finally {
        isInitializingRef.current = false;
      }
    };

    startSession();

    return () => {
      isEffectActive = false;
    };
  }, [scannerState, stopScanner]);

  // Image Upload Fallback Handler (Client-Side Local QR Scan)
  const handleImageFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setScannerState('ERROR');
      setErrorMessage('Please select a valid image file (JPEG, PNG, WebP).');
      return;
    }

    setErrorMessage(null);
    setScannerState('PROCESSING');
    setIsSubmitting(true);

    try {
      await stopScanner();

      const { Html5Qrcode } = await import('html5-qrcode');
      // Create temporary offscreen scanner instance for local file scan
      const tempScanner = new Html5Qrcode('offscreen-file-qr-container');

      // Scan file locally in browser (no server upload)
      const decodedText = await tempScanner.scanFile(file, true);
      await tempScanner.clear();

      if (decodedText) {
        await sendPayloadToApi(decodedText);
      } else {
        throw new Error('No QR code could be detected in the uploaded image.');
      }
    } catch (err: any) {
      if (mountedRef.current) {
        setScannerState('ERROR');
        setErrorMessage(
          err.message || 'Unable to detect a valid Aadhaar QR code in the selected image. Please ensure the QR photo is clear and well-lit.'
        );
        setIsSubmitting(false);
      }
    }
  };

  const handleReset = async () => {
    await stopScanner();
    if (mountedRef.current) {
      setVerifiedDetails(null);
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
    <div className="w-full space-y-4">
      {/* Hidden container for client-side file QR scanning */}
      <div id="offscreen-file-qr-container" className="hidden" />

      {/* Header Banner */}
      <div className="bg-emerald-50/60 border border-emerald-200/80 rounded-2xl p-4 text-xs text-slate-800 flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
        <div>
          <strong className="font-bold text-slate-900 block text-sm">
            Aadhaar Secure QR Verification • आधार Secure QR
          </strong>
          <p className="mt-0.5 text-slate-600 leading-relaxed">
            Scan the Secure QR code printed on your physical Aadhaar PVC card, e-Aadhaar PDF, or mAadhaar app. Cryptographic digital signature verification is executed server-side.
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
                Hold your Aadhaar card QR up to your device camera or upload a QR image.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <Button
                variant="brand"
                size="lg"
                onClick={initiateCameraScan}
                icon={<Camera className="w-5 h-5" />}
              >
                Start Camera Scanner
              </Button>

              {/* Image Upload Fallback Option */}
              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleImageFileSelect}
                  className="hidden"
                />
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => fileInputRef.current?.click()}
                  icon={<Upload className="w-4 h-4 text-blue-600" />}
                >
                  Upload QR Image
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* State 2 & 3: REQUESTING / STARTING */}
        {(scannerState === 'REQUESTING' || scannerState === 'STARTING') && (
          <div className="space-y-3 animate-in fade-in">
            <div className="relative rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 min-h-[280px] sm:min-h-[320px] flex items-center justify-center p-6 text-center">
              <div id="onboarding-aadhaar-qr-viewport" className="w-full h-full text-white" />
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/80 backdrop-blur-sm space-y-3 text-white z-10">
                <Loader2 className="w-8 h-8 text-emerald-400 animate-spin mx-auto" />
                <p className="text-xs font-bold">
                  {scannerState === 'REQUESTING'
                    ? 'Requesting Camera Permission...'
                    : 'Camera starting...'}
                </p>
                <p className="text-[11px] text-slate-400">Verifying live video stream playback</p>
              </div>
            </div>
          </div>
        )}

        {/* State 4: SCANNING (Verified Live Stream) */}
        {scannerState === 'SCANNING' && (
          <div className="space-y-3 animate-in fade-in">
            <div className="relative rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 min-h-[280px] sm:min-h-[320px] flex items-center justify-center">
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

        {/* State 5: PROCESSING */}
        {scannerState === 'PROCESSING' && (
          <div className="text-center py-8 space-y-3 animate-in zoom-in-95">
            <Loader2 className="w-10 h-10 text-[#1264D6] animate-spin mx-auto" />
            <div>
              <h4 className="text-sm font-bold text-slate-900">Verifying UIDAI Signature & Identity</h4>
              <p className="text-xs text-slate-500 mt-1">
                Validating RSA-2048 cryptographic digital signature and matching identity details...
              </p>
            </div>
          </div>
        )}

        {/* State 6: SUCCESS */}
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

        {/* State 7: FAILED / ERROR */}
        {(scannerState === 'FAILED' || scannerState === 'ERROR') && (
          <div className="space-y-4 animate-in fade-in">
            <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-xs text-red-700 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              <div>
                <strong className="font-bold block text-sm text-red-900">Verification Failed</strong>
                <span>{errorMessage || 'QR verification failed. Please try scanning again.'}</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Button
                variant="brand"
                fullWidth
                onClick={handleReset}
                icon={<RefreshCw className="w-4 h-4" />}
              >
                Try Scanning Again
              </Button>

              <Button
                variant="outline"
                fullWidth
                onClick={() => fileInputRef.current?.click()}
                icon={<Upload className="w-4 h-4 text-blue-600" />}
              >
                Upload QR Photo
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Developer Diagnostic & Test Panel (STRICTLY NON-PRODUCTION ONLY) */}
      {process.env.NODE_ENV !== 'production' && (
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700 flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-600" />
              <span>Camera Diagnostic Panel (Dev Mode)</span>
            </span>
            <button
              type="button"
              onClick={() => setShowManualInput(!showManualInput)}
              className="text-[11px] font-bold text-blue-600 underline cursor-pointer"
            >
              {showManualInput ? 'Hide Dev Controls' : 'Show Dev Controls'}
            </button>
          </div>

          {diagnostics && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10px] font-mono bg-white p-2.5 rounded-xl border border-slate-200 text-slate-700">
              <div>HTTPS Context: <strong>{diagnostics.isSecureContext ? 'Yes' : 'No'}</strong></div>
              <div>Media API: <strong>{diagnostics.hasMediaDevices ? 'Yes' : 'No'}</strong></div>
              <div>Cameras Found: <strong>{diagnostics.camerasCount}</strong></div>
              <div>Ready State: <strong>{diagnostics.videoReadyState}</strong></div>
              <div>Dimensions: <strong>{diagnostics.videoWidth}x{diagnostics.videoHeight}</strong></div>
              <div>Stream Active: <strong>{diagnostics.streamActive ? 'True' : 'False'}</strong></div>
              <div className="col-span-2 truncate">Label: <strong>{diagnostics.selectedCameraLabel}</strong></div>
            </div>
          )}

          {showManualInput && (
            <form onSubmit={handleManualSubmit} className="mt-2 space-y-2 pt-2 border-t border-slate-200">
              <p className="text-[11px] text-slate-500 font-medium">
                Paste raw QR integer payload for testing:
              </p>
              <textarea
                rows={2}
                value={manualPayload}
                onChange={(e) => setManualPayload(e.target.value)}
                placeholder="Paste QR payload string..."
                className="w-full p-2 text-xs font-mono bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
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
      )}
    </div>
  );
}
