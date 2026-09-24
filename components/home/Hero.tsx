'use client';

import React from 'react';
import Image from 'next/image';
import TrustIndicators from './TrustIndicators';
import LocationSearch from './LocationSearch';
import PopularSearches from './PopularSearches';
import { ShieldCheck, Users, Clock, CheckCircle2, Sparkles } from 'lucide-react';

interface HeroProps {
  onSearchWorker?: (query?: string) => void;
  onSelectCategory?: (categorySlug: string) => void;
  onViewAllCategories?: () => void;
}

export default function Hero({
  onSearchWorker,
  onSelectCategory,
  onViewAllCategories,
}: HeroProps) {
  // Shared Promotional Top-Right Handwritten Tag
  const renderPromotionalTag = () => (
    <div className="text-right select-none pointer-events-auto">
      <p className="text-xs sm:text-sm lg:text-[15px] font-extrabold tracking-tight leading-snug">
        <span className="text-[#1264D6] block">Different Jobs</span>
        <span className="text-[#1264D6] block">Same Opportunities</span>
        <span className="text-[#082B66] block">A Stronger India</span>
      </p>
      <div className="flex justify-end mt-1">
        <svg
          className="w-5 h-5 lg:w-6 lg:h-6 text-[#1264D6]"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <circle cx="8" cy="9" r="1.2" fill="currentColor" stroke="none" />
          <circle cx="16" cy="9" r="1.2" fill="currentColor" stroke="none" />
          <path d="M7 13.5c1.5 2.5 4.5 3.5 5 3.5s3.5-1 5-3.5" />
        </svg>
      </div>
    </div>
  );

  // Shared Floating Yellow Callout Banner with 3D Red Question Mark
  const renderYellowBanner = () => (
    <div className="w-full max-w-md lg:max-w-lg bg-[#FFE600] rounded-2xl sm:rounded-3xl p-3 sm:p-4 border-2 border-amber-400/90 shadow-xl shadow-amber-900/10 flex items-center justify-between gap-3 sm:gap-4 transform -rotate-1 hover:rotate-0 transition-transform duration-200 pointer-events-auto">
      <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0">
        {/* 3D Glossy Red Question Mark Icon matching reference */}
        <div className="relative shrink-0 flex items-center justify-center">
          <svg
            className="w-8 h-10 sm:w-9 sm:h-11 drop-shadow-[0_3px_5px_rgba(180,0,0,0.35)]"
            viewBox="0 0 40 48"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <defs>
              <linearGradient id="hero-qmark-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FF4D4D" />
                <stop offset="45%" stopColor="#E60000" />
                <stop offset="100%" stopColor="#990000" />
              </linearGradient>
            </defs>
            {/* 3D extruded bevel / shadow */}
            <path
              d="M20 7C14.5 7 10 11 10 16.5C10 18.4 11.6 20 13.5 20C15.4 20 17 18.4 17 16.5C17 14.8 18.3 13.5 20 13.5C21.7 13.5 23 14.8 23 16.5C23 18.2 21.6 19.5 20.1 20.8C17.3 23.2 16 25.5 16 29C16 30.7 17.3 32 19 32C20.7 32 22 30.7 22 29C22 27 22.8 25.8 24.5 24.2C27 22 30 19.5 30 15.5C30 10.8 25.5 7 20 7ZM19 37C17.3 37 16 38.3 16 40C16 41.7 17.3 43 19 43C20.7 43 22 41.7 22 40C22 38.3 20.7 37 19 37Z"
              fill="#800000"
              transform="translate(1.2, 1.8)"
            />
            {/* Main 3D Question Mark Body */}
            <path
              d="M20 7C14.5 7 10 11 10 16.5C10 18.4 11.6 20 13.5 20C15.4 20 17 18.4 17 16.5C17 14.8 18.3 13.5 20 13.5C21.7 13.5 23 14.8 23 16.5C23 18.2 21.6 19.5 20.1 20.8C17.3 23.2 16 25.5 16 29C16 30.7 17.3 32 19 32C20.7 32 22 30.7 22 29C22 27 22.8 25.8 24.5 24.2C27 22 30 19.5 30 15.5C30 10.8 25.5 7 20 7ZM19 37C17.3 37 16 38.3 16 40C16 41.7 17.3 43 19 43C20.7 43 22 41.7 22 40C22 38.3 20.7 37 19 37Z"
              fill="url(#hero-qmark-grad)"
              stroke="#FFFFFF"
              strokeWidth="1.2"
            />
            {/* Glossy specular highlight */}
            <ellipse cx="16" cy="11.5" rx="3.5" ry="1.8" fill="white" fillOpacity="0.65" transform="rotate(-30 16 11.5)" />
          </svg>
        </div>

        {/* Banner text */}
        <div className="min-w-0">
          <p className="text-[10px] sm:text-xs font-black text-[#082B66] uppercase tracking-wider">
            Let us Know...
          </p>
          <p className="text-xs sm:text-sm lg:text-[15px] font-black text-[#082B66] leading-tight">
            Who is <span className="text-[#DC2626] underline decoration-[#DC2626] decoration-2">NOT</span> on{' '}
            <span className="text-[#082B66]">Verified Labour</span>?
          </p>
        </div>
      </div>

      {/* View All Button */}
      <button
        type="button"
        onClick={onViewAllCategories}
        className="px-3.5 py-2 sm:px-4 sm:py-2 bg-white hover:bg-slate-50 text-[#1264D6] font-black text-xs sm:text-sm rounded-xl sm:rounded-2xl border border-slate-300/80 shadow-xs hover:shadow transition-all shrink-0 active:scale-95 min-h-[38px] flex items-center justify-center"
      >
        View All
      </button>
    </div>
  );

  return (
    <section className="relative bg-white pt-0 pb-6 sm:pt-8 sm:pb-16 lg:py-16 xl:py-20 border-b border-slate-200 overflow-hidden md:min-h-[580px] lg:min-h-[660px] xl:min-h-[720px] flex items-center">
      {/* ================= DESKTOP & TABLET BACKGROUND BLENDED WORKER GROUP ================= */}
      <div
        className="hidden md:block absolute inset-y-0 right-0 w-[62%] lg:w-[74%] xl:w-[70%] 2xl:w-[66%] h-full pointer-events-none select-none z-0 overflow-hidden"
        style={{
          maskImage:
            'linear-gradient(to right, transparent 0%, rgba(0,0,0,0.02) 10%, rgba(0,0,0,0.12) 22%, rgba(0,0,0,0.42) 42%, rgba(0,0,0,0.85) 68%, #000 85%, #000 100%)',
          WebkitMaskImage:
            'linear-gradient(to right, transparent 0%, rgba(0,0,0,0.02) 10%, rgba(0,0,0,0.12) 22%, rgba(0,0,0,0.42) 42%, rgba(0,0,0,0.85) 68%, #000 85%, #000 100%)',
        }}
      >
        <div className="relative w-full h-full">
          <Image
            src="/images/home/hero-workers-group.jpg"
            alt="Verified Labour - Professional Indian skilled workers group composition"
            fill
            priority
            className="object-cover object-[68%_25%] lg:object-[64%_22%] xl:object-[62%_20%] scale-100 md:scale-95 lg:scale-105 xl:scale-110 transform-gpu"
            sizes="(max-width: 1024px) 70vw, 75vw"
          />
        </div>
      </div>

      {/* Soft White Left Fade Overlay (Desktop) */}
      <div className="hidden lg:block absolute inset-y-0 left-0 w-[44%] xl:w-[40%] bg-gradient-to-r from-white via-white/95 to-transparent pointer-events-none z-10" />

      {/* Soft Bottom Fade Overlay (Desktop) */}
      <div className="hidden md:block absolute inset-x-0 bottom-0 h-16 lg:h-24 bg-gradient-to-t from-white via-white/60 to-transparent pointer-events-none z-10" />

      {/* Soft Top Fade Overlay (Desktop) */}
      <div className="hidden md:block absolute inset-x-0 top-0 h-10 lg:h-14 bg-gradient-to-b from-white/80 via-white/20 to-transparent pointer-events-none z-10" />

      {/* ================= DESKTOP / PC HERO CONTENT WRAPPER (md and above) ================= */}
      <div className="hidden md:block max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative w-full z-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 xl:gap-10 items-center">
          {/* LEFT COLUMN: Headline & Search */}
          <div className="lg:col-span-7 xl:col-span-6 space-y-5 sm:space-y-6 z-20">
            {/* Headline */}
            <div className="space-y-1.5">
              <h1 className="text-3xl sm:text-5xl xl:text-[54px] font-black text-[#082B66] tracking-tight leading-[1.14]">
                Skilled People
                <br />
                When You Need Them
              </h1>

              {/* Subtitle */}
              <p className="text-lg sm:text-2xl font-bold text-[#1264D6] tracking-tight">
                Verified. Nearby. Reliable.
              </p>
            </div>

            {/* Supporting description */}
            <p className="text-sm sm:text-sm text-slate-600 leading-relaxed max-w-lg font-normal">
              From electricians to cooks, from house caretakers to office boys — find
              verified workers near you, just like Ola or Uber.
            </p>

            {/* 3 Circular Trust Badges */}
            <TrustIndicators />

            {/* Location & Search Bar */}
            <LocationSearch onSearch={onSearchWorker} />

            {/* Popular Searches Pills */}
            <PopularSearches onSelectCategory={onSelectCategory} />
          </div>

          {/* RIGHT COLUMN: Desktop & Tablet Controls */}
          <div className="hidden md:flex lg:col-span-5 xl:col-span-6 flex-col justify-between items-end min-h-[380px] lg:min-h-[520px] xl:min-h-[580px] relative z-20 pointer-events-none">
            {/* Top Right Promotional Tag */}
            {renderPromotionalTag()}

            {/* Bottom Floating Yellow Banner */}
            {renderYellowBanner()}
          </div>
        </div>
      </div>

      {/* ================= MOBILE HERO VIEW ONLY (< md / 320px – 430px) - RECREATED WITH PURE HTML/CSS ================= */}
      <div className="block md:hidden w-full max-w-md mx-auto px-3.5 relative z-20 pt-3 space-y-4">
        {/* Top Hindi Tagline & Badge Bar */}
        <div className="flex items-center justify-between gap-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-[#1264D6] rounded-full text-xs font-black border border-blue-200/80 font-devanagari shadow-2xs">
            <Sparkles className="w-3.5 h-3.5 text-[#1264D6]" />
            <span>काम के लिए भरोसेमंद लोग</span>
          </div>

          <div className="inline-flex items-center gap-1 bg-amber-400 text-[#082B66] px-2.5 py-1 rounded-full text-[11px] font-black shadow-2xs border border-amber-300 font-devanagari">
            <CheckCircle2 className="w-3.5 h-3.5 fill-[#082B66] text-amber-400" />
            <span>जाँच-परखे कामगार</span>
          </div>
        </div>

        {/* Main Bilingual Headlines */}
        <div className="space-y-1">
          <h1 className="text-2xl font-black text-[#082B66] leading-[1.2] font-devanagari tracking-tight">
            आपके घर और व्यवसाय के लिए <br />
            <span className="text-[#1264D6]">भरोसेमंद मजदूर</span> और <span className="text-[#079447]">कामगार</span>
          </h1>
          <p className="text-xs font-extrabold text-slate-600 font-devanagari tracking-normal">
            जाँच-परखे • अनुभवी • समय पर उपलब्ध
          </p>
        </div>

        {/* Blended Realistic AI Worker Image Card with Gold 3D Badge Overlay */}
        <div className="relative w-full h-[195px] xs:h-[215px] rounded-2xl overflow-hidden shadow-md border border-slate-200 bg-slate-900">
          <Image
            src="/images/home/worker-cta-man.jpg"
            alt="Verified Labour Professional Skilled Indian Worker"
            fill
            priority
            className="object-cover object-[60%_20%] scale-105"
            sizes="(max-width: 767px) 100vw, 430px"
          />

          {/* Left Gradient Overlay with Verification Pill */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#082B66]/85 via-[#082B66]/35 to-transparent p-3.5 flex flex-col justify-end">
            <div className="bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/80 max-w-[210px] shadow-xs">
              <div className="flex items-center gap-1.5 text-[#079447]">
                <CheckCircle2 className="w-4 h-4 shrink-0 fill-[#079447] text-white" />
                <span className="text-[11px] font-black text-[#082B66] font-devanagari">100% Aadhaar Verified</span>
              </div>
              <p className="text-[9.5px] text-slate-600 font-semibold leading-tight mt-0.5 font-devanagari">
                सत्यापित एवं प्रशिक्षित कारीगर
              </p>
            </div>
          </div>

          {/* Floating Gold 3D Badge */}
          <div className="absolute top-3 right-3 bg-gradient-to-br from-amber-300 via-amber-400 to-amber-600 text-slate-950 p-2 rounded-full shadow-lg border-2 border-amber-200 flex flex-col items-center justify-center text-center w-16 h-16 transform rotate-6">
            <CheckCircle2 className="w-4 h-4 fill-slate-950 text-amber-300 mb-0.5" />
            <span className="text-[8.5px] font-black font-devanagari leading-tight">जाँच-परखे</span>
            <span className="text-[7.5px] font-extrabold font-devanagari leading-none">कामगार</span>
          </div>
        </div>

        {/* 3 Separate HTML/CSS Rounded Trust Cards */}
        <div className="grid grid-cols-3 gap-2">
          {/* Card 1: Safe & Reliable */}
          <div className="bg-white rounded-2xl p-2.5 border border-slate-200/90 shadow-2xs flex flex-col items-center justify-center text-center hover:shadow-xs transition-shadow">
            <div className="w-9 h-9 rounded-full bg-emerald-50 text-[#079447] flex items-center justify-center mb-1.5 shadow-2xs border border-emerald-100">
              <ShieldCheck className="w-5 h-5 stroke-[2.5]" />
            </div>
            <span className="text-[11px] font-black text-[#082B66] font-devanagari leading-tight">
              सुरक्षित और भरोसेमंद
            </span>
            <span className="text-[9px] text-slate-500 font-semibold mt-0.5">
              Safe & Reliable
            </span>
          </div>

          {/* Card 2: Skilled Workers */}
          <div className="bg-white rounded-2xl p-2.5 border border-slate-200/90 shadow-2xs flex flex-col items-center justify-center text-center hover:shadow-xs transition-shadow">
            <div className="w-9 h-9 rounded-full bg-blue-50 text-[#1264D6] flex items-center justify-center mb-1.5 shadow-2xs border border-blue-100">
              <Users className="w-5 h-5 stroke-[2.5]" />
            </div>
            <span className="text-[11px] font-black text-[#082B66] font-devanagari leading-tight">
              अनुभवी कामगार
            </span>
            <span className="text-[9px] text-slate-500 font-semibold mt-0.5">
              Skilled Workers
            </span>
          </div>

          {/* Card 3: Available When Needed */}
          <div className="bg-white rounded-2xl p-2.5 border border-slate-200/90 shadow-2xs flex flex-col items-center justify-center text-center hover:shadow-xs transition-shadow">
            <div className="w-9 h-9 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mb-1.5 shadow-2xs border border-amber-100">
              <Clock className="w-5 h-5 stroke-[2.5]" />
            </div>
            <span className="text-[11px] font-black text-[#082B66] font-devanagari leading-tight">
              जब ज़रूरत तब उपलब्ध
            </span>
            <span className="text-[9px] text-slate-500 font-semibold mt-0.5">
              On-Demand
            </span>
          </div>
        </div>

        {/* Location & Worker Search Bar */}
        <LocationSearch onSearch={onSearchWorker} />

        {/* Category Pills / Popular Searches */}
        <PopularSearches onSelectCategory={onSelectCategory} />

        {/* Mobile Yellow Callout Banner */}
        <div className="pt-0.5">
          {renderYellowBanner()}
        </div>

        {/* Mobile Promotional Tag */}
        <div className="flex justify-end pt-0.5 pr-1">
          {renderPromotionalTag()}
        </div>
      </div>
    </section>
  );
}
