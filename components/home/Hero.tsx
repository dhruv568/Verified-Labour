'use client';

import React from 'react';
import Image from 'next/image';
import TrustIndicators from './TrustIndicators';
import LocationSearch from './LocationSearch';
import PopularSearches from './PopularSearches';

interface HeroProps {
  onSearchWorker?: (query: string) => void;
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
          <p className="text-xs sm:text-sm lg:text-[15px] font-black text-[#082B66] leading-tight truncate sm:whitespace-normal">
            Who is <span className="text-[#DC2626] underline decoration-[#DC2626] decoration-2">NOT</span> on{' '}
            <span className="text-[#082B66]">Verified Labour</span>?
          </p>
        </div>
      </div>

      {/* View All Button */}
      <button
        type="button"
        onClick={onViewAllCategories}
        className="px-3.5 py-1.5 sm:px-4 sm:py-2 bg-white hover:bg-slate-50 text-[#1264D6] font-black text-xs sm:text-sm rounded-xl sm:rounded-2xl border border-slate-300/80 shadow-xs hover:shadow transition-all shrink-0 active:scale-95"
      >
        View All
      </button>
    </div>
  );

  return (
    <section className="relative bg-white pt-6 pb-12 sm:pt-8 sm:pb-16 lg:py-16 xl:py-20 border-b border-slate-200 overflow-hidden min-h-[580px] lg:min-h-[660px] xl:min-h-[720px] flex items-center">
      {/* ================= BACKGROUND BLENDED WORKER GROUP (DESKTOP & TABLET) ================= */}
      {/*
        Horizontal Opacity Gradient:
        - Left: Very low opacity / heavily faded into the white background behind the text
        - Center: Medium opacity with a soft natural transition
        - Right: High opacity / fully visible and detailed workers
        - No hard edges, borders, cards, or boxes
      */}
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

      {/* Soft White Left Fade Overlay - Guarantees 100% crisp text readability */}
      <div className="hidden lg:block absolute inset-y-0 left-0 w-[44%] xl:w-[40%] bg-gradient-to-r from-white via-white/95 to-transparent pointer-events-none z-10" />

      {/* Soft Bottom Fade Overlay - Smoothly dissolves workers into the white section border */}
      <div className="hidden md:block absolute inset-x-0 bottom-0 h-16 lg:h-24 bg-gradient-to-t from-white via-white/60 to-transparent pointer-events-none z-10" />

      {/* Soft Top Fade Overlay */}
      <div className="hidden md:block absolute inset-x-0 top-0 h-10 lg:h-14 bg-gradient-to-b from-white/80 via-white/20 to-transparent pointer-events-none z-10" />

      {/* ================= HERO CONTENT WRAPPER ================= */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative w-full z-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 xl:gap-10 items-center">
          {/* ================= LEFT COLUMN: Headline & Search ================= */}
          <div className="lg:col-span-7 xl:col-span-6 space-y-5 sm:space-y-6 z-20">
            {/* Headline */}
            <div className="space-y-1.5">
              <h1 className="text-4xl sm:text-5xl xl:text-[54px] font-black text-[#082B66] tracking-tight leading-[1.12]">
                Skilled People
                <br />
                When You Need Them
              </h1>

              {/* Subtitle */}
              <p className="text-xl sm:text-2xl font-bold text-[#1264D6] tracking-tight">
                Verified. Nearby. Reliable.
              </p>
            </div>

            {/* Supporting description */}
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-lg font-normal">
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

          {/* ================= RIGHT COLUMN: Desktop & Tablet Controls ================= */}
          <div className="hidden md:flex lg:col-span-5 xl:col-span-6 flex-col justify-between items-end min-h-[380px] lg:min-h-[520px] xl:min-h-[580px] relative z-20 pointer-events-none">
            {/* Top Right Promotional Tag */}
            {renderPromotionalTag()}

            {/* Bottom Floating Yellow Banner */}
            {renderYellowBanner()}
          </div>
        </div>

        {/* ================= MOBILE VIEW: Stacked Layout ================= */}
        <div className="block md:hidden mt-8 space-y-4">
          {/* Mobile Promotional Tag */}
          <div className="flex justify-end pr-2">
            {renderPromotionalTag()}
          </div>

          {/* Mobile Worker Group Visual - Edge-to-edge organic blend without box/card */}
          <div
            className="relative w-full h-[260px] sm:h-[320px] overflow-hidden"
            style={{
              maskImage:
                'linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.2) 6%, #000 20%, #000 85%, transparent 100%)',
              WebkitMaskImage:
                'linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.2) 6%, #000 20%, #000 85%, transparent 100%)',
            }}
          >
            <Image
              src="/images/home/hero-workers-group.jpg"
              alt="Verified Labour - Professional Indian skilled workers group composition"
              fill
              priority
              className="object-cover object-[55%_25%]"
              sizes="100vw"
            />
          </div>

          {/* Mobile Yellow Banner */}
          <div className="mt-[-16px] relative z-20">
            {renderYellowBanner()}
          </div>
        </div>
      </div>
    </section>
  );
}
