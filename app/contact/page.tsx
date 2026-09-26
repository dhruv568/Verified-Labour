'use client';

import React, { useState } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useLanguage } from '@/context/LanguageContext';
import { useContent } from '@/context/ContentContext';
import { Mail, Phone, MapPin, Clock, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

export default function ContactPage() {
  const { isHindi } = useLanguage();
  const { content } = useContent();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const contactEmail = content.contact_email || 'help@verifiedlabour.com';
  const contactPhone = content.contact_phone || '+91 9109019090';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      const res = await fetch('/api/contact/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          phone,
          subject: subject || 'General Support Inquiry',
          message,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to submit contact message');
      }

      setSuccessMsg(data.message || (isHindi ? 'आपका संदेश सफलतापूर्वक भेज दिया गया है।' : 'Your message has been sent successfully.'));
      setName('');
      setEmail('');
      setPhone('');
      setSubject('');
      setMessage('');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-[#082B66]">
      <Navbar />

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        {/* Banner */}
        <div className="bg-gradient-to-r from-[#082B66] via-[#0F3880] to-[#1264D6] rounded-3xl p-6 sm:p-10 text-white shadow-xl">
          <span className="px-3.5 py-1 bg-amber-400 text-[#082B66] font-black text-xs rounded-full uppercase font-devanagari tracking-wider inline-block">
            {isHindi ? 'संपर्क करें / Contact Us' : 'Contact Us / संपर्क करें'}
          </span>
          <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight mt-2 font-devanagari">
            {isHindi ? 'हम आपकी मदद के लिए यहां हैं' : "We're Here to Help You"}
          </h1>
          <p className="text-xs sm:text-sm text-blue-100 mt-1 font-medium font-devanagari">
            {isHindi
              ? 'किसी भी बुकिंग, सत्यापन या पूछताछ के लिए हमारी सहायता टीम से संपर्क करें।'
              : 'Reach out for booking support, worker onboarding queries, or partnerships.'}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Contact Details Card */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
              <h2 className="text-lg font-black text-[#082B66] font-devanagari">
                {isHindi ? 'संपर्क जानकारी / Contact Details' : 'Direct Support Details'}
              </h2>

              <div className="space-y-4 text-xs sm:text-sm">
                <div className="flex items-start gap-3 p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
                  <Mail className="w-5 h-5 text-[#1264D6] shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-slate-500 block text-[11px] uppercase">
                      Support Email / सहायता ईमेल
                    </span>
                    <a href={`mailto:${contactEmail}`} className="font-bold text-[#1264D6] hover:underline text-sm">
                      {contactEmail}
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
                  <Phone className="w-5 h-5 text-[#079447] shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-slate-500 block text-[11px] uppercase">
                      Helpline Number / हेल्पलाइन
                    </span>
                    <a href={`tel:${contactPhone.replace(/\s+/g, '')}`} className="font-bold text-slate-900 block hover:text-[#079447] text-sm">
                      {contactPhone}
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
                  <Clock className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-slate-500 block text-[11px] uppercase">
                      Operating Hours / कार्य समय
                    </span>
                    <span className="font-semibold text-slate-800">
                      {content.contact_hours || 'Monday - Sunday: 8:00 AM - 9:00 PM IST'}
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
                  <MapPin className="w-5 h-5 text-[#1264D6] shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-slate-500 block text-[11px] uppercase">
                      Corporate Address / कॉर्पोरेट पता
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
              <h2 className="text-lg font-black text-[#082B66] font-devanagari">
                {isHindi ? 'संदेश भेजें / Send Message' : 'Send a Support Message'}
              </h2>

              {successMsg && (
                <div className="p-5 bg-emerald-50 border border-emerald-200 rounded-2xl text-center space-y-2 animate-in fade-in duration-200">
                  <CheckCircle2 className="w-8 h-8 text-[#079447] mx-auto" />
                  <h3 className="text-base font-bold text-emerald-900 font-devanagari">
                    {successMsg}
                  </h3>
                  <p className="text-xs text-emerald-700">
                    {isHindi
                      ? `हमारी सहायता टीम जल्द ही आपसे संपर्क करेगी (${contactEmail})।`
                      : `Our support team will review your message and respond shortly via ${contactEmail}.`}
                  </p>
                </div>
              )}

              {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-xs text-red-700 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4 text-xs sm:text-sm">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1 font-devanagari">
                      नाम / Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Ramesh Kumar"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 outline-none focus:ring-2 focus:ring-[#1264D6] min-h-[44px]"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1 font-devanagari">
                      मोबाइल नंबर / Phone Number <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+91 9109019090"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 outline-none focus:ring-2 focus:ring-[#1264D6] min-h-[44px]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1 font-devanagari">
                    ईमेल पता / Email Address <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 outline-none focus:ring-2 focus:ring-[#1264D6] min-h-[44px]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1 font-devanagari">
                    विषय / Subject
                  </label>
                  <input
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="e.g. Worker Booking Query / Booking Support"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 outline-none focus:ring-2 focus:ring-[#1264D6] min-h-[44px]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1 font-devanagari">
                    संदेश / Message <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    rows={4}
                    required
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder={
                      isHindi
                        ? 'कृपया अपना प्रश्न या सहायता विवरण दर्ज करें (कम से कम 10 अक्षर)...'
                        : 'Describe your query or feedback here (min 10 characters)...'
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 outline-none focus:ring-2 focus:ring-[#1264D6] resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 bg-[#079447] hover:bg-[#067c3b] active:scale-98 disabled:opacity-50 text-white font-black text-xs sm:text-sm rounded-xl shadow-md transition-all font-devanagari flex items-center justify-center min-h-[48px]"
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      संदेश भेजा जा रहा है... / Sending...
                    </span>
                  ) : (
                    <span>संदेश भेजें / Send Message</span>
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
