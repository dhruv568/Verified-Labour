'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Shield,
  Users,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Briefcase,
  Layers,
  FileText,
  Clock,
  Check,
  X,
  RefreshCw,
  Search,
  Lock,
  Menu,
  ShieldCheck,
  CreditCard,
  Building,
  UserCheck,
  AlertTriangle,
  Scale,
  Settings,
  Plus,
  Loader2,
  LogOut,
  Globe,
  Key,
  Save,
  Megaphone,
  Mail,
  Phone,
  MapPin,
  ExternalLink,
} from 'lucide-react';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import StatusBadge from '@/components/ui/StatusBadge';
import EmptyState from '@/components/ui/EmptyState';
import Logo from '@/components/Logo';

type AdminTab =
  | 'dashboard'
  | 'users'
  | 'workers'
  | 'bookings'
  | 'payments'
  | 'content'
  | 'categories'
  | 'disputes'
  | 'audit'
  | 'settings';

export default function AdminPage() {
  const router = useRouter();

  // Authentication States
  const [session, setSession] = useState<any>(null);
  const [loadingSession, setLoadingSession] = useState(true);

  // Login Form States (Step 1: Credentials, Step 2: OTP)
  const [loginStep, setLoginStep] = useState<'CREDENTIALS' | 'OTP'>('CREDENTIALS');
  const [loginEmail, setLoginEmail] = useState('verifiedlabour@gmail.com');
  const [loginPassword, setLoginPassword] = useState('Pass@123');
  const [loginOtp, setLoginOtp] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [devOtpHint, setDevOtpHint] = useState<string | null>(null);

  // Active Tab & UI States
  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  // Confirmation Modal State
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    description: '',
    onConfirm: () => {},
  });

  // Admin Data Datasets
  const [metrics, setMetrics] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [workers, setWorkers] = useState<any[]>([]);
  const [jobs, setJobs] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [disputes, setDisputes] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [siteContent, setSiteContent] = useState<Record<string, string>>({});
  const [loadingData, setLoadingData] = useState(false);

  // Filtering States
  const [userFilter, setUserFilter] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('ALL');
  const [userStatusFilter, setUserStatusFilter] = useState('ALL');

  const [workerFilter, setWorkerFilter] = useState('');
  const [workerStatusFilter, setWorkerStatusFilter] = useState('ALL');

  const [jobStatusFilter, setJobStatusFilter] = useState('ALL');

  // Change Password Form State
  const [currentPassInput, setCurrentPassInput] = useState('');
  const [newPassInput, setNewPassInput] = useState('');
  const [confirmPassInput, setConfirmPassInput] = useState('');
  const [passChangeLoading, setPassChangeLoading] = useState(false);
  const [passChangeMsg, setPassChangeMsg] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  // Content Management Form State
  const [contentForm, setContentForm] = useState<Record<string, string>>({});
  const [contentSubTab, setContentSubTab] = useState<'hero' | 'about' | 'contact' | 'footer' | 'announcement'>('hero');
  const [savingContent, setSavingContent] = useState(false);

  // Add Category Form State
  const [newCatName, setNewCatName] = useState('');
  const [newCatSlug, setNewCatSlug] = useState('');
  const [newCatIcon, setNewCatIcon] = useState('Wrench');

  // 1. Initial Session Check
  const checkSession = async () => {
    try {
      const res = await fetch('/api/auth/me');
      const data = await res.json();
      if (data.authenticated && data.user && data.user.role === 'ADMIN') {
        setSession(data.user);
      } else {
        setSession(null);
      }
    } catch {
      setSession(null);
    } finally {
      setLoadingSession(false);
    }
  };

  useEffect(() => {
    checkSession();
  }, []);

  // 2. Fetch All Admin Data
  const fetchAdminData = async () => {
    setLoadingData(true);
    try {
      const [mRes, uRes, wRes, jRes, pRes, cRes, dRes, aRes, cntRes] = await Promise.all([
        fetch('/api/admin/metrics'),
        fetch('/api/admin/users'),
        fetch('/api/admin/workers'),
        fetch('/api/admin/jobs'),
        fetch('/api/admin/payments'),
        fetch('/api/admin/categories'),
        fetch('/api/admin/disputes'),
        fetch('/api/admin/audit-logs'),
        fetch('/api/admin/content'),
      ]);

      const [mData, uData, wData, jData, pData, cData, dData, aData, cntData] = await Promise.all([
        mRes.json(),
        uRes.json(),
        wRes.json(),
        jRes.json(),
        pRes.json(),
        cRes.json(),
        dRes.json(),
        aRes.json(),
        cntRes.json(),
      ]);

      if (mData.success) setMetrics(mData.metrics);
      if (uData.success) setUsers(uData.users || []);
      if (wData.success) setWorkers(wData.workers || []);
      if (jData.success) setJobs(jData.jobs || []);
      if (pData.success) setPayments(pData.payments || []);
      if (cData.success) setCategories(cData.categories || []);
      if (dData.success) setDisputes(dData.disputes || []);
      if (aData.success) setAuditLogs(aData.logs || []);
      if (cntData.success && cntData.content) {
        setSiteContent(cntData.content);
        setContentForm(cntData.content);
      }
    } catch (err) {
      console.error('Failed to load admin datasets:', err);
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    if (session) {
      fetchAdminData();
    }
  }, [session]);

  // Handle Admin Credentials Submit (Step 1 -> Sends Email OTP)
  const handleLoginCredentialsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setLoginLoading(true);
    setDevOtpHint(null);

    try {
      const res = await fetch('/api/admin/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail, password: loginPassword }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        setLoginError(data.error || 'Authentication failed');
        return;
      }

      if (data.requiresOtp) {
        setLoginStep('OTP');
        if (data.devOtp) {
          setDevOtpHint(data.devOtp);
          setLoginOtp(data.devOtp);
        }
      }
    } catch (err: any) {
      setLoginError(err.message || 'Login request failed');
    } finally {
      setLoginLoading(false);
    }
  };

  // Handle Admin OTP Submit (Step 2 -> Sets Auth Cookie)
  const handleLoginOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setLoginLoading(true);

    try {
      const res = await fetch('/api/admin/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail, otp: loginOtp }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        setLoginError(data.error || 'Invalid OTP code');
        return;
      }

      setSession(data.user);
      setActiveTab('dashboard');
    } catch (err: any) {
      setLoginError(err.message || 'OTP verification failed');
    } finally {
      setLoginLoading(false);
    }
  };

  // Handle Admin Logout
  const handleLogout = async () => {
    try {
      await fetch('/api/admin/auth/logout', { method: 'POST' });
    } catch (err) {
      console.error(err);
    } finally {
      setSession(null);
      setLoginStep('CREDENTIALS');
      setLoginOtp('');
    }
  };

  // User Status Change (Activate, Suspend, Block)
  const handleUserAction = (userId: string, userName: string, action: 'ACTIVATE' | 'SUSPEND' | 'BLOCK') => {
    setConfirmModal({
      isOpen: true,
      title: `${action} User Account`,
      description: `Are you sure you want to ${action.toLowerCase()} account for "${userName}"?`,
      onConfirm: async () => {
        setActionLoading(true);
        try {
          const res = await fetch('/api/admin/users', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId, action }),
          });
          const data = await res.json();
          if (!res.ok || !data.success) {
            setActionMessage({ type: 'error', msg: data.error || 'Action failed' });
            return;
          }
          setActionMessage({ type: 'success', msg: `User ${action.toLowerCase()}d successfully` });
          fetchAdminData();
        } catch (err: any) {
          setActionMessage({ type: 'error', msg: err.message });
        } finally {
          setActionLoading(false);
          setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        }
      },
    });
  };

  // Worker Action (Approve, Suspend, Reactivate)
  const handleWorkerAction = (workerId: string, workerName: string, action: string) => {
    setConfirmModal({
      isOpen: true,
      title: `${action} Worker Profile`,
      description: `Are you sure you want to ${action.toLowerCase()} worker "${workerName}"?`,
      onConfirm: async () => {
        setActionLoading(true);
        try {
          const res = await fetch('/api/admin/workers', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ workerId, action }),
          });
          const data = await res.json();
          if (!res.ok || !data.success) {
            setActionMessage({ type: 'error', msg: data.error || 'Worker action failed' });
            return;
          }
          setActionMessage({ type: 'success', msg: data.message || `Worker ${action.toLowerCase()}d successfully` });
          fetchAdminData();
        } catch (err: any) {
          setActionMessage({ type: 'error', msg: err.message });
        } finally {
          setActionLoading(false);
          setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        }
      },
    });
  };

  // Job Action (Cancel, Resolve)
  const handleJobAction = (jobId: string, action: 'CANCEL' | 'RESOLVE') => {
    const reason = action === 'CANCEL' ? prompt('Enter cancellation reason:') || 'Cancelled by Admin' : 'Resolved by Admin';
    if (action === 'CANCEL' && !reason) return;

    setConfirmModal({
      isOpen: true,
      title: `${action} Job Booking`,
      description: `Are you sure you want to ${action.toLowerCase()} job #${jobId.slice(0, 8)}?`,
      onConfirm: async () => {
        setActionLoading(true);
        try {
          const res = await fetch('/api/admin/jobs', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ jobId, action, reason }),
          });
          const data = await res.json();
          if (!res.ok || !data.success) {
            setActionMessage({ type: 'error', msg: data.error || 'Job action failed' });
            return;
          }
          setActionMessage({ type: 'success', msg: `Job updated successfully` });
          fetchAdminData();
        } catch (err: any) {
          setActionMessage({ type: 'error', msg: err.message });
        } finally {
          setActionLoading(false);
          setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        }
      },
    });
  };

  // Save Website Content Changes (Live DB Update)
  const handleSaveContent = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingContent(true);
    setActionMessage(null);

    try {
      const res = await fetch('/api/admin/content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(contentForm),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        setActionMessage({ type: 'error', msg: data.error || 'Failed to save website content' });
        return;
      }

      setSiteContent(data.content);
      setActionMessage({
        type: 'success',
        msg: 'Website content updated! Changes appear on public website immediately.',
      });
    } catch (err: any) {
      setActionMessage({ type: 'error', msg: err.message });
    } finally {
      setSavingContent(false);
    }
  };

  // Change Admin Password
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPassChangeMsg(null);

    if (newPassInput !== confirmPassInput) {
      setPassChangeMsg({ type: 'error', msg: 'New password and confirmation do not match.' });
      return;
    }

    setPassChangeLoading(true);
    try {
      const res = await fetch('/api/admin/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: currentPassInput,
          newPassword: newPassInput,
        }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        setPassChangeMsg({ type: 'error', msg: data.error || 'Failed to update password' });
        return;
      }

      setPassChangeMsg({ type: 'success', msg: 'Admin password updated successfully!' });
      setCurrentPassInput('');
      setNewPassInput('');
      setConfirmPassInput('');
    } catch (err: any) {
      setPassChangeMsg({ type: 'error', msg: err.message });
    } finally {
      setPassChangeLoading(false);
    }
  };

  // Add Category
  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;

    try {
      const res = await fetch('/api/admin/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newCatName,
          slug: newCatSlug.trim().toLowerCase().replace(/\s+/g, '-') || newCatName.toLowerCase().replace(/\s+/g, '-'),
          iconUrl: newCatIcon,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        alert(data.error || 'Failed to create category');
        return;
      }
      setNewCatName('');
      setNewCatSlug('');
      fetchAdminData();
    } catch (err: any) {
      alert('Error: ' + err.message);
    }
  };

  if (loadingSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white">
        <div className="text-center space-y-3">
          <Loader2 className="w-10 h-10 animate-spin text-brand-400 mx-auto" />
          <p className="text-xs font-bold text-slate-300">Loading Verified Labour Security Console...</p>
        </div>
      </div>
    );
  }

  // ================= 1. ADMIN LOGIN VIEW (UNAUTHENTICATED) =================
  if (!session) {
    return (
      <div className="min-h-screen flex flex-col justify-center bg-slate-950 px-4 py-12 text-slate-100">
        <div className="sm:mx-auto sm:w-full sm:max-w-md space-y-4">
          <div className="flex justify-center">
            <div className="bg-white p-3 rounded-2xl shadow-xl">
              <Logo variant="header" />
            </div>
          </div>
          <div className="text-center">
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Admin Operations Portal
            </h2>
            <p className="mt-1 text-xs text-slate-400">
              Strict authentication required. Multi-Factor Email OTP verification enforced.
            </p>
          </div>
        </div>

        <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-md space-y-6">
            {loginError && (
              <div className="p-3.5 bg-red-950/80 border border-red-800 rounded-2xl flex items-start gap-2.5 text-xs text-red-300">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <span>{loginError}</span>
              </div>
            )}

            {/* STEP 1: Admin Credentials (Email & Password) */}
            {loginStep === 'CREDENTIALS' ? (
              <form onSubmit={handleLoginCredentialsSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    Admin Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:border-brand-500 focus:outline-none"
                    placeholder="verifiedlabour@gmail.com"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    Admin Security Password
                  </label>
                  <input
                    type="password"
                    required
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:border-brand-500 focus:outline-none"
                    placeholder="Pass@123"
                  />
                </div>

                <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 text-[11px] text-slate-400 flex items-center gap-2">
                  <Lock className="w-3.5 h-3.5 text-brand-400 shrink-0" />
                  <span>Rate limited & protected against brute-force attacks.</span>
                </div>

                <Button
                  type="submit"
                  variant="brand"
                  size="lg"
                  className="w-full justify-center text-xs font-bold"
                  isLoading={loginLoading}
                >
                  Send Admin Verification OTP
                </Button>
              </form>
            ) : (
              /* STEP 2: Email OTP Verification Code */
              <form onSubmit={handleLoginOtpSubmit} className="space-y-4">
                <div className="text-center space-y-1">
                  <div className="w-12 h-12 bg-emerald-950 text-emerald-400 rounded-2xl flex items-center justify-center mx-auto border border-emerald-800 mb-2">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <h3 className="text-sm font-bold text-white">Enter 6-Digit Email OTP</h3>
                  <p className="text-xs text-slate-400">
                    Verification code sent to <span className="font-mono text-emerald-400 font-bold">{loginEmail}</span>
                  </p>
                </div>

                {devOtpHint && (
                  <div className="p-2.5 bg-emerald-950/90 border border-emerald-700 rounded-xl text-center text-xs font-mono text-emerald-300">
                    Local Dev OTP Code: <strong className="text-white text-sm tracking-widest">{devOtpHint}</strong>
                  </div>
                )}

                <div>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={loginOtp}
                    onChange={(e) => setLoginOtp(e.target.value.trim())}
                    className="w-full px-4 py-3 bg-slate-950 border-2 border-brand-500 rounded-2xl text-center text-2xl font-mono tracking-[10px] text-white focus:outline-none"
                    placeholder="123456"
                  />
                </div>

                <Button
                  type="submit"
                  variant="brand"
                  size="lg"
                  className="w-full justify-center text-xs font-bold"
                  isLoading={loginLoading}
                >
                  Verify OTP & Enter Admin Dashboard
                </Button>

                <button
                  type="button"
                  onClick={() => setLoginStep('CREDENTIALS')}
                  className="w-full text-center text-xs text-slate-400 hover:text-white underline mt-2"
                >
                  ← Back to credentials
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Filtered Datasets
  const filteredUsers = users.filter((u) => {
    const matchSearch =
      u.name?.toLowerCase().includes(userFilter.toLowerCase()) ||
      u.phone?.toLowerCase().includes(userFilter.toLowerCase()) ||
      u.email?.toLowerCase().includes(userFilter.toLowerCase());

    const matchRole = userRoleFilter === 'ALL' || u.role === userRoleFilter;
    const matchStatus = userStatusFilter === 'ALL' || u.status === userStatusFilter;
    return matchSearch && matchRole && matchStatus;
  });

  const filteredWorkers = workers.filter((w) => {
    const matchSearch =
      w.fullName?.toLowerCase().includes(workerFilter.toLowerCase()) ||
      w.phone?.toLowerCase().includes(workerFilter.toLowerCase()) ||
      w.primaryCategory?.toLowerCase().includes(workerFilter.toLowerCase()) ||
      w.city?.toLowerCase().includes(workerFilter.toLowerCase());

    const matchStatus = workerStatusFilter === 'ALL' || w.status === workerStatusFilter;
    return matchSearch && matchStatus;
  });

  const filteredJobs = jobs.filter((j) => {
    if (jobStatusFilter === 'ALL') return true;
    return j.status === jobStatusFilter;
  });

  const navItems = [
    { id: 'dashboard' as AdminTab, label: 'Dashboard', icon: <Layers className="w-4 h-4" /> },
    { id: 'users' as AdminTab, label: 'Users', icon: <Users className="w-4 h-4" />, count: users.length },
    { id: 'workers' as AdminTab, label: 'Workers & Verification', icon: <Briefcase className="w-4 h-4" />, count: workers.length },
    { id: 'bookings' as AdminTab, label: 'Jobs & Bookings', icon: <Clock className="w-4 h-4" />, count: jobs.length },
    { id: 'payments' as AdminTab, label: 'Payments & Revenue', icon: <CreditCard className="w-4 h-4" />, count: payments.length },
    { id: 'content' as AdminTab, label: 'Website Content', icon: <Globe className="w-4 h-4" /> },
    { id: 'categories' as AdminTab, label: 'Service Categories', icon: <Building className="w-4 h-4" />, count: categories.length },
    { id: 'disputes' as AdminTab, label: 'Disputes Console', icon: <Scale className="w-4 h-4" />, count: disputes.length },
    { id: 'audit' as AdminTab, label: 'System Audit Logs', icon: <FileText className="w-4 h-4" />, count: auditLogs.length },
    { id: 'settings' as AdminTab, label: 'Settings & Security', icon: <Settings className="w-4 h-4" /> },
  ];

  // ================= 2. AUTHENTICATED ADMIN DASHBOARD VIEW =================
  return (
    <div className="min-h-screen flex flex-col bg-slate-100 text-slate-800">
      {/* Top Header */}
      <header className="bg-navy-950 text-white border-b border-navy-900 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-white px-2.5 py-1 rounded-xl">
              <Logo variant="header" />
            </div>
            <span className="hidden sm:inline-block px-2.5 py-0.5 bg-brand-600/30 text-brand-300 rounded-full text-[10px] font-bold uppercase tracking-wider border border-brand-500/30">
              Production Admin Panel
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden md:flex flex-col text-right">
              <span className="text-xs font-bold text-white">{session.email}</span>
              <span className="text-[10px] font-mono text-emerald-400 font-semibold">ROLE: SUPERADMIN</span>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              icon={<LogOut className="w-3.5 h-3.5 text-red-400" />}
              className="text-xs text-slate-200 border-navy-800 hover:bg-navy-900"
            >
              Logout
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full flex-1 flex flex-col lg:flex-row gap-6">
        {/* Action Message Banner */}
        {actionMessage && (
          <div
            className={`fixed bottom-5 right-5 z-50 p-4 rounded-2xl shadow-2xl border flex items-center gap-3 text-xs font-bold animate-in fade-in slide-in-from-bottom-5 ${
              actionMessage.type === 'success'
                ? 'bg-emerald-900 text-emerald-100 border-emerald-700'
                : 'bg-red-900 text-red-100 border-red-700'
            }`}
          >
            {actionMessage.type === 'success' ? <CheckCircle2 className="w-5 h-5 text-emerald-400" /> : <AlertCircle className="w-5 h-5 text-red-400" />}
            <span>{actionMessage.msg}</span>
            <button type="button" onClick={() => setActionMessage(null)} className="ml-2 hover:opacity-75">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Mobile Sidebar Toggle */}
        <div className="lg:hidden flex items-center justify-between bg-white p-3.5 rounded-2xl border border-slate-200">
          <span className="font-bold text-xs text-slate-800">Admin Control Menu</span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
            icon={mobileSidebarOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          >
            {mobileSidebarOpen ? 'Close' : 'Menu'}
          </Button>
        </div>

        {/* Sidebar Navigation */}
        <aside
          className={`lg:block w-full lg:w-64 shrink-0 space-y-2 ${
            mobileSidebarOpen ? 'block' : 'hidden lg:block'
          }`}
        >
          <Card variant="default" padding="sm" className="space-y-1 bg-white shadow-xs">
            <div className="px-3 py-2.5 border-b border-slate-100 mb-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Platform Control
              </span>
              <p className="text-xs font-black text-slate-900 truncate mt-0.5">Verified Labour Admin</p>
            </div>

            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    setMobileSidebarOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
                    isActive
                      ? 'bg-navy-950 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className={isActive ? 'text-brand-400' : 'text-slate-400'}>
                      {item.icon}
                    </span>
                    <span>{item.label}</span>
                  </div>
                  {item.count !== undefined && (
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full ${
                        isActive ? 'bg-navy-800 text-brand-300 font-mono' : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      {item.count}
                    </span>
                  )}
                </button>
              );
            })}
          </Card>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 space-y-6 min-w-0">
          {/* Header Action Bar */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs">
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 capitalize">
                {activeTab.replace('_', ' ')} Management
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Complete administration, KYC review, live site content management, and cryptographic audit logs.
              </p>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={fetchAdminData}
              isLoading={loadingData}
              icon={<RefreshCw className="w-3.5 h-3.5" />}
            >
              Refresh Data
            </Button>
          </div>

          {/* TAB 1: DASHBOARD ANALYTICS OVERVIEW */}
          {activeTab === 'dashboard' && metrics && (
            <div className="space-y-6">
              {/* Analytics Metric Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3.5">
                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1">
                  <span className="text-xs font-bold text-slate-400 block">Total Users</span>
                  <span className="text-2xl font-black text-slate-900">{metrics.totalUsers}</span>
                  <span className="text-[11px] text-slate-500 block">
                    {metrics.totalCustomers} Customers • {metrics.totalWorkers} Workers
                  </span>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1">
                  <span className="text-xs font-bold text-slate-400 block">Verified Workers</span>
                  <span className="text-2xl font-black text-emerald-600">{metrics.verifiedWorkers}</span>
                  <span className="text-[11px] text-emerald-700 font-semibold block">Aadhaar & Bank Verified</span>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1">
                  <span className="text-xs font-bold text-slate-400 block">Pending KYC Reviews</span>
                  <span className="text-2xl font-black text-amber-600">{metrics.pendingVerifications}</span>
                  <span className="text-[11px] text-amber-700 font-semibold block">Awaiting Verification</span>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1">
                  <span className="text-xs font-bold text-slate-400 block">Active Bookings</span>
                  <span className="text-2xl font-black text-blue-600">{metrics.activeJobs}</span>
                  <span className="text-[11px] text-slate-500 block">{metrics.completedJobs} Completed Jobs</span>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1 sm:col-span-2">
                  <span className="text-xs font-bold text-slate-400 block">Platform Commission Revenue</span>
                  <span className="text-2xl font-black text-navy-950">
                    ₹{metrics.totalPlatformRevenue ? metrics.totalPlatformRevenue.toFixed(2) : '0.00'}
                  </span>
                  <span className="text-[11px] text-slate-500 block">
                    Gross Booking Volume: ₹{metrics.totalGrossRevenue ? metrics.totalGrossRevenue.toFixed(2) : '0.00'} (10% Fee)
                  </span>
                </div>
              </div>

              {/* Recent Audit Activity Preview */}
              <Card variant="default" padding="lg" className="space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="font-black text-slate-900 text-sm">Recent System Audit Logs</h3>
                  <button onClick={() => setActiveTab('audit')} className="text-xs text-brand-600 font-bold hover:underline">
                    View All Logs →
                  </button>
                </div>
                <div className="divide-y divide-slate-100 max-h-60 overflow-y-auto">
                  {auditLogs.slice(0, 5).map((log) => (
                    <div key={log.id} className="py-2.5 text-xs flex items-center justify-between">
                      <div>
                        <span className="font-bold text-slate-900 block">{log.action}</span>
                        <span className="text-[11px] text-slate-500">Target: {log.targetType} ({log.targetId})</span>
                      </div>
                      <span className="text-[11px] font-mono text-slate-400">
                        {new Date(log.createdAt).toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          )}

          {/* TAB 2: USERS MANAGEMENT */}
          {activeTab === 'users' && (
            <Card variant="default" padding="none" className="overflow-hidden">
              <div className="p-4 sm:p-5 border-b border-slate-200 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="font-black text-slate-900 text-base">User Accounts Management</h3>
                  <p className="text-xs text-slate-500 mt-0.5">View customers, workers, and businesses. Search and change statuses.</p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <input
                    type="text"
                    placeholder="Search name, phone, email..."
                    value={userFilter}
                    onChange={(e) => setUserFilter(e.target.value)}
                    className="px-3 py-1.5 text-xs rounded-xl border border-slate-300 outline-none w-48 sm:w-60"
                  />
                  <select
                    value={userRoleFilter}
                    onChange={(e) => setUserRoleFilter(e.target.value)}
                    className="px-2.5 py-1.5 text-xs rounded-xl border border-slate-300 outline-none bg-white font-semibold"
                  >
                    <option value="ALL">All Roles</option>
                    <option value="CUSTOMER">Customers</option>
                    <option value="WORKER">Workers</option>
                    <option value="BUSINESS">Businesses</option>
                    <option value="ADMIN">Admins</option>
                  </select>
                  <select
                    value={userStatusFilter}
                    onChange={(e) => setUserStatusFilter(e.target.value)}
                    className="px-2.5 py-1.5 text-xs rounded-xl border border-slate-300 outline-none bg-white font-semibold"
                  >
                    <option value="ALL">All Statuses</option>
                    <option value="ACTIVE">Active</option>
                    <option value="SUSPENDED">Suspended</option>
                    <option value="BLOCKED">Blocked</option>
                  </select>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-bold border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-5">Name & Email</th>
                      <th className="py-3 px-5">Phone</th>
                      <th className="py-3 px-5">Role</th>
                      <th className="py-3 px-5">Verifications</th>
                      <th className="py-3 px-5">Account Status</th>
                      <th className="py-3 px-5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {filteredUsers.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-12 text-center text-xs text-slate-400">
                          No users match criteria.
                        </td>
                      </tr>
                    ) : (
                      filteredUsers.map((u) => (
                        <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                          <td className="py-3.5 px-5 font-bold text-slate-900">
                            {u.name}
                            <span className="block text-[11px] font-mono font-normal text-slate-400">{u.email}</span>
                          </td>
                          <td className="py-3.5 px-5 font-mono text-slate-700">{u.phone}</td>
                          <td className="py-3.5 px-5">
                            <span className="px-2 py-0.5 bg-slate-100 text-slate-800 rounded-md font-bold text-[10px]">
                              {u.role}
                            </span>
                          </td>
                          <td className="py-3.5 px-5 space-y-0.5">
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded block w-fit ${u.isEmailVerified ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                              Email: {u.isEmailVerified ? 'Verified' : 'Pending'}
                            </span>
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded block w-fit ${u.isPhoneVerified ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                              Phone: {u.isPhoneVerified ? 'Verified' : 'Pending'}
                            </span>
                          </td>
                          <td className="py-3.5 px-5">
                            <StatusBadge status={u.status} size="sm" />
                          </td>
                          <td className="py-3.5 px-5 text-right space-x-1 whitespace-nowrap">
                            {u.status !== 'ACTIVE' && (
                              <button
                                onClick={() => handleUserAction(u.id, u.name, 'ACTIVATE')}
                                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-[11px]"
                              >
                                Activate
                              </button>
                            )}
                            {u.status !== 'SUSPENDED' && (
                              <button
                                onClick={() => handleUserAction(u.id, u.name, 'SUSPEND')}
                                className="px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-lg text-[11px]"
                              >
                                Suspend
                              </button>
                            )}
                            {u.status !== 'BLOCKED' && (
                              <button
                                onClick={() => handleUserAction(u.id, u.name, 'BLOCK')}
                                className="px-2.5 py-1 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg text-[11px]"
                              >
                                Block
                              </button>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          {/* TAB 3: WORKERS & VERIFICATION */}
          {activeTab === 'workers' && (
            <Card variant="default" padding="none" className="overflow-hidden">
              <div className="p-4 sm:p-5 border-b border-slate-200 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="font-black text-slate-900 text-base">Worker Profiles & Cashfree KYC Hub</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Review Aadhaar identity and bank account penny drop status.</p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <input
                    type="text"
                    placeholder="Search name, phone, trade, city..."
                    value={workerFilter}
                    onChange={(e) => setWorkerFilter(e.target.value)}
                    className="px-3 py-1.5 text-xs rounded-xl border border-slate-300 outline-none w-48 sm:w-60"
                  />
                  <select
                    value={workerStatusFilter}
                    onChange={(e) => setWorkerStatusFilter(e.target.value)}
                    className="px-2.5 py-1.5 text-xs rounded-xl border border-slate-300 outline-none bg-white font-semibold"
                  >
                    <option value="ALL">All Statuses</option>
                    <option value="VERIFIED">Verified</option>
                    <option value="PENDING_REVIEW">Pending Review</option>
                    <option value="ONBOARDING">Onboarding</option>
                    <option value="SUSPENDED">Suspended</option>
                  </select>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-bold border-b border-slate-200">
                    <tr>
                      <th className="py-3.5 px-5">Worker Details</th>
                      <th className="py-3.5 px-5">Trade & City</th>
                      <th className="py-3.5 px-5">Aadhaar (Cashfree)</th>
                      <th className="py-3.5 px-5">Bank Account (Cashfree)</th>
                      <th className="py-3.5 px-5">Status</th>
                      <th className="py-3.5 px-5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {filteredWorkers.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-12 text-center text-xs text-slate-400">
                          No workers found.
                        </td>
                      </tr>
                    ) : (
                      filteredWorkers.map((w) => (
                        <tr key={w.id} className="hover:bg-slate-50 transition-colors">
                          <td className="py-3.5 px-5 font-bold text-slate-900">
                            {w.fullName}
                            <span className="block text-[11px] font-mono font-normal text-slate-400">{w.phone}</span>
                          </td>
                          <td className="py-3.5 px-5">
                            <span className="font-semibold text-slate-800 block">{w.primaryCategory}</span>
                            <span className="text-[11px] text-slate-400">{w.city || 'Surat'} • {w.experienceYears} yrs exp</span>
                          </td>
                          <td className="py-3.5 px-5">
                            <span className="font-mono font-bold text-slate-800 block">{w.maskedAadhaar}</span>
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${w.identityStatus === 'VERIFIED' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                              {w.identityStatus}
                            </span>
                          </td>
                          <td className="py-3.5 px-5">
                            <span className="font-mono font-bold text-slate-800 block">{w.maskedBank}</span>
                            <span className="text-[11px] text-slate-500 block truncate max-w-[120px]">{w.bankName}</span>
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${w.bankStatus === 'VERIFIED' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                              {w.bankStatus}
                            </span>
                          </td>
                          <td className="py-3.5 px-5">
                            <StatusBadge status={w.status} size="sm" />
                          </td>
                          <td className="py-3.5 px-5 text-right space-x-1.5 whitespace-nowrap">
                            {w.status !== 'VERIFIED' && (
                              <button
                                onClick={() => handleWorkerAction(w.id, w.fullName, 'APPROVE')}
                                className="px-2.5 py-1 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-lg text-[11px]"
                              >
                                Approve
                              </button>
                            )}
                            {w.status !== 'SUSPENDED' ? (
                              <button
                                onClick={() => handleWorkerAction(w.id, w.fullName, 'SUSPEND')}
                                className="px-2.5 py-1 bg-red-50 hover:bg-red-100 text-red-700 font-bold rounded-lg text-[11px]"
                              >
                                Suspend
                              </button>
                            ) : (
                              <button
                                onClick={() => handleWorkerAction(w.id, w.fullName, 'REACTIVATE')}
                                className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold rounded-lg text-[11px]"
                              >
                                Reactivate
                              </button>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          {/* TAB 4: JOBS & BOOKINGS */}
          {activeTab === 'bookings' && (
            <Card variant="default" padding="none" className="overflow-hidden">
              <div className="p-4 sm:p-5 border-b border-slate-200 bg-white flex items-center justify-between gap-3">
                <div>
                  <h3 className="font-black text-slate-900 text-base">All Jobs & Bookings</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Inspect customer bookings, status transitions, and dispute resolutions.</p>
                </div>

                <select
                  value={jobStatusFilter}
                  onChange={(e) => setJobStatusFilter(e.target.value)}
                  className="px-2.5 py-1.5 text-xs rounded-xl border border-slate-300 outline-none bg-white font-semibold"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="REQUESTED">Requested</option>
                  <option value="ACCEPTED">Accepted</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="CANCELLED_BY_CUSTOMER">Cancelled (Customer)</option>
                  <option value="CANCELLED_BY_WORKER">Cancelled (Worker)</option>
                </select>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-bold border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-5">Job ID & Service</th>
                      <th className="py-3 px-5">Customer Details</th>
                      <th className="py-3 px-5">Worker Details</th>
                      <th className="py-3 px-5">Amount</th>
                      <th className="py-3 px-5">Status</th>
                      <th className="py-3 px-5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {filteredJobs.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-12 text-center text-xs text-slate-400">
                          No jobs found.
                        </td>
                      </tr>
                    ) : (
                      filteredJobs.map((j) => (
                        <tr key={j.id} className="hover:bg-slate-50 transition-colors">
                          <td className="py-3.5 px-5 font-bold text-slate-900">
                            #{j.id.slice(0, 8)}
                            <span className="block text-[11px] font-normal text-slate-500">{j.serviceName}</span>
                          </td>
                          <td className="py-3.5 px-5">
                            <span className="font-semibold text-slate-800 block">{j.customerName}</span>
                            <span className="text-[11px] font-mono text-slate-400">{j.customerPhone}</span>
                          </td>
                          <td className="py-3.5 px-5">
                            <span className="font-semibold text-slate-800 block">{j.workerName}</span>
                            <span className="text-[11px] font-mono text-slate-400">{j.workerPhone}</span>
                          </td>
                          <td className="py-3.5 px-5 font-bold text-slate-900 font-mono">₹{j.finalAmount}</td>
                          <td className="py-3.5 px-5">
                            <StatusBadge status={j.status} size="sm" />
                          </td>
                          <td className="py-3.5 px-5 text-right space-x-1 whitespace-nowrap">
                            {j.status !== 'COMPLETED' && (
                              <button
                                onClick={() => handleJobAction(j.id, 'RESOLVE')}
                                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-[11px]"
                              >
                                Complete
                              </button>
                            )}
                            {!j.status.startsWith('CANCELLED') && (
                              <button
                                onClick={() => handleJobAction(j.id, 'CANCEL')}
                                className="px-2.5 py-1 bg-red-50 hover:bg-red-100 text-red-700 font-bold rounded-lg text-[11px]"
                              >
                                Cancel
                              </button>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          {/* TAB 5: PAYMENTS & REVENUE */}
          {activeTab === 'payments' && (
            <Card variant="default" padding="none" className="overflow-hidden">
              <div className="p-4 sm:p-5 border-b border-slate-200 bg-white">
                <h3 className="font-black text-slate-900 text-base">Payment Transactions & Revenue Audit</h3>
                <p className="text-xs text-slate-500 mt-0.5">Cashfree order IDs, platform 10% fee breakdown, and settlement statuses.</p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-bold border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-5">Job / Order ID</th>
                      <th className="py-3 px-5">Customer & Worker</th>
                      <th className="py-3 px-5">Gross Amount</th>
                      <th className="py-3 px-5">Platform Fee (10%)</th>
                      <th className="py-3 px-5">Worker Payout</th>
                      <th className="py-3 px-5">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white font-mono">
                    {payments.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-12 text-center text-xs text-slate-400 font-sans">
                          No payment transactions captured yet.
                        </td>
                      </tr>
                    ) : (
                      payments.map((p) => (
                        <tr key={p.id} className="hover:bg-slate-50">
                          <td className="py-3.5 px-5 font-bold text-slate-900">
                            {p.providerOrderId}
                            <span className="block text-[10px] font-normal text-slate-400">Job: #{p.jobId.slice(0, 8)}</span>
                          </td>
                          <td className="py-3.5 px-5 font-sans">
                            <span className="font-bold text-slate-800 block">{p.customerName}</span>
                            <span className="text-[11px] text-slate-500">Worker: {p.workerName}</span>
                          </td>
                          <td className="py-3.5 px-5 font-bold text-slate-900">₹{p.grossAmount.toFixed(2)}</td>
                          <td className="py-3.5 px-5 font-bold text-brand-600">₹{p.platformFee.toFixed(2)}</td>
                          <td className="py-3.5 px-5 font-bold text-emerald-600">₹{p.workerAmount.toFixed(2)}</td>
                          <td className="py-3.5 px-5 font-sans">
                            <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 font-bold rounded text-[10px]">
                              {p.paymentStatus} ({p.settlementStatus})
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          {/* TAB 6: WEBSITE CONTENT MANAGEMENT (EDITABLE SITE CONTENT) */}
          {activeTab === 'content' && (
            <div className="space-y-6">
              <Card variant="default" padding="lg" className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
                  <div>
                    <h3 className="font-black text-slate-900 text-base flex items-center gap-2">
                      <Globe className="w-5 h-5 text-brand-600" />
                      Live Website Content Management
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Change homepage headings, hero text, about section, buttons, contact info, and footer. Updates reflect live immediately!
                    </p>
                  </div>

                  <a
                    href="/"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors shrink-0"
                  >
                    <span>View Public Website</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>

                {/* Sub-Tabs */}
                <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-2">
                  <button
                    type="button"
                    onClick={() => setContentSubTab('hero')}
                    className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all ${
                      contentSubTab === 'hero' ? 'bg-navy-950 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    Hero Section
                  </button>
                  <button
                    type="button"
                    onClick={() => setContentSubTab('about')}
                    className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all ${
                      contentSubTab === 'about' ? 'bg-navy-950 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    About Us
                  </button>
                  <button
                    type="button"
                    onClick={() => setContentSubTab('contact')}
                    className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all ${
                      contentSubTab === 'contact' ? 'bg-navy-950 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    Contact Info
                  </button>
                  <button
                    type="button"
                    onClick={() => setContentSubTab('footer')}
                    className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all ${
                      contentSubTab === 'footer' ? 'bg-navy-950 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    Footer & Social
                  </button>
                  <button
                    type="button"
                    onClick={() => setContentSubTab('announcement')}
                    className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all ${
                      contentSubTab === 'announcement' ? 'bg-navy-950 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    Announcement Banner
                  </button>
                </div>

                {/* Content Form */}
                <form onSubmit={handleSaveContent} className="space-y-4 pt-2">
                  {contentSubTab === 'hero' && (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Hero Main Title (Heading)
                        </label>
                        <input
                          type="text"
                          value={contentForm.hero_title || ''}
                          onChange={(e) => setContentForm({ ...contentForm, hero_title: e.target.value })}
                          className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 outline-none focus:border-brand-600"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Hero Subtitle
                        </label>
                        <input
                          type="text"
                          value={contentForm.hero_subtitle || ''}
                          onChange={(e) => setContentForm({ ...contentForm, hero_subtitle: e.target.value })}
                          className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 outline-none focus:border-brand-600"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Hero Supporting Description
                        </label>
                        <textarea
                          rows={3}
                          value={contentForm.hero_description || ''}
                          onChange={(e) => setContentForm({ ...contentForm, hero_description: e.target.value })}
                          className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 outline-none focus:border-brand-600"
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">
                            Primary CTA Button Label
                          </label>
                          <input
                            type="text"
                            value={contentForm.hero_button_primary || ''}
                            onChange={(e) => setContentForm({ ...contentForm, hero_button_primary: e.target.value })}
                            className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 outline-none focus:border-brand-600"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">
                            Secondary CTA Button Label
                          </label>
                          <input
                            type="text"
                            value={contentForm.hero_button_secondary || ''}
                            onChange={(e) => setContentForm({ ...contentForm, hero_button_secondary: e.target.value })}
                            className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 outline-none focus:border-brand-600"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {contentSubTab === 'about' && (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          About Section Title
                        </label>
                        <input
                          type="text"
                          value={contentForm.about_title || ''}
                          onChange={(e) => setContentForm({ ...contentForm, about_title: e.target.value })}
                          className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          About Section Subtitle
                        </label>
                        <input
                          type="text"
                          value={contentForm.about_subtitle || ''}
                          onChange={(e) => setContentForm({ ...contentForm, about_subtitle: e.target.value })}
                          className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          About Section Body Content
                        </label>
                        <textarea
                          rows={4}
                          value={contentForm.about_content || ''}
                          onChange={(e) => setContentForm({ ...contentForm, about_content: e.target.value })}
                          className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 outline-none"
                        />
                      </div>
                    </div>
                  )}

                  {contentSubTab === 'contact' && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">
                            Support Email
                          </label>
                          <input
                            type="email"
                            value={contentForm.contact_email || ''}
                            onChange={(e) => setContentForm({ ...contentForm, contact_email: e.target.value })}
                            className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 outline-none"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">
                            Support Phone / Helpline
                          </label>
                          <input
                            type="text"
                            value={contentForm.contact_phone || ''}
                            onChange={(e) => setContentForm({ ...contentForm, contact_phone: e.target.value })}
                            className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 outline-none"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Office Address
                        </label>
                        <input
                          type="text"
                          value={contentForm.contact_address || ''}
                          onChange={(e) => setContentForm({ ...contentForm, contact_address: e.target.value })}
                          className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Support Operating Hours
                        </label>
                        <input
                          type="text"
                          value={contentForm.contact_hours || ''}
                          onChange={(e) => setContentForm({ ...contentForm, contact_hours: e.target.value })}
                          className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 outline-none"
                        />
                      </div>
                    </div>
                  )}

                  {contentSubTab === 'footer' && (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Footer Brand Description
                        </label>
                        <textarea
                          rows={2}
                          value={contentForm.footer_text || ''}
                          onChange={(e) => setContentForm({ ...contentForm, footer_text: e.target.value })}
                          className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Copyright Text
                        </label>
                        <input
                          type="text"
                          value={contentForm.footer_copyright || ''}
                          onChange={(e) => setContentForm({ ...contentForm, footer_copyright: e.target.value })}
                          className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 outline-none"
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">Facebook URL</label>
                          <input
                            type="text"
                            value={contentForm.social_facebook || ''}
                            onChange={(e) => setContentForm({ ...contentForm, social_facebook: e.target.value })}
                            className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-300"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">Instagram URL</label>
                          <input
                            type="text"
                            value={contentForm.social_instagram || ''}
                            onChange={(e) => setContentForm({ ...contentForm, social_instagram: e.target.value })}
                            className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-300"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">WhatsApp Link / Number</label>
                          <input
                            type="text"
                            value={contentForm.social_whatsapp || ''}
                            onChange={(e) => setContentForm({ ...contentForm, social_whatsapp: e.target.value })}
                            className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-300"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {contentSubTab === 'announcement' && (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Enable Website Announcement Banner
                        </label>
                        <select
                          value={contentForm.announcement_enabled || 'false'}
                          onChange={(e) => setContentForm({ ...contentForm, announcement_enabled: e.target.value })}
                          className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white font-bold"
                        >
                          <option value="false">Disabled (Hidden)</option>
                          <option value="true">Enabled (Shown on Top Header)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Announcement Banner Message
                        </label>
                        <input
                          type="text"
                          value={contentForm.announcement_text || ''}
                          onChange={(e) => setContentForm({ ...contentForm, announcement_text: e.target.value })}
                          className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300"
                        />
                      </div>
                    </div>
                  )}

                  <div className="pt-2">
                    <Button
                      type="submit"
                      variant="brand"
                      size="md"
                      isLoading={savingContent}
                      icon={<Save className="w-4 h-4" />}
                    >
                      Save & Publish Live Content
                    </Button>
                  </div>
                </form>
              </Card>
            </div>
          )}

          {/* TAB 7: CATEGORIES */}
          {activeTab === 'categories' && (
            <div className="space-y-6">
              <Card variant="default" padding="lg">
                <h3 className="font-black text-slate-900 text-base mb-3">Add Service Category</h3>
                <form onSubmit={handleAddCategory} className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <input
                    type="text"
                    required
                    placeholder="Category Name"
                    value={newCatName}
                    onChange={(e) => setNewCatName(e.target.value)}
                    className="px-3.5 py-2 text-xs rounded-xl border border-slate-300 outline-none"
                  />
                  <input
                    type="text"
                    placeholder="Slug"
                    value={newCatSlug}
                    onChange={(e) => setNewCatSlug(e.target.value)}
                    className="px-3.5 py-2 text-xs rounded-xl border border-slate-300 outline-none font-mono"
                  />
                  <select
                    value={newCatIcon}
                    onChange={(e) => setNewCatIcon(e.target.value)}
                    className="px-3 py-2 text-xs rounded-xl border border-slate-300 outline-none bg-white font-semibold"
                  >
                    <option value="Wrench">Wrench (Plumbing)</option>
                    <option value="Zap">Zap (Electrical)</option>
                    <option value="Hammer">Hammer (Carpentry/Construction)</option>
                    <option value="Paintbrush">Paintbrush (Painting)</option>
                    <option value="Sparkles">Sparkles (Cleaning)</option>
                  </select>
                  <Button type="submit" variant="brand" size="md" icon={<Plus className="w-4 h-4" />}>
                    Add Category
                  </Button>
                </form>
              </Card>

              <Card variant="default" padding="lg">
                <h3 className="font-black text-slate-900 text-base mb-4">
                  Active Marketplace Categories ({categories.length})
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {categories.map((c) => (
                    <div key={c.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs">
                      <span className="font-bold text-slate-900 text-sm block">{c.name}</span>
                      <span className="text-[11px] font-mono text-slate-400">slug: {c.slug}</span>
                      <span className="block text-[11px] text-slate-500 mt-1">
                        {c.services?.length || 0} sub-services configured
                      </span>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          )}

          {/* TAB 8: DISPUTES CONSOLE */}
          {activeTab === 'disputes' && (
            <Card variant="default" padding="lg" className="space-y-4">
              <h3 className="font-black text-slate-900 text-base">Customer-Worker Dispute Arbitration</h3>
              {disputes.length === 0 ? (
                <EmptyState
                  title="No Active Disputes"
                  description="There are currently no customer or worker disputes requiring arbitration."
                />
              ) : (
                disputes.map((d) => (
                  <div key={d.id} className="p-4 rounded-2xl border border-slate-200 space-y-2 text-xs bg-slate-50">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-800">Dispute #{d.id.slice(0, 8)}</span>
                      <Badge variant="warning">{d.status}</Badge>
                    </div>
                    <p className="text-slate-600"><strong>Reason:</strong> {d.reason}</p>
                  </div>
                ))
              )}
            </Card>
          )}

          {/* TAB 9: AUDIT LOGS */}
          {activeTab === 'audit' && (
            <Card variant="default" padding="none" className="overflow-hidden">
              <div className="p-5 border-b border-slate-200 bg-white">
                <h3 className="font-black text-slate-900 text-base">Immutable System Audit Logs</h3>
                <p className="text-xs text-slate-500 mt-0.5">Every sensitive admin action, status change, and password update is tracked.</p>
              </div>

              <div className="divide-y divide-slate-100 max-h-[600px] overflow-y-auto bg-white">
                {auditLogs.map((log) => (
                  <div key={log.id} className="p-4 hover:bg-slate-50 text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-navy-900">{log.action}</span>
                      <span className="text-[11px] text-slate-400 font-mono">
                        {new Date(log.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-slate-600">
                      Target: <span className="font-semibold text-slate-800">{log.targetType}</span> (ID: {log.targetId})
                    </p>
                    {log.newState && (
                      <p className="text-[11px] text-slate-500 font-mono bg-slate-100 p-1.5 rounded">
                        {log.newState}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* TAB 10: SETTINGS & ADMIN SECURITY */}
          {activeTab === 'settings' && (
            <div className="space-y-6">
              {/* Change Admin Password Form */}
              <Card variant="default" padding="lg" className="space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
                  <Key className="w-5 h-5 text-brand-600" />
                  <div>
                    <h3 className="font-black text-slate-900 text-base">Change Admin Password</h3>
                    <p className="text-xs text-slate-500">Update initial password Pass@123 to a secure custom password.</p>
                  </div>
                </div>

                {passChangeMsg && (
                  <div
                    className={`p-3 rounded-xl text-xs font-bold ${
                      passChangeMsg.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'
                    }`}
                  >
                    {passChangeMsg.msg}
                  </div>
                )}

                <form onSubmit={handleChangePassword} className="space-y-3 max-w-md">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Current Password</label>
                    <input
                      type="password"
                      required
                      value={currentPassInput}
                      onChange={(e) => setCurrentPassInput(e.target.value)}
                      className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 outline-none"
                      placeholder="Pass@123"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">New Password</label>
                    <input
                      type="password"
                      required
                      value={newPassInput}
                      onChange={(e) => setNewPassInput(e.target.value)}
                      className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 outline-none"
                      placeholder="Enter strong new password"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Confirm New Password</label>
                    <input
                      type="password"
                      required
                      value={confirmPassInput}
                      onChange={(e) => setConfirmPassInput(e.target.value)}
                      className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 outline-none"
                      placeholder="Confirm new password"
                    />
                  </div>

                  <Button
                    type="submit"
                    variant="brand"
                    size="md"
                    isLoading={passChangeLoading}
                    icon={<Lock className="w-4 h-4" />}
                  >
                    Update Admin Password
                  </Button>
                </form>
              </Card>

              {/* Maintenance Mode & Platform Settings */}
              <Card variant="default" padding="lg" className="space-y-4">
                <h3 className="font-black text-slate-900 text-base">Platform Configuration</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                    <span className="font-bold text-slate-900 block">Platform Commission Fee</span>
                    <span className="text-slate-500">10% standard rate on completed customer bookings.</span>
                  </div>
                  <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                    <span className="font-bold text-slate-900 block">Multi-Factor Authentication</span>
                    <span className="text-emerald-700 font-bold">ENFORCED (Email OTP on every login)</span>
                  </div>
                </div>
              </Card>
            </div>
          )}
        </main>
      </div>

      {/* Confirmation Dialog Modal */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 z-50 bg-navy-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 text-amber-600">
              <AlertTriangle className="w-6 h-6" />
              <h3 className="text-lg font-black text-slate-900">{confirmModal.title}</h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">{confirmModal.description}</p>
            <div className="flex justify-end gap-2.5 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                size="sm"
                isLoading={actionLoading}
                onClick={confirmModal.onConfirm}
              >
                Confirm Action
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
