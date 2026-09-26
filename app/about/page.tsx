'use client';

import React from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useLanguage } from '@/context/LanguageContext';
import { useContent } from '@/context/ContentContext';
import {
  ShieldCheck,
  Users,
  CheckCircle2,
  Clock,
  Sparkles,
  Search,
  MapPin,
  UserCheck,
  CalendarCheck,
  ArrowRight,
  HeartHandshake,
  Award,
} from 'lucide-react';

export default function AboutPage() {
  const { isHindi } = useLanguage();
  const { content } = useContent();

  const heroTitle = content.about_title || (isHindi ? 'हमारे बारे में / About Us' : 'About Us / हमारे बारे में');
  const heroSubtitle = content.about_subtitle || (isHindi ? 'भारत का भरोसेमंद ऑन-डिमांड लेबर प्लेटफ़ॉर्म' : "India's Trusted On-Demand Labour Marketplace");
  const introText = content.about_content || (isHindi
    ? 'Verified Labour लोगों को भरोसेमंद, सत्यापित और कुशल सेवा पेशेवरों से जोड़ने के लिए बनाया गया है।'
    : 'Verified Labour connects households and businesses with Aadhaar KYC verified and bank validated local skilled professionals.');

  const purposeText = content.about_purpose || (isHindi
    ? 'हमारा उद्देश्य इलेक्ट्रीशियन, प्लंबर, कारपेंटर, कुक, सफाईकर्मी, मैकेनिक और केयरटेकर जैसे हुनरमंद कामगारों को सीधे ग्राहकों से जोड़ना और पारदर्शिता प्रदान करना है।'
    : 'Our purpose is to connect customers directly with skilled professionals—electricians, plumbers, carpenters, cooks, cleaners, mechanics, and caretakers.');

  const visionText = content.about_vision || (isHindi
    ? 'पूरे भारत के हर शहर और कस्बे में विश्वसनीय सेवाएं पहुँचाना, जहाँ कामगारों को सही सम्मान और ग्राहकों को 100% सुरक्षा मिले।'
    : 'Building India\'s most accessible local workforce network, empowering skilled craftsmen with dignified opportunities and ensuring 100% safety for households.');

  const ctaText = content.about_cta_text || (isHindi ? '30s में बुक करें / Book in 30s' : 'Book in 30s / 30s में बुक करें');
  const ctaLink = content.about_cta_link || '/workers';

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-[#082B66]">
      <Navbar />

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
        {/* 1. HERO SECTION */}
        <div className="bg-gradient-to-r from-[#082B66] via-[#0F3880] to-[#1264D6] rounded-3xl p-6 sm:p-12 text-white shadow-xl text-center space-y-4">
          <span className="px-3.5 py-1 bg-amber-400 text-[#082B66] font-black text-xs rounded-full uppercase font-devanagari tracking-wider inline-block">
            {isHindi ? 'हमारे बारे में / About Us' : 'About Us / हमारे बारे में'}
          </span>
          <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight font-devanagari">
            {heroTitle}
          </h1>
          <p className="text-base sm:text-lg text-amber-300 font-bold font-devanagari max-w-2xl mx-auto">
            {heroSubtitle}
          </p>
          <p className="text-sm sm:text-base text-blue-100 max-w-3xl mx-auto leading-relaxed font-medium font-devanagari">
            {introText}
          </p>
        </div>

        {/* 2. OUR PURPOSE */}
        <div className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200 shadow-xs space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-[#079447] border border-emerald-200">
            <Sparkles className="w-3.5 h-3.5 text-[#079447]" />
            <span className="font-devanagari">हमारा उद्देश्य / Our Purpose</span>
          </div>
          <h2 className="text-xl sm:text-3xl font-black text-[#082B66] font-devanagari">
            {isHindi ? 'कुशल और भरोसेमंद कामगार आसानी से पाएं' : 'Connecting You with Trusted Skilled Professionals'}
          </h2>
          <p className="text-sm text-slate-600 leading-relaxed font-devanagari">
            {purposeText}
          </p>
          <div className="grid grid-cols-2 min-[440px]:grid-cols-4 gap-2.5 pt-2">
            {[
              { label: 'इलेक्ट्रीशियन / Electrician' },
              { label: 'प्लंबर / Plumber' },
              { label: 'बढ़ई / Carpenter' },
              { label: 'रसोइया / Cook' },
              { label: 'सफाईकर्मी / Cleaner' },
              { label: 'मैकेनिक / Mechanic' },
              { label: 'केयरटेकर / Caretaker' },
              { label: 'अन्य सेवाएं / Other Services' },
            ].map((item, idx) => (
              <div key={idx} className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/80 text-center font-bold text-xs text-[#082B66] font-devanagari">
                {item.label}
              </div>
            ))}
          </div>
        </div>

        {/* 3. WHY VERIFIED LABOUR (4 FEATURE CARDS) */}
        <div className="space-y-4">
          <h2 className="text-xl sm:text-2xl font-black text-[#082B66] text-center font-devanagari">
            {isHindi ? 'वेरिफाइड लेबर ही क्यों? / Why Verified Labour' : 'Why Choose Verified Labour'}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-2">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-[#079447] flex items-center justify-center font-bold">
                <ShieldCheck className="w-5 h-5 stroke-[2.5]" />
              </div>
              <h3 className="text-base font-black text-[#082B66] font-devanagari">
                सत्यापित लोग / Verified People
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed font-devanagari">
                {isHindi
                  ? 'कैशफ्री द्वारा आधार पहचान सत्यापन एवं बैंक खाता चेक पूरा।'
                  : 'Aadhaar identity KYC and bank account validation.'}
              </p>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-2">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#1264D6] flex items-center justify-center font-bold">
                <MapPin className="w-5 h-5 stroke-[2.5]" />
              </div>
              <h3 className="text-base font-black text-[#082B66] font-devanagari">
                नज़दीकी सेवा / Nearby Service
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed font-devanagari">
                {isHindi
                  ? 'आपके क्षेत्र में उपलब्ध पास के कामगार तुरंत खोजें।'
                  : 'Find local craftsmen near your exact locality.'}
              </p>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-2">
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                <Clock className="w-5 h-5 stroke-[2.5]" />
              </div>
              <h3 className="text-base font-black text-[#082B66] font-devanagari">
                तेज़ बुकिंग / Quick Booking
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed font-devanagari">
                {isHindi
                  ? 'मात्र 30 सेकंड में अपनी सेवा और समय चुनें।'
                  : 'Book verified skilled professionals in under 30 seconds.'}
              </p>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-2">
              <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
                <HeartHandshake className="w-5 h-5 stroke-[2.5]" />
              </div>
              <h3 className="text-base font-black text-[#082B66] font-devanagari">
                सुरक्षित अनुभव / Safe Experience
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed font-devanagari">
                {isHindi
                  ? 'पारदर्शी रेट, रेटिंग प्रणाली और सुरक्षित भुगतान।'
                  : 'Transparent rates, ratings, and resolution support.'}
              </p>
            </div>
          </div>
        </div>

        {/* 4. HOW IT WORKS (SIMPLE FLOW) */}
        <div className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200 shadow-xs space-y-6">
          <h2 className="text-xl sm:text-2xl font-black text-[#082B66] font-devanagari">
            {isHindi ? 'यह कैसे काम करता है? / How It Works' : 'How It Works'}
          </h2>

          <div className="grid grid-cols-1 min-[460px]:grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { step: '1', title: 'सेवा चुनें / Select Service', icon: Search },
              { step: '2', title: 'स्थान चुनें / Choose Location', icon: MapPin },
              { step: '3', title: 'कामगार चुनें / Choose Worker', icon: UserCheck },
              { step: '4', title: 'बुक करें / Book Service', icon: CalendarCheck },
            ].map((s) => {
              const Icon = s.icon;
              return (
                <div key={s.step} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-center space-y-2">
                  <div className="w-10 h-10 rounded-full bg-[#1264D6] text-white flex items-center justify-center mx-auto font-black text-sm">
                    {s.step}
                  </div>
                  <h4 className="font-bold text-xs text-[#082B66] font-devanagari">{s.title}</h4>
                </div>
              );
            })}
          </div>
        </div>

        {/* 5. OUR VISION */}
        <div className="bg-gradient-to-r from-emerald-900 to-[#082B66] rounded-3xl p-6 sm:p-10 text-white shadow-md space-y-3">
          <h2 className="text-xl sm:text-2xl font-black text-amber-300 font-devanagari">
            {isHindi ? 'हमारा विज़न / Our Vision' : 'Our Vision'}
          </h2>
          <p className="text-sm leading-relaxed text-slate-100 font-medium font-devanagari">
            {visionText}
          </p>
        </div>

        {/* 6. CTA SECTION */}
        <div className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200 shadow-xs text-center space-y-4">
          <h2 className="text-xl sm:text-3xl font-black text-[#082B66] font-devanagari">
            {isHindi ? 'आज ही सत्यापित कामगार खोजें' : 'Ready to Book a Verified Worker?'}
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 font-devanagari">
            {isHindi ? '30 सेकंड में अपने पास का कुशल कामगार बुक करें' : 'Get instant help from verified skilled craftsmen nearby'}
          </p>
          <div className="pt-2">
            <Link
              href={ctaLink}
              className="inline-flex items-center gap-2 px-8 py-3.5 bg-[#079447] hover:bg-[#067c3b] text-white font-black text-sm sm:text-base rounded-full shadow-lg active:scale-95 transition-all font-devanagari"
            >
              <span>{ctaText}</span>
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
