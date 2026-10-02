'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Mail, ArrowRight, ArrowLeft, AlertCircle, CheckCircle2, ShieldCheck } from 'lucide-react';
import Button from '@/components/ui/Button';
import Logo from '@/components/Logo';
import Footer from '@/components/Footer';

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const tokenParam = searchParams.get('token');
  const emailParam = searchParams.get('email');

  const [email, setEmail] = useState<string>(emailParam || '');
  const [otpCode, setOtpCode] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [verifyingToken, setVerifyingToken] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [resendTimer, setResendTimer] = useState<number>(60);

  // Validate token or email parameter on mount
  useEffect(() => {
    let isMounted = true;

    async function checkToken() {
      if (!tokenParam && !emailParam) {
        if (isMounted) {
          setError('No verification token or email provided. Please use the link from your verification email.');
          setVerifyingToken(false);
        }
        return;
      }

      try {
        const query = tokenParam
          ? `token=${encodeURIComponent(tokenParam)}`
          : `email=${encodeURIComponent(emailParam || '')}`;
        const res = await fetch(`/api/auth/verify-token?${query}`);
        const data = await res.json();

        if (isMounted) {
          if (data.success && data.email) {
            setEmail(data.email);
            setError(null);
          } else {
            setError(data.error || 'Verification link is invalid or has expired. Please request a new code.');
          }
        }
      } catch (err: any) {
        if (isMounted) {
          setError('Failed to validate verification link: ' + err.message);
        }
      } finally {
        if (isMounted) {
          setVerifyingToken(false);
        }
      }
    }

    checkToken();

    return () => {
      isMounted = false;
    };
  }, [tokenParam, emailParam]);

  // Resend countdown timer
  useEffect(() => {
    if (resendTimer <= 0) return;
    const timer = setInterval(() => {
      setResendTimer((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendTimer]);

  // Handle OTP Submit
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || otpCode.length !== 6) return;

    setError(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          otp: otpCode.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Invalid or expired verification code.');
      }

      setSuccessMsg('Email verified successfully! Redirecting...');

      // Complete login and route cleanly
      setTimeout(() => {
        const user = data.user;
        if (!user) {
          router.push('/');
          return;
        }

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
      }, 1000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Handle Resend OTP
  const handleResendOtp = async () => {
    if (!email || loading) return;

    setError(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      const res = await fetch('/api/auth/resend-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to resend verification code.');
      }

      setResendTimer(60);
      setSuccessMsg(data.message || 'A new verification code has been sent to your email.');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between font-sans antialiased text-[#0F2A5F]">
      {/* HEADER */}
      <header className="bg-white border-b border-slate-200 py-4 px-4 sm:px-8 flex items-center justify-between shadow-xs">
        <Link href="/" className="flex items-center gap-2" aria-label="Verified Labour Home">
          <Logo variant="header" priority />
        </Link>

        <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-full">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span className="hidden sm:inline">सत्यापित • पास में • भरोसेमंद</span>
          <span className="sm:hidden">Verified</span>
        </div>
      </header>

      {/* MAIN CONTAINER */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6">
        <div className="bg-white rounded-2xl max-w-md w-full p-6 sm:p-8 shadow-xl border border-slate-200 animate-in fade-in duration-200">
          
          {verifyingToken ? (
            <div className="py-12 text-center space-y-3">
              <div className="w-10 h-10 border-4 border-[#08783b] border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs font-bold text-slate-600 font-devanagari">
                प्रमाणीकरण कोड लिंक की जाँच की जा रही है...
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Header Icon & Title */}
              <div className="text-center">
                <div className="mx-auto w-14 h-14 bg-emerald-50 border border-emerald-200 rounded-full flex items-center justify-center mb-3">
                  <Mail className="w-7 h-7 text-[#08783b]" />
                </div>
                <h1 className="text-xl sm:text-2xl font-black text-[#0F2A5F] font-devanagari">
                  ईमेल सत्यापित करें / Verify Email
                </h1>
                <p className="text-xs text-slate-600 mt-1.5 font-devanagari">
                  आपकी ईमेल पर कोड भेजा गया है
                </p>
                {email && (
                  <div className="mt-2 inline-block bg-blue-50/80 border border-blue-200 px-3.5 py-1.5 rounded-xl">
                    <p className="text-xs font-bold text-[#1264D6] font-mono select-all">
                      {email}
                    </p>
                  </div>
                )}
              </div>

              {/* Error Alert Banner */}
              {error && (
                <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-start gap-2.5 animate-in fade-in duration-150 font-devanagari">
                  <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                  <span className="leading-relaxed">{error}</span>
                </div>
              )}

              {/* Success Alert Banner */}
              {successMsg && (
                <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-start gap-2.5 animate-in fade-in duration-150 font-devanagari">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span className="leading-relaxed">{successMsg}</span>
                </div>
              )}

              {/* OTP Input Form */}
              <form onSubmit={handleVerifyOtp} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-2 text-center font-devanagari">
                    6 अंकों का OTP दर्ज करें (Enter 6-digit OTP):
                  </label>
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
                    className="w-full text-center tracking-[0.5em] text-2xl font-bold py-3.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#08783b] focus:border-[#08783b] outline-none bg-white text-[#0F2A5F]"
                  />
                </div>

                {/* Primary CTA Button */}
                <Button
                  type="submit"
                  variant="brand"
                  size="lg"
                  fullWidth
                  isLoading={loading}
                  disabled={loading || otpCode.length !== 6}
                  icon={<ArrowRight className="w-4 h-4" />}
                >
                  {loading ? 'सत्यापित हो रहा है...' : 'ईमेल सत्यापित करें / Verify & Continue'}
                </Button>
              </form>

              {/* Resend & Back links */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs font-devanagari">
                <Link
                  href="/"
                  className="text-slate-500 hover:text-slate-900 font-medium flex items-center gap-1 transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>होम पर वापस / Back to Home</span>
                </Link>

                {resendTimer > 0 ? (
                  <span className="text-slate-400 font-medium">{resendTimer}s में पुनः भेजें</span>
                ) : (
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    disabled={loading}
                    className="text-[#08783b] font-bold hover:underline"
                  >
                    पुनः भेजें / Resend OTP
                  </button>
                )}
              </div>
            </div>
          )}

        </div>
      </main>

      {/* FOOTER */}
      <Footer />
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
          <div className="w-10 h-10 border-4 border-[#08783b] border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  );
}
