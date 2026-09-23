'use client';

import React from 'react';
import { X, CheckCircle2 } from 'lucide-react';

interface AuthHeaderProps {
  title: string;
  subtitle?: string;
  onClose: () => void;
  tab?: 'otp' | 'password';
  onTabChange?: (tab: 'otp' | 'password') => void;
  showTabs?: boolean;
}

export default function AuthHeader({
  title,
  subtitle,
  onClose,
  tab = 'otp',
  onTabChange,
  showTabs = true,
}: AuthHeaderProps) {
  return (
    <div className="bg-navy-900 p-6 text-white relative">
      <button
        onClick={onClose}
        type="button"
        className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-navy-800 transition-colors"
        aria-label="Close"
      >
        <X className="w-5 h-5" />
      </button>

      <div className="flex items-center gap-2 mb-1.5">
        <span className="text-xl font-black tracking-tight">
          Verified<span className="text-brand-400">Labour</span>
        </span>
        <CheckCircle2 className="w-5 h-5 text-brand-400 stroke-[2.5]" />
      </div>

      <h2 className="text-base font-bold text-white">{title}</h2>
      {subtitle && <p className="text-xs text-slate-300 mt-0.5">{subtitle}</p>}

      {showTabs && onTabChange && (
        <div className="flex gap-2 mt-4 bg-navy-950/70 p-1 rounded-xl text-xs font-semibold">
          <button
            type="button"
            onClick={() => onTabChange('otp')}
            className={`flex-1 py-1.5 rounded-lg transition-all ${
              tab === 'otp'
                ? 'bg-white text-navy-900 shadow-sm font-bold'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            Mobile OTP
          </button>
          <button
            type="button"
            onClick={() => onTabChange('password')}
            className={`flex-1 py-1.5 rounded-lg transition-all ${
              tab === 'password'
                ? 'bg-white text-navy-900 shadow-sm font-bold'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            Password Login
          </button>
        </div>
      )}
    </div>
  );
}
