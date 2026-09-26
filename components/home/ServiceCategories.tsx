'use client';

import React from 'react';
import ServiceCard from './ServiceCard';
import { ArrowRight, ShieldCheck } from 'lucide-react';

interface ServiceCategoriesProps {
  selectedCategorySlug?: string;
  onSelectCategory?: (categorySlug: string) => void;
  onViewAll?: () => void;
}

// Exactly 18 categories matching reference image in exact order and colors
const CATEGORY_ITEMS = [
  // --- ROW 1 (9 items) ---
  {
    title: 'Electrician',
    hindiTitle: 'इलेक्ट्रीशियन',
    slug: 'electrical',
    image: '/images/services/electrician.jpg',
    pillColor: 'bg-[#1264D6]',
    priority: true,
  },
  {
    title: 'Computer Hardware',
    hindiTitle: 'कंप्यूटर हार्डवेयर',
    slug: 'computer-hardware',
    image: '/images/services/computer-hardware.jpg',
    pillColor: 'bg-[#079447]',
    priority: true,
  },
  {
    title: 'Computer Software',
    hindiTitle: 'कंप्यूटर सॉफ्टवेयर',
    slug: 'computer-software',
    image: '/images/services/computer-software.jpg',
    pillColor: 'bg-[#F25C05]',
    priority: true,
  },
  {
    title: 'Confectioner',
    hindiTitle: 'हलवाई / कन्फेक्शनर',
    slug: 'confectioner',
    image: '/images/services/confectioner.jpg',
    pillColor: 'bg-[#C026D3]',
    priority: true,
  },
  {
    title: 'Car / 2 Wheeler Mechanic',
    hindiTitle: 'मैकेनिक',
    slug: 'mechanic',
    image: '/images/services/mechanic.jpg',
    pillColor: 'bg-[#3730A3]',
    priority: true,
  },
  {
    title: 'Gas Cylinder Wala',
    hindiTitle: 'गैस सिलेंडर वाला',
    slug: 'gas-cylinder',
    image: '/images/services/gas-cylinder.jpg',
    pillColor: 'bg-[#7C3AED]',
    priority: true,
  },
  {
    title: 'Watchman',
    hindiTitle: 'सुरक्षा गार्ड / चौकीदार',
    slug: 'watchman',
    image: '/images/services/watchman.jpg',
    pillColor: 'bg-[#1E40AF]',
    priority: true,
  },
  {
    title: 'House Care Taker',
    hindiTitle: 'घर की देखभाल',
    slug: 'house-care-taker',
    image: '/images/services/house-care-taker.jpg',
    pillColor: 'bg-[#0D9488]',
    priority: true,
  },
  {
    title: 'Office Boy',
    hindiTitle: 'ऑफिस बॉय',
    slug: 'office-boy',
    image: '/images/services/office-boy.jpg',
    pillColor: 'bg-[#A16207]',
    priority: true,
  },

  // --- ROW 2 (9 items) ---
  {
    title: 'Cook',
    hindiTitle: 'रसोइया',
    slug: 'cook',
    image: '/images/services/cook.jpg',
    pillColor: 'bg-[#059669]',
  },
  {
    title: 'Plumber',
    hindiTitle: 'प्लंबर',
    slug: 'plumbing',
    image: '/images/services/plumber.jpg',
    pillColor: 'bg-[#D97706]',
  },
  {
    title: 'Painter',
    hindiTitle: 'पेंटर',
    slug: 'painting',
    image: '/images/services/painter.jpg',
    pillColor: 'bg-[#6D28D9]',
  },
  {
    title: 'Carpenter',
    hindiTitle: 'बढ़ई',
    slug: 'carpenter',
    image: '/images/services/carpenter.jpg',
    pillColor: 'bg-[#DC2626]',
  },
  {
    title: 'Maid / House Cleaning',
    hindiTitle: 'घर की सफाई',
    slug: 'cleaning',
    image: '/images/services/cleaning.jpg',
    pillColor: 'bg-[#0891B2]',
  },
  {
    title: 'Driver',
    hindiTitle: 'ड्राइवर',
    slug: 'driver',
    image: '/images/services/driver.jpg',
    pillColor: 'bg-[#EA580C]',
  },
  {
    title: 'Gardener',
    hindiTitle: 'माली',
    slug: 'gardener',
    image: '/images/services/gardener.jpg',
    pillColor: 'bg-[#16A34A]',
  },
  {
    title: 'Delivery Helper',
    hindiTitle: 'डिलीवरी सहायक',
    slug: 'loading-moving',
    image: '/images/services/delivery.jpg',
    pillColor: 'bg-[#059669]',
  },
  {
    title: 'Others',
    hindiTitle: 'अन्य सेवाएं',
    slug: 'construction',
    image: '/images/services/others.jpg',
    pillColor: 'bg-[#0F766E]',
  },
];

export default function ServiceCategories({
  selectedCategorySlug,
  onSelectCategory,
  onViewAll,
}: ServiceCategoriesProps) {
  return (
    <section id="services" className="py-10 sm:py-16 bg-[#FAFBFC] border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header Row: Centered Title & Hindi Subtitle */}
        <div className="flex flex-col items-center text-center mb-6 sm:mb-8">
          {/* Trust Micro-badge */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-[#1264D6] border border-blue-200/80 mb-2">
            <ShieldCheck className="w-3.5 h-3.5 text-[#1264D6]" />
            <span>सत्यापित कामगार • 100% Aadhaar Verified</span>
          </div>

          {/* Main Bilingual Heading */}
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-[#082B66] tracking-tight flex flex-wrap items-baseline justify-center gap-2 sm:gap-3 text-center">
            <span className="font-devanagari">अपनी ज़रूरत का काम चुनें</span>
            <span className="text-lg sm:text-2xl text-slate-500 font-bold">
              Choose a Service
            </span>
          </h2>
        </div>

        {/* Responsive Grid: 2 cols on phone, 3 on sm, 4 on md, 6 on lg, 9 on xl */}
        <div className="grid grid-cols-2 min-[440px]:grid-cols-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-9 gap-2.5 sm:gap-3">
          {CATEGORY_ITEMS.map((item) => (
            <ServiceCard
              key={item.title}
              title={item.title}
              hindiTitle={item.hindiTitle}
              slug={item.slug}
              image={item.image}
              pillColor={item.pillColor}
              isSelected={selectedCategorySlug === item.slug}
              onClick={() => onSelectCategory?.(item.slug)}
              priority={item.priority}
            />
          ))}
        </div>

        {/* Selected Service CTA Button */}
        {selectedCategorySlug && (
          <div className="mt-6 sm:mt-8 flex flex-col items-center justify-center animate-fade-in-up">
            <button
              type="button"
              onClick={() => onSelectCategory?.(selectedCategorySlug)}
              className="inline-flex items-center justify-center gap-2.5 px-8 py-3.5 bg-[#079447] hover:bg-[#067f3c] text-white font-black text-base rounded-full shadow-lg shadow-emerald-900/20 active:scale-95 transition-all border border-emerald-500/40 cursor-pointer"
            >
              <span className="font-devanagari">30s में बुक करें</span>
              <span className="text-xs font-semibold opacity-90">(Book in 30s)</span>
              <ArrowRight className="w-5 h-5 stroke-[2.5]" />
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
