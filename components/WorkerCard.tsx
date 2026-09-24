'use client';

import React from 'react';
import { CheckCircle2, Star, MapPin, Clock, ShieldCheck, Award } from 'lucide-react';

export interface WorkerData {
  id: string;
  fullName: string;
  avatarUrl?: string;
  bio?: string;
  experienceYears: number;
  status: string;
  isAvailable: boolean;
  hourlyRate?: number;
  city?: string;
  primaryCategory?: { name: string; slug: string };
  skills?: any[];
  serviceAreas?: string[];
  distanceKm?: number | null;
  formattedDistance?: string;
  badges: {
    isIdentityVerified: boolean;
    isBankVerified: boolean;
    isSkillVerified: boolean;
    isFullyVerified: boolean;
  };
  rating: number;
  reviewCount: number;
}

interface WorkerCardProps {
  worker: WorkerData;
  onRequestBooking: (worker: WorkerData) => void;
  onViewProfile?: (worker: WorkerData) => void;
}

export default function WorkerCard({
  worker,
  onRequestBooking,
  onViewProfile,
}: WorkerCardProps) {
  const avatarFallback = worker.fullName
    ? worker.fullName
        .split(' ')
        .map((n) => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : 'WL';

  return (
    <article className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between group">
      <div>
        {/* Top bar: Avatar, Name, Verification, Rating */}
        <div className="flex items-start gap-3 sm:gap-4">
          <div className="relative shrink-0">
            {worker.avatarUrl ? (
              <img
                src={worker.avatarUrl}
                alt={worker.fullName}
                className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl object-cover border border-slate-100 shadow-2xs"
              />
            ) : (
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl bg-brand-100 text-brand-800 font-black text-base sm:text-lg flex items-center justify-center border border-brand-200">
                {avatarFallback}
              </div>
            )}
            {worker.badges.isFullyVerified && (
              <div
                className="absolute -bottom-1 -right-1 bg-brand-600 text-white rounded-full p-0.5 shadow-xs"
                title="Verified Professional"
              >
                <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-brand-600 text-white stroke-[2.5]" />
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <h3 className="font-bold text-slate-900 text-sm sm:text-base truncate">
                {worker.fullName}
              </h3>
              {worker.badges.isFullyVerified && (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-extrabold bg-brand-50 text-brand-800 border border-brand-200">
                  <ShieldCheck className="w-3 h-3 text-brand-600" />
                  VERIFIED
                </span>
              )}
            </div>

            <p className="text-xs font-bold text-slate-600 mt-0.5">
              {worker.primaryCategory?.name || 'Skilled Professional'} •{' '}
              <span className="font-semibold text-slate-500">{worker.experienceYears}+ yrs exp</span>
            </p>

            {/* Rating and Distance */}
            <div className="flex items-center gap-3 mt-1.5 sm:mt-2 text-xs flex-wrap">
              <div className="flex items-center gap-1 font-bold text-slate-800">
                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                <span>{worker.rating.toFixed(1)}</span>
                <span className="text-slate-400 font-normal">({worker.reviewCount})</span>
              </div>

              <div className="flex items-center gap-1 text-slate-500 font-medium">
                <MapPin className="w-3.5 h-3.5 text-brand-600 shrink-0" />
                <span className="truncate">{worker.formattedDistance || worker.city || 'Nearby'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Verification Checkpoint Pills (Cashfree Aadhaar, Bank, Skills) */}
        <div className="flex flex-wrap gap-1.5 mt-3.5 pt-3 border-t border-slate-100">
          {worker.badges.isIdentityVerified && (
            <span className="inline-flex items-center gap-1 text-[10px] sm:text-[11px] font-semibold text-slate-700 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-200">
              <CheckCircle2 className="w-3 h-3 text-brand-600" /> Identity
            </span>
          )}
          {worker.badges.isBankVerified && (
            <span className="inline-flex items-center gap-1 text-[10px] sm:text-[11px] font-semibold text-slate-700 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-200">
              <CheckCircle2 className="w-3 h-3 text-brand-600" /> Bank Verified
            </span>
          )}
          {worker.badges.isSkillVerified && (
            <span className="inline-flex items-center gap-1 text-[10px] sm:text-[11px] font-semibold text-slate-700 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-200">
              <Award className="w-3 h-3 text-brand-600" /> Skills Verified
            </span>
          )}
        </div>

        {/* Bio / Services */}
        {worker.bio && (
          <p className="text-xs text-slate-600 mt-2.5 line-clamp-2 leading-relaxed">
            {worker.bio}
          </p>
        )}

        {/* Service areas served */}
        {worker.serviceAreas && worker.serviceAreas.length > 0 && (
          <div className="mt-2 text-[11px] text-slate-500 line-clamp-1">
            <span className="font-semibold text-slate-700">Areas: </span>
            {worker.serviceAreas.slice(0, 4).join(', ')}
            {worker.serviceAreas.length > 4 && ` +${worker.serviceAreas.length - 4} more`}
          </div>
        )}
      </div>

      {/* Footer: Pricing & Action Buttons */}
      <div className="mt-4 pt-3.5 sm:pt-4 border-t border-slate-100 flex flex-col min-[380px]:flex-row min-[380px]:items-center justify-between gap-3">
        <div className="flex items-baseline justify-between min-[380px]:block">
          <div>
            <span className="text-[10px] sm:text-[11px] text-slate-400 font-medium block">Starting from</span>
            <span className="text-base sm:text-lg font-black text-navy-900">
              ₹{worker.hourlyRate || 300}
              <span className="text-xs font-normal text-slate-500"> / job</span>
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full min-[380px]:w-auto">
          {onViewProfile && (
            <button
              onClick={() => onViewProfile(worker)}
              className="flex-1 min-[380px]:flex-initial min-h-[44px] px-3.5 py-2 text-xs font-bold text-slate-700 hover:text-navy-900 hover:bg-slate-100 active:bg-slate-200 rounded-xl transition-colors border border-slate-200 min-[380px]:border-transparent"
            >
              Profile
            </button>
          )}
          <button
            onClick={() => onRequestBooking(worker)}
            className="flex-1 min-[380px]:flex-initial min-h-[44px] px-4 py-2 bg-brand-700 hover:bg-brand-800 active:scale-98 text-white font-bold text-xs sm:text-sm rounded-xl shadow-xs transition-all flex items-center justify-center whitespace-nowrap"
          >
            Request Worker
          </button>
        </div>
      </div>
    </article>
  );
}
