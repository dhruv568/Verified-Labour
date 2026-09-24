'use client';

import React from 'react';
import Image from 'next/image';
import { ArrowRight, CheckCircle2 } from 'lucide-react';

interface CustomerCTAProps {
  onFindWorker?: () => void;
}

export default function CustomerCTA({ onFindWorker }: CustomerCTAProps) {
  const benefits = [
    'Verified & Trusted Workers',
    'On-Demand & Nearby',
    'Safe & Hassle-Free',
    'Wide Range of Services',
  ];

  return (
    <div className="bg-[#1264D6] rounded-3xl p-5 sm:p-8 text-white shadow-xl relative overflow-hidden flex flex-col justify-between min-h-[380px] sm:min-h-[420px] lg:min-h-[440px]">
      {/* Decorative Background Glow */}
      <div className="absolute top-0 right-0 w-72 h-72 bg-white/10 rounded-full blur-3xl pointer-events-none z-0" />

      {/* ================= BLENDED CUSTOMER IMAGE (LOW OPACITY LEFT -> FULL OPACITY RIGHT) ================= */}
      <div
        className="absolute bottom-0 right-0 top-0 w-[55%] sm:w-[50%] md:w-[48%] lg:w-[50%] xl:w-[48%] pointer-events-none select-none z-0 overflow-hidden"
        style={{
          maskImage:
            'linear-gradient(to right, transparent 0%, rgba(0,0,0,0.05) 5%, rgba(0,0,0,0.35) 20%, rgba(0,0,0,0.85) 45%, #000 65%, #000 100%)',
          WebkitMaskImage:
            'linear-gradient(to right, transparent 0%, rgba(0,0,0,0.05) 5%, rgba(0,0,0,0.35) 20%, rgba(0,0,0,0.85) 45%, #000 65%, #000 100%)',
        }}
      >
        <div className="relative w-full h-full opacity-85 sm:opacity-100">
          <Image
            src="/images/home/customer-cta-woman.jpg"
            alt="Verified Labour - Customer booking skilled workers"
            fill
            className="object-cover object-[70%_20%] sm:object-[64%_18%] xl:object-[60%_15%] scale-105 transform-gpu"
            sizes="(max-width: 768px) 60vw, 30vw"
          />
        </div>
      </div>

      {/* Soft Solid Blue Gradient Overlays - Keeps text area solid while revealing image clearly on right */}
      <div className="absolute inset-y-0 left-0 w-[68%] sm:w-[56%] bg-gradient-to-r from-[#1264D6] via-[#1264D6] via-55% to-transparent pointer-events-none z-10" />
      <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-[#1264D6] via-[#1264D6]/40 to-transparent pointer-events-none z-10" />
      <div className="absolute inset-x-0 top-0 h-10 bg-gradient-to-b from-[#1264D6] via-[#1264D6]/30 to-transparent pointer-events-none z-10" />

      {/* ================= CONTENT AREA ================= */}
      <div className="relative z-20 max-w-[65%] sm:max-w-[54%] lg:max-w-[55%] space-y-3 sm:space-y-3.5">
        {/* Headings */}
        <div className="space-y-1">
          <h3 className="text-2xl sm:text-3xl font-black text-white leading-tight tracking-tight">
            Need a Worker?
          </h3>
          <p className="text-sm sm:text-base font-bold text-amber-300 font-devanagari tracking-wide">
            अपने पास सही कामगार खोजें
          </p>
        </div>

        {/* Subtitle */}
        <p className="text-xs sm:text-sm font-semibold text-blue-100 leading-snug">
          Book a Verified Professional Now
          <span className="block text-[11px] sm:text-xs text-blue-200/90 font-medium font-devanagari mt-0.5">
            100% सत्यापित कारीगर • मिनटों में सेवा
          </span>
        </p>

        {/* Benefits Checklist */}
        <ul className="space-y-2 pt-1 text-xs sm:text-[13px] font-semibold text-white">
          {benefits.map((b) => (
            <li key={b} className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-amber-300 fill-amber-300 text-[#1264D6] shrink-0" />
              <span className="leading-tight drop-shadow-2xs">{b}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Button on bottom */}
      <div className="pt-5 sm:pt-6 relative z-20">
        <button
          type="button"
          onClick={onFindWorker}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 min-h-[48px] bg-white hover:bg-slate-50 text-[#1264D6] font-black text-sm rounded-xl sm:rounded-2xl shadow-lg hover:shadow-xl transition-all shrink-0 active:scale-98"
        >
          <span>Find a Worker</span>
          <ArrowRight className="w-4 h-4 stroke-[2.5]" />
        </button>
      </div>
    </div>
  );
}
