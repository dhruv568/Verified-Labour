'use client';

import React from 'react';

interface PopularSearchesProps {
  onSelectCategory?: (categorySlug: string) => void;
}

const POPULAR_ITEMS = [
  { name: 'Electrician', hindi: 'इलेक्ट्रीशियन', slug: 'electrical' },
  { name: 'Plumber', hindi: 'प्लंबर', slug: 'plumbing' },
  { name: 'Cook', hindi: 'रसोइया', slug: 'cook' },
  { name: 'Carpenter', hindi: 'बढ़ई', slug: 'carpenter' },
  { name: 'Cleaner', hindi: 'सफाई कर्मचारी', slug: 'cleaning' },
];

export default function PopularSearches({ onSelectCategory }: PopularSearchesProps) {
  return (
    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 pt-1">
      <span className="font-bold text-slate-700 mr-0.5 flex items-center gap-1.5 shrink-0 font-devanagari">
        <span className="text-xs text-[#082B66] font-extrabold">लोकप्रिय सेवाएं:</span>
        <span className="text-[11px] text-slate-400 font-medium font-sans">Popular Services</span>
      </span>
      {POPULAR_ITEMS.map((item) => (
        <button
          key={item.slug}
          type="button"
          onClick={() => onSelectCategory?.(item.slug)}
          className="min-h-[34px] px-3 py-1.5 sm:py-1 bg-white hover:bg-blue-50 hover:text-[#1264D6] hover:border-blue-200 rounded-xl border border-slate-200 text-slate-700 font-semibold transition-all shadow-2xs text-xs flex items-center gap-1.5 active:scale-95 cursor-pointer"
        >
          <span className="font-devanagari font-bold text-[#082B66]">{item.hindi}</span>
          <span className="text-[11px] text-slate-400 font-normal font-sans">/ {item.name}</span>
        </button>
      ))}
    </div>
  );
}
