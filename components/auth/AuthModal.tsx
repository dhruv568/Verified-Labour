'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  Eye,
  EyeOff,
  Users,
  HardHat,
  CheckCircle2,
  Lock,
  Mail,
  Phone as PhoneIcon,
  User as UserIcon,
  Smartphone,
} from 'lucide-react';
import AuthHeader from './AuthHeader';
import OtpStep from './OtpStep';
import Button from '../ui/Button';
import Input from '../ui/Input';

export interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'login' | 'register';
  defaultRole?: 'CUSTOMER' | 'WORKER' | 'BUSINESS';
  onSuccess?: (user: any) => void;
}

type TabType = 'login' | 'register' | 'otp' | 'email-otp';

export default function AuthModal({
  isOpen,
  onClose,
  initialMode = 'login',
  defaultRole = 'CUSTOMER',
  onSuccess,
}: AuthModalProps) {
  const router = useRouter();

  // Tab & Flow states
  const [tab, setTab] = useState<TabType>(initialMode);
  const [role, setRole] = useState<'CUSTOMER' | 'WORKER' | 'BUSINESS'>(defaultRole);

  // Login form states
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  // Registration form states
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [showRegConfirmPassword, setShowRegConfirmPassword] = useState(false);

  // Field errors for inline validation
  const [fieldErrors, setFieldErrors] = useState<{ [key: string]: string }>({});

  // Mobile OTP fallback flow states
  const [otpPhone, setOtpPhone] = useState('');
  const [pendingEmail, setPendingEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [otpStep, setOtpStep] = useState<'PHONE' | 'OTP'>('PHONE');
  const [resendTimer, setResendTimer] = useState(0);

  // Async states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Reset state when modal opens or initialMode changes
  useEffect(() => {
    if (isOpen) {
      setTab(initialMode);
      setRole(defaultRole === 'WORKER' ? 'WORKER' : 'CUSTOMER');
      setError(null);
      setSuccessMsg(null);
      setFieldErrors({});
      setOtpStep('PHONE');
      setOtpCode('');
    }
  }, [isOpen, initialMode, defaultRole]);

  // Resend OTP countdown timer
  useEffect(() => {
    if (resendTimer <= 0) return;
    const timer = setInterval(() => {
      setResendTimer((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendTimer]);

  if (!isOpen) return null;

  // Validation functions
  const validateEmail = (val: string): string | null => {
    const trimmed = val.trim();
    if (!trimmed) return 'Email address is required';
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(trimmed)) {
      return 'Please enter a valid email address';
    }
    return null;
  };

  const validatePhone = (val: string): string | null => {
    const digits = val.replace(/\D/g, '');
    if (!digits) return 'Phone number is required';
    if (digits.length !== 10) return 'Mobile number must be exactly 10 digits';
    if (!/^[6-9]/.test(digits)) return 'Mobile number must start with 6, 7, 8, or 9';
    return null;
  };

  const validatePassword = (val: string, isRegister = false): string | null => {
    if (!val) return 'Password is required';
    if (isRegister) {
      if (val.length < 8) return 'Password must be at least 8 characters long';
      if (!/[A-Za-z]/.test(val)) return 'Password must contain at least one letter';
      if (!/[0-9]/.test(val)) return 'Password must contain at least one number';
    }
    return null;
  };

  const validateName = (val: string): string | null => {
    const trimmed = val.trim();
    if (!trimmed) return 'Full name is required';
    if (trimmed.length < 2) return 'Full name must be at least 2 characters';
    if (!/^[a-zA-Z\s.'-]+$/.test(trimmed)) {
      return 'Name should only contain letters, spaces, dots, or hyphens';
    }
    return null;
  };

  // Handle Login: Email + Password
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    // Validate inputs
    const errors: { [key: string]: string } = {};
    const emailErr = validateEmail(loginEmail);
    if (emailErr) errors.loginEmail = emailErr;

    const passErr = validatePassword(loginPassword, false);
    if (passErr) errors.loginPassword = passErr;

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setFieldErrors({});
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: loginEmail.trim(),
          password: loginPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Login failed. Please check your credentials.');
      }

      if (data.requiresVerification) {
        setPendingEmail(data.email || loginEmail.trim());
        setTab('email-otp');
        setResendTimer(60);
        setSuccessMsg(data.message || 'Verification code sent to your email.');
        setError(null);
        setOtpCode('');
        return;
      }

      completeLogin(data.user);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Handle Registration: Name, Email, Phone Number + Password
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    // Validate all required fields
    const errors: { [key: string]: string } = {};

    const nameErr = validateName(regName);
    if (nameErr) errors.regName = nameErr;

    const emailErr = validateEmail(regEmail);
    if (emailErr) errors.regEmail = emailErr;

    const phoneErr = validatePhone(regPhone);
    if (phoneErr) errors.regPhone = phoneErr;

    const passErr = validatePassword(regPassword, true);
    if (passErr) errors.regPassword = passErr;

    if (regPassword !== regConfirmPassword) {
      errors.regConfirmPassword = 'Passwords do not match';
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setFieldErrors({});
    setLoading(true);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: regName.trim(),
          email: regEmail.trim(),
          phone: regPhone.trim(),
          password: regPassword,
          role,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Registration failed. Please check your details.');
      }

      if (data.requiresVerification) {
        setPendingEmail(data.email || regEmail.trim());
        setTab('email-otp');
        setResendTimer(60);
        setSuccessMsg(data.message || 'Verification code sent to your email.');
        setError(null);
        setOtpCode('');
        return;
      }

      completeLogin(data.user);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Handle Verify Email OTP
  const handleVerifyEmailOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: pendingEmail,
          otp: otpCode.trim(),
          role,
        }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Invalid verification code. Please try again.');
      }

      completeLogin(data.user);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Handle Resend Email OTP
  const handleResendEmailOtp = async () => {
    setError(null);
    setSuccessMsg(null);

    const emailToResend = pendingEmail || regEmail.trim() || loginEmail.trim();
    if (!emailToResend) {
      setError('Email address is required to resend verification code.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/resend-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailToResend }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to resend verification code');
      }

      setResendTimer(60);
      setSuccessMsg(data.message || 'A new verification code has been sent to your email.');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Handle Send OTP (Fallback)
  const handleSendOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: otpPhone }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to dispatch OTP code');
      }

      setOtpStep('OTP');
      setResendTimer(60);
      setSuccessMsg(data.message || 'OTP code sent successfully!');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Handle Verify OTP (Fallback)
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: otpPhone,
          otp: otpCode,
          role,
        }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Invalid OTP code');
      }

      completeLogin(data.user);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Complete Login and Route Cleanly
  const completeLogin = (user: any) => {
    onSuccess?.(user);
    onClose();

    if (user.role === 'ADMIN') {
      router.push('/admin');
    } else if (user.role === 'WORKER') {
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
      <div className="bg-white rounded-t-2xl sm:rounded-2xl max-w-md w-full shadow-2xl border border-slate-100 overflow-hidden transform transition-all animate-in zoom-in-95 duration-150 max-h-[92vh] sm:max-h-[92vh] flex flex-col">
        {/* Header */}
        <AuthHeader
          title={
            tab === 'register'
              ? 'Create your Verified Labour account'
              : tab === 'email-otp'
              ? 'Verify Your Email'
              : tab === 'otp'
              ? 'Sign In with Mobile OTP'
              : 'Login to Verified Labour'
          }
          subtitle="Verified. Nearby. Reliable."
          onClose={onClose}
          tab={tab === 'register' ? 'register' : 'login'}
          onTabChange={(newTab) => {
            setTab(newTab);
            setError(null);
            setSuccessMsg(null);
            setFieldErrors({});
          }}
          showTabs={tab !== 'otp' && tab !== 'email-otp'}
        />

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1">
          {/* Global Error Banner */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-start gap-2 animate-in fade-in duration-150">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
              <span className="leading-relaxed">{error}</span>
            </div>
          )}

          {/* Global Success Banner */}
          {successMsg && (
            <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-start gap-2 animate-in fade-in duration-150">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span className="leading-relaxed">{successMsg}</span>
            </div>
          )}

          {/* TAB 1: LOGIN FLOW (Email + Password) */}
          {tab === 'login' && (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <Input
                  label="Email Address"
                  type="email"
                  required
                  autoFocus
                  autoComplete="email"
                  inputMode="email"
                  placeholder="name@example.com"
                  value={loginEmail}
                  error={fieldErrors.loginEmail}
                  onChange={(e) => {
                    setLoginEmail(e.target.value);
                    if (fieldErrors.loginEmail) {
                      setFieldErrors((prev) => ({ ...prev, loginEmail: '' }));
                    }
                  }}
                  icon={<Mail className="w-4 h-4" />}
                />
              </div>

              <div>
                <div className="relative">
                  <Input
                    label="Password"
                    type={showLoginPassword ? 'text' : 'password'}
                    required
                    autoComplete="current-password"
                    placeholder="Enter your password"
                    value={loginPassword}
                    error={fieldErrors.loginPassword}
                    onChange={(e) => {
                      setLoginPassword(e.target.value);
                      if (fieldErrors.loginPassword) {
                        setFieldErrors((prev) => ({ ...prev, loginPassword: '' }));
                      }
                    }}
                    icon={<Lock className="w-4 h-4" />}
                  />
                  <button
                    type="button"
                    onClick={() => setShowLoginPassword(!showLoginPassword)}
                    tabIndex={-1}
                    className="absolute right-3.5 top-[29px] text-slate-400 hover:text-slate-600 transition-colors p-1"
                    aria-label={showLoginPassword ? 'Hide password' : 'Show password'}
                  >
                    {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                variant="primary"
                size="lg"
                fullWidth
                isLoading={loading}
                icon={<ArrowRight className="w-4 h-4" />}
              >
                {loading ? 'Authenticating...' : 'Sign In with Email'}
              </Button>

              {/* Option to switch to Mobile OTP */}
              <div className="pt-1 flex items-center justify-between text-xs">
                <button
                  type="button"
                  onClick={() => {
                    setTab('otp');
                    setOtpStep('PHONE');
                    setError(null);
                    setSuccessMsg(null);
                  }}
                  className="text-slate-600 hover:text-[#1264D6] font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <Smartphone className="w-3.5 h-3.5 text-slate-400" />
                  <span>Log in with Mobile OTP instead</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setTab('register');
                    setError(null);
                    setFieldErrors({});
                  }}
                  className="text-[#1264D6] font-bold hover:underline"
                >
                  Create an account
                </button>
              </div>

            </form>
          )}

          {/* TAB 2: REGISTRATION FLOW (Name, Email, Phone Number + Password) */}
          {tab === 'register' && (
            <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
              {/* Account Type Selection */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  I want to:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setRole('CUSTOMER')}
                    className={`p-2.5 rounded-xl border-2 text-left transition-all flex items-center gap-2.5 ${
                      role === 'CUSTOMER'
                        ? 'border-brand-600 bg-brand-50/50 shadow-xs'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="w-8 h-8 rounded-lg bg-brand-100 text-brand-800 flex items-center justify-center shrink-0">
                      <Users className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-bold text-xs text-slate-900 leading-tight">Hire Workers</h4>
                      <p className="text-[10px] text-slate-500">Customer</p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRole('WORKER')}
                    className={`p-2.5 rounded-xl border-2 text-left transition-all flex items-center gap-2.5 ${
                      role === 'WORKER'
                        ? 'border-[#082B66] bg-blue-50/50 shadow-xs'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="w-8 h-8 rounded-lg bg-navy-100 text-navy-800 flex items-center justify-center shrink-0">
                      <HardHat className="w-4 h-4 text-[#082B66]" />
                    </div>
                    <div>
                      <h4 className="font-bold text-xs text-slate-900 leading-tight">Earn Daily</h4>
                      <p className="text-[10px] text-slate-500">Skilled Worker</p>
                    </div>
                  </button>
                </div>
              </div>

              {/* Full Name */}
              <Input
                label={role === 'WORKER' ? 'Full Name (as on official ID)' : 'Full Name'}
                type="text"
                required
                autoComplete="name"
                placeholder="e.g. Ramesh Patel"
                value={regName}
                error={fieldErrors.regName}
                onChange={(e) => {
                  setRegName(e.target.value);
                  if (fieldErrors.regName) {
                    setFieldErrors((prev) => ({ ...prev, regName: '' }));
                  }
                }}
                icon={<UserIcon className="w-4 h-4" />}
              />

              {/* Email Address (Login ID) */}
              <Input
                label="Email Address"
                type="email"
                required
                autoComplete="email"
                inputMode="email"
                placeholder="e.g. name@example.com"
                helperText="Used as your account login ID"
                value={regEmail}
                error={fieldErrors.regEmail}
                onChange={(e) => {
                  setRegEmail(e.target.value);
                  if (fieldErrors.regEmail) {
                    setFieldErrors((prev) => ({ ...prev, regEmail: '' }));
                  }
                }}
                icon={<Mail className="w-4 h-4" />}
              />

              {/* Phone Number (Required, not used as login ID) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Mobile Number <span className="text-red-500">*</span>
                </label>
                <div
                  className={`flex items-center rounded-xl border transition-all overflow-hidden ${
                    fieldErrors.regPhone
                      ? 'border-red-300 focus-within:ring-2 focus-within:ring-red-400 bg-red-50/20'
                      : 'border-slate-300 focus-within:ring-2 focus-within:ring-brand-500 focus-within:border-brand-500 bg-white'
                  }`}
                >
                  <span className="bg-slate-100 px-3.5 py-2.5 text-xs font-bold text-slate-700 border-r border-slate-300 select-none">
                    +91
                  </span>
                  <input
                    type="tel"
                    required
                    maxLength={10}
                    autoComplete="tel"
                    inputMode="numeric"
                    placeholder="9876543210"
                    value={regPhone}
                    onChange={(e) => {
                      const clean = e.target.value.replace(/\D/g, '');
                      setRegPhone(clean);
                      if (fieldErrors.regPhone) {
                        setFieldErrors((prev) => ({ ...prev, regPhone: '' }));
                      }
                    }}
                    className="w-full px-3.5 py-2.5 text-sm sm:text-xs text-slate-900 placeholder:text-slate-400 outline-none bg-transparent"
                  />
                </div>
                {fieldErrors.regPhone ? (
                  <p className="text-[11px] text-red-600 mt-1 font-medium">{fieldErrors.regPhone}</p>
                ) : (
                  <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Required for verification & future OTPs. Not used as login ID.</span>
                  </p>
                )}
              </div>

              {/* Password */}
              <div className="relative">
                <Input
                  label="Password"
                  type={showRegPassword ? 'text' : 'password'}
                  required
                  autoComplete="new-password"
                  placeholder="Min 8 chars (letters & numbers)"
                  helperText="Minimum 8 characters with at least one letter and one number"
                  value={regPassword}
                  error={fieldErrors.regPassword}
                  onChange={(e) => {
                    setRegPassword(e.target.value);
                    if (fieldErrors.regPassword) {
                      setFieldErrors((prev) => ({ ...prev, regPassword: '' }));
                    }
                  }}
                  icon={<Lock className="w-4 h-4" />}
                />
                <button
                  type="button"
                  onClick={() => setShowRegPassword(!showRegPassword)}
                  tabIndex={-1}
                  className="absolute right-3.5 top-[29px] text-slate-400 hover:text-slate-600 transition-colors p-1"
                  aria-label={showRegPassword ? 'Hide password' : 'Show password'}
                >
                  {showRegPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Confirm Password */}
              <div className="relative">
                <Input
                  label="Confirm Password"
                  type={showRegConfirmPassword ? 'text' : 'password'}
                  required
                  autoComplete="new-password"
                  placeholder="Re-enter password"
                  value={regConfirmPassword}
                  error={fieldErrors.regConfirmPassword}
                  onChange={(e) => {
                    setRegConfirmPassword(e.target.value);
                    if (fieldErrors.regConfirmPassword) {
                      setFieldErrors((prev) => ({ ...prev, regConfirmPassword: '' }));
                    }
                  }}
                  icon={<Lock className="w-4 h-4" />}
                />
                <button
                  type="button"
                  onClick={() => setShowRegConfirmPassword(!showRegConfirmPassword)}
                  tabIndex={-1}
                  className="absolute right-3.5 top-[29px] text-slate-400 hover:text-slate-600 transition-colors p-1"
                  aria-label={showRegConfirmPassword ? 'Hide password' : 'Show password'}
                >
                  {showRegConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                variant="brand"
                size="lg"
                fullWidth
                isLoading={loading}
                icon={<ArrowRight className="w-4 h-4" />}
              >
                {loading
                  ? 'Creating Account...'
                  : role === 'WORKER'
                  ? 'Register as Worker'
                  : 'Create Customer Account'}
              </Button>

              {/* Switch to login link */}
              <div className="text-center pt-1 text-xs text-slate-600">
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setTab('login');
                    setError(null);
                    setFieldErrors({});
                  }}
                  className="text-brand-700 font-bold hover:underline"
                >
                  Sign In with Email
                </button>
              </div>
            </form>
          )}

          {/* TAB 3: MOBILE OTP FLOW (Preserved for backwards compatibility) */}
          {tab === 'otp' && (
            <div className="space-y-4">
              {otpStep === 'PHONE' ? (
                <form onSubmit={handleSendOtp} className="space-y-4">
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
                        value={otpPhone}
                        onChange={(e) => setOtpPhone(e.target.value.replace(/\D/g, ''))}
                        className="w-full px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 outline-none"
                      />
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1.5 flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>We'll send a 6-digit OTP code to verify your mobile number.</span>
                    </p>
                  </div>

                  <Button
                    type="submit"
                    variant="brand"
                    size="lg"
                    fullWidth
                    isLoading={loading}
                    disabled={loading || otpPhone.replace(/\D/g, '').length !== 10}
                    icon={<ArrowRight className="w-4 h-4" />}
                  >
                    {loading ? 'Sending OTP...' : 'Send OTP Code'}
                  </Button>

                  <div className="text-center pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        setTab('login');
                        setError(null);
                      }}
                      className="text-xs text-slate-600 hover:text-slate-900 font-semibold"
                    >
                      ← Back to Email + Password Login
                    </button>
                  </div>
                </form>
              ) : (
                <OtpStep
                  phone={otpPhone}
                  otp={otpCode}
                  onOtpChange={setOtpCode}
                  onSubmit={handleVerifyOtp}
                  onChangePhone={() => {
                    setOtpStep('PHONE');
                    setOtpCode('');
                    setError(null);
                  }}
                  onResendOtp={handleSendOtp}
                  resendTimer={resendTimer}
                  loading={loading}
                  error={error}
                />
              )}
            </div>
          )}

          {/* TAB 4: EMAIL OTP VERIFICATION FLOW */}
          {tab === 'email-otp' && (
            <form onSubmit={handleVerifyEmailOtp} className="space-y-4">
              <div className="text-center pb-1">
                <div className="mx-auto w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center mb-2">
                  <Mail className="w-6 h-6 text-emerald-600" />
                </div>
                <h3 className="text-sm font-bold text-slate-900">Verification code sent to your email</h3>
                <p className="text-xs text-slate-600 mt-1">
                  Enter the 6-digit OTP code sent to:
                </p>
                <p className="text-xs font-bold text-brand-800 mt-1 font-mono bg-brand-50/50 py-1 px-2 rounded-lg inline-block border border-brand-200">
                  {pendingEmail}
                </p>
              </div>

              <div>
                <input
                  type="text"
                  required
                  autoFocus
                  maxLength={6}
                  inputMode="numeric"
                  pattern="[0-9]*"
                  placeholder="• • • • • •"
                  value={otpCode}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, '');
                    setOtpCode(val);
                    if (error) setError(null);
                  }}
                  onPaste={(e) => {
                    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
                    if (pasted) {
                      setOtpCode(pasted);
                      e.preventDefault();
                    }
                  }}
                  className="w-full text-center tracking-[0.5em] text-2xl font-bold py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-brand-500 outline-none bg-white text-slate-900"
                />
              </div>

              <Button
                type="submit"
                variant="brand"
                size="lg"
                fullWidth
                isLoading={loading}
                disabled={loading || otpCode.length !== 6}
                icon={<ArrowRight className="w-4 h-4" />}
              >
                {loading ? 'Verifying...' : 'Verify Email & Continue'}
              </Button>

              <div className="flex items-center justify-between text-xs pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setTab('login');
                    setError(null);
                    setSuccessMsg(null);
                    setOtpCode('');
                  }}
                  className="text-slate-500 hover:text-slate-900 font-medium flex items-center gap-1 transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back to Login</span>
                </button>

                {resendTimer > 0 ? (
                  <span className="text-slate-400 font-medium">Resend code in {resendTimer}s</span>
                ) : (
                  <button
                    type="button"
                    onClick={handleResendEmailOtp}
                    disabled={loading}
                    className="text-brand-700 font-bold hover:underline"
                  >
                    Resend OTP
                  </button>
                )}
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
