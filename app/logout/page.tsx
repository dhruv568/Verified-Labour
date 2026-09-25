'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  ShieldCheck,
  LogOut,
  Lock,
  Home,
  ArrowRight,
  CheckCircle2,
  KeyRound,
  ShieldAlert,
  Sparkles,
  RefreshCw,
  UserCheck,
  HelpCircle,
  PhoneCall,
  Clock,
  Shield
} from 'lucide-react';
import Logo from '@/components/Logo';
import Footer from '@/components/Footer';
import AuthModal from '@/components/AuthModal';

function LogoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const reason = searchParams.get('reason');

  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [cleared, setCleared] = useState(false);

  useEffect(() => {
    // 1. Trigger backend logout endpoint to clear HTTP-only cookies
    const performLogout = async () => {
      try {
        await fetch('/api/auth/logout', { method: 'POST' });
        await fetch('/api/auth/me', { method: 'POST' });
      } catch (err) {
        console.error('Logout request failed:', err);
      } finally {
        // 2. Clear client-side storage
        try {
          if (typeof window !== 'undefined') {
            localStorage.clear();
            sessionStorage.clear();
            // Clear standard document cookies if accessible
            document.cookie.split(';').forEach((c) => {
              document.cookie = c
                .replace(/^ +/, '')
                .replace(/=.*/, '=;expires=' + new Date().toUTCString() + ';path=/');
            });
          }
        } catch (e) {
          console.error('Error clearing local storage:', e);
        }
        setCleared(true);
      }
    };

    performLogout();
  }, []);

  const handleLoginSuccess = (user: any) => {
    setAuthModalOpen(false);
    if (!user) {
      router.push('/');
      return;
    }
    if (user.role === 'ADMIN') {
      router.push('/admin');
    } else if (user.role === 'WORKER') {
      router.push('/worker/dashboard');
    } else if (user.role === 'BUSINESS') {
      router.push('/business/bulk');
    } else {
      router.push('/customer/dashboard');
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans antialiased selection:bg-[#1264D6] selection:text-white">
      {/* Top Header / Branding Bar */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group" aria-label="Verified Labour Home">
            <Logo variant="header" priority />
          </Link>
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-slate-600 hover:text-[#082B66] px-3 py-1.5 rounded-full hover:bg-slate-100 transition-colors"
            >
              <Home className="w-4 h-4" />
              <span>Back to Home</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        {/* Decorative background ambient glows */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-gradient-to-tr from-blue-100/60 via-emerald-100/40 to-transparent rounded-full blur-3xl pointer-events-none -z-10" />
        <div className="absolute bottom-10 right-10 w-72 h-72 bg-blue-50 rounded-full blur-2xl pointer-events-none -z-10" />

        <div className="w-full max-w-xl">
          {/* Main Card Container */}
          <div className="bg-white rounded-3xl shadow-xl border border-slate-200/80 p-6 sm:p-10 text-center relative overflow-hidden backdrop-blur-sm">
            {/* Top Security Banner Accent */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#082B66] via-[#1264D6] to-[#079447]" />

            {/* Professional Vector Illustration & Animated Badge */}
            <div className="relative mx-auto w-32 h-32 sm:w-36 sm:h-36 mb-6 flex items-center justify-center">
              {/* Outer Pulse Waves */}
              <div className="absolute inset-0 rounded-full bg-emerald-100/70 animate-ping opacity-25" />
              <div className="absolute -inset-2 rounded-full bg-gradient-to-tr from-blue-50 to-emerald-50 border border-emerald-100 shadow-inner" />

              {/* Vector Graphic Artwork */}
              <svg className="w-full h-full relative z-10 p-2" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
                {/* Outer Shield Outline */}
                <path
                  d="M100 20L160 45V95C160 135 134 168 100 180C66 168 40 135 40 95V45L100 20Z"
                  fill="url(#shieldGrad)"
                  stroke="#1264D6"
                  strokeWidth="3"
                  strokeLinejoin="round"
                />
                {/* Inner Lock/Check Icon background */}
                <circle cx="100" cy="98" r="38" fill="white" className="shadow-md" />
                <path
                  d="M85 98L95 108L118 85"
                  stroke="#079447"
                  strokeWidth="7"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                {/* Floating Lock Badge Icon */}
                <circle cx="140" cy="55" r="18" fill="#082B66" />
                <path
                  d="M135 56V52C135 49.2 137.2 47 140 47C142.8 47 145 49.2 145 52V56M132 56H148V64H132V56Z"
                  stroke="white"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                {/* Gradient Definitions */}
                <defs>
                  <linearGradient id="shieldGrad" x1="40" y1="20" x2="160" y2="180" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#F0F7FF" />
                    <stop offset="1" stopColor="#E6F4EA" />
                  </linearGradient>
                </defs>
              </svg>
            </div>

            {/* Session Status Pill */}
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold tracking-wide uppercase mb-4 shadow-xs">
              <ShieldCheck className="w-4 h-4 text-[#079447]" />
              <span>Session Securely Ended</span>
            </div>

            {/* Clear Title */}
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#082B66] tracking-tight mb-2">
              You&apos;ve Been Logged Out
            </h1>

            {/* Subtitle / Reason Message */}
            <p className="text-sm sm:text-base text-slate-600 max-w-md mx-auto mb-8 leading-relaxed">
              {reason === 'expired'
                ? 'Your session expired due to inactivity. For your privacy and protection, you have been safely logged out.'
                : reason === 'unauthorized'
                ? 'Authentication is required to access protected pages. You have been redirected here safely.'
                : 'Thank you for visiting Verified Labour. Your authentication tokens, cookies, and local session data have been completely cleared.'}
            </p>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 mb-8">
              {/* Login Again Button */}
              <button
                type="button"
                onClick={() => setAuthModalOpen(true)}
                className="w-full sm:w-auto min-w-[180px] inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl font-bold text-sm text-white bg-[#1264D6] hover:bg-blue-700 active:scale-98 shadow-md hover:shadow-lg transition-all cursor-pointer"
              >
                <LogOut className="w-4 h-4 rotate-180" />
                <span>Login Again</span>
              </button>

              {/* Go to Homepage Button */}
              <Link
                href="/"
                className="w-full sm:w-auto min-w-[180px] inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl font-bold text-sm text-slate-700 bg-slate-100 hover:bg-slate-200 active:scale-98 border border-slate-200 transition-all"
              >
                <Home className="w-4 h-4 text-slate-500" />
                <span>Go to Homepage</span>
              </Link>
            </div>

            {/* Security Guarantee Cards */}
            <div className="pt-6 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-3 gap-3 text-left">
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 flex flex-col justify-between">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-6 h-6 rounded-lg bg-blue-100 text-[#1264D6] flex items-center justify-center shrink-0">
                    <Lock className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-xs font-bold text-slate-800">Cookie Cleared</span>
                </div>
                <p className="text-[11px] text-slate-500 leading-snug">
                  HTTP session tokens removed from browser storage.
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 flex flex-col justify-between">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-6 h-6 rounded-lg bg-emerald-100 text-[#079447] flex items-center justify-center shrink-0">
                    <UserCheck className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-xs font-bold text-slate-800">Data Safe</span>
                </div>
                <p className="text-[11px] text-slate-500 leading-snug">
                  Your profile and verified credentials remain protected.
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 flex flex-col justify-between">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-6 h-6 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center shrink-0">
                    <PhoneCall className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-xs font-bold text-slate-800">24/7 Support</span>
                </div>
                <p className="text-[11px] text-slate-500 leading-snug">
                  Contact verified team if you need account help.
                </p>
              </div>
            </div>
          </div>

          {/* Additional Quick Navigation Links */}
          <div className="mt-8 text-center space-y-2">
            <p className="text-xs text-slate-500 font-medium">
              Want to hire daily verified workers or start offering services?
            </p>
            <div className="flex items-center justify-center gap-4 text-xs font-bold text-[#1264D6]">
              <Link href="/#workers" className="hover:underline">
                Find Workers near you
              </Link>
              <span className="text-slate-300">•</span>
              <button
                type="button"
                onClick={() => setAuthModalOpen(true)}
                className="hover:underline text-[#079447] font-bold"
              >
                Become a Verified Worker
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Auth Modal for "Login Again" */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        initialMode="login"
        onSuccess={handleLoginSuccess}
      />

      {/* Standard Verified Labour Footer */}
      <Footer />
    </div>
  );
}

export default function LogoutPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
          <div className="flex items-center gap-3 text-slate-600 font-semibold">
            <RefreshCw className="w-5 h-5 animate-spin text-[#1264D6]" />
            <span>Logging out securely...</span>
          </div>
        </div>
      }
    >
      <LogoutContent />
    </Suspense>
  );
}
