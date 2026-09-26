'use client';

import React from 'react';
import Image from 'next/image';
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

const CATEGORY_IMAGE_MAP: Record<string, string> = {
  electrical: '/images/services/electrician.jpg',
  'computer-hardware': '/images/services/computer-hardware.jpg',
  'computer-software': '/images/services/computer-software.jpg',
  confectioner: '/images/services/confectioner.jpg',
  mechanic: '/images/services/mechanic.jpg',
  'gas-cylinder': '/images/services/gas-cylinder.jpg',
  watchman: '/images/services/watchman.jpg',
  'house-care-taker': '/images/services/house-care-taker.jpg',
  'office-boy': '/images/services/office-boy.jpg',
  cook: '/images/services/cook.jpg',
  plumbing: '/images/services/plumber.jpg',
  painting: '/images/services/painter.jpg',
  carpenter: '/images/services/carpenter.jpg',
  cleaning: '/images/services/cleaning.jpg',
  driver: '/images/services/driver.jpg',
  gardener: '/images/services/gardener.jpg',
  'loading-moving': '/images/services/delivery.jpg',
  construction: '/images/services/others.jpg',
};

const CATEGORY_POSITION_MAP: Record<string, string> = {
  electrical: 'center 2%',
  'computer-hardware': 'center 4%',
  'computer-software': 'center 4%',
  confectioner: 'center 4%',
  mechanic: 'center 5%',
  'gas-cylinder': 'center 4%',
  watchman: 'center 2%',
  'house-care-taker': 'center 5%',
  'office-boy': 'center 5%',
  cook: 'center 0%',
  plumbing: 'center 4%',
  painting: 'center 4%',
  carpenter: 'center 5%',
  cleaning: 'center 6%',
  driver: 'center 2%',
  gardener: 'center 5%',
  'loading-moving': 'center 5%',
  construction: 'center 4%',
};

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
            className={`group relative flex flex-col justify-between rounded-2xl overflow-hidden border transition-all duration-200 cursor-pointer bg-white text-center focus:outline-none active:scale-98 ${
              isSelected
                ? 'ring-2 ring-[#1464D2] shadow-md border-[#1464D2]'
                : 'border-slate-200 hover:border-slate-300 hover:shadow-lg hover:-translate-y-1'
            }`}
          >
            {/* Visual Photo / Icon Presentation Area */}
            {CATEGORY_IMAGE_MAP[cat.slug] ? (
              <div className="relative w-full aspect-[4/5] bg-gradient-to-b from-[#F8F9FA] via-[#F1F3F6] to-[#E9ECF0] overflow-hidden flex items-end justify-center">
                <Image
                  src={CATEGORY_IMAGE_MAP[cat.slug]}
                  alt={`${cat.name} - Verified Labour`}
                  fill
                  sizes="(max-width: 640px) 45vw, (max-width: 1024px) 25vw, 15vw"
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                  style={{ objectPosition: CATEGORY_POSITION_MAP[cat.slug] || 'center top' }}
                />
              </div>
            ) : (
              <div className={`pt-6 pb-4 px-3 flex flex-col items-center justify-center ${visual.bgColor} transition-colors group-hover:brightness-95 h-36`}>
                <div className="relative w-14 h-14 rounded-2xl bg-white shadow-xs border border-white/60 flex items-center justify-center transition-transform group-hover:scale-110">
                  <Icon className={`w-7 h-7 ${visual.iconColor} stroke-[2.2]`} />
                </div>
              </div>
            )}

            {/* Bottom Rounded Pill with Category Label matching Reference Design */}
            <div
              className={`py-2 px-1.5 sm:py-2 sm:px-1.5 text-center text-white transition-colors select-none flex flex-col justify-center min-h-[46px] sm:min-h-[44px] ${visual.pillColor}`}
            >
              <span className="block font-bold text-xs sm:text-xs tracking-tight leading-snug line-clamp-1">
                {cat.name}
              </span>
              {cat.nameHi && (
                <span className="block font-semibold text-[11px] sm:text-[10px] text-white/95 leading-tight mt-0.5 tracking-normal font-devanagari line-clamp-1">
                  {cat.nameHi}
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
