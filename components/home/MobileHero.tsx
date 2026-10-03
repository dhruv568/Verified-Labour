'use client';

import React from 'react';
import Image from 'next/image';
import { ShieldCheck, Users, Clock, ArrowRight, CheckCircle2 } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { useContent } from '@/context/ContentContext';

interface MobileHeroProps {
  onSearchWorker?: (query?: string) => void;
  onSelectCategory?: (categorySlug: string) => void;
}

export default function MobileHero({ onSearchWorker }: MobileHeroProps) {
  const { isHindi, t } = useLanguage();
  const { content: siteContent } = useContent();
  const [imgError, setImgError] = React.useState(false);

  let rawTitle = siteContent.hero_title;
  let rawSubtitle = siteContent.hero_subtitle;

  const isDefaultOrLegacyTitle =
    !rawTitle ||
    rawTitle === "India's #1 Labour Hub" ||
    rawTitle === "Trusted Workers For" ||
    rawTitle === "Trusted Professionals, Right When You Need Them" ||
    rawTitle === "आपकी जरूरत के समय" ||
    rawTitle === "आपकी जरूरत के समय कुशल लोग" ||
    rawTitle === "Skilled People When You Need Them";

  const isDefaultOrLegacySubtitle =
    !rawSubtitle ||
    rawSubtitle === "Your Home & Business" ||
    rawSubtitle === "Verified. Nearby. Reliable." ||
    rawSubtitle === "Verified, nearby, and reliable skilled professionals." ||
    rawSubtitle === "भरोसेमंद और कुशल कामगार";

  const titleText = isHindi
    ? t.heroTitle
    : (isDefaultOrLegacyTitle ? t.heroTitle : rawTitle);

  const subtitleText = isHindi
    ? t.heroSubtitle
    : (isDefaultOrLegacySubtitle ? (rawSubtitle || t.heroSubtitle) : rawSubtitle);

  // Dynamic Content Data Structure
  const content = {
    brandTagline: isHindi ? '✓ काम के लिए भरोसेमंद लोग' : '✓ Trusted Skilled Workers',
    badgeText: isHindi ? 'सत्यापित कामगार' : 'Verified Workers',
    headlineLine1: titleText,
    headlineLine2: subtitleText,
    supportingBullets: isHindi
      ? (siteContent.hero_description_hi || t.heroDescription || 'सत्यापित • अनुभवी • भरोसेमंद')
      : (siteContent.hero_description || t.heroDescription || 'Verified • Experienced • Reliable • Near You'),
    ctaText: siteContent.hero_button_primary || (isHindi ? 'अभी कामगार बुक करें' : 'Book a Worker Now'),
    trustSeals: {
      verifiedSeal: isHindi ? 'जाँच-परखे कामगार' : 'Verified Worker',
    },
    quickFeatures: [
      {
        icon: ShieldCheck,
        color: 'text-emerald-600 bg-emerald-100/90 border-emerald-200',
        text: isHindi ? 'सुरक्षित और भरोसेमंद' : 'Safe & Reliable',
      },
      {
        icon: Users,
        color: 'text-[#1264D6] bg-blue-100/90 border-blue-200',
        text: isHindi ? 'अनुभवी कामगार' : 'Experienced Workers',
      },
      {
        icon: Clock,
        color: 'text-amber-600 bg-amber-100/90 border-amber-200',
        text: isHindi ? 'तुरंत सेवा' : 'Quick Service',
      },
    ],
  };

  return (
    <div className="w-full bg-white pb-3 pt-2 px-3 sm:px-4">
      {/* ================= ORIGINAL MOBILE ADVERTISING HERO BANNER CARD ================= */}
      <div className="relative w-full rounded-2xl sm:rounded-3xl bg-gradient-to-br from-[#FFFFFF] via-[#F3F7FE] via-60% to-[#E2EEFE] border border-blue-100 shadow-md overflow-hidden p-3.5 xs:p-4 sm:p-5 animate-in fade-in duration-300">
        
        {/* Subtle Decorative Background Radial Glows */}
        <div className="absolute top-0 right-0 w-52 h-52 bg-blue-400/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-40 h-40 bg-amber-300/10 rounded-full blur-2xl pointer-events-none" />

        {/* 1. TOP BRAND HEADER ROW INSIDE HERO CARD */}
        <div className="flex items-center justify-between gap-1.5 mb-3 relative z-10 border-b border-blue-100/80 pb-2">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[#082B66] font-black text-base xs:text-lg tracking-tight font-devanagari">
              Verified<span className="text-[#1264D6]">Labour</span>
            </span>
            <span className="text-[10px] xs:text-[11px] font-bold text-amber-900 bg-amber-100/90 px-2 py-0.5 rounded-full border border-amber-300/70 font-devanagari whitespace-nowrap">
              {content.badgeText}
            </span>
          </div>
          <span className="text-[10px] xs:text-[11px] font-bold text-slate-500 font-devanagari whitespace-nowrap shrink-0">
            {content.brandTagline}
          </span>
        </div>

        {/* 2. MAIN HERO BODY GRID (LEFT: TEXT & CTA | RIGHT: WORKER IMAGE VISUAL) */}
        <div className="grid grid-cols-12 gap-2 items-center relative z-10 min-h-[210px] xs:min-h-[225px] sm:min-h-[240px]">
          
          {/* LEFT CONTENT COLUMN (7 / 12 COLS) */}
          <div className="col-span-7 xs:col-span-7 space-y-2 pr-1">
            
            {/* HINDI & ENGLISH HEADLINE */}
            <div className="space-y-0.5">
              <h1 className="text-base xs:text-lg sm:text-xl font-black text-[#082B66] leading-[1.2] font-devanagari tracking-tight drop-shadow-2xs">
                {content.headlineLine1}
              </h1>
              <span className="text-xs xs:text-sm font-bold text-[#1264D6] block mt-0.5 font-devanagari leading-snug">
                {content.headlineLine2}
              </span>
            </div>

            {/* SUPPORTING TEXT BULLETS / PARAGRAPH */}
            <p className="text-[10px] xs:text-[11.5px] font-medium text-slate-600 font-devanagari leading-tight tracking-tight">
              {content.supportingBullets}
            </p>

            {/* PRIMARY HERO CTA BUTTON */}
            <div className="pt-1">
              <button
                type="button"
                onClick={() => onSearchWorker?.()}
                className="w-full xs:w-auto px-3 py-2.5 bg-gradient-to-r from-[#1264D6] to-[#0A4DB3] hover:from-[#0D54BD] hover:to-[#083D91] active:scale-97 text-white font-extrabold text-xs xs:text-sm rounded-xl shadow-md transition-all duration-150 flex items-center justify-center gap-1.5 cursor-pointer font-devanagari border border-blue-400/20 group"
              >
                <span>{content.ctaText}</span>
                <ArrowRight className="w-3.5 h-3.5 xs:w-4 xs:h-4 stroke-[2.5] group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>

          </div>

          {/* RIGHT WORKER VISUAL COLUMN (5 / 12 COLS) */}
          <div className="col-span-5 xs:col-span-5 relative h-full min-h-[190px] xs:min-h-[210px] sm:min-h-[230px] flex items-end justify-center">
            
            {/* Soft subtle blue radial background glow behind worker */}
            <div className="absolute bottom-0 w-32 h-32 xs:w-36 xs:h-36 bg-gradient-to-t from-blue-300/40 via-blue-200/20 to-transparent rounded-full pointer-events-none" />

            {/* WORKER IMAGE DIRECTLY ON RIGHT SIDE */}
            <div className="relative w-full h-[180px] xs:h-[200px] sm:h-[220px] overflow-hidden rounded-xl border border-blue-100/70 shadow-2xs bg-slate-100/50">
              {!imgError ? (
                <Image
                  src="/images/home/mobile-hero-worker.jpg"
                  alt="Verified Labour Professional Skilled Worker"
                  fill
                  priority
                  unoptimized
                  onError={() => setImgError(true)}
                  className="object-cover object-top transform scale-105"
                  sizes="(max-width: 640px) 45vw, 200px"
                />
              ) : (
                <img
                  src="/images/home/mobile-hero-worker.jpg"
                  alt="Verified Labour Professional Skilled Worker"
                  className="w-full h-full object-cover object-top transform scale-105"
                />
              )}

              {/* Gradient Mask for seamless edge blending */}
              <div className="absolute inset-y-0 left-0 w-6 bg-gradient-to-r from-[#F3F7FE] via-[#F3F7FE]/60 to-transparent pointer-events-none z-10" />
              <div className="absolute inset-x-0 bottom-0 h-5 bg-gradient-to-t from-[#E2EEFE] to-transparent pointer-events-none z-10" />
            </div>

            {/* GOLDEN VERIFICATION BADGE OVERLAY ON WORKER */}
            <div className="absolute bottom-1 right-0 bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600 text-slate-950 px-1.5 xs:px-2 py-0.5 rounded-lg shadow-md border border-yellow-200 flex items-center gap-1 text-[9px] xs:text-[10px] font-black font-devanagari z-20">
              <div className="w-3 h-3 rounded-full bg-slate-900 text-amber-300 flex items-center justify-center shrink-0">
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
                className="bg-white/95 backdrop-blur-xs p-1.5 xs:p-2 rounded-xl border border-slate-200/90 shadow-2xs flex flex-col items-center justify-center text-center min-h-[64px] xs:min-h-[68px] h-full"
              >
                <div
                  className={`w-6 h-6 xs:w-7 xs:h-7 rounded-full flex items-center justify-center mb-1 shrink-0 border ${feat.color}`}
                >
                  <IconComp className="w-3 h-3 xs:w-3.5 xs:h-3.5 stroke-[2.5]" />
                </div>
                <span className="text-[9.5px] xs:text-[10.5px] font-extrabold text-[#082B66] font-devanagari leading-tight text-center">
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
