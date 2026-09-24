'use client';

import React from 'react';
import Image from 'next/image';
import { Search, ClipboardList, UserCheck, CheckCircle2, Star } from 'lucide-react';

export default function HowItWorks() {
  const steps = [
    {
      num: 1,
      title: 'Search / Select',
      hindiTitle: 'खोजें और चुनें',
      desc: 'Choose the service you need and enter your location.',
      icon: Search,
    },
    {
      num: 2,
      title: 'Find & Book',
      hindiTitle: 'कामगार चुनें',
      desc: 'See nearby verified workers and tap to request.',
      icon: ClipboardList,
    },
    {
      num: 3,
      title: 'Worker Accepts',
      hindiTitle: 'कामगार जुड़ेगा',
      desc: 'Get confirmation and connect (call/chat).',
      icon: UserCheck,
    },
    {
      num: 4,
      title: 'Job Done',
      hindiTitle: 'काम पूरा और भुगतान',
      desc: 'Rate the service and make a safe payment.',
      icon: CheckCircle2,
    },
  ];

  return (
    <section id="how" className="py-14 sm:py-18 bg-[#F7F9FC] border-b border-slate-200 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="mb-10 sm:mb-12">
          <h2 className="text-2xl sm:text-3xl font-black text-[#082B66] tracking-tight flex flex-wrap items-baseline gap-2 sm:gap-3">
            <span>How It Works</span>
            <span className="text-lg sm:text-2xl text-slate-500 font-bold font-devanagari">
              यह कैसे काम करता है
            </span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
            Get the help you need in just a few simple steps • कुछ ही आसान चरणों में सेवा पाएं
          </p>
        </div>

        {/* Content Grid: 4 Steps on Left, Phone Mockup on Right */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          {/* Left Column: 4 Steps */}
          <div className="lg:col-span-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 sm:gap-4 relative">
              {steps.map((step, idx) => {
                const Icon = step.icon;
                return (
                  <div
                    key={step.num}
                    className="flex flex-col items-center sm:items-start text-center sm:text-left relative sm:pr-4"
                  >
                    {/* Step Icon in Light Blue Circle */}
                    <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-[#EAF5FF] text-[#1264D6] flex items-center justify-center mb-3 shadow-2xs border border-blue-100">
                      <Icon className="w-7 h-7 sm:w-8 sm:h-8 stroke-[2]" />
                    </div>

                    {/* Step Number + Title */}
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span className="w-5 h-5 rounded-full bg-[#1264D6] text-white text-[11px] font-bold flex items-center justify-center shrink-0">
                        {step.num}
                      </span>
                      <h3 className="font-bold text-sm sm:text-base text-[#082B66] tracking-tight">
                        {step.title}
                      </h3>
                    </div>
                    <span className="text-[11px] text-blue-600 font-medium font-devanagari mb-1">
                      {step.hindiTitle}
                    </span>

                    {/* Description */}
                    <p className="text-xs text-slate-500 leading-relaxed font-normal">
                      {step.desc}
                    </p>

                    {/* Vertical Divider for Desktop between steps */}
                    {idx < steps.length - 1 && (
                      <div className="hidden md:block absolute right-0 top-4 bottom-4 w-px bg-slate-200" />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: Phone Mockup with Map Route & Floating Worker Card */}
          <div className="lg:col-span-4 flex items-center justify-center relative">
            <div className="relative">
              {/* Phone Device Frame */}
              <div className="w-56 sm:w-64 bg-slate-900 rounded-[36px] p-3 shadow-2xl border-4 border-slate-800">
                {/* Speaker Notch */}
                <div className="w-20 h-3 bg-slate-800 rounded-full mx-auto mb-2" />

                {/* Inner Screen */}
                <div className="bg-slate-100 rounded-[26px] overflow-hidden p-3 relative h-72 flex flex-col justify-between border border-slate-200">
                  {/* Mock Map Background with road route */}
                  <div className="absolute inset-0 bg-[#E2E8F0]">
                    <svg className="w-full h-full opacity-40" viewBox="0 0 100 100" preserveAspectRatio="none">
                      <path d="M 10 20 Q 40 40 90 20" fill="none" stroke="#94A3B8" strokeWidth="6" />
                      <path d="M 30 100 L 30 10" fill="none" stroke="#94A3B8" strokeWidth="6" />
                      <path d="M 20 80 Q 50 50 80 20" fill="none" stroke="#1264D6" strokeWidth="4" strokeDasharray="3 2" />
                    </svg>
                  </div>

                  {/* Destination Pin */}
                  <div className="relative z-10 self-end mr-2 mt-4 bg-white p-1.5 rounded-full shadow-md border border-slate-200">
                    <div className="w-6 h-6 rounded-full bg-[#079447] text-white flex items-center justify-center text-xs">
                      🏠
                    </div>
                  </div>

                  {/* Floating Arrival Card with Real Worker Headshot */}
                  <div className="relative z-10 bg-white rounded-xl p-3 shadow-lg border border-slate-200 space-y-1">
                    <div className="flex items-center gap-2.5">
                      <div className="relative w-10 h-10 rounded-full overflow-hidden shrink-0 border border-slate-200 shadow-2xs">
                        <Image
                          src="/images/home/worker-rakesh-avatar.jpg"
                          alt="Rakesh (Electrician)"
                          fill
                          className="object-cover object-center"
                          sizes="40px"
                        />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1">
                          <span className="font-bold text-xs text-[#082B66] truncate">
                            Rakesh (Electrician)
                          </span>
                        </div>
                        <p className="text-[10px] text-[#079447] font-bold">
                          Arriving in 5 mins
                        </p>
                        <div className="flex items-center gap-1 text-[9px] text-slate-500">
                          <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
                          <span>4.8 (120 jobs)</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Home Indicator */}
                <div className="w-20 h-1 bg-slate-700 rounded-full mx-auto mt-2" />
              </div>

              {/* Playful Tagline next to phone matching Reference */}
              <div className="absolute -right-4 sm:-right-8 top-1/2 -translate-y-1/2 rotate-12 sm:rotate-6 pointer-events-none">
                <span className="text-base sm:text-lg font-black text-[#1264D6] tracking-tight whitespace-nowrap drop-shadow-xs italic">
                  Help is Just
                  <br />
                  a Tap Away! ✨
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
