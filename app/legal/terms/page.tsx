import React from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { COMPANY_NAME, COMPANY_REGISTERED_ADDRESS } from '@/lib/company-info';

export default function TermsPage() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />

      <main className="max-w-4xl mx-auto px-4 py-12 flex-1">
        <div className="bg-white rounded-3xl p-8 sm:p-12 border border-slate-200 shadow-sm space-y-6 text-sm text-slate-700 leading-relaxed">
          <h1 className="text-3xl font-black text-slate-900">Terms of Service & Marketplace Agreement</h1>
          <p className="text-xs text-slate-400">Last updated: September 2026</p>

          <section className="space-y-2">
            <h2 className="text-lg font-bold text-slate-900">1. Platform Nature</h2>
            <p>
              Verified Labour is an on-demand technology marketplace facilitating connections between
              independent service seekers (Customers and Businesses) and independent skilled service
              professionals (Workers).
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-bold text-slate-900">2. Verification Standards</h2>
            <p>
              The "Verified" badge indicates that the professional has successfully completed consent-based
              Aadhaar identity verification and bank account name matching via Cashfree. It is not an employment warranty.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-bold text-slate-900">3. Payments & Commission</h2>
            <p>
              All online bookings must be settled via the integrated Cashfree Payments gateway upon completion
              of work. Verified Labour charges a transparent platform facilitation fee (10% standard commission).
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-bold text-slate-900">4. Legal Contracting Entity & Registered Office</h2>
            <p>
              This platform is owned and operated by:
            </p>
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1">
              <p className="font-bold text-slate-900">{COMPANY_NAME}</p>
              <p className="text-slate-700">Registered Office: {COMPANY_REGISTERED_ADDRESS}</p>
              <p className="text-slate-600 font-medium">Contact Email: help@verifiedlabour.com | Phone: +91 9109019090</p>
            </div>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
