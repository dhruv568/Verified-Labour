'use client';

import React from 'react';
import { Zap, Droplets, Hammer, Sparkles, Paintbrush, Wrench } from 'lucide-react';
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
    name: 'AC Technician',
    hindi: 'एसी तकनीशियन',
    slug: 'ac-technician',
    icon: Wrench,
    color: 'text-sky-600 bg-sky-50 border-sky-200',
  },
  {
    name: 'Carpenter',
    hindi: 'बढ़ई',
    slug: 'carpenter',
    icon: Hammer,
    color: 'text-emerald-600 bg-emerald-50 border-emerald-200',
  },
  {
    name: 'Painter',
    hindi: 'पेंटर',
    slug: 'painting',
    icon: Paintbrush,
    color: 'text-rose-600 bg-rose-50 border-rose-200',
  },
  {
    name: 'Cleaning',
    hindi: 'सफाई कर्मचारी',
    slug: 'cleaning',
    icon: Sparkles,
    color: 'text-purple-600 bg-purple-50 border-purple-200',
  },
  {
    name: 'OTHER',
    hindi: 'अन्य सेवा',
    slug: 'OTHER',
    icon: Sparkles,
    color: 'text-amber-300 bg-[#041A40] border-amber-400',
    isOther: true,
  },
];

export default function PopularSearches({ onSelectCategory }: PopularSearchesProps) {
  const { isHindi } = useLanguage();

  return (
    <div className="w-full">
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-2.5 sm:gap-3">
        {POPULAR_SERVICES.map((item) => {
          const Icon = item.icon;
          const isOther = item.isOther;

          return (
            <button
              key={item.slug}
              type="button"
              onClick={() => onSelectCategory?.(item.slug)}
              className={`p-2.5 sm:p-3 rounded-2xl border transition-all duration-200 flex items-center gap-2 text-left group cursor-pointer active:scale-98 min-h-[52px] ${
                isOther
                  ? 'bg-[#041A40] border-amber-400 hover:bg-[#082B66] hover:border-amber-300 shadow-md'
                  : 'bg-white hover:bg-slate-50 border-slate-200 hover:border-[#1264D6]/50 shadow-2xs hover:shadow-md'
              }`}
            >
              <div
                className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center border shrink-0 ${item.color} group-hover:scale-105 transition-transform`}
              >
                <Icon className={`w-4 h-4 stroke-[2.2] ${isOther ? 'text-amber-300 animate-pulse' : ''}`} />
              </div>
              <div className="min-w-0 flex-1">
                <span
                  className={`block font-black text-xs sm:text-xs font-devanagari truncate ${
                    isOther ? 'text-amber-300 uppercase tracking-wider' : 'text-slate-900 group-hover:text-[#1264D6]'
                  } transition-colors`}
                >
                  {isHindi ? item.hindi : item.name}
                </span>
                <span
                  className={`block text-[10px] font-medium font-sans truncate ${
                    isOther ? 'text-blue-200' : 'text-slate-500'
                  }`}
                >
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
