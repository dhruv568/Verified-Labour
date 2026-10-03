'use client';

import React from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { ShieldCheck } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { COMPANY_NAME, COMPANY_REGISTERED_ADDRESS } from '@/lib/company-info';

export default function VerificationPolicyPage() {
  const { isHindi } = useLanguage();

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 font-devanagari">
      <Navbar />

      <main className="max-w-4xl mx-auto px-4 py-12 flex-1">
        <div className="bg-white rounded-3xl p-8 sm:p-12 border border-slate-200 shadow-sm space-y-6 text-sm text-slate-700 leading-relaxed">
          <div className="flex items-center gap-3">
            <ShieldCheck className="w-8 h-8 text-brand-700" />
            <h1 className="text-3xl font-black text-slate-900">
              {isHindi ? 'वर्कर सत्यापन नीति' : 'Worker Verification Policy'}
            </h1>
          </div>
          <p className="text-xs text-slate-400">
            {isHindi ? 'कैशफ्री सुरक्षित पहचान संरचना' : 'Cashfree Secure ID Architecture'}
          </p>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-slate-900">
              {isHindi ? 'वर्कर कैसे "सत्यापित" बनते हैं' : 'How Workers Become "Verified"'}
            </h2>
            <p>
              {isHindi
                ? 'ग्राहकों और व्यावसायिक ठेकेदारों दोनों के लिए सुरक्षा और विश्वसनीयता सुनिश्चित करने के लिए, किसी भी कामगार को हमारी बहु-बिंदु पृष्ठभूमि जांच पास किए बिना सत्यापित बैज नहीं मिलता है:'
                : 'To ensure safety and reliability for both customers and commercial contractors, no worker receives the Verified badge without passing our multi-point background checks:'}
            </p>
            <ul className="space-y-2 list-disc pl-5">
              <li>
                <strong>{isHindi ? 'आधार पहचान सत्यापन (UIDAI OTP):' : 'Aadhaar Identity Verification (UIDAI OTP):'}</strong>{' '}
                {isHindi
                  ? 'Cashfree Secure ID के माध्यम से पूरा किया गया। वर्कर अपनी इच्छा से सहमति देकर अपना 12-अंकीय आधार नंबर दर्ज करता है और UIDAI से सीधे प्राप्त वन-टाइम पासवर्ड दर्ज करता है।'
                  : 'Completed via Cashfree Secure ID. Worker enters their 12-digit Aadhaar number with voluntary consent, and inputs the one-time password received directly from UIDAI.'}
              </li>
              <li>
                <strong>{isHindi ? 'बैंक खाता एवं IFSC सत्यापन:' : 'Bank Account & IFSC Validation:'}</strong>{' '}
                {isHindi
                  ? 'Cashfree स्वचालित खाता सत्यापन करता है, खाते के अस्तित्व को मान्य करता है और आधार पहचान नाम से लाभार्थी के नाम की तुलना करता है।'
                  : 'Cashfree performs an automated account verification, validating account existence and comparing the beneficiary name against the Aadhaar identity name.'}
              </li>
              <li>
                <strong>{isHindi ? 'ट्रेड कौशल एवं दस्तावेज स्क्रीनिंग:' : 'Trade Skill & Document Screening:'}</strong>{' '}
                {isHindi
                  ? 'प्रशासनिक मध्यस्थ सार्वजनिक खोज अनुक्रमण से पहले अनुभव, व्यापार इतिहास और प्रमाणपत्रों की समीक्षा करते हैं।'
                  : 'Administrative moderators review experience, trade history, and certifications before public search indexing.'}
              </li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-bold text-slate-900">
              {isHindi ? 'सत्यापन अनुपालन और कॉर्पोरेट संस्था' : 'Verification Compliance & Corporate Entity'}
            </h2>
            <p>
              {isHindi
                ? 'सत्यापन प्रक्रियाएं सख्त अनुपालन दिशानिर्देशों के तहत संचालित होती हैं:'
                : 'Verification procedures are operated under strict compliance guidelines by:'}
            </p>
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1">
              <p className="font-bold text-slate-900">{COMPANY_NAME}</p>
              <p className="text-slate-700">Registered Office: {COMPANY_REGISTERED_ADDRESS}</p>
              <p className="text-slate-600 font-medium">Verification Desk Email: help@verifiedlabour.com</p>
            </div>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
