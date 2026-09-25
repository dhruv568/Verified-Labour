'use client';

import React from 'react';
import { X, CheckCircle2, Star, MapPin, ShieldCheck, Award, Calendar, Briefcase, IndianRupee, PhoneCall } from 'lucide-react';
import { WorkerData } from './WorkerCard';

interface WorkerProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  worker: WorkerData | null;
  onRequestBooking: (worker: WorkerData) => void;
}

export default function WorkerProfileModal({
  isOpen,
  onClose,
  worker,
  onRequestBooking,
}: WorkerProfileModalProps) {
  if (!isOpen || !worker) return null;

  const initials = worker.fullName
    ? worker.fullName
        .split(' ')
        .map((n) => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : 'WL';

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-t-3xl sm:rounded-3xl max-w-xl w-full shadow-2xl border border-slate-100 overflow-hidden max-h-[92vh] flex flex-col">
        {/* Header Banner */}
        <div className="bg-[#082B66] text-white p-5 sm:p-6 relative shrink-0">
          <button
            onClick={onClose}
            aria-label="Close"
            className="absolute top-4 right-4 w-9 h-9 rounded-full bg-blue-950/60 text-slate-300 hover:text-white hover:bg-blue-900 flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-start gap-4">
            {/* Live Worker Photo */}
            <div className="relative shrink-0">
              {worker.avatarUrl ? (
                <img
                  src={worker.avatarUrl}
                  alt={worker.fullName}
                  className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover border-2 border-emerald-400 shadow-lg"
                />
              ) : (
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-amber-400 text-slate-950 font-black text-2xl flex items-center justify-center border-2 border-white shadow-lg">
                  {initials}
                </div>
              )}
              {worker.badges.isFullyVerified && (
                <div className="absolute -bottom-1.5 -right-1.5 bg-emerald-500 text-white rounded-full p-1 shadow-md border-2 border-[#082B66]" title="Verified Professional">
                  <CheckCircle2 className="w-4 h-4 stroke-[3]" />
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0 pr-8">
              <div className="flex items-center gap-1.5 flex-wrap">
                <h2 className="text-lg sm:text-xl font-black text-white truncate">
                  {worker.fullName}
                </h2>
                {worker.badges.isFullyVerified && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-400/20 text-emerald-300 border border-emerald-400/40 uppercase tracking-wider flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" /> VERIFIED
                  </span>
                )}
              </div>

              <p className="text-xs text-blue-200 font-bold mt-1">
                {worker.primaryCategory?.name || 'Skilled Professional'} • {worker.experienceYears}+ years exp
              </p>

              <div className="flex items-center gap-3 mt-2 text-xs flex-wrap">
                <div className="flex items-center gap-1 font-bold text-amber-300">
                  <Star className="w-4 h-4 fill-amber-300 text-amber-300" />
                  <span>{worker.rating.toFixed(1)}</span>
                  <span className="text-blue-200 font-normal">({worker.reviewCount} reviews)</span>
                </div>
                <div className="flex items-center gap-1 text-blue-200 font-medium">
                  <MapPin className="w-3.5 h-3.5 text-amber-300" />
                  <span>{worker.formattedDistance || worker.city || 'Nearby'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Profile Content Body */}
        <div className="p-5 sm:p-6 space-y-4 overflow-y-auto">
          {/* Trust Checkpoints */}
          <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-2">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Official Platform Trust Checkpoints
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              <div className="p-2 bg-white rounded-xl border border-slate-200 text-[11px] font-semibold text-slate-800 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Live Photo</span>
              </div>
              <div className="p-2 bg-white rounded-xl border border-slate-200 text-[11px] font-semibold text-slate-800 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Aadhaar Identity</span>
              </div>
              <div className="p-2 bg-white rounded-xl border border-slate-200 text-[11px] font-semibold text-slate-800 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Bank Verified</span>
              </div>
            </div>
          </div>

          {/* Bio Overview */}
          {worker.bio && (
            <div>
              <h4 className="text-xs font-bold text-slate-900 mb-1">About & Experience</h4>
              <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                {worker.bio}
              </p>
            </div>
          )}

          {/* Service Areas */}
          {worker.serviceAreas && worker.serviceAreas.length > 0 && (
            <div>
              <h4 className="text-xs font-bold text-slate-900 mb-1.5">Coverage Localities</h4>
              <div className="flex flex-wrap gap-1.5">
                {worker.serviceAreas.map((area, i) => (
                  <span
                    key={i}
                    className="px-2.5 py-1 bg-slate-100 text-slate-700 font-semibold text-xs rounded-lg border border-slate-200"
                  >
                    {area}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Pricing Banner */}
          <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-2xl flex items-center justify-between">
            <div>
              <span className="text-[11px] text-emerald-800 font-bold block">Standard Service Rate</span>
              <span className="text-lg font-black text-emerald-950">
                ₹{worker.hourlyRate || 350} <span className="text-xs font-normal text-slate-600">/ job</span>
              </span>
            </div>
            <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100 px-3 py-1 rounded-full border border-emerald-300">
              Pay after service
            </span>
          </div>
        </div>

        {/* Modal Footer CTA */}
        <div className="p-4 sm:p-5 bg-slate-50 border-t border-slate-200 flex items-center gap-3 shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-3 border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold text-xs sm:text-sm rounded-xl transition-colors"
          >
            Close
          </button>
          <button
            onClick={() => {
              onClose();
              onRequestBooking(worker);
            }}
            className="flex-1 py-3 bg-[#1264D6] hover:bg-blue-700 text-white font-black text-xs sm:text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
          >
            <PhoneCall className="w-4 h-4" />
            <span>Request Worker Now</span>
          </button>
        </div>
      </div>
    </div>
  );
}
