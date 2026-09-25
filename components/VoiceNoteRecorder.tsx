'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  Mic,
  Square,
  Pause,
  Play,
  RotateCcw,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import VoiceAudioPlayer from './VoiceAudioPlayer';

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
  const [status, setStatus] = useState<'idle' | 'recording' | 'paused' | 'recorded'>('idle');
  const [duration, setDuration] = useState<number>(0);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const durationRef = useRef<number>(0);
  const touchStartTimeRef = useRef<number>(0);
  const isHoldRecordingRef = useRef<boolean>(false);

  // Clean up timer and media stream & object URL on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, []);

  const getSupportedMimeType = (): string => {
    if (typeof window === 'undefined' || !window.MediaRecorder) return '';
    const types = [
      'audio/webm;codecs=opus',
      'audio/webm',
      'audio/mp4',
      'audio/aac',
      'audio/ogg;codecs=opus',
      'audio/ogg',
    ];
    for (const type of types) {
      if (MediaRecorder.isTypeSupported(type)) return type;
    }
    return '';
  };

  const cleanupStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const startRecording = async () => {
    if (disabled) return;
    setError(null);

    if (
      typeof window === 'undefined' ||
      !navigator.mediaDevices ||
      !navigator.mediaDevices.getUserMedia
    ) {
      setError('Voice recording is not supported on this browser or connection.');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mimeType = getSupportedMimeType();
      const options = mimeType ? { mimeType } : undefined;
      const mediaRecorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        cleanupStream();

        const blob = new Blob(chunksRef.current, {
          type: mimeType || 'audio/webm',
        });

        if (blob.size === 0) {
          setError('Recorded audio was empty. Please try again.');
          setStatus('idle');
          return;
        }

        if (blob.size > 10 * 1024 * 1024) {
          setError('Recorded audio exceeds 10MB limit. Please record a shorter note.');
          setStatus('idle');
          return;
        }

        // Revoke previous blob URL if exists
        if (previewUrl) {
          URL.revokeObjectURL(previewUrl);
        }

        const url = URL.createObjectURL(blob);
        const finalDuration = durationRef.current;

        setRecordedBlob(blob);
        setPreviewUrl(url);
        setStatus('recorded');

        onVoiceNoteChange(blob, finalDuration, url);
      };

      mediaRecorder.start(200);
      setStatus('recording');
      setDuration(0);
      durationRef.current = 0;

      timerRef.current = setInterval(() => {
        setDuration((prev) => {
          const next = prev + 1;
          durationRef.current = next;
          if (next >= 300) {
            // Max 5 minutes limit
            stopRecording();
          }
          return next;
        });
      }, 1000);
    } catch (err: any) {
      console.error('Error starting voice recording:', err);
      if (
        err.name === 'NotAllowedError' ||
        err.name === 'PermissionDeniedError'
      ) {
        setError(
          'Microphone access denied. Please allow microphone access in your browser settings to record voice notes.'
        );
      } else if (
        err.name === 'NotFoundError' ||
        err.name === 'DevicesNotFoundError'
      ) {
        setError('No microphone found on your device.');
      } else {
        setError(
          'Unable to start recording: ' + (err.message || 'Unknown error')
        );
      }
      setStatus('idle');
    }
  };

  const pauseRecording = () => {
    if (mediaRecorderRef.current && status === 'recording') {
      mediaRecorderRef.current.pause();
      if (timerRef.current) clearInterval(timerRef.current);
      setStatus('paused');
    }
  };

  const resumeRecording = () => {
    if (mediaRecorderRef.current && status === 'paused') {
      mediaRecorderRef.current.resume();
      setStatus('recording');
      timerRef.current = setInterval(() => {
        setDuration((prev) => {
          const next = prev + 1;
          durationRef.current = next;
          if (next >= 300) stopRecording();
          return next;
        });
      }, 1000);
    }
  };

  const stopRecording = () => {
    if (
      mediaRecorderRef.current &&
      (status === 'recording' || status === 'paused')
    ) {
      mediaRecorderRef.current.stop();
    }
  };

  const deleteRecording = () => {
    cleanupStream();
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    setRecordedBlob(null);
    setPreviewUrl(null);
    setDuration(0);
    durationRef.current = 0;
    setStatus('idle');
    setError(null);

    onVoiceNoteChange(null, 0, null);
  };

  const handleReRecord = () => {
    deleteRecording();
    setTimeout(() => {
      startRecording();
    }, 50);
  };

  const handleMicClick = () => {
    if (status === 'idle') {
      startRecording();
    } else if (status === 'recording' || status === 'paused') {
      stopRecording();
    }
  };

  // Support tap & hold mode on mobile & desktop touch/mouse
  const handleTouchStart = () => {
    touchStartTimeRef.current = Date.now();
    if (status === 'idle') {
      isHoldRecordingRef.current = true;
      startRecording();
    }
  };

  const handleTouchEnd = () => {
    const holdTime = Date.now() - touchStartTimeRef.current;
    if (isHoldRecordingRef.current && holdTime > 400) {
      stopRecording();
    }
    isHoldRecordingRef.current = false;
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="space-y-2 mt-2">
      {error && (
        <div className="p-2.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-start gap-2 animate-in fade-in">
          <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
          <span className="flex-1">{error}</span>
          <button
            type="button"
            onClick={() => setError(null)}
            className="text-red-400 hover:text-red-600 text-xs font-bold shrink-0 ml-1"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* State: Idle -> Mic Button */}
      {status === 'idle' && (
        <div className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-200 rounded-xl">
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={disabled}
              onClick={handleMicClick}
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
              onMouseDown={handleTouchStart}
              onMouseUp={handleTouchEnd}
              className="w-10 h-10 rounded-full bg-brand-700 hover:bg-brand-800 text-white flex items-center justify-center shadow-md transition-all active:scale-95 disabled:opacity-50 touch-none shrink-0"
              title="Tap or hold to start voice recording"
              aria-label="Start Voice Recording"
            >
              <Mic className="w-5 h-5" />
            </button>
            <div>
              <p className="text-xs font-bold text-slate-800">
                Record Voice Note
              </p>
              <p className="text-[11px] text-slate-500">
                Tap or press & hold mic to speak your requirement
              </p>
            </div>
          </div>
          <span className="text-[10px] font-bold tracking-wider text-slate-400 uppercase bg-slate-200/60 px-2 py-1 rounded-md shrink-0">
            Voice Optional
          </span>
        </div>
      )}

      {/* State: Recording or Paused */}
      {(status === 'recording' || status === 'paused') && (
        <div className="p-3 bg-red-50/80 border border-red-200 rounded-xl space-y-2.5 animate-in fade-in">
          <div className="flex items-center justify-between">
            {/* Pulsing indicator */}
            <div className="flex items-center gap-2">
              <span className="relative flex h-3 w-3">
                {status === 'recording' && (
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                )}
                <span
                  className={`relative inline-flex rounded-full h-3 w-3 ${
                    status === 'recording' ? 'bg-red-600' : 'bg-amber-500'
                  }`}
                ></span>
              </span>
              <span className="text-xs font-bold text-slate-900">
                {status === 'recording'
                  ? 'Recording Voice Note...'
                  : 'Recording Paused'}
              </span>
            </div>

            {/* Timer display */}
            <div className="text-xs font-mono font-bold text-red-700 bg-red-100 px-2.5 py-1 rounded-lg">
              {formatTime(duration)} / 05:00
            </div>
          </div>

          {/* Animated Waveform bar visualization */}
          {status === 'recording' && (
            <div className="flex items-center justify-center gap-1 h-5 py-1">
              <span className="w-1 bg-red-500 rounded-full h-3 animate-pulse" />
              <span className="w-1 bg-red-600 rounded-full h-5 animate-pulse delay-75" />
              <span className="w-1 bg-red-500 rounded-full h-2 animate-pulse delay-150" />
              <span className="w-1 bg-red-600 rounded-full h-4 animate-pulse delay-100" />
              <span className="w-1 bg-red-500 rounded-full h-3 animate-pulse delay-200" />
            </div>
          )}

          {/* Controls: Pause/Resume, Stop/Done, Cancel */}
          <div className="flex items-center justify-between pt-1 border-t border-red-200/60">
            <button
              type="button"
              onClick={deleteRecording}
              className="text-xs font-bold text-slate-600 hover:text-red-700 flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-red-100/50 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Cancel
            </button>

            <div className="flex items-center gap-2">
              {status === 'recording' ? (
                <button
                  type="button"
                  onClick={pauseRecording}
                  className="px-3 py-1.5 bg-amber-100 hover:bg-amber-200 text-amber-900 text-xs font-bold rounded-lg transition-colors flex items-center gap-1"
                >
                  <Pause className="w-3.5 h-3.5" /> Pause
                </button>
              ) : (
                <button
                  type="button"
                  onClick={resumeRecording}
                  className="px-3 py-1.5 bg-brand-100 hover:bg-brand-200 text-brand-900 text-xs font-bold rounded-lg transition-colors flex items-center gap-1"
                >
                  <Play className="w-3.5 h-3.5" /> Resume
                </button>
              )}

              <button
                type="button"
                onClick={stopRecording}
                className="px-3.5 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg shadow-xs transition-colors flex items-center gap-1.5"
              >
                <Square className="w-3.5 h-3.5 fill-current" /> Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* State: Recorded -> Audio Player preview mode */}
      {status === 'recorded' && previewUrl && (
        <div className="space-y-1.5 animate-in fade-in">
          <VoiceAudioPlayer
            src={previewUrl}
            duration={duration}
            onDelete={deleteRecording}
            onReRecord={handleReRecord}
            label="Attached Voice Note"
          />
          <div className="flex items-center justify-between px-1 text-[11px]">
            <span className="text-emerald-700 font-bold flex items-center gap-1 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              Voice note attached
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
