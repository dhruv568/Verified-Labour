'use client';

import React, { useState } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useLanguage } from '@/context/LanguageContext';
import { Mail, Phone, MapPin, Clock, MessageSquare, CheckCircle2 } from 'lucide-react';

export default function ContactPage() {
  const { isHindi } = useLanguage();
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-[#082B66]">
      <Navbar />

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        {/* Banner */}
        <div className="bg-gradient-to-r from-[#082B66] via-[#0F3880] to-[#1264D6] rounded-3xl p-6 sm:p-10 text-white shadow-xl">
          <span className="px-3 py-1 bg-amber-400 text-[#082B66] font-black text-xs rounded-full uppercase font-devanagari">
            {isHindi ? 'सहायता एवं संपर्क' : 'Contact Support Desk'}
          </span>
          <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight mt-2">
            {isHindi ? 'हम आपकी मदद के लिए हमेशा उपलब्ध हैं' : 'We Are Here to Help You'}
          </h1>
          <p className="text-xs sm:text-sm text-blue-100 mt-1 font-medium font-devanagari">
            {isHindi
              ? 'किसी भी बुकिंग, सत्यापन या पूछताछ के लिए हमारी सहायता टीम से संपर्क करें।'
              : 'Reach out for booking support, worker onboarding queries, or business partnerships.'}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Contact Details Card */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
              <h2 className="text-lg font-black text-[#082B66]">
                {isHindi ? 'संपर्क जानकारी' : 'Direct Support Details'}
              </h2>

              <div className="space-y-4 text-xs sm:text-sm">
                <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-100">
                  <Mail className="w-5 h-5 text-[#1264D6] shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-slate-500 block text-[11px] uppercase">
                      Primary Support Email
                    </span>
                    <a href="mailto:help@verifiedlabour.com" className="font-bold text-[#1264D6] hover:underline">
                      help@verifiedlabour.com
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-100">
                  <Phone className="w-5 h-5 text-[#079447] shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-slate-500 block text-[11px] uppercase">
                      Support Helpline Numbers
                    </span>
                    <a href="tel:+919109019090" className="font-bold text-slate-900 block hover:text-[#079447]">
                      +91 9109019090 (Primary)
                    </a>
                    <a href="tel:+919369899597" className="font-medium text-slate-600 block hover:text-[#079447] mt-0.5">
                      +91 93698 99597 (Secondary)
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-100">
                  <Clock className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-slate-500 block text-[11px] uppercase">
                      Operational Hours
                    </span>
                    <span className="font-semibold text-slate-800">
                      Monday - Sunday: 8:00 AM - 9:00 PM IST
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-100">
                  <MapPin className="w-5 h-5 text-[#1264D6] shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-slate-500 block text-[11px] uppercase">
                      Registered Corporate Address
                    </span>
                    <span className="font-semibold text-slate-800">
                      Shrivastava ProFunnels Ventures Pvt Ltd<br />
                      Surat, Gujarat, India - 395007
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Form */}
          <div className="lg:col-span-7">
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-4">
              <h2 className="text-lg font-black text-[#082B66]">
                {isHindi ? 'संदेश भेजें' : 'Send a Support Message'}
              </h2>

              {submitted ? (
                <div className="p-6 bg-emerald-50 border border-emerald-200 rounded-2xl text-center space-y-2">
                  <CheckCircle2 className="w-8 h-8 text-[#079447] mx-auto" />
                  <h3 className="text-base font-bold text-emerald-900">
                    {isHindi ? 'आपका संदेश प्राप्त हो गया है!' : 'Thank you for reaching out!'}
                  </h3>
                  <p className="text-xs text-emerald-700">
                    {isHindi
                      ? 'हमारी टीम जल्द ही आपसे संपर्क करेगी (help@verifiedlabour.com)।'
                      : 'Our support team will review your message and respond shortly via help@verifiedlabour.com.'}
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4 text-xs sm:text-sm">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">
                        {isHindi ? 'आपका नाम' : 'Your Name'}
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Ramesh Kumar"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 outline-none focus:border-[#1264D6] min-h-[44px]"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">
                        {isHindi ? 'मोबाइल नंबर' : 'Phone Number'}
                      </label>
                      <input
                        type="tel"
                        required
                        placeholder="+91 9109019090"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 outline-none focus:border-[#1264D6] min-h-[44px]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      {isHindi ? 'ईमेल पता' : 'Email Address'}
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="name@example.com"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 outline-none focus:border-[#1264D6] min-h-[44px]"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      {isHindi ? 'विवरण / संदेश' : 'Message Details'}
                    </label>
                    <textarea
                      rows={4}
                      required
                      placeholder={
                        isHindi
                          ? 'कृपया अपना प्रश्न या फीडबैक दर्ज करें...'
                          : 'Describe your query or feedback here...'
                      }
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 outline-none focus:border-[#1264D6] resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3.5 bg-[#079447] hover:bg-[#067c3b] text-white font-black text-xs sm:text-sm rounded-xl shadow-md transition-all font-devanagari"
                  >
                    {isHindi ? 'संदेश भेजें' : 'Submit Message'}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
