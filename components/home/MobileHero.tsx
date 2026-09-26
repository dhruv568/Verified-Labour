'use client';

import React from 'react';
import Image from 'next/image';
import { ShieldCheck, Users, Clock, CheckCircle2 } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

interface MobileHeroProps {
  onSearchWorker?: (query?: string) => void;
  onSelectCategory?: (categorySlug: string) => void;
}

export default function MobileHero({
  onSearchWorker,
  onSelectCategory,
}: MobileHeroProps) {
  const { isHindi } = useLanguage();

  return (
    <div className="w-full bg-white pb-2 pt-2 px-3 sm:px-4">
      {/* ================= UNIFIED MOBILE ADVERTISING HERO BANNER CARD ================= */}
      <div className="relative w-full rounded-2xl sm:rounded-3xl bg-gradient-to-br from-[#FFFFFF] via-[#F4F8FE] to-[#E5EFFE] border border-blue-100 shadow-md overflow-hidden p-3.5 sm:p-5">
        
        {/* Decorative subtle background radial glow */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-blue-400/10 rounded-full blur-2xl pointer-events-none" />

        {/* TOP BRAND HEADER ROW INSIDE HERO BANNER */}
        <div className="flex items-center justify-between mb-3 relative z-10 border-b border-blue-100/60 pb-2">
          <div className="flex items-center gap-1.5">
            <span className="text-[#082B66] font-black text-sm sm:text-base tracking-tight font-devanagari">
              Verified<span className="text-[#1264D6]">Labour</span>
            </span>
            <span className="text-[10px] text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded-full border border-amber-200 font-bold font-devanagari">
              {isHindi ? 'सत्यापित' : 'Verified'}
            </span>
          </div>
          <span className="text-[10px] xs:text-[11px] font-bold text-slate-500 font-devanagari">
            {isHindi ? '✓ काम के लिए भरोसेमंद लोग' : '✓ Trusted Skilled Workers'}
          </span>
        </div>

        {/* HERO MAIN BODY GRID (TEXT LEFT + WORKER IMAGE RIGHT) */}
        <div className="grid grid-cols-12 gap-2 items-center relative z-10 min-h-[200px] xs:min-h-[215px]">
          
          {/* LEFT COLUMN: HEADLINE + SUBTEXT */}
          <div className="col-span-7 xs:col-span-7 space-y-2 pr-1">
            {/* HEADLINE */}
            <h1 className="text-lg xs:text-[21px] sm:text-2xl font-black text-[#082B66] leading-[1.18] font-devanagari tracking-tight drop-shadow-2xs">
              {isHindi ? (
                <>
                  आपके पास,<br />
                  आपकी जरूरत के समय<br />
                  <span className="text-[#1264D6]">भरोसेमंद लोग</span>
                </>
              ) : (
                <>
                  Trusted Professionals,<br />
                  Right When You Need Them<br />
                  <span className="text-[#1264D6]">Verified Workers</span>
                </>
              )}
            </h1>

            {/* SUBTEXT BULLETS */}
            <p className="text-[11px] xs:text-xs font-bold text-slate-600 font-devanagari leading-tight">
              {isHindi
                ? 'भरोसेमंद और कुशल कामगार, आपके पास।'
                : 'Verified, nearby & reliable professionals.'}
            </p>

            {/* HIGHLIGHT BADGE */}
            <div className="inline-flex items-center gap-1 bg-emerald-50 text-[#079447] px-2 py-1 rounded-lg border border-emerald-200 text-[10px] font-black font-devanagari">
              <CheckCircle2 className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>{isHindi ? '30s में बुक करें' : 'Book in 30 Seconds'}</span>
            </div>
          </div>

          {/* RIGHT COLUMN: INTEGRATED WORKER VISUAL + GOLD BADGE */}
          <div className="col-span-5 xs:col-span-5 relative h-full min-h-[200px] xs:min-h-[215px] flex items-end justify-center">
            
            {/* Soft backdrop circle for worker visual */}
            <div className="absolute bottom-0 w-32 h-32 xs:w-36 xs:h-36 bg-gradient-to-t from-blue-200/50 to-transparent rounded-full pointer-events-none" />

            {/* WORKFORCE IMAGE - INTELLIGENTLY CROPPED */}
            <div className="relative w-full h-[190px] xs:h-[210px] rounded-b-xl overflow-hidden">
              <Image
                src="/images/home/hero-workers-group.jpg"
                alt="Verified Labour Skilled Worker"
                fill
                priority
                className="object-cover object-[72%_12%] xs:object-[70%_12%] scale-105"
                sizes="(max-width: 640px) 45vw, 200px"
              />
              {/* Left & Bottom soft gradient blend */}
              <div className="absolute inset-y-0 left-0 w-6 xs:w-8 bg-gradient-to-r from-[#F4F8FE] via-[#F4F8FE]/60 to-transparent pointer-events-none" />
              <div className="absolute inset-x-0 bottom-0 h-6 xs:h-8 bg-gradient-to-t from-[#E5EFFE] to-transparent pointer-events-none" />
            </div>

            {/* GOLDEN VERIFICATION BADGE OVERLAY ON WORKER */}
            <div className="absolute bottom-1 right-0 bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600 text-slate-950 px-1.5 xs:px-2 py-0.5 xs:py-1 rounded-xl shadow-lg border border-yellow-200 flex items-center gap-1 text-[9px] xs:text-[10px] font-black font-devanagari z-20 transform rotate-[-2deg]">
              <div className="w-3.5 h-3.5 rounded-full bg-slate-900 text-amber-300 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-2.5 h-2.5 stroke-[3]" />
              </div>
              <span className="leading-tight">
                {isHindi ? 'जाँच-परखे कामगार' : 'Verified Worker'}
              </span>
            </div>
          </div>
        </div>

        {/* BOTTOM THREE COMPACT VALUE/TRUST CARDS (MATCHING REFERENCE) */}
        <div className="grid grid-cols-3 gap-1.5 xs:gap-2 mt-2.5 pt-2.5 border-t border-blue-100/80 relative z-10">
          {/* Card 1: Shield */}
          <div className="bg-white/90 backdrop-blur-xs p-1.5 xs:p-2 rounded-xl border border-slate-200/90 shadow-2xs flex flex-col items-center text-center">
            <div className="w-6 h-6 xs:w-7 xs:h-7 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mb-1 shrink-0">
              <ShieldCheck className="w-3.5 h-3.5 xs:w-4 xs:h-4 stroke-[2.5]" />
            </div>
            <span className="text-[10px] xs:text-[11px] font-black text-[#082B66] font-devanagari leading-tight">
              {isHindi ? 'सुरक्षित और भरोसेमंद' : 'Safe & Reliable'}
            </span>
          </div>

          {/* Card 2: People */}
          <div className="bg-white/90 backdrop-blur-xs p-1.5 xs:p-2 rounded-xl border border-slate-200/90 shadow-2xs flex flex-col items-center text-center">
            <div className="w-6 h-6 xs:w-7 xs:h-7 rounded-full bg-blue-100 text-[#1264D6] flex items-center justify-center mb-1 shrink-0">
              <Users className="w-3.5 h-3.5 xs:w-4 xs:h-4 stroke-[2.5]" />
            </div>
            <span className="text-[10px] xs:text-[11px] font-black text-[#082B66] font-devanagari leading-tight">
              {isHindi ? 'अनुभवी कामगार' : 'Verified Workers'}
            </span>
          </div>

          {/* Card 3: Clock */}
          <div className="bg-white/90 backdrop-blur-xs p-1.5 xs:p-2 rounded-xl border border-slate-200/90 shadow-2xs flex flex-col items-center text-center">
            <div className="w-6 h-6 xs:w-7 xs:h-7 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mb-1 shrink-0">
              <Clock className="w-3.5 h-3.5 xs:w-4 xs:h-4 stroke-[2.5]" />
            </div>
            <span className="text-[10px] xs:text-[11px] font-black text-[#082B66] font-devanagari leading-tight">
              {isHindi ? 'जब ज़रूरत तब सेवा' : 'On-Demand Service'}
            </span>
          </div>
        </div>

      </div>
    </div>
  );
}
