'use client';

import React, { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import WorkerOnboardingWizard from '@/components/WorkerOnboardingWizard';
import {
  Loader2,
  ShieldCheck,
  IndianRupee,
  MapPin,
  Sparkles,
  CheckCircle2,
  Award,
  Clock,
  Briefcase,
  Users,
} from 'lucide-react';

export default function WorkerOnboardingPage() {
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/categories')
      .then((res) => res.json())
      .then((data) => {
        if (data.categories) {
          setCategories(data.categories);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 font-sans">
      <Navbar />

      {/* Hero Header Banner */}
      <section className="bg-gradient-to-r from-[#082B66] via-[#0F2A5F] to-[#1264D6] text-white py-8 sm:py-12 px-4 sm:px-6 lg:px-8 border-b border-blue-900/40">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5 max-w-2xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-400 text-[#082B66] rounded-full text-xs font-black uppercase tracking-wider font-devanagari shadow-xs">
              <Sparkles className="w-3.5 h-3.5 fill-[#082B66]" />
              <span>कामगार पंजीकरण पोर्टल</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
              Become a Verified Labour Professional
            </h1>
            <p className="text-xs sm:text-sm text-blue-100 font-medium">
              Join India's premier Aadhaar-verified skilled workforce marketplace. Get direct customer bookings & daily payouts.
            </p>
          </div>

          {/* Quick Stats Badges */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="bg-white/10 backdrop-blur-md px-3.5 py-2 rounded-2xl border border-white/15 text-center">
              <span className="block text-base sm:text-lg font-black text-amber-300">100%</span>
              <span className="text-[10px] text-blue-100 font-bold uppercase">Direct Payouts</span>
            </div>
            <div className="bg-white/10 backdrop-blur-md px-3.5 py-2 rounded-2xl border border-white/15 text-center">
              <span className="block text-base sm:text-lg font-black text-emerald-300">Aadhaar</span>
              <span className="text-[10px] text-blue-100 font-bold uppercase">KYC Verified</span>
            </div>
          </div>
        </div>
      </section>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 w-full flex-1">
        {loading ? (
          <div className="py-20 text-center bg-white rounded-3xl border border-slate-200 shadow-sm max-w-2xl mx-auto">
            <Loader2 className="w-9 h-9 animate-spin text-[#1264D6] mx-auto mb-3" />
            <p className="text-sm text-slate-600 font-bold">Loading Verified Labour portal...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Main Multi-Step Form (8 Columns) */}
            <div className="lg:col-span-8">
              <WorkerOnboardingWizard
                categories={categories}
                onComplete={() => {
                  window.location.href = '/worker/dashboard';
                }}
              />
            </div>

            {/* Right Desktop Benefits Side Panel (4 Columns) */}
            <div className="hidden lg:block lg:col-span-4 space-y-5 sticky top-24">
              {/* Why Register Card */}
              <div className="bg-gradient-to-br from-[#082B66] via-[#0F2A5F] to-[#1264D6] text-white rounded-3xl p-6 shadow-xl space-y-4 border border-blue-900/40">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-400 text-[#082B66] font-black text-xs rounded-full uppercase tracking-wider font-devanagari">
                  ⭐ Verified Partner Benefits
                </div>

                <h3 className="text-lg font-black text-white leading-tight">
                  Why Register on Verified Labour?
                </h3>

                <div className="space-y-3.5 text-xs">
                  <div className="flex items-start gap-3 bg-white/10 backdrop-blur-xs p-3 rounded-2xl border border-white/10">
                    <div className="w-8 h-8 rounded-xl bg-emerald-400/20 text-emerald-300 flex items-center justify-center shrink-0 border border-emerald-400/30">
                      <IndianRupee className="w-4 h-4 stroke-[2.5]" />
                    </div>
                    <div>
                      <h4 className="font-bold text-white">Daily Direct Bank Payouts</h4>
                      <p className="text-blue-100 text-[11px] mt-0.5">Earnings settled directly into your verified bank account without delay.</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 bg-white/10 backdrop-blur-xs p-3 rounded-2xl border border-white/10">
                    <div className="w-8 h-8 rounded-xl bg-amber-400/20 text-amber-300 flex items-center justify-center shrink-0 border border-amber-400/30">
                      <ShieldCheck className="w-4 h-4 stroke-[2.5]" />
                    </div>
                    <div>
                      <h4 className="font-bold text-white">Aadhaar Verified Customers</h4>
                      <p className="text-blue-100 text-[11px] mt-0.5">Work safely with verified clients, fixed rates, and full transparency.</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 bg-white/10 backdrop-blur-xs p-3 rounded-2xl border border-white/10">
                    <div className="w-8 h-8 rounded-xl bg-blue-400/20 text-blue-300 flex items-center justify-center shrink-0 border border-blue-400/30">
                      <MapPin className="w-4 h-4 stroke-[2.5]" />
                    </div>
                    <div>
                      <h4 className="font-bold text-white">Smart Radius Dispatch</h4>
                      <p className="text-blue-100 text-[11px] mt-0.5">Only receive job requests within your custom 5 km to 50 km area.</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Trust Badge Guarantee Widget */}
              <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-200 space-y-3">
                <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-[#079447]" />
                  <span>Platform Verification Guarantee</span>
                </h4>
                <p className="text-xs text-slate-500 leading-relaxed font-medium">
                  Once your Aadhaar & Bank Account are validated via Cashfree, your worker profile instantly receives the official <strong>Verified Professional</strong> badge visible to all local customers.
                </p>
                <div className="pt-1 flex items-center justify-between text-[11px] text-slate-400 font-bold border-t border-slate-100">
                  <span>Support Line:</span>
                  <span className="text-[#1264D6]">info@verifiedlabour.com</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
