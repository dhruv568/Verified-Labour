'use client';

import React from 'react';
import Image from 'next/image';
import LocationSearch from './LocationSearch';
import PopularSearches from './PopularSearches';
import MobileHero from './MobileHero';
import { useLanguage } from '@/context/LanguageContext';

interface HeroProps {
  onSearchWorker?: (query?: string) => void;
  onSelectCategory?: (categorySlug: string) => void;
  onViewAllCategories?: () => void;
}

export default function Hero({
  onSearchWorker,
  onSelectCategory,
}: HeroProps) {
  const { isHindi } = useLanguage();

  return (
    <>
      {/* ================= DESKTOP & TABLET HERO VIEW (>= 768px / md and above) ================= */}
      <section className="hidden md:block relative bg-white pt-0 pb-10 sm:pb-14 border-b border-slate-200 overflow-hidden">
        {/* Background Soft Subtle Blue Radial Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-gradient-to-b from-blue-50/70 via-blue-50/20 to-transparent pointer-events-none -z-10" />

        {/* HERO UNIFIED CANVAS CONTAINER */}
        <div className="w-full max-w-[1440px] mx-auto relative px-2 sm:px-4 lg:px-6">
          
          {/* 1. MAIN WORKFORCE IMAGE CANVAS (Starts immediately below navbar) */}
          <div className="relative w-full h-[400px] sm:h-[500px] md:h-[600px] lg:h-[680px] xl:h-[740px] rounded-b-2xl sm:rounded-b-3xl overflow-hidden select-none">
            
            {/* Workforce Image */}
            <Image
              src="/images/home/hero-workers-group.jpg"
              alt="Verified Labour Skilled Professionals"
              fill
              priority
              className="object-cover object-[center_22%] sm:object-[center_18%] scale-100 transform-gpu"
              sizes="(max-width: 1440px) 100vw, 1440px"
            />

            {/* Top Soft White Gradient - Ensures crisp headline contrast */}
            <div className="absolute top-0 inset-x-0 h-44 sm:h-60 md:h-72 bg-gradient-to-b from-white via-white/80 via-45% to-transparent pointer-events-none z-10" />

            {/* Outer Edges Subtle Blending */}
            <div className="absolute inset-y-0 left-0 w-4 sm:w-12 bg-gradient-to-r from-white via-white/40 to-transparent pointer-events-none z-10" />
            <div className="absolute inset-y-0 right-0 w-4 sm:w-12 bg-gradient-to-l from-white via-white/40 to-transparent pointer-events-none z-10" />

            {/* Bottom Soft White Gradient - Blends into floating search bar */}
            <div className="absolute bottom-0 inset-x-0 h-32 sm:h-44 md:h-52 bg-gradient-to-t from-white via-white/90 via-55% to-transparent pointer-events-none z-10" />

            {/* 2. HERO HEADLINE (Overlayed directly inside upper-center of hero image canvas) */}
            <div className="absolute top-3 sm:top-6 md:top-8 lg:top-10 inset-x-0 z-20 flex flex-col items-center text-center px-4 pointer-events-auto">
              <div className="max-w-3xl mx-auto space-y-1 sm:space-y-2">
                <h1 className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-[#082B66] tracking-tight leading-[1.16] font-devanagari drop-shadow-2xs">
                  {isHindi ? (
                    <>
                      आपके पास,<br />
                      <span className="text-[#1264D6]">आपकी जरूरत के समय</span>
                    </>
                  ) : (
                    <>
                      Trusted Professionals,<br />
                      <span className="text-[#1264D6]">Right When You Need Them</span>
                    </>
                  )}
                </h1>

                <p className="text-xs sm:text-base md:text-lg lg:text-xl font-extrabold text-slate-800 font-devanagari mt-1 drop-shadow-2xs">
                  {isHindi ? 'भरोसेमंद और कुशल कामगार, आपके पास।' : 'Verified, nearby, and reliable skilled professionals.'}
                </p>
              </div>
            </div>
          </div>

          {/* 3. FLOATING LOCATION & FIND WORKER SEARCH CONTAINER (Overlapping lower workforce image) */}
          <div className="w-full max-w-3xl mx-auto -mt-16 sm:-mt-24 md:-mt-28 relative z-30 px-2 sm:px-0">
            <LocationSearch onSearch={onSearchWorker} />
          </div>

          {/* 4. POPULAR SERVICES CARDS ROW (Directly below search container) */}
          <div className="w-full max-w-4xl mx-auto mt-6 sm:mt-8 relative z-30">
            <PopularSearches onSelectCategory={onSelectCategory} />
          </div>

        </div>
      </section>

      {/* ================= DEDICATED PURPOSE-BUILT MOBILE HERO VIEW (<= 767px / < md) ================= */}
      <section className="block md:hidden w-full">
        <MobileHero onSearchWorker={onSearchWorker} onSelectCategory={onSelectCategory} />
      </section>
    </>
  );
}
