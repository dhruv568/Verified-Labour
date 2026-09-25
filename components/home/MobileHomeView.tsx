'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import LocationSearch from './LocationSearch';
import {
  Zap,
  Wrench,
  Hammer,
  Paintbrush,
  Sparkles,
  Utensils,
  Car,
  Leaf,
  ChevronRight,
  ShieldCheck,
  Users,
  Clock,
  Award,
  IndianRupee,
  CheckCircle2,
  Home,
  Building2,
  Factory,
  ChevronDown,
  Search,
  MessageCircle,
} from 'lucide-react';

interface PlatformStats {
  verifiedWorkers: number;
  jobsCompleted: number;
  averageRating: number | null;
  reviewCount: number;
  citiesCovered: number;
  cities: string[];
}

interface MobileHomeViewProps {
  selectedCategory?: string;
  onSelectCategory?: (categorySlug: string) => void;
  onSearchWorker?: (query?: string) => void;
  onOpenAuth?: (mode?: 'login' | 'register', role?: 'CUSTOMER' | 'WORKER' | 'BUSINESS') => void;
  platformStats?: PlatformStats | null;
}

// 8 Featured Categories matching reference screenshot exactly
const FEATURED_CATEGORIES = [
  {
    title: 'Electrician',
    hindiTitle: 'इलेक्ट्रीशियन',
    slug: 'electrical',
    image: '/images/services/electrician.jpg',
    icon: Zap,
    iconBg: 'bg-[#1264D6]',
  },
  {
    title: 'Plumber',
    hindiTitle: 'प्लंबर',
    slug: 'plumbing',
    image: '/images/services/plumber.jpg',
    icon: Wrench,
    iconBg: 'bg-[#1264D6]',
  },
  {
    title: 'Carpenter',
    hindiTitle: 'बढ़ई (कारपेंटर)',
    slug: 'carpenter',
    image: '/images/services/carpenter.jpg',
    icon: Hammer,
    iconBg: 'bg-[#9A3412]',
  },
  {
    title: 'Painter',
    hindiTitle: 'पेंटर',
    slug: 'painting',
    image: '/images/services/painter.jpg',
    icon: Paintbrush,
    iconBg: 'bg-[#DB2777]',
  },
  {
    title: 'House Helper',
    hindiTitle: 'घरेलू कामगार',
    slug: 'cleaning',
    image: '/images/services/cleaning.jpg',
    icon: Sparkles,
    iconBg: 'bg-[#8B5CF6]',
  },
  {
    title: 'Cook',
    hindiTitle: 'रसोइया (कुक)',
    slug: 'cook',
    image: '/images/services/cook.jpg',
    icon: Utensils,
    iconBg: 'bg-[#F97316]',
  },
  {
    title: 'Driver',
    hindiTitle: 'ड्राइवर',
    slug: 'driver',
    image: '/images/services/driver.jpg',
    icon: Car,
    iconBg: 'bg-[#079447]',
  },
  {
    title: 'Gardener',
    hindiTitle: 'माली (गार्डनर)',
    slug: 'gardener',
    image: '/images/services/gardener.jpg',
    icon: Leaf,
    iconBg: 'bg-[#16A34A]',
  },
];

// Additional 10 categories for "View All" expander
const MORE_CATEGORIES = [
  { title: 'Computer Hardware', hindiTitle: 'कंप्यूटर हार्डवेयर', slug: 'computer-hardware', image: '/images/services/computer-hardware.jpg' },
  { title: 'Computer Software', hindiTitle: 'कंप्यूटर सॉफ्टवेयर', slug: 'computer-software', image: '/images/services/computer-software.jpg' },
  { title: 'Confectioner', hindiTitle: 'हलवाई / कन्फेक्शनर', slug: 'confectioner', image: '/images/services/confectioner.jpg' },
  { title: 'Mechanic', hindiTitle: 'मैकेनिक', slug: 'mechanic', image: '/images/services/mechanic.jpg' },
  { title: 'Gas Cylinder Wala', hindiTitle: 'गैस सिलेंडर वाला', slug: 'gas-cylinder', image: '/images/services/gas-cylinder.jpg' },
  { title: 'Watchman', hindiTitle: 'सुरक्षा गार्ड / चौकीदार', slug: 'watchman', image: '/images/services/watchman.jpg' },
  { title: 'House Care Taker', hindiTitle: 'घर की देखभाल', slug: 'house-care-taker', image: '/images/services/house-care-taker.jpg' },
  { title: 'Office Boy', hindiTitle: 'ऑफिस बॉय', slug: 'office-boy', image: '/images/services/office-boy.jpg' },
  { title: 'Delivery Helper', hindiTitle: 'डिलीवरी सहायक', slug: 'loading-moving', image: '/images/services/delivery.jpg' },
  { title: 'Other Services', hindiTitle: 'अन्य सेवाएं', slug: 'construction', image: '/images/services/others.jpg' },
];

