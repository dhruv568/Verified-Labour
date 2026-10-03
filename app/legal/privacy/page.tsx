'use client';

import React from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useLanguage } from '@/context/LanguageContext';
import { COMPANY_NAME, COMPANY_REGISTERED_ADDRESS } from '@/lib/company-info';

export default function PrivacyPolicyPage() {
  const { isHindi } = useLanguage();

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 font-devanagari">
      <Navbar />

      <main className="max-w-4xl mx-auto px-4 py-12 flex-1">
        <div className="bg-white rounded-3xl p-8 sm:p-12 border border-slate-200 shadow-sm space-y-6 text-sm text-slate-700 leading-relaxed">
          <h1 className="text-3xl font-black text-slate-900">
            {isHindi ? 'गोपनीयता एवं आधार डेटा नीति' : 'Privacy & Aadhaar Data Policy'}
          </h1>
          <p className="text-xs text-slate-400">
            {isHindi ? 'अंतिम अपडेट: सितंबर 2026' : 'Last updated: September 2026'}
          </p>

          <section className="space-y-2">
            <h2 className="text-lg font-bold text-slate-900">
              {isHindi ? '1. सख्त आधार गोपनीयता संरचना' : '1. Strict Aadhaar Privacy Architecture'}
            </h2>
            <p>
              {isHindi
                ? 'Verified Labour आधार अधिनियम, 2016 और UIDAI दिशानिर्देशों का सख्ती से पालन करता है। आधार सत्यापन Cashfree सुरक्षित ID सहमति-आधारित OTP फ़्लो के माध्यम से संसाधित किया जाता है। किसी भी परिस्थिति में Verified Labour कच्चे 12-अंकीय आधार नंबरों को संग्रहीत नहीं करता है और न ही बिना मास्क किए आधार पहचानकर्ताओं को सार्वजनिक रूप से या अनधिकृत कर्मचारियों के सामने प्रकट करता है। केवल मास्क किए गए पहचानकर्ता (उदा., XXXXXXXX8291) और सत्यापन स्थिति टोकन ही बनाए रखे जाते हैं।'
                : 'Verified Labour strictly complies with the Aadhaar Act, 2016 and UIDAI guidelines. Aadhaar verification is processed via Cashfree Secure ID consent-based OTP flow. Under no circumstances does Verified Labour store raw 12-digit Aadhaar numbers or expose unmasked Aadhaar identifiers publicly or to unauthorized staff. Only masked identifiers (e.g., XXXXXXXX8291) and verification status tokens are retained.'}
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-bold text-slate-900">
              {isHindi ? '2. वित्तीय और बैंक विवरण सुरक्षा' : '2. Financial & Bank Details Security'}
            </h2>
            <p>
              {isHindi
                ? 'कुशल कामगारों द्वारा दर्ज किए गए बैंक खातों को Cashfree बैंक खाता सत्यापन के माध्यम से मान्य किया जाता है। सभी उपयोगकर्ता इंटरफेस में खाता संख्या को मास्क किया जाता है (उदा., XXXXXXXX4512)। Cashfree पेमेंट्स के माध्यम से संसाधित भुगतान लेनदेन PCI-DSS अनुपालन प्रोटोकॉल का पालन करते हैं।'
                : 'Bank accounts entered by skilled workers are validated via Cashfree Bank Account Verification. Account numbers are masked in all user interfaces (e.g., XXXXXXXX4512). Payment transactions processed via Cashfree Payments follow PCI-DSS compliant protocols.'}
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-bold text-slate-900">
              {isHindi ? '3. कामगार जियोलोकेशन गोपनीयता' : '3. Worker Geolocation Privacy'}
            </h2>
            <p>
              {isHindi
                ? 'किसी कामगार के सटीक वास्तविक समय या आवासीय निर्देशांक कभी भी सार्वजनिक रूप से प्रसारित नहीं किए जाते हैं। प्लेटफॉर्म हावर्सिन फॉर्मूले का उपयोग करके सर्वर-साइड निकटता की गणना करता है और संभावित ग्राहकों को केवल अनुमानित दूरी (उदा., "2.4 किमी दूर") और नामित शहर सेवा क्षेत्र ही प्रदर्शित करता है।'
                : 'A worker\'s exact real-time or residential coordinates are never broadcast publicly. The platform computes server-side proximity using the Haversine formula and displays only approximate distances (e.g., "2.4 km away") and designated city service areas to prospective customers.'}
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-bold text-slate-900">
              {isHindi ? '4. शिकायत अधिकारी और कॉर्पोरेट विवरण' : '4. Grievance Officer & Corporate Details'}
            </h2>
            <p>
              {isHindi
                ? 'गोपनीयता पूछताछ या डेटा अधिकारों के अनुरोध के लिए, हमारे डेटा सुरक्षा अधिकारी से संपर्क करें:'
                : 'For privacy inquiries or data rights requests, contact our Data Protection Officer at:'}
              <br />
              <strong>Email:</strong> <a href="mailto:help@verifiedlabour.com" className="text-[#1264D6] hover:underline font-bold">help@verifiedlabour.com</a> • <strong>Phone:</strong> <a href="tel:+919109019090" className="text-slate-900 hover:underline font-bold">+91 9109019090</a>
            </p>
            <div className="mt-3 p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1">
              <p className="font-bold text-slate-900">{COMPANY_NAME}</p>
              <p className="text-slate-700">Registered Office: {COMPANY_REGISTERED_ADDRESS}</p>
            </div>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
