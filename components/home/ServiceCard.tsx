'use client';

import React from 'react';
import { LucideIcon } from 'lucide-react';

export interface ServiceCardProps {
  title: string;
  slug: string;
  pillColor: string;
  bgTint: string;
  iconColor: string;
  IconComponent: LucideIcon;
  badge?: string;
  isSelected?: boolean;
  onClick?: () => void;
}

export default function ServiceCard({
  title,
  slug,
  pillColor,
  bgTint,
  iconColor,
  IconComponent,
  badge,
  isSelected,
  onClick,
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
      className={`group relative flex flex-col justify-between rounded-xl sm:rounded-2xl overflow-hidden border transition-all duration-200 cursor-pointer bg-white text-center focus:outline-none shadow-xs ${
        isSelected
          ? 'ring-2 ring-[#1264D6] shadow-md border-[#1264D6]'
          : 'border-slate-200/90 hover:border-slate-300 hover:shadow-md hover:-translate-y-1'
      }`}
    >
      {/* Upper Area: Visual Illustration with soft tinted background */}
      <div
        className={`pt-4 pb-3 px-2 flex flex-col items-center justify-center ${bgTint} transition-colors group-hover:brightness-95 h-24 sm:h-28`}
      >
        <div className="relative w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-white shadow-xs border border-white/70 flex items-center justify-center transition-transform group-hover:scale-105">
          <IconComponent className={`w-7 h-7 sm:w-8 sm:h-8 ${iconColor} stroke-[2.2]`} />
        </div>

        {badge && (
          <span className="text-[9px] font-medium text-slate-500 mt-1 truncate max-w-full">
            {badge}
          </span>
        )}
      </div>

      {/* Bottom Colored Title Bar matching Reference */}
      <div
        className={`py-1.5 px-1.5 text-center text-white font-bold text-[11px] sm:text-xs tracking-tight select-none truncate transition-colors ${pillColor}`}
      >
        <span className="truncate block">{title}</span>
      </div>
    </div>
  );
}
