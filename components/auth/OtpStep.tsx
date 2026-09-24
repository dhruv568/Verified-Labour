'use client';

import React from 'react';
import { ArrowLeft, CheckCircle2, AlertCircle } from 'lucide-react';
import Button from '../ui/Button';

interface OtpStepProps {
  phone: string;
  otp: string;
  onOtpChange: (val: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onChangePhone: () => void;
  onResendOtp: () => void;
  resendTimer: number;
  loading: boolean;
  error: string | null;
}

export default function OtpStep({
  phone,
  otp,
  onOtpChange,
  onSubmit,
  onChangePhone,
  onResendOtp,
  resendTimer,
  loading,
  error,
}: OtpStepProps) {
  const isComplete = otp.length === 6;

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <div className="text-center pb-1">
        <h3 className="text-sm font-bold text-slate-900">Verify your mobile number</h3>
        <p className="text-xs text-slate-600 mt-1">
          We sent a 6-digit OTP to: <strong className="text-slate-900">+91 {phone}</strong>
        </p>
      </div>

      <div>
        <input
          type="text"
          required
          autoFocus
          maxLength={6}
          placeholder="• • • • • •"
          value={otp}
          onChange={(e) => onOtpChange(e.target.value.replace(/\D/g, ''))}
          className="w-full text-center tracking-[0.5em] text-2xl font-bold py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-brand-500 outline-none bg-white text-slate-900"
        />
      </div>

      <Button
        type="submit"
        variant="amber"
        size="lg"
        fullWidth
        isLoading={loading}
        disabled={loading || !isComplete}
      >
        {loading ? 'Verifying...' : 'Verify & Continue'}
      </Button>

      <div className="flex items-center justify-between text-xs pt-2">
        <button
          type="button"
          onClick={onChangePhone}
          className="text-slate-500 hover:text-slate-900 font-medium flex items-center gap-1 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Change number</span>
        </button>

        {resendTimer > 0 ? (
          <span className="text-slate-400 font-medium">Resend code in {resendTimer}s</span>
        ) : (
          <button
            type="button"
            onClick={onResendOtp}
            className="text-brand-700 font-bold hover:underline"
          >
            Resend OTP
          </button>
        )}
      </div>
    </form>
  );
}
