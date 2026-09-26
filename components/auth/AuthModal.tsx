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
  User as UserIcon,
  Smartphone,
  Wrench,
  ChevronDown,
  Search,
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

export interface SkillOption {
  id: string;
  name: string;
  nameHi: string;
  categorySlug: string;
}

export const SKILL_OPTIONS: SkillOption[] = [
  { id: 'electrical', name: 'Electrician', nameHi: 'इलेक्ट्रीशियन', categorySlug: 'electrical' },
  { id: 'plumbing', name: 'Plumber', nameHi: 'प्लंबर', categorySlug: 'plumbing' },
  { id: 'carpenter', name: 'Carpenter', nameHi: 'बढ़ई', categorySlug: 'carpenter' },
  { id: 'painting', name: 'Painter', nameHi: 'पेंटर', categorySlug: 'painting' },
  { id: 'cook', name: 'Cook', nameHi: 'रसोइया', categorySlug: 'cook' },
  { id: 'cleaning', name: 'Cleaner', nameHi: 'सफाई कर्मचारी', categorySlug: 'cleaning' },
  { id: 'housekeeper', name: 'Housekeeper', nameHi: 'हाउसकीपर', categorySlug: 'cleaning' },
  { id: 'gardener', name: 'Gardener', nameHi: 'माली', categorySlug: 'gardener' },
  { id: 'driver', name: 'Driver', nameHi: 'ड्राइवर', categorySlug: 'driver' },
  { id: 'mason', name: 'Mason', nameHi: 'राजमिस्त्री', categorySlug: 'construction' },
  { id: 'welder', name: 'Welder', nameHi: 'वेल्डर', categorySlug: 'construction' },
  { id: 'mechanic', name: 'Mechanic', nameHi: 'मैकेनिक', categorySlug: 'mechanic' },
  { id: 'ac-tech', name: 'AC Technician', nameHi: 'एसी टेक्नीशियन', categorySlug: 'electrical' },
  { id: 'appliance-repair', name: 'Appliance Repair', nameHi: 'उपकरण मरम्मत', categorySlug: 'electrical' },
  { id: 'security-guard', name: 'Security Guard', nameHi: 'सुरक्षा गार्ड', categorySlug: 'watchman' },
  { id: 'construction-worker', name: 'Construction Worker', nameHi: 'निर्माण श्रमिक', categorySlug: 'construction' },
  { id: 'tailor', name: 'Tailor', nameHi: 'दर्जी', categorySlug: 'tailor' },
  { id: 'beautician', name: 'Beautician', nameHi: 'ब्यूटीशियन', categorySlug: 'beautician' },
  { id: 'delivery-worker', name: 'Delivery Worker', nameHi: 'डिलीवरी कर्मचारी', categorySlug: 'loading-moving' },
  { id: 'office-helper', name: 'Office Helper', nameHi: 'ऑफिस हेल्पर', categorySlug: 'office-boy' },
  { id: 'caretaker', name: 'Caretaker', nameHi: 'देखभाल करने वाला', categorySlug: 'house-care-taker' },
  { id: 'other', name: 'Other / Custom', nameHi: 'अन्य / कस्टम', categorySlug: 'other' },
];

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
  const [regSkill, setRegSkill] = useState('');
  const [customSkill, setCustomSkill] = useState('');
  const [skillDropdownOpen, setSkillDropdownOpen] = useState(false);
  const [skillSearchQuery, setSkillSearchQuery] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);

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
      setRegSkill('');
      setCustomSkill('');
      setSkillDropdownOpen(false);
      setSkillSearchQuery('');
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

  // Filter skills by search query
  const filteredSkills = SKILL_OPTIONS.filter((opt) => {
    const q = skillSearchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      opt.name.toLowerCase().includes(q) ||
      opt.nameHi.toLowerCase().includes(q)
    );
  });

  // Validation functions
  const validateEmail = (val: string): string | null => {
    const trimmed = val.trim();
    if (!trimmed) return 'ईमेल पता आवश्यक है / Email address is required';
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(trimmed)) {
      return 'कृपया एक मान्य ईमेल दर्ज करें / Please enter a valid email address';
    }
    return null;
  };

  const validatePhone = (val: string): string | null => {
    const digits = val.replace(/\D/g, '');
    if (!digits) return 'मोबाइल नंबर आवश्यक है / Mobile number is required';
    if (digits.length !== 10) return 'मोबाइल नंबर 10 अंकों का होना चाहिए / Mobile number must be 10 digits';
    if (!/^[6-9]/.test(digits)) return 'मोबाइल नंबर 6, 7, 8, या 9 से शुरू होना चाहिए / Mobile number must start with 6, 7, 8, or 9';
    return null;
  };

  const validatePassword = (val: string, isRegister = false): string | null => {
    if (!val) return 'पासवर्ड आवश्यक है / Password is required';
    if (isRegister) {
      if (val.length < 8) return 'पासवर्ड कम से कम 8 अक्षरों का होना चाहिए / Password must be at least 8 characters';
      if (!/[A-Za-z]/.test(val)) return 'पासवर्ड में कम से कम एक अक्षर होना चाहिए / Password must contain at least one letter';
      if (!/[0-9]/.test(val)) return 'पासवर्ड में कम से कम एक संख्या होनी चाहिए / Password must contain at least one number';
    }
    return null;
  };

  const validateName = (val: string): string | null => {
    const trimmed = val.trim();
    if (!trimmed) return 'पूरा नाम आवश्यक है / Full name is required';
    if (trimmed.length < 2) return 'पूरा नाम कम से कम 2 अक्षरों का होना चाहिए / Full name must be at least 2 characters';
    return null;
  };

  // Handle Login: Email + Password
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

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

  // Handle Registration: Name, Email, Phone Number, Skill (if Worker) + Password
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    const errors: { [key: string]: string } = {};

    const nameErr = validateName(regName);
    if (nameErr) errors.regName = nameErr;

    const emailErr = validateEmail(regEmail);
    if (emailErr) errors.regEmail = emailErr;

    const phoneErr = validatePhone(regPhone);
    if (phoneErr) errors.regPhone = phoneErr;

    if (role === 'WORKER') {
      if (!regSkill) {
        errors.regSkill = 'कृपया अपना कौशल चुनें / Please select your skill';
      } else if (regSkill === 'other' && !customSkill.trim()) {
        errors.customSkill = 'कृपया अपना कौशल दर्ज करें / Please enter your skill';
      }
    }

    const passErr = validatePassword(regPassword, true);
    if (passErr) errors.regPassword = passErr;

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
          ...(role === 'WORKER' && {
            skill: regSkill,
            customSkill: regSkill === 'other' ? customSkill.trim() : undefined,
          }),
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
              ? 'अपना Verified Labour खाता बनाएं / Create account'
              : tab === 'email-otp'
              ? 'ईमेल सत्यापित करें / Verify Email'
              : tab === 'otp'
              ? 'मोबाइल OTP से लॉगिन करें / Login with OTP'
              : 'Verified Labour लॉगिन / Login'
          }
          subtitle="सत्यापित • पास में • भरोसेमंद (Verified. Nearby. Reliable.)"
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

          {/* TAB 1: LOGIN FLOW */}
          {tab === 'login' && (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <Input
                  label="ईमेल पता * (Email Address *)"
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
                  icon={<Mail className="w-4 h-4 text-[#1264D6]" />}
                />
              </div>

              <div>
                <div className="relative">
                  <Input
                    label="पासवर्ड * (Password *)"
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
                    icon={<Lock className="w-4 h-4 text-[#1264D6]" />}
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
                {loading ? 'प्रमाणीकरण हो रहा है...' : 'लॉगिन करें / Sign In'}
              </Button>

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
                  <span>OTP से लॉगिन करें / Login with OTP</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setTab('register');
                    setError(null);
                    setFieldErrors({});
                  }}
                  className="text-[#1264D6] font-bold hover:underline font-devanagari"
                >
                  खाता बनाएं / Create account
                </button>
              </div>
            </form>
          )}

          {/* TAB 2: REGISTRATION FLOW */}
          {tab === 'register' && (
            <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
              {/* Account Type Selection */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 font-devanagari">
                  आप क्या करना चाहते हैं? (I want to):
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setRole('CUSTOMER')}
                    className={`p-2.5 rounded-xl border-2 text-left transition-all flex items-center gap-2.5 ${
                      role === 'CUSTOMER'
                        ? 'border-[#1264D6] bg-blue-50/50 shadow-xs'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="w-8 h-8 rounded-lg bg-blue-100 text-[#1264D6] flex items-center justify-center shrink-0">
                      <Users className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-bold text-xs text-slate-900 leading-tight font-devanagari">कामगार चाहिए</h4>
                      <p className="text-[10px] text-slate-500">Hire Workers (Customer)</p>
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
                    <div className="w-8 h-8 rounded-lg bg-navy-100 text-[#082B66] flex items-center justify-center shrink-0">
                      <HardHat className="w-4 h-4 text-[#082B66]" />
                    </div>
                    <div>
                      <h4 className="font-bold text-xs text-slate-900 leading-tight font-devanagari">रोज़ाना काम करें</h4>
                      <p className="text-[10px] text-slate-500">Earn Daily (Skilled Worker)</p>
                    </div>
                  </button>
                </div>
              </div>

              {/* Full Name */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 font-devanagari">
                  पूरा नाम <span className="text-red-500">*</span>
                  <span className="block text-[11px] text-slate-400 font-normal font-sans">
                    {role === 'WORKER' ? 'Full Name (as on official ID) *' : 'Full Name *'}
                  </span>
                </label>
                <div
                  className={`flex items-center rounded-xl border transition-all overflow-hidden bg-white ${
                    fieldErrors.regName
                      ? 'border-red-300 focus-within:ring-2 focus-within:ring-red-400 bg-red-50/20'
                      : 'border-slate-300 focus-within:ring-2 focus-within:ring-[#1264D6] focus-within:border-[#1264D6]'
                  }`}
                >
                  <span className="pl-3.5 pr-2 text-slate-400">
                    <UserIcon className="w-4 h-4 text-[#1264D6]" />
                  </span>
                  <input
                    type="text"
                    required
                    autoComplete="name"
                    placeholder="e.g. Ramesh Patel / रमेश पटेल"
                    value={regName}
                    onChange={(e) => {
                      setRegName(e.target.value);
                      if (fieldErrors.regName) {
                        setFieldErrors((prev) => ({ ...prev, regName: '' }));
                      }
                    }}
                    className="w-full py-2.5 pr-3.5 text-sm sm:text-xs text-slate-900 placeholder:text-slate-400 outline-none bg-transparent font-devanagari min-h-[44px]"
                  />
                </div>
                {fieldErrors.regName && (
                  <p className="text-[11px] text-red-600 mt-1 font-medium font-devanagari">{fieldErrors.regName}</p>
                )}
              </div>

              {/* Email Address */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 font-devanagari">
                  ईमेल पता <span className="text-red-500">*</span>
                  <span className="block text-[11px] text-slate-400 font-normal font-sans">
                    Email Address *
                  </span>
                </label>
                <div
                  className={`flex items-center rounded-xl border transition-all overflow-hidden bg-white ${
                    fieldErrors.regEmail
                      ? 'border-red-300 focus-within:ring-2 focus-within:ring-red-400 bg-red-50/20'
                      : 'border-slate-300 focus-within:ring-2 focus-within:ring-[#1264D6] focus-within:border-[#1264D6]'
                  }`}
                >
                  <span className="pl-3.5 pr-2 text-slate-400">
                    <Mail className="w-4 h-4 text-[#1264D6]" />
                  </span>
                  <input
                    type="email"
                    required
                    autoComplete="email"
                    inputMode="email"
                    placeholder="name@example.com"
                    value={regEmail}
                    onChange={(e) => {
                      setRegEmail(e.target.value);
                      if (fieldErrors.regEmail) {
                        setFieldErrors((prev) => ({ ...prev, regEmail: '' }));
                      }
                    }}
                    className="w-full py-2.5 pr-3.5 text-sm sm:text-xs text-slate-900 placeholder:text-slate-400 outline-none bg-transparent min-h-[44px]"
                  />
                </div>
                {fieldErrors.regEmail && (
                  <p className="text-[11px] text-red-600 mt-1 font-medium font-devanagari">{fieldErrors.regEmail}</p>
                )}
              </div>

              {/* Mobile Number */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 font-devanagari">
                  मोबाइल नंबर <span className="text-red-500">*</span>
                  <span className="block text-[11px] text-slate-400 font-normal font-sans">
                    Mobile Number *
                  </span>
                </label>
                <div
                  className={`flex items-center rounded-xl border transition-all overflow-hidden bg-white ${
                    fieldErrors.regPhone
                      ? 'border-red-300 focus-within:ring-2 focus-within:ring-red-400 bg-red-50/20'
                      : 'border-slate-300 focus-within:ring-2 focus-within:ring-[#1264D6] focus-within:border-[#1264D6]'
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
                    className="w-full px-3.5 py-2.5 text-sm sm:text-xs text-slate-900 placeholder:text-slate-400 outline-none bg-transparent min-h-[44px]"
                  />
                </div>
                {fieldErrors.regPhone && (
                  <p className="text-[11px] text-red-600 mt-1 font-medium font-devanagari">{fieldErrors.regPhone}</p>
                )}
              </div>

              {/* Type of Skill (Worker Only) */}
              {role === 'WORKER' && (
                <div className="relative">
                  <label className="block text-xs font-bold text-slate-700 mb-1 font-devanagari">
                    कौशल का प्रकार <span className="text-red-500">*</span>
                    <span className="block text-[11px] text-slate-400 font-normal font-sans">
                      Type of Skill *
                    </span>
                  </label>

                  {/* Dropdown Trigger Button */}
                  <button
                    type="button"
                    onClick={() => setSkillDropdownOpen(!skillDropdownOpen)}
                    className={`w-full px-3.5 py-2.5 rounded-xl border text-left transition-all flex items-center justify-between min-h-[44px] bg-white ${
                      fieldErrors.regSkill
                        ? 'border-red-300 focus:ring-2 focus:ring-red-400 bg-red-50/20'
                        : 'border-slate-300 focus:ring-2 focus:ring-[#1264D6] focus:border-[#1264D6]'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <Wrench className="w-4 h-4 text-[#1264D6] shrink-0" />
                      {regSkill ? (
                        <div className="min-w-0 font-devanagari">
                          <span className="font-bold text-xs text-[#082B66] block truncate">
                            {SKILL_OPTIONS.find((s) => s.id === regSkill)?.nameHi}
                          </span>
                          <span className="text-[10px] text-slate-500 font-sans block truncate">
                            {SKILL_OPTIONS.find((s) => s.id === regSkill)?.name}
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400 font-devanagari">
                          कौशल चुनें / Select Skill
                        </span>
                      )}
                    </div>
                    <ChevronDown className={`w-4 h-4 text-slate-400 shrink-0 transition-transform ${skillDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {/* Validation Error */}
                  {fieldErrors.regSkill && (
                    <p className="text-[11px] text-red-600 mt-1 font-medium font-devanagari">
                      {fieldErrors.regSkill}
                    </p>
                  )}

                  {/* Popover / Dropdown Menu */}
                  {skillDropdownOpen && (
                    <div className="absolute left-0 right-0 top-full mt-1 bg-white rounded-2xl border border-slate-200 shadow-2xl z-50 p-2 space-y-2 animate-in fade-in zoom-in-95 duration-150">
                      {/* Search Input */}
                      <div className="relative">
                        <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
                        <input
                          type="text"
                          placeholder="कौशल खोजें / Search Skill"
                          value={skillSearchQuery}
                          onChange={(e) => setSkillSearchQuery(e.target.value)}
                          className="w-full pl-8 pr-3 py-2 text-xs rounded-xl border border-slate-200 outline-none focus:border-[#1264D6] focus:ring-1 focus:ring-[#1264D6] font-devanagari"
                        />
                      </div>

                      {/* Options List */}
                      <div className="max-h-52 overflow-y-auto space-y-1 pr-1">
                        {filteredSkills.length > 0 ? (
                          filteredSkills.map((opt) => {
                            const isSelected = regSkill === opt.id;
                            return (
                              <button
                                key={opt.id}
                                type="button"
                                onClick={() => {
                                  setRegSkill(opt.id);
                                  setSkillDropdownOpen(false);
                                  setSkillSearchQuery('');
                                  if (fieldErrors.regSkill) {
                                    setFieldErrors((prev) => ({ ...prev, regSkill: '' }));
                                  }
                                }}
                                className={`w-full p-2 rounded-xl text-left transition-colors flex items-center justify-between font-devanagari ${
                                  isSelected
                                    ? 'bg-blue-50 text-[#1264D6] border border-blue-200 font-bold'
                                    : 'hover:bg-slate-50 text-slate-700'
                                }`}
                              >
                                <div className="min-w-0">
                                  <span className="block text-xs font-bold text-[#082B66]">
                                    {opt.nameHi}
                                  </span>
                                  <span className="block text-[10px] text-slate-500 font-normal font-sans">
                                    {opt.name}
                                  </span>
                                </div>
                                {isSelected && <CheckCircle2 className="w-4 h-4 text-[#1264D6] shrink-0" />}
                              </button>
                            );
                          })
                        ) : (
                          <div className="p-3 text-center text-xs text-slate-400 font-devanagari">
                            कोई कौशल नहीं मिला / No skills found
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Custom Skill Input Field if 'other' is selected */}
                  {regSkill === 'other' && (
                    <div className="mt-2.5 space-y-1">
                      <label className="block text-xs font-bold text-slate-700 font-devanagari">
                        अपना कौशल लिखें <span className="text-red-500">*</span>
                        <span className="block text-[11px] text-slate-400 font-normal font-sans">
                          Enter Your Skill *
                        </span>
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="उदा. सोलर टेक्नीशियन / e.g. Solar Tech, CCTV Expert"
                        value={customSkill}
                        onChange={(e) => {
                          setCustomSkill(e.target.value);
                          if (fieldErrors.customSkill) {
                            setFieldErrors((prev) => ({ ...prev, customSkill: '' }));
                          }
                        }}
                        className={`w-full px-3.5 py-2.5 rounded-xl border text-xs text-slate-900 outline-none transition-all font-devanagari min-h-[44px] bg-white ${
                          fieldErrors.customSkill
                            ? 'border-red-300 focus:ring-2 focus:ring-red-400 bg-red-50/20'
                            : 'border-slate-300 focus:ring-2 focus:ring-[#1264D6] focus:border-[#1264D6]'
                        }`}
                      />
                      {fieldErrors.customSkill && (
                        <p className="text-[11px] text-red-600 font-medium font-devanagari">
                          {fieldErrors.customSkill}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Password */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 font-devanagari">
                  पासवर्ड <span className="text-red-500">*</span>
                  <span className="block text-[11px] text-slate-400 font-normal font-sans">
                    Password *
                  </span>
                </label>
                <div className="relative">
                  <div
                    className={`flex items-center rounded-xl border transition-all overflow-hidden bg-white ${
                      fieldErrors.regPassword
                        ? 'border-red-300 focus-within:ring-2 focus-within:ring-red-400 bg-red-50/20'
                        : 'border-slate-300 focus-within:ring-2 focus-within:ring-[#1264D6] focus-within:border-[#1264D6]'
                    }`}
                  >
                    <span className="pl-3.5 pr-2 text-slate-400">
                      <Lock className="w-4 h-4 text-[#1264D6]" />
                    </span>
                    <input
                      type={showRegPassword ? 'text' : 'password'}
                      required
                      autoComplete="new-password"
                      placeholder="Min 8 chars (letters & numbers)"
                      value={regPassword}
                      onChange={(e) => {
                        setRegPassword(e.target.value);
                        if (fieldErrors.regPassword) {
                          setFieldErrors((prev) => ({ ...prev, regPassword: '' }));
                        }
                      }}
                      className="w-full py-2.5 pr-10 text-sm sm:text-xs text-slate-900 placeholder:text-slate-400 outline-none bg-transparent min-h-[44px]"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowRegPassword(!showRegPassword)}
                    tabIndex={-1}
                    className="absolute right-3.5 top-[10px] text-slate-400 hover:text-slate-600 transition-colors p-1"
                    aria-label={showRegPassword ? 'Hide password' : 'Show password'}
                  >
                    {showRegPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {fieldErrors.regPassword && (
                  <p className="text-[11px] text-red-600 mt-1 font-medium font-devanagari">{fieldErrors.regPassword}</p>
                )}
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
                  ? 'खाता बनाया जा रहा है...'
                  : role === 'WORKER'
                  ? 'कामगार के रूप में रजिस्टर करें / Register as Worker'
                  : 'ग्राहक खाता बनाएं / Create Account'}
              </Button>

              {/* Switch to login link */}
              <div className="text-center pt-1 text-xs text-slate-600 font-devanagari">
                क्या आपके पास पहले से खाता है?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setTab('login');
                    setError(null);
                    setFieldErrors({});
                  }}
                  className="text-[#1264D6] font-bold hover:underline"
                >
                  लॉगिन करें / Sign In
                </button>
              </div>
            </form>
          )}

          {/* TAB 3: MOBILE OTP FLOW */}
          {tab === 'otp' && (
            <div className="space-y-4">
              {otpStep === 'PHONE' ? (
                <form onSubmit={handleSendOtp} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5 font-devanagari">
                      मोबाइल नंबर <span className="text-red-500">*</span> (Mobile Number *)
                    </label>
                    <div className="flex rounded-xl border border-slate-300 overflow-hidden focus-within:ring-2 focus-within:ring-[#1264D6] focus-within:border-[#1264D6] bg-white">
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
                        className="w-full px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 outline-none min-h-[44px]"
                      />
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1.5 flex items-center gap-1 font-devanagari">
                      <ShieldCheck className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>हम आपको 6 अंकों का OTP कोड भेजेंगे।</span>
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
                    {loading ? 'OTP भेजा जा रहा है...' : 'OTP कोड भेजें / Send OTP'}
                  </Button>

                  <div className="text-center pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        setTab('login');
                        setError(null);
                      }}
                      className="text-xs text-slate-600 hover:text-slate-900 font-semibold font-devanagari"
                    >
                      ← ईमेल लॉगिन पर वापस जाएं / Back to Email Login
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
            <form onSubmit={handleVerifyEmailOtp} className="space-y-4 font-devanagari">
              <div className="text-center pb-1">
                <div className="mx-auto w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center mb-2">
                  <Mail className="w-6 h-6 text-emerald-600" />
                </div>
                <h3 className="text-sm font-bold text-slate-900">आपकी ईमेल पर कोड भेज दिया गया है</h3>
                <p className="text-xs text-slate-600 mt-1">
                  6 अंकों का OTP दर्ज करें:
                </p>
                <p className="text-xs font-bold text-[#1264D6] mt-1 font-mono bg-blue-50/50 py-1 px-2 rounded-lg inline-block border border-blue-200">
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
                  className="w-full text-center tracking-[0.5em] text-2xl font-bold py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#1264D6] outline-none bg-white text-slate-900"
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
                {loading ? 'सत्यापित हो रहा है...' : 'सत्यापित करें / Verify & Continue'}
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
                  <span>लॉगिन पर वापस / Back to Login</span>
                </button>

                {resendTimer > 0 ? (
                  <span className="text-slate-400 font-medium">{resendTimer}s में पुनः भेजें</span>
                ) : (
                  <button
                    type="button"
                    onClick={handleResendEmailOtp}
                    disabled={loading}
                    className="text-[#1264D6] font-bold hover:underline"
                  >
                    पुनः भेजें / Resend OTP
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
