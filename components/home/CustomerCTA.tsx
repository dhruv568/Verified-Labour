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
    <div className="bg-[#1264D6] rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden flex flex-col justify-between min-h-[360px] sm:min-h-[380px]">
      {/* Decorative Background Glow */}
      <div className="absolute top-0 right-0 w-72 h-72 bg-white/10 rounded-full blur-3xl pointer-events-none" />

      {/* Content Area */}
      <div className="relative z-10 max-w-[62%] sm:max-w-[58%] space-y-3">
        <div className="space-y-1">
          <h3 className="text-2xl sm:text-3xl font-black text-white leading-tight tracking-tight">
            Need a Worker?
          </h3>
          <p className="text-sm sm:text-base font-bold text-amber-300 font-devanagari">
            अपने पास सही कामगार खोजें
          </p>
        </div>
        <p className="text-xs sm:text-sm font-semibold text-blue-100">
          Book a Verified Professional Now • 100% सत्यापित कारीगर
        </p>

        {/* Benefits Checklist */}
        <ul className="space-y-2 pt-2 text-xs sm:text-sm font-semibold text-blue-50">
          {benefits.map((b) => (
            <li key={b} className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-amber-300 fill-amber-300 text-[#1264D6] shrink-0" />
              <span>{b}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Button on bottom left */}
      <div className="pt-6 relative z-10">
        <button
          type="button"
          onClick={onFindWorker}
          className="inline-flex items-center gap-2 px-6 py-3.5 bg-white hover:bg-slate-50 text-[#1264D6] font-black text-xs sm:text-sm rounded-xl shadow-lg transition-all shrink-0"
        >
          <span>Find a Worker</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* Human Customer Photography on the right matching Screenshot */}
      <div className="absolute bottom-0 right-0 w-[42%] sm:w-[46%] h-[92%] sm:h-full pointer-events-none flex items-end justify-end">
        <div className="relative w-full h-full">
          <Image
            src="/images/home/customer-cta-woman.jpg"
            alt="Verified Labour - Customer booking skilled workers"
            fill
            className="object-cover object-top sm:object-center drop-shadow-2xl rounded-br-3xl"
            sizes="(max-width: 768px) 45vw, 25vw"
          />
        </div>
      </div>
    </div>
  );
}
