'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Camera, RefreshCw, CheckCircle2, AlertCircle, ShieldCheck, Upload, Sparkles, Loader2, UserCheck, X } from 'lucide-react';
import Button from './ui/Button';

interface WorkerLivePhotoCaptureProps {
  existingAvatarUrl?: string | null;
  onPhotoSaved: (avatarUrl: string) => void;
  onSkipOrContinue?: () => void;
}

export default function WorkerLivePhotoCapture({
  existingAvatarUrl,
  onPhotoSaved,
  onSkipOrContinue,
}: WorkerLivePhotoCaptureProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [permissionStatus, setPermissionStatus] = useState<
    'IDLE' | 'REQUESTING' | 'GRANTED' | 'DENIED' | 'UNSUPPORTED' | 'ERROR'
  >('IDLE');
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [capturedBlob, setCapturedBlob] = useState<Blob | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [savedUrl, setSavedUrl] = useState<string | null>(existingAvatarUrl || null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSaved, setIsSaved] = useState<boolean>(Boolean(existingAvatarUrl));

  // Stop camera media stream safely
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  // Clean up media stream on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  // Request camera permission and start video feed
  const startCamera = async () => {
    setErrorMsg(null);
    setPermissionStatus('REQUESTING');

    if (typeof window === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      setPermissionStatus('UNSUPPORTED');
      setErrorMsg('Camera access is not supported on this browser or device. You can upload a live selfie file below.');
      return;
    }

    try {
      stopCamera(); // ensure no stale stream

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user', // front camera preference for mobile devices
          width: { ideal: 640 },
          height: { ideal: 640 },
        },
        audio: false,
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      setPermissionStatus('GRANTED');
    } catch (err: any) {
      console.error('Camera access error:', err);
      stopCamera();

      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setPermissionStatus('DENIED');
        setErrorMsg('Camera permission was denied. Please allow camera permissions in your browser address bar and try again.');
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setPermissionStatus('UNSUPPORTED');
        setErrorMsg('No camera hardware found on this device. You can upload a live selfie image file.');
      } else {
        setPermissionStatus('ERROR');
        setErrorMsg(err.message || 'Failed to initialize camera. Please try again or upload a photo file.');
      }
    }
  };

  // Capture frame from video feed to canvas
  const capturePhoto = () => {
    if (!videoRef.current || permissionStatus !== 'GRANTED') return;

    const video = videoRef.current;
    const videoWidth = video.videoWidth || 640;
    const videoHeight = video.videoHeight || 640;

    // Create a 600x600 square crop from center of video frame
    const size = Math.min(videoWidth, videoHeight);
    const startX = (videoWidth - size) / 2;
    const startY = (videoHeight - size) / 2;

    const canvas = document.createElement('canvas');
    canvas.width = 600;
    canvas.height = 600;

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      setErrorMsg('Failed to create image canvas context.');
      return;
    }

    // Mirror horizontal image for front camera feel
    ctx.translate(600, 0);
    ctx.scale(-1, 1);

    // Draw square cropped video frame
    ctx.drawImage(video, startX, startY, size, size, 0, 0, 600, 600);

    // Convert canvas to JPEG blob
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          setErrorMsg('Failed to process captured image frame.');
          return;
        }

        const previewUrl = URL.createObjectURL(blob);
        setCapturedBlob(blob);
        setCapturedImage(previewUrl);
        setIsSaved(false);

        // Stop camera to turn off device indicator
        stopCamera();
      },
      'image/jpeg',
      0.88
    );
  };

  // Reset captured image and restart camera
  const handleRetake = () => {
    if (capturedImage && capturedImage.startsWith('blob:')) {
      URL.revokeObjectURL(capturedImage);
    }
    setCapturedImage(null);
    setCapturedBlob(null);
    setIsSaved(false);
    setErrorMsg(null);
    startCamera();
  };

  // Upload captured image blob or selected file to server API
  const uploadPhotoBlob = async (blobToUpload: Blob) => {
    setIsUploading(true);
    setErrorMsg(null);

    try {
      const formData = new FormData();
      formData.append('photo', blobToUpload, 'worker-live-photo.jpg');

      const res = await fetch('/api/workers/upload-photo', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to upload live photo');
      }

      setSavedUrl(data.avatarUrl);
      setIsSaved(true);
      onPhotoSaved(data.avatarUrl);
    } catch (err: any) {
      setErrorMsg(err.message || 'Live photo upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  // Handle fallback file selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setErrorMsg('Selected file exceeds 5MB limit.');
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    setCapturedBlob(file);
    setCapturedImage(previewUrl);
    setIsSaved(false);
    stopCamera();

    // Auto upload selected file
    uploadPhotoBlob(file);
  };

  return (
    <div className="w-full space-y-4">
      {/* Hidden Canvas element */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Header Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 text-xs text-blue-900 flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-[#1264D6] shrink-0 mt-0.5" />
        <div>
          <strong className="font-bold block text-sm text-slate-900">
            Worker Identity & Face Verification
          </strong>
          <p className="mt-0.5 text-slate-600 leading-relaxed">
            Please capture a clear, front-facing live photo using your device camera. This photo will be securely attached to your verified worker profile and displayed to customers after registration.
          </p>
        </div>
      </div>

      {/* Error Alert with Retry */}
      {errorMsg && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-xs text-red-700 flex items-start justify-between gap-3 animate-in fade-in">
          <div className="flex items-start gap-2.5">
            <AlertCircle className="w-4.5 h-4.5 text-red-500 shrink-0 mt-0.5" />
            <div>
              <strong className="font-bold block">Action Required:</strong>
              <span>{errorMsg}</span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              setErrorMsg(null);
              startCamera();
            }}
            className="text-red-700 font-bold underline shrink-0 hover:text-red-900 cursor-pointer"
          >
            Try Again
          </button>
        </div>
      )}

      {/* Main Camera / Capture Viewport Container */}
      <div className="relative bg-slate-900 rounded-3xl overflow-hidden border border-slate-800 shadow-xl min-h-[340px] sm:min-h-[380px] flex flex-col items-center justify-center p-4">

        {/* STATE 1: SAVED / PREVIEW STATE */}
        {isSaved && savedUrl ? (
          <div className="w-full text-center space-y-4 py-4 animate-in zoom-in-95 duration-200">
            <div className="relative inline-block mx-auto">
              <img
                src={savedUrl}
                alt="Worker Live Photo"
                className="w-44 h-44 sm:w-52 sm:h-52 rounded-full object-cover border-4 border-emerald-500 shadow-2xl mx-auto"
              />
              <div className="absolute bottom-1 right-1 bg-emerald-500 text-white p-2 rounded-full shadow-lg border-2 border-slate-900">
                <CheckCircle2 className="w-6 h-6 stroke-[2.5]" />
              </div>
            </div>

            <div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500/20 text-emerald-400 rounded-full text-xs font-bold border border-emerald-500/30 mb-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Live Photo Saved & Verified
              </span>
              <p className="text-xs text-slate-300">
                Your live photo is secured and ready for your worker profile.
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={handleRetake}
                className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 active:bg-slate-600 text-white text-xs font-bold rounded-xl border border-slate-700 transition-all flex items-center gap-2 cursor-pointer"
              >
                <RefreshCw className="w-4 h-4 text-amber-400" />
                <span>Retake Live Photo</span>
              </button>
            </div>
          </div>
        ) : capturedImage ? (
          /* STATE 2: CAPTURED PREVIEW BEFORE CONFIRMATION */
          <div className="w-full text-center space-y-4 py-4 animate-in fade-in duration-200">
            <div className="relative inline-block mx-auto">
              <img
                src={capturedImage}
                alt="Captured Live Preview"
                className="w-48 h-48 sm:w-56 sm:h-56 rounded-full object-cover border-4 border-amber-400 shadow-2xl mx-auto"
              />
              <div className="absolute top-2 right-2 bg-amber-400 text-slate-950 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider shadow-md">
                Preview
              </div>
            </div>

            <p className="text-xs text-slate-300 max-w-xs mx-auto">
              Make sure your face is clearly visible without heavy blur or shadows before saving.
            </p>

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                disabled={isUploading}
                onClick={handleRetake}
                className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl border border-slate-700 transition-all flex items-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                <RefreshCw className="w-4 h-4 text-amber-400" />
                <span>Retake</span>
              </button>

              <button
                type="button"
                disabled={isUploading || !capturedBlob}
                onClick={() => capturedBlob && uploadPhotoBlob(capturedBlob)}
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white text-xs sm:text-sm font-black rounded-xl shadow-lg transition-all flex items-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Compressing & Saving...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
                    <span>Confirm & Save Photo</span>
                  </>
                )}
              </button>
            </div>
          </div>
        ) : permissionStatus === 'GRANTED' ? (
          /* STATE 3: LIVE CAMERA FEED WITH FACE OVERLAY */
          <div className="relative w-full max-w-md mx-auto flex flex-col items-center">
            {/* Live Camera Stream Video */}
            <div className="relative w-64 h-64 sm:w-72 sm:h-72 rounded-full overflow-hidden border-4 border-blue-500/80 shadow-2xl bg-black">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover transform -scale-x-100"
              />

              {/* Face Guide Oval Overlay */}
              <div className="absolute inset-0 border-2 border-dashed border-emerald-400/90 rounded-full pointer-events-none flex items-center justify-center">
                <div className="w-40 h-52 sm:w-48 sm:h-60 rounded-[50%] border-2 border-emerald-400/70" />
              </div>

              {/* Status Pill */}
              <div className="absolute top-3 left-1/2 -translate-x-1/2 bg-slate-950/80 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-bold text-emerald-400 flex items-center gap-1.5 border border-emerald-500/30">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                <span>CAMERA LIVE</span>
              </div>
            </div>

            <p className="text-[11px] text-slate-300 mt-3 font-medium text-center">
              Align your face inside the circle and click below to capture.
            </p>

            {/* Capture Action Button */}
            <div className="mt-4 flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={capturePhoto}
                className="px-6 py-3 bg-[#1264D6] hover:bg-blue-600 active:scale-95 text-white font-black text-xs sm:text-sm rounded-2xl shadow-xl transition-all flex items-center gap-2 cursor-pointer ring-4 ring-blue-500/30"
              >
                <Camera className="w-5 h-5" />
                <span>Take Live Photo</span>
              </button>

              <button
                type="button"
                onClick={stopCamera}
                className="p-3 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-2xl transition-colors cursor-pointer"
                title="Close Camera"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        ) : (
          /* STATE 4: IDLE / REQUESTING PERMISSION / DENIED / FALLBACK */
          <div className="w-full text-center space-y-4 py-6 max-w-sm mx-auto">
            <div className="w-20 h-20 rounded-full bg-blue-900/50 border-2 border-blue-500/40 text-[#1264D6] flex items-center justify-center mx-auto shadow-inner">
              <Camera className="w-10 h-10 text-blue-400" />
            </div>

            <div>
              <h4 className="text-base font-black text-white">Device Camera Required</h4>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                Click below to grant camera access and capture your worker live selfie.
              </p>
            </div>

            <div className="space-y-3 pt-2">
              <button
                type="button"
                disabled={permissionStatus === 'REQUESTING'}
                onClick={startCamera}
                className="w-full py-3.5 bg-[#1264D6] hover:bg-blue-600 active:bg-blue-700 text-white font-bold text-xs sm:text-sm rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                {permissionStatus === 'REQUESTING' ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Requesting Camera Permission...</span>
                  </>
                ) : (
                  <>
                    <Camera className="w-4 h-4" />
                    <span>Start Camera & Allow Access</span>
                  </>
                )}
              </button>

              {/* File Upload Fallback Option */}
              <div className="relative pt-2">
                <input
                  type="file"
                  id="livePhotoFileInput"
                  accept="image/*"
                  capture="user"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <label
                  htmlFor="livePhotoFileInput"
                  className="inline-flex items-center gap-1.5 text-xs text-blue-300 hover:text-white font-semibold cursor-pointer hover:underline transition-colors"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Or select live photo file from device</span>
                </label>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer Navigation Button inside Step */}
      {isSaved && onSkipOrContinue && (
        <div className="pt-2">
          <Button
            variant="brand"
            size="lg"
            fullWidth
            onClick={onSkipOrContinue}
            icon={<CheckCircle2 className="w-4 h-4" />}
          >
            Photo Verified — Continue to Aadhaar KYC
          </Button>
        </div>
      )}
    </div>
  );
}
