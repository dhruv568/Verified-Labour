'use client';

import React from 'react';
import Image from 'next/image';
import {
  Search,
  ClipboardList,
  UserCheck,
  CheckCircle2,
  Star,
  ShieldCheck,
  Phone,
  MessageSquare,
  Zap,
  Navigation,
  Sparkles,
} from 'lucide-react';

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
      desc: 'Get confirmation and connect via call or chat.',
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
    <section id="how" className="py-14 sm:py-20 bg-[#F7F9FC] border-b border-slate-200 overflow-hidden relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="mb-10 sm:mb-14 text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 text-[#1264D6] rounded-full text-xs font-black border border-blue-200/80 mb-2 font-devanagari">
            <Sparkles className="w-3.5 h-3.5 text-[#1264D6]" />
            <span>सरल और पारदर्शी प्रक्रिया</span>
          </div>

          <h2 className="text-2xl sm:text-4xl font-black text-[#082B66] tracking-tight flex flex-wrap items-baseline gap-2 sm:gap-3">
            <span className="font-devanagari">यह कैसे काम करता है?</span>
            <span className="text-lg sm:text-2xl text-slate-500 font-bold">
              How It Works
            </span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
            <span className="font-devanagari font-bold text-[#079447]">30s में बुक करें</span> • Book in 30s
          </p>
        </div>

        {/* Content Grid: 4 Steps on Left, Polished Phone Illustration on Right */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
          
          {/* Left Column: 4 Steps Cards */}
          <div className="lg:col-span-7">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5 relative">
              {steps.map((step, idx) => {
                const Icon = step.icon;
                return (
                  <div
                    key={step.num}
                    className="flex flex-col justify-between p-5 bg-white rounded-2xl border border-slate-200/90 shadow-2xs hover:shadow-md hover:border-blue-200 transition-all group duration-200"
                  >
                    <div>
                      {/* Step Number Badge + Icon Header */}
                      <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 rounded-2xl bg-[#EAF5FF] text-[#1264D6] flex items-center justify-center shrink-0 shadow-2xs border border-blue-100 group-hover:bg-[#1264D6] group-hover:text-white transition-colors duration-200">
                          <Icon className="w-6 h-6 stroke-[2.2]" />
                        </div>
                        <span className="w-7 h-7 rounded-full bg-slate-100 text-[#082B66] text-xs font-black flex items-center justify-center border border-slate-200">
                          0{step.num}
                        </span>
                      </div>

                      {/* Titles */}
                      <div className="space-y-0.5 mb-2">
                        <h3 className="font-black text-base text-[#082B66] tracking-tight font-devanagari">
                          {step.hindiTitle}
                        </h3>
                        <span className="text-xs text-[#1264D6] font-bold font-sans block">
                          {step.title}
                        </span>
                      </div>

                      {/* Description */}
                      <p className="text-xs text-slate-500 leading-relaxed font-normal">
                        {step.desc}
                      </p>
                    </div>

                    {/* Bottom Progress Bar Indicator */}
                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] font-bold text-slate-400">
                      <span>Step 0{step.num} of 04</span>
                      <div className="w-12 h-1 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[#1264D6] rounded-full"
                          style={{ width: `${(step.num / 4) * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: Premium Realistic Smartphone Illustration */}
          <div className="lg:col-span-5 flex flex-col items-center justify-center relative pt-4 lg:pt-0">
            
            {/* Elevated Container with Subtle Floating Motion */}
            <div className="relative group">

              {/* Tagline Callout Above/Beside Phone */}
              <div className="absolute -top-10 sm:-top-12 right-0 sm:-right-6 z-30 transform rotate-3 sm:rotate-6 bg-white/95 backdrop-blur-md px-3.5 py-2 rounded-2xl border border-blue-200 shadow-lg flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-[#1264D6] text-white flex items-center justify-center text-xs shrink-0 shadow-2xs">
                  ✨
                </div>
                <div className="text-left leading-tight">
                  <span className="block text-xs font-black text-[#082B66] font-devanagari">
                    मदद बस एक टैप दूर!
                  </span>
                  <span className="block text-[10px] font-bold text-[#1264D6]">
                    Help is Just a Tap Away!
                  </span>
                </div>
              </div>

              {/* Realistic Premium Smartphone Frame */}
              <div className="relative w-64 sm:w-72 md:w-80 bg-[#051329] rounded-[44px] sm:rounded-[50px] p-3 sm:p-3.5 shadow-[0_25px_60px_-15px_rgba(8,43,102,0.35)] border-2 border-slate-700/60 transition-transform duration-300">
                
                {/* Side Buttons (Realistic Smartphone Frame Details) */}
                <div className="absolute -left-[5px] top-24 w-[3px] h-8 bg-slate-700 rounded-l-sm" />
                <div className="absolute -left-[5px] top-36 w-[3px] h-10 bg-slate-700 rounded-l-sm" />
                <div className="absolute -left-[5px] top-48 w-[3px] h-10 bg-slate-700 rounded-l-sm" />
                <div className="absolute -right-[5px] top-32 w-[3px] h-14 bg-slate-700 rounded-r-sm" />

                {/* Top Speaker / Dynamic Notch */}
                <div className="w-24 h-4 bg-[#082B66] rounded-full mx-auto mb-2 relative flex items-center justify-between px-2.5 z-20">
                  <div className="w-2.5 h-2.5 rounded-full bg-slate-900 border border-slate-700 flex items-center justify-center">
                    <div className="w-1 h-1 rounded-full bg-blue-900" />
                  </div>
                  <div className="w-8 h-1 bg-slate-800 rounded-full" />
                </div>

                {/* Smartphone Screen Canvas */}
                <div className="bg-[#F1F5F9] rounded-[32px] sm:rounded-[38px] overflow-hidden relative h-[420px] sm:h-[470px] flex flex-col justify-between border border-slate-300/80 shadow-inner font-sans">
                  
                  {/* Status Bar */}
                  <div className="px-5 pt-2 pb-1 flex items-center justify-between text-[10px] font-black text-slate-700 relative z-20 bg-white/70 backdrop-blur-xs">
                    <span>09:41</span>
                    <div className="flex items-center gap-1.5 text-slate-700">
                      <span className="text-[9px]">5G</span>
                      <div className="w-3.5 h-2 border border-slate-700 rounded-2xs p-0.5 flex items-center">
                        <div className="w-full h-full bg-slate-700 rounded-3xs" />
                      </div>
                    </div>
                  </div>

                  {/* App Header Bar */}
                  <div className="px-3.5 py-1.5 bg-white border-b border-slate-200/80 flex items-center justify-between relative z-20 shadow-2xs">
                    <div className="flex items-center gap-1.5">
                      <div className="w-5 h-5 rounded-md bg-[#1264D6] text-white flex items-center justify-center text-[10px] font-black">
                        VL
                      </div>
                      <span className="text-xs font-black text-[#082B66] font-devanagari">
                        Verified Labour
                      </span>
                    </div>
                    <span className="px-2 py-0.5 bg-emerald-50 text-[#079447] text-[9px] font-black rounded-full border border-emerald-200 font-devanagari">
                      • लाइव ट्रैकिंग
                    </span>
                  </div>

                  {/* Detailed Vector Map Background */}
                  <div className="absolute inset-0 top-12 z-0 bg-[#E8EEF5]">
                    <svg className="w-full h-full" viewBox="0 0 280 400" preserveAspectRatio="xMidYMid slice">
                      {/* Park / Green Land Areas */}
                      <path d="M 10 20 C 40 10 90 30 110 80 C 130 130 80 180 30 160 Z" fill="#DCFCE7" opacity="0.8" />
                      <path d="M 180 220 C 220 200 270 240 260 310 C 240 370 170 350 160 300 Z" fill="#D1FAE5" opacity="0.7" />
                      
                      {/* River / Water Body */}
                      <path d="M 0 320 C 80 300 120 380 280 360 L 280 400 L 0 400 Z" fill="#DBEAFE" opacity="0.6" />

                      {/* City Building Blocks */}
                      <rect x="25" y="100" width="30" height="25" rx="4" fill="#E2E8F0" opacity="0.8" />
                      <rect x="65" y="110" width="25" height="35" rx="4" fill="#E2E8F0" opacity="0.8" />
                      <rect x="160" y="40" width="40" height="30" rx="4" fill="#E2E8F0" opacity="0.8" />
                      <rect x="215" y="50" width="30" height="45" rx="4" fill="#E2E8F0" opacity="0.8" />
                      <rect x="180" y="140" width="50" height="30" rx="4" fill="#E2E8F0" opacity="0.8" />
                      <rect x="30" y="220" width="40" height="30" rx="4" fill="#E2E8F0" opacity="0.8" />

                      {/* Road Network Lines */}
                      <path d="M -10 170 Q 140 160 290 180" fill="none" stroke="#FFFFFF" strokeWidth="14" />
                      <path d="M -10 170 Q 140 160 290 180" fill="none" stroke="#CBD5E1" strokeWidth="6" />

                      <path d="M 120 -10 L 120 410" fill="none" stroke="#FFFFFF" strokeWidth="12" />
                      <path d="M 120 -10 L 120 410" fill="none" stroke="#CBD5E1" strokeWidth="5" />

                      <path d="M 40 -10 L 40 280" fill="none" stroke="#FFFFFF" strokeWidth="10" />
                      <path d="M 40 -10 L 40 280" fill="none" stroke="#E2E8F0" strokeWidth="4" />

                      <path d="M 210 0 L 210 320" fill="none" stroke="#FFFFFF" strokeWidth="10" />
                      <path d="M 210 0 L 210 320" fill="none" stroke="#E2E8F0" strokeWidth="4" />

                      {/* Active Navigation Route Path (Connecting User to Worker) */}
                      {/* Start: (55, 230) -> End: (195, 85) */}
                      <path
                        d="M 55 230 L 120 230 L 120 170 L 195 170 L 195 85"
                        fill="none"
                        stroke="#1264D6"
                        strokeWidth="5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeDasharray="8 5"
                        className="animate-pulse"
                      />
                    </svg>

                    {/* STARTING LOCATION (USER PIN) */}
                    <div className="absolute left-[40px] top-[212px] z-10 flex flex-col items-center">
                      <div className="relative flex items-center justify-center">
                        <div className="w-7 h-7 rounded-full bg-[#1264D6]/30 animate-ping absolute" />
                        <div className="w-4 h-4 rounded-full bg-[#1264D6] border-2 border-white shadow-md flex items-center justify-center">
                          <div className="w-1.5 h-1.5 rounded-full bg-white" />
                        </div>
                      </div>
                      <span className="px-1.5 py-0.5 bg-white text-[#082B66] text-[8px] font-black rounded-md shadow-xs border border-slate-200 font-devanagari mt-1 whitespace-nowrap">
                        आपका स्थान
                      </span>
                    </div>

                    {/* DESTINATION (WORKER LOCATION MARKER PIN) */}
                    <div className="absolute right-[62px] top-[60px] z-10 flex flex-col items-center animate-bounce duration-1000">
                      <div className="relative">
                        {/* Premium Verified Labour Destination Marker */}
                        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#079447] to-[#059669] text-white p-0.5 shadow-lg border-2 border-white flex items-center justify-center">
                          <div className="w-full h-full rounded-full bg-white text-[#079447] flex items-center justify-center font-black text-xs">
                            <Zap className="w-5 h-5 fill-[#079447] stroke-[2]" />
                          </div>
                        </div>
                        {/* Green Verification Check Badge overlay */}
                        <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#079447] text-white border border-white flex items-center justify-center">
                          <CheckCircle2 className="w-3 h-3 fill-white text-[#079447]" />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* FLOATING WORKER INFORMATION CARD (Rakesh - Electrician) */}
                  <div className="relative z-10 m-2.5 bg-white/98 backdrop-blur-md rounded-2xl p-3 shadow-xl border border-slate-200/90 space-y-2">
                    {/* Worker Header Info */}
                    <div className="flex items-center gap-2.5">
                      {/* Worker Profile Avatar with Green Ring */}
                      <div className="relative w-11 h-11 rounded-full overflow-hidden shrink-0 border-2 border-[#079447] shadow-xs">
                        <Image
                          src="/images/home/worker-rakesh-avatar.jpg"
                          alt="Rakesh (Electrician)"
                          fill
                          className="object-cover object-center"
                          sizes="44px"
                        />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-1">
                          <div className="flex items-center gap-1.5">
                            <span className="font-black text-xs text-[#082B66] truncate font-sans">
                              Rakesh
                            </span>
                            <span className="px-1.5 py-0.2 bg-emerald-50 text-[#079447] text-[9px] font-black rounded-md border border-emerald-200 flex items-center gap-0.5 font-devanagari">
                              <ShieldCheck className="w-2.5 h-2.5 stroke-[3]" />
                              <span>सत्यापित</span>
                            </span>
                          </div>
                          
                          {/* Rating */}
                          <div className="flex items-center gap-0.5 text-[10px] font-extrabold text-slate-700 bg-amber-50 px-1.5 py-0.5 rounded-md border border-amber-200/80 shrink-0">
                            <Star className="w-3 h-3 fill-amber-400 text-amber-500" />
                            <span>5.0</span>
                            <span className="text-[9px] text-slate-400 font-normal">(120)</span>
                          </div>
                        </div>

                        <p className="text-[11px] text-slate-600 font-bold font-devanagari mt-0.5">
                          इलेक्ट्रीशियन <span className="text-[10px] text-slate-400 font-normal">/ Electrician</span>
                        </p>
                      </div>
                    </div>

                    {/* ETA Pill Badge */}
                    <div className="bg-emerald-50/90 text-[#079447] px-2.5 py-1.5 rounded-xl border border-emerald-200/80 flex items-center justify-between text-[11px] font-black font-devanagari">
                      <div className="flex items-center gap-1.5">
                        <Zap className="w-3.5 h-3.5 fill-[#079447] stroke-none animate-pulse" />
                        <span>5 मिनट में पहुँच रहे हैं</span>
                      </div>
                      <span className="text-[9px] text-emerald-800 font-extrabold bg-white/80 px-1.5 py-0.5 rounded-md border border-emerald-200">
                        Arriving in 5 mins
                      </span>
                    </div>

                    {/* Quick Call & Message Buttons */}
                    <div className="grid grid-cols-2 gap-1.5 pt-0.5">
                      <div className="py-1.5 px-2 bg-[#1264D6] text-white rounded-xl font-bold text-[10px] flex items-center justify-center gap-1 shadow-2xs font-devanagari">
                        <Phone className="w-3 h-3 fill-white stroke-none" />
                        <span>कॉल करें</span>
                      </div>

                      <div className="py-1.5 px-2 bg-slate-100 text-slate-700 rounded-xl font-bold text-[10px] flex items-center justify-center gap-1 border border-slate-200 font-devanagari">
                        <MessageSquare className="w-3 h-3" />
                        <span>मैसेज</span>
                      </div>
                    </div>
                  </div>

                  {/* Phone Home Bar Indicator */}
                  <div className="w-24 h-1 bg-slate-400/60 rounded-full mx-auto my-1 relative z-20" />
                </div>
              </div>

              {/* Realistic Soft Shadow Underneath Phone */}
              <div className="w-48 sm:w-56 h-4 bg-slate-900/15 rounded-full blur-xl mx-auto mt-3" />
            </div>

          </div>

        </div>
      </div>
    </section>
  );
}
