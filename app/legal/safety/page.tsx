import React from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { COMPANY_NAME, COMPANY_REGISTERED_ADDRESS } from '@/lib/company-info';

export default function SafetyGuidelinesPage() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />

      <main className="max-w-4xl mx-auto px-4 py-12 flex-1">
        <div className="bg-white rounded-3xl p-8 sm:p-12 border border-slate-200 shadow-sm space-y-6 text-sm text-slate-700 leading-relaxed">
          <h1 className="text-3xl font-black text-slate-900">Safety Guidelines & Redressal</h1>
          <p className="text-xs text-slate-400">For Customers and Workers</p>

          <section className="space-y-2">
            <h2 className="text-lg font-bold text-slate-900">1. Verification Check</h2>
            <p>
              Always check the worker's badge in your booking cockpit. Ensure the person arriving matches the name
              and photo displayed in the Verified Labour application.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-bold text-slate-900">2. Emergency Contact & Reporting</h2>
            <p>
              In the event of an emergency or severe misconduct, immediately dial 112 (National Emergency Number)
              and report the incident to our 24/7 trust team at <a href="mailto:help@verifiedlabour.com" className="font-bold text-[#1264D6] hover:underline">help@verifiedlabour.com</a>.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-bold text-slate-900">3. Grievance Redressal Office</h2>
            <p>
              Written notices or formal complaints can be sent to our Grievance Desk at:
            </p>
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1">
              <p className="font-bold text-slate-900">{COMPANY_NAME}</p>
              <p className="text-slate-700">Registered Office: {COMPANY_REGISTERED_ADDRESS}</p>
              <p className="text-slate-600 font-medium">Email: help@verifiedlabour.com | Phone: +91 9109019090</p>
            </div>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
