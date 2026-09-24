'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  ArrowLeft,
  Smartphone,
  CheckCircle2,
  Bell,
  ShieldCheck,
  MapPin,
  Zap,
  Sparkles,
  Home,
  Check,
  Download,
  Users,
  Clock,
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

function ComingSoonContent() {
  const searchParams = useSearchParams();
  const platformParam = searchParams.get('platform');
  const [selectedPlatform, setSelectedPlatform] = useState<'android' | 'ios'>(
    platformParam === 'ios' ? 'ios' : 'android'
  );
  const [contactInput, setContactInput] = useState('');
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (platformParam === 'ios') {
      setSelectedPlatform('ios');
    } else if (platformParam === 'android') {
      setSelectedPlatform('android');
    }
  }, [platformParam]);

  const handleNotifySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactInput.trim()) return;
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSubscribed(true);
    }, 600);
  };

  return (
    <main className="flex-1 bg-slate-50">
      {/* Top Banner Navigation bar for explicit Back to Home action */}
      <div className="bg-white border-b border-slate-200 py-3 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-[#0F2A5F] hover:text-[#1464D2] transition-colors py-1.5 px-3 rounded-full hover:bg-slate-100 border border-slate-200"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Home</span>
          </Link>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Mobile App Status: <strong className="text-emerald-700">In Active Development</strong></span>
          </div>
        </div>
      </div>

      {/* Hero Header Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[#0F2A5F] via-[#0B2046] to-[#082B66] text-white pt-12 pb-16 sm:pt-16 sm:pb-24 px-4 sm:px-6 lg:px-8">
        {/* Background Decorative Element */}
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-[#1464D2]/30 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-[#0B9B5A]/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-4xl mx-auto text-center space-y-6">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs sm:text-sm font-bold text-amber-300 shadow-sm">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>Official Verified Labour Mobile App</span>
          </div>

          {/* Main Title */}
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-tight">
            We Are Coming Soon To Your Smartphone!
          </h1>
          <p className="text-lg sm:text-xl font-bold text-emerald-300 font-devanagari">
            वेरिफाइड लेबर मोबाइल ऐप — जल्द ही Google Play एवं App Store पर!
          </p>

          <p className="text-sm sm:text-base text-slate-300 max-w-2xl mx-auto font-medium leading-relaxed">
            We're bringing India's premier Aadhaar-verified skilled craftsmen marketplace right to your fingertips. 
            Book workers, manage jobs, track live dispatch, and execute safe payments directly from your phone.
          </p>

          {/* Back to Home Quick CTA */}
          <div className="pt-2 flex flex-wrap justify-center gap-4">
            <Link
              href="/"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-[#0B9B5A] hover:bg-[#08783b] text-white font-bold text-sm sm:text-base shadow-lg hover:shadow-emerald-900/30 transition-all active:scale-95"
            >
              <Home className="w-5 h-5" />
              <span>Back to Home Website</span>
            </Link>
            <a
              href="#notify-section"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-white/10 hover:bg-white/20 text-white font-bold text-sm sm:text-base border border-white/20 backdrop-blur-sm transition-all active:scale-95"
            >
              <Bell className="w-5 h-5 text-amber-300" />
              <span>Get Notified on Launch</span>
            </a>
          </div>
        </div>
      </section>

      {/* App Stores Cards Section */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 sm:-mt-14 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
          
          {/* Google Play Card */}
          <div
            onClick={() => setSelectedPlatform('android')}
            className={`bg-white rounded-3xl p-6 sm:p-8 border transition-all cursor-pointer shadow-md hover:shadow-xl ${
              selectedPlatform === 'android'
                ? 'border-[#0B9B5A] ring-2 ring-[#0B9B5A]/30'
                : 'border-slate-200 hover:border-slate-300'
            }`}
          >
            <div className="flex items-start justify-between mb-6">
              <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-[#0B9B5A] flex items-center justify-center border border-emerald-100 shadow-sm">
                <svg className="w-8 h-8 fill-current" viewBox="0 0 24 24">
                  <path d="M3.609 1.814L13.792 12 3.61 22.186a1.996 1.996 0 0 1-.61-1.464V3.278c0-.573.23-1.096.609-1.464zm11.597 11.599L17.75 16l-12.72 7.34 10.176-9.927zm2.544-2.545l3.586 2.07a1.442 1.442 0 0 1 0 2.502l-3.586 2.07-2.128-2.321 2.128-2.321zM5.03 2.062L17.75 9.4 15.206 12 5.03 2.062z" />
                </svg>
              </div>
              <span className="px-3 py-1 rounded-full bg-emerald-100 text-[#0B9B5A] font-bold text-xs uppercase tracking-wider">
                Android Edition
              </span>
            </div>

            <h3 className="text-xl sm:text-2xl font-black text-slate-900 mb-1">
              Google Play Store
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 font-medium mb-6">
              Designed for Android devices (Version 8.0 & above)
            </p>

            <ul className="space-y-3 mb-6 text-xs sm:text-sm text-slate-700 font-medium">
              <li className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-[#0B9B5A] shrink-0" />
                <span>One-tap local craftsman booking</span>
              </li>
              <li className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-[#0B9B5A] shrink-0" />
                <span>Aadhaar KYC & Bank Validation badge</span>
              </li>
              <li className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-[#0B9B5A] shrink-0" />
                <span>Real-time GPS worker arrival updates</span>
              </li>
              <li className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-[#0B9B5A] shrink-0" />
                <span>Instant worker wallet daily payouts</span>
              </li>
            </ul>

            <div className="w-full py-3 px-4 rounded-xl bg-slate-100 border border-slate-200 text-center font-bold text-xs sm:text-sm text-slate-700 flex items-center justify-center gap-2">
              <Clock className="w-4 h-4 text-amber-500" />
              <span>Status: Final Testing Phase</span>
            </div>
          </div>

          {/* App Store Card */}
          <div
            onClick={() => setSelectedPlatform('ios')}
            className={`bg-white rounded-3xl p-6 sm:p-8 border transition-all cursor-pointer shadow-md hover:shadow-xl ${
              selectedPlatform === 'ios'
                ? 'border-[#1464D2] ring-2 ring-[#1464D2]/30'
                : 'border-slate-200 hover:border-slate-300'
            }`}
          >
            <div className="flex items-start justify-between mb-6">
              <div className="w-14 h-14 rounded-2xl bg-blue-50 text-[#1464D2] flex items-center justify-center border border-blue-100 shadow-sm">
                <svg className="w-8 h-8 fill-current" viewBox="0 0 24 24">
                  <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.47c.66-.82 1.11-1.96.99-3.1-.96.04-2.13.64-2.82 1.45-.61.71-1.15 1.87-1.01 2.98 1.07.08 2.18-.51 2.84-1.33z" />
                </svg>
              </div>
              <span className="px-3 py-1 rounded-full bg-blue-100 text-[#1464D2] font-bold text-xs uppercase tracking-wider">
                iOS Edition
              </span>
            </div>

            <h3 className="text-xl sm:text-2xl font-black text-slate-900 mb-1">
              Apple App Store
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 font-medium mb-6">
              Designed for iPhone & iPad (iOS 15.0 & above)
            </p>

            <ul className="space-y-3 mb-6 text-xs sm:text-sm text-slate-700 font-medium">
              <li className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-[#1464D2] shrink-0" />
                <span>Ultra-fast iOS native user interface</span>
              </li>
              <li className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-[#1464D2] shrink-0" />
                <span>Face ID & Touch ID secure login</span>
              </li>
              <li className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-[#1464D2] shrink-0" />
                <span>Live activity tracking for ongoing jobs</span>
              </li>
              <li className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-[#1464D2] shrink-0" />
                <span>Direct UPI & Cashfree instant checkout</span>
              </li>
            </ul>

            <div className="w-full py-3 px-4 rounded-xl bg-slate-100 border border-slate-200 text-center font-bold text-xs sm:text-sm text-slate-700 flex items-center justify-center gap-2">
              <Clock className="w-4 h-4 text-amber-500" />
              <span>Status: Apple Review Pending</span>
            </div>
          </div>
        </div>
      </section>

      {/* Early Access Notification Section */}
      <section id="notify-section" className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="bg-gradient-to-br from-[#0F2A5F] to-[#1464D2] rounded-3xl p-8 sm:p-12 text-white shadow-xl text-center space-y-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-2xl pointer-events-none" />

          <div className="max-w-2xl mx-auto space-y-3">
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
              Get Notified First When We Launch!
            </h2>
            <p className="text-sm sm:text-base text-blue-100 font-medium">
              Enter your mobile number or email address to receive an instant download link as soon as our official app hits {selectedPlatform === 'android' ? 'Google Play' : 'the App Store'}.
            </p>
          </div>

          {subscribed ? (
            <div className="bg-emerald-500/20 border border-emerald-400/30 rounded-2xl p-6 max-w-md mx-auto flex items-center justify-center gap-3 text-emerald-200 font-bold text-sm animate-in fade-in zoom-in-95">
              <Check className="w-6 h-6 text-emerald-400 shrink-0" />
              <span>Thank you! We have added you to our early access priority list.</span>
            </div>
          ) : (
            <form onSubmit={handleNotifySubmit} className="max-w-md mx-auto flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                placeholder="Mobile number or Email address"
                value={contactInput}
                onChange={(e) => setContactInput(e.target.value)}
                required
                className="flex-1 px-4 py-3.5 rounded-2xl bg-white text-slate-900 placeholder:text-slate-400 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-amber-400 border border-slate-200"
              />
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-3.5 rounded-2xl bg-[#0B9B5A] hover:bg-[#08783b] text-white font-bold text-sm transition-all shadow-md active:scale-95 flex items-center justify-center gap-2 shrink-0 disabled:opacity-70"
              >
                {loading ? (
                  <span>Saving...</span>
                ) : (
                  <>
                    <Bell className="w-4 h-4" />
                    <span>Notify Me</span>
                  </>
                )}
              </button>
            </form>
          )}

          <p className="text-[11px] text-slate-300 font-normal">
            * Zero spam guarantee. We will only contact you once when the app is published.
          </p>
        </div>
      </section>

      {/* Feature Highlights Grid */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div className="text-center max-w-2xl mx-auto mb-10 space-y-2">
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Why Download the Verified Labour App?
          </h2>
          <p className="text-sm text-slate-600 font-medium">
            Everything you need for seamless skilled workforce hiring and daily work management.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-[#0B9B5A] flex items-center justify-center font-bold">
              <Zap className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-slate-900 text-base">Instant Booking</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Book skilled plumbers, electricians, painters & helpers in under 60 seconds.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#1464D2] flex items-center justify-center font-bold">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-slate-900 text-base">100% Verified</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Aadhaar identity verification and bank account validation for total peace of mind.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
              <MapPin className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-slate-900 text-base">Live Tracking</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Track worker dispatch status and ETA in real-time on interactive maps.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
              <Users className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-slate-900 text-base">For Customers & Workers</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Dedicated interfaces for hiring customers, businesses, and daily skilled craftsmen.
            </p>
          </div>
        </div>
      </section>

      {/* Prominent Back-to-Home Section */}
      <section className="bg-white border-t border-slate-200 py-12 px-4 sm:px-6 lg:px-8 text-center">
        <div className="max-w-3xl mx-auto space-y-4">
          <h3 className="text-xl sm:text-2xl font-bold text-slate-900">
            Need skilled workers right now?
          </h3>
          <p className="text-sm text-slate-600 font-medium">
            You don't have to wait for the app! Our website is fully functional and responsive on all mobile browsers.
          </p>
          <div className="pt-2">
            <Link
              href="/"
              className="inline-flex items-center gap-2.5 px-8 py-4 rounded-full bg-[#0F2A5F] hover:bg-[#0B2046] text-white font-extrabold text-base shadow-lg transition-all active:scale-95"
            >
              <Home className="w-5 h-5 text-emerald-400" />
              <span>Back to Verified Labour Home Page</span>
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}

export default function AppComingSoonPage() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />
      <Suspense fallback={<div className="flex-1 py-20 text-center text-slate-500">Loading...</div>}>
        <ComingSoonContent />
      </Suspense>
      <Footer />
    </div>
  );
}
