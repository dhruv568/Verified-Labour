'use client';

import React from 'react';
import { CheckCircle2, Star, MapPin, ShieldCheck, Award } from 'lucide-react';

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
  primaryCategoryId?: string;
  primaryCategory?: { id?: string; name: string; slug: string };
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
    <article className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between h-full w-full overflow-hidden group">
      {/* Upper Content Section */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header: Avatar + Info */}
        <div className="flex items-start gap-3 sm:gap-4 min-w-0">
          <div className="relative shrink-0">
            {worker.avatarUrl ? (
              <img
                src={worker.avatarUrl}
                alt={worker.fullName}
                loading="lazy"
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
            {/* Name + Verified Badge */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <h3 className="font-bold text-slate-900 text-sm sm:text-base truncate max-w-full">
                {worker.fullName}
              </h3>
              {worker.badges.isFullyVerified && (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-extrabold bg-brand-50 text-brand-800 border border-brand-200 shrink-0">
                  <ShieldCheck className="w-3 h-3 text-brand-600 shrink-0" />
                  सत्यापित / VERIFIED
                </span>
              )}
            </div>

            {/* Profession + Experience */}
            <p className="text-xs font-bold text-slate-600 mt-0.5 truncate">
              {worker.primaryCategory?.name || 'Skilled Professional'} •{' '}
              <span className="font-semibold text-slate-500">{worker.experienceYears}+ yrs exp</span>
            </p>

            {/* Rating and Distance */}
            <div className="flex items-center gap-3 mt-1.5 sm:mt-2 text-xs flex-wrap">
              <div className="flex items-center gap-1 font-bold text-slate-800 shrink-0">
                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400 shrink-0" />
                <span>{worker.rating.toFixed(1)}</span>
                <span className="text-slate-400 font-normal">({worker.reviewCount})</span>
              </div>

              <div className="flex items-center gap-1 text-slate-500 font-medium min-w-0 truncate">
                <MapPin className="w-3.5 h-3.5 text-brand-600 shrink-0" />
                <span className="truncate">{worker.formattedDistance || worker.city || 'Nearby'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Status / Availability Indicator */}
        <div className="mt-2.5 flex items-center gap-1.5">
          <span
            className={`w-2 h-2 rounded-full shrink-0 ${
              worker.isAvailable ? 'bg-brand-600 animate-pulse' : 'bg-slate-300'
            }`}
          />
          <span className="text-[11px] font-semibold text-slate-600 font-devanagari">
            {worker.isAvailable ? 'उपलब्ध / Available Now' : 'बुकिंग पर उपलब्ध / Available on Booking'}
          </span>
        </div>

        {/* Verification Badges */}
        <div className="flex flex-wrap gap-1.5 mt-2.5 pt-2.5 border-t border-slate-100">
          {worker.badges.isIdentityVerified && (
            <span className="inline-flex items-center gap-1 text-[10px] sm:text-[11px] font-semibold text-slate-700 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-200 font-devanagari">
              <CheckCircle2 className="w-3 h-3 text-brand-600 shrink-0" /> पहचान / Identity
            </span>
          )}
          {worker.badges.isBankVerified && (
            <span className="inline-flex items-center gap-1 text-[10px] sm:text-[11px] font-semibold text-slate-700 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-200 font-devanagari">
              <CheckCircle2 className="w-3 h-3 text-brand-600 shrink-0" /> बैंक सत्यापित / Bank Verified
            </span>
          )}
          {worker.badges.isSkillVerified && (
            <span className="inline-flex items-center gap-1 text-[10px] sm:text-[11px] font-semibold text-slate-700 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-200 font-devanagari">
              <Award className="w-3 h-3 text-brand-600 shrink-0" /> कौशल / Skills Verified
            </span>
          )}
        </div>

        {/* Bio / Services */}
        {worker.bio && (
          <p className="text-xs text-slate-600 mt-2.5 line-clamp-2 leading-relaxed">
            {worker.bio}
          </p>
        )}

        {/* Service Areas */}
        {worker.serviceAreas && worker.serviceAreas.length > 0 && (
          <div className="mt-2 text-[11px] text-slate-500 line-clamp-1 mb-3">
            <span className="font-semibold text-slate-700">Areas: </span>
            {worker.serviceAreas.slice(0, 4).join(', ')}
            {worker.serviceAreas.length > 4 && ` +${worker.serviceAreas.length - 4} more`}
          </div>
        )}
      </div>

      {/* Footer: Dedicated Pricing & Action Buttons Section */}
      <div className="mt-auto pt-3.5 sm:pt-4 border-t border-slate-100 flex flex-col gap-3 w-full">
        <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2.5 w-full">
          {/* Price Section */}
          <div className="shrink-0 min-w-fit">
            <span className="text-[10px] sm:text-[11px] text-slate-400 font-medium block font-devanagari leading-none mb-1">
              शुरुआती / Starting
            </span>
            <div className="flex items-baseline gap-1">
              <span className="text-base sm:text-lg font-black text-navy-900 leading-none">
                ₹{worker.hourlyRate || 300}
              </span>
              <span className="text-xs font-normal text-slate-500 leading-none">/ job</span>
            </div>
          </div>

          {/* Action Buttons Section */}
          <div className="flex items-center gap-2 flex-1 min-w-[210px] max-w-full justify-end">
            {onViewProfile && (
              <button
                type="button"
                onClick={() => onViewProfile(worker)}
                className="flex-1 min-w-0 min-h-[44px] px-2.5 py-1.5 text-xs font-bold text-slate-700 hover:text-navy-900 bg-slate-50 hover:bg-slate-100 active:bg-slate-200 rounded-xl transition-colors border border-slate-200 font-devanagari flex items-center justify-center text-center leading-tight"
              >
                <span className="block text-center">
                  <span className="inline-block">प्रोफाइल</span>
                  <span className="inline-block mx-0.5 text-slate-400">/</span>
                  <span className="inline-block font-sans text-[11px] font-semibold text-slate-600">Profile</span>
                </span>
              </button>
            )}
            <button
              type="button"
              onClick={() => onRequestBooking(worker)}
              className="flex-1 min-w-0 min-h-[44px] px-3 py-1.5 bg-brand-700 hover:bg-brand-800 active:scale-98 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center text-center font-devanagari leading-tight max-w-full"
            >
              <span className="block text-center">
                <span className="inline-block">30s में बुक करें</span>
                <span className="inline-block mx-0.5 opacity-80">/</span>
                <span className="inline-block font-sans text-[11px] font-semibold opacity-95">Book Now</span>
              </span>
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}
