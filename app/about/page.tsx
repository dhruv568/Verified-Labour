'use client';

import React from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useLanguage } from '@/context/LanguageContext';
import { ShieldCheck, Users, CheckCircle2, Award, Building2, HeartHandshake } from 'lucide-react';

export default function AboutPage() {
  const { isHindi } = useLanguage();

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-[#082B66]">
      <Navbar />

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
        {/* Hero Section */}
        <div className="bg-gradient-to-r from-[#082B66] via-[#0F3880] to-[#1264D6] rounded-3xl p-6 sm:p-12 text-white shadow-xl text-center space-y-4">
          <span className="px-3 py-1 bg-amber-400 text-[#082B66] font-black text-xs rounded-full uppercase font-devanagari">
            {isHindi ? 'हमारे बारे में' : 'About Verified Labour'}
          </span>
          <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight">
            {isHindi ? 'भारत का भरोसेमंद ऑन-डिमांड लेबर प्लेटफ़ॉर्म' : "India's Trusted On-Demand Labour Marketplace"}
          </h1>
          <p className="text-sm sm:text-base text-blue-100 max-w-3xl mx-auto leading-relaxed font-medium font-devanagari">
            {isHindi
              ? 'वेरिफाइड लेबर का उद्देश्य भारत के असंगठित कामगार क्षेत्र को पारदर्शी, सुरक्षित और तकनीक-आधारित पहचान देना है।'
              : 'Empowering India’s skilled workforce through transparent Aadhaar KYC verification, bank account validation, and instant on-demand local bookings.'}
          </p>
        </div>

        {/* Core Values */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-[#079447] flex items-center justify-center font-bold">
              <ShieldCheck className="w-6 h-6 stroke-[2.5]" />
            </div>
            <h3 className="text-lg font-black text-[#082B66]">
              {isHindi ? '100% सत्यापन' : '100% Verification'}
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed font-devanagari">
              {isHindi
                ? 'हर कामगार का कैशफ्री द्वारा आधार पहचान सत्यापन और बैंक खाता Penny Drop चेक पूरा किया जाता है।'
                : 'Every worker profile undergoes strict Cashfree Aadhaar identity checks and bank account validation before taking jobs.'}
            </p>
          </div>

          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#1264D6] flex items-center justify-center font-bold">
              <Users className="w-6 h-6 stroke-[2.5]" />
            </div>
            <h3 className="text-lg font-black text-[#082B66]">
              {isHindi ? 'सीधा संपर्क और सम्मान' : 'Direct Fair Opportunities'}
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed font-devanagari">
              {isHindi
                ? 'बिना किसी बिचौलिए के ग्राहकों को सीधे हुनरमंद कामगारों से जोड़ना और पारदर्शी रेट देना।'
                : 'Eliminating exploitation by connecting customers directly with skilled craftsmen at fair, standardized rates.'}
            </p>
          </div>

          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
              <HeartHandshake className="w-6 h-6 stroke-[2.5]" />
            </div>
            <h3 className="text-lg font-black text-[#082B66]">
              {isHindi ? 'सुरक्षित भुगतान' : 'Escrow Protected Payments'}
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed font-devanagari">
              {isHindi
                ? 'काम पूरा होने के बाद ही सुरक्षित भुगतान प्रक्रिया और रेटिंग की सुविधा।'
                : 'Hassle-free UPI, Card, and Cash payment options backed by platform dispute resolution.'}
            </p>
          </div>
        </div>

        {/* Company Overview */}
        <div className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200 shadow-xs space-y-4">
          <h2 className="text-xl sm:text-2xl font-black text-[#082B66]">
            {isHindi ? 'हमारी कहानी और मिशन' : 'Our Mission & Commitment'}
          </h2>
          <div className="text-xs sm:text-sm text-slate-600 leading-relaxed space-y-3">
            <p>
              {isHindi
                ? 'Shrivastava ProFunnels Ventures Pvt Ltd द्वारा संचालित Verified Labour भारत में स्थानीय प्लंबर, इलेक्ट्रीशियन, पेंटर, कारपेंटर, कुक, और सफाईकर्मियों के लिए एक प्रामाणिक डिजिटल मंच प्रदान करता है।'
                : 'Operated under Shrivastava ProFunnels Ventures Pvt Ltd, Verified Labour bridges the gap between household/commercial requirements and trusted local craftsmen.'}
            </p>
            <p>
              {isHindi
                ? 'हमारा उद्देश्य पूरे भारत के हर शहर और कस्बे में विश्वसनीय सेवाएं पहुँचाना है, जहाँ कामगारों को सही सम्मान और ग्राहकों को 100% सुरक्षा मिले।'
                : 'With coverage across India, our platform guarantees safety, prompt availability, and digitized attendance tracking for both retail customers and bulk construction contracts.'}
            </p>
          </div>

          <div className="pt-4 flex flex-wrap gap-4">
            <Link
              href="/workers"
              className="px-6 py-3 bg-[#079447] hover:bg-[#067c3b] text-white font-black text-xs sm:text-sm rounded-full shadow-md transition-all font-devanagari"
            >
              {isHindi ? 'कामगार खोजें →' : 'Find a Worker →'}
            </Link>
            <Link
              href="/worker/onboarding"
              className="px-6 py-3 bg-[#1264D6] hover:bg-blue-700 text-white font-black text-xs sm:text-sm rounded-full shadow-md transition-all font-devanagari"
            >
              {isHindi ? 'कामगार के रूप में जुड़ें →' : 'Become a Verified Worker →'}
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
