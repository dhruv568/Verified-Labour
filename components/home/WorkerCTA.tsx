'use client';

import React from 'react';
import Image from 'next/image';
import { ArrowRight, CheckCircle2 } from 'lucide-react';

interface WorkerCTAProps {
  onRegisterWorker?: () => void;
}

export default function WorkerCTA({ onRegisterWorker }: WorkerCTAProps) {
  const benefits = [
    'Create Your Profile',
    'Upload Documents',
    'Get Verified',
    'Receive Job Requests Near You',
    'Grow Your Earnings',
  ];

  return (
    <div className="bg-[#079447] rounded-3xl p-5 sm:p-8 text-white shadow-xl relative overflow-hidden flex flex-col justify-between min-h-[380px] sm:min-h-[420px] lg:min-h-[440px]">
      {/* Decorative Background Glow */}
      <div className="absolute top-0 right-0 w-72 h-72 bg-white/10 rounded-full blur-3xl pointer-events-none z-0" />

      {/* ================= BLENDED WORKER IMAGE (LOW OPACITY LEFT -> FULL OPACITY RIGHT) ================= */}
      <div
        className="absolute bottom-0 right-0 top-0 w-[55%] sm:w-[50%] md:w-[48%] lg:w-[50%] xl:w-[48%] pointer-events-none select-none z-0 overflow-hidden"
        style={{
          maskImage:
            'linear-gradient(to right, transparent 0%, rgba(0,0,0,0.02) 10%, rgba(0,0,0,0.18) 25%, rgba(0,0,0,0.6) 52%, rgba(0,0,0,0.92) 78%, #000 90%, #000 100%)',
          WebkitMaskImage:
            'linear-gradient(to right, transparent 0%, rgba(0,0,0,0.02) 10%, rgba(0,0,0,0.18) 25%, rgba(0,0,0,0.6) 52%, rgba(0,0,0,0.92) 78%, #000 90%, #000 100%)',
        }}
      >
        <div className="relative w-full h-full opacity-35 sm:opacity-100">
          <Image
            src="/images/home/worker-cta-man.jpg"
            alt="Verified Labour - Skilled Indian Craftsman in hardhat"
            fill
            className="object-cover object-[65%_18%] sm:object-[60%_15%] xl:object-[55%_12%] scale-105 transform-gpu"
            sizes="(max-width: 768px) 60vw, 30vw"
          />
        </div>
      </div>

      {/* Soft Solid Green Gradient Overlays - Removes all hard boundaries & keeps text area 100% solid */}
      <div className="absolute inset-y-0 left-0 w-full sm:w-[56%] bg-gradient-to-r from-[#079447] via-[#079447]/95 via-45% to-[#079447]/60 sm:to-transparent pointer-events-none z-10" />
      <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-[#079447] via-[#079447]/40 to-transparent pointer-events-none z-10" />
      <div className="absolute inset-x-0 top-0 h-10 bg-gradient-to-b from-[#079447] via-[#079447]/30 to-transparent pointer-events-none z-10" />

      {/* Side Tagline matching Screenshot */}
      <div className="absolute top-5 right-5 sm:top-6 sm:right-6 z-20 hidden lg:block pointer-events-none text-right">
        <span className="text-xs sm:text-sm font-black text-emerald-100/90 italic tracking-wide drop-shadow-md font-sans">
          Skilled Hands <br />
          Brighter Futures
        </span>
      </div>

      {/* ================= CONTENT AREA ================= */}
      <div className="relative z-20 max-w-full sm:max-w-[54%] lg:max-w-[55%] space-y-3 sm:space-y-3.5">
        {/* Headings */}
        <div className="space-y-1">
          <h3 className="text-2xl sm:text-3xl font-black text-white leading-tight tracking-tight">
            Are You a Worker?
          </h3>
          <p className="text-sm sm:text-base font-bold text-amber-300 font-devanagari tracking-wide">
            कामगार बनें और काम पाएं
          </p>
        </div>

        {/* Subtitle */}
        <p className="text-xs sm:text-sm font-semibold text-emerald-100 leading-snug">
          Register, Get Verified & Find Jobs!
          <span className="block text-[11px] sm:text-xs text-emerald-200/90 font-medium font-devanagari mt-0.5">
            रोज़ाना काम और सम्मान • सीधे बैंक में भुगतान
          </span>
        </p>

        {/* Benefits Checklist */}
        <ul className="space-y-2 pt-1 text-xs sm:text-[13px] font-semibold text-white">
          {benefits.map((b) => (
            <li key={b} className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-amber-300 fill-amber-300 text-[#079447] shrink-0" />
              <span className="leading-tight drop-shadow-2xs">{b}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Button on bottom */}
      <div className="pt-5 sm:pt-6 relative z-20 flex items-center gap-4">
        <button
          type="button"
          onClick={onRegisterWorker}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 min-h-[48px] bg-white hover:bg-slate-50 text-[#079447] font-black text-sm rounded-xl sm:rounded-2xl shadow-lg hover:shadow-xl transition-all shrink-0 active:scale-98"
        >
          <span>Register as a Worker</span>
          <ArrowRight className="w-4 h-4 stroke-[2.5]" />
        </button>
      </div>
    </div>
  );
}
