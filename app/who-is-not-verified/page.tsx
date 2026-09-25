'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import Header from '@/components/home/Header';
import Footer from '@/components/Footer';
import AuthModal from '@/components/AuthModal';
import {
  ArrowLeft,
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  HardHat,
  Users,
  Award,
  HelpCircle,
  Sparkles,
  ChevronRight,
  AlertTriangle,
  UserX,
  UserCheck,
  FileSpreadsheet,
  Lock,
} from 'lucide-react';

export default function WhoIsNotVerifiedPage() {
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register'>('register');

  const handleOpenWorkerRegister = () => {
    setAuthModalMode('register');
    setAuthModalOpen(true);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-[#09265C] font-sans antialiased selection:bg-[#1264D6] selection:text-white">
      {/* 1. Header */}
      <Header onOpenAuth={() => setAuthModalOpen(true)} />

      {/* Top Banner Navigation bar */}
      <div className="bg-[#041A40] text-white py-2.5 px-4 border-b border-blue-900/60 shadow-xs">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-blue-200 hover:text-white transition-colors bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-xl border border-white/10 active:scale-95"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Verified Labour</span>
          </Link>

          <span className="text-[11px] sm:text-xs font-semibold text-emerald-400 font-devanagari flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>100% आधार & सुरक्षा जांच नीतियां</span>
          </span>
        </div>
      </div>

      <main className="flex-1">
        {/* HERO SECTION */}
        <section className="relative bg-gradient-to-b from-[#041A40] via-[#082B66] to-[#0F2A5F] text-white pt-10 pb-16 px-4 overflow-hidden border-b border-blue-900/40">
          {/* Subtle Ambient Background Gradients */}
          <div className="absolute top-0 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-10 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="max-w-5xl mx-auto relative z-10 text-center space-y-4">
            {/* Top Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-amber-400/20 text-amber-300 rounded-full text-xs font-black border border-amber-400/40 font-devanagari backdrop-blur-md shadow-xs">
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>सुरक्षा, गुणवत्ता और पारदर्शिता नीतियां</span>
            </div>

            {/* Main Title */}
            <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-tight font-devanagari">
              Who is <span className="text-red-400 underline decoration-red-500 decoration-4">NOT</span> on Verified Labour?
            </h1>

            <p className="text-sm sm:text-lg font-medium text-blue-100 max-w-2xl mx-auto font-devanagari leading-relaxed">
              जानिए Verified Labour पर कौन उपलब्ध नहीं है और हमारी सख्त सुरक्षा नीतियां ग्राहकों व कामगारों दोनों की सुरक्षा कैसे सुनिश्चित करती हैं।
            </p>

            {/* 3 Quick Stat Badges */}
            <div className="pt-4 grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-3xl mx-auto">
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 border border-white/15 flex items-center justify-center gap-2.5">
                <ShieldAlert className="w-5 h-5 text-red-400 shrink-0" />
                <span className="text-xs font-bold text-white font-devanagari">बिना पहचान जांच नो एंट्री</span>
              </div>
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 border border-white/15 flex items-center justify-center gap-2.5">
                <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
                <span className="text-xs font-bold text-white font-devanagari">100% Aadhaar Verification</span>
              </div>
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 border border-white/15 flex items-center justify-center gap-2.5">
                <Users className="w-5 h-5 text-amber-300 shrink-0" />
                <span className="text-xs font-bold text-white font-devanagari">0% बिचौलिए / सीधी कनेक्टिविटी</span>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 1: WHO IS NOT ON VERIFIED LABOUR */}
        <section className="py-12 px-4 max-w-6xl mx-auto space-y-8">
          <div className="text-center space-y-2">
            <span className="text-xs font-extrabold text-red-600 uppercase tracking-wider font-devanagari">
              सख्त अस्वीकृति नीतियां (Exclusion Criteria)
            </span>
            <h2 className="text-xl sm:text-3xl font-black text-[#082B66] font-devanagari tracking-tight">
              Verified Labour पर ये लोग शामिल नहीं हो सकते:
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 max-w-xl mx-auto font-devanagari">
              हम ग्राहकों की सुरक्षा और काम की गुणवत्ता से कभी समझौता नहीं करते।
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            {/* Card 1 */}
            <div className="bg-white rounded-2xl p-5 sm:p-6 border border-red-200 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-2 h-full bg-red-500" />
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center shrink-0 border border-red-100">
                  <UserX className="w-6 h-6 stroke-[2.5]" />
                </div>
                <div className="space-y-1.5">
                  <span className="inline-block px-2.5 py-0.5 bg-red-100 text-red-700 font-extrabold text-[10px] rounded-md font-devanagari">
                    अनसत्यापित व्यक्ति
                  </span>
                  <h3 className="text-base sm:text-lg font-black text-[#082B66] font-devanagari">
                    1. बिना आधार/पहचान पत्र सत्यापन वाले व्यक्ति
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-devanagari">
                    जिन व्यक्तियों का आधार कार्ड या पहचान पत्र 100% सत्यापित नहीं होता, वे Verified Labour प्लेटफॉर्म पर रजिस्टर नहीं हो सकते। हम हर कामगार की बायोमेट्रिक व सरकारी ID जांच करते हैं।
                  </p>
                </div>
              </div>
            </div>

            {/* Card 2 */}
            <div className="bg-white rounded-2xl p-5 sm:p-6 border border-red-200 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-2 h-full bg-red-500" />
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center shrink-0 border border-red-100">
                  <AlertTriangle className="w-6 h-6 stroke-[2.5]" />
                </div>
                <div className="space-y-1.5">
                  <span className="inline-block px-2.5 py-0.5 bg-red-100 text-red-700 font-extrabold text-[10px] rounded-md font-devanagari">
                    अकुशल / बिना अनुभव
                  </span>
                  <h3 className="text-base sm:text-lg font-black text-[#082B66] font-devanagari">
                    2. बिना अनुभव और बिना स्किल जांच वाले लोग
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-devanagari">
                    तकनीकी और कुशल कार्यों (जैसे इलेक्ट्रीशियन, प्लंबर, मैकेनिक) के लिए बिना स्किल जांच और कार्य अनुभव वाले व्यक्ति उपलब्ध नहीं होते। हमारे सभी कामगारों के कौशल की जांच की जाती है।
                  </p>
                </div>
              </div>
            </div>

            {/* Card 3 */}
            <div className="bg-white rounded-2xl p-5 sm:p-6 border border-red-200 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-2 h-full bg-red-500" />
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center shrink-0 border border-red-100">
                  <FileSpreadsheet className="w-6 h-6 stroke-[2.5]" />
                </div>
                <div className="space-y-1.5">
                  <span className="inline-block px-2.5 py-0.5 bg-red-100 text-red-700 font-extrabold text-[10px] rounded-md font-devanagari">
                    बिचौलिये & कमीशन ठेकेदार
                  </span>
                  <h3 className="text-base sm:text-lg font-black text-[#082B66] font-devanagari">
                    3. अनधिकृत ठेकेदार और बिचौलिये (Middlemen)
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-devanagari">
                    Verified Labour पर कोई भी ऐसा बिचौलिया या ठेकेदार शामिल नहीं है जो कामगारों की दैनिक दिहाड़ी काटे या ग्राहकों से अनुचित कमीशन ले। ग्राहक और कामगार सीधे जुड़ते हैं।
                  </p>
                </div>
              </div>
            </div>

            {/* Card 4 */}
            <div className="bg-white rounded-2xl p-5 sm:p-6 border border-red-200 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-2 h-full bg-red-500" />
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center shrink-0 border border-red-100">
                  <ShieldAlert className="w-6 h-6 stroke-[2.5]" />
                </div>
                <div className="space-y-1.5">
                  <span className="inline-block px-2.5 py-0.5 bg-red-100 text-red-700 font-extrabold text-[10px] rounded-md font-devanagari">
                    सुरक्षा जोखिम
                  </span>
                  <h3 className="text-base sm:text-lg font-black text-[#082B66] font-devanagari">
                    4. सुरक्षा या व्यवहार की शिकायतों वाले व्यक्ति
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-devanagari">
                    यदि किसी कामगार के खिलाफ समय पर न पहुंचने, अनुचित व्यवहार या सुरक्षा से जुड़ी शिकायत मिलती है, तो उन्हें तुरंत प्लेटफॉर्म से ब्लैकलिस्ट कर दिया जाता है।
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 2: WHO IS ON VERIFIED LABOUR (THE VERIFIED STANDARD) */}
        <section className="py-12 bg-white border-y border-slate-200/80 px-4">
          <div className="max-w-6xl mx-auto space-y-8">
            <div className="text-center space-y-2">
              <span className="text-xs font-extrabold text-[#079447] uppercase tracking-wider font-devanagari">
                सत्यापित मानक (The Verified Standard)
              </span>
              <h2 className="text-xl sm:text-3xl font-black text-[#082B66] font-devanagari tracking-tight">
                Verified Labour पर कौन उपलब्ध है?
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 max-w-xl mx-auto font-devanagari">
                केवल वही कामगार प्लेटफॉर्म पर लिस्ट होते हैं जो इन 4 कठोर मानकों को पूरा करते हैं:
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Card 1 */}
              <div className="bg-emerald-50/60 rounded-2xl p-5 border border-emerald-200 flex flex-col justify-between space-y-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                  <ShieldCheck className="w-5 h-5 stroke-[2.5]" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-base font-black text-[#082B66] font-devanagari">100% आधार जांच</h4>
                  <p className="text-xs text-slate-600 font-devanagari">
                    सरकारी आधार कार्ड और पते का बायोमेट्रिक सत्यापन।
                  </p>
                </div>
                <span className="text-[10px] font-extrabold text-emerald-700 font-devanagari uppercase">Aadhaar Verified</span>
              </div>

              {/* Card 2 */}
              <div className="bg-blue-50/60 rounded-2xl p-5 border border-blue-200 flex flex-col justify-between space-y-3">
                <div className="w-10 h-10 rounded-xl bg-[#1264D6] text-white flex items-center justify-center shrink-0 shadow-xs">
                  <Award className="w-5 h-5 stroke-[2.5]" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-base font-black text-[#082B66] font-devanagari">अनुभवी & कुशल</h4>
                  <p className="text-xs text-slate-600 font-devanagari">
                    अपने कार्य क्षेत्र में व्यावहारिक अनुभव और कौशल जांच।
                  </p>
                </div>
                <span className="text-[10px] font-extrabold text-[#1264D6] font-devanagari uppercase">Skill Tested</span>
              </div>

              {/* Card 3 */}
              <div className="bg-amber-50/60 rounded-2xl p-5 border border-amber-200 flex flex-col justify-between space-y-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-xs">
                  <Users className="w-5 h-5 stroke-[2.5]" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-base font-black text-[#082B66] font-devanagari">सीधे रेट & कोई कट नहीं</h4>
                  <p className="text-xs text-slate-600 font-devanagari">
                    कामगार को उनका पूरा मेहनताना मिलता है, बिना किसी कमीशन के।
                  </p>
                </div>
                <span className="text-[10px] font-extrabold text-amber-700 font-devanagari uppercase">Direct Rates</span>
              </div>

              {/* Card 4 */}
              <div className="bg-purple-50/60 rounded-2xl p-5 border border-purple-200 flex flex-col justify-between space-y-3">
                <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                  <UserCheck className="w-5 h-5 stroke-[2.5]" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-base font-black text-[#082B66] font-devanagari">पारदर्शी रेटिंग</h4>
                  <p className="text-xs text-slate-600 font-devanagari">
                    वास्तविक ग्राहकों द्वारा रेटिंग और काम का फीडबैक।
                  </p>
                </div>
                <span className="text-[10px] font-extrabold text-purple-700 font-devanagari uppercase">Customer Rated</span>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 3: WORKER REGISTRATION CTA BANNER */}
        <section className="py-14 px-4 max-w-5xl mx-auto">
          <div className="bg-gradient-to-br from-[#082B66] via-[#0F2A5F] to-[#1264D6] text-white rounded-3xl p-6 sm:p-10 shadow-2xl border border-blue-400/20 relative overflow-hidden">
            {/* Background Decor */}
            <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
              <div className="lg:col-span-8 space-y-4 text-center sm:text-left">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-400 text-[#082B66] rounded-lg text-xs font-black uppercase font-devanagari shadow-xs">
                  <HardHat className="w-4 h-4 text-[#082B66]" />
                  <span>कामगार पंजीकरण (Worker Onboarding)</span>
                </div>

                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black font-devanagari leading-tight">
                  क्या आप एक कुशल और ईमानदार कामगार हैं? <br className="hidden sm:inline" />
                  <span className="text-amber-300">Verified Labour से आज ही जुड़ें!</span>
                </h2>

                <p className="text-xs sm:text-base text-blue-100 font-medium font-devanagari leading-relaxed max-w-xl">
                  यदि आपके पास आधार कार्ड और काम का अनुभव है, तो Verified Labour पर अपना पंजीकरण कराएं। 100% निशुल्क पंजीकरण, सीधे ग्राहक और रोज़ाना कमाई!
                </p>

                <div className="flex flex-wrap items-center gap-4 text-xs text-emerald-300 font-extrabold pt-1">
                  <span className="flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4 fill-emerald-400 text-[#082B66]" />
                    <span>Aadhaar Verification</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4 fill-emerald-400 text-[#082B66]" />
                    <span>Bank Account Link</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4 fill-emerald-400 text-[#082B66]" />
                    <span>Direct Daily Jobs</span>
                  </span>
                </div>
              </div>

              <div className="lg:col-span-4 flex flex-col items-center lg:items-end justify-center space-y-3">
                <button
                  type="button"
                  onClick={handleOpenWorkerRegister}
                  className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-400 hover:from-amber-300 hover:to-amber-200 text-[#082B66] font-black text-base sm:text-lg rounded-2xl shadow-xl shadow-amber-950/30 border border-amber-200/90 flex items-center justify-center gap-2 active:scale-95 transition-all group font-devanagari"
                >
                  <span>अभी रजिस्टर करें</span>
                  <ChevronRight className="w-5 h-5 stroke-[3] group-hover:translate-x-1 transition-transform" />
                </button>

                <p className="text-[11px] text-blue-200 font-medium text-center lg:text-right">
                  100% Free & Secure Registration
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <Footer />

      {/* Reused Authentication Modal for Worker Registration */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        initialMode={authModalMode}
        defaultRole="WORKER"
        onSuccess={() => {
          setAuthModalOpen(false);
        }}
      />
    </div>
  );
}
