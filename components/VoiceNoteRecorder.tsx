'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Mic,
  Square,
  Pause,
  Play,
  RotateCcw,
  AlertCircle,
  CheckCircle2,
  Loader2,
} from 'lucide-react';
import VoiceAudioPlayer from './VoiceAudioPlayer';

export type RecordingStatus =
  | 'idle'
  | 'starting'
  | 'recording'
  | 'paused'
  | 'stopping'
  | 'recorded';

interface VoiceNoteRecorderProps {
  onVoiceNoteChange: (
    blob: Blob | null,
    durationSec: number,
    previewUrl: string | null
  ) => void;
  disabled?: boolean;
}

export default function VoiceNoteRecorder({
  onVoiceNoteChange,
  disabled = false,
}: VoiceNoteRecorderProps) {
  const [status, setStatus] = useState<RecordingStatus>('idle');
  const [duration, setDuration] = useState<number>(0);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Refs to ensure callbacks & timers always access non-stale state
  const statusRef = useRef<RecordingStatus>('idle');
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const durationRef = useRef<number>(0);
  const isCancelledRef = useRef<boolean>(false);
  const mimeTypeRef = useRef<string>('');

  // Keep statusRef in sync with status state
  const updateStatus = (newStatus: RecordingStatus) => {
    statusRef.current = newStatus;
    setStatus(newStatus);
  };

  // Helper to safely stop all microphone tracks
  const stopMicrophoneTracks = useCallback(() => {
    if (streamRef.current) {
      try {
        streamRef.current.getTracks().forEach((track) => {
          track.stop();
          track.enabled = false;
        });
      } catch (err) {
        console.error('Error stopping audio tracks:', err);
      }
      streamRef.current = null;
    }
  }, []);

  // Helper to stop timer safely
  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  // Full cleanup of recorder, tracks, and timer
  const fullCleanup = useCallback(() => {
    stopTimer();
    stopMicrophoneTracks();
    if (mediaRecorderRef.current) {
      try {
        mediaRecorderRef.current.ondataavailable = null;
        mediaRecorderRef.current.onstop = null;
        mediaRecorderRef.current.onerror = null;
        mediaRecorderRef.current.onpause = null;
        mediaRecorderRef.current.onresume = null;
        if (mediaRecorderRef.current.state !== 'inactive') {
          mediaRecorderRef.current.stop();
        }
      } catch (e) {
        // ignore cleanup stop errors
      }
      mediaRecorderRef.current = null;
    }
  }, [stopTimer, stopMicrophoneTracks]);

  // Clean up on component unmount
  useEffect(() => {
    return () => {
      isCancelledRef.current = true;
      fullCleanup();
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [fullCleanup, previewUrl]);

  // Dynamic MIME type detection across Chrome, Edge, Firefox, Safari (Desktop & Mobile)
  const getSupportedMimeType = (): string => {
    if (typeof window === 'undefined' || !window.MediaRecorder) return '';

    const candidateTypes = [
      'audio/webm;codecs=opus',
      'audio/webm',
      'audio/mp4;codecs=mp4a.40.2',
      'audio/mp4',
      'audio/aac',
      'audio/ogg;codecs=opus',
      'audio/ogg',
    ];

    if (typeof MediaRecorder.isTypeSupported === 'function') {
      for (const type of candidateTypes) {
        try {
          if (MediaRecorder.isTypeSupported(type)) {
            return type;
          }
        } catch (e) {
          // ignore feature check errors
        }
      }
    }
    return '';
  };

  // Timer runner
  const startTimer = useCallback(() => {
    stopTimer();
    timerRef.current = setInterval(() => {
      setDuration((prev) => {
        const next = prev + 1;
        durationRef.current = next;
        if (next >= 300) {
          // Auto-stop at exactly 05:00 minutes (300 seconds)
          stopTimer();
          setTimeout(() => {
            handleDoneInternal();
          }, 0);
          return 300;
        }
        return next;
      });
    }, 1000);
  }, [stopTimer]);

  // START RECORDING
  const startRecording = async () => {
    if (disabled || statusRef.current !== 'idle') return;

    setError(null);
    isCancelledRef.current = false;
    chunksRef.current = [];
    durationRef.current = 0;
    setDuration(0);

    // Feature detection
    if (
      typeof window === 'undefined' ||
      !navigator?.mediaDevices ||
      typeof navigator.mediaDevices.getUserMedia !== 'function' ||
      typeof window.MediaRecorder === 'undefined'
    ) {
      setError(
        'आपका ब्राउज़र वॉइस रिकॉर्डिंग का समर्थन नहीं करता है / Voice recording is not supported on this browser or connection.'
      );
      return;
    }

    updateStatus('starting');

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      // Check if user cancelled while permission prompt was active
      if (isCancelledRef.current || (statusRef.current as RecordingStatus) !== 'starting') {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }

      streamRef.current = stream;

      const mimeType = getSupportedMimeType();
      mimeTypeRef.current = mimeType;

      let mediaRecorder: MediaRecorder;
      try {
        const options = mimeType ? { mimeType } : undefined;
        mediaRecorder = new MediaRecorder(stream, options);
      } catch (constructErr) {
        console.warn('MediaRecorder constructor failed with options, using fallback:', constructErr);
        mediaRecorder = new MediaRecorder(stream);
      }

      mediaRecorderRef.current = mediaRecorder;

      // Event handlers
      mediaRecorder.ondataavailable = (e: BlobEvent) => {
        if (e.data && e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onpause = () => {
        stopTimer();
        if (statusRef.current === 'recording') {
          updateStatus('paused');
        }
      };

      mediaRecorder.onresume = () => {
        if (statusRef.current === 'paused') {
          updateStatus('recording');
          startTimer();
        }
      };

      mediaRecorder.onerror = (event: Event) => {
        console.error('MediaRecorder error event:', event);
        const errObj = (event as any).error;
        stopTimer();
        stopMicrophoneTracks();
        fullCleanup();
        updateStatus('idle');
        setError(
          'रिकॉर्डिंग में त्रुटि हुई / Recording error occurred: ' +
            (errObj?.message || 'Unknown recorder error')
        );
      };

      mediaRecorder.onstop = () => {
        stopTimer();
        stopMicrophoneTracks();

        if (isCancelledRef.current) {
          chunksRef.current = [];
          durationRef.current = 0;
          setDuration(0);
          updateStatus('idle');
          return;
        }

        const finalMimeType =
          mimeTypeRef.current || mediaRecorder.mimeType || 'audio/webm';
        const blob = new Blob(chunksRef.current, { type: finalMimeType });

        if (blob.size === 0) {
          setError(
            'रिकॉर्ड की गई ऑडियो खाली थी, कृपया पुनः प्रयास करें / Recorded audio was empty. Please try again.'
          );
          updateStatus('idle');
          onVoiceNoteChange(null, 0, null);
          return;
        }

        if (blob.size > 10 * 1024 * 1024) {
          setError(
            'वॉइस नोट का साइज़ 10MB से अधिक है / Recorded audio exceeds 10MB limit. Please record a shorter note.'
          );
          updateStatus('idle');
          onVoiceNoteChange(null, 0, null);
          return;
        }

        if (previewUrl) {
          URL.revokeObjectURL(previewUrl);
        }

        const url = URL.createObjectURL(blob);
        const finalDuration = durationRef.current;

        setPreviewUrl(url);
        updateStatus('recorded');
        onVoiceNoteChange(blob, finalDuration, url);
      };

      // Start recording with 1-second timeslice for chunk reliability
      mediaRecorder.start(1000);
      updateStatus('recording');
      startTimer();
    } catch (err: any) {
      console.error('Error starting voice recording:', err);
      stopTimer();
      stopMicrophoneTracks();
      updateStatus('idle');

      if (
        err.name === 'NotAllowedError' ||
        err.name === 'PermissionDeniedError'
      ) {
        setError(
          'माइक्रोफ़ोन की अनुमति आवश्यक है / Microphone permission is required. Please allow microphone access in browser settings.'
        );
      } else if (
        err.name === 'NotFoundError' ||
        err.name === 'DevicesNotFoundError'
      ) {
        setError('माइक्रोफ़ोन उपलब्ध नहीं है / No microphone found on your device.');
      } else if (
        err.name === 'NotReadableError' ||
        err.name === 'TrackStartError'
      ) {
        setError(
          'माइक्रोफ़ोन व्यस्त है या उपयोग में नहीं लाया जा सकता / Microphone is currently busy or unavailable.'
        );
      } else {
        setError(
          'रिकॉर्डिंग शुरू करने में असमर्थ / Unable to start recording: ' +
            (err.message || 'Unknown error')
        );
      }
    }
  };

  // PAUSE RECORDING
  const pauseRecording = () => {
    if (disabled || statusRef.current !== 'recording') return;
    const recorder = mediaRecorderRef.current;
    if (recorder && recorder.state === 'recording') {
      try {
        recorder.pause();
        stopTimer();
        updateStatus('paused');
      } catch (err) {
        console.error('Error pausing recording:', err);
      }
    }
  };

  // RESUME RECORDING
  const resumeRecording = () => {
    if (disabled || statusRef.current !== 'paused') return;
    const recorder = mediaRecorderRef.current;
    if (recorder && recorder.state === 'paused') {
      try {
        recorder.resume();
        updateStatus('recording');
        startTimer();
      } catch (err) {
        console.error('Error resuming recording:', err);
      }
    }
  };

  // DONE RECORDING (Internal & External)
  const handleDoneInternal = () => {
    if (
      statusRef.current !== 'recording' &&
      statusRef.current !== 'paused'
    ) {
      return;
    }

    isCancelledRef.current = false;
    updateStatus('stopping');
    stopTimer();

    const recorder = mediaRecorderRef.current;
    if (recorder && recorder.state !== 'inactive') {
      try {
        if (typeof recorder.requestData === 'function') {
          recorder.requestData();
        }
        recorder.stop();
      } catch (err) {
        console.error('Error stopping recording:', err);
        stopMicrophoneTracks();
        updateStatus('idle');
      }
    } else {
      stopMicrophoneTracks();
      updateStatus('idle');
    }
  };

  const handleDone = () => {
    if (disabled || statusRef.current === 'starting' || statusRef.current === 'stopping') return;
    handleDoneInternal();
  };

  // CANCEL RECORDING
  const handleCancel = () => {
    if (disabled || statusRef.current === 'starting') return;
    isCancelledRef.current = true;
    stopTimer();
    stopMicrophoneTracks();

    const recorder = mediaRecorderRef.current;
    if (recorder && recorder.state !== 'inactive') {
      try {
        recorder.stop();
      } catch (e) {
        // ignore error
      }
    }

    chunksRef.current = [];
    durationRef.current = 0;
    setDuration(0);
    setError(null);
    updateStatus('idle');

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }

    onVoiceNoteChange(null, 0, null);
  };

  const handleReRecord = () => {
    handleCancel();
    setTimeout(() => {
      startRecording();
    }, 150);
  };

  const formatTime = (secs: number) => {
    const clamped = Math.min(Math.max(0, secs), 300);
    const m = Math.floor(clamped / 60);
    const s = Math.floor(clamped % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const isActionDisabled = disabled || status === 'starting' || status === 'stopping';

  return (
    <div className="space-y-2.5 mt-2">
      {/* Error alert box */}
      {error && (
        <div
          role="alert"
          aria-live="assertive"
          className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-start gap-2.5 shadow-xs animate-in fade-in"
        >
          <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
          <span className="flex-1 font-devanagari leading-relaxed">{error}</span>
          <button
            type="button"
            onClick={() => setError(null)}
            className="text-red-400 hover:text-red-600 text-xs font-bold shrink-0 ml-1 p-0.5 rounded-md hover:bg-red-100 transition-colors"
            aria-label="Dismiss error"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* STATE 1: IDLE / STARTING */}
      {(status === 'idle' || status === 'starting') && (
        <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-xl transition-all">
          <div className="flex items-center gap-3">
            <button
              type="button"
              disabled={isActionDisabled}
              onClick={startRecording}
              className="w-11 h-11 rounded-full bg-brand-700 hover:bg-brand-800 focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 text-white flex items-center justify-center shadow-md transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
              title="Record Voice Note / बोलकर रिकॉर्ड करें"
              aria-label="Start Voice Recording / वॉइस रिकॉर्डिंग शुरू करें"
            >
              {status === 'starting' ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Mic className="w-5 h-5" />
              )}
            </button>
            <div>
              <p className="text-xs font-bold text-slate-800 font-devanagari">
                {status === 'starting'
                  ? 'माइक्रोफ़ोन प्रारंभ हो रहा है... / Connecting microphone...'
                  : 'वॉइस नोट रिकॉर्ड करें / Record Voice Note'}
              </p>
              <p className="text-[11px] text-slate-500 font-devanagari">
                {status === 'starting'
                  ? 'कृपया माइक्रोफ़ोन की अनुमति दें / Please allow microphone access'
                  : 'माइक पर टैप करके अपनी आवश्यकता बताएं / Tap mic to speak your requirement'}
              </p>
            </div>
          </div>
          <span className="text-[10px] font-bold tracking-wider text-slate-500 uppercase bg-slate-200/70 px-2.5 py-1 rounded-md shrink-0 font-devanagari">
            वॉइस ऐच्छिक / Voice Optional
          </span>
        </div>
      )}

      {/* STATE 2 & 3: RECORDING OR PAUSED */}
      {(status === 'recording' || status === 'paused' || status === 'stopping') && (
        <div
          role="status"
          aria-live="polite"
          className={`p-3.5 border rounded-xl space-y-3 transition-all animate-in fade-in ${
            status === 'paused'
              ? 'bg-amber-50/90 border-amber-200'
              : 'bg-red-50/90 border-red-200'
          }`}
        >
          <div className="flex items-center justify-between">
            {/* Status indicator badge */}
            <div className="flex items-center gap-2.5">
              <span className="relative flex h-3 w-3">
                {status === 'recording' && (
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                )}
                <span
                  className={`relative inline-flex rounded-full h-3 w-3 ${
                    status === 'recording'
                      ? 'bg-red-600'
                      : status === 'paused'
                      ? 'bg-amber-500'
                      : 'bg-slate-400'
                  }`}
                ></span>
              </span>
              <span className="text-xs font-bold text-slate-900 font-devanagari">
                {status === 'recording'
                  ? '🔴 रिकॉर्डिंग जारी है... / Recording Voice Note...'
                  : status === 'paused'
                  ? '⏸ रिकॉर्डिंग रुकी हुई है / Recording Paused'
                  : '⏳ रिकॉर्डिंग पूरी की जा रही है... / Finalizing recording...'}
              </span>
            </div>

            {/* Timer display */}
            <div
              className={`text-xs font-mono font-bold px-2.5 py-1 rounded-lg border ${
                status === 'paused'
                  ? 'text-amber-800 bg-amber-100 border-amber-300'
                  : 'text-red-800 bg-red-100 border-red-300'
              }`}
              aria-label={`Recording time: ${formatTime(duration)} out of 5 minutes`}
            >
              {formatTime(duration)} / 05:00
            </div>
          </div>

          {/* Animated Audio Waveform visualization when actively recording */}
          {status === 'recording' && (
            <div className="flex items-center justify-center gap-1.5 h-6 py-1">
              <span className="w-1 bg-red-500 rounded-full h-3 animate-pulse" />
              <span className="w-1 bg-red-600 rounded-full h-6 animate-pulse delay-75" />
              <span className="w-1 bg-red-500 rounded-full h-2 animate-pulse delay-150" />
              <span className="w-1 bg-red-600 rounded-full h-5 animate-pulse delay-100" />
              <span className="w-1 bg-red-500 rounded-full h-3 animate-pulse delay-200" />
              <span className="w-1 bg-red-600 rounded-full h-4 animate-pulse delay-150" />
            </div>
          )}

          {/* Controls: Cancel, Pause/Resume, Done */}
          <div className="flex items-center justify-between pt-1 border-t border-slate-200/80">
            <button
              type="button"
              disabled={isActionDisabled}
              onClick={handleCancel}
              className="text-xs font-bold text-slate-600 hover:text-red-700 flex items-center gap-1 px-2.5 py-1.5 rounded-lg hover:bg-red-100/60 focus-visible:ring-2 focus-visible:ring-red-500 transition-colors disabled:opacity-50 font-devanagari"
              aria-label="Cancel recording / रिकॉर्डिंग रद्द करें"
            >
              <RotateCcw className="w-3.5 h-3.5" /> रद्द करें / Cancel
            </button>

            <div className="flex items-center gap-2">
              {status === 'recording' ? (
                <button
                  type="button"
                  disabled={isActionDisabled}
                  onClick={pauseRecording}
                  className="px-3.5 py-1.5 bg-amber-100 hover:bg-amber-200 text-amber-900 text-xs font-bold rounded-lg border border-amber-300 focus-visible:ring-2 focus-visible:ring-amber-500 transition-colors flex items-center gap-1 disabled:opacity-50 font-devanagari"
                  aria-label="Pause recording / रोकें"
                >
                  <Pause className="w-3.5 h-3.5" /> रोकें / Pause
                </button>
              ) : status === 'paused' ? (
                <button
                  type="button"
                  disabled={isActionDisabled}
                  onClick={resumeRecording}
                  className="px-3.5 py-1.5 bg-brand-100 hover:bg-brand-200 text-brand-900 text-xs font-bold rounded-lg border border-brand-300 focus-visible:ring-2 focus-visible:ring-brand-500 transition-colors flex items-center gap-1 disabled:opacity-50 font-devanagari"
                  aria-label="Resume recording / फिर शुरू करें"
                >
                  <Play className="w-3.5 h-3.5" /> फिर शुरू करें / Resume
                </button>
              ) : null}

              <button
                type="button"
                disabled={isActionDisabled}
                onClick={handleDone}
                className="px-4 py-1.5 bg-red-600 hover:bg-red-700 focus-visible:ring-2 focus-visible:ring-red-500 text-white text-xs font-bold rounded-lg shadow-xs transition-colors flex items-center gap-1.5 disabled:opacity-50 font-devanagari"
                aria-label="Finish recording / पूरा हुआ"
              >
                {status === 'stopping' ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Square className="w-3.5 h-3.5 fill-current" />
                )}
                पूरा हुआ / Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STATE 4: RECORDED / PREVIEW */}
      {status === 'recorded' && previewUrl && (
        <div className="space-y-1.5 animate-in fade-in">
          <VoiceAudioPlayer
            src={previewUrl}
            duration={duration}
            onDelete={handleCancel}
            onReRecord={handleReRecord}
            label="Attached Voice Note / संलग्न वॉइस नोट"
          />
          <div className="flex items-center justify-between px-1 text-[11px]">
            <span className="text-emerald-700 font-bold flex items-center gap-1 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 font-devanagari">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              वॉइस नोट सफलतापूर्वक जोड़ा गया / Voice note attached
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
