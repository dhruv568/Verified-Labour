'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  HardHat,
  CheckCircle2,
  Menu,
  X,
  Shield,
  Briefcase,
  LogOut,
  ChevronDown,
} from 'lucide-react';
import LocationSelector from '@/components/LocationSelector';

interface HeaderProps {
  onOpenAuth?: (
    initialMode?: 'login' | 'register',
    role?: 'CUSTOMER' | 'WORKER' | 'BUSINESS'
  ) => void;
}

export default function Header({ onOpenAuth }: HeaderProps) {
  const router = useRouter();
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
      await fetch('/api/auth/me', { method: 'POST' });
      setSessionUser(null);
      setUserDropdownOpen(false);
      router.push('/');
      router.refresh();
    } catch (err) {
      console.error('Logout error:', err);
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
        <div className="flex items-center justify-between h-18 sm:h-20">
          {/* Left: Verified Labour Logo matching Screenshot */}
          <Link href="/" className="flex items-center gap-2.5 group shrink-0">
            <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-amber-400 text-navy-950 shadow-xs">
              <HardHat className="w-6 h-6 text-navy-950" />
              <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5 shadow-2xs">
                <CheckCircle2 className="w-4 h-4 text-[#079447] fill-[#079447] text-white" />
              </div>
            </div>
            <div className="flex flex-col">
              <div className="flex items-center text-xl sm:text-2xl font-black tracking-tight leading-none">
                <span className="text-[#082B66]">Verified</span>
                <span className="text-[#079447] ml-1">Labour</span>
              </div>
              <span className="text-[10px] sm:text-[11px] font-medium text-slate-500 tracking-tight mt-0.5">
                Real People. Real Skills. Real Support.
              </span>
            </div>
          </Link>

          {/* Center Navigation Links matching Screenshot */}
          <nav className="hidden lg:flex items-center gap-6 xl:gap-8 text-sm font-semibold text-slate-700">
            <Link
              href="/"
              className="text-[#082B66] font-bold hover:text-[#1264D6] transition-colors"
            >
              Home
            </Link>
            <a
              href="/#workers"
              className="hover:text-[#1264D6] transition-colors"
            >
              Find a Worker
            </a>
            <button
              type="button"
              onClick={() => onOpenAuth?.('register', 'WORKER')}
              className="hover:text-[#079447] transition-colors text-slate-700"
            >
              Become a Worker
            </button>
            <a
              href="/#how"
              className="hover:text-[#1264D6] transition-colors"
            >
              How It Works
            </a>
            <a
              href="/#about"
              className="hover:text-[#1264D6] transition-colors"
            >
              About
            </a>
            <a
              href="/#contact"
              className="hover:text-[#1264D6] transition-colors"
            >
              Contact
            </a>
          </nav>

          {/* Right Area: Dynamic Location Selector + Green Login + Blue Sign Up */}
          <div className="hidden md:flex items-center gap-3">
            {/* Dynamic Location Selector with MapPin */}
            <LocationSelector />

            {sessionUser ? (
              <div className="relative">
                <button
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-slate-300 hover:border-[#1264D6] transition-colors text-xs font-semibold bg-white"
                >
                  <div className="w-7 h-7 rounded-full bg-slate-100 text-[#082B66] flex items-center justify-center font-bold text-xs">
                    {sessionUser.customerProfile?.fullName?.[0] ||
                      sessionUser.workerProfile?.fullName?.[0] ||
                      sessionUser.phone.slice(-2)}
                  </div>
                  <span className="text-slate-800 max-w-[100px] truncate">
                    {sessionUser.customerProfile?.fullName ||
                      sessionUser.workerProfile?.fullName ||
                      sessionUser.phone}
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
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
              <div className="flex items-center gap-2.5">
                {/* Green Login Button */}
                <button
                  type="button"
                  onClick={() => onOpenAuth?.('login')}
                  className="px-5 py-2 text-xs font-bold text-white bg-[#079447] hover:bg-[#067c3b] rounded-full shadow-xs transition-colors"
                >
                  Login
                </button>

                {/* Blue Sign Up Button */}
                <button
                  type="button"
                  onClick={() => onOpenAuth?.('register', 'CUSTOMER')}
                  className="px-5 py-2 text-xs font-bold text-white bg-[#1264D6] hover:bg-blue-700 rounded-full shadow-xs transition-colors"
                >
                  Sign Up
                </button>
              </div>
            )}
          </div>

          {/* Mobile Hamburger Button */}
          <div className="flex lg:hidden items-center gap-2">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-slate-700 hover:text-slate-950 rounded-lg hover:bg-slate-100 focus:outline-none"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden py-4 border-t border-slate-100 space-y-3 animate-in fade-in duration-150">
            {/* Location Selector on Mobile */}
            <div className="px-2 pb-2">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Your Service Location:
              </span>
              <LocationSelector isMobile={true} />
            </div>

            <nav className="space-y-1 px-1">
              <Link
                href="/"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 text-sm font-bold text-[#082B66] hover:bg-slate-50 rounded-xl"
              >
                Home
              </Link>
              <a
                href="/#workers"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 rounded-xl"
              >
                Find a Worker
              </a>
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenAuth?.('register', 'WORKER');
                }}
                className="w-full text-left block px-3 py-2 text-sm font-bold text-[#079447] hover:bg-emerald-50 rounded-xl"
              >
                Become a Worker
              </button>
              <a
                href="/#how"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 rounded-xl"
              >
                How It Works
              </a>
              <a
                href="/#about"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 rounded-xl"
              >
                About
              </a>
              <a
                href="/#contact"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 rounded-xl"
              >
                Contact
              </a>
            </nav>

            <div className="pt-3 border-t border-slate-100 px-2">
              {sessionUser ? (
                <div className="space-y-2">
                  <Link
                    href={getDashboardLink()}
                    onClick={() => setMobileMenuOpen(false)}
                    className="block w-full text-center px-4 py-2.5 bg-[#082B66] text-white font-bold rounded-xl text-xs"
                  >
                    Go to Dashboard ({sessionUser.role})
                  </Link>
                  <button
                    onClick={() => {
                      handleLogout();
                      setMobileMenuOpen(false);
                    }}
                    className="block w-full text-center px-4 py-2 text-red-600 font-semibold text-xs"
                  >
                    Log Out
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    onClick={() => {
                      onOpenAuth?.('login');
                      setMobileMenuOpen(false);
                    }}
                    className="w-full px-4 py-2.5 text-center font-bold text-white bg-[#079447] hover:bg-[#067c3b] rounded-full text-xs shadow-xs"
                  >
                    Login
                  </button>
                  <button
                    onClick={() => {
                      onOpenAuth?.('register', 'CUSTOMER');
                      setMobileMenuOpen(false);
                    }}
                    className="w-full px-4 py-2.5 text-center font-bold text-white bg-[#1264D6] hover:bg-blue-700 rounded-full text-xs shadow-xs"
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
