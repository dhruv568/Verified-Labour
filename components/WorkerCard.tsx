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
    <article className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between group">
      <div>
        {/* Top bar: Avatar, Name, Verification, Rating */}
        <div className="flex items-start gap-4">
          <div className="relative">
            {worker.avatarUrl ? (
              <img
                src={worker.avatarUrl}
                alt={worker.fullName}
                className="w-16 h-16 rounded-2xl object-cover border border-slate-100 shadow-xs"
              />
            ) : (
              <div className="w-16 h-16 rounded-2xl bg-brand-100 text-brand-800 font-black text-lg flex items-center justify-center border border-brand-200">
                {avatarFallback}
              </div>
            )}
            {worker.badges.isFullyVerified && (
              <div
                className="absolute -bottom-1 -right-1 bg-brand-600 text-white rounded-full p-0.5 shadow-sm"
                title="Verified Professional"
              >
                <CheckCircle2 className="w-4 h-4 fill-brand-600 text-white stroke-[2.5]" />
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <h3 className="font-bold text-slate-900 text-base truncate">
                {worker.fullName}
              </h3>
              {worker.badges.isFullyVerified && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-brand-50 text-brand-800 border border-brand-200">
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
            <div className="flex items-center gap-3 mt-2 text-xs">
              <div className="flex items-center gap-1 font-bold text-slate-800">
                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                <span>{worker.rating.toFixed(1)}</span>
                <span className="text-slate-400 font-normal">({worker.reviewCount})</span>
              </div>

              <div className="flex items-center gap-1 text-slate-500 font-medium">
                <MapPin className="w-3.5 h-3.5 text-brand-600" />
                <span>{worker.formattedDistance || worker.city || 'Nearby'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Verification Checkpoint Pills (Cashfree Aadhaar, Bank, Skills) */}
        <div className="flex flex-wrap gap-1.5 mt-4 pt-3 border-t border-slate-100">
          {worker.badges.isIdentityVerified && (
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-700 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-200">
              <CheckCircle2 className="w-3 h-3 text-brand-600" /> Identity
            </span>
          )}
          {worker.badges.isBankVerified && (
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-700 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-200">
              <CheckCircle2 className="w-3 h-3 text-brand-600" /> Bank Verified
            </span>
          )}
          {worker.badges.isSkillVerified && (
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-700 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-200">
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
      <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between gap-2">
        <div>
          <span className="text-[11px] text-slate-400 font-medium block">Starting from</span>
          <span className="text-base font-black text-navy-900">
            ₹{worker.hourlyRate || 300}
            <span className="text-xs font-normal text-slate-500"> / job</span>
          </span>
        </div>

        <div className="flex items-center gap-2">
          {onViewProfile && (
            <button
              onClick={() => onViewProfile(worker)}
              className="px-3 py-2 text-xs font-bold text-slate-700 hover:text-navy-900 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Profile
            </button>
          )}
          <button
            onClick={() => onRequestBooking(worker)}
            className="px-4 py-2 bg-brand-700 hover:bg-brand-800 text-white font-bold text-xs rounded-xl shadow-sm transition-all"
          >
            Request Worker
          </button>
        </div>
      </div>
    </article>
  );
}
