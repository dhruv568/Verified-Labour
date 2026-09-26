'use client';

import React from 'react';
import { Zap, Briefcase, Star, MapPin } from 'lucide-react';

interface TrustStatsProps {
  stats?: {
    verifiedWorkers: number;
    jobsCompleted: number;
    averageRating: number | null;
    citiesCovered: number;
  } | null;
}

export default function TrustStats({ stats }: TrustStatsProps) {
  // Use real database city count if populated and large, otherwise use safe benchmark '8,000+'
  const dynamicCityCount =
    stats && stats.citiesCovered && stats.citiesCovered > 100
      ? `${stats.citiesCovered.toLocaleString()}+`
      : '8,000+';

  const metrics = [
    {
      icon: Zap,
      iconColor: 'text-[#1264D6]',
      mainValue: '30s',
      hindiTitle: '30 सेकंड • तेज़ बुकिंग',
      englishLabel: 'Quick Booking',
    },
    {
      icon: Briefcase,
      iconColor: 'text-[#1264D6]',
      mainValue: 'Direct',
      hindiTitle: 'सीधा बैंक सेटलमेंट',
      englishLabel: 'Direct Bank Settlement',
    },
    {
      icon: Star,
      iconColor: 'text-amber-400 fill-amber-400',
      mainValue: '5',
      hindiTitle: '5 • औसत रेटिंग',
      englishLabel: 'Average Rating',
    },
    {
      icon: MapPin,
      iconColor: 'text-[#1264D6]',
      mainValue: dynamicCityCount,
      hindiTitle: 'शहर • पूरे भारत में',
      englishLabel: 'Cities • Across India',
    },
  ];

  return (
    <section className="py-8 sm:py-10 bg-[#EAF5FF] border-y border-blue-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          {/* Left: 4 Metric Cards */}
          <div className="lg:col-span-8 grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-6">
            {metrics.map((m, idx) => {
              const Icon = m.icon;
              return (
                <div
                  key={idx}
                  className="flex items-center gap-2.5 sm:gap-3 p-3 sm:p-0 bg-white/70 sm:bg-transparent rounded-2xl sm:rounded-none border sm:border-0 border-blue-100/80 shadow-2xs sm:shadow-none"
                >
                  <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-white text-[#1264D6] shadow-xs flex items-center justify-center shrink-0 border border-blue-50">
                    <Icon className={`w-5 h-5 sm:w-6 sm:h-6 ${m.iconColor}`} />
                  </div>
                  <div className="min-w-0">
                    {/* Big Value */}
                    <div className="text-base sm:text-xl font-black text-[#082B66] tracking-tight leading-tight">
                      {m.mainValue}
                    </div>
                    {/* Hindi Line FIRST */}
                    <div className="text-xs sm:text-xs font-bold text-[#082B66] font-devanagari leading-tight mt-0.5 truncate">
                      {m.hindiTitle}
                    </div>
                    {/* English Line SECOND */}
                    <div className="text-[11px] sm:text-[10px] text-slate-500 font-semibold font-sans leading-tight truncate">
                      {m.englishLabel}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right: Signature Brand Slogan */}
          <div className="lg:col-span-4 text-center lg:text-right pt-4 lg:pt-0 border-t lg:border-t-0 border-blue-200/60">
            <p className="text-base sm:text-xl font-black italic text-[#082B66] tracking-tight leading-tight">
              <span className="font-devanagari not-italic block text-sm sm:text-base font-bold mb-0.5 text-[#082B66]">
                “हर कामगार महत्वपूर्ण है — एक मजबूत कल”
              </span>
              “Every Worker Matters <br />
              <span className="text-[#1264D6]">A Stronger Tomorrow”</span>
            </p>
            <div className="w-20 sm:w-24 h-1 bg-red-500 rounded-full mx-auto lg:ml-auto lg:mr-0 mt-2" />
          </div>
        </div>
      </div>
    </section>
  );
}
