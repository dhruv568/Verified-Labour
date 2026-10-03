'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import {
  Menu,
  X,
  Shield,
  LogOut,
  ChevronDown,
} from 'lucide-react';
import LocationSelector from '@/components/LocationSelector';
import LanguageSelector from '@/components/LanguageSelector';
import Logo from '@/components/Logo';
import { useLanguage } from '@/context/LanguageContext';
import { useContent } from '@/context/ContentContext';

import { fetchWithTimeout } from '@/lib/fetch-utils';

interface HeaderProps {
  onOpenAuth?: (
    initialMode?: 'login' | 'register',
    role?: 'CUSTOMER' | 'WORKER' | 'BUSINESS'
  ) => void;
}

export default function Header({ onOpenAuth }: HeaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { t } = useLanguage();
  const { content } = useContent();
  const [sessionUser, setSessionUser] = useState<any>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  const handleHowItWorksClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    setMobileMenuOpen(false);
    if (pathname === '/') {
      e.preventDefault();
      const el = document.getElementById('how');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
        window.history.pushState(null, '', '/#how');
      }
    }
  };

  useEffect(() => {
    let isMounted = true;
    if (process.env.NODE_ENV === 'development') {
      console.log('[AUTH] started');
    }
    fetchWithTimeout('/api/auth/me', { timeoutMs: 2500 })
      .then((res) => (res.ok ? res.json() : { authenticated: false }))
      .then((data) => {
        if (isMounted) {
          if (data.authenticated) {
            setSessionUser(data.user);
          } else {
            setSessionUser(null);
          }
          if (process.env.NODE_ENV === 'development') {
            console.log('[AUTH] completed');
          }
        }
      })
      .catch(() => {
        if (isMounted) setSessionUser(null);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      setSessionUser(null);
      setUserDropdownOpen(false);
      window.location.href = '/logout';
    } catch (err) {
      console.error('Logout error:', err);
      window.location.href = '/logout';
    }
  };

  const getDashboardLink = () => {
    if (!sessionUser) return '/';
    if (sessionUser.role === 'ADMIN') return '/admin';
    if (sessionUser.role === 'WORKER') return '/worker/dashboard';
    if (sessionUser.role === 'BUSINESS') return '/business/bulk';
    return '/customer/dashboard';
  };

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs w-full">
      {content.announcement_enabled === 'true' && content.announcement_text && (
        <div className="bg-gradient-to-r from-[#082B66] via-[#1264D6] to-[#082B66] text-white py-2 px-4 text-center text-xs font-bold flex items-center justify-center gap-2 border-b border-blue-900 shadow-inner">
          <span>{content.announcement_text}</span>
        </div>
      )}
      <div className="max-w-[1440px] mx-auto px-3 sm:px-4 lg:px-6 xl:px-8 w-full">
        <div className="flex items-center justify-between h-16 sm:h-18 lg:h-20 gap-2 sm:gap-3 lg:gap-4 xl:gap-6 min-w-0">
          {/* Left: Transparent Verified Labour Logo */}
          <Link href="/" className="flex items-center gap-2 group shrink-0 min-w-0" aria-label="Verified Labour Home">
            <Logo variant="header" priority />
          </Link>

          {/* Center Navigation Links (Renders ONLY current active language from context) */}
          <nav className="hidden lg:flex items-center gap-1.5 xl:gap-3.5 2xl:gap-5 text-xs xl:text-[13px] 2xl:text-sm font-bold text-slate-700 shrink-0 min-w-0">
            <Link
              href="/"
              className="text-[#082B66] font-extrabold hover:text-[#1264D6] transition-colors whitespace-nowrap px-1 py-1 focus:outline-none focus:ring-2 focus:ring-[#1264D6] rounded-md"
            >
              {t.home}
            </Link>
            <Link
              href="/workers"
              className="hover:text-[#1264D6] transition-colors whitespace-nowrap px-1 py-1 focus:outline-none focus:ring-2 focus:ring-[#1264D6] rounded-md"
            >
              {t.findWorker}
            </Link>
            <button
              type="button"
              onClick={() => onOpenAuth?.('register', 'WORKER')}
              className="hover:text-[#079447] transition-colors text-slate-700 whitespace-nowrap px-1 py-1 focus:outline-none focus:ring-2 focus:ring-[#079447] rounded-md cursor-pointer"
            >
              {t.becomeWorker}
            </button>
            <Link
              href="/#how"
              onClick={handleHowItWorksClick}
              className="hover:text-[#1264D6] transition-colors whitespace-nowrap px-1 py-1 focus:outline-none focus:ring-2 focus:ring-[#1264D6] rounded-md"
            >
              {t.howItWorks}
            </Link>
            <Link
              href="/about"
              className="hover:text-[#1264D6] transition-colors whitespace-nowrap px-1 py-1 focus:outline-none focus:ring-2 focus:ring-[#1264D6] rounded-md"
            >
              {t.about}
            </Link>
            <Link
              href="/contact"
              className="hover:text-[#1264D6] transition-colors whitespace-nowrap px-1 py-1 focus:outline-none focus:ring-2 focus:ring-[#1264D6] rounded-md"
            >
              {t.contact}
            </Link>
          </nav>

          {/* Right Tools: Location Selector + Language Selector + Green Login + Blue Sign Up */}
          <div className="hidden md:flex items-center gap-1.5 sm:gap-2 xl:gap-3 shrink-0 min-w-0">
            <LocationSelector />
            <LanguageSelector />

            {sessionUser ? (
              <div className="relative shrink-0">
                <button
                  type="button"
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-full border border-slate-300 hover:border-[#1264D6] transition-colors text-xs font-semibold bg-white min-h-[36px] sm:min-h-[38px] h-9 sm:h-9.5 focus:outline-none focus:ring-2 focus:ring-[#1264D6]"
                  aria-expanded={userDropdownOpen}
                >
                  <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-slate-100 text-[#082B66] flex items-center justify-center font-bold text-xs shrink-0">
                    {sessionUser.customerProfile?.fullName?.[0] ||
                      sessionUser.workerProfile?.fullName?.[0] ||
                      sessionUser.phone.slice(-2)}
                  </div>
                  <span className="text-slate-800 max-w-[90px] sm:max-w-[100px] truncate font-semibold">
                    {sessionUser.customerProfile?.fullName ||
                      sessionUser.workerProfile?.fullName ||
                      sessionUser.phone}
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                </button>

                {userDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 z-50 text-xs animate-in fade-in duration-100">
                    <div className="px-4 py-2 border-b border-slate-100">
                      <p className="text-[10px] text-slate-400 font-medium">Signed in as</p>
                      <p className="font-bold text-slate-800 truncate">{sessionUser.phone}</p>
                    </div>

                    <Link
                      href={getDashboardLink()}
                      onClick={() => setUserDropdownOpen(false)}
                      className="flex items-center gap-2 px-4 py-2 hover:bg-slate-50 text-slate-700 font-semibold"
                    >
                      <Shield className="w-4 h-4 text-[#079447]" />
                      <span>Dashboard ({sessionUser.role})</span>
                    </Link>

                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2 px-4 py-2 hover:bg-red-50 text-red-600 font-semibold border-t border-slate-100 mt-1 text-left"
                    >
                      <LogOut className="w-4 h-4 text-red-500" />
                      <span>Log Out</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                {/* Green Login Button */}
                <button
                  type="button"
                  onClick={() => onOpenAuth?.('login')}
                  className="px-3.5 sm:px-4 xl:px-5 py-1.5 sm:py-2 min-h-[36px] sm:min-h-[38px] h-9 sm:h-9.5 text-xs font-bold text-white bg-[#079447] hover:bg-[#067c3b] rounded-full shadow-xs transition-colors flex items-center justify-center shrink-0 cursor-pointer whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-[#079447] focus:ring-offset-1"
                >
                  {t.login}
                </button>

                {/* Blue Sign Up Button */}
                <button
                  type="button"
                  onClick={() => onOpenAuth?.('register', 'CUSTOMER')}
                  className="px-3.5 sm:px-4 xl:px-5 py-1.5 sm:py-2 min-h-[36px] sm:min-h-[38px] h-9 sm:h-9.5 text-xs font-bold text-white bg-[#1264D6] hover:bg-blue-700 rounded-full shadow-xs transition-colors flex items-center justify-center shrink-0 cursor-pointer whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-[#1264D6] focus:ring-offset-1"
                >
                  {t.signUp}
                </button>
              </div>
            )}
          </div>

          {/* Mobile Hamburger Button */}
          <div className="flex lg:hidden items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="w-10 h-10 sm:w-11 sm:h-11 flex items-center justify-center text-slate-700 hover:text-slate-950 rounded-xl bg-slate-100 hover:bg-slate-200 focus:outline-none focus:ring-2 focus:ring-[#1264D6] transition-colors"
              aria-label="Toggle navigation menu"
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X className="w-5 h-5 sm:w-6 sm:h-6" /> : <Menu className="w-5 h-5 sm:w-6 sm:h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden py-4 border-t border-slate-100 space-y-4 animate-in fade-in duration-150">
            <div className="px-1">
              <LocationSelector isMobile={true} />
            </div>

            <div className="px-1">
              <LanguageSelector isMobile={true} />
            </div>

            <nav className="space-y-1">
              <Link
                href="/"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center min-h-[44px] px-3.5 py-2.5 text-base font-bold text-[#082B66] hover:bg-slate-50 rounded-xl transition-colors"
              >
                {t.home}
              </Link>
              <Link
                href="/workers"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center min-h-[44px] px-3.5 py-2.5 text-base font-semibold text-slate-700 hover:bg-slate-50 rounded-xl transition-colors"
              >
                {t.findWorker}
              </Link>
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenAuth?.('register', 'WORKER');
                }}
                className="w-full text-left flex items-center justify-between min-h-[44px] px-3.5 py-2.5 text-base font-bold text-[#079447] hover:bg-emerald-50 rounded-xl transition-colors"
              >
                <span>{t.becomeWorker}</span>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                  {t.earnDaily}
                </span>
              </button>
              <Link
                href="/#how"
                onClick={handleHowItWorksClick}
                className="flex items-center min-h-[44px] px-3.5 py-2.5 text-base font-semibold text-slate-700 hover:bg-slate-50 rounded-xl transition-colors"
              >
                {t.howItWorks}
              </Link>
              <Link
                href="/about"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center min-h-[44px] px-3.5 py-2.5 text-base font-semibold text-slate-700 hover:bg-slate-50 rounded-xl transition-colors"
              >
                {t.about}
              </Link>
              <Link
                href="/contact"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center min-h-[44px] px-3.5 py-2.5 text-base font-semibold text-slate-700 hover:bg-slate-50 rounded-xl transition-colors"
              >
                {t.contact}
              </Link>
            </nav>

            <div className="pt-3 border-t border-slate-100 px-1">
              {sessionUser ? (
                <div className="space-y-2">
                  <Link
                    href={getDashboardLink()}
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center justify-center min-h-[48px] w-full px-4 py-3 bg-[#082B66] text-white font-bold rounded-xl text-sm shadow-xs"
                  >
                    Dashboard ({sessionUser.role})
                  </Link>
                  <button
                    onClick={() => {
                      handleLogout();
                      setMobileMenuOpen(false);
                    }}
                    className="flex items-center justify-center min-h-[44px] w-full px-4 py-2.5 text-red-600 font-semibold text-sm hover:bg-red-50 rounded-xl"
                  >
                    Log Out
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => {
                      onOpenAuth?.('login');
                      setMobileMenuOpen(false);
                    }}
                    className="w-full min-h-[48px] px-4 py-3 text-center font-bold text-white bg-[#079447] hover:bg-[#067c3b] rounded-full text-sm shadow-xs active:scale-98 transition-all"
                  >
                    {t.login}
                  </button>
                  <button
                    onClick={() => {
                      onOpenAuth?.('register', 'CUSTOMER');
                      setMobileMenuOpen(false);
                    }}
                    className="w-full min-h-[48px] px-4 py-3 text-center font-bold text-white bg-[#1264D6] hover:bg-blue-700 rounded-full text-sm shadow-xs active:scale-98 transition-all"
                  >
                    {t.signUp}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
