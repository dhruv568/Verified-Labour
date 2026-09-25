'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import {
  LayoutDashboard,
  Briefcase,
  Clock,
  TrendingUp,
  Power,
  ShieldCheck,
  FileCheck,
  Bell,
  User,
  Settings,
  CheckCircle2,
  AlertCircle,
  MapPin,
  Calendar,
  Navigation,
  Loader2,
  Menu,
  X,
  Phone,
  ArrowRight,
} from 'lucide-react';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import StatusBadge from '@/components/ui/StatusBadge';
import EmptyState from '@/components/ui/EmptyState';

type WorkerNavTab =
  | 'dashboard'
  | 'jobs'
  | 'active_job'
  | 'job_history'
  | 'earnings'
  | 'availability'
  | 'profile'
  | 'verification'
  | 'documents'
  | 'notifications'
  | 'settings';

export default function WorkerDashboardPage() {
  const router = useRouter();

  const [activeNav, setActiveNav] = useState<WorkerNavTab>('dashboard');
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const [session, setSession] = useState<any>(null);
  const [loadingSession, setLoadingSession] = useState(true);

  // Availability state
  const [isAvailable, setIsAvailable] = useState(true);
  const [togglingAvailability, setTogglingAvailability] = useState(false);

  // Real backend jobs
  const [jobs, setJobs] = useState<any[]>([]);
  const [loadingJobs, setLoadingJobs] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Greeting
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  // 1. Fetch Session
  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((data) => {
        if (data.authenticated && data.user) {
          if (data.user.role === 'ADMIN') {
            router.push('/admin');
            return;
          }
          if (data.user.role === 'CUSTOMER') {
            router.push('/customer/dashboard');
            return;
          }
          setSession(data.user);
          setIsAvailable(data.user.workerProfile?.isAvailable ?? true);

          // If onboarding is incomplete, offer to complete it
          if (data.user.workerProfile?.status === 'ONBOARDING') {
            // Can show banner or let them continue
          }
        } else {
          router.replace('/logout?reason=unauthorized');
        }
      })
      .catch(() => router.replace('/logout?reason=unauthorized'))
      .finally(() => setLoadingSession(false));
  }, [router]);

  // 2. Fetch Real Worker Jobs
  const fetchWorkerJobs = async () => {
    setLoadingJobs(true);
    try {
      const res = await fetch('/api/jobs');
      const data = await res.json();
      if (data.success) {
        setJobs(data.jobs || []);
      }
    } catch (err) {
      console.error('Failed to fetch worker jobs:', err);
    } finally {
      setLoadingJobs(false);
    }
  };

  useEffect(() => {
    if (session) {
      fetchWorkerJobs();
    }
  }, [session]);

  // Toggle availability
  const handleToggleAvailability = async () => {
    const workerId = session?.workerProfile?.id;
    if (!workerId) return;

    const nextState = !isAvailable;
    setIsAvailable(nextState);
    setTogglingAvailability(true);

    try {
      await fetch(`/api/workers/${workerId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isAvailable: nextState }),
      });
    } catch (err) {
      console.error('Failed to update availability:', err);
      setIsAvailable(!nextState); // revert on failure
    } finally {
      setTogglingAvailability(false);
    }
  };

  // Transition job status via real API
  const handleJobTransition = async (jobId: string, toStatus: string) => {
    setActionLoading(jobId);
    try {
      const res = await fetch(`/api/jobs/${jobId}/transition`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ toStatus }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        alert(data.error || 'State transition failed');
        return;
      }
      // Refresh jobs
      fetchWorkerJobs();
    } catch (err: any) {
      alert('Error updating job: ' + err.message);
    } finally {
      setActionLoading(null);
    }
  };

  if (loadingSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-8 h-8 animate-spin text-brand-700" />
      </div>
    );
  }

  const profile = session?.workerProfile;
  const workerName = profile?.fullName || 'Worker Partner';

  const aadhaarDone = profile?.aadhaarVerif?.status === 'VERIFIED';
  const bankDone = profile?.bankVerif?.status === 'VERIFIED';
  const documentsDone = (profile?.documents?.length || 0) > 0;
  const profileComplete = Boolean(profile?.fullName && profile?.primaryCategory && profile?.city);

  const activeJobs = jobs.filter((j) =>
    ['REQUESTED', 'ACCEPTED', 'SCHEDULED', 'WORKER_ON_THE_WAY', 'ARRIVED', 'WORK_STARTED'].includes(j.status)
  );
  const completedJobs = jobs.filter((j) => ['WORK_COMPLETED', 'PAYMENT_PENDING', 'PAID', 'REVIEWED', 'COMPLETED'].includes(j.status));

  const navItems = [
    { id: 'dashboard' as WorkerNavTab, label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: 'jobs' as WorkerNavTab, label: 'Jobs', icon: <Briefcase className="w-4 h-4" />, count: jobs.length },
    { id: 'active_job' as WorkerNavTab, label: 'Active Job', icon: <Clock className="w-4 h-4" />, count: activeJobs.length },
    { id: 'job_history' as WorkerNavTab, label: 'Job History', icon: <CheckCircle2 className="w-4 h-4" />, count: completedJobs.length },
    { id: 'earnings' as WorkerNavTab, label: 'Earnings', icon: <TrendingUp className="w-4 h-4" /> },
    { id: 'availability' as WorkerNavTab, label: 'Availability', icon: <Power className="w-4 h-4" /> },
    { id: 'profile' as WorkerNavTab, label: 'Profile', icon: <User className="w-4 h-4" /> },
    { id: 'verification' as WorkerNavTab, label: 'Verification', icon: <ShieldCheck className="w-4 h-4" /> },
    { id: 'documents' as WorkerNavTab, label: 'Documents', icon: <FileCheck className="w-4 h-4" /> },
    { id: 'notifications' as WorkerNavTab, label: 'Notifications', icon: <Bell className="w-4 h-4" /> },
    { id: 'settings' as WorkerNavTab, label: 'Settings', icon: <Settings className="w-4 h-4" /> },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full flex-1 flex flex-col lg:flex-row gap-6">
        {/* Mobile Navigation Toggle & Quick Horizontal Tab Bar */}
        <div className="lg:hidden space-y-2">
          <div className="flex items-center justify-between bg-white p-3 rounded-2xl border border-slate-200">
            <span className="font-bold text-xs text-slate-800">Worker Dashboard</span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
              icon={mobileSidebarOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            >
              {mobileSidebarOpen ? 'Close Menu' : 'All Tabs'}
            </Button>
          </div>

          {/* Quick Tab Scroll Rail for 1-Thumb Switching on Phones */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
            {navItems.map((item) => {
              const isActive = activeNav === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveNav(item.id);
                    setMobileSidebarOpen(false);
                  }}
                  className={`shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all min-h-[40px] ${
                    isActive
                      ? 'bg-navy-900 text-white shadow-xs'
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 active:bg-slate-100'
                  }`}
                >
                  <span className={isActive ? 'text-brand-400' : 'text-slate-400'}>
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
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
          </div>
        </div>

        {/* Sidebar Navigation */}
        <aside
          className={`lg:block w-full lg:w-64 shrink-0 space-y-3 ${
            mobileSidebarOpen ? 'block' : 'hidden lg:block'
          }`}
        >
          <Card variant="default" padding="sm" className="space-y-1">
            <div className="px-3 py-2.5 border-b border-slate-100 mb-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Professional Cockpit
              </span>
              <p className="text-xs font-black text-slate-900 truncate mt-0.5">{workerName}</p>
              <span className="text-[11px] text-slate-500 block truncate">
                {profile?.primaryCategory?.name || 'Skilled Labour'}
              </span>
            </div>

            {navItems.map((item) => {
              const isActive = activeNav === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveNav(item.id);
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

          {/* Quick Onboarding Resume Link if in onboarding */}
          {profile?.status === 'ONBOARDING' && (
            <Card variant="muted" padding="md" className="space-y-2 border-brand-300 bg-brand-50/40">
              <span className="text-xs font-bold text-brand-900 block">Onboarding In Progress</span>
              <p className="text-[11px] text-brand-800 leading-relaxed">
                Complete your Cashfree Aadhaar & Bank verification to receive the Verified badge.
              </p>
              <Link
                href="/worker/onboarding"
                className="inline-block w-full py-2 bg-brand-700 hover:bg-brand-800 text-white text-xs font-bold text-center rounded-xl transition-colors shadow-xs"
              >
                Continue Onboarding →
              </Link>
            </Card>
          )}
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 space-y-6 min-w-0">
          {/* Header Card: Greeting & Availability Toggle */}
          <div className="bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-8 border border-slate-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              {profile?.avatarUrl ? (
                <img
                  src={profile.avatarUrl}
                  alt={workerName}
                  className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover border-2 border-emerald-500 shadow-md shrink-0"
                />
              ) : (
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-brand-100 text-brand-800 font-black text-xl flex items-center justify-center border border-brand-200 shrink-0">
                  {workerName ? workerName.slice(0, 2).toUpperCase() : 'WL'}
                </div>
              )}
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-xl sm:text-3xl font-black text-slate-900">
                    {greeting}, {workerName}
                  </h1>
                  <StatusBadge status={profile?.status || 'PENDING_REVIEW'} size="sm" />
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Trade: <strong className="text-slate-700">{profile?.primaryCategory?.name || 'Skilled Labour'}</strong> • Coverage Radius: {profile?.serviceRadiusKm || 15} km
                </p>
              </div>
            </div>

            {/* Availability Toggle */}
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <button
                type="button"
                disabled={togglingAvailability}
                onClick={handleToggleAvailability}
                className={`w-full sm:w-auto px-5 py-3 min-h-[46px] rounded-2xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-xs transition-all active:scale-98 ${
                  isAvailable
                    ? 'bg-brand-700 hover:bg-brand-800 text-white'
                    : 'bg-slate-200 hover:bg-slate-300 text-slate-700'
                }`}
              >
                <Power className="w-4 h-4" />
                <span>{isAvailable ? 'AVAILABLE • Accepting Jobs' : 'OFFLINE • Busy'}</span>
              </button>
            </div>
          </div>

          {/* Verification Status Overview Box */}
          <Card variant="default" padding="md" className="space-y-3">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
              Verification Status (Backend Synced)
            </span>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {/* Aadhaar */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                <span className="text-[11px] font-bold text-slate-500 block">Aadhaar (Cashfree)</span>
                {aadhaarDone ? (
                  <span className="text-xs font-bold text-brand-700 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Verified
                  </span>
                ) : (
                  <span className="text-xs font-bold text-amber-600 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" /> Pending
                  </span>
                )}
              </div>

              {/* Bank */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                <span className="text-[11px] font-bold text-slate-500 block">Bank (Cashfree)</span>
                {bankDone ? (
                  <span className="text-xs font-bold text-brand-700 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Verified
                  </span>
                ) : (
                  <span className="text-xs font-bold text-amber-600 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" /> Pending
                  </span>
                )}
              </div>

              {/* Documents */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                <span className="text-[11px] font-bold text-slate-500 block">Documents</span>
                {documentsDone ? (
                  <span className="text-xs font-bold text-brand-700 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Submitted
                  </span>
                ) : (
                  <span className="text-xs font-bold text-slate-400 flex items-center gap-1">
                    Optional
                  </span>
                )}
              </div>

              {/* Profile */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                <span className="text-[11px] font-bold text-slate-500 block">Profile</span>
                {profileComplete ? (
                  <span className="text-xs font-bold text-brand-700 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Complete
                  </span>
                ) : (
                  <span className="text-xs font-bold text-amber-600 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" /> Incomplete
                  </span>
                )}
              </div>
            </div>
          </Card>

          {/* TAB: DASHBOARD & ACTIVE JOBS */}
          {(activeNav === 'dashboard' || activeNav === 'jobs' || activeNav === 'active_job') && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-black text-slate-900">Today's Jobs & Requests</h3>
                  <p className="text-xs text-slate-500">
                    Real incoming job requests from customers in your service radius.
                  </p>
                </div>
                <span className="text-xs font-bold text-slate-600">{jobs.length} Total</span>
              </div>

              {loadingJobs ? (
                <div className="py-16 text-center">
                  <Loader2 className="w-8 h-8 animate-spin text-brand-700 mx-auto mb-2" />
                  <p className="text-xs text-slate-500">Checking for new job requests...</p>
                </div>
              ) : jobs.length === 0 ? (
                <EmptyState
                  title="No new job requests"
                  description="New requests will appear here when customers book your services in your radius. Keep your availability status ON."
                />
              ) : (
                <div className="space-y-4">
                  {jobs.map((job) => (
                    <Card key={job.id} variant="default" padding="md" className="space-y-4">
                      {/* Job Header */}
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-mono font-bold text-slate-400">
                              #{job.id.slice(0, 8).toUpperCase()}
                            </span>
                            <StatusBadge status={job.status} size="sm" />
                          </div>
                          <h4 className="font-bold text-slate-900 text-base mt-1">
                            {job.service?.name || 'On-Demand Service'}
                          </h4>
                          <p className="text-xs text-slate-500">
                            Customer: <strong className="text-slate-800">{job.customer?.fullName}</strong>
                            {job.customer?.user?.phone && job.status !== 'REQUESTED' && (
                              <span className="ml-2 font-mono text-brand-700 font-semibold">
                                • {job.customer.user.phone}
                              </span>
                            )}
                          </p>
                        </div>

                        <div className="text-left sm:text-right">
                          <span className="text-xs text-slate-400 block">Job Amount</span>
                          <span className="text-2xl font-black text-navy-900">₹{job.finalAmount}</span>
                        </div>
                      </div>

                      {/* Job Requirement Details */}
                      <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs space-y-1.5">
                        <p className="text-slate-700">
                          <strong className="text-slate-900">Customer Note:</strong> {job.jobRequest?.description}
                        </p>
                        <p className="flex items-center gap-1.5 text-slate-600">
                          <MapPin className="w-3.5 h-3.5 text-brand-600 shrink-0" />
                          <span>{job.jobRequest?.formattedAddress}</span>
                        </p>
                        <p className="flex items-center gap-1.5 text-slate-500">
                          <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>
                            Scheduled: {job.jobRequest?.preferredDate} • {job.jobRequest?.preferredTime}
                          </span>
                        </p>
                      </div>

                      {/* State Machine Transition Action Controls */}
                      <div className="pt-1 flex flex-wrap items-center gap-2">
                        {job.status === 'REQUESTED' && (
                          <>
                            <Button
                              variant="brand"
                              size="md"
                              isLoading={actionLoading === job.id}
                              onClick={() => handleJobTransition(job.id, 'ACCEPTED')}
                            >
                              Accept Job Request
                            </Button>
                            <Button
                              variant="outline"
                              size="md"
                              isLoading={actionLoading === job.id}
                              onClick={() => {
                                if (confirm('Decline this job request?')) {
                                  handleJobTransition(job.id, 'REJECTED');
                                }
                              }}
                            >
                              Decline
                            </Button>
                          </>
                        )}

                        {job.status === 'ACCEPTED' && (
                          <Button
                            variant="primary"
                            size="md"
                            isLoading={actionLoading === job.id}
                            onClick={() => handleJobTransition(job.id, 'WORKER_ON_THE_WAY')}
                            icon={<Navigation className="w-4 h-4" />}
                          >
                            I Am On The Way to Customer
                          </Button>
                        )}

                        {job.status === 'WORKER_ON_THE_WAY' && (
                          <Button
                            variant="primary"
                            size="md"
                            isLoading={actionLoading === job.id}
                            onClick={() => handleJobTransition(job.id, 'ARRIVED')}
                            icon={<MapPin className="w-4 h-4" />}
                          >
                            I Have Arrived at Location
                          </Button>
                        )}

                        {job.status === 'ARRIVED' && (
                          <Button
                            variant="brand"
                            size="md"
                            isLoading={actionLoading === job.id}
                            onClick={() => handleJobTransition(job.id, 'WORK_STARTED')}
                          >
                            Start Work Now
                          </Button>
                        )}

                        {job.status === 'WORK_STARTED' && (
                          <Button
                            variant="amber"
                            size="md"
                            isLoading={actionLoading === job.id}
                            onClick={() => handleJobTransition(job.id, 'WORK_COMPLETED')}
                          >
                            Mark Work Completed (Request Payment)
                          </Button>
                        )}

                        {['WORK_COMPLETED', 'PAYMENT_PENDING'].includes(job.status) && (
                          <span className="text-xs font-semibold text-amber-700 bg-amber-50 px-3 py-1.5 rounded-xl border border-amber-200">
                            Waiting for customer to verify & complete payment (₹{job.finalAmount})...
                          </span>
                        )}

                        {['PAID', 'REVIEWED', 'COMPLETED'].includes(job.status) && (
                          <span className="text-xs font-bold text-brand-800 bg-brand-50 px-3 py-1.5 rounded-xl border border-brand-200 flex items-center gap-1.5">
                            <CheckCircle2 className="w-4 h-4 text-brand-600" />
                            Job Completed & Paid!
                          </span>
                        )}

                        <Link
                          href={`/customer/jobs/${job.id}`}
                          className="ml-auto text-xs font-bold text-brand-700 hover:underline flex items-center gap-1 py-2"
                        >
                          <span>Open Full Tracker & Chat</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB: EARNINGS */}
          {activeNav === 'earnings' && (
            <Card variant="default" padding="lg" className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-black text-slate-900">Wallet & Daily Settlements</h3>
                  <p className="text-xs text-slate-500">
                    Completed job payouts are deposited directly to your verified bank account.
                  </p>
                </div>
                <Link
                  href="/worker/earnings"
                  className="px-4 py-2 bg-navy-800 hover:bg-navy-900 text-white font-bold text-xs rounded-xl shadow-xs transition-colors"
                >
                  Full Settlements Ledger →
                </Link>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                  <span className="text-[11px] font-bold text-slate-400 block mb-1">Total Jobs Done</span>
                  <span className="text-2xl font-black text-slate-900">{completedJobs.length}</span>
                </div>
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                  <span className="text-[11px] font-bold text-slate-400 block mb-1">Gross Earnings</span>
                  <span className="text-2xl font-black text-brand-700">
                    ₹{completedJobs.reduce((acc, j) => acc + (j.finalAmount || 0), 0)}
                  </span>
                </div>
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                  <span className="text-[11px] font-bold text-slate-400 block mb-1">Bank Account</span>
                  <span className="text-xs font-mono font-bold text-slate-800 block">
                    {profile?.bankVerif?.maskedAccountNo || 'XXXXXXXX4512'}
                  </span>
                  <span className="text-[10px] text-brand-600 font-semibold block mt-0.5">Cashfree Verified</span>
                </div>
              </div>
            </Card>
          )}

          {/* TAB: VERIFICATION */}
          {activeNav === 'verification' && (
            <Card variant="default" padding="lg" className="space-y-4">
              <h3 className="text-base font-black text-slate-900">Verification Credentials</h3>
              <p className="text-xs text-slate-500">
                Official Aadhaar and Bank verification records confirmed by Cashfree.
              </p>

              <div className="space-y-3">
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-slate-800 block">UIDAI Aadhaar Verification</span>
                    <span className="text-[11px] text-slate-500">
                      Masked ID: <strong className="font-mono">{profile?.aadhaarVerif?.maskedAadhaar || 'XXXXXXXX8291'}</strong>
                    </span>
                  </div>
                  {aadhaarDone ? (
                    <Badge variant="brand">Verified</Badge>
                  ) : (
                    <Badge variant="warning">Pending</Badge>
                  )}
                </div>

                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-slate-800 block">Bank Account Verification</span>
                    <span className="text-[11px] text-slate-500">
                      Account: <strong className="font-mono">{profile?.bankVerif?.maskedAccountNo || 'XXXXXXXX4512'}</strong>
                    </span>
                  </div>
                  {bankDone ? (
                    <Badge variant="brand">Verified</Badge>
                  ) : (
                    <Badge variant="warning">Pending</Badge>
                  )}
                </div>
              </div>

              {(!aadhaarDone || !bankDone) && (
                <div className="pt-2">
                  <Link
                    href="/worker/onboarding"
                    className="inline-block px-4 py-2 bg-brand-700 hover:bg-brand-800 text-white font-bold text-xs rounded-xl shadow-xs"
                  >
                    Complete Pending Verifications →
                  </Link>
                </div>
              )}
            </Card>
          )}

          {/* TAB: PROFILE & AVAILABILITY */}
          {(activeNav === 'profile' || activeNav === 'availability' || activeNav === 'settings') && (
            <Card variant="default" padding="lg" className="space-y-4 max-w-lg">
              <h3 className="text-base font-black text-slate-900">Professional Profile Information</h3>
              <div className="space-y-3 text-xs">
                <div>
                  <span className="text-slate-400 font-bold block">Full Name</span>
                  <span className="text-slate-800 font-semibold">{workerName}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-bold block">Registered Phone</span>
                  <span className="text-slate-800 font-mono font-semibold">{session?.phone}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-bold block">Primary Profession</span>
                  <span className="text-slate-800 font-semibold">
                    {profile?.primaryCategory?.name || 'Skilled Labour'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 font-bold block">Experience</span>
                  <span className="text-slate-800">{profile?.experienceYears || 1} Years</span>
                </div>
                <div>
                  <span className="text-slate-400 font-bold block">Base Location</span>
                  <span className="text-slate-800">{profile?.city || 'Surat'}, {profile?.state || 'Gujarat'}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-bold block">Service Radius</span>
                  <span className="text-slate-800">{profile?.serviceRadiusKm || 15} km</span>
                </div>
              </div>
            </Card>
          )}

          {/* TAB: NOTIFICATIONS & DOCUMENTS */}
          {(activeNav === 'notifications' || activeNav === 'documents') && (
            <Card variant="default" padding="lg" className="text-center py-12 space-y-2">
              <CheckCircle2 className="w-8 h-8 text-brand-600 mx-auto" />
              <h3 className="text-sm font-bold text-slate-900">All Updates Synced</h3>
              <p className="text-xs text-slate-500">
                Job notifications and customer chat messages will appear in real time.
              </p>
            </Card>
          )}
        </main>
      </div>
    </div>
  );
}
