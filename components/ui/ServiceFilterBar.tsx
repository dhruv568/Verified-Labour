'use client';

import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { Sparkles, Layers, ChevronUp } from 'lucide-react';
import { fetchWithTimeout } from '@/lib/fetch-utils';

export interface ServiceFilterOption {
  id: string;
  name: string;
  nameHi: string;
  slug: string;
}

// Initial 9 popular services (approx. 8-10 as requested)
export const INITIAL_POPULAR_SERVICES: ServiceFilterOption[] = [
  { id: 'electrical', name: 'Electrician', nameHi: 'इलेक्ट्रीशियन', slug: 'electrical' },
  { id: 'plumbing', name: 'Plumber', nameHi: 'प्लंबर', slug: 'plumbing' },
  { id: 'ac-technician', name: 'AC Technician', nameHi: 'एसी तकनीशियन', slug: 'ac-technician' },
  { id: 'carpenter', name: 'Carpenter', nameHi: 'कारपेंटर / बढ़ई', slug: 'carpenter' },
  { id: 'painting', name: 'Painter', nameHi: 'पेंटर', slug: 'painting' },
  { id: 'cleaning', name: 'Cleaning', nameHi: 'सफाई कर्मचारी', slug: 'cleaning' },
  { id: 'cook', name: 'Cook', nameHi: 'रसोइया (कुक)', slug: 'cook' },
  { id: 'construction', name: 'Construction', nameHi: 'निर्माण एवं मजदूरी', slug: 'construction' },
  { id: 'driver', name: 'Driver', nameHi: 'चालक (ड्राइवर)', slug: 'driver' },
];

export interface ServiceFilterBarProps {
  selectedCategory: string; // slug
  onSelectCategory: (slug: string) => void;
  categories?: any[];
  className?: string;
  showTitle?: boolean;
}

export default function ServiceFilterBar({
  selectedCategory,
  onSelectCategory,
  categories: initialCategories,
  className = '',
  showTitle = true,
}: ServiceFilterBarProps) {
  const { isHindi } = useLanguage();
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [allCategories, setAllCategories] = useState<any[]>(initialCategories || []);

  useEffect(() => {
    if (initialCategories && initialCategories.length > 0) {
      setAllCategories(initialCategories);
    } else {
      fetchWithTimeout('/api/categories', { timeoutMs: 4000 })
        .then((res) => res.json())
        .then((data) => {
          if (data.success && Array.isArray(data.categories)) {
            setAllCategories(data.categories);
          }
        })
        .catch(console.error);
    }
  }, [initialCategories]);

  // Merge initial popular services with all remaining active categories from database
  const popularSlugs = new Set(INITIAL_POPULAR_SERVICES.map((s) => s.slug));

  const extraCategoriesFromDb: ServiceFilterOption[] = allCategories
    .filter((cat) => cat.slug && !popularSlugs.has(cat.slug) && cat.slug !== 'ac-technician')
    .map((cat) => ({
      id: cat.id || cat.slug,
      name: cat.name || cat.slug,
      nameHi: cat.nameHi || cat.name || cat.slug,
      slug: cat.slug,
    }));

  const visibleServices = isExpanded
    ? [...INITIAL_POPULAR_SERVICES, ...extraCategoriesFromDb]
    : INITIAL_POPULAR_SERVICES;

  const isAllSelected = !selectedCategory;

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

      {/* Buttons Container with responsive wrap for mobile & desktop layout */}
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

        {/* 2. DYNAMIC VISIBLE SERVICE BUTTONS */}
        {visibleServices.map((item) => {
          const isSelected = selectedCategory === item.slug;
          return (
            <button
              key={item.slug}
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

        {/* 3. SHOW MORE / SHOW LESS ("OTHER" / "LESS") CONTROL BUTTON */}
        <button
          type="button"
          onClick={() => setIsExpanded((prev) => !prev)}
          className={`px-4 py-2 sm:py-1.5 rounded-xl text-xs font-black transition-all border whitespace-nowrap cursor-pointer flex items-center gap-1.5 min-h-[40px] sm:min-h-[36px] ${
            isExpanded
              ? 'bg-[#082B66] text-amber-300 border-2 border-amber-400 ring-2 ring-amber-400/40 shadow-md scale-[1.02]'
              : 'bg-[#041A40] text-amber-400 border border-blue-900/80 hover:bg-[#082B66] hover:text-amber-300 shadow-2xs hover:border-amber-400/50'
          }`}
          title={isExpanded ? 'Collapse service list / कम दिखाएं' : 'Expand all services / अन्य कार्य'}
        >
          {isExpanded ? (
            <>
              <ChevronUp className="w-3.5 h-3.5 shrink-0 text-amber-300" />
              <span className="tracking-wide uppercase font-devanagari">
                {isHindi ? '− LESS / कम दिखाएं' : '− LESS'}
              </span>
            </>
          ) : (
            <>
              <Sparkles className="w-3.5 h-3.5 shrink-0 text-amber-400 animate-pulse" />
              <span className="tracking-wide uppercase font-devanagari">
                {isHindi ? '✨ OTHER / अन्य कार्य' : '✨ OTHER'}
              </span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
