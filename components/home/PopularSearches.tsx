'use client';

import React from 'react';
import { Zap, Droplets, Utensils, Hammer, Sparkles } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

interface PopularSearchesProps {
  onSelectCategory?: (categorySlug: string) => void;
}

const POPULAR_SERVICES = [
  {
    name: 'Electrician',
    hindi: 'इलेक्ट्रीशियन',
    slug: 'electrical',
    icon: Zap,
    color: 'text-amber-600 bg-amber-50 border-amber-200',
  },
  {
    name: 'Plumber',
    hindi: 'प्लंबर',
    slug: 'plumbing',
    icon: Droplets,
    color: 'text-blue-600 bg-blue-50 border-blue-200',
  },
  {
    name: 'Cook',
    hindi: 'रसोइया',
    slug: 'cook',
    icon: Utensils,
    color: 'text-orange-600 bg-orange-50 border-orange-200',
  },
  {
    name: 'Carpenter',
    hindi: 'बढ़ई',
    slug: 'carpenter',
    icon: Hammer,
    color: 'text-emerald-600 bg-emerald-50 border-emerald-200',
  },
  {
    name: 'Cleaner',
    hindi: 'सफाई कर्मचारी',
    slug: 'cleaning',
    icon: Sparkles,
    color: 'text-purple-600 bg-purple-50 border-purple-200',
  },
];

export default function PopularSearches({ onSelectCategory }: PopularSearchesProps) {
  const { isHindi } = useLanguage();

  return (
    <div className="w-full">
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 sm:gap-4">
        {POPULAR_SERVICES.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.slug}
              type="button"
              onClick={() => onSelectCategory?.(item.slug)}
              className="bg-white hover:bg-slate-50 border border-slate-200 hover:border-[#1264D6]/50 p-3 sm:p-3.5 rounded-2xl shadow-2xs hover:shadow-md transition-all duration-200 flex items-center gap-2.5 sm:gap-3 text-left group cursor-pointer active:scale-98"
            >
              <div
                className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center border shrink-0 ${item.color} group-hover:scale-105 transition-transform`}
              >
                <Icon className="w-4.5 h-4.5 sm:w-5 sm:h-5 stroke-[2.2]" />
              </div>
              <div className="min-w-0 flex-1">
                <span className="block font-black text-slate-900 text-xs sm:text-sm font-devanagari truncate group-hover:text-[#1264D6] transition-colors">
                  {isHindi ? item.hindi : item.name}
                </span>
                <span className="block text-[10px] sm:text-[11px] font-medium text-slate-500 font-sans truncate">
                  {isHindi ? item.name : item.hindi}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
