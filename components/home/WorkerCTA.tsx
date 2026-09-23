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
    <div className="bg-[#079447] rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden flex flex-col justify-between min-h-[360px] sm:min-h-[380px]">
      {/* Decorative Background Glow */}
      <div className="absolute top-0 right-0 w-72 h-72 bg-white/10 rounded-full blur-3xl pointer-events-none" />

      {/* Content Area */}
      <div className="relative z-10 max-w-[62%] sm:max-w-[58%] space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
          <h3 className="text-2xl sm:text-3xl font-black text-white leading-tight tracking-tight">
            Are You a Worker?
          </h3>
        </div>

        <p className="text-sm sm:text-base font-bold text-emerald-100">
          Register, Get Verified & Find Jobs!
        </p>

        {/* Benefits Checklist */}
        <ul className="space-y-1.5 pt-2 text-xs sm:text-sm font-semibold text-emerald-50">
          {benefits.map((b) => (
            <li key={b} className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-amber-300 fill-amber-300 text-[#079447] shrink-0" />
              <span>{b}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Button on bottom left */}
      <div className="pt-6 relative z-10 flex items-center gap-4">
        <button
          type="button"
          onClick={onRegisterWorker}
          className="inline-flex items-center gap-2 px-6 py-3.5 bg-white hover:bg-slate-50 text-[#079447] font-black text-xs sm:text-sm rounded-xl shadow-lg transition-all shrink-0"
        >
          <span>Register as a Worker</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* Human Worker Photography on the right matching Screenshot */}
      <div className="absolute bottom-0 right-0 w-[42%] sm:w-[46%] h-[92%] sm:h-full pointer-events-none flex items-end justify-end">
        <div className="relative w-full h-full">
          <Image
            src="/images/home/worker-cta-man.jpg"
            alt="Verified Labour - Skilled Indian Craftsman in hardhat"
            fill
            className="object-cover object-top sm:object-center drop-shadow-2xl rounded-br-3xl"
            sizes="(max-width: 768px) 45vw, 25vw"
          />
        </div>
      </div>

      {/* Side Tagline matching Screenshot */}
      <div className="absolute top-6 right-6 z-20 hidden xl:block pointer-events-none text-right">
        <span className="text-xs font-bold text-emerald-100 italic tracking-wide drop-shadow-xs">
          Skilled Hands <br />
          Brighter Futures
        </span>
      </div>
    </div>
  );
}
