'use client';

import React from 'react';
import Link from 'next/link';
import {
  Facebook,
  Instagram,
  Youtube,
  Linkedin,
  Mail,
  Phone,
  MapPin,
  ExternalLink,
} from 'lucide-react';
import Logo from '@/components/Logo';

export default function Footer() {
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
              India's trusted on-demand local skilled labour marketplace. Connecting customers and
              businesses with Aadhaar KYC verified & bank-validated craftsmen.
            </p>
          </div>

          {/* Column 2: Quick Links */}
          <div>
            <h4 className="text-xs font-bold text-[#0F2A5F] uppercase tracking-wider mb-3">
              Quick Links
            </h4>
            <ul className="space-y-2 text-sm sm:text-xs font-semibold text-slate-600">
              <li>
                <Link href="/" className="inline-block py-1 hover:text-[#1464D2] transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <a href="/#workers" className="inline-block py-1 hover:text-[#1464D2] transition-colors">
                  Find a Worker
                </a>
              </li>
              <li>
                <Link href="/worker/onboarding" className="inline-block py-1 hover:text-[#0B9B5A] transition-colors">
                  Become a Worker
                </Link>
              </li>
              <li>
                <a href="/#how" className="inline-block py-1 hover:text-[#1464D2] transition-colors">
                  How It Works
                </a>
              </li>
              <li>
                <Link href="/business/bulk" className="inline-block py-1 hover:text-[#1464D2] transition-colors">
                  Bulk Labour Portal
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Support & Legal */}
          <div>
            <h4 className="text-xs font-bold text-[#0F2A5F] uppercase tracking-wider mb-3">
              Support & Legal
            </h4>
            <ul className="space-y-2 text-sm sm:text-xs font-semibold text-slate-600">
              <li>
                <Link href="/legal/terms" className="inline-block py-1 hover:text-[#1464D2] transition-colors">
                  Terms & Conditions
                </Link>
              </li>
              <li>
                <Link href="/legal/privacy" className="inline-block py-1 hover:text-[#1464D2] transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/legal/cancellation-refund" className="inline-block py-1 hover:text-[#1464D2] transition-colors">
                  Refund Policy
                </Link>
              </li>
              <li>
                <Link href="/legal/verification" className="inline-block py-1 hover:text-[#1464D2] transition-colors">
                  Aadhaar Verification Policy
                </Link>
              </li>
              <li>
                <Link href="/legal/safety" className="inline-block py-1 hover:text-[#1464D2] transition-colors">
                  Grievance Redressal
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 4: Follow Us */}
          <div>
            <h4 className="text-xs font-bold text-[#0F2A5F] uppercase tracking-wider mb-3.5">
              Follow Us
            </h4>
            <div className="flex items-center gap-3">
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noreferrer"
                aria-label="Facebook"
                className="w-10 h-10 rounded-full bg-[#1877F2] text-white flex items-center justify-center hover:opacity-90 active:scale-95 transition-all shadow-xs"
              >
                <Facebook className="w-4 h-4 fill-white text-transparent" />
              </a>
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noreferrer"
                aria-label="Instagram"
                className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#F58529] via-[#DD2A7B] to-[#8134AF] text-white flex items-center justify-center hover:opacity-90 active:scale-95 transition-all shadow-xs"
              >
                <Instagram className="w-4 h-4" />
              </a>
              <a
                href="https://youtube.com"
                target="_blank"
                rel="noreferrer"
                aria-label="YouTube"
                className="w-10 h-10 rounded-full bg-[#FF0000] text-white flex items-center justify-center hover:opacity-90 active:scale-95 transition-all shadow-xs"
              >
                <Youtube className="w-4 h-4 fill-white text-transparent" />
              </a>
              <a
                href="https://linkedin.com"
                target="_blank"
                rel="noreferrer"
                aria-label="LinkedIn"
                className="w-10 h-10 rounded-full bg-[#0A66C2] text-white flex items-center justify-center hover:opacity-90 active:scale-95 transition-all shadow-xs"
              >
                <Linkedin className="w-4 h-4 fill-white text-transparent" />
              </a>
            </div>

            <div className="mt-4 pt-3 text-xs text-slate-500 space-y-1">
              <p className="font-semibold text-slate-700">Support Desk:</p>
              <p className="text-xs sm:text-[11px]">support@verifiedlabour.com</p>
              <p className="text-xs sm:text-[11px]">+91 99999 99999</p>
            </div>
          </div>

          {/* Column 5: Download Our App */}
          <div>
            <h4 className="text-xs font-bold text-[#0F2A5F] uppercase tracking-wider mb-3.5">
              Download Our App
            </h4>
            <div className="flex flex-row sm:flex-col gap-2.5 flex-wrap">
              {/* Google Play Button */}
              <div className="bg-black text-white px-4 py-2 rounded-xl flex items-center gap-2.5 border border-slate-800 shadow-2xs cursor-pointer hover:bg-slate-900 active:scale-95 transition-all">
                <svg className="w-5 h-5 fill-current shrink-0" viewBox="0 0 24 24">
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
              </div>

              {/* App Store Button */}
              <div className="bg-black text-white px-4 py-2 rounded-xl flex items-center gap-2.5 border border-slate-800 shadow-2xs cursor-pointer hover:bg-slate-900 active:scale-95 transition-all">
                <svg className="w-5 h-5 fill-current shrink-0" viewBox="0 0 24 24">
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
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar matching Reference */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-2 font-medium text-center sm:text-left">
          <p>© 2025 Verified Labour. All rights reserved.</p>
          <p className="text-slate-600 font-semibold">
            Skilled People. Stronger Communities. A Better India.
          </p>
        </div>
      </div>
    </footer>
  );
}
