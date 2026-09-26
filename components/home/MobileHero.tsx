'use client';

import React from 'react';
import Image from 'next/image';
import { ShieldCheck, Users, Clock, ArrowRight, CheckCircle2 } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

interface MobileHeroProps {
  onSearchWorker?: (query?: string) => void;
  onSelectCategory?: (categorySlug: string) => void;
}

export default function MobileHero({ onSearchWorker }: MobileHeroProps) {
  const { isHindi } = useLanguage();

  // Dynamic Content Data Structure based on active language
  const content = {
    brandTagline: isHindi ? '✓ काम के लिए भरोसेमंद लोग' : '✓ Trusted Skilled Workers',
    badgeText: isHindi ? 'सत्यापित कामगार' : 'Verified Workers',
    headlineLine1: isHindi ? 'आपके घर और व्यवसाय' : 'Trusted Workers For',
    headlineLine2: isHindi ? 'के लिए भरोसेमंद कामगार' : 'Your Home & Business',
    supportingBullets: isHindi
      ? 'सत्यापित • अनुभवी • भरोसेमंद • आपके पास'
      : 'Verified • Experienced • Reliable • Near You',
    ctaText: isHindi ? 'अभी कामगार बुक करें' : 'Book a Worker Now',
    trustSeals: {
      verifiedSeal: isHindi ? 'जाँच-परखे कामगार' : 'Verified Worker',
    },
    quickFeatures: [
      {
        icon: ShieldCheck,
        color: 'text-emerald-600 bg-emerald-100/80',
        text: isHindi ? 'सुरक्षित और भरोसेमंद' : 'Safe & Reliable',
      },
      {
        icon: Users,
        color: 'text-[#1264D6] bg-blue-100/80',
        text: isHindi ? 'अनुभवी कामगार' : 'Experienced Workers',
      },
      {
        icon: Clock,
        color: 'text-amber-600 bg-amber-100/80',
        text: isHindi ? 'तुरंत सेवा' : 'Quick Service',
      },
    ],
  };

  return (
    <div className="w-full bg-white pb-3 pt-2 px-3 sm:px-4">
      {/* ================= PURPOSE-BUILT MOBILE ADVERTISING HERO BANNER ================= */}
      <div className="relative w-full rounded-2xl sm:rounded-3xl bg-gradient-to-br from-[#FFFFFF] via-[#F3F7FE] via-60% to-[#E2EEFE] border border-blue-100/90 shadow-lg overflow-hidden p-3.5 xs:p-4 sm:p-5 animate-in fade-in duration-300">
        
        {/* Subtle Decorative Background Radial Glows */}
        <div className="absolute top-0 right-0 w-52 h-52 bg-blue-400/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-40 h-40 bg-amber-300/10 rounded-full blur-2xl pointer-events-none" />

        {/* 1. TOP BRAND HEADER ROW INSIDE ADVERTISING HERO */}
        <div className="flex items-center justify-between mb-3 relative z-10 border-b border-blue-100/70 pb-2">
          <div className="flex items-center gap-1.5">
            <span className="text-[#082B66] font-black text-base xs:text-lg tracking-tight font-devanagari">
              Verified<span className="text-[#1264D6]">Labour</span>
            </span>
            <span className="text-[10px] text-amber-800 bg-amber-100/80 px-1.5 py-0.5 rounded-full border border-amber-300/60 font-bold font-devanagari">
              {content.badgeText}
            </span>
          </div>
          <span className="text-[10px] xs:text-[11px] font-bold text-slate-500 font-devanagari">
            {content.brandTagline}
          </span>
        </div>

        {/* 2. MAIN HERO BODY GRID (LEFT: TEXT & CTA | RIGHT: AI WORKER VISUAL) */}
        <div className="grid grid-cols-12 gap-2 items-center relative z-10 min-h-[220px] xs:min-h-[235px]">
          
          {/* LEFT CONTENT COLUMN (6.5 / 12 COLS) */}
          <div className="col-span-7 xs:col-span-7 space-y-2.5 pr-1">
            
            {/* HEADLINE */}
            <div className="space-y-0.5">
              <h1 className="text-[19px] xs:text-[22px] sm:text-2xl font-black text-[#082B66] leading-[1.16] font-devanagari tracking-tight drop-shadow-2xs">
                {content.headlineLine1}
                <br />
                <span className="text-[#1264D6] block mt-0.5">
                  {content.headlineLine2}
                </span>
              </h1>
            </div>

            {/* SUPPORTING TEXT BULLETS */}
            <p className="text-[10px] xs:text-[11.5px] font-bold text-slate-600 font-devanagari leading-tight tracking-tight">
              {content.supportingBullets}
            </p>

            {/* PRIMARY HERO CTA BUTTON */}
            <div className="pt-1">
              <button
                type="button"
                onClick={() => onSearchWorker?.()}
                className="w-full xs:w-auto px-3.5 py-2.5 bg-gradient-to-r from-[#1264D6] to-[#0A4DB3] hover:from-[#0D54BD] hover:to-[#083D91] active:scale-97 text-white font-extrabold text-xs xs:text-sm rounded-xl shadow-md transition-all duration-150 flex items-center justify-center gap-1.5 cursor-pointer font-devanagari border border-blue-400/20 group"
              >
                <span>{content.ctaText}</span>
                <ArrowRight className="w-4 h-4 stroke-[2.5] group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>

          </div>

          {/* RIGHT WORKER VISUAL COLUMN (5.5 / 12 COLS) */}
          <div className="col-span-5 xs:col-span-5 relative h-full min-h-[210px] xs:min-h-[230px] flex items-end justify-center">
            
            {/* Soft subtle blue radial background glow behind worker */}
            <div className="absolute bottom-0 w-36 h-36 xs:w-40 xs:h-40 bg-gradient-to-t from-blue-300/40 via-blue-200/20 to-transparent rounded-full pointer-events-none" />

            {/* AI WORKER IMAGE INTEGRATED DIRECTLY INTO HERO CANVAS */}
            <div className="relative w-full h-[200px] xs:h-[225px] overflow-hidden flex items-end justify-center">
              <Image
                src="/images/home/mobile-hero-worker.jpg"
                alt="Verified Labour Professional Skilled Worker"
                fill
                priority
                className="object-cover object-[center_10%] transform scale-110 drop-shadow-md"
                sizes="(max-width: 640px) 50vw, 220px"
              />
              {/* Left side soft gradient mask so worker blends seamlessly into hero background */}
              <div className="absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-[#F3F7FE] via-[#F3F7FE]/70 to-transparent pointer-events-none" />
              <div className="absolute inset-x-0 bottom-0 h-6 bg-gradient-to-t from-[#E2EEFE] to-transparent pointer-events-none" />
            </div>

            {/* GOLDEN VERIFICATION BADGE OVERLAY ON WORKER */}
            <div className="absolute bottom-1 right-0 bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600 text-slate-950 px-1.5 xs:px-2 py-0.5 xs:py-1 rounded-xl shadow-lg border border-yellow-200 flex items-center gap-1 text-[9px] xs:text-[10px] font-black font-devanagari z-20 transform -rotate-2">
              <div className="w-3.5 h-3.5 rounded-full bg-slate-900 text-amber-300 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-2.5 h-2.5 stroke-[3]" />
              </div>
              <span className="leading-tight whitespace-nowrap">
                {content.trustSeals.verifiedSeal}
              </span>
            </div>

          </div>
        </div>

        {/* 3. THREE COMPACT QUICK TRUST FEATURE CARDS AT BOTTOM OF HERO */}
        <div className="grid grid-cols-3 gap-1.5 xs:gap-2 mt-3 pt-2.5 border-t border-blue-100/90 relative z-10">
          {content.quickFeatures.map((feat, index) => {
            const IconComp = feat.icon;
            return (
              <div
                key={index}
                className="bg-white/95 backdrop-blur-xs p-1.5 xs:p-2 rounded-xl border border-slate-200/80 shadow-2xs flex flex-col items-center text-center transition-all"
              >
                <div
                  className={`w-6 h-6 xs:w-7 xs:h-7 rounded-full flex items-center justify-center mb-1 shrink-0 ${feat.color}`}
                >
                  <IconComp className="w-3.5 h-3.5 stroke-[2.5]" />
                </div>
                <span className="text-[9.5px] xs:text-[10.5px] font-black text-[#082B66] font-devanagari leading-tight">
                  {feat.text}
                </span>
              </div>
            );
          })}
        </div>

      </div>
    </div>
  );
}
