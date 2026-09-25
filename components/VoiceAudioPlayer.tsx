'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Volume2, Trash2, Mic, RotateCcw } from 'lucide-react';

interface VoiceAudioPlayerProps {
  src: string;
  duration?: number | null;
  onDelete?: () => void;
  onReRecord?: () => void;
  className?: string;
  label?: string;
}

export default function VoiceAudioPlayer({
  src,
  duration,
  onDelete,
  onReRecord,
  className = '',
  label = 'Voice Note',
}: VoiceAudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [totalDuration, setTotalDuration] = useState(duration || 0);

  useEffect(() => {
    if (duration && duration > 0) {
      setTotalDuration(duration);
    }
  }, [duration]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
    const handleLoadedMetadata = () => {
      if (audio.duration && !isNaN(audio.duration) && isFinite(audio.duration)) {
        setTotalDuration(Math.round(audio.duration));
      }
    };
    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [src]);

  const togglePlay = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current
        .play()
        .then(() => setIsPlaying(true))
        .catch((err) => console.error('Audio playback error:', err));
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    setCurrentTime(time);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
    }
  };

  const formatTime = (secs: number) => {
    if (!secs || isNaN(secs)) return '00:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div
      className={`bg-slate-50 border border-slate-200 rounded-xl p-2.5 sm:p-3 flex items-center gap-3 shadow-2xs ${className}`}
    >
      <audio ref={audioRef} src={src} preload="metadata" />

      <button
        type="button"
        onClick={togglePlay}
        aria-label={isPlaying ? 'Pause voice note' : 'Play voice note'}
        className="w-9 h-9 rounded-full bg-brand-700 hover:bg-brand-800 text-white flex items-center justify-center shrink-0 shadow-xs transition-transform active:scale-95"
      >
        {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
      </button>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between text-[11px] font-bold text-slate-700 mb-1">
          <span className="flex items-center gap-1.5 truncate">
            <Volume2 className="w-3.5 h-3.5 text-brand-600 shrink-0" />
            <span className="truncate">{label}</span>
          </span>
          <span className="text-slate-500 font-medium shrink-0 ml-2">
            {formatTime(currentTime)} / {formatTime(totalDuration)}
          </span>
        </div>
        <input
          type="range"
          min={0}
          max={totalDuration || 100}
          value={currentTime}
          onChange={handleSeek}
          className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-brand-600"
        />
      </div>

      {(onDelete || onReRecord) && (
        <div className="flex items-center gap-1 shrink-0">
          {onReRecord && (
            <button
              type="button"
              onClick={onReRecord}
              aria-label="Re-record voice note"
              className="w-8 h-8 rounded-lg text-slate-400 hover:text-brand-700 hover:bg-brand-50 flex items-center justify-center transition-colors shrink-0"
              title="Re-record"
            >
              <Mic className="w-4 h-4" />
            </button>
          )}
          {onDelete && (
            <button
              type="button"
              onClick={onDelete}
              aria-label="Delete voice note"
              className="w-8 h-8 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 flex items-center justify-center transition-colors shrink-0"
              title="Delete"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
