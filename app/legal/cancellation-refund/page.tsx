'use client';

import React from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useLanguage } from '@/context/LanguageContext';
import { COMPANY_NAME, COMPANY_REGISTERED_ADDRESS } from '@/lib/company-info';

export default function CancellationRefundPage() {
  const { isHindi } = useLanguage();

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 font-devanagari">
      <Navbar />

      <main className="max-w-4xl mx-auto px-4 py-12 flex-1">
        <div className="bg-white rounded-3xl p-8 sm:p-12 border border-slate-200 shadow-sm space-y-6 text-sm text-slate-700 leading-relaxed">
          <h1 className="text-3xl font-black text-slate-900">
            {isHindi ? 'रद्दीकरण एवं धनवापसी नीति' : 'Cancellation & Refund Policy'}
          </h1>
          <p className="text-xs text-slate-400">
            {isHindi ? 'अंतिम अपडेट: सितंबर 2026' : 'Last updated: September 2026'}
          </p>

          <section className="space-y-2">
            <h2 className="text-lg font-bold text-slate-900">
              {isHindi ? '1. ग्राहक रद्दीकरण' : '1. Customer Cancellation'}
            </h2>
            <p>
              {isHindi
                ? 'ग्राहक कामगार के रवाना होने से पहले बिना किसी पेनल्टी के अनुरोधित या स्वीकृत कार्य को रद्द कर सकते हैं। यदि पहुंचने के बाद रद्द किया जाता है, तो पेशेवर के यात्रा खर्च की भरपाई के लिए नाममात्र निरीक्षण शुल्क लागू हो सकता है।'
                : 'Customers may cancel a requested or accepted job without penalty prior to the worker departing ("WORKER_ON_THE_WAY"). If cancelled after arrival, a nominal inspection charge (₹100) may apply to reimburse the professional\'s travel expenses.'}
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-bold text-slate-900">
              {isHindi ? '2. विवाद समाधान एवं धनवापसी' : '2. Dispute Resolution & Refunds'}
            </h2>
            <p>
              {isHindi
                ? 'यदि कोई ग्राहक वैध विवाद ("काम पूरा नहीं हुआ", "निम्नस्तरीय सेवा") खोलता है, तो भुगतान निपटान रोक दिया जाता है। प्रशासनिक मध्यस्थ 3-5 व्यावसायिक दिनों के भीतर उचित धनवापसी देने के लिए संदेश इतिहास और साक्ष्यों की समीक्षा करता है।'
                : 'If a customer opens a legitimate dispute ("Work not completed", "Substandard service"), payment settlement is placed ON_HOLD. An administrative arbitrator reviews message history, photos, and evidence to grant a partial or full refund where justified within 3-5 business days.'}
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-bold text-slate-900">
              {isHindi ? '3. कॉर्पोरेट संस्था और सहायता पता' : '3. Corporate Entity & Support Address'}
            </h2>
            <p>
              {isHindi ? 'धनवापसी अनुरोध और बिलिंग विवाद निम्नलिखित द्वारा प्रबंधित किए जाते हैं:' : 'Refund requests and billing disputes are managed by:'}
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
