'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Lock,
  Loader2,
  Check,
  Eye,
  EyeOff,
  ArrowRight,
} from 'lucide-react';
import Button from '@/components/ui/Button';
import Logo from '@/components/Logo';

export default function StaffInvitePage({ params }: { params: { token: string } }) {
  const router = useRouter();

  const [step, setStep] = useState<'VERIFYING' | 'PREVIEW' | 'PASSWORD_FORM' | 'SUCCESS' | 'EXPIRED' | 'ERROR'>('VERIFYING');
  const [invitation, setInvitation] = useState<any>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Form Fields
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Password validation checks
  const hasMinLength = password.length >= 8;
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);
  const isPasswordValid = hasMinLength && hasUpper && hasLower && hasNumber && hasSpecial;

  useEffect(() => {
    const verifyToken = async () => {
      try {
        const res = await fetch(`/api/staff/invite/${params.token}`);
        const data = await res.json();

        if (!res.ok || !data.success) {
          if (data.isExpired) {
            setStep('EXPIRED');
          } else {
            setErrorMessage(data.error || 'Invalid or expired invitation token.');
            setStep('ERROR');
          }
          return;
        }

        setInvitation(data.invitation);
        setStep('PREVIEW');
      } catch (err: any) {
        setErrorMessage(err.message || 'Failed to connect to server');
        setStep('ERROR');
      }
    };

    verifyToken();
  }, [params.token]);

  const handleCreateAccountSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (password !== confirmPassword) {
      setFormError('Passwords do not match.');
      return;
    }

    if (!isPasswordValid) {
      setFormError('Please fulfill all password security requirements below.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`/api/staff/invite/${params.token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password, confirmPassword }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setFormError(data.error || 'Failed to set up staff account.');
        return;
      }

      setStep('SUCCESS');
    } catch (err: any) {
      setFormError(err.message || 'Account setup failed.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-12 px-4 text-slate-100">
      <div className="sm:mx-auto sm:w-full sm:max-w-md space-y-4 text-center">
        <div className="flex justify-center">
          <div className="bg-white p-3 rounded-2xl shadow-xl">
            <Logo variant="header" />
          </div>
        </div>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-lg">
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-md space-y-6">
          {/* VERIFYING STATE */}
          {step === 'VERIFYING' && (
            <div className="text-center py-8 space-y-3">
              <Loader2 className="w-10 h-10 animate-spin text-brand-400 mx-auto" />
              <p className="text-xs text-slate-300 font-bold">Verifying Secure Staff Invitation...</p>
            </div>
          )}

          {/* EXPIRED STATE */}
          {step === 'EXPIRED' && (
            <div className="text-center space-y-4 py-4">
              <div className="w-12 h-12 bg-amber-950 text-amber-400 rounded-2xl flex items-center justify-center mx-auto border border-amber-800">
                <AlertCircle className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-black text-white">This invitation has expired.</h2>
              <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
                Staff invitation tokens expire automatically after 7 days for platform security. Please contact your Verified Labour Administrator to issue a new invitation.
              </p>
              <div className="pt-2">
                <Button variant="outline" size="sm" onClick={() => router.push('/staff/login')}>
                  Go to Staff Login
                </Button>
              </div>
            </div>
          )}

          {/* ERROR STATE */}
          {step === 'ERROR' && (
            <div className="text-center space-y-4 py-4">
              <div className="w-12 h-12 bg-red-950 text-red-400 rounded-2xl flex items-center justify-center mx-auto border border-red-800">
                <AlertCircle className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-black text-white">Invalid Invitation Link</h2>
              <p className="text-xs text-red-300">{errorMessage}</p>
              <div className="pt-2">
                <Button variant="outline" size="sm" onClick={() => router.push('/staff/login')}>
                  Go to Staff Portal
                </Button>
              </div>
            </div>
          )}

          {/* STEP 1: PREVIEW INVITATION */}
          {step === 'PREVIEW' && invitation && (
            <div className="space-y-6">
              <div className="text-center space-y-1">
                <span className="px-3 py-1 bg-brand-950 text-brand-400 border border-brand-800 rounded-full text-[10px] font-extrabold uppercase tracking-wider">
                  You're Invited
                </span>
                <h2 className="text-2xl font-black text-white tracking-tight mt-2">
                  Hello {invitation.fullName}
                </h2>
                <p className="text-xs text-slate-400">
                  You've been invited to join the Verified Labour Admin Panel team.
                </p>
              </div>

              {/* ROLE BADGE */}
              <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-1 border-l-4 border-l-brand-500">
                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Assigned Role</span>
                <span className="text-lg font-black text-white block">{invitation.roleName}</span>
                {invitation.roleDescription && (
                  <span className="text-xs text-slate-400 block">{invitation.roleDescription}</span>
                )}
              </div>

              {/* PERMISSIONS SUMMARY */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-300 block">Assigned Platform Access:</span>
                <ul className="space-y-1.5 max-h-40 overflow-y-auto p-3 bg-slate-950 border border-slate-800 rounded-2xl text-xs text-slate-300">
                  {invitation.permissions.map((p: string, idx: number) => (
                    <li key={idx} className="flex items-center gap-2 font-medium">
                      <Check className="w-3.5 h-3.5 text-brand-400 shrink-0" />
                      <span>{p}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <Button
                variant="brand"
                size="lg"
                onClick={() => setStep('PASSWORD_FORM')}
                icon={<ArrowRight className="w-4 h-4" />}
                className="w-full justify-center text-xs font-bold"
              >
                Accept Invitation & Set Up Password
              </Button>
            </div>
          )}

          {/* STEP 2: CREATE PASSWORD FORM */}
          {step === 'PASSWORD_FORM' && invitation && (
            <form onSubmit={handleCreateAccountSubmit} className="space-y-5">
              <div className="text-center space-y-1">
                <h2 className="text-xl font-black text-white">Create Staff Password</h2>
                <p className="text-xs text-slate-400">
                  Set up a secure password for your <span className="text-white font-bold">{invitation.email}</span> staff account.
                </p>
              </div>

              {formError && (
                <div className="p-3.5 bg-red-950/80 border border-red-800 rounded-2xl text-xs text-red-300 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">New Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-3.5 pr-10 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:border-brand-500 focus:outline-none"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-white"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">Confirm Password</label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:border-brand-500 focus:outline-none"
                  placeholder="••••••••"
                />
              </div>

              {/* Password Requirement Checks */}
              <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-[11px] space-y-1">
                <span className="font-bold text-slate-400 block mb-1.5">Password Security Checklist:</span>
                <div className="grid grid-cols-2 gap-1">
                  <span className={hasMinLength ? 'text-emerald-400 font-bold' : 'text-slate-500'}>
                    {hasMinLength ? '✓' : '○'} Min 8 characters
                  </span>
                  <span className={hasUpper ? 'text-emerald-400 font-bold' : 'text-slate-500'}>
                    {hasUpper ? '✓' : '○'} Uppercase letter
                  </span>
                  <span className={hasLower ? 'text-emerald-400 font-bold' : 'text-slate-500'}>
                    {hasLower ? '✓' : '○'} Lowercase letter
                  </span>
                  <span className={hasNumber ? 'text-emerald-400 font-bold' : 'text-slate-500'}>
                    {hasNumber ? '✓' : '○'} Number
                  </span>
                  <span className={hasSpecial ? 'text-emerald-400 font-bold' : 'text-slate-500'}>
                    {hasSpecial ? '✓' : '○'} Special character
                  </span>
                </div>
              </div>

              <Button
                type="submit"
                variant="brand"
                size="lg"
                isLoading={submitting}
                className="w-full justify-center text-xs font-bold"
              >
                Create Staff Account
              </Button>
            </form>
          )}

          {/* SUCCESS STATE */}
          {step === 'SUCCESS' && (
            <div className="text-center space-y-4 py-4">
              <div className="w-14 h-14 bg-emerald-950 text-emerald-400 rounded-full flex items-center justify-center mx-auto border border-emerald-800">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h2 className="text-2xl font-black text-white">Account Created!</h2>
              <p className="text-xs text-slate-300 leading-relaxed">
                Your staff account and security credentials have been configured successfully. You can now log into the Staff Admin Portal.
              </p>
              <div className="pt-2">
                <Button
                  variant="brand"
                  size="lg"
                  onClick={() => router.push('/staff/login')}
                  className="w-full justify-center text-xs font-bold"
                >
                  Proceed to Staff Login
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
