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
  return (
    <section className="relative bg-white pt-6 pb-12 sm:pt-8 sm:pb-16 border-b border-slate-200 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 xl:gap-10 items-center">
          {/* ================= LEFT CONTENT ================= */}
          <div className="lg:col-span-6 xl:col-span-6 space-y-5 sm:space-y-6 z-10">
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

          {/* ================= RIGHT SIDE: Human Worker Composition ================= */}
          <div className="lg:col-span-6 xl:col-span-6 relative mt-6 lg:mt-0">
            {/* Top Right Tag matching Reference */}
            <div className="flex justify-end mb-2 pr-2 sm:pr-4">
              <div className="text-right">
                <p className="text-xs sm:text-sm font-extrabold text-[#1264D6] tracking-tight leading-tight">
                  Different Jobs
                  <br />
                  Same Opportunities
                  <br />
                  <span className="text-[#082B66]">A Stronger India</span>
                </p>
                <div className="flex justify-end mt-0.5">
                  <span className="text-lg leading-none">😊</span>
                </div>
              </div>
            </div>

            {/* Main Visual Container */}
            <div className="relative rounded-3xl bg-slate-50 border border-slate-200/90 shadow-xl overflow-hidden group">
              {/* Actual AI-Generated Indian Worker Group Photography */}
              <div className="relative w-full h-[320px] sm:h-[400px] xl:h-[440px]">
                <Image
                  src="/images/home/hero-workers-group.jpg"
                  alt="Verified Labour - Professional Indian skilled workers group composition"
                  fill
                  priority
                  className="object-cover object-center"
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
              </div>

              {/* Angled Yellow Callout Sticker matching Reference */}
              <div className="absolute bottom-3 left-3 right-3 sm:bottom-4 sm:left-4 sm:right-4 z-20 bg-[#FFEB3B]/95 backdrop-blur-xs rounded-2xl p-3 sm:p-3.5 border-2 border-amber-400 shadow-xl flex items-center justify-between gap-3 transform -rotate-1 hover:rotate-0 transition-transform">
                <div className="flex items-center gap-2.5">
                  <span className="text-2xl sm:text-3xl leading-none">❓</span>
                  <div>
                    <p className="text-[10px] sm:text-xs font-black text-[#082B66] uppercase tracking-wider">
                      Let us Know...
                    </p>
                    <p className="text-xs sm:text-sm font-black text-[#082B66] leading-tight">
                      Who is <span className="underline decoration-red-600 decoration-2">NOT</span> on{' '}
                      <span className="text-[#082B66]">Verified Labour</span>?
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={onViewAllCategories}
                  className="px-3.5 py-1.5 sm:px-4 sm:py-2 bg-white hover:bg-slate-50 text-[#1264D6] font-black text-xs rounded-xl border border-slate-300 shadow-xs transition-colors shrink-0"
                >
                  View All
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
