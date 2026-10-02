'use client';

import React from 'react';
import ServiceCard from './ServiceCard';
import { ArrowRight, ShieldCheck } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { isExcludedServiceOrCategory } from '@/lib/service-translations';

interface ServiceCategoriesProps {
  selectedCategorySlug?: string;
  onSelectCategory?: (categorySlug: string) => void;
  onViewAll?: () => void;
}

// Dynamic homepage categories list (16 active categories in 2 rows of 8 on desktop)
const CATEGORY_ITEMS = [
  // --- ROW 1 (8 items) ---
  {
    title: 'Electrician',
    hindiTitle: 'इलेक्ट्रीशियन',
    slug: 'electrical',
    image: '/images/services/electrician.jpg',
    pillColor: 'bg-[#1264D6]',
    priority: true,
    objectPosition: 'center 2%',
  },
  {
    title: 'AC Technician',
    hindiTitle: 'एसी तकनीशियन / रिपेयर',
    slug: 'ac-technician',
    image: '/images/services/electrician.jpg',
    pillColor: 'bg-[#0284C7]',
    priority: true,
    objectPosition: 'center 2%',
  },
  {
    title: 'Computer Hardware',
    hindiTitle: 'कंप्यूटर हार्डवेयर',
    slug: 'computer-hardware',
    image: '/images/services/computer-hardware.jpg',
    pillColor: 'bg-[#079447]',
    priority: true,
    objectPosition: 'center 4%',
  },
  {
    title: 'Computer Software',
    hindiTitle: 'कंप्यूटर सॉफ्टवेयर',
    slug: 'computer-software',
    image: '/images/services/computer-software.jpg',
    pillColor: 'bg-[#F25C05]',
    priority: true,
    objectPosition: 'center 4%',
  },
  {
    title: 'Car / 2 Wheeler Mechanic',
    hindiTitle: 'मैकेनिक',
    slug: 'mechanic',
    image: '/images/services/mechanic.jpg',
    pillColor: 'bg-[#3730A3]',
    priority: true,
    objectPosition: 'center 5%',
  },
  {
    title: 'Gas Cylinder Wala',
    hindiTitle: 'गैस सिलेंडर वाला',
    slug: 'gas-cylinder',
    image: '/images/services/gas-cylinder.jpg',
    pillColor: 'bg-[#7C3AED]',
    priority: true,
    objectPosition: 'center 4%',
  },
  {
    title: 'Watchman',
    hindiTitle: 'सुरक्षा गार्ड / चौकीदार',
    slug: 'watchman',
    image: '/images/services/watchman.jpg',
    pillColor: 'bg-[#1E40AF]',
    priority: true,
    objectPosition: 'center 2%',
  },
  {
    title: 'Office Boy',
    hindiTitle: 'ऑफिस बॉय',
    slug: 'office-boy',
    image: '/images/services/office-boy.jpg',
    pillColor: 'bg-[#A16207]',
    priority: true,
    objectPosition: 'center 5%',
  },

  // --- ROW 2 (8 items) ---
  {
    title: 'Cook',
    hindiTitle: 'रसोइया',
    slug: 'cook',
    image: '/images/services/cook.jpg',
    pillColor: 'bg-[#059669]',
    objectPosition: 'center 0%',
  },
  {
    title: 'Plumber',
    hindiTitle: 'प्लंबर',
    slug: 'plumbing',
    image: '/images/services/plumber.jpg',
    pillColor: 'bg-[#D97706]',
    objectPosition: 'center 4%',
  },
  {
    title: 'Painter',
    hindiTitle: 'पेंटर',
    slug: 'painting',
    image: '/images/services/painter.jpg',
    pillColor: 'bg-[#6D28D9]',
    objectPosition: 'center 4%',
  },
  {
    title: 'Carpenter',
    hindiTitle: 'बढ़ई',
    slug: 'carpenter',
    image: '/images/services/carpenter.jpg',
    pillColor: 'bg-[#DC2626]',
    objectPosition: 'center 5%',
  },
  {
    title: 'Maid / House Cleaning',
    hindiTitle: 'घर की सफाई',
    slug: 'cleaning',
    image: '/images/services/cleaning.jpg',
    pillColor: 'bg-[#0891B2]',
    objectPosition: 'center 6%',
  },
  {
    title: 'Driver',
    hindiTitle: 'ड्राइवर',
    slug: 'driver',
    image: '/images/services/driver.jpg',
    pillColor: 'bg-[#EA580C]',
    objectPosition: 'center 2%',
  },
  {
    title: 'Gardener',
    hindiTitle: 'माली',
    slug: 'gardener',
    image: '/images/services/gardener.jpg',
    pillColor: 'bg-[#16A34A]',
    objectPosition: 'center 5%',
  },
  {
    title: 'Delivery Helper',
    hindiTitle: 'डिलीवरी सहायक',
    slug: 'loading-moving',
    image: '/images/services/delivery.jpg',
    pillColor: 'bg-[#059669]',
    objectPosition: 'center 5%',
  },
].filter((item) => !isExcludedServiceOrCategory(item));

