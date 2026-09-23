'use client';

import React from 'react';
import ServiceCard from './ServiceCard';
import {
  Zap,
  Cpu,
  Monitor,
  Cookie,
  Wrench,
  Flame,
  Shield,
  Home,
  Briefcase,
  Utensils,
  Paintbrush,
  Hammer,
  Sparkles,
  Car,
  Sprout,
  Package,
  Layers,
} from 'lucide-react';

interface ServiceCategoriesProps {
  selectedCategorySlug?: string;
  onSelectCategory?: (categorySlug: string) => void;
  onViewAll?: () => void;
}

// Exactly 18 categories in the exact order shown in the screenshot
const CATEGORY_ITEMS = [
  // --- ROW 1 (9 items) ---
  {
    title: 'Electrician',
    slug: 'electrical',
    pillColor: 'bg-[#1264D6]',
    bgTint: 'bg-blue-50/70',
    iconColor: 'text-[#1264D6]',
    IconComponent: Zap,
  },
  {
    title: 'Computer Hardware',
    slug: 'computer-hardware',
    pillColor: 'bg-[#079447]',
    bgTint: 'bg-emerald-50/70',
    iconColor: 'text-[#079447]',
    IconComponent: Cpu,
  },
  {
    title: 'Computer Software',
    slug: 'computer-software',
    pillColor: 'bg-[#F25C05]',
    bgTint: 'bg-orange-50/70',
    iconColor: 'text-[#F25C05]',
    IconComponent: Monitor,
  },
  {
    title: 'Confectioner',
    slug: 'confectioner',
    pillColor: 'bg-[#C026D3]',
    bgTint: 'bg-fuchsia-50/70',
    iconColor: 'text-[#C026D3]',
    IconComponent: Cookie,
  },
  {
    title: 'Car / 2 Wheeler Mechanic',
    slug: 'mechanic',
    pillColor: 'bg-[#3730A3]',
    bgTint: 'bg-indigo-50/70',
    iconColor: 'text-[#3730A3]',
    IconComponent: Wrench,
  },
  {
    title: 'Gas Cylinder Wala',
    slug: 'gas-cylinder',
    pillColor: 'bg-[#7C3AED]',
    bgTint: 'bg-purple-50/70',
    iconColor: 'text-[#7C3AED]',
    IconComponent: Flame,
  },
  {
    title: 'Watchman',
    slug: 'watchman',
    pillColor: 'bg-[#1E40AF]',
    bgTint: 'bg-sky-50/70',
    iconColor: 'text-[#1E40AF]',
    IconComponent: Shield,
  },
  {
    title: 'House Care Taker',
    slug: 'house-care-taker',
    pillColor: 'bg-[#0D9488]',
    bgTint: 'bg-teal-50/70',
    iconColor: 'text-[#0D9488]',
    IconComponent: Home,
  },
  {
    title: 'Office Boy',
    slug: 'office-boy',
    pillColor: 'bg-[#A16207]',
    bgTint: 'bg-amber-50/70',
    iconColor: 'text-[#A16207]',
    IconComponent: Briefcase,
  },

  // --- ROW 2 (9 items) ---
  {
    title: 'Cook',
    slug: 'cook',
    pillColor: 'bg-[#059669]',
    bgTint: 'bg-emerald-50/70',
    iconColor: 'text-[#059669]',
    IconComponent: Utensils,
  },
  {
    title: 'Plumber',
    slug: 'plumbing',
    pillColor: 'bg-[#D97706]',
    bgTint: 'bg-amber-50/70',
    iconColor: 'text-[#D97706]',
    IconComponent: Wrench,
  },
  {
    title: 'Painter',
    slug: 'painting',
    pillColor: 'bg-[#6D28D9]',
    bgTint: 'bg-purple-50/70',
    iconColor: 'text-[#6D28D9]',
    IconComponent: Paintbrush,
  },
  {
    title: 'Carpenter',
    slug: 'carpenter',
    pillColor: 'bg-[#DC2626]',
    bgTint: 'bg-rose-50/70',
    iconColor: 'text-[#DC2626]',
    IconComponent: Hammer,
  },
  {
    title: 'Maid / House Cleaning',
    slug: 'cleaning',
    pillColor: 'bg-[#0891B2]',
    bgTint: 'bg-cyan-50/70',
    iconColor: 'text-[#0891B2]',
    IconComponent: Sparkles,
  },
  {
    title: 'Driver',
    slug: 'driver',
    pillColor: 'bg-[#EA580C]',
    bgTint: 'bg-orange-50/70',
    iconColor: 'text-[#EA580C]',
    IconComponent: Car,
  },
  {
    title: 'Gardener',
    slug: 'gardener',
    pillColor: 'bg-[#16A34A]',
    bgTint: 'bg-green-50/70',
    iconColor: 'text-[#16A34A]',
    IconComponent: Sprout,
  },
  {
    title: 'Delivery Helper',
    slug: 'loading-moving',
    pillColor: 'bg-[#059669]',
    bgTint: 'bg-emerald-50/70',
    iconColor: 'text-[#059669]',
    IconComponent: Package,
  },
  {
    title: 'Others',
    slug: 'construction',
    pillColor: 'bg-[#0F766E]',
    bgTint: 'bg-teal-50/70',
    iconColor: 'text-[#0F766E]',
    IconComponent: Layers,
  },
];

export default function ServiceCategories({
  selectedCategorySlug,
  onSelectCategory,
  onViewAll,
}: ServiceCategoriesProps) {
  return (
    <section id="services" className="py-12 sm:py-16 bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header Row: Title on Left, View All on Right */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-8">
          <div>
            <h2 className="text-2xl sm:text-3xl font-black text-[#082B66] tracking-tight">
              Choose a Service
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
              18+ Verified Categories — More Coming Soon!
            </p>
          </div>

          <div>
            <button
              type="button"
              onClick={onViewAll}
              className="px-4 py-1.5 text-xs font-bold text-[#1264D6] hover:bg-blue-50 border border-[#1264D6] rounded-lg transition-colors shadow-2xs"
            >
              View All
            </button>
          </div>
        </div>

        {/* Dense 9-Column Grid matching Screenshot */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-9 gap-2.5 sm:gap-3">
          {CATEGORY_ITEMS.map((item) => (
            <ServiceCard
              key={item.title}
              title={item.title}
              slug={item.slug}
              pillColor={item.pillColor}
              bgTint={item.bgTint}
              iconColor={item.iconColor}
              IconComponent={item.IconComponent}
              isSelected={selectedCategorySlug === item.slug}
              onClick={() => onSelectCategory?.(item.slug)}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
