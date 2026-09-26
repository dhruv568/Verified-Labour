'use client';

import React from 'react';
import Image from 'next/image';
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
  return (
    <section className="relative bg-white pt-6 sm:pt-10 pb-10 sm:pb-16 border-b border-slate-200 overflow-hidden">
      {/* Background Soft Subtle Blue Radial Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-gradient-to-b from-blue-50/70 via-blue-50/20 to-transparent pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 flex flex-col items-center text-center">
        
        {/* 1. HERO HEADLINE (Top-Center) */}
        <div className="max-w-3xl mx-auto text-center space-y-2 mb-4 sm:mb-6">
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-[#082B66] tracking-tight leading-[1.16] font-devanagari">
            आपके पास,<br />
            <span className="text-[#1264D6]">आपकी जरूरत के समय</span>
          </h1>

          <p className="text-base sm:text-lg md:text-xl font-bold text-slate-700 font-devanagari mt-2">
            भरोसेमंद और कुशल कामगार, आपके पास।
          </p>
          <p className="text-xs sm:text-sm font-semibold text-slate-500 font-sans">
            Trusted and skilled professionals, right when you need them.
          </p>
        </div>

        {/* 2. MAIN WORKFORCE IMAGE (Centered Visual with Soft Edge Gradient Fades) */}
        <div className="relative w-full max-w-5xl mx-auto h-[240px] sm:h-[340px] md:h-[400px] lg:h-[440px] my-1 sm:my-2 select-none pointer-events-none">
          <div className="relative w-full h-full overflow-hidden">
            <Image
              src="/images/home/hero-workers-group.jpg"
              alt="Verified Labour Skilled Professionals"
              fill
              priority
              className="object-cover object-center scale-102 transform-gpu"
              sizes="(max-width: 1280px) 100vw, 1200px"
            />
            {/* Soft edge white gradient overlays to integrate naturally into page background */}
            {/* Left Fade */}
            <div className="absolute top-0 bottom-0 left-0 w-12 sm:w-28 bg-gradient-to-r from-white via-white/80 to-transparent pointer-events-none" />
            {/* Right Fade */}
            <div className="absolute top-0 bottom-0 right-0 w-12 sm:w-28 bg-gradient-to-l from-white via-white/80 to-transparent pointer-events-none" />
            {/* Top Fade */}
            <div className="absolute top-0 left-0 right-0 h-10 sm:h-14 bg-gradient-to-b from-white via-white/70 to-transparent pointer-events-none" />
            {/* Bottom Fade */}
            <div className="absolute bottom-0 left-0 right-0 h-20 sm:h-28 bg-gradient-to-t from-white via-white/90 to-transparent pointer-events-none" />
          </div>
        </div>

        {/* 3. FLOATING LOCATION & FIND WORKER SEARCH CONTAINER */}
        <div className="w-full max-w-3xl mx-auto -mt-10 sm:-mt-14 md:-mt-16 relative z-20 px-2 sm:px-0">
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
