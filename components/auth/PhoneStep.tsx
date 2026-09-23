'use client';

import React from 'react';
import { ArrowRight, AlertCircle, Shield } from 'lucide-react';
import Button from '../ui/Button';

interface PhoneStepProps {
  phone: string;
  onPhoneChange: (val: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  loading: boolean;
  mode: 'login' | 'register';
  error: string | null;
}

export default function PhoneStep({
  phone,
  onPhoneChange,
  onSubmit,
  loading,
  mode,
  error,
}: PhoneStepProps) {
  const isComplete = phone.replace(/\D/g, '').length === 10;

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <div>
        <label className="block text-xs font-bold text-slate-700 mb-1.5">
          Mobile Number <span className="text-red-500">*</span>
        </label>
        <div className="flex rounded-xl border border-slate-300 overflow-hidden focus-within:ring-2 focus-within:ring-brand-500 focus-within:border-brand-500 bg-white">
          <span className="bg-slate-100 px-3.5 py-2.5 text-xs font-bold text-slate-700 border-r border-slate-300 flex items-center select-none">
            +91
          </span>
          <input
            type="tel"
            required
            autoFocus
            maxLength={10}
            placeholder="9876543210"
            value={phone}
            onChange={(e) => onPhoneChange(e.target.value.replace(/\D/g, ''))}
            className="w-full px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 outline-none"
          />
        </div>
        <p className="text-[11px] text-slate-500 mt-1.5 flex items-center gap-1">
          <Shield className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span>We'll send a 6-digit OTP code to verify this number.</span>
        </p>
      </div>

      <Button
        type="submit"
        variant="brand"
        size="lg"
        fullWidth
        isLoading={loading}
        disabled={loading || !isComplete}
        icon={<ArrowRight className="w-4 h-4" />}
      >
        {loading ? 'Sending OTP...' : 'Continue'}
      </Button>
    </form>
  );
}
