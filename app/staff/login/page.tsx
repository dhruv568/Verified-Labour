'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ShieldCheck, Lock, AlertCircle, Eye, EyeOff, Loader2 } from 'lucide-react';
import Button from '@/components/ui/Button';
import Logo from '@/components/Logo';

export default function StaffLoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch('/api/staff/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.error || 'Invalid credentials or staff access disabled');
        return;
      }

      // Redirect staff to Admin Panel
      router.push('/admin');
    } catch (err: any) {
      setError(err.message || 'Login request failed');
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

        <div>
          <span className="px-3 py-1 bg-brand-950 text-brand-400 border border-brand-800 rounded-full text-[10px] font-extrabold uppercase tracking-wider">
            Authorized Personnel Only
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight mt-2">
            Staff Admin Portal
          </h2>
          <p className="mt-1 text-xs text-slate-400">
            Secure access for authorized Verified Labour team members.
          </p>
        </div>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-md space-y-6">
          {error && (
            <div className="p-3.5 bg-red-950/80 border border-red-800 rounded-2xl flex items-start gap-2.5 text-xs text-red-300">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
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

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-slate-300">Password</label>
                <Link
                  href="/staff/forgot-password"
                  className="text-[11px] font-semibold text-brand-400 hover:text-brand-300 underline"
                >
                  Forgot Password?
                </Link>
              </div>

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

            <Button
              type="submit"
              variant="brand"
              size="lg"
              isLoading={loading}
              className="w-full justify-center text-xs font-bold mt-2"
            >
              Sign In
            </Button>
          </form>

          <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-[11px] text-slate-400 flex items-center gap-2">
            <Lock className="w-4 h-4 text-brand-400 shrink-0" />
            <span>This portal is strictly restricted to authorized Verified Labour staff.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
