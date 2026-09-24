'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AlertCircle, ArrowRight, ShieldCheck } from 'lucide-react';
import AuthHeader from './AuthHeader';
import PhoneStep from './PhoneStep';
import OtpStep from './OtpStep';
import AccountTypeStep from './AccountTypeStep';
import Button from '../ui/Button';
import Input from '../ui/Input';

export interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'login' | 'register';
  defaultRole?: 'CUSTOMER' | 'WORKER' | 'BUSINESS';
  onSuccess?: (user: any) => void;
}

type AuthStep = 'PHONE' | 'OTP' | 'ROLE_SELECTION';

export default function AuthModal({
  isOpen,
  onClose,
  initialMode = 'login',
  defaultRole = 'CUSTOMER',
  onSuccess,
}: AuthModalProps) {
  const router = useRouter();

  // Tab & Step states
  const [tab, setTab] = useState<'otp' | 'password'>('otp');
  const [step, setStep] = useState<AuthStep>('PHONE');
  const [role, setRole] = useState<'CUSTOMER' | 'WORKER' | 'BUSINESS'>(defaultRole);

  // OTP flow states
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [resendTimer, setResendTimer] = useState(0);

  // Password flow states
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');

  // Async states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Reset state when modal is opened or closed
  useEffect(() => {
    if (isOpen) {
      setStep('PHONE');
      setOtp('');
      setError(null);
      setSuccessMsg(null);
      setRole(defaultRole);
    }
  }, [isOpen, defaultRole]);

  // Resend OTP countdown timer
  useEffect(() => {
    if (resendTimer <= 0) return;
    const timer = setInterval(() => {
      setResendTimer((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendTimer]);

  if (!isOpen) return null;

  // Send OTP
  const handleSendOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to dispatch OTP code');
      }

      setStep('OTP');
      setResendTimer(60);
      setSuccessMsg(data.message || 'OTP code sent successfully!');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Verify OTP
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone,
          otp,
          role,
        }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Invalid OTP code');
      }

      // If user is brand new and didn't have an explicit role set:
      if (data.isNewUser && defaultRole === 'CUSTOMER' && initialMode === 'register') {
        setStep('ROLE_SELECTION');
        return;
      }

      completeLogin(data.user);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Role selection for new user
  const handleRoleSelection = async (selectedRole: 'CUSTOMER' | 'WORKER', fullName: string) => {
    setLoading(true);
    setError(null);

    try {
      // Re-call verify-otp with the chosen role to ensure workerProfile or customerProfile is set up
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone,
          otp: otp || '123456',
          role: selectedRole,
          fullName: fullName || undefined,
        }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to initialize account');
      }

      completeLogin(data.user);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Password Login
  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, password }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Login failed. Please verify credentials.');
      }

      completeLogin(data.user);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Finish auth and route cleanly
  const completeLogin = (user: any) => {
    onSuccess?.(user);
    onClose();

    if (user.role === 'ADMIN') {
      router.push('/admin');
    } else if (user.role === 'WORKER') {
      // If worker onboarding is pending, take them directly to the onboarding wizard
      if (user.workerProfile?.status === 'ONBOARDING' || !user.workerProfile?.primaryCategoryId) {
        router.push('/worker/onboarding');
      } else {
        router.push('/worker/dashboard');
      }
    } else if (user.role === 'BUSINESS') {
      router.push('/business/bulk');
    } else {
      router.push('/customer/dashboard');
    }

    router.refresh();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-t-2xl sm:rounded-2xl max-w-md w-full shadow-2xl border border-slate-100 overflow-hidden transform transition-all animate-in zoom-in-95 duration-150 max-h-[92vh] sm:max-h-none flex flex-col">
        {/* Header */}
        <AuthHeader
          title={
            step === 'ROLE_SELECTION'
              ? 'Choose Account Type'
              : tab === 'password'
              ? 'Login with Password'
              : initialMode === 'register'
              ? 'Create your Verified Labour account'
              : 'Login to Verified Labour'
          }
          subtitle="Aadhaar & Bank Verified Skilled Labour Marketplace"
          onClose={onClose}
          tab={tab}
          onTabChange={(newTab) => {
            setTab(newTab);
            setError(null);
          }}
          showTabs={step === 'PHONE'}
        />

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto">
          {tab === 'otp' ? (
            <>
              {step === 'PHONE' && (
                <PhoneStep
                  phone={phone}
                  onPhoneChange={setPhone}
                  onSubmit={handleSendOtp}
                  loading={loading}
                  mode={initialMode}
                  error={error}
                />
              )}

              {step === 'OTP' && (
                <OtpStep
                  phone={phone}
                  otp={otp}
                  onOtpChange={setOtp}
                  onSubmit={handleVerifyOtp}
                  onChangePhone={() => {
                    setStep('PHONE');
                    setOtp('');
                    setError(null);
                  }}
                  onResendOtp={handleSendOtp}
                  resendTimer={resendTimer}
                  loading={loading}
                  error={error}
                />
              )}

              {step === 'ROLE_SELECTION' && (
                <AccountTypeStep
                  onSelectRole={handleRoleSelection}
                  loading={loading}
                  defaultRole={defaultRole === 'WORKER' ? 'WORKER' : 'CUSTOMER'}
                />
              )}
            </>
          ) : (
            <form onSubmit={handlePasswordLogin} className="space-y-4">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <Input
                label="Mobile Number or Email"
                required
                placeholder="+919999999999 or admin@verifiedlabour.com"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
              />

              <Input
                label="Password"
                type="password"
                required
                placeholder="Enter your account password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />

              <Button
                type="submit"
                variant="primary"
                size="lg"
                fullWidth
                isLoading={loading}
                icon={<ArrowRight className="w-4 h-4" />}
              >
                {loading ? 'Authenticating...' : 'Sign In with Password'}
              </Button>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs text-slate-600 space-y-1">
                <p className="font-bold text-slate-800">Demo Passwords:</p>
                <p>• Admin: <span className="font-mono text-slate-800">+919999999999</span> / <span className="font-mono text-slate-800">Admin@123456</span></p>
                <p>• Customer: <span className="font-mono text-slate-800">+919876543210</span> / <span className="font-mono text-slate-800">Customer@123</span></p>
                <p>• Plumber Worker: <span className="font-mono text-slate-800">+919111122221</span> / <span className="font-mono text-slate-800">Worker@123</span></p>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
