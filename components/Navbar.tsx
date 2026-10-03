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
import LocationSelector from './LocationSelector';
import LanguageSelector from './LanguageSelector';
import Logo from '@/components/Logo';
import { useLanguage } from '@/context/LanguageContext';
import { fetchWithTimeout } from '@/lib/fetch-utils';
import WorkerBookingAlertModal from '@/components/WorkerBookingAlertModal';

interface NavbarProps {
  onOpenAuth?: (
    initialMode?: 'login' | 'register',
    role?: 'CUSTOMER' | 'WORKER' | 'BUSINESS'
  ) => void;
}

export default function Navbar({ onOpenAuth }: NavbarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { t } = useLanguage();
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
      <div className="max-w-7xl mx-auto px-3 sm:px-5 lg:px-6 xl:px-8 w-full">
        <div className="flex items-center justify-between h-16 sm:h-18 lg:h-20 gap-2 sm:gap-3 lg:gap-4 xl:gap-6 min-w-0">
          {/* Brand Logo */}
          <Link href="/" className="flex items-center gap-2 group shrink-0 min-w-0" aria-label="Verified Labour Home">
            <Logo variant="header" priority />
          </Link>

          {/* Desktop Nav Links (Renders ONLY active language) */}
          <nav className="hidden lg:flex items-center gap-2 xl:gap-4 2xl:gap-6 text-xs xl:text-[13px] 2xl:text-sm font-semibold text-slate-700 min-w-0 shrink">
            <Link
              href="/"
              className="text-slate-800 hover:text-[#1464D2] transition-colors font-bold whitespace-nowrap px-1 py-1 focus:outline-none focus:ring-2 focus:ring-[#1464D2] rounded-md"
            >
              {t.home}
            </Link>
            <Link
              href="/workers"
              className="hover:text-[#1464D2] transition-colors whitespace-nowrap px-1 py-1 focus:outline-none focus:ring-2 focus:ring-[#1464D2] rounded-md"
            >
              {t.findWorker}
            </Link>
            <button
              type="button"
              onClick={() => onOpenAuth?.('register', 'WORKER')}
              className="hover:text-[#0B9B5A] transition-colors text-slate-700 whitespace-nowrap px-1 py-1 focus:outline-none focus:ring-2 focus:ring-[#0B9B5A] rounded-md cursor-pointer"
            >
              {t.becomeWorker}
            </button>
            <Link
              href="/#how"
              onClick={handleHowItWorksClick}
              className="hover:text-[#1464D2] transition-colors whitespace-nowrap px-1 py-1 focus:outline-none focus:ring-2 focus:ring-[#1464D2] rounded-md"
            >
              {t.howItWorks}
            </Link>
            <Link
              href="/about"
              className="hover:text-[#1464D2] transition-colors whitespace-nowrap px-1 py-1 focus:outline-none focus:ring-2 focus:ring-[#1464D2] rounded-md"
            >
              {t.about}
            </Link>
            <Link
              href="/contact"
              className="hover:text-[#1464D2] transition-colors whitespace-nowrap px-1 py-1 focus:outline-none focus:ring-2 focus:ring-[#1464D2] rounded-md"
            >
              {t.contact}
            </Link>
          </nav>

          {/* Right Action Area: Location + Language + Auth */}
          <div className="hidden md:flex items-center gap-1.5 sm:gap-2 xl:gap-3 shrink-0 min-w-0">
            <LocationSelector />
            <LanguageSelector />

            {sessionUser ? (
              <div className="relative shrink-0">
                <button
                  type="button"
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-full border border-slate-300 hover:border-[#1464D2] transition-colors text-xs font-semibold bg-white min-h-[36px] sm:min-h-[38px] h-9 sm:h-9.5 focus:outline-none focus:ring-2 focus:ring-[#1464D2]"
                  aria-expanded={userDropdownOpen}
                >
                  <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-slate-100 text-[#0F2A5F] flex items-center justify-center font-bold text-xs shrink-0">
                    {sessionUser.customerProfile?.fullName?.[0] ||
                      sessionUser.workerProfile?.fullName?.[0] ||
                      sessionUser.phone.slice(-2)}
                  </div>
                  <span className="text-slate-800 font-semibold max-w-[90px] sm:max-w-[110px] truncate text-xs">
                    {sessionUser.customerProfile?.fullName ||
                      sessionUser.workerProfile?.fullName ||
                      sessionUser.phone}
                  </span>
                  <span className="text-[10px] px-1.5 sm:px-2 py-0.5 rounded-full bg-brand-50 text-[#0B9B5A] border border-brand-200 uppercase font-mono font-bold shrink-0">
                    {sessionUser.role}
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                </button>

                {userDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-2xl border border-slate-100 py-2 z-50 text-sm animate-in fade-in zoom-in-95 duration-100 font-devanagari">
                    <div className="px-4 py-2.5 border-b border-slate-100">
                      <p className="text-[11px] text-slate-400 font-medium">{t.signedInAs}</p>
                      <p className="font-bold text-slate-800 truncate text-xs">{sessionUser.phone}</p>
                    </div>

                    <Link
                      href={getDashboardLink()}
                      onClick={() => setUserDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2.5 hover:bg-slate-50 text-slate-700 font-semibold text-xs transition-colors"
                    >
                      <Shield className="w-4 h-4 text-[#0B9B5A]" />
                      <span>
                        {sessionUser.role === 'ADMIN'
                          ? t.adminOps
                          : sessionUser.role === 'WORKER'
                          ? t.workerDashboard
                          : sessionUser.role === 'BUSINESS'
                          ? t.businessPortal
                          : t.customerDashboard}
                      </span>
                    </Link>

                    {sessionUser.role === 'WORKER' && (
                      <Link
                        href="/worker/earnings"
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2 hover:bg-slate-50 text-slate-700 font-semibold text-xs transition-colors"
                      >
                        <span className="text-[#0B9B5A] font-bold">₹</span>
                        <span>{t.myEarnings}</span>
                      </Link>
                    )}

                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2.5 px-4 py-2 hover:bg-red-50 text-red-600 font-semibold text-xs border-t border-slate-100 mt-1 text-left transition-colors"
                    >
                      <LogOut className="w-4 h-4 text-red-500" />
                      <span>{t.logOut}</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-1.5 sm:gap-2 font-devanagari shrink-0">
                {/* Login Button */}
                <button
                  type="button"
                  onClick={() => onOpenAuth?.('login')}
                  className="px-3.5 sm:px-4 xl:px-5 py-1.5 sm:py-2 min-h-[36px] sm:min-h-[38px] h-9 sm:h-9.5 text-xs font-bold text-white bg-[#0B9B5A] hover:bg-[#08783b] rounded-full shadow-xs transition-all flex items-center justify-center shrink-0 cursor-pointer whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-[#0B9B5A] focus:ring-offset-1"
                >
                  {t.login}
                </button>

                {/* Sign Up Button */}
                <button
                  type="button"
                  onClick={() => onOpenAuth?.('register', 'CUSTOMER')}
                  className="px-3.5 sm:px-4 xl:px-5 py-1.5 sm:py-2 min-h-[36px] sm:min-h-[38px] h-9 sm:h-9.5 text-xs font-bold text-white bg-[#1464D2] hover:bg-blue-700 rounded-full shadow-xs transition-all flex items-center justify-center shrink-0 cursor-pointer whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-[#1464D2] focus:ring-offset-1"
                >
                  {t.signUp}
                </button>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="flex lg:hidden items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="w-10 h-10 sm:w-11 sm:h-11 flex items-center justify-center text-slate-700 hover:text-slate-950 rounded-xl bg-slate-100 hover:bg-slate-200 focus:outline-none focus:ring-2 focus:ring-[#1464D2] transition-colors"
              aria-label="Toggle Navigation Menu"
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? (
                <X className="w-5 h-5 sm:w-6 sm:h-6 text-slate-800" />
              ) : (
                <Menu className="w-5 h-5 sm:w-6 sm:h-6 text-slate-800" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden py-4 border-t border-slate-100 space-y-4 animate-in fade-in duration-150">
            <div className="px-1">
              <LocationSelector isMobile={true} />
            </div>

            <div className="px-1">
              <LanguageSelector isMobile={true} />
            </div>

            <nav className="space-y-1 font-devanagari">
              <Link
                href="/"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center min-h-[44px] px-3.5 py-2.5 text-base font-bold text-[#0F2A5F] hover:bg-slate-50 rounded-xl transition-colors"
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
                className="w-full text-left flex items-center justify-between min-h-[44px] px-3.5 py-2.5 text-base font-bold text-[#0B9B5A] hover:bg-brand-50/50 rounded-xl transition-colors"
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

            <div className="pt-3 border-t border-slate-100 px-1 font-devanagari">
              {sessionUser ? (
                <div className="space-y-2">
                  <Link
                    href={getDashboardLink()}
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center justify-center min-h-[48px] w-full px-4 py-3 bg-[#0F2A5F] text-white font-bold rounded-xl shadow-xs text-sm"
                  >
                    {sessionUser.role === 'ADMIN'
                      ? t.adminOps
                      : sessionUser.role === 'WORKER'
                      ? t.workerDashboard
                      : sessionUser.role === 'BUSINESS'
                      ? t.businessPortal
                      : t.customerDashboard}
                  </Link>

                  {sessionUser.role === 'WORKER' && (
                    <Link
                      href="/worker/earnings"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center justify-center min-h-[44px] w-full px-4 py-2.5 bg-emerald-50 text-[#0B9B5A] font-bold rounded-xl text-sm border border-emerald-200"
                    >
                      <span>₹ {t.myEarnings}</span>
                    </Link>
                  )}

                  <button
                    onClick={() => {
                      handleLogout();
                      setMobileMenuOpen(false);
                    }}
                    className="flex items-center justify-center min-h-[44px] w-full px-4 py-2 text-red-600 font-semibold text-sm hover:bg-red-50 rounded-xl"
                  >
                    {t.logOut}
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => {
                      onOpenAuth?.('login');
                      setMobileMenuOpen(false);
                    }}
                    className="w-full min-h-[48px] px-4 py-3 text-center font-bold text-white bg-[#0B9B5A] hover:bg-[#08783b] rounded-full text-sm shadow-xs active:scale-98 transition-colors"
                  >
                    {t.login}
                  </button>
                  <button
                    onClick={() => {
                      onOpenAuth?.('register', 'CUSTOMER');
                      setMobileMenuOpen(false);
                    }}
                    className="w-full min-h-[48px] px-4 py-3 text-center font-bold text-white bg-[#1464D2] hover:bg-blue-700 rounded-full text-sm shadow-xs active:scale-98 transition-colors"
                  >
                    {t.signUp}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {sessionUser?.role === 'WORKER' && <WorkerBookingAlertModal />}
    </header>
  );
}
