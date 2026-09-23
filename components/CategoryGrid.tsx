'use client';

import React from 'react';
import {
  Zap,
  Wrench,
  Hammer,
  Paintbrush,
  Sparkles,
  Utensils,
  Car,
  Truck,
  Cpu,
  Monitor,
  Shield,
  Home,
  Briefcase,
  Flame,
  Cookie,
  Scissors,
  Shirt,
  HelpCircle,
  Package,
  Layers,
} from 'lucide-react';

export interface Category {
  id: string;
  name: string;
  nameHi?: string;
  slug: string;
  description?: string;
  iconUrl?: string;
  services?: any[];
}

interface CategoryGridProps {
  categories: Category[];
  selectedCategorySlug?: string;
  onSelectCategory: (cat: Category) => void;
  onRequestWorker?: (cat: Category) => void;
}

// Visual style definitions matching the Indian marketplace reference cards
interface CategoryVisual {
  pillColor: string;
  bgColor: string;
  iconColor: string;
  accentBadge: string;
  label: string;
  IconComponent: React.ComponentType<{ className?: string }>;
}

const CATEGORY_STYLE_MAP: Record<string, CategoryVisual> = {
  electrical: {
    pillColor: 'bg-[#1464D2]', // Electrician Blue
    bgColor: 'bg-blue-50/70',
    iconColor: 'text-[#1464D2]',
    accentBadge: 'bg-blue-100 text-blue-800',
    label: 'Electrician',
    IconComponent: Zap,
  },
  'computer-hardware': {
    pillColor: 'bg-[#0B9B5A]', // Teal / Green
    bgColor: 'bg-emerald-50/70',
    iconColor: 'text-[#0B9B5A]',
    accentBadge: 'bg-emerald-100 text-emerald-800',
    label: 'Computer Hardware',
    IconComponent: Cpu,
  },
  'computer-software': {
    pillColor: 'bg-[#EA580C]', // Orange
    bgColor: 'bg-orange-50/70',
    iconColor: 'text-[#EA580C]',
    accentBadge: 'bg-orange-100 text-orange-800',
    label: 'Computer Software',
    IconComponent: Monitor,
  },
  confectioner: {
    pillColor: 'bg-[#C026D3]', // Magenta / Halwai
    bgColor: 'bg-fuchsia-50/70',
    iconColor: 'text-[#C026D3]',
    accentBadge: 'bg-fuchsia-100 text-fuchsia-800',
    label: 'Confectioner',
    IconComponent: Cookie,
  },
  mechanic: {
    pillColor: 'bg-[#4338CA]', // Indigo Mechanic
    bgColor: 'bg-indigo-50/70',
    iconColor: 'text-[#4338CA]',
    accentBadge: 'bg-indigo-100 text-indigo-800',
    label: 'Car / 2 Wheeler Mechanic',
    IconComponent: Wrench,
  },
  'gas-cylinder': {
    pillColor: 'bg-[#7C3AED]', // Purple Gas Cylinder
    bgColor: 'bg-purple-50/70',
    iconColor: 'text-[#7C3AED]',
    accentBadge: 'bg-purple-100 text-purple-800',
    label: 'Gas Cylinder Wala',
    IconComponent: Flame,
  },
  watchman: {
    pillColor: 'bg-[#2563EB]', // Blue Watchman
    bgColor: 'bg-sky-50/70',
    iconColor: 'text-[#2563EB]',
    accentBadge: 'bg-sky-100 text-sky-800',
    label: 'Watchman',
    IconComponent: Shield,
  },
  'house-care-taker': {
    pillColor: 'bg-[#0D9488]', // Teal Caretaker
    bgColor: 'bg-teal-50/70',
    iconColor: 'text-[#0D9488]',
    accentBadge: 'bg-teal-100 text-teal-800',
    label: 'House Care Taker',
    IconComponent: Home,
  },
  'office-boy': {
    pillColor: 'bg-[#A16207]', // Mustard Office Boy
    bgColor: 'bg-amber-50/70',
    iconColor: 'text-[#A16207]',
    accentBadge: 'bg-amber-100 text-amber-800',
    label: 'Office Boy',
    IconComponent: Briefcase,
  },
  cook: {
    pillColor: 'bg-[#059669]', // Emerald Cook
    bgColor: 'bg-emerald-50/70',
    iconColor: 'text-[#059669]',
    accentBadge: 'bg-emerald-100 text-emerald-800',
    label: 'Cook',
    IconComponent: Utensils,
  },
  plumbing: {
    pillColor: 'bg-[#D97706]', // Amber Plumber
    bgColor: 'bg-amber-50/70',
    iconColor: 'text-[#D97706]',
    accentBadge: 'bg-amber-100 text-amber-800',
    label: 'Plumber',
    IconComponent: Wrench,
  },
  painting: {
    pillColor: 'bg-[#6D28D9]', // Violet Painter
    bgColor: 'bg-purple-50/70',
    iconColor: 'text-[#6D28D9]',
    accentBadge: 'bg-purple-100 text-purple-800',
    label: 'Painter',
    IconComponent: Paintbrush,
  },
  carpenter: {
    pillColor: 'bg-[#DC2626]', // Red Carpenter
    bgColor: 'bg-rose-50/70',
    iconColor: 'text-[#DC2626]',
    accentBadge: 'bg-rose-100 text-rose-800',
    label: 'Carpenter',
    IconComponent: Scissors,
  },
  cleaning: {
    pillColor: 'bg-[#0891B2]', // Teal Maid
    bgColor: 'bg-cyan-50/70',
    iconColor: 'text-[#0891B2]',
    accentBadge: 'bg-cyan-100 text-cyan-800',
    label: 'Maid / House Cleaning',
    IconComponent: Sparkles,
  },
  driver: {
    pillColor: 'bg-[#F97316]', // Orange Driver
    bgColor: 'bg-orange-50/70',
    iconColor: 'text-[#F97316]',
    accentBadge: 'bg-orange-100 text-orange-800',
    label: 'Driver',
    IconComponent: Car,
  },
  'loading-moving': {
    pillColor: 'bg-[#E11D48]', // Rose Delivery Helper
    bgColor: 'bg-rose-50/70',
    iconColor: 'text-[#E11D48]',
    accentBadge: 'bg-rose-100 text-rose-800',
    label: 'Delivery Helper',
    IconComponent: Package,
  },
  construction: {
    pillColor: 'bg-[#0F766E]', // Dark Teal Construction
    bgColor: 'bg-emerald-50/70',
    iconColor: 'text-[#0F766E]',
    accentBadge: 'bg-emerald-100 text-emerald-800',
    label: 'Construction Labour',
    IconComponent: Hammer,
  },
  washerman: {
    pillColor: 'bg-[#0284C7]', // Sky Blue Washerman
    bgColor: 'bg-sky-50/70',
    iconColor: 'text-[#0284C7]',
    accentBadge: 'bg-sky-100 text-sky-800',
    label: 'Washerman / Laundry',
    IconComponent: Shirt,
  },
};

