'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, CheckCircle2, AlertCircle, Mail, Loader2 } from 'lucide-react';
import Button from '@/components/ui/Button';
import Logo from '@/components/Logo';

export default function StaffForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch('/api/staff/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.error || 'Failed to request password reset');
        return;
      }

      setSubmitted(true);
    } catch (err: any) {
      setError(err.message || 'Request failed');
    } finally {
      setLoading(false);
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
        <h2 className="text-2xl font-black text-white tracking-tight">Staff Forgot Password</h2>
        <p className="text-xs text-slate-400">Enter your email address to receive password reset instructions.</p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-md space-y-6">
          {submitted ? (
            <div className="text-center space-y-4">
              <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />
              <h3 className="text-lg font-bold text-white">Check Your Inbox</h3>
              <p className="text-xs text-slate-300">
                If an active staff account exists for <span className="font-bold text-white">{email}</span>, password reset instructions have been dispatched.
              </p>
              <Link
                href="/staff/login"
                className="inline-flex items-center gap-2 text-xs font-bold text-brand-400 hover:text-brand-300 underline pt-2"
              >
                <ArrowLeft className="w-4 h-4" /> Return to Staff Login
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 bg-red-950/80 border border-red-800 rounded-xl text-xs text-red-300 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">Staff Email Address</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:border-brand-500 focus:outline-none"
                  placeholder="staff@example.com"
                />
              </div>

              <Button
                type="submit"
                variant="brand"
                size="lg"
                isLoading={loading}
                icon={<Mail className="w-4 h-4" />}
                className="w-full justify-center text-xs font-bold"
              >
                Send Reset Email
              </Button>

              <div className="text-center pt-2">
                <Link href="/staff/login" className="text-xs text-slate-400 hover:text-white underline">
                  ← Back to Staff Login
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
