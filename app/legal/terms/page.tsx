'use client';

import React from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useLanguage } from '@/context/LanguageContext';
import { COMPANY_NAME, COMPANY_REGISTERED_ADDRESS } from '@/lib/company-info';

export default function TermsPage() {
  const { isHindi } = useLanguage();

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 font-devanagari">
      <Navbar />

      <main className="max-w-4xl mx-auto px-4 py-12 flex-1">
        <div className="bg-white rounded-3xl p-8 sm:p-12 border border-slate-200 shadow-sm space-y-6 text-sm text-slate-700 leading-relaxed">
          <h1 className="text-3xl font-black text-slate-900">
            {isHindi ? 'सेवा की शर्तें एवं मार्केटप्लेस समझौता' : 'Terms of Service & Marketplace Agreement'}
          </h1>
          <p className="text-xs text-slate-400">
            {isHindi ? 'अंतिम अपडेट: सितंबर 2026' : 'Last updated: September 2026'}
          </p>

          <section className="space-y-2">
            <h2 className="text-lg font-bold text-slate-900">
              {isHindi ? '1. प्लेटफॉर्म की प्रकृति' : '1. Platform Nature'}
            </h2>
            <p>
              {isHindi
                ? 'Verified Labour एक ऑन-डिमांड तकनीक मार्केटप्लेस है जो स्वतंत्र सेवा चाहने वालों (ग्राहकों और व्यवसायों) और स्वतंत्र कुशल सेवा पेशेवरों (कामगारों) के बीच संपर्क को सुविधाजनक बनाता है।'
                : 'Verified Labour is an on-demand technology marketplace facilitating connections between independent service seekers (Customers and Businesses) and independent skilled service professionals (Workers).'}
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-bold text-slate-900">
              {isHindi ? '2. सत्यापन मानक' : '2. Verification Standards'}
            </h2>
            <p>
              {isHindi
                ? '"सत्यापित" बैज दर्शाता है कि पेशेवर ने Cashfree के माध्यम से सहमति-आधारित आधार पहचान सत्यापन और बैंक खाता नाम मिलान सफलतापूर्वक पूरा कर लिया है। यह रोजगार की गारंटी नहीं है।'
                : 'The "Verified" badge indicates that the professional has successfully completed consent-based Aadhaar identity verification and bank account name matching via Cashfree. It is not an employment warranty.'}
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-bold text-slate-900">
              {isHindi ? '3. भुगतान और कमीशन' : '3. Payments & Commission'}
            </h2>
            <p>
              {isHindi
                ? 'काम पूरा होने पर सभी ऑनलाइन बुकिंग एकीकृत Cashfree पेमेंट्स गेटवे के माध्यम से तय की जानी चाहिए। Verified Labour पारदर्शी प्लेटफॉर्म सुविधा शुल्क लेता है।'
                : 'All online bookings must be settled via the integrated Cashfree Payments gateway upon completion of work. Verified Labour charges a transparent platform facilitation fee (10% standard commission).'}
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-bold text-slate-900">
              {isHindi ? '4. कानूनी अनुबंधित संस्था और पंजीकृत कार्यालय' : '4. Legal Contracting Entity & Registered Office'}
            </h2>
            <p>
              {isHindi ? 'यह प्लेटफॉर्म निम्नलिखित संस्था द्वारा संचालित है:' : 'This platform is owned and operated by:'}
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
