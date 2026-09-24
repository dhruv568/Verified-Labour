'use client';

import React from 'react';
import Image from 'next/image';

export interface ServiceCardProps {
  title: string;
  hindiTitle: string;
  slug: string;
  image: string;
  pillColor: string;
  badge?: string;
  isSelected?: boolean;
  onClick?: () => void;
  priority?: boolean;
}

export default function ServiceCard({
  title,
  hindiTitle,
  slug,
  image,
  pillColor,
  badge,
  isSelected,
  onClick,
  priority = false,
}: ServiceCardProps) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick?.();
        }
      }}
      className={`group relative flex flex-col justify-between rounded-2xl overflow-hidden border transition-all duration-200 cursor-pointer bg-white text-center focus:outline-none shadow-xs hover:shadow-lg hover:-translate-y-1 active:scale-98 ${
        isSelected
          ? 'ring-2 ring-[#1264D6] shadow-md border-[#1264D6]'
          : 'border-slate-200/90 hover:border-slate-300'
      }`}
    >
      {/* Upper Area: Studio Portrait with High-Key Soft Background */}
      <div className="relative w-full aspect-[4/5] bg-gradient-to-b from-[#F8F9FA] via-[#F1F3F6] to-[#E9ECF0] overflow-hidden flex items-end justify-center">
        <Image
          src={image}
          alt={`${title} (${hindiTitle}) - Verified Labour Professional`}
          fill
          sizes="(max-width: 640px) 45vw, (max-width: 1024px) 25vw, 12vw"
          priority={priority}
          className="object-cover object-top transition-transform duration-300 group-hover:scale-105"
        />

        {badge && (
          <span className="absolute top-1.5 right-1.5 z-10 px-1.5 py-0.5 text-[9px] font-bold bg-white/90 backdrop-blur-xs text-[#082B66] rounded-md shadow-xs border border-white/80">
            {badge}
          </span>
        )}
      </div>

      {/* Bottom Colorful Category Name Strip matching Reference */}
      <div
        className={`py-2 px-1.5 sm:py-2 sm:px-1.5 text-center text-white transition-colors select-none flex flex-col justify-center min-h-[46px] sm:min-h-[44px] ${pillColor}`}
      >
        <span className="block font-bold text-xs sm:text-xs tracking-tight leading-snug line-clamp-1 drop-shadow-[0_1px_1px_rgba(0,0,0,0.15)]">
          {title}
        </span>
        <span className="block font-semibold text-[11px] sm:text-[10px] text-white/95 leading-tight mt-0.5 tracking-normal font-devanagari line-clamp-1 drop-shadow-[0_1px_1px_rgba(0,0,0,0.15)]">
          {hindiTitle}
        </span>
      </div>
    </div>
  );
}
