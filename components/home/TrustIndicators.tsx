'use client';

import React from 'react';
import { Check, Zap, Users } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

export default function TrustIndicators() {
  const { isHindi } = useLanguage();

  return (
    <div className="grid grid-cols-1 min-[460px]:grid-cols-3 sm:flex sm:flex-wrap items-center gap-3 sm:gap-6 pt-1">
      {/* 1. Verified Workers */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-[#079447] text-white flex items-center justify-center shrink-0 shadow-xs">
          <Check className="w-5 h-5 stroke-[3]" />
        </div>
        <div className="text-sm sm:text-[13px] font-bold text-[#082B66] leading-tight font-devanagari">
          <span className="block text-sm sm:text-[13px] text-[#082B66] font-extrabold">
            {isHindi ? 'सत्यापित कामगार' : 'Verified Workers'}
          </span>
        </div>
      </div>

      {/* 2. On-Demand Service */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-[#E53E3E] text-white flex items-center justify-center shrink-0 shadow-xs">
          <Zap className="w-5 h-5 fill-white stroke-[2]" />
        </div>
        <div className="text-sm sm:text-[13px] font-bold text-[#082B66] leading-tight font-devanagari">
          <span className="block text-sm sm:text-[13px] text-[#082B66] font-extrabold">
            {isHindi ? 'जब ज़रूरत हो, तब सेवा' : 'On-Demand Service'}
          </span>
        </div>
      </div>

      {/* 3. Safe & Reliable */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-[#1264D6] text-white flex items-center justify-center shrink-0 shadow-xs">
          <Users className="w-5 h-5 fill-white stroke-[2]" />
        </div>
        <div className="text-sm sm:text-[13px] font-bold text-[#082B66] leading-tight font-devanagari">
          <span className="block text-sm sm:text-[13px] text-[#082B66] font-extrabold">
            {isHindi ? 'सुरक्षित और भरोसेमंद' : 'Safe & Reliable'}
          </span>
        </div>
      </div>
    </div>
  );
}
