'use client';

import React from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { Sparkles, Layers } from 'lucide-react';

export interface ServiceFilterOption {
  id: string;
  name: string;
  nameHi: string;
  slug: string;
  isOther?: boolean;
}

// 6-7 most popular/relevant services from database & codebase
export const POPULAR_SERVICE_FILTERS: ServiceFilterOption[] = [
  { id: 'electrical', name: 'Electrician', nameHi: 'इलेक्ट्रीशियन', slug: 'electrical' },
  { id: 'plumbing', name: 'Plumber', nameHi: 'प्लंबर', slug: 'plumbing' },
  { id: 'ac-technician', name: 'AC Technician', nameHi: 'एसी तकनीशियन', slug: 'ac-technician' },
  { id: 'carpenter', name: 'Carpenter', nameHi: 'कारपेंटर / बढ़ई', slug: 'carpenter' },
  { id: 'painting', name: 'Painter', nameHi: 'पेंटर', slug: 'painting' },
  { id: 'cleaning', name: 'Cleaning', nameHi: 'सफाई', slug: 'cleaning' },
];

export interface ServiceFilterBarProps {
  selectedCategory: string; // slug
  onSelectCategory: (slug: string) => void;
  className?: string;
  showTitle?: boolean;
}

export default function ServiceFilterBar({
  selectedCategory,
  onSelectCategory,
  className = '',
  showTitle = true,
}: ServiceFilterBarProps) {
  const { isHindi } = useLanguage();

  const isAllSelected = !selectedCategory;
  const isOtherSelected = selectedCategory === 'OTHER' || selectedCategory === 'other' || selectedCategory === 'other-service';

  return (
    <div className={`w-full ${className}`}>
      {showTitle && (
        <div className="flex items-center justify-between mb-2.5 font-devanagari">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-[#1264D6]" />
            <span>{isHindi ? 'श्रेणी अनुसार खोजें / Filter Services' : 'Filter by Service / Category'}</span>
          </span>

          {selectedCategory && (
            <button
              type="button"
              onClick={() => onSelectCategory('')}
              className="text-xs font-bold text-red-600 hover:underline cursor-pointer"
            >
              {isHindi ? 'फ़िल्टर हटाएं / Clear' : 'Clear Filter'}
            </button>
          )}
        </div>
      )}

      {/* Buttons Container with horizontal scroll/wrap for responsive mobile layout */}
      <div className="flex flex-wrap items-center gap-2 overflow-x-auto pb-1.5 sm:pb-0 scrollbar-none touch-pan-x">
        {/* 1. ALL SERVICES BUTTON */}
        <button
          type="button"
          onClick={() => onSelectCategory('')}
          className={`px-3.5 py-2 sm:py-1.5 rounded-xl text-xs font-bold transition-all border whitespace-nowrap cursor-pointer flex items-center gap-1.5 min-h-[40px] sm:min-h-[36px] ${
            isAllSelected
              ? 'bg-[#082B66] text-white border-[#082B66] shadow-xs ring-1 ring-[#082B66]'
              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50 hover:border-slate-300'
          }`}
        >
          <span className="font-devanagari">{isHindi ? 'सभी सेवाएं' : 'All Services'}</span>
          <span className="text-[10px] opacity-75 font-normal">({isHindi ? 'All' : 'सभी'})</span>
        </button>

        {/* 2-7. POPULAR SERVICE BUTTONS */}
        {POPULAR_SERVICE_FILTERS.map((item) => {
          const isSelected = selectedCategory === item.slug;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectCategory(isSelected ? '' : item.slug)}
              className={`px-3.5 py-2 sm:py-1.5 rounded-xl text-xs font-bold transition-all border whitespace-nowrap cursor-pointer flex items-center gap-1.5 min-h-[40px] sm:min-h-[36px] ${
                isSelected
                  ? 'bg-[#1264D6] text-white border-[#1264D6] shadow-xs ring-1 ring-[#1264D6]'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50 hover:border-slate-300'
              }`}
            >
              <span className="font-devanagari">{isHindi ? item.nameHi : item.name}</span>
              <span className="text-[10px] opacity-75 font-normal">
                ({isHindi ? item.name : item.nameHi})
              </span>
            </button>
          );
        })}

        {/* 8. SEPARATE "OTHER" BUTTON (VISUALLY DISTINCT STYLE) */}
        <button
          type="button"
          onClick={() => onSelectCategory(isOtherSelected ? '' : 'OTHER')}
          className={`px-4 py-2 sm:py-1.5 rounded-xl text-xs font-black transition-all border whitespace-nowrap cursor-pointer flex items-center gap-1.5 min-h-[40px] sm:min-h-[36px] ${
            isOtherSelected
              ? 'bg-[#082B66] text-amber-300 border-2 border-amber-400 ring-2 ring-amber-400/40 shadow-md scale-[1.02]'
              : 'bg-[#041A40] text-amber-400 border border-blue-900/80 hover:bg-[#082B66] hover:text-amber-300 shadow-2xs hover:border-amber-400/50'
          }`}
          title="Custom or unlisted services / अन्य कार्य"
        >
          <Sparkles className={`w-3.5 h-3.5 shrink-0 ${isOtherSelected ? 'text-amber-300 animate-pulse' : 'text-amber-400'}`} />
          <span className="tracking-wide uppercase font-devanagari">
            {isHindi ? 'OTHER / अन्य कार्य' : 'OTHER'}
          </span>
        </button>
      </div>

      {/* Dynamic helper badge when "OTHER" is selected */}
      {isOtherSelected && (
        <div className="mt-2.5 p-2.5 bg-amber-50/90 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-center justify-between gap-2 animate-in fade-in slide-in-from-top-1 duration-150 font-devanagari">
          <div className="flex items-center gap-2 min-w-0">
            <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0 animate-ping" />
            <span className="truncate">
              <strong>अन्य सेवा चुनी गई:</strong> आप किसी भी कामगार से अपनी इच्छानुसार काम करा सकते हैं (Custom Work Booking)।
            </span>
          </div>
          <button
            type="button"
            onClick={() => onSelectCategory('')}
            className="text-[11px] font-bold text-amber-800 hover:underline shrink-0"
          >
            सभी सेवाएं देखें →
          </button>
        </div>
      )}
    </div>
  );
}
