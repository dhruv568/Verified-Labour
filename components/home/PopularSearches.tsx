'use client';

import React from 'react';

interface PopularSearchesProps {
  onSelectCategory?: (categorySlug: string) => void;
}

const POPULAR_ITEMS = [
  { name: 'Electrician', slug: 'electrical' },
  { name: 'Plumber', slug: 'plumbing' },
  { name: 'Cook', slug: 'cook' },
  { name: 'House Caretaker', slug: 'house-care-taker' },
  { name: 'Office Boy', slug: 'office-boy' },
];

export default function PopularSearches({ onSelectCategory }: PopularSearchesProps) {
  return (
    <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 text-xs text-slate-500 pt-0.5">
      <span className="font-semibold text-slate-600 mr-0.5">Popular searches:</span>
      {POPULAR_ITEMS.map((item) => (
        <button
          key={item.slug}
          type="button"
          onClick={() => onSelectCategory?.(item.slug)}
          className="px-2.5 py-0.5 sm:py-1 bg-white hover:bg-slate-100 rounded-md border border-slate-200 text-slate-700 font-medium transition-colors shadow-2xs text-[11px] sm:text-xs"
        >
          {item.name}
        </button>
      ))}
    </div>
  );
}
