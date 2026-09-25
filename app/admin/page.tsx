'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
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
  Bell,
  Settings,
  Plus,
  Loader2,
} from 'lucide-react';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import StatusBadge from '@/components/ui/StatusBadge';
import EmptyState from '@/components/ui/EmptyState';

type AdminTab =
  | 'dashboard'
  | 'users'
  | 'customers'
  | 'workers'
  | 'verification'
  | 'bookings'
  | 'payments'
  | 'categories'
  | 'reviews'
  | 'disputes'
  | 'reports'
  | 'notifications'
  | 'audit'
  | 'settings';

export default function AdminDashboardPage() {
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const [session, setSession] = useState<any>(null);
  const [loadingSession, setLoadingSession] = useState(true);

  // Data states
  const [metrics, setMetrics] = useState<any>(null);
  const [workers, setWorkers] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [disputes, setDisputes] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);

  const [loadingData, setLoadingData] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // New Category modal/form
  const [newCatName, setNewCatName] = useState('');
  const [newCatSlug, setNewCatSlug] = useState('');
  const [newCatIcon, setNewCatIcon] = useState('Wrench');

  // Search/filter in workers
  const [workerFilter, setWorkerFilter] = useState('');
  const [workerStatusFilter, setWorkerStatusFilter] = useState('ALL');

  // 1. Session check
  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((data) => {
        if (data.authenticated && data.user && data.user.role === 'ADMIN') {
          setSession(data.user);
        } else {
          router.replace('/logout?reason=unauthorized');
        }
      })
      .catch(() => router.replace('/logout?reason=unauthorized'))
      .finally(() => setLoadingSession(false));
  }, [router]);

  // 2. Fetch all admin datasets
  const fetchAdminData = async () => {
    setLoadingData(true);
    try {
      const [metricsRes, workersRes, catRes, dispRes, logsRes] = await Promise.all([
        fetch('/api/admin/metrics'),
        fetch('/api/admin/workers'),
        fetch('/api/admin/categories'),
        fetch('/api/admin/disputes'),
        fetch('/api/admin/audit-logs'),
      ]);

      const [mData, wData, cData, dData, lData] = await Promise.all([
        metricsRes.json(),
        workersRes.json(),
        catRes.json(),
        dispRes.json(),
        logsRes.json(),
      ]);

      if (mData.success) setMetrics(mData.metrics);
      if (wData.success) setWorkers(wData.workers || []);
      if (cData.success) setCategories(cData.categories || []);
      if (dData.success) setDisputes(dData.disputes || []);
      if (lData.success) setAuditLogs(lData.logs || []);
    } catch (err) {
      console.error('Failed to load admin data:', err);
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    if (session) {
      fetchAdminData();
    }
  }, [session]);

  // Worker Action (Approve, Suspend, Reactivate)
  const handleWorkerAction = async (workerId: string, action: string) => {
    setActionLoading(true);
    try {
      const res = await fetch('/api/admin/workers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workerId, action }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        alert(data.error || 'Action failed');
        return;
      }
      fetchAdminData();
    } catch (err: any) {
      alert('Error: ' + err.message);
    } finally {
      setActionLoading(false);
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

  // Resolve Dispute
  const handleResolveDispute = async (disputeId: string, resolution: string) => {
    const notes = prompt('Enter resolution notes / audit comment:');
    if (!notes) return;

    try {
      const res = await fetch('/api/admin/disputes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ disputeId, resolution, notes }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        alert(data.error || 'Failed to resolve dispute');
        return;
      }
      fetchAdminData();
    } catch (err: any) {
      alert('Error: ' + err.message);
    }
  };

  if (loadingSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-8 h-8 animate-spin text-brand-700" />
      </div>
    );
  }

  // Filtered workers
  const filteredWorkers = workers.filter((w) => {
    const matchSearch =
      w.fullName?.toLowerCase().includes(workerFilter.toLowerCase()) ||
      w.phone?.toLowerCase().includes(workerFilter.toLowerCase()) ||
      w.primaryCategory?.toLowerCase().includes(workerFilter.toLowerCase()) ||
      w.city?.toLowerCase().includes(workerFilter.toLowerCase());

    if (workerStatusFilter === 'ALL') return matchSearch;
    return matchSearch && w.status === workerStatusFilter;
  });

  const pendingVerificationWorkers = workers.filter((w) => w.status !== 'VERIFIED');

  const navItems = [
    { id: 'dashboard' as AdminTab, label: 'Dashboard', icon: <Layers className="w-4 h-4" /> },
    { id: 'workers' as AdminTab, label: 'Workers', icon: <Briefcase className="w-4 h-4" />, count: workers.length },
    { id: 'verification' as AdminTab, label: 'Worker Verification', icon: <ShieldCheck className="w-4 h-4" />, count: pendingVerificationWorkers.length },
    { id: 'users' as AdminTab, label: 'Users', icon: <Users className="w-4 h-4" />, count: metrics?.totalUsers },
    { id: 'customers' as AdminTab, label: 'Customers', icon: <UserCheck className="w-4 h-4" />, count: metrics?.totalCustomers },
    { id: 'bookings' as AdminTab, label: 'Bookings', icon: <Clock className="w-4 h-4" />, count: metrics?.activeJobs },
    { id: 'payments' as AdminTab, label: 'Payments', icon: <CreditCard className="w-4 h-4" /> },
    { id: 'categories' as AdminTab, label: 'Categories', icon: <Building className="w-4 h-4" />, count: categories.length },
    { id: 'reviews' as AdminTab, label: 'Reviews', icon: <CheckCircle2 className="w-4 h-4" /> },
    { id: 'disputes' as AdminTab, label: 'Disputes', icon: <Scale className="w-4 h-4" />, count: disputes.length },
    { id: 'reports' as AdminTab, label: 'Reports', icon: <FileText className="w-4 h-4" /> },
    { id: 'notifications' as AdminTab, label: 'Notifications', icon: <Bell className="w-4 h-4" /> },
    { id: 'audit' as AdminTab, label: 'Audit Logs', icon: <FileText className="w-4 h-4" />, count: auditLogs.length },
    { id: 'settings' as AdminTab, label: 'Settings', icon: <Settings className="w-4 h-4" /> },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-slate-100">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full flex-1 flex flex-col lg:flex-row gap-6">
        {/* Mobile Navigation Toggle */}
        <div className="lg:hidden flex items-center justify-between bg-white p-3.5 rounded-2xl border border-slate-200">
          <span className="font-bold text-xs text-slate-800">Admin Operations Menu</span>
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
          <Card variant="default" padding="sm" className="space-y-1">
            <div className="px-3 py-2.5 border-b border-slate-100 mb-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Platform Operations
              </span>
              <p className="text-xs font-black text-slate-900 truncate mt-0.5">Admin Console</p>
              <span className="text-[10px] font-mono text-brand-700 font-bold block mt-0.5">
                SUPERADMIN ACCESS
              </span>
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
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                    isActive
                      ? 'bg-navy-900 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className={isActive ? 'text-brand-400' : 'text-slate-400'}>
                      {item.icon}
                    </span>
                    <span>{item.label}</span>
                  </div>
                  {item.count !== undefined && item.count > 0 && (
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                        isActive ? 'bg-navy-800 text-brand-300' : 'bg-slate-200 text-slate-700'
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
          {/* Header Bar */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-navy-900 text-white">
                  <Shield className="w-5 h-5 text-brand-400" />
                </span>
                <h1 className="text-2xl sm:text-3xl font-black text-slate-900">
                  Operations Control Center
                </h1>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Real-time metrics, Cashfree KYC validation, categories, disputes, and cryptographic audit logs.
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

          {/* Real Metrics Cards from /api/admin/metrics */}
          {metrics && (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                <span className="text-[11px] font-bold text-slate-400 block mb-1">Total Users</span>
                <span className="text-xl font-black text-slate-900">{metrics.totalUsers}</span>
                <span className="text-[10px] text-slate-400 block mt-0.5">
                  {metrics.totalCustomers} customers
                </span>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                <span className="text-[11px] font-bold text-slate-400 block mb-1">Total Workers</span>
                <span className="text-xl font-black text-navy-900">{metrics.totalWorkers}</span>
                <span className="text-[10px] text-slate-400 block mt-0.5">Profiles active</span>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                <span className="text-[11px] font-bold text-slate-400 block mb-1">Verified Workers</span>
                <span className="text-xl font-black text-brand-700">
                  {metrics.verifiedWorkers}
                </span>
                <span className="text-[10px] text-brand-600 block mt-0.5">KYC Confirmed</span>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                <span className="text-[11px] font-bold text-slate-400 block mb-1">Pending KYC</span>
                <span className="text-xl font-black text-amber-600">{metrics.pendingVerifications}</span>
                <span className="text-[10px] text-amber-600 block mt-0.5">Awaiting check</span>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                <span className="text-[11px] font-bold text-slate-400 block mb-1">Active Bookings</span>
                <span className="text-xl font-black text-blue-600">{metrics.activeJobs}</span>
                <span className="text-[10px] text-slate-400 block mt-0.5">In Progress</span>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                <span className="text-[11px] font-bold text-slate-400 block mb-1">Platform Revenue</span>
                <span className="text-xl font-black text-navy-900">
                  ₹{metrics.totalPlatformRevenue ? metrics.totalPlatformRevenue.toFixed(0) : '0'}
                </span>
                <span className="text-[10px] text-slate-400 block mt-0.5">10% Platform fee</span>
              </div>
            </div>
          )}

          {/* TAB 1: WORKERS / VERIFICATION HUB */}
          {(activeTab === 'dashboard' || activeTab === 'workers' || activeTab === 'verification') && (
            <Card variant="default" padding="none" className="overflow-hidden">
              <div className="p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white">
                <div>
                  <h3 className="font-black text-slate-900 text-base">
                    {activeTab === 'verification' ? 'Worker Verification Queue' : 'All Worker Profiles'}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Aadhaar identity and bank details must be verified by Cashfree Secure ID.
                  </p>
                </div>

                {/* Filter and Search */}
                <div className="flex flex-wrap items-center gap-2">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                    <input
                      type="text"
                      placeholder="Search name, phone, trade, city..."
                      value={workerFilter}
                      onChange={(e) => setWorkerFilter(e.target.value)}
                      className="pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-300 outline-none w-48 sm:w-60"
                    />
                  </div>

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

              {/* Workers Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-bold border-b border-slate-200">
                    <tr>
                      <th className="py-3.5 px-6">Worker Details</th>
                      <th className="py-3.5 px-6">Trade & City</th>
                      <th className="py-3.5 px-6">Aadhaar (Cashfree)</th>
                      <th className="py-3.5 px-6">Bank Account (Cashfree)</th>
                      <th className="py-3.5 px-6">Platform Status</th>
                      <th className="py-3.5 px-6 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {filteredWorkers.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-12 text-center text-xs text-slate-400">
                          No workers match the selected filter.
                        </td>
                      </tr>
                    ) : (
                      filteredWorkers.map((w) => (
                        <tr key={w.id} className="hover:bg-slate-50/60 transition-colors">
                          <td className="py-4 px-6 font-bold text-slate-900">
                            {w.fullName}
                            <span className="block text-[11px] font-mono font-normal text-slate-400">
                              {w.phone}
                            </span>
                          </td>
                          <td className="py-4 px-6">
                            <span className="font-semibold text-slate-800 block">{w.primaryCategory}</span>
                            <span className="text-[11px] text-slate-400">
                              {w.city || 'Surat'} • {w.experienceYears} yrs exp
                            </span>
                          </td>
                          <td className="py-4 px-6">
                            <span className="font-mono font-bold text-slate-800 block">
                              {w.maskedAadhaar}
                            </span>
                            <span
                              className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                                w.identityStatus === 'VERIFIED'
                                  ? 'bg-brand-50 text-brand-700'
                                  : 'bg-amber-50 text-amber-700'
                              }`}
                            >
                              {w.identityStatus}
                            </span>
                          </td>
                          <td className="py-4 px-6">
                            <span className="font-mono font-bold text-slate-800 block">
                              {w.maskedBank}
                            </span>
                            <span className="text-[11px] text-slate-500 block truncate max-w-[120px]">
                              {w.bankName}
                            </span>
                            <span
                              className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                                w.bankStatus === 'VERIFIED'
                                  ? 'bg-brand-50 text-brand-700'
                                  : 'bg-amber-50 text-amber-700'
                              }`}
                            >
                              {w.bankStatus}
                            </span>
                          </td>
                          <td className="py-4 px-6">
                            <StatusBadge status={w.status} size="sm" />
                          </td>
                          <td className="py-4 px-6 text-right space-x-1.5 whitespace-nowrap">
                            {w.status !== 'VERIFIED' && (
                              <button
                                onClick={() => handleWorkerAction(w.id, 'APPROVE')}
                                disabled={actionLoading}
                                className="px-2.5 py-1 bg-brand-700 hover:bg-brand-800 text-white font-bold rounded-lg text-[11px] shadow-xs transition-colors"
                              >
                                Approve
                              </button>
                            )}
                            {w.status !== 'SUSPENDED' ? (
                              <button
                                onClick={() => handleWorkerAction(w.id, 'SUSPEND')}
                                disabled={actionLoading}
                                className="px-2.5 py-1 bg-red-50 hover:bg-red-100 text-red-700 font-bold rounded-lg text-[11px] transition-colors"
                              >
                                Suspend
                              </button>
                            ) : (
                              <button
                                onClick={() => handleWorkerAction(w.id, 'REACTIVATE')}
                                disabled={actionLoading}
                                className="px-2.5 py-1 bg-brand-50 hover:bg-brand-100 text-brand-700 font-bold rounded-lg text-[11px] transition-colors"
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

          {/* TAB 2: CATEGORIES & SERVICES */}
          {activeTab === 'categories' && (
            <div className="space-y-6">
              <Card variant="default" padding="lg">
                <h3 className="font-black text-slate-900 text-base mb-3">Add Service Category</h3>
                <form onSubmit={handleAddCategory} className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <input
                    type="text"
                    required
                    placeholder="Category Name (e.g. Masonry)"
                    value={newCatName}
                    onChange={(e) => setNewCatName(e.target.value)}
                    className="px-3.5 py-2 text-xs rounded-xl border border-slate-300 outline-none"
                  />
                  <input
                    type="text"
                    placeholder="Slug (e.g. masonry)"
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

          {/* TAB 3: DISPUTES CONSOLE */}
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
                    <div className="flex gap-2 pt-2">
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => handleResolveDispute(d.id, 'REFUND_CUSTOMER')}
                      >
                        Refund Customer
                      </Button>
                      <Button
                        variant="brand"
                        size="sm"
                        onClick={() => handleResolveDispute(d.id, 'PAY_WORKER')}
                      >
                        Release Payment to Worker
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </Card>
          )}

          {/* TAB 4: AUDIT LOGS */}
          {activeTab === 'audit' && (
            <Card variant="default" padding="none" className="overflow-hidden">
              <div className="p-5 border-b border-slate-200 bg-white">
                <h3 className="font-black text-slate-900 text-base">Immutable System Audit Logs</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Every sensitive admin action, status change, and refund is cryptographically tracked.
                </p>
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
        </main>
      </div>

      <Footer />
    </div>
  );
}
