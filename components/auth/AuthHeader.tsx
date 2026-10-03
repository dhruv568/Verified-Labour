'use client';

import React from 'react';
import { X } from 'lucide-react';
import Logo from '@/components/Logo';
import { useLanguage } from '@/context/LanguageContext';

interface AuthHeaderProps {
  title?: string;
  subtitle?: string;
  onClose: () => void;
  tab?: 'login' | 'register' | 'otp';
  onTabChange?: (tab: 'login' | 'register') => void;
  showTabs?: boolean;
}

export default function AuthHeader({
  title,
  subtitle,
  onClose,
  tab = 'login',
  onTabChange,
  showTabs = true,
}: AuthHeaderProps) {
  const { isHindi } = useLanguage();

  return (
    <div className="bg-navy-900 px-4 pt-3.5 pb-3 sm:px-5 sm:pt-4 sm:pb-4 text-white relative font-devanagari">
      {/* Close button - independently positioned top-right */}
      <button
        onClick={onClose}
        type="button"
        className="absolute top-3 right-3 sm:top-3.5 sm:right-3.5 z-10 w-8.5 h-8.5 sm:w-9.5 sm:h-9.5 flex items-center justify-center rounded-full text-slate-300 hover:text-white hover:bg-navy-800 active:bg-navy-700 transition-colors"
        aria-label={isHindi ? "बंद करें" : "Close"}
      >
        <X className="w-5 h-5" />
      </button>

      {/* Horizontally Centered Verified Labour Logo */}
      <div className="flex justify-center items-center w-full px-8 pt-0.5 pb-1">
        <div className="bg-white px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-xl shadow-xs border border-white/20 flex items-center justify-center shrink-0">
          <Logo className="h-8.5 sm:h-11 w-auto object-contain" priority />
        </div>
      </div>

      {title && <h2 className="text-sm sm:text-base font-bold text-white text-center mt-2 px-6">{title}</h2>}
      {subtitle && <p className="text-xs text-slate-300 text-center mt-0.5 px-6">{subtitle}</p>}

      {showTabs && onTabChange && (
        <div className="flex gap-2 mt-3 bg-navy-950/70 p-1 rounded-xl text-xs font-semibold">
          <button
            type="button"
            onClick={() => onTabChange('login')}
            className={`flex-1 min-h-[38px] py-2 rounded-lg transition-all flex items-center justify-center ${
              tab === 'login'
                ? 'bg-white text-navy-900 shadow-xs font-bold'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <span>{isHindi ? 'लॉगिन' : 'Login'}</span>
          </button>
          <button
            type="button"
            onClick={() => onTabChange('register')}
            className={`flex-1 min-h-[38px] py-2 rounded-lg transition-all flex items-center justify-center ${
              tab === 'register'
                ? 'bg-white text-navy-900 shadow-xs font-bold'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <span>{isHindi ? 'पंजीकरण' : 'Register'}</span>
          </button>
        </div>
      )}
    </div>
  );
}