export default function ServiceCategories({
  selectedCategorySlug,
  onSelectCategory,
  onViewAll,
}: ServiceCategoriesProps) {
  const { isHindi } = useLanguage();
  const [categoriesList, setCategoriesList] = React.useState<any[]>(CATEGORY_ITEMS);

  const fetchCategories = React.useCallback(async () => {
    try {
      const res = await fetch(`/api/categories?t=${Date.now()}`, {
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache' },
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.categories) && data.categories.length > 0) {
        const validCategories = data.categories.filter((cat: any) => !isExcludedServiceOrCategory(cat));

        // Map database categories by slug for fast lookup
        const dbCatMap = new Map<string, any>();
        validCategories.forEach((cat: any) => {
          if (cat.slug) {
            dbCatMap.set(cat.slug, cat);
          }
        });

        // Merge DB dynamic metadata into full CATEGORY_ITEMS array
        const merged = CATEGORY_ITEMS.map((item) => {
          const dbCat = dbCatMap.get(item.slug);
          return {
            ...item,
            title: dbCat?.name || item.title,
            hindiTitle: dbCat?.nameHi || item.hindiTitle,
            image: dbCat?.iconUrl || item.image,
          };
        }).filter((item) => !isExcludedServiceOrCategory(item));

        // Append any extra DB categories not already in CATEGORY_ITEMS
        validCategories.forEach((cat: any) => {
          if (
            cat.slug &&
            !merged.some((item) => item.slug === cat.slug) &&
            !isExcludedServiceOrCategory(cat)
          ) {
            merged.push({
              title: cat.name,
              hindiTitle: cat.nameHi || cat.name,
              slug: cat.slug,
              image: cat.iconUrl || '/images/services/others.jpg',
              pillColor: 'bg-[#082B66]',
              priority: false,
              objectPosition: 'center 4%',
            });
          }
        });

        setCategoriesList(merged.filter((item) => !isExcludedServiceOrCategory(item)));
      }
    } catch (err) {
      // Keep static default CATEGORY_ITEMS on error
    }
  }, []);

  React.useEffect(() => {
    fetchCategories();

    const handleUpdate = () => {
      fetchCategories();
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('categories-updated', handleUpdate);
      window.addEventListener('site-content-updated', handleUpdate);
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('categories-updated', handleUpdate);
        window.removeEventListener('site-content-updated', handleUpdate);
      }
    };
  }, [fetchCategories]);

  return (
    <section id="services" className="py-10 sm:py-16 bg-[#FAFBFC] border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header Row: Title with Hindi Subtitle on Left, View All on Right */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6 sm:mb-8">
          <div>
            {/* Trust Micro-badge */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-[#1264D6] border border-blue-200/80 mb-2">
              <ShieldCheck className="w-3.5 h-3.5 text-[#1264D6]" />
              <span>सत्यापित कामगार • 100% Aadhaar & Skill Verified</span>
            </div>

            {/* Main Bilingual Heading */}
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-[#082B66] tracking-tight flex flex-wrap items-baseline gap-2 sm:gap-3">
              <span>Choose a Service</span>
              <span className="text-lg sm:text-2xl text-slate-500 font-bold font-devanagari">
                अपनी ज़रूरत का काम चुनें
              </span>
            </h2>

            {/* Subtitle with Hindi translation */}
            <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
              <span>16+ Verified Categories — More Coming Soon!</span>
              <span className="text-slate-400 font-normal ml-1 sm:ml-2">
                • 16+ सत्यापित सेवाएं — और भी जल्द!
              </span>
            </p>
          </div>

          {/* View All Button */}
          <div className="shrink-0">
            <button
              type="button"
              onClick={onViewAll}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-[#1264D6] hover:bg-blue-50 border border-[#1264D6] rounded-xl transition-all shadow-2xs hover:shadow-xs active:scale-95 bg-white"
            >
              <span>View All</span>
              <span className="text-[10px] text-blue-500/80 font-normal font-devanagari">/ सभी देखें</span>
              <ArrowRight className="w-3.5 h-3.5 ml-0.5" />
            </button>
          </div>
        </div>

        {/* Balanced Grid Layout displaying 16 service cards (2 rows of 8 cards) */}
        <div className="grid grid-cols-2 min-[440px]:grid-cols-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-8 gap-2.5 sm:gap-3">
          {categoriesList.map((item) => (
            <ServiceCard
              key={item.slug || item.title}
              title={item.title}
              hindiTitle={item.hindiTitle}
              slug={item.slug}
              image={item.image}
              pillColor={item.pillColor}
              isSelected={selectedCategorySlug === item.slug}
              onClick={() => onSelectCategory?.(item.slug)}
              priority={item.priority}
              objectPosition={item.objectPosition}
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
