'use client';

import React from 'react';
import Link from 'next/link';
import {
  Facebook,
  Instagram,
  Mail,
  Phone,
  MapPin,
  ExternalLink,
  Home,
  Search,
  Briefcase,
  HelpCircle,
  Building2,
  FileText,
  ShieldCheck,
  RotateCcw,
  BadgeCheck,
  LifeBuoy,
  Headphones,
} from 'lucide-react';
import Logo from '@/components/Logo';
import { useContent } from '@/context/ContentContext';

export default function Footer() {
  const { content } = useContent();
  return (
    <footer className="bg-white text-slate-600 pt-12 sm:pt-16 pb-8 border-t border-slate-200 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-8 xl:gap-10 pb-10 sm:pb-12 border-b border-slate-200">
          {/* Column 1: Brand & Identity */}
          <div className="space-y-4 sm:col-span-2 lg:col-span-1">
            <Link href="/" className="flex items-center gap-2 group" aria-label="Verified Labour Home">
              <Logo variant="footer" />
            </Link>

            <p className="text-xs text-slate-500 leading-relaxed font-normal">
              {content.footer_text ||
                "India's trusted on-demand local skilled labour marketplace. Connecting customers and businesses with Aadhaar KYC verified & bank-validated craftsmen."}
            </p>
          </div>

          {/* Column 2: Quick Links */}
          <div>
            <h4 className="text-xs font-bold text-[#0F2A5F] uppercase tracking-wider mb-3 font-devanagari">
              त्वरित लिंक / Quick Links
            </h4>
            <ul className="space-y-2 text-sm sm:text-xs font-semibold text-slate-600 font-devanagari">
              <li>
                <Link href="/" className="inline-flex items-center gap-2 py-1 hover:text-[#1464D2] transition-colors group">
                  <Home className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#1464D2] transition-colors shrink-0" />
                  <span>होम / Home</span>
                </Link>
              </li>
              <li>
                <Link href="/workers" className="inline-flex items-center gap-2 py-1 hover:text-[#1464D2] transition-colors group">
                  <Search className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#1464D2] transition-colors shrink-0" />
                  <span>कामगार खोजें / Find a Worker</span>
                </Link>
              </li>
              <li>
                <Link href="/worker/onboarding" className="inline-flex items-center gap-2 py-1 hover:text-[#0B9B5A] transition-colors group">
                  <Briefcase className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#0B9B5A] transition-colors shrink-0" />
                  <span>कामगार बनें / Become a Worker</span>
                </Link>
              </li>
              <li>
                <a href="/#how" className="inline-flex items-center gap-2 py-1 hover:text-[#1464D2] transition-colors group">
                  <HelpCircle className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#1464D2] transition-colors shrink-0" />
                  <span>यह कैसे काम करता है? / How It Works</span>
                </a>
              </li>
              <li>
                <Link href="/business/bulk" className="inline-flex items-center gap-2 py-1 hover:text-[#1464D2] transition-colors group">
                  <Building2 className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#1464D2] transition-colors shrink-0" />
                  <span>थोक कामगार पोर्टल / Bulk Labour Portal</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Support & Legal */}
          <div>
            <h4 className="text-xs font-bold text-[#0F2A5F] uppercase tracking-wider mb-3 font-devanagari">
              सहायता एवं कानूनी / Support & Legal
            </h4>
            <ul className="space-y-2 text-sm sm:text-xs font-semibold text-slate-600 font-devanagari">
              <li>
                <Link href="/legal/terms" className="inline-flex items-center gap-2 py-1 hover:text-[#1464D2] transition-colors group">
                  <FileText className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#1464D2] transition-colors shrink-0" />
                  <span>नियम व शर्तें / Terms & Conditions</span>
                </Link>
              </li>
              <li>
                <Link href="/legal/privacy" className="inline-flex items-center gap-2 py-1 hover:text-[#1464D2] transition-colors group">
                  <ShieldCheck className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#1464D2] transition-colors shrink-0" />
                  <span>गोपनीयता नीति / Privacy Policy</span>
                </Link>
              </li>
              <li>
                <Link href="/legal/cancellation-refund" className="inline-flex items-center gap-2 py-1 hover:text-[#1464D2] transition-colors group">
                  <RotateCcw className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#1464D2] transition-colors shrink-0" />
                  <span>रिफंड नीति / Refund Policy</span>
                </Link>
              </li>
              <li>
                <Link href="/legal/verification" className="inline-flex items-center gap-2 py-1 hover:text-[#1464D2] transition-colors group">
                  <BadgeCheck className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#1464D2] transition-colors shrink-0" />
                  <span>आधार सत्यापन नीति / Verification Policy</span>
                </Link>
              </li>
              <li>
                <Link href="/legal/safety" className="inline-flex items-center gap-2 py-1 hover:text-[#1464D2] transition-colors group">
                  <LifeBuoy className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#1464D2] transition-colors shrink-0" />
                  <span>शिकायत निवारण / Grievance Redressal</span>
                </Link>
              </li>
              <li>
                <Link href="/contact" className="inline-flex items-center gap-2 py-1 hover:text-[#1464D2] transition-colors group">
                  <Headphones className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#1464D2] transition-colors shrink-0" />
                  <span>संपर्क करें / Contact Us</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 4: Follow Us */}
          <div>
            <h4 className="text-xs font-bold text-[#0F2A5F] uppercase tracking-wider mb-3.5 font-devanagari">
              हमें फॉलो करें / Follow Us
            </h4>
            <div className="flex items-center gap-3">
              <a
                href={content.social_facebook || "https://facebook.com"}
                target="_blank"
                rel="noreferrer"
                aria-label="Facebook"
                className="w-10 h-10 rounded-full bg-[#1877F2] text-white flex items-center justify-center hover:opacity-90 active:scale-95 transition-all shadow-xs"
              >
                <Facebook className="w-4 h-4 fill-white text-transparent" />
              </a>
              <a
                href={content.social_instagram || "https://instagram.com"}
                target="_blank"
                rel="noreferrer"
                aria-label="Instagram"
                className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#F58529] via-[#DD2A7B] to-[#8134AF] text-white flex items-center justify-center hover:opacity-90 active:scale-95 transition-all shadow-xs"
              >
                <Instagram className="w-4 h-4" />
              </a>
              <a
                href={content.social_whatsapp || "https://wa.me/919109019090"}
                target="_blank"
                rel="noreferrer"
                aria-label="WhatsApp"
                className="w-10 h-10 rounded-full bg-[#25D366] text-white flex items-center justify-center hover:opacity-90 active:scale-95 transition-all shadow-xs"
              >
                <svg className="w-4 h-4 fill-current text-white" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.99c-.002 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                </svg>
              </a>
            </div>

            <div className="mt-4 pt-3 text-xs text-slate-500 space-y-1.5">
              <p className="font-semibold text-slate-700">Support Desk:</p>
              <p className="text-xs sm:text-[11px] flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>{content.contact_email || 'help@verifiedlabour.com'}</span>
              </p>
              <p className="text-xs sm:text-[11px] flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>{content.contact_phone || '+91 9109019090'}</span>
              </p>
            </div>
          </div>

          {/* Column 5: Download Our App */}
          <div>
            <h4 className="text-xs font-bold text-[#0F2A5F] uppercase tracking-wider mb-3.5 font-devanagari">
              ऐप डाउनलोड करें / Download App
            </h4>
            <div className="flex flex-row sm:flex-col gap-2.5 flex-wrap">
              {/* Google Play Button */}
              <Link
                href="/app-coming-soon?platform=android"
                aria-label="Google Play Store - Coming Soon"
                className="bg-black text-white px-4 py-2 rounded-xl flex items-center gap-2.5 border border-slate-800 shadow-2xs cursor-pointer hover:bg-slate-900 active:scale-95 transition-all group"
              >
                <svg className="w-5 h-5 fill-current shrink-0 text-white group-hover:text-emerald-400 transition-colors" viewBox="0 0 24 24">
                  <path d="M3.609 1.814L13.792 12 3.61 22.186a1.996 1.996 0 0 1-.61-1.464V3.278c0-.573.23-1.096.609-1.464zm11.597 11.599L17.75 16l-12.72 7.34 10.176-9.927zm2.544-2.545l3.586 2.07a1.442 1.442 0 0 1 0 2.502l-3.586 2.07-2.128-2.321 2.128-2.321zM5.03 2.062L17.75 9.4 15.206 12 5.03 2.062z" />
                </svg>
                <div className="text-left">
                  <span className="text-[8px] uppercase tracking-wider block font-semibold text-slate-400 leading-none">
                    Get it on
                  </span>
                  <span className="text-xs font-bold text-white leading-tight">
                    Google Play
                  </span>
                </div>
              </Link>

              {/* App Store Button */}
              <Link
                href="/app-coming-soon?platform=ios"
                aria-label="Apple App Store - Coming Soon"
                className="bg-black text-white px-4 py-2 rounded-xl flex items-center gap-2.5 border border-slate-800 shadow-2xs cursor-pointer hover:bg-slate-900 active:scale-95 transition-all group"
              >
                <svg className="w-5 h-5 fill-current shrink-0 text-white group-hover:text-sky-400 transition-colors" viewBox="0 0 24 24">
                  <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.47c.66-.82 1.11-1.96.99-3.1-.96.04-2.13.64-2.82 1.45-.61.71-1.15 1.87-1.01 2.98 1.07.08 2.18-.51 2.84-1.33z" />
                </svg>
                <div className="text-left">
                  <span className="text-[8px] uppercase tracking-wider block font-semibold text-slate-400 leading-none">
                    Download on the
                  </span>
                  <span className="text-xs font-bold text-white leading-tight">
                    App Store
                  </span>
                </div>
              </Link>
            </div>
          </div>
        </div>

        {/* Bottom Bar matching Reference */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-3 font-medium text-center sm:text-left">
          <p>© 2026 Verified Labour. All rights reserved.</p>
          <div className="flex flex-col items-center sm:items-start text-center sm:text-left">
            <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold leading-tight">
              Parent Company
            </span>
            <span className="text-xs sm:text-sm font-extrabold text-slate-700 tracking-tight leading-snug">
              Shrivastava ProFunnels Ventures Pvt Ltd
            </span>
          </div>
          <p>
            Powered by{' '}
            <a
              href="https://myprofunnels.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-brand-600 transition-colors font-semibold text-slate-600 underline"
            >
              MyProFunnels ❤️
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
