'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  AlertCircle,
  ArrowRight,
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
  Edit2,
} from 'lucide-react';
import AuthHeader from './AuthHeader';
import OtpStep from './OtpStep';
import Button from '../ui/Button';
import Input from '../ui/Input';
import { useLanguage } from '@/context/LanguageContext';

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
  { id: 'other', name: 'Other', nameHi: 'अन्य', categorySlug: 'other' },
];

export default function AuthModal({
  isOpen,
  onClose,
  initialMode = 'login',
  defaultRole = 'CUSTOMER',
  onSuccess,
}: AuthModalProps) {
  const router = useRouter();
  const { isHindi } = useLanguage();

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

  // Mobile OTP & Email verification states
  const [otpPhone, setOtpPhone] = useState('');
  const [pendingEmail, setPendingEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [otpStep, setOtpStep] = useState<'PHONE' | 'OTP'>('PHONE');
  const [resendTimer, setResendTimer] = useState(0);

  // Edit Email states
  const [isEditingEmail, setIsEditingEmail] = useState(false);
  const [editedEmail, setEditedEmail] = useState('');
  const [editEmailError, setEditEmailError] = useState<string | null>(null);
  const [editEmailLoading, setEditEmailLoading] = useState(false);

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
      setIsEditingEmail(false);
      setEditedEmail('');
      setEditEmailError(null);
      setEditEmailLoading(false);
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
  const filteredSkills = SKILL_OPTIONS.filter((s) => {
    const q = skillSearchQuery.toLowerCase().trim();
    if (!q) return true;
    return s.name.toLowerCase().includes(q) || s.nameHi.includes(q);
  });

  // Validation functions
  const validateEmail = (val: string): string | null => {
    const trimmed = val.trim();
    if (!trimmed) return isHindi ? 'ईमेल पता आवश्यक है' : 'Email address is required';
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(trimmed)) {
      return isHindi ? 'कृपया एक मान्य ईमेल दर्ज करें' : 'Please enter a valid email address';
    }
    return null;
  };

  const validatePhone = (val: string): string | null => {
    const digits = val.replace(/\D/g, '');
    if (!digits) return isHindi ? 'मोबाइल नंबर आवश्यक है' : 'Mobile number is required';
    if (digits.length !== 10) return isHindi ? 'मोबाइल नंबर 10 अंकों का होना चाहिए' : 'Mobile number must be 10 digits';
    if (!/^[6-9]/.test(digits)) return isHindi ? 'मोबाइल नंबर 6, 7, 8, या 9 से शुरू होना चाहिए' : 'Mobile number must start with 6, 7, 8, or 9';
    return null;
  };

  const validatePassword = (val: string, isRegister = false): string | null => {
    if (!val) return isHindi ? 'पासवर्ड आवश्यक है' : 'Password is required';
    if (isRegister) {
      if (val.length < 8) return isHindi ? 'पासवर्ड कम से कम 8 अक्षरों का होना चाहिए' : 'Password must be at least 8 characters';
      if (!/[A-Za-z]/.test(val)) return isHindi ? 'पासवर्ड में कम से कम एक अक्षर होना चाहिए' : 'Password must contain at least one letter';
      if (!/[0-9]/.test(val)) return isHindi ? 'पासवर्ड में कम से कम एक संख्या होनी चाहिए' : 'Password must contain at least one number';
    }
    return null;
  };

  const validateName = (val: string): string | null => {
    const trimmed = val.trim();
    if (!trimmed) return isHindi ? 'पूरा नाम आवश्यक है' : 'Full name is required';
    if (trimmed.length < 2) return isHindi ? 'पूरा नाम कम से कम 2 अक्षरों का होना चाहिए' : 'Full name must be at least 2 characters';
    return null;
  };

  // Handle Login: Email + Password
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    const emailErr = validateEmail(loginEmail);
    const passErr = validatePassword(loginPassword, false);

    if (emailErr || passErr) {
      setFieldErrors({
        ...(emailErr && { loginEmail: emailErr }),
        ...(passErr && { loginPassword: passErr }),
      });
      return;
    }

    setFieldErrors({});
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: loginEmail.trim().toLowerCase(),
          password: loginPassword,
        }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        if (data.requiresVerification && data.email) {
          setPendingEmail(data.email);
          setTab('email-otp');
          setResendTimer(60);
          setError(data.error || (isHindi ? 'खाता सत्यापित नहीं है। कृपया ईमेल OTP दर्ज करें।' : 'Account is unverified. Please enter email OTP.'));
          return;
        }
        throw new Error(data.error || (isHindi ? 'लॉगिन करने में विफल' : 'Failed to login'));
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

    const nameErr = validateName(regName);
    const emailErr = validateEmail(regEmail);
    const phoneErr = validatePhone(regPhone);
    const passErr = validatePassword(regPassword, true);

    const errors: { [key: string]: string } = {};
    if (nameErr) errors.regName = nameErr;
    if (emailErr) errors.regEmail = emailErr;
    if (phoneErr) errors.regPhone = phoneErr;
    if (passErr) errors.regPassword = passErr;

    if (role === 'WORKER') {
      if (!regSkill) {
        errors.regSkill = isHindi ? 'कृपया अपना कौशल चुनें' : 'Please select your skill';
      } else if (regSkill === 'other' && !customSkill.trim()) {
        errors.customSkill = isHindi ? 'कृपया अपना कौशल दर्ज करें' : 'Please enter your skill';
      }
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setFieldErrors({});
    setLoading(true);

    const effectiveSkill = regSkill === 'other' ? customSkill.trim() : regSkill;

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: regName.trim(),
          email: regEmail.trim().toLowerCase(),
          phone: regPhone.replace(/\D/g, ''),
          password: regPassword,
          role,
          skill: role === 'WORKER' ? effectiveSkill : undefined,
        }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || (isHindi ? 'पंजीकरण करने में विफल' : 'Failed to register'));
      }

      if (data.requiresVerification) {
        setPendingEmail(regEmail.trim().toLowerCase());
        setTab('email-otp');
        setResendTimer(60);
        setSuccessMsg(
          data.message || (isHindi ? 'सत्यापन कोड आपके ईमेल पर भेज दिया गया है।' : 'Verification code sent to your email.')
        );
      } else {
        completeLogin(data.user);
      }
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
    setLoading(true);

    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: pendingEmail,
          otp: otpCode,
        }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || (isHindi ? 'अमान्य OTP कोड' : 'Invalid OTP code'));
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
    setLoading(true);

    try {
      const res = await fetch('/api/auth/resend-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: pendingEmail }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || (isHindi ? 'OTP पुनः भेजने में विफल' : 'Failed to resend OTP'));
      }

      setResendTimer(60);
      setSuccessMsg(data.message || (isHindi ? 'नया OTP आपके ईमेल पर भेज दिया गया है!' : 'New OTP code sent to your email!'));
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Handle Save Edited Email
  const handleSaveEditedEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setEditEmailError(null);

    const emailErr = validateEmail(editedEmail);
    if (emailErr) {
      setEditEmailError(emailErr);
      return;
    }

    setEditEmailLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/auth/change-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          oldEmail: pendingEmail,
          newEmail: editedEmail.trim().toLowerCase(),
        }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || (isHindi ? 'ईमेल बदलने में विफल' : 'Failed to update email address'));
      }

      setPendingEmail(editedEmail.trim().toLowerCase());
      setIsEditingEmail(false);
      setResendTimer(60);
      setOtpCode('');
      setSuccessMsg(data.message || (isHindi ? 'ईमेल अपडेट किया गया और नया OTP भेजा गया!' : 'Email updated and new OTP sent!'));
    } catch (err: any) {
      setEditEmailError(err.message);
    } finally {
      setEditEmailLoading(false);
    }
  };

  // Handle Send OTP (Fallback)
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
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
        throw new Error(data.error || (isHindi ? 'OTP कोड भेजने में विफल' : 'Failed to dispatch OTP code'));
      }

      setOtpStep('OTP');
      setResendTimer(60);
      setSuccessMsg(data.message || (isHindi ? 'OTP कोड सफलतापूर्वक भेजा गया!' : 'OTP code sent successfully!'));
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
        throw new Error(data.error || (isHindi ? 'अमान्य OTP कोड' : 'Invalid OTP code'));
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
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-150 font-devanagari">
      <div className="bg-white rounded-t-2xl sm:rounded-2xl max-w-md w-full shadow-2xl border border-slate-100 overflow-hidden transform transition-all animate-in zoom-in-95 duration-150 max-h-[92vh] sm:max-h-[92vh] flex flex-col">
        {/* Header */}
        <AuthHeader
          title={
            tab === 'email-otp'
              ? (isHindi ? 'ईमेल सत्यापित करें' : 'Verify Email')
              : tab === 'otp'
              ? (isHindi ? 'मोबाइल OTP से लॉगिन करें' : 'Login with OTP')
              : undefined
          }
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
            <form onSubmit={handleLoginSubmit} className="space-y-4 font-devanagari">
              <div>
                <Input
                  label={isHindi ? 'ईमेल पता *' : 'Email Address *'}
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
                    label={isHindi ? 'पासवर्ड *' : 'Password *'}
                    type={showLoginPassword ? 'text' : 'password'}
                    required
                    autoComplete="current-password"
                    placeholder={isHindi ? 'अपना पासवर्ड दर्ज करें' : 'Enter your password'}
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
                {loading
                  ? (isHindi ? 'प्रमाणीकरण हो रहा है...' : 'Authenticating...')
                  : (isHindi ? 'लॉगिन करें' : 'Sign In')}
              </Button>

              <div className="pt-1 flex items-center justify-between text-xs font-devanagari">
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
                  <span>{isHindi ? 'OTP से लॉगिन करें' : 'Login with OTP'}</span>
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
                  {isHindi ? 'खाता बनाएं' : 'Create account'}
                </button>
              </div>
            </form>
          )}

          {/* TAB 2: REGISTRATION FLOW */}
          {tab === 'register' && (
            <form onSubmit={handleRegisterSubmit} className="space-y-3.5 font-devanagari">
              {/* Account Creation Heading */}
              <div>
                <h3 className="text-center text-base sm:text-lg font-bold text-slate-900 leading-snug">
                  {isHindi ? 'नया खाता बनाएं' : 'Create Account'}
                </h3>
              </div>

              {/* Account Type Selection */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  {isHindi ? 'आप क्या करना चाहते हैं?' : 'I want to:'}
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
                      <h4 className="font-bold text-xs text-slate-900 leading-tight">
                        {isHindi ? 'कामगार बुक करें' : 'Hire Workers'}
                      </h4>
                      <p className="text-[10px] text-slate-500">
                        {isHindi ? 'वर्कर खोजें (ग्राहक)' : 'Customer Account'}
                      </p>
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
                      <h4 className="font-bold text-xs text-slate-900 leading-tight">
                        {isHindi ? 'रोज़ाना काम करें' : 'Earn Daily'}
                      </h4>
                      <p className="text-[10px] text-slate-500">
                        {isHindi ? 'कुशल कारीगर (वर्कर)' : 'Skilled Worker'}
                      </p>
                    </div>
                  </button>
                </div>
              </div>

              {/* Full Name */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {role === 'WORKER'
                    ? (isHindi ? 'पूरा नाम (आईडी के अनुसार) *' : 'Full Name (as per ID) *')
                    : (isHindi ? 'पूरा नाम *' : 'Full Name *')}
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
                    placeholder={isHindi ? 'उदा. रमेश पटेल' : 'e.g. Ramesh Patel'}
                    value={regName}
                    onChange={(e) => {
                      setRegName(e.target.value);
                      if (fieldErrors.regName) {
                        setFieldErrors((prev) => ({ ...prev, regName: '' }));
                      }
                    }}
                    className="w-full py-2.5 pr-3.5 text-sm sm:text-xs text-slate-900 placeholder:text-slate-400 outline-none bg-transparent min-h-[44px]"
                  />
                </div>
                {fieldErrors.regName && (
                  <p className="text-[11px] text-red-600 mt-1 font-medium">{fieldErrors.regName}</p>
                )}
              </div>

              {/* Email Address */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {isHindi ? 'ईमेल पता *' : 'Email Address *'}
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
                  <p className="text-[11px] text-red-600 mt-1 font-medium">{fieldErrors.regEmail}</p>
                )}
              </div>

              {/* Mobile Number */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {isHindi ? 'मोबाइल नंबर *' : 'Mobile Number *'}
                </label>
                <div
                  className={`flex items-center rounded-xl border transition-all overflow-hidden bg-white ${
                    fieldErrors.regPhone
                      ? 'border-red-300 focus-within:ring-2 focus-within:ring-red-400 bg-red-50/20'
                      : 'border-slate-300 focus-within:ring-2 focus-within:ring-[#1264D6] focus-within:border-[#1264D6]'
                  }`}
                >
                  <span className="bg-slate-100 px-3.5 py-2.5 text-xs font-bold text-slate-700 border-r border-slate-300 select-none font-sans">
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
                    className="w-full px-3.5 py-2.5 text-sm sm:text-xs text-slate-900 placeholder:text-slate-400 outline-none bg-transparent min-h-[44px] font-sans"
                  />
                </div>
                {fieldErrors.regPhone && (
                  <p className="text-[11px] text-red-600 mt-1 font-medium">{fieldErrors.regPhone}</p>
                )}
              </div>

              {/* Type of Skill (Worker Only) */}
              {role === 'WORKER' && (
                <div className="relative">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {isHindi ? 'कौशल का प्रकार *' : 'Type of Skill *'}
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
                        <div className="min-w-0">
                          <span className="font-bold text-xs text-[#082B66] block truncate">
                            {isHindi
                              ? SKILL_OPTIONS.find((s) => s.id === regSkill)?.nameHi
                              : SKILL_OPTIONS.find((s) => s.id === regSkill)?.name}
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400">
                          {isHindi ? 'कौशल चुनें' : 'Select Skill'}
                        </span>
                      )}
                    </div>
                    <ChevronDown className={`w-4 h-4 text-slate-400 shrink-0 transition-transform ${skillDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {/* Validation Error */}
                  {fieldErrors.regSkill && (
                    <p className="text-[11px] text-red-600 mt-1 font-medium">
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
                          placeholder={isHindi ? 'कौशल खोजें...' : 'Search Skill...'}
                          value={skillSearchQuery}
                          onChange={(e) => setSkillSearchQuery(e.target.value)}
                          className="w-full pl-8 pr-3 py-2 text-xs rounded-xl border border-slate-200 outline-none focus:border-[#1264D6] focus:ring-1 focus:ring-[#1264D6]"
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
                                className={`w-full p-2 rounded-xl text-left transition-colors flex items-center justify-between ${
                                  isSelected
                                    ? 'bg-blue-50 text-[#1264D6] border border-blue-200 font-bold'
                                    : 'hover:bg-slate-50 text-slate-700'
                                }`}
                              >
                                <div className="min-w-0">
                                  <span className="block text-xs font-bold text-[#082B66]">
                                    {isHindi ? opt.nameHi : opt.name}
                                  </span>
                                </div>
                                {isSelected && <CheckCircle2 className="w-4 h-4 text-[#1264D6] shrink-0" />}
                              </button>
                            );
                          })
                        ) : (
                          <div className="p-3 text-center text-xs text-slate-400">
                            {isHindi ? 'कोई कौशल नहीं मिला' : 'No skills found'}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Custom Skill Input Field if 'other' is selected */}
                  {regSkill === 'other' && (
                    <div className="mt-2.5 space-y-1">
                      <label className="block text-xs font-bold text-slate-700">
                        {isHindi ? 'अपना कौशल लिखें *' : 'Enter Your Skill *'}
                      </label>
                      <input
                        type="text"
                        required
                        placeholder={isHindi ? 'उदा. सोलर टेक्नीशियन' : 'e.g. Solar Tech, CCTV Expert'}
                        value={customSkill}
                        onChange={(e) => {
                          setCustomSkill(e.target.value);
                          if (fieldErrors.customSkill) {
                            setFieldErrors((prev) => ({ ...prev, customSkill: '' }));
                          }
                        }}
                        className={`w-full px-3.5 py-2.5 rounded-xl border text-xs text-slate-900 outline-none transition-all min-h-[44px] bg-white ${
                          fieldErrors.customSkill
                            ? 'border-red-300 focus:ring-2 focus:ring-red-400 bg-red-50/20'
                            : 'border-slate-300 focus:ring-2 focus:ring-[#1264D6] focus:border-[#1264D6]'
                        }`}
                      />
                      {fieldErrors.customSkill && (
                        <p className="text-[11px] text-red-600 font-medium">
                          {fieldErrors.customSkill}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Password */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {isHindi ? 'पासवर्ड *' : 'Password *'}
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
                      placeholder={isHindi ? 'कम से कम 8 अक्षर (अक्षर व संख्या)' : 'Min 8 chars (letters & numbers)'}
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
                  <p className="text-[11px] text-red-600 mt-1 font-medium">{fieldErrors.regPassword}</p>
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
                  ? (isHindi ? 'खाता बनाया जा रहा है...' : 'Creating account...')
                  : role === 'WORKER'
                  ? (isHindi ? 'वर्कर के रूप में रजिस्टर करें' : 'Register as Worker')
                  : (isHindi ? 'ग्राहक खाता बनाएं' : 'Create Account')}
              </Button>

              {/* Switch to login link */}
              <div className="text-center pt-1 text-xs text-slate-600">
                {isHindi ? 'क्या आपके पास पहले से खाता है? ' : 'Already have an account? '}
                <button
                  type="button"
                  onClick={() => {
                    setTab('login');
                    setError(null);
                    setFieldErrors({});
                  }}
                  className="text-[#1264D6] font-bold hover:underline"
                >
                  {isHindi ? 'लॉगिन करें' : 'Sign In'}
                </button>
              </div>
            </form>
          )}

          {/* TAB 3: MOBILE OTP FLOW */}
          {tab === 'otp' && (
            <div className="space-y-4 font-devanagari">
              {otpStep === 'PHONE' ? (
                <form onSubmit={handleSendOtp} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      {isHindi ? 'मोबाइल नंबर *' : 'Mobile Number *'}
                    </label>
                    <div className="flex rounded-xl border border-slate-300 overflow-hidden focus-within:ring-2 focus-within:ring-[#1264D6] focus-within:border-[#1264D6] bg-white">
                      <span className="bg-slate-100 px-3.5 py-2.5 text-xs font-bold text-slate-700 border-r border-slate-300 flex items-center select-none font-sans">
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
                        className="w-full px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 outline-none min-h-[44px] font-sans"
                      />
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1.5 flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{isHindi ? 'हम आपको 6 अंकों का OTP कोड भेजेंगे।' : "We'll send a 6-digit OTP code."}</span>
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
                    {loading
                      ? (isHindi ? 'OTP भेजा जा रहा है...' : 'Sending OTP...')
                      : (isHindi ? 'OTP कोड भेजें' : 'Send OTP')}
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
                      {isHindi ? '← ईमेल लॉगिन पर वापस जाएं' : '← Back to Email Login'}
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
            <div className="font-devanagari">
              {isEditingEmail ? (
                <form onSubmit={handleSaveEditedEmail} className="space-y-4 animate-in fade-in duration-150">
                  <div className="text-center pb-1">
                    <div className="mx-auto w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center mb-2">
                      <Edit2 className="w-6 h-6 text-[#1264D6]" />
                    </div>
                    <h3 className="text-sm font-bold text-slate-900">
                      {isHindi ? 'ईमेल पता बदलें' : 'Edit Email Address'}
                    </h3>
                    <p className="text-xs text-slate-600 mt-1">
                      {isHindi
                        ? 'अपना सही ईमेल पता दर्ज करें। हम इस पर एक नया OTP भेजेंगे।'
                        : 'Enter your correct email address. We will send a new OTP to it.'}
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      {isHindi ? 'सही ईमेल पता *' : 'Correct Email Address *'}
                    </label>
                    <div
                      className={`flex items-center rounded-xl border transition-all overflow-hidden bg-white ${
                        editEmailError
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
                        autoFocus
                        autoComplete="email"
                        inputMode="email"
                        placeholder="name@example.com"
                        value={editedEmail}
                        onChange={(e) => {
                          setEditedEmail(e.target.value);
                          if (editEmailError) setEditEmailError(null);
                        }}
                        className="w-full py-2.5 pr-3.5 text-sm sm:text-xs text-slate-900 placeholder:text-slate-400 outline-none bg-transparent min-h-[44px]"
                      />
                    </div>
                    {editEmailError && (
                      <p className="text-[11px] text-red-600 mt-1 font-medium">{editEmailError}</p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        setIsEditingEmail(false);
                        setEditEmailError(null);
                      }}
                      disabled={editEmailLoading}
                      className="w-1/3 py-2.5 px-3 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors min-h-[44px]"
                    >
                      {isHindi ? 'रद्द करें' : 'Cancel'}
                    </button>

                    <Button
                      type="submit"
                      variant="brand"
                      size="lg"
                      className="w-2/3 min-h-[44px]"
                      isLoading={editEmailLoading}
                      disabled={editEmailLoading || !editedEmail.trim()}
                      icon={<ArrowRight className="w-4 h-4" />}
                    >
                      {editEmailLoading
                        ? (isHindi ? 'भेजा जा रहा है...' : 'Sending...')
                        : (isHindi ? 'नया OTP भेजें' : 'Save & Send OTP')}
                    </Button>
                  </div>
                </form>
              ) : (
                <form onSubmit={handleVerifyEmailOtp} className="space-y-4">
                  <div className="text-center pb-1">
                    <div className="mx-auto w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center mb-2">
                      <Mail className="w-6 h-6 text-emerald-600" />
                    </div>
                    <h3 className="text-sm font-bold text-slate-900">
                      {isHindi ? 'आपकी ईमेल पर कोड भेज दिया गया है' : 'Code sent to your email'}
                    </h3>
                    <p className="text-xs text-slate-600 mt-1">
                      {isHindi ? '6 अंकों का OTP दर्ज करें:' : 'Enter 6-digit OTP:'}
                    </p>
                    <div className="mt-2 flex flex-col sm:flex-row items-center justify-center gap-2">
                      <span className="text-xs font-bold text-[#1264D6] font-mono bg-blue-50/80 py-1.5 px-3 rounded-lg inline-block border border-blue-200 break-all max-w-full">
                        {pendingEmail}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setEditedEmail(pendingEmail);
                          setEditEmailError(null);
                          setIsEditingEmail(true);
                        }}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#1264D6] hover:text-[#082B66] hover:bg-blue-100/60 bg-blue-50/50 px-2.5 py-1.5 rounded-lg border border-blue-200 transition-all cursor-pointer active:scale-95 touch-manipulation min-h-[36px]"
                        title={isHindi ? "ईमेल बदलें" : "Edit Email"}
                      >
                        <Edit2 className="w-3.5 h-3.5 text-[#1264D6]" />
                        <span>{isHindi ? 'ईमेल बदलें' : 'Edit Email'}</span>
                      </button>
                    </div>
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
                      className="w-full text-center tracking-[0.5em] text-2xl font-bold py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#1264D6] outline-none bg-white text-slate-900 font-sans"
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
                    {loading
                      ? (isHindi ? 'सत्यापित हो रहा है...' : 'Verifying...')
                      : (isHindi ? 'सत्यापित करें' : 'Verify & Continue')}
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
                      className="text-slate-500 hover:text-slate-900 font-medium flex items-center gap-1 transition-colors min-h-[36px]"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      <span>{isHindi ? 'लॉगिन पर वापस' : 'Back to Login'}</span>
                    </button>

                    {resendTimer > 0 ? (
                      <span className="text-slate-400 font-medium">
                        {isHindi ? `${resendTimer}s में पुनः भेजें` : `Resend in ${resendTimer}s`}
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={handleResendEmailOtp}
                        disabled={loading}
                        className="text-[#1264D6] font-bold hover:underline min-h-[36px] flex items-center"
                      >
                        {isHindi ? 'पुनः भेजें' : 'Resend OTP'}
                      </button>
                    )}
                  </div>
                </form>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
