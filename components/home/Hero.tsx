'use client';

import React from 'react';
import Image from 'next/image';
import LocationSearch from './LocationSearch';
import PopularSearches from './PopularSearches';
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
    <section className="relative bg-white pt-6 sm:pt-10 pb-12 sm:pb-16 border-b border-slate-200 overflow-hidden">
      {/* Background Soft Subtle Blue Radial Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-gradient-to-b from-blue-50/70 via-blue-50/20 to-transparent pointer-events-none -z-10" />

      <div className="w-full max-w-[1440px] mx-auto px-3 sm:px-6 lg:px-8 relative z-10 flex flex-col items-center text-center">
        
        {/* 1. HERO HEADLINE (Top-Center) */}
        <div className="max-w-3xl mx-auto text-center space-y-2 mb-4 sm:mb-6">
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-[#082B66] tracking-tight leading-[1.16] font-devanagari">
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

          <p className="text-base sm:text-lg md:text-xl font-bold text-slate-700 font-devanagari mt-2">
            {isHindi ? 'भरोसेमंद और कुशल कामगार, आपके पास।' : 'Verified, nearby, and reliable skilled professionals.'}
          </p>
        </div>

        {/* 2. FULL-WIDTH DOMINANT WORKFORCE IMAGE (Large Hero Visual spanning ~95% width) */}
        <div className="relative w-full h-[320px] sm:h-[440px] md:h-[540px] lg:h-[620px] xl:h-[680px] my-2 sm:my-3 select-none pointer-events-none">
          <div className="relative w-full h-full overflow-hidden rounded-2xl sm:rounded-3xl shadow-xs border border-slate-100/60">
            <Image
              src="/images/home/hero-workers-group.jpg"
              alt="Verified Labour Skilled Professionals"
              fill
              priority
              className="object-cover object-[center_18%] sm:object-[center_15%] scale-100 transform-gpu"
              sizes="(max-width: 1440px) 100vw, 1440px"
            />
            {/* Subtle soft edge blending to integrate with white hero background without obscuring workers */}
            {/* Left Edge Subtle Fade */}
            <div className="absolute top-0 bottom-0 left-0 w-6 sm:w-16 bg-gradient-to-r from-white via-white/50 to-transparent pointer-events-none" />
            {/* Right Edge Subtle Fade */}
            <div className="absolute top-0 bottom-0 right-0 w-6 sm:w-16 bg-gradient-to-l from-white via-white/50 to-transparent pointer-events-none" />
            {/* Top Soft Fade */}
            <div className="absolute top-0 left-0 right-0 h-8 sm:h-12 bg-gradient-to-b from-white via-white/60 to-transparent pointer-events-none" />
            {/* Bottom Soft Fade for Search Bar Overlap */}
            <div className="absolute bottom-0 left-0 right-0 h-24 sm:h-36 bg-gradient-to-t from-white via-white/85 to-transparent pointer-events-none" />
          </div>
        </div>

        {/* 3. FLOATING LOCATION & FIND WORKER SEARCH CONTAINER */}
        <div className="w-full max-w-3xl mx-auto -mt-16 sm:-mt-24 md:-mt-28 relative z-20 px-2 sm:px-0">
          <LocationSearch onSearch={onSearchWorker} />
        </div>

        {/* 4. POPULAR SERVICES CARDS ROW */}
        <div className="w-full max-w-4xl mx-auto mt-6 sm:mt-8">
          <PopularSearches onSelectCategory={onSelectCategory} />
        </div>

      </div>
    </section>
  );
}
