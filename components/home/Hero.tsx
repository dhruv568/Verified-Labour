'use client';

import React from 'react';
import Image from 'next/image';
import TrustIndicators from './TrustIndicators';
import LocationSearch from './LocationSearch';
import PopularSearches from './PopularSearches';

interface HeroProps {
  onSearchWorker?: (query?: string) => void;
  onSelectCategory?: (categorySlug: string) => void;
  onViewAllCategories?: () => void;
}

export default function Hero({
  onSearchWorker,
  onSelectCategory,
}: HeroProps) {
  // Top-Right Slogan matching reference image
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

  return (
    <section className="relative bg-white pt-4 pb-6 sm:py-12 lg:py-16 xl:py-20 border-b border-slate-200 overflow-hidden min-h-[500px] lg:min-h-[580px] xl:min-h-[640px] flex items-center">
      {/* ================= DESKTOP & TABLET RIGHT-SIDE WORKFORCE IMAGE WITH SOFT GRADIENT FADE ================= */}
      <div className="hidden md:block absolute inset-y-0 right-0 w-[58%] lg:w-[65%] xl:w-[62%] h-full pointer-events-none select-none z-0 overflow-hidden">
        <div className="relative w-full h-full">
          <Image
            src="/images/home/hero-workers-group.jpg"
            alt="Verified Labour Skilled Professionals"
            fill
            priority
            className="object-cover object-[68%_18%] lg:object-[64%_18%] xl:object-[62%_18%] scale-105 transform-gpu"
            sizes="(max-width: 1024px) 60vw, 65vw"
          />
          {/* Soft White Left Fade Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-white via-white/85 via-35% to-transparent" />
          {/* Soft Top/Bottom Edge Blending */}
          <div className="absolute inset-x-0 top-0 h-10 bg-gradient-to-b from-white/90 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-white to-transparent" />
        </div>
      </div>

      {/* ================= DESKTOP CONTENT WRAPPER (md and above) ================= */}
      <div className="hidden md:block max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative w-full z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* LEFT COLUMN: Main Content & Booking Interface */}
          <div className="lg:col-span-7 xl:col-span-7 space-y-5 sm:space-y-6">
            {/* 1. HEADLINE (Hindi FIRST, English SECOND) */}
            <div className="space-y-1.5">
              <h1 className="text-3xl sm:text-4xl lg:text-5xl xl:text-[52px] font-black text-[#082B66] tracking-tight leading-[1.16] font-devanagari">
                आपके पास,<br />
                आपकी जरूरत के समय<br />
                <span className="text-[#1264D6]">भरोसेमंद लोग</span>
              </h1>

              <p className="text-base sm:text-xl lg:text-2xl font-bold text-[#1264D6] tracking-tight font-sans">
                Trusted People, When You Need Them
              </p>
            </div>

            {/* 2. SUBHEADLINE / SUPPORTING STATEMENT */}
            <div className="space-y-0.5 max-w-xl">
              <p className="text-base sm:text-lg font-bold text-slate-700 font-devanagari">
                भरोसेमंद, सत्यापित और आपके पास उपलब्ध कुशल लोग
              </p>
              <p className="text-xs sm:text-sm font-semibold text-slate-500 font-sans">
                Verified, reliable and nearby skilled professionals.
              </p>
            </div>

            {/* 3. TRUST HIGHLIGHTS */}
            <TrustIndicators />

            {/* 4. LOCATION + FIND WORKER CTA */}
            <LocationSearch onSearch={onSearchWorker} />

            {/* 5. POPULAR SERVICES */}
            <PopularSearches onSelectCategory={onSelectCategory} />
          </div>

          {/* RIGHT COLUMN: Top Right Slogan */}
          <div className="hidden lg:flex lg:col-span-5 xl:col-span-5 flex-col justify-between items-end min-h-[400px] pointer-events-none">
            {renderPromotionalTag()}
          </div>
        </div>
      </div>

      {/* ================= MOBILE HERO VIEW (< md) ================= */}
      <div className="block md:hidden w-full relative z-20 overflow-hidden bg-white pb-2 pt-1">
        <div className="max-w-md mx-auto px-4 relative z-20 space-y-4">
          
          {/* 1. HEADLINE (Hindi FIRST, English SECOND) */}
          <div className="space-y-1 text-left">
            <h1 className="text-2xl xs:text-3xl font-black text-[#082B66] leading-[1.2] font-devanagari tracking-tight">
              आपके पास,<br />
              आपकी जरूरत के समय<br />
              <span className="text-[#1264D6]">भरोसेमंद लोग</span>
            </h1>
            <p className="text-sm font-bold text-[#1264D6] tracking-tight font-sans">
              Trusted People, When You Need Them
            </p>
          </div>

          {/* 2. SUBHEADLINE (Hindi FIRST, English SECOND) */}
          <div className="space-y-0.5">
            <p className="text-xs font-bold text-slate-700 font-devanagari">
              भरोसेमंद, सत्यापित और आपके पास उपलब्ध कुशल लोग
            </p>
            <p className="text-[11px] font-semibold text-slate-500 font-sans">
              Verified, reliable and nearby skilled professionals.
            </p>
          </div>

          {/* 3. TRUST HIGHLIGHTS */}
          <TrustIndicators />

          {/* 4. WORKFORCE IMAGE */}
          <div className="relative w-full aspect-[16/9] rounded-2xl overflow-hidden border border-slate-200 shadow-xs">
            <Image
              src="/images/home/hero-workers-group.jpg"
              alt="Verified Labour Skilled Indian Workers"
              fill
              priority
              className="object-cover object-[55%_20%]"
              sizes="(max-width: 640px) 100vw, 50vw"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent pointer-events-none" />
          </div>

          {/* 5 & 6. LOCATION SELECTOR + FIND WORKER CTA */}
          <LocationSearch onSearch={onSearchWorker} />

          {/* 7. POPULAR SERVICES */}
          <PopularSearches onSelectCategory={onSelectCategory} />
        </div>
      </div>
    </section>
  );
}