export default function MobileHomeView({
  selectedCategory,
  onSelectCategory,
  onSearchWorker,
  onOpenAuth,
  platformStats,
}: MobileHomeViewProps) {
  const [activeSegment, setActiveSegment] = useState<'home' | 'office' | 'business'>('home');
  const [showAllCategories, setShowAllCategories] = useState(false);

  return (
    <div className="w-full bg-[#F4F6F9] pb-8 font-sans space-y-4">
      {/* ================= 1. RECREATED MOBILE HERO SECTION (NON-OVERLAPPING RESPONSIVE GRID) ================= */}
      <section className="relative bg-gradient-to-b from-blue-50/80 via-white to-slate-50/90 pt-3 pb-4 border-b border-slate-200/80 shadow-2xs overflow-hidden">
        {/* Soft Ambient Background Glows */}
        <div className="absolute -top-10 -left-10 w-40 h-40 bg-blue-400/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute top-10 right-0 w-48 h-48 bg-emerald-400/10 rounded-full blur-2xl pointer-events-none" />

        <div className="px-3.5 relative z-20 space-y-3">
          {/* Top Tagline & Badge Header Bar */}
          <div className="flex items-center justify-between gap-1.5 animate-fade-in-up">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 text-[#079447] rounded-full text-[11px] xs:text-xs font-black border border-emerald-200/90 font-devanagari shadow-2xs backdrop-blur-xs">
              <Sparkles className="w-3.5 h-3.5 text-[#079447] shrink-0 animate-pulse" />
              <span className="truncate">काम के लिए भरोसेमंद लोग</span>
            </div>

            <div className="inline-flex items-center gap-1 bg-[#079447] text-white px-2.5 py-1 rounded-full text-[10px] xs:text-[11px] font-black shadow-2xs border border-emerald-600 font-devanagari shrink-0">
              <CheckCircle2 className="w-3.5 h-3.5 fill-white text-[#079447]" />
              <span>वेरिफाइड लेबर</span>
            </div>
          </div>

          {/* MAIN HERO GRID: 2 Dedicated Non-Overlapping Columns (Left Text, Right Worker Image) */}
          <div className="grid grid-cols-12 gap-2 xs:gap-3 items-center pt-0.5">
            {/* LEFT COLUMN (7 of 12 cols = ~58% width): Dedicated Text Area */}
            <div className="col-span-7 space-y-2 animate-fade-in-up" style={{ animationDelay: '100ms' }}>
              <h1 className="text-[17px] xs:text-xl sm:text-2xl font-black text-[#082B66] leading-[1.22] font-devanagari tracking-tight">
                आपके घर और व्यवसाय के लिए{' '}
                <span className="text-[#1264D6] inline-block">भरोसेमंद मजदूर</span>{' '}
                <span className="text-[#079447] inline-block">और कामगार</span>
              </h1>

              <p className="text-[10px] xs:text-[11px] sm:text-xs font-extrabold text-slate-600 font-devanagari tracking-normal leading-tight">
                जाँच-परखे • अनुभवी • समय पर उपलब्ध
              </p>

              {/* Micro Aadhaar Verification Tag */}
              <div className="inline-flex items-center gap-1.5 px-2 py-1 bg-white/95 backdrop-blur-md rounded-xl border border-slate-200/90 shadow-2xs">
                <CheckCircle2 className="w-3 h-3 fill-[#079447] text-white shrink-0" />
                <span className="text-[9px] xs:text-[10px] font-black text-[#082B66] font-devanagari">
                  100% Aadhaar Verified & Trained
                </span>
              </div>
            </div>

            {/* RIGHT COLUMN (5 of 12 cols = ~42% width): Dedicated Worker Image & Verification Seal */}
            <div className="col-span-5 relative flex flex-col items-center justify-center animate-fade-in-up" style={{ animationDelay: '200ms' }}>
              {/* Worker Image Container with Gentle Floating Motion & Crisp Framing */}
              <div className="relative w-full aspect-[4/5] max-h-[195px] xs:max-h-[220px] rounded-2xl overflow-hidden border border-blue-100 bg-gradient-to-b from-blue-100/50 to-slate-100/80 shadow-xs animate-gentle-float">
                <Image
                  src="/images/home/worker-cta-man.jpg"
                  alt="Verified Labour Professional Skilled Indian Worker"
                  fill
                  priority
                  className="object-cover object-[50%_8%] scale-105"
                  sizes="(max-width: 640px) 45vw, 30vw"
                />

                {/* Gradient Vignette at bottom of image for badge contrast */}
                <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-navy-950/40 to-transparent pointer-events-none" />
              </div>

              {/* Gold Verification Seal Badge overlayed at bottom edge of worker image (chest level, face fully unobstructed) */}
              <div className="absolute -bottom-2.5 -left-2.5 xs:-left-3 z-10 animate-fade-in-up" style={{ animationDelay: '300ms' }}>
                <div className="relative flex items-center gap-1.5 bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-400 text-[#082B66] px-2 py-1 rounded-xl shadow-md border border-amber-200/90 text-[9px] xs:text-[10px] font-black font-devanagari tracking-tight">
                  <div className="w-4 h-4 rounded-full bg-[#082B66] text-amber-300 flex items-center justify-center shrink-0 shadow-2xs">
                    <CheckCircle2 className="w-3 h-3 fill-amber-300 text-[#082B66]" />
                  </div>
                  <span className="leading-tight whitespace-nowrap">जांच-परखे कामगार</span>
                </div>
              </div>
            </div>
          </div>

          {/* 3 HTML/CSS Rounded Trust Feature Cards with Interactive Touch Feedback */}
          <div className="grid grid-cols-3 gap-1.5 xs:gap-2 pt-1 animate-fade-in-up" style={{ animationDelay: '250ms' }}>
            {/* Card 1: Safe & Reliable */}
            <div className="bg-white/95 backdrop-blur-xs rounded-2xl p-2 border border-slate-200/90 shadow-2xs flex flex-col items-center justify-center text-center hover:shadow-xs hover:border-emerald-300 active:scale-95 transition-all duration-150 cursor-pointer group">
              <div className="w-8 h-8 xs:w-9 xs:h-9 rounded-full bg-emerald-50 text-[#079447] flex items-center justify-center mb-1 shadow-2xs border border-emerald-100 group-hover:scale-110 transition-transform">
                <ShieldCheck className="w-4 h-4 xs:w-5 xs:h-5 stroke-[2.5]" />
              </div>
              <span className="text-[10px] xs:text-[11px] font-black text-[#082B66] font-devanagari leading-tight">
                सुरक्षित और भरोसेमंद
              </span>
              <span className="text-[8px] xs:text-[9px] text-slate-500 font-semibold mt-0.5">
                Safe & Reliable
              </span>
            </div>

            {/* Card 2: Skilled Workers */}
            <div className="bg-white/95 backdrop-blur-xs rounded-2xl p-2 border border-slate-200/90 shadow-2xs flex flex-col items-center justify-center text-center hover:shadow-xs hover:border-blue-300 active:scale-95 transition-all duration-150 cursor-pointer group">
              <div className="w-8 h-8 xs:w-9 xs:h-9 rounded-full bg-blue-50 text-[#1264D6] flex items-center justify-center mb-1 shadow-2xs border border-blue-100 group-hover:scale-110 transition-transform">
                <Users className="w-4 h-4 xs:w-5 xs:h-5 stroke-[2.5]" />
              </div>
              <span className="text-[10px] xs:text-[11px] font-black text-[#082B66] font-devanagari leading-tight">
                अनुभवी कामगार
              </span>
              <span className="text-[8px] xs:text-[9px] text-slate-500 font-semibold mt-0.5">
                Skilled Workers
              </span>
            </div>

            {/* Card 3: Available When Needed */}
            <div className="bg-white/95 backdrop-blur-xs rounded-2xl p-2 border border-slate-200/90 shadow-2xs flex flex-col items-center justify-center text-center hover:shadow-xs hover:border-amber-300 active:scale-95 transition-all duration-150 cursor-pointer group">
              <div className="w-8 h-8 xs:w-9 xs:h-9 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mb-1 shadow-2xs border border-amber-100 group-hover:scale-110 transition-transform">
                <Clock className="w-4 h-4 xs:w-5 xs:h-5 stroke-[2.5]" />
              </div>
              <span className="text-[10px] xs:text-[11px] font-black text-[#082B66] font-devanagari leading-tight">
                जब ज़रूरत तब उपलब्ध
              </span>
              <span className="text-[8px] xs:text-[9px] text-slate-500 font-semibold mt-0.5">
                On-Demand
              </span>
            </div>
          </div>

          {/* Location & Search Bar */}
          <div className="pt-0.5 animate-fade-in-up" style={{ animationDelay: '350ms' }}>
            <LocationSearch onSearch={onSearchWorker} />
          </div>
        </div>
      </section>

      {/* ================= 2. 2x4 SERVICE CATEGORY GRID (MATCHING REFERENCE) ================= */}
      <section className="px-3.5">
        {/* Section Header */}
        <div className="flex items-center justify-between mb-2.5 px-0.5">
          <div>
            <h2 className="text-base font-black text-[#082B66] tracking-tight flex items-center gap-1.5">
              <span>Popular Categories</span>
              <span className="text-xs font-bold text-slate-500 font-devanagari">
                (प्रमुख सेवाएं)
              </span>
            </h2>
          </div>
          <button
            type="button"
            onClick={() => setShowAllCategories(!showAllCategories)}
            className="text-xs font-bold text-[#1264D6] hover:underline flex items-center gap-0.5"
          >
            <span>{showAllCategories ? 'कम देखें' : 'सभी देखें'}</span>
            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showAllCategories ? 'rotate-180' : ''}`} />
          </button>
        </div>

        {/* 2-Column Responsive Grid matching reference image exactly */}
        <div className="grid grid-cols-2 gap-2.5">
          {FEATURED_CATEGORIES.map((item) => {
            const IconComp = item.icon;
            const isSelected = selectedCategory === item.slug;

            return (
              <div
                key={item.slug}
                role="button"
                tabIndex={0}
                onClick={() => onSelectCategory?.(item.slug)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onSelectCategory?.(item.slug);
                  }
                }}
                className={`group relative bg-white rounded-2xl overflow-hidden border transition-all duration-150 cursor-pointer shadow-2xs hover:shadow-md active:scale-98 flex flex-col justify-between ${
                  isSelected
                    ? 'ring-2 ring-[#1264D6] border-[#1264D6] shadow-sm'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                {/* Upper Image Box with Icon Badge */}
                <div className="relative w-full aspect-[4/3] bg-slate-100 overflow-hidden">
                  <Image
                    src={item.image}
                    alt={`${item.title} (${item.hindiTitle})`}
                    fill
                    sizes="45vw"
                    className="object-cover object-center group-hover:scale-105 transition-transform duration-300"
                  />

                  {/* Circular Icon Overlay Badge matching Reference */}
                  <div
                    className={`absolute bottom-2 left-2 w-8 h-8 rounded-full ${item.iconBg} text-white flex items-center justify-center shadow-md border-2 border-white`}
                  >
                    <IconComp className="w-4 h-4 stroke-[2.5]" />
                  </div>
                </div>

                {/* Bottom Label Box with Hindi Title & Right Chevron */}
                <div className="p-2.5 bg-white flex items-center justify-between border-t border-slate-100">
                  <span className="font-extrabold text-xs text-[#082B66] font-devanagari tracking-tight line-clamp-1">
                    {item.hindiTitle}
                  </span>
                  <ChevronRight className="w-4 h-4 text-slate-400 shrink-0 ml-1" />
                </div>
              </div>
            );
          })}
        </div>

        {/* Expandable More Categories */}
        {showAllCategories && (
          <div className="mt-3 pt-3 border-t border-slate-200/80 animate-in fade-in slide-in-from-top-2 duration-200">
            <h3 className="text-xs font-bold text-slate-600 mb-2 font-devanagari">
              अन्य सभी सत्यापित कामगार सेवाएं:
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {MORE_CATEGORIES.map((item) => (
                <div
                  key={item.slug}
                  role="button"
                  tabIndex={0}
                  onClick={() => onSelectCategory?.(item.slug)}
                  className="bg-white rounded-xl p-2 border border-slate-200 flex items-center gap-2 cursor-pointer hover:bg-slate-50 active:scale-98 shadow-2xs"
                >
                  <div className="relative w-8 h-8 rounded-lg overflow-hidden shrink-0 bg-slate-100">
                    <Image src={item.image} alt={item.title} fill className="object-cover" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-bold text-[#082B66] truncate font-devanagari">
                      {item.hindiTitle}
                    </p>
                    <p className="text-[9px] text-slate-500 truncate">{item.title}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* ================= 3. TRUST & VERIFICATION DARK BLUE BAR (MATCHING REFERENCE) ================= */}
      <section className="px-3.5">
        <div className="bg-[#041A40] text-white rounded-2xl p-3.5 shadow-lg border border-blue-900/40">
          <div className="grid grid-cols-3 gap-2 text-center divide-x divide-blue-800/60">
            {/* 1. Identity Verified */}
            <div className="flex flex-col items-center justify-center px-1">
              <div className="w-9 h-9 rounded-full bg-amber-400/20 text-amber-300 flex items-center justify-center mb-1.5 border border-amber-400/30">
                <CheckCircle2 className="w-5 h-5 stroke-[2.5]" />
              </div>
              <span className="text-[11px] font-black text-white font-devanagari leading-snug">
                पहचान सत्यापित
              </span>
              <span className="text-[9px] text-blue-200 font-medium">Aadhaar Verified</span>
            </div>

            {/* 2. Skilled & Experienced */}
            <div className="flex flex-col items-center justify-center px-1">
              <div className="w-9 h-9 rounded-full bg-amber-400/20 text-amber-300 flex items-center justify-center mb-1.5 border border-amber-400/30">
                <Award className="w-5 h-5 stroke-[2.5]" />
              </div>
              <span className="text-[11px] font-black text-white font-devanagari leading-snug">
                कुशल और अनुभवी
              </span>
              <span className="text-[9px] text-blue-200 font-medium">Skill Tested</span>
            </div>

            {/* 3. Fair Price & Transparency */}
            <div className="flex flex-col items-center justify-center px-1">
              <div className="w-9 h-9 rounded-full bg-amber-400/20 text-amber-300 flex items-center justify-center mb-1.5 border border-amber-400/30">
                <IndianRupee className="w-5 h-5 stroke-[2.5]" />
              </div>
              <span className="text-[11px] font-black text-white font-devanagari leading-snug">
                सही दाम & पारदर्शिता
              </span>
              <span className="text-[9px] text-blue-200 font-medium">Direct Rates</span>
            </div>
          </div>
        </div>
      </section>

      {/* ================= 4. STRONG BOOKING / FIND-WORKER CTA BUTTON (MATCHING REFERENCE) ================= */}
      <section className="px-3.5">
        <button
          type="button"
          onClick={() => onSearchWorker?.()}
          className="w-full bg-gradient-to-r from-[#079447] via-[#059669] to-[#047857] hover:from-[#067f3c] hover:to-[#03694a] text-white font-black text-base py-3.5 px-4 rounded-2xl shadow-lg shadow-emerald-900/25 flex items-center justify-center gap-3 border border-emerald-400/30 active:scale-[0.98] transition-all group"
        >
          {/* WhatsApp / Phone / Booking Icon */}
          <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center shrink-0">
            <MessageCircle className="w-5 h-5 fill-white text-transparent stroke-none" />
          </div>

          <span className="font-devanagari tracking-wide text-lg drop-shadow-xs">
            अभी कामगार बुक करें
          </span>

          <ChevronRight className="w-5 h-5 stroke-[3] group-hover:translate-x-1 transition-transform ml-auto" />
        </button>
      </section>

      {/* ================= 5. SEGMENT FILTER BAR (HOMES / OFFICE / BUSINESS) ================= */}
      <section className="px-3.5">
        <div className="bg-white rounded-2xl p-1.5 border border-slate-200/90 shadow-2xs grid grid-cols-3 gap-1">
          <button
            type="button"
            onClick={() => setActiveSegment('home')}
            className={`py-2 px-1.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all font-devanagari ${
              activeSegment === 'home'
                ? 'bg-blue-50 text-[#1264D6] border border-blue-200 shadow-2xs font-extrabold'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Home className="w-4 h-4 text-[#1264D6]" />
            <span>घर के लिए</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSegment('office')}
            className={`py-2 px-1.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all font-devanagari ${
              activeSegment === 'office'
                ? 'bg-blue-50 text-[#1264D6] border border-blue-200 shadow-2xs font-extrabold'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Building2 className="w-4 h-4 text-[#1264D6]" />
            <span>कार्यालय के लिए</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSegment('business')}
            className={`py-2 px-1.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all font-devanagari ${
              activeSegment === 'business'
                ? 'bg-blue-50 text-[#1264D6] border border-blue-200 shadow-2xs font-extrabold'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Factory className="w-4 h-4 text-[#1264D6]" />
            <span>व्यवसाय के लिए</span>
          </button>
        </div>
      </section>

      {/* ================= 6. YELLOW CALLOUT BANNER ("Who is NOT on Verified Labour?") ================= */}
      <section className="px-3.5">
        <div className="w-full bg-[#FFE600] rounded-2xl p-3.5 border-2 border-amber-400 shadow-sm flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="text-2xl shrink-0">❓</span>
            <div className="min-w-0">
              <p className="text-[10px] font-black text-[#082B66] uppercase tracking-wider">
                Let us Know...
              </p>
              <p className="text-xs font-black text-[#082B66] leading-tight">
                Who is <span className="text-[#DC2626] underline decoration-[#DC2626] decoration-2">NOT</span> on{' '}
                <span>Verified Labour</span>?
              </p>
            </div>
          </div>
          <Link
            href="/who-is-not-verified"
            className="px-3 py-1.5 bg-white text-[#1264D6] font-black text-xs rounded-xl border border-slate-300 shadow-2xs shrink-0 active:scale-95 cursor-pointer flex items-center justify-center"
          >
            View All
          </Link>
        </div>
      </section>

      {/* ================= 7. WORKER REGISTRATION CTA FOR MOBILE ================= */}
      <section className="px-3.5 pt-1">
        <div className="bg-gradient-to-br from-[#082B66] to-[#1264D6] text-white rounded-2xl p-4 shadow-md flex items-center justify-between gap-3">
          <div className="space-y-1">
            <span className="px-2 py-0.5 bg-amber-400 text-[#082B66] font-extrabold text-[10px] rounded-md uppercase font-devanagari">
              कामगार पंजीकरण
            </span>
            <h3 className="text-sm font-black leading-tight font-devanagari">
              क्या आप कामगार हैं? Verified Labour पर जुड़ें
            </h3>
            <p className="text-[11px] text-blue-100 font-medium">
              अपनी कुशलता से रोज़ाना काम और सीधी कमाई पाएं।
            </p>
          </div>
          <button
            type="button"
            onClick={() => onOpenAuth?.('register', 'WORKER')}
            className="px-3.5 py-2.5 bg-amber-400 hover:bg-amber-300 text-[#082B66] font-black text-xs rounded-xl shrink-0 shadow-2xs active:scale-95 whitespace-nowrap font-devanagari"
          >
            रजिस्टर करें
          </button>
        </div>
      </section>
    </div>
  );
}
