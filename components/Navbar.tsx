'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Menu,
  X,
  Shield,
  Briefcase,
  LogOut,
  ChevronDown,
} from 'lucide-react';
import { Locale, getTranslation } from '@/lib/translations';
import LocationSelector from './LocationSelector';
import LanguageSelector from './LanguageSelector';
import Logo from '@/components/Logo';
import { useLanguage } from '@/context/LanguageContext';

interface NavbarProps {
  currentLocale?: Locale;
  onLocaleChange?: (locale: Locale) => void;
  onOpenAuth?: (
    initialMode?: 'login' | 'register',
    role?: 'CUSTOMER' | 'WORKER' | 'BUSINESS'
  ) => void;
}

export default function Navbar({
  currentLocale,
  onLocaleChange,
  onOpenAuth,
}: NavbarProps) {
  const router = useRouter();
  const { locale: contextLocale, t: contextT } = useLanguage();
  const activeLocale = currentLocale || contextLocale || 'en';
  const t = getTranslation(activeLocale) || contextT;
  const [sessionUser, setSessionUser] = useState<any>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  const fetchSession = async () => {
    try {
      const res = await fetch('/api/auth/me');
      const data = await res.json();
      if (data.authenticated) {
        setSessionUser(data.user);
      } else {
        setSessionUser(null);
      }
    } catch {
      setSessionUser(null);
    }
  };

  useEffect(() => {
    fetchSession();
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
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* Brand Logo */}
          <Link href="/" className="flex items-center gap-2 group shrink-0" aria-label="Verified Labour Home">
            <Logo variant="header" priority />
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden lg:flex items-center gap-6 xl:gap-8 text-sm font-semibold text-slate-700">
            <Link
              href="/"
              className="text-slate-800 hover:text-[#1464D2] transition-colors font-bold"
            >
              {t.home}
            </Link>
            <a
              href="/#workers"
              className="hover:text-[#1464D2] transition-colors"
            >
              {t.findWorker}
            </a>
            <button
              type="button"
              onClick={() => onOpenAuth?.('register', 'WORKER')}
              className="hover:text-[#0B9B5A] transition-colors text-slate-700"
            >
              {t.becomeWorker}
            </button>
            <a
              href="/#how"
              className="hover:text-[#1464D2] transition-colors"
            >
              {t.howItWorks}
            </a>
            <a
              href="/#about"
              className="hover:text-[#1464D2] transition-colors"
            >
              {t.about}
            </a>
            <a
              href="/#contact"
              className="hover:text-[#1464D2] transition-colors"
            >
              {t.contact}
            </a>
          </nav>

          {/* Right Action Area: Location + Language + Auth */}
          <div className="hidden md:flex items-center gap-3">
            {/* Dynamic Location Selector with MapPin */}
            <LocationSelector />

            {/* Language Selector */}
            <LanguageSelector />

            {sessionUser ? (
              <div className="relative">
                <button
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-slate-300 hover:border-[#1464D2] transition-colors text-sm font-medium bg-white"
                >
                  <div className="w-7 h-7 rounded-full bg-slate-100 text-[#0F2A5F] flex items-center justify-center font-bold text-xs">
                    {sessionUser.customerProfile?.fullName?.[0] ||
                      sessionUser.workerProfile?.fullName?.[0] ||
                      sessionUser.phone.slice(-2)}
                  </div>
                  <span className="text-slate-800 font-semibold max-w-[110px] truncate text-xs">
                    {sessionUser.customerProfile?.fullName ||
                      sessionUser.workerProfile?.fullName ||
                      sessionUser.phone}
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-brand-50 text-[#0B9B5A] border border-brand-200 uppercase font-mono font-bold">
                    {sessionUser.role}
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </button>

                {userDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-2xl border border-slate-100 py-2 z-50 text-sm animate-in fade-in zoom-in-95 duration-100">
                    <div className="px-4 py-2.5 border-b border-slate-100">
                      <p className="text-[11px] text-slate-400 font-medium">Signed in as</p>
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
                          ? 'Admin Operations'
                          : sessionUser.role === 'WORKER'
                          ? 'Worker Dashboard'
                          : sessionUser.role === 'BUSINESS'
                          ? 'Business Portal'
                          : 'Customer Dashboard'}
                      </span>
                    </Link>

                    {sessionUser.role === 'WORKER' && (
                      <Link
                        href="/worker/earnings"
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2 hover:bg-slate-50 text-slate-700 font-semibold text-xs transition-colors"
                      >
                        <span className="text-[#0B9B5A] font-bold">₹</span>
                        <span>My Earnings & Wallet</span>
                      </Link>
                    )}

                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2.5 px-4 py-2 hover:bg-red-50 text-red-600 font-semibold text-xs border-t border-slate-100 mt-1 text-left transition-colors"
                    >
                      <LogOut className="w-4 h-4 text-red-500" />
                      <span>Log Out</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2.5">
                {/* Login Button (Green style inspired by reference) */}
                <button
                  type="button"
                  onClick={() => onOpenAuth?.('login')}
                  className="px-5 py-2 text-xs font-bold text-white bg-[#0B9B5A] hover:bg-[#08783b] rounded-full shadow-xs transition-all"
                >
                  Login
                </button>

                {/* Sign Up Button (Royal Blue style inspired by reference) */}
                <button
                  type="button"
                  onClick={() => onOpenAuth?.('register', 'CUSTOMER')}
                  className="px-5 py-2 text-xs font-bold text-white bg-[#1464D2] hover:bg-blue-700 rounded-full shadow-xs transition-all"
                >
                  Sign Up
                </button>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="flex lg:hidden items-center gap-2">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="w-11 h-11 flex items-center justify-center text-slate-700 hover:text-slate-950 rounded-xl bg-slate-100 hover:bg-slate-200 focus:outline-none transition-colors"
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? (
                <X className="w-6 h-6 text-slate-800" />
              ) : (
                <Menu className="w-6 h-6 text-slate-800" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden py-4 border-t border-slate-100 space-y-4 animate-in fade-in duration-150">
            {/* Location in Mobile Menu */}
            <div className="px-1">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
                Your Service Location:
              </span>
              <LocationSelector isMobile={true} />
            </div>

            {/* Language Selector in Mobile Menu */}
            <div className="px-1">
              <LanguageSelector isMobile={true} />
            </div>

            <nav className="space-y-1">
              <Link
                href="/"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center min-h-[44px] px-3.5 py-2.5 text-base font-bold text-[#0F2A5F] hover:bg-slate-50 rounded-xl transition-colors"
              >
                {t.home}
              </Link>
              <a
                href="/#workers"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center min-h-[44px] px-3.5 py-2.5 text-base font-semibold text-slate-700 hover:bg-slate-50 rounded-xl transition-colors"
              >
                {t.findWorker}
              </a>
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
              <a
                href="/#how"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center min-h-[44px] px-3.5 py-2.5 text-base font-semibold text-slate-700 hover:bg-slate-50 rounded-xl transition-colors"
              >
                {t.howItWorks}
              </a>
              <a
                href="/#about"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center min-h-[44px] px-3.5 py-2.5 text-base font-semibold text-slate-700 hover:bg-slate-50 rounded-xl transition-colors"
              >
                {t.about}
              </a>
              <a
                href="/#contact"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center min-h-[44px] px-3.5 py-2.5 text-base font-semibold text-slate-700 hover:bg-slate-50 rounded-xl transition-colors"
              >
                {t.contact}
              </a>
            </nav>

            <div className="pt-3 border-t border-slate-100 px-1">
              {sessionUser ? (
                <div className="space-y-2">
                  <Link
                    href={getDashboardLink()}
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center justify-center min-h-[48px] w-full px-4 py-3 bg-[#0F2A5F] text-white font-bold rounded-xl shadow-xs text-sm"
                  >
                    Go to Dashboard ({sessionUser.role})
                  </Link>

                  {sessionUser.role === 'WORKER' && (
                    <Link
                      href="/worker/earnings"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center justify-center min-h-[44px] w-full px-4 py-2.5 bg-emerald-50 text-[#0B9B5A] font-bold rounded-xl text-sm border border-emerald-200"
                    >
                      <span>₹ My Earnings & Wallet</span>
                    </Link>
                  )}

                  <button
                    onClick={() => {
                      handleLogout();
                      setMobileMenuOpen(false);
                    }}
                    className="flex items-center justify-center min-h-[44px] w-full px-4 py-2 text-red-600 font-semibold text-sm hover:bg-red-50 rounded-xl"
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
                    className="w-full min-h-[48px] px-4 py-3 text-center font-bold text-white bg-[#0B9B5A] hover:bg-[#08783b] rounded-full text-sm shadow-xs active:scale-98 transition-colors"
                  >
                    Login
                  </button>
                  <button
                    onClick={() => {
                      onOpenAuth?.('register', 'CUSTOMER');
                      setMobileMenuOpen(false);
                    }}
                    className="w-full min-h-[48px] px-4 py-3 text-center font-bold text-white bg-[#1464D2] hover:bg-blue-700 rounded-full text-sm shadow-xs active:scale-98 transition-colors"
                  >
                    Sign Up
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
