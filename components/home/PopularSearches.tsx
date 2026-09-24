'use client';

import React from 'react';

interface PopularSearchesProps {
  onSelectCategory?: (categorySlug: string) => void;
}

const POPULAR_ITEMS = [
  { name: 'Electrician', hindi: 'इलेक्ट्रीशियन', slug: 'electrical' },
  { name: 'Plumber', hindi: 'प्लंबर', slug: 'plumbing' },
  { name: 'Cook', hindi: 'रसोइया', slug: 'cook' },
  { name: 'House Caretaker', hindi: 'घर की देखभाल', slug: 'house-care-taker' },
  { name: 'Office Boy', hindi: 'ऑफिस बॉय', slug: 'office-boy' },
];

export default function PopularSearches({ onSelectCategory }: PopularSearchesProps) {
  return (
    <div className="flex flex-wrap items-center gap-2 sm:gap-2 text-xs text-slate-500 pt-0.5">
      <span className="font-bold text-slate-700 mr-0.5 flex items-center gap-1.5">
        <span>Popular:</span>
        <span className="text-xs text-slate-400 font-medium font-devanagari">लोकप्रिय खोजें</span>
      </span>
      {POPULAR_ITEMS.map((item) => (
        <button
          key={item.slug}
          type="button"
          onClick={() => onSelectCategory?.(item.slug)}
          className="min-h-[34px] px-3 py-1.5 sm:py-1 bg-white hover:bg-blue-50 hover:text-[#1264D6] hover:border-blue-200 rounded-xl sm:rounded-lg border border-slate-200 text-slate-700 font-semibold transition-all shadow-2xs text-xs sm:text-xs flex items-center gap-1.5 active:scale-95"
        >
          <span>{item.name}</span>
          <span className="text-[11px] sm:text-[10px] text-slate-400 font-normal font-devanagari">/ {item.hindi}</span>
        </button>
      ))}
    </div>
  );
}
