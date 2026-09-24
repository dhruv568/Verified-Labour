'use client';

import React from 'react';
import { X } from 'lucide-react';
import Logo from '@/components/Logo';

interface AuthHeaderProps {
  title: string;
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
  return (
    <div className="bg-navy-900 p-5 sm:p-6 text-white relative">
      <button
        onClick={onClose}
        type="button"
        className="absolute top-3.5 right-3.5 w-10 h-10 flex items-center justify-center rounded-full text-slate-400 hover:text-white hover:bg-navy-800 active:bg-navy-700 transition-colors"
        aria-label="Close"
      >
        <X className="w-5 h-5" />
      </button>

      <div className="mb-2.5 pr-10">
        <Logo variant="auth" />
      </div>

      <h2 className="text-base font-bold text-white pr-8">{title}</h2>
      {subtitle && <p className="text-xs text-slate-300 mt-0.5">{subtitle}</p>}

      {showTabs && onTabChange && (
        <div className="flex gap-2 mt-4 bg-navy-950/70 p-1 rounded-xl text-xs font-semibold">
          <button
            type="button"
            onClick={() => onTabChange('login')}
            className={`flex-1 min-h-[40px] py-2 rounded-lg transition-all flex items-center justify-center ${
              tab === 'login'
                ? 'bg-white text-navy-900 shadow-sm font-bold'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            Login
          </button>
          <button
            type="button"
            onClick={() => onTabChange('register')}
            className={`flex-1 min-h-[40px] py-2 rounded-lg transition-all flex items-center justify-center ${
              tab === 'register'
                ? 'bg-white text-navy-900 shadow-sm font-bold'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            Register
          </button>
        </div>
      )}
    </div>
  );
}
