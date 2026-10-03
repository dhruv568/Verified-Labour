'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Bell, MapPin, Calendar, Check, X, ShieldAlert } from 'lucide-react';
import VoiceAudioPlayer from '@/components/VoiceAudioPlayer';
import { useLanguage } from '@/context/LanguageContext';
import { getServiceDisplayName } from '@/lib/service-translations';

export interface PendingJobAlert {
  id: string;
  finalAmount: number;
  createdAt: string;
  status: string;
  customer?: {
    fullName?: string;
    user?: { phone?: string };
  };
  jobRequest?: {
    description?: string;
    voiceNoteUrl?: string;
    voiceNoteDuration?: number;
    formattedAddress?: string;
    urgency?: string;
    preferredDate?: string;
    preferredTime?: string;
    category?: { name?: string };
  };
  service?: {
    name?: string;
    nameHi?: string;
  };
}

interface WorkerBookingAlertModalProps {
  onJobResolved?: () => void;
}

export default function WorkerBookingAlertModal({ onJobResolved }: WorkerBookingAlertModalProps) {
  const { isHindi } = useLanguage();
  const [pendingJobs, setPendingJobs] = useState<PendingJobAlert[]>([]);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const lastSoundPlayedForJobRef = useRef<string | null>(null);

  // Play a subtle notification chime using Web Audio API synthesized tones
  const playNotificationChime = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;

      if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
        audioContextRef.current = new AudioCtx();
      }

      const ctx = audioContextRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume().catch(() => {});
      }

      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, now); // D5
      osc.frequency.exponentialRampToValueAtTime(880.0, now + 0.15); // A5

      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.5);
    } catch {
      // Audio playback safely ignored if browser permissions restrict audio without previous user gesture
    }
  };

  const fetchPendingJobs = async () => {
    try {
      const res = await fetch('/api/jobs/pending');
      const data = await res.json();
      if (data.success && Array.isArray(data.pendingJobs)) {
        setPendingJobs(data.pendingJobs);

        if (data.pendingJobs.length > 0) {
          const firstJobId = data.pendingJobs[0].id;
          if (lastSoundPlayedForJobRef.current !== firstJobId) {
            lastSoundPlayedForJobRef.current = firstJobId;
            playNotificationChime();
          }
        }
      }
    } catch (err) {
      console.error('Failed to poll pending jobs:', err);
    }
  };

  useEffect(() => {
    fetchPendingJobs();

    // Fast 3-second polling for active worker incoming requests
    const interval = setInterval(fetchPendingJobs, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleAccept = async (jobId: string) => {
    setActionLoading(jobId);
    setError(null);
    try {
      const res = await fetch(`/api/jobs/${jobId}/accept`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to accept booking request');
      }

      setPendingJobs((prev) => prev.filter((j) => j.id !== jobId));
      if (onJobResolved) onJobResolved();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (jobId: string) => {
    const promptText = isHindi 
      ? 'क्या आप इस अनुरोध को अस्वीकार करना चाहते हैं?' 
      : 'Are you sure you want to decline this request?';
    if (!confirm(promptText)) {
      return;
    }

    setActionLoading(jobId);
    setError(null);
    try {
      const res = await fetch(`/api/jobs/${jobId}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: 'Worker declined from popup' }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to reject booking request');
      }

      setPendingJobs((prev) => prev.filter((j) => j.id !== jobId));
      if (onJobResolved) onJobResolved();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  if (pendingJobs.length === 0) return null;

  const currentJob = pendingJobs[0];
  const serviceTitle = getServiceDisplayName(
    currentJob.service?.name || currentJob.jobRequest?.category?.name || 'On-Demand Service',
    isHindi
  );

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-in fade-in zoom-in-95 duration-200 font-devanagari">
      <div className="bg-white rounded-2xl sm:rounded-3xl max-w-md w-full shadow-2xl border-2 border-brand-500 overflow-hidden ring-4 ring-brand-100 flex flex-col">
        {/* Prominent Header Banner */}
        <div className="bg-gradient-to-r from-navy-900 via-brand-900 to-navy-800 p-4 sm:p-5 text-white flex items-center justify-between shrink-0 relative overflow-hidden">
          <div className="absolute right-0 top-0 bottom-0 opacity-10 flex items-center pointer-events-none">
            <Bell className="w-24 h-24 text-white -mr-4" />
          </div>

          <div className="relative z-10">
            <div className="flex items-center gap-1.5 bg-brand-500/30 text-brand-300 px-2.5 py-0.5 rounded-full text-[11px] font-black tracking-wider uppercase border border-brand-400/40 w-max mb-1">
              <span className="w-2 h-2 rounded-full bg-brand-400 animate-ping inline-block" />
              <span>{isHindi ? 'नया बुकिंग अनुरोध' : 'New Booking Request'}</span>
            </div>
            <h2 className="text-lg sm:text-xl font-black text-white font-devanagari">
              {serviceTitle}
            </h2>
          </div>

          <div className="text-right shrink-0 z-10">
            <span className="text-[10px] text-brand-200 uppercase font-bold block">{isHindi ? 'शुल्क' : 'Fee'}</span>
            <span className="text-2xl font-black text-brand-400">₹{currentJob.finalAmount}</span>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2 font-devanagari">
              <ShieldAlert className="w-4 h-4 text-red-500 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Customer Info & Urgency */}
          <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase block">{isHindi ? 'ग्राहक' : 'Customer'}</span>
                <span className="font-bold text-slate-900 text-sm font-devanagari">
                  {currentJob.customer?.fullName || (isHindi ? 'सत्यापित ग्राहक' : 'Verified Customer')}
                </span>
              </div>
              <span className="px-2.5 py-1 bg-red-100 text-red-800 font-extrabold text-[11px] rounded-lg border border-red-200 font-devanagari">
                {currentJob.jobRequest?.urgency === 'IMMEDIATE'
                  ? (isHindi ? '🔴 तुरंत आवश्यक' : '🔴 Immediate')
                  : (isHindi ? '📅 शेड्यूल किया हुआ' : '📅 Scheduled')}
              </span>
            </div>

            {currentJob.jobRequest?.formattedAddress && (
              <div className="flex items-start gap-1.5 pt-1 text-slate-700">
                <MapPin className="w-4 h-4 text-brand-600 shrink-0 mt-0.5" />
                <span className="font-medium">{currentJob.jobRequest.formattedAddress}</span>
              </div>
            )}

            {currentJob.jobRequest?.preferredDate && currentJob.jobRequest?.urgency !== 'IMMEDIATE' && (
              <div className="flex items-center gap-1.5 text-slate-600">
                <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>
                  {currentJob.jobRequest.preferredDate} • {currentJob.jobRequest.preferredTime}
                </span>
              </div>
            )}
          </div>

          {/* Customer Work Requirement Description */}
          <div className="space-y-1.5">
            <span className="text-xs font-bold text-slate-700 font-devanagari block">
              {isHindi ? 'काम का विवरण' : 'Work Requirement Details'}
            </span>
            <div className="p-3.5 bg-amber-50/70 border border-amber-200/90 rounded-2xl text-xs text-slate-800 space-y-2 font-devanagari leading-relaxed">
              <p className="font-medium">
                "{currentJob.jobRequest?.description || (isHindi ? 'कृपया विवरण के लिए वॉइस नोट सुनें' : 'Please check voice note')}"
              </p>

              {currentJob.jobRequest?.voiceNoteUrl && (
                <div className="pt-1 border-t border-amber-200/60">
                  <p className="text-[11px] font-bold text-amber-900 mb-1">
                    {isHindi ? 'ग्राहक का वॉइस नोट:' : 'Customer Voice Note:'}
                  </p>
                  <VoiceAudioPlayer
                    src={currentJob.jobRequest.voiceNoteUrl}
                    duration={currentJob.jobRequest.voiceNoteDuration}
                    label={isHindi ? "ग्राहक ऑडियो नोट सुनें" : "Play Customer Audio Note"}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons: ACCEPT / REJECT */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <button
              type="button"
              disabled={actionLoading === currentJob.id}
              onClick={() => handleReject(currentJob.id)}
              className="min-h-[48px] py-3 px-4 bg-white hover:bg-red-50 text-red-700 font-bold rounded-xl border border-red-300 hover:border-red-400 transition-all text-xs sm:text-sm flex items-center justify-center gap-1.5 font-devanagari active:scale-98 disabled:opacity-50"
            >
              <X className="w-4 h-4 text-red-600" />
              <span>{isHindi ? 'अस्वीकार करें' : 'Decline'}</span>
            </button>

            <button
              type="button"
              disabled={actionLoading === currentJob.id}
              onClick={() => handleAccept(currentJob.id)}
              className="min-h-[48px] py-3 px-4 bg-brand-700 hover:bg-brand-800 text-white font-bold rounded-xl shadow-md hover:shadow-lg transition-all text-xs sm:text-sm flex items-center justify-center gap-1.5 font-devanagari active:scale-98 disabled:opacity-50"
            >
              {actionLoading === currentJob.id ? (
                <span>{isHindi ? 'प्रक्रिया जारी...' : 'Accepting...'}</span>
              ) : (
                <>
                  <Check className="w-4.5 h-4.5 stroke-[2.5]" />
                  <span>{isHindi ? 'स्वीकार करें' : 'Accept'}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
