'use client';

import React from 'react';
import { Check, Zap, Users } from 'lucide-react';

export default function TrustIndicators() {
  return (
    <div className="flex flex-wrap items-center gap-4 sm:gap-6 pt-1">
      {/* 1. Verified Workers */}
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-[#079447] text-white flex items-center justify-center shrink-0 shadow-xs">
          <Check className="w-4 h-4 sm:w-5 sm:h-5 stroke-[3]" />
        </div>
        <div className="text-xs sm:text-[13px] font-bold text-[#082B66] leading-tight">
          <span>Verified</span>
          <br />
          <span>Workers</span>
        </div>
      </div>

      {/* 2. On-Demand Service */}
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-[#E53E3E] text-white flex items-center justify-center shrink-0 shadow-xs">
          <Zap className="w-4 h-4 sm:w-5 sm:h-5 fill-white stroke-[2]" />
        </div>
        <div className="text-xs sm:text-[13px] font-bold text-[#082B66] leading-tight">
          <span>On-Demand</span>
          <br />
          <span>Service</span>
        </div>
      </div>

      {/* 3. Safe & Reliable */}
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-[#1264D6] text-white flex items-center justify-center shrink-0 shadow-xs">
          <Users className="w-4 h-4 sm:w-5 sm:h-5 fill-white stroke-[2]" />
        </div>
        <div className="text-xs sm:text-[13px] font-bold text-[#082B66] leading-tight">
          <span>Safe &</span>
          <br />
          <span>Reliable</span>
        </div>
      </div>
    </div>
  );
}