const DEFAULT_STYLE: CategoryVisual = {
  pillColor: 'bg-[#0F2A5F]',
  bgColor: 'bg-slate-50',
  iconColor: 'text-[#0F2A5F]',
  accentBadge: 'bg-slate-100 text-slate-800',
  label: 'Service',
  IconComponent: Layers,
};

export default function CategoryGrid({
  categories,
  selectedCategorySlug,
  onSelectCategory,
  onRequestWorker,
}: CategoryGridProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3.5 sm:gap-4">
      {categories.map((cat) => {
        const visual = CATEGORY_STYLE_MAP[cat.slug] || DEFAULT_STYLE;
        const Icon = visual.IconComponent;
        const isSelected = selectedCategorySlug === cat.slug;

        return (
          <div
            key={cat.id}
            role="button"
            tabIndex={0}
            onClick={() => onSelectCategory(cat)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onSelectCategory(cat);
              }
            }}
            className={`group relative flex flex-col justify-between rounded-2xl overflow-hidden border transition-all duration-200 cursor-pointer bg-white text-center focus:outline-none ${
              isSelected
                ? 'ring-2 ring-[#1464D2] shadow-md border-[#1464D2]'
                : 'border-slate-200 hover:border-slate-300 hover:shadow-lg hover:-translate-y-1'
            }`}
          >
            {/* Visual Icon Presentation Area */}
            <div className={`pt-6 pb-4 px-3 flex flex-col items-center justify-center ${visual.bgColor} transition-colors group-hover:brightness-95`}>
              <div className="relative w-16 h-16 rounded-2xl bg-white shadow-xs border border-white/60 flex items-center justify-center transition-transform group-hover:scale-110">
                <Icon className={`w-8 h-8 ${visual.iconColor} stroke-[2.2]`} />
              </div>

              {cat.nameHi && (
                <span className="text-[10px] font-medium text-slate-500 mt-2 truncate max-w-full">
                  {cat.nameHi}
                </span>
              )}
            </div>

            {/* Bottom Rounded Pill with Category Label matching Reference Design */}
            <div
              className={`py-2 px-2 text-center text-white font-bold text-xs tracking-tight select-none transition-colors ${visual.pillColor}`}
            >
              <span className="truncate block font-semibold">{cat.name}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
