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
  videoReadyState: number;
  videoWidth: number;
  videoHeight: number;
  streamActive: boolean;
  activeTrackLabel: string;
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
  const [diagnostics, setDiagnostics] = useState<CameraDiagnosticInfo | null>(null);

  // Native DOM & Stream Refs
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const activeStreamRef = useRef<MediaStream | null>(null);
  const scanIntervalRef = useRef<any>(null);
  const startupTimeoutRef = useRef<any>(null);
  const isInitializingRef = useRef<boolean>(false);
  const isProcessingScanRef = useRef<boolean>(false);
  const mountedRef = useRef<boolean>(true);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Lifecycle mount check
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Complete cleanup of camera stream, timers, and video srcObject
  const stopCamera = useCallback(() => {
    isInitializingRef.current = false;

    // 1. Clear scanning loop interval
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }

    // 2. Clear 5-second hard startup timeout
    if (startupTimeoutRef.current) {
      clearTimeout(startupTimeoutRef.current);
      startupTimeoutRef.current = null;
    }

    // 3. Stop all MediaStreamTracks
    if (activeStreamRef.current) {
      try {
        activeStreamRef.current.getTracks().forEach((track) => track.stop());
      } catch {}
      activeStreamRef.current = null;
    }

    // 4. Detach stream from HTMLVideoElement
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

  // Auto-cleanup on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  // Map browser camera errors safely to clear, actionable messages
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
      return 'The camera is currently being used by another application. Close other camera apps and try again.';
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
    return 'Camera could not be started. Please try again or upload a photo of your QR code below.';
  };

  // Send detected QR payload ONCE to server-side verification API
  const sendPayloadToApi = async (scannedPayload: string) => {
    if (isProcessingScanRef.current) return;
    isProcessingScanRef.current = true;

    // Stop live camera preview immediately upon QR detection
    stopCamera();

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

  // Live Video Frame QR Scanner Loop using jsQR
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
    }, 180); // Scan frame every 180ms (~5.5 FPS for optimal performance and battery)
  }, []);

  // Main Native camera scan startup workflow
  const initiateCameraScan = async () => {
    if (isInitializingRef.current) return;
    isInitializingRef.current = true;

    setErrorMessage(null);
    setVerifiedDetails(null);
    isProcessingScanRef.current = false;

    // Step 1: Pre-flight security & browser checks
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

  // Camera start execution effect when state is REQUESTING
  useEffect(() => {
    if (scannerState !== 'REQUESTING') return;

    let isEffectActive = true;

    const startNativeCameraSession = async () => {
      try {
        stopCamera();

        // 1. Set state to STARTING to mount <video ref={videoRef} /> in DOM
        setScannerState('STARTING');
        await new Promise((resolve) => setTimeout(resolve, 80));
        if (!isEffectActive || !mountedRef.current) return;

        // 2. Set 5-second hard startup timeout guard
        startupTimeoutRef.current = setTimeout(() => {
          if (isEffectActive && mountedRef.current) {
            stopCamera();
            setScannerState('ERROR');
            setErrorMessage('Camera stream startup timed out after 5 seconds. Please try again or upload a photo of your QR code below.');
          }
        }, 5000);

        // 3. Obtain native MediaStream via getUserMedia
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
        } catch (facingErr) {
          // Fallback to plain video constraints if environment facingMode fails
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

        // 4. Attach stream directly to HTMLVideoElement
        const video = videoRef.current;
        if (!video) {
          throw new Error('Video container element was not found in DOM.');
        }

        video.srcObject = stream;
        video.setAttribute('playsinline', 'true');
        video.setAttribute('webkit-playsinline', 'true');
        video.setAttribute('autoplay', 'true');
        video.muted = true;

        try {
          await video.play();
        } catch {}

        // 5. Poll video readiness up to 5 seconds
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

        // Clear hard startup timeout guard since stream is verified live
        if (startupTimeoutRef.current) {
          clearTimeout(startupTimeoutRef.current);
          startupTimeoutRef.current = null;
        }

        if (process.env.NODE_ENV !== 'production' && mountedRef.current) {
          const track = stream.getVideoTracks()[0];
          setDiagnostics({
            isSecureContext: window.isSecureContext,
            hasMediaDevices: true,
            videoReadyState: video.readyState,
            videoWidth: video.videoWidth,
            videoHeight: video.videoHeight,
            streamActive: stream.active,
            activeTrackLabel: track?.label || 'Live Camera',
          });
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

  // Image Upload Fallback Handler (Client-Side Local QR Scan via jsQR)
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
      stopCamera();

      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            setScannerState('ERROR');
            setErrorMessage('Could not process image file.');
            setIsSubmitting(false);
            return;
          }
          ctx.drawImage(img, 0, 0);
          const imageData = ctx.getImageData(0, 0, img.width, img.height);
          const code = jsQR(imageData.data, imageData.width, imageData.height, {
            inversionAttempts: 'dontInvert',
          });

          if (code && code.data && code.data.trim()) {
            sendPayloadToApi(code.data.trim());
          } else {
            setScannerState('ERROR');
            setErrorMessage('No valid Aadhaar QR code could be detected in the selected image. Please ensure the QR photo is clear and well-lit.');
            setIsSubmitting(false);
          }
        };
        img.onerror = () => {
          setScannerState('ERROR');
          setErrorMessage('Failed to load the selected image file.');
          setIsSubmitting(false);
        };
        img.src = event.target?.result as string;
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      if (mountedRef.current) {
        setScannerState('ERROR');
        setErrorMessage(
          err.message || 'Unable to detect a valid Aadhaar QR code in the selected image.'
        );
        setIsSubmitting(false);
      }
    }
  };

  const handleReset = async () => {
    stopCamera();
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
            <div className="relative rounded-2xl overflow-hidden bg-black border border-slate-800 aspect-[4/3] max-w-md mx-auto flex items-center justify-center">
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
                <p className="text-[11px] text-slate-400">Requesting native hardware video stream</p>
              </div>
            </div>
          </div>
        )}

        {/* State 4: SCANNING (Verified Native Live Stream) */}
        {scannerState === 'SCANNING' && (
          <div className="space-y-3 animate-in fade-in">
            <div className="relative rounded-2xl overflow-hidden bg-black border border-slate-800 aspect-[4/3] max-w-md mx-auto flex items-center justify-center">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover block bg-black"
              />

              {/* Viewfinder Target Frame Overlay */}
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
                onClick={initiateCameraScan}
                icon={<RefreshCw className="w-4 h-4" />}
              >
                Try Camera Again
              </Button>

              <Button
                variant="outline"
                fullWidth
                onClick={() => fileInputRef.current?.click()}
                icon={<Upload className="w-4 h-4 text-blue-600" />}
              >
                Scan QR from Image
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
              <div>Ready State: <strong>{diagnostics.videoReadyState}</strong></div>
              <div>Dimensions: <strong>{diagnostics.videoWidth}x{diagnostics.videoHeight}</strong></div>
              <div>Stream Active: <strong>{diagnostics.streamActive ? 'True' : 'False'}</strong></div>
              <div className="col-span-3 truncate">Track: <strong>{diagnostics.activeTrackLabel}</strong></div>
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
