'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import WorkerCard, { WorkerData } from '@/components/WorkerCard';
import JobRequestModal from '@/components/JobRequestModal';
import WorkerProfileModal from '@/components/WorkerProfileModal';
import { useLocation } from '@/context/LocationContext';
import {
  LayoutDashboard,
  Search,
  Calendar,
  Clock,
  MapPin,
  CreditCard,
  Star,
  Bell,
  User,
  Settings,
  ShieldCheck,
  ChevronRight,
  Plus,
  Loader2,
  CheckCircle2,
  Filter,
  Phone,
  Briefcase,
  AlertCircle,
  Menu,
  X,
} from 'lucide-react';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import StatusBadge from '@/components/ui/StatusBadge';
import VoiceAudioPlayer from '@/components/VoiceAudioPlayer';
import EmptyState from '@/components/ui/EmptyState';

type NavTab =
  | 'dashboard'
  | 'find_workers'
  | 'my_bookings'
  | 'active_booking'
  | 'booking_history'
  | 'payments'
  | 'reviews'
  | 'notifications'
  | 'profile'
  | 'settings';

export default function CustomerDashboardPage() {
  const router = useRouter();
  const { location } = useLocation();

  const [activeNav, setActiveNav] = useState<NavTab>('dashboard');
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const [session, setSession] = useState<any>(null);
  const [loadingSession, setLoadingSession] = useState(true);

  // Real backend jobs
  const [jobs, setJobs] = useState<any[]>([]);
  const [loadingJobs, setLoadingJobs] = useState(true);

  // Search & Categories & Workers
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [workers, setWorkers] = useState<WorkerData[]>([]);
  const [loadingWorkers, setLoadingWorkers] = useState(false);

  // Booking modal & Worker Profile modal
  const [selectedWorkerForBooking, setSelectedWorkerForBooking] = useState<WorkerData | null>(null);
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [profileWorker, setProfileWorker] = useState<WorkerData | null>(null);

  // Profile edit & deletion states
  const [editProfileOpen, setEditProfileOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteNoticeShown, setDeleteNoticeShown] = useState(false);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [updatingProfile, setUpdatingProfile] = useState(false);

  // Greeting time
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
          if (data.user.role === 'WORKER') {
            router.push('/worker/dashboard');
            return;
          }
          setSession(data.user);
          setEditName(data.user.customerProfile?.fullName || '');
          setEditEmail(data.user.email || '');
          setDeleteNoticeShown(data.user.status === 'DELETION_PENDING');
        } else {
          router.replace('/logout?reason=unauthorized');
        }
      })
      .catch(() => router.replace('/logout?reason=unauthorized'))
      .finally(() => setLoadingSession(false));
  }, [router]);

  // 2. Fetch Categories
  useEffect(() => {
    fetch('/api/categories')
      .then((res) => res.json())
      .then((data) => {
        if (data.categories) setCategories(data.categories);
      })
      .catch(console.error);
  }, []);

  // 3. Fetch Real Jobs from /api/jobs
  const fetchJobs = async () => {
    setLoadingJobs(true);
    try {
      const res = await fetch('/api/jobs');
      const data = await res.json();
      if (data.success) {
        setJobs(data.jobs || []);
      }
    } catch (err) {
      console.error('Error fetching jobs:', err);
    } finally {
      setLoadingJobs(false);
    }
  };

  useEffect(() => {
    if (session) {
      fetchJobs();
    }
  }, [session]);

  // 4. Fetch Nearby Workers
  const fetchNearbyWorkers = async () => {
    setLoadingWorkers(true);
    try {
      const params = new URLSearchParams();
      if (selectedCategory) params.set('category', selectedCategory);
      if (location.latitude) params.set('lat', location.latitude.toString());
      if (location.longitude) params.set('lng', location.longitude.toString());
      if (location.city) params.set('city', location.city);
      params.set('radius', '25');

      const res = await fetch(`/api/workers/search?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        let list = data.workers || [];
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          list = list.filter(
            (w: any) =>
              w.fullName?.toLowerCase().includes(q) ||
              w.primaryCategory?.name?.toLowerCase().includes(q) ||
              w.bio?.toLowerCase().includes(q)
          );
        }
        setWorkers(list);
      }
    } catch (err) {
      console.error('Error fetching workers:', err);
    } finally {
      setLoadingWorkers(false);
    }
  };

  useEffect(() => {
    fetchNearbyWorkers();
  }, [selectedCategory, location.city, location.latitude, location.longitude]);

  const handleStartBooking = (worker: WorkerData) => {
    setSelectedWorkerForBooking(worker);
    setBookingModalOpen(true);
  };

  const handleBookingSuccess = (jobId: string) => {
    fetchJobs();
    router.push(`/customer/jobs/${jobId}`);
  };

  if (loadingSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-8 h-8 animate-spin text-brand-700" />
      </div>
    );
  }

  const customerName = session?.customerProfile?.fullName || 'Customer';
  const activeJobs = jobs.filter((j) =>
    ['REQUESTED', 'ACCEPTED', 'SCHEDULED', 'WORKER_ON_THE_WAY', 'ARRIVED', 'WORK_STARTED'].includes(j.status)
  );
  const completedJobs = jobs.filter((j) => ['COMPLETED', 'PAID', 'REVIEWED'].includes(j.status));

  const navItems = [
    { id: 'dashboard' as NavTab, label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: 'find_workers' as NavTab, label: 'Find Workers', icon: <Search className="w-4 h-4" /> },
    { id: 'my_bookings' as NavTab, label: 'My Bookings', icon: <Calendar className="w-4 h-4" />, count: jobs.length },
    { id: 'active_booking' as NavTab, label: 'Active Booking', icon: <Clock className="w-4 h-4" />, count: activeJobs.length },
    { id: 'booking_history' as NavTab, label: 'Booking History', icon: <Briefcase className="w-4 h-4" />, count: completedJobs.length },
    { id: 'payments' as NavTab, label: 'Payments', icon: <CreditCard className="w-4 h-4" /> },
    { id: 'reviews' as NavTab, label: 'Reviews', icon: <Star className="w-4 h-4" /> },
    { id: 'notifications' as NavTab, label: 'Notifications', icon: <Bell className="w-4 h-4" /> },
    { id: 'profile' as NavTab, label: 'Profile', icon: <User className="w-4 h-4" /> },
    { id: 'settings' as NavTab, label: 'Settings', icon: <Settings className="w-4 h-4" /> },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full flex-1 flex flex-col lg:flex-row gap-6">
        {/* Mobile Navigation Header & Horizontal Tab Bar */}
        <div className="lg:hidden space-y-2">
          <div className="flex items-center justify-between bg-white p-3 rounded-2xl border border-slate-200">
            <div className="flex items-center gap-2">
              <span className="font-bold text-xs text-slate-800">Customer Dashboard</span>
            </div>
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
          className={`lg:block w-full lg:w-64 shrink-0 space-y-2 ${
            mobileSidebarOpen ? 'block' : 'hidden lg:block'
          }`}
        >
          <Card variant="default" padding="sm" className="space-y-1">
            <div className="px-3 py-2.5 border-b border-slate-100 mb-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Customer Cockpit
              </span>
              <p className="text-xs font-black text-slate-900 truncate mt-0.5">{customerName}</p>
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
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
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

          {/* Guarantee Banner */}
          <div className="bg-navy-900 rounded-2xl p-4 text-white space-y-2 border border-navy-800 hidden lg:block">
            <div className="flex items-center gap-1.5 text-brand-400">
              <ShieldCheck className="w-4 h-4" />
              <span className="text-[11px] font-bold uppercase tracking-wider">Verified Guarantee</span>
            </div>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              Every worker has verified Aadhaar and bank details. Pay safely only after work completion.
            </p>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 space-y-6 min-w-0">
          {/* Top Welcome & Location Header */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <span className="text-xs font-bold text-brand-700 uppercase tracking-wider">
                Verified Labour Marketplace
              </span>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">
                {greeting}, {customerName}
              </h1>
              <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-brand-600 shrink-0" />
                <span>
                  Location: <strong className="text-slate-800">{location.displayName || 'Current Location'}</strong>
                </span>
              </p>
            </div>

            <Button
              variant="brand"
              size="md"
              onClick={() => setActiveNav('find_workers')}
              icon={<Plus className="w-4 h-4" />}
              className="font-devanagari"
            >
              30s में बुक करें / Book Worker
            </Button>
          </div>

          {/* TAB 1: DASHBOARD OVERVIEW */}
          {(activeNav === 'dashboard' || activeNav === 'find_workers') && (
            <>
              {/* Search & Popular Services */}
              <Card variant="default" padding="md" className="space-y-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 font-devanagari">आपको किस सेवा की आवश्यकता है? / Select Service</h3>
                  <div className="flex gap-2 mt-2">
                    <div className="relative flex-1">
                      <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                      <input
                        type="text"
                        placeholder="इलेक्ट्रीशियन, प्लंबर, पेंटर, सफाईकर्मी खोजें... / Search service..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') fetchNearbyWorkers();
                        }}
                        className="w-full pl-9 pr-3.5 py-2.5 text-base sm:text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-brand-500 outline-none min-h-[44px]"
                      />
                    </div>
                    <Button variant="primary" size="md" onClick={fetchNearbyWorkers} className="min-h-[44px] font-devanagari">
                      खोजें / Search
                    </Button>
                  </div>
                </div>

                {/* Popular Services Quick Pills */}
                <div>
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2 font-devanagari">
                    लोकप्रिय सेवाएं / Popular Services
                  </span>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => setSelectedCategory('')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border font-devanagari ${
                        !selectedCategory
                          ? 'bg-brand-700 text-white border-brand-700 shadow-xs'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      सभी सेवाएं / All Services
                    </button>
                    {categories.slice(0, 7).map((c) => (
                      <button
                        key={c.id}
                        onClick={() => setSelectedCategory(selectedCategory === c.slug ? '' : c.slug)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                          selectedCategory === c.slug
                            ? 'bg-brand-700 text-white border-brand-700 shadow-xs'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        {c.name}
                      </button>
                    ))}
                  </div>
                </div>
              </Card>

              {/* Active Bookings Banner if any exist */}
              {activeJobs.length > 0 && activeNav === 'dashboard' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-black text-slate-900 flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-brand-600" />
                      <span>Active Bookings in Progress</span>
                    </h3>
                    <button
                      onClick={() => setActiveNav('active_booking')}
                      className="text-xs font-bold text-brand-700 hover:underline"
                    >
                      View All ({activeJobs.length}) →
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {activeJobs.slice(0, 2).map((job) => (
                      <Card key={job.id} variant="default" padding="md" className="space-y-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <StatusBadge status={job.status} size="sm" />
                            <h4 className="font-bold text-slate-900 text-sm mt-1.5">
                              {job.service?.name || 'On-Demand Service'}
                            </h4>
                            <p className="text-xs text-slate-500">Worker: {job.worker?.fullName}</p>
                          </div>
                          <span className="text-base font-black text-navy-900">₹{job.finalAmount}</span>
                        </div>

                        <div className="text-xs text-slate-600 space-y-1 pt-2 border-t border-slate-100">
                          <p className="flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5 text-brand-600 shrink-0" />
                            <span className="truncate">{job.jobRequest?.formattedAddress}</span>
                          </p>
                        </div>

                        <Link
                          href={`/customer/jobs/${job.id}`}
                          className="block w-full py-2 bg-navy-800 hover:bg-navy-900 text-white font-bold text-xs text-center rounded-xl transition-colors shadow-xs"
                        >
                          Track Job Status & Chat →
                        </Link>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {/* Nearby Verified Workers */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-black text-slate-900">Nearby Verified Workers</h3>
                    <p className="text-xs text-slate-500">
                      Cashfree Aadhaar & Bank verified professionals in your coverage area.
                    </p>
                  </div>
                  <span className="text-xs font-bold text-slate-500">{workers.length} Available</span>
                </div>

                {loadingWorkers ? (
                  <div className="py-16 text-center">
                    <Loader2 className="w-8 h-8 animate-spin text-brand-700 mx-auto mb-2" />
                    <p className="text-xs text-slate-500">Finding verified workers nearby...</p>
                  </div>
                ) : workers.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {workers.map((w) => (
                      <WorkerCard
                        key={w.id}
                        worker={w}
                        onRequestBooking={handleStartBooking}
                        onViewProfile={(worker) => setProfileWorker(worker)}
                      />
                    ))}
                  </div>
                ) : (
                  <EmptyState
                    title="No workers found matching this filter"
                    description="Try selecting another category, expanding your location, or clearing search filters."
                    actionLabel="View All Services"
                    onAction={() => {
                      setSelectedCategory('');
                      setSearchQuery('');
                      fetchNearbyWorkers();
                    }}
                  />
                )}
              </div>
            </>
          )}

          {/* TAB 2: MY BOOKINGS / ACTIVE BOOKING / HISTORY */}
          {(activeNav === 'my_bookings' || activeNav === 'active_booking' || activeNav === 'booking_history') && (
            <div className="space-y-4">
              <div>
                <h3 className="text-base font-black text-slate-900">
                  {activeNav === 'active_booking'
                    ? 'Active Bookings'
                    : activeNav === 'booking_history'
                    ? 'Past Completed Bookings'
                    : 'All My Bookings'}
                </h3>
                <p className="text-xs text-slate-500">
                  Track real-time service requests, payment settlements, and completed invoices.
                </p>
              </div>

              {loadingJobs ? (
                <div className="py-16 text-center">
                  <Loader2 className="w-8 h-8 animate-spin text-brand-700 mx-auto mb-2" />
                  <p className="text-xs text-slate-500">Loading your service requests...</p>
                </div>
              ) : jobs.length === 0 ? (
                <EmptyState
                  title="No bookings yet"
                  description="You have not requested any service workers yet. Book a trusted, verified professional in minutes."
                  actionLabel="Find Nearby Workers"
                  onAction={() => setActiveNav('find_workers')}
                />
              ) : (
                <div className="space-y-3">
                  {(activeNav === 'active_booking'
                    ? activeJobs
                    : activeNav === 'booking_history'
                    ? completedJobs
                    : jobs
                  ).map((job) => (
                    <Card key={job.id} variant="default" padding="md" className="space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-mono font-bold text-slate-500">
                              #{job.id.slice(0, 8).toUpperCase()}
                            </span>
                            <StatusBadge status={job.status} size="sm" />
                          </div>
                          <h4 className="font-bold text-slate-900 text-base mt-1">
                            {job.service?.name || 'Home Service'}
                          </h4>
                          <p className="text-xs text-slate-500">
                            Professional: <strong className="text-slate-800">{job.worker?.fullName}</strong> ({job.worker?.primaryCategory?.name || 'Skilled Labour'})
                          </p>
                        </div>

                        <div className="text-left sm:text-right">
                          <span className="text-xs text-slate-400 block">Amount</span>
                          <span className="text-xl font-black text-navy-900">₹{job.finalAmount}</span>
                        </div>
                      </div>

                      {job.jobRequest?.voiceNoteUrl && (
                        <div className="pt-2 border-t border-slate-100">
                          <p className="text-[11px] font-bold text-slate-700 mb-1">Voice Note Requirement:</p>
                          <VoiceAudioPlayer
                            src={job.jobRequest.voiceNoteUrl}
                            duration={job.jobRequest.voiceNoteDuration}
                            label="Your Voice Note"
                          />
                        </div>
                      )}

                      <div className="text-xs text-slate-600 grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-slate-100">
                        <p className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-brand-600 shrink-0" />
                          <span className="truncate">{job.jobRequest?.formattedAddress}</span>
                        </p>
                        <p className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>
                            {job.jobRequest?.preferredDate} • {job.jobRequest?.preferredTime}
                          </span>
                        </p>
                      </div>

                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-100">
                        {job.review ? (
                          <span className="text-xs font-bold text-amber-600 flex items-center gap-1">
                            <Star className="w-3.5 h-3.5 fill-amber-400" />
                            <span>Rated {job.review.rating}.0</span>
                          </span>
                        ) : (
                          <span className="text-xs text-slate-400">
                            {['PAID', 'COMPLETED'].includes(job.status)
                              ? 'Awaiting your review'
                              : 'Escrow protected'}
                          </span>
                        )}

                        <Link
                          href={`/customer/jobs/${job.id}`}
                          className="w-full sm:w-auto px-4 py-2.5 min-h-[44px] flex items-center justify-center bg-navy-800 hover:bg-navy-900 active:bg-navy-950 text-white font-bold text-xs rounded-xl transition-colors shadow-xs text-center"
                        >
                          View Details & Tracking →
                        </Link>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: PAYMENTS */}
          {activeNav === 'payments' && (
            <Card variant="default" padding="lg" className="space-y-4">
              <h3 className="text-base font-black text-slate-900">Payment & Invoices</h3>
              <p className="text-xs text-slate-500">
                Secure payments processed through Cashfree Payments. You only pay when work is verified and marked complete.
              </p>

              <div className="p-4 bg-brand-50 border border-brand-200 rounded-2xl text-xs text-brand-900 space-y-1">
                <span className="font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4 text-brand-600" />
                  No Upfront Charges Required
                </span>
                <p className="text-[11px] text-brand-700">
                  Workers come to your location first. Pay directly via UPI, Card, or Netbanking after the job is finished.
                </p>
              </div>

              {completedJobs.length > 0 ? (
                <div className="space-y-2 pt-2">
                  <span className="text-xs font-bold text-slate-700 block">Recent Paid Invoices</span>
                  {completedJobs.map((j) => (
                    <div
                      key={j.id}
                      className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs"
                    >
                      <div>
                        <span className="font-bold text-slate-800 block">{j.service?.name}</span>
                        <span className="text-[11px] text-slate-400">Worker: {j.worker?.fullName}</span>
                      </div>
                      <span className="font-mono font-black text-slate-900">₹{j.finalAmount} Paid</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400 py-6 text-center">No paid transactions on record.</p>
              )}
            </Card>
          )}

          {/* TAB 4: PROFILE & SETTINGS */}
          {/* TAB 4: PROFILE & SETTINGS */}
          {(activeNav === 'profile' || activeNav === 'settings') && (
            <div className="space-y-6 max-w-lg">
              <Card variant="default" padding="lg" className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="text-base font-black text-slate-900">Account Profile</h3>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setEditProfileOpen(true)}
                      className="px-3.5 py-1.5 bg-[#1264D6] hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition-all shadow-xs"
                    >
                      Edit Profile
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteModalOpen(true)}
                      className="px-3.5 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 font-bold text-xs rounded-xl transition-all"
                    >
                      Delete Account
                    </button>
                  </div>
                </div>

                {deleteNoticeShown && (
                  <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-900 space-y-1">
                    <div className="flex items-center gap-1.5 font-bold">
                      <AlertCircle className="w-4 h-4 text-amber-600" />
                      <span>Deletion Request Pending</span>
                    </div>
                    <p className="text-[11px] text-amber-800">
                      Your profile deletion request has been received. Your profile will be deleted within 15 days.
                    </p>
                  </div>
                )}

                <div className="space-y-3.5 text-xs">
                  <div>
                    <span className="text-slate-400 font-bold block">Full Name</span>
                    <span className="text-slate-900 font-black text-sm">{customerName}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-bold block">Mobile Phone (Verified)</span>
                    <span className="text-slate-800 font-mono font-semibold">{session?.phone}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-bold block">Email Address</span>
                    <span className="text-slate-800 font-medium">{session?.email || 'Not provided'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-bold block">Account Status</span>
                    <StatusBadge status={deleteNoticeShown ? 'DELETION_PENDING' : 'ACTIVE'} size="sm" />
                  </div>
                  <div>
                    <span className="text-slate-400 font-bold block">Current Location</span>
                    <span className="text-slate-800">{location.displayName || 'Not Set'}</span>
                  </div>
                </div>
              </Card>

              {/* Edit Profile Modal */}
              {editProfileOpen && (
                <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
                  <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <h3 className="text-base font-black text-slate-900">Edit Profile</h3>
                      <button
                        type="button"
                        onClick={() => setEditProfileOpen(false)}
                        className="text-slate-400 hover:text-slate-700"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>

                    <form
                      onSubmit={async (e) => {
                        e.preventDefault();
                        setUpdatingProfile(true);
                        try {
                          const res = await fetch('/api/user/profile', {
                            method: 'PATCH',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ fullName: editName, email: editEmail }),
                          });
                          const data = await res.json();
                          if (!res.ok || !data.success) {
                            alert(data.error || 'Failed to update profile');
                            return;
                          }
                          alert('Profile updated successfully!');
                          setEditProfileOpen(false);
                          window.location.reload();
                        } catch (err: any) {
                          alert('Error updating profile: ' + err.message);
                        } finally {
                          setUpdatingProfile(false);
                        }
                      }}
                      className="space-y-3.5 text-xs"
                    >
                      <div>
                        <label className="block font-bold text-slate-700 mb-1">Full Legal Name</label>
                        <input
                          type="text"
                          required
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 outline-none focus:border-[#1264D6] min-h-[44px]"
                        />
                      </div>

                      <div>
                        <label className="block font-bold text-slate-700 mb-1">Email Address</label>
                        <input
                          type="email"
                          value={editEmail}
                          onChange={(e) => setEditEmail(e.target.value)}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 outline-none focus:border-[#1264D6] min-h-[44px]"
                        />
                      </div>

                      <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-[11px] text-slate-500">
                        🔒 Phone number and security verifications are protected and require explicit verification to change.
                      </div>

                      <div className="flex gap-2.5 pt-2">
                        <button
                          type="button"
                          onClick={() => setEditProfileOpen(false)}
                          className="flex-1 py-2.5 border border-slate-300 text-slate-700 font-bold rounded-xl active:bg-slate-100"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={updatingProfile}
                          className="flex-1 py-2.5 bg-[#1264D6] hover:bg-blue-700 text-white font-bold rounded-xl shadow-xs disabled:opacity-50"
                        >
                          {updatingProfile ? 'Saving...' : 'Save Changes'}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}

              {/* Delete Account Modal */}
              {deleteModalOpen && (
                <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
                  <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <h3 className="text-base font-black text-red-600 flex items-center gap-1.5">
                        <AlertCircle className="w-5 h-5 text-red-600" />
                        <span>Delete your profile?</span>
                      </h3>
                      <button
                        type="button"
                        onClick={() => setDeleteModalOpen(false)}
                        className="text-slate-400 hover:text-slate-700"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>

                    <div className="space-y-3 text-xs text-slate-600 leading-relaxed">
                      <p className="font-semibold text-slate-800">
                        Are you sure you want to request account deletion?
                      </p>
                      <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-2xl text-amber-900 font-medium space-y-1">
                        <p className="font-bold text-amber-950">15-Day Scheduled Deletion:</p>
                        <p>
                          Your profile deletion request has been received. Your profile will be deleted within 15 days.
                        </p>
                      </div>
                      <p className="text-[11px] text-slate-400">
                        During this 15-day period, active job history, audit records, and payments are preserved according to legal data retention policies. You can cancel this deletion request anytime before completion.
                      </p>
                    </div>

                    <div className="flex gap-2.5 pt-2">
                      <button
                        type="button"
                        onClick={() => setDeleteModalOpen(false)}
                        className="flex-1 py-2.5 border border-slate-300 text-slate-700 font-bold rounded-xl active:bg-slate-100"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={async () => {
                          try {
                            const res = await fetch('/api/user/delete-account', {
                              method: 'POST',
                            });
                            const data = await res.json();
                            if (data.success) {
                              setDeleteNoticeShown(true);
                              alert('Your profile deletion request has been received. Your profile will be deleted within 15 days.');
                              setDeleteModalOpen(false);
                            }
                          } catch (err: any) {
                            alert('Failed to request deletion: ' + err.message);
                          }
                        }}
                        className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl shadow-xs"
                      >
                        Confirm Deletion
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 5: NOTIFICATIONS & REVIEWS */}
          {(activeNav === 'notifications' || activeNav === 'reviews') && (
            <Card variant="default" padding="lg" className="text-center py-12 space-y-2">
              <CheckCircle2 className="w-8 h-8 text-brand-600 mx-auto" />
              <h3 className="text-sm font-bold text-slate-900">All Caught Up!</h3>
              <p className="text-xs text-slate-500">
                Job updates, worker arrivals, and ratings will be delivered here in real time.
              </p>
            </Card>
          )}
        </main>
      </div>

      {/* Booking Modal */}
      <JobRequestModal
        isOpen={bookingModalOpen}
        onClose={() => setBookingModalOpen(false)}
        worker={selectedWorkerForBooking}
        selectedLocation={location}
        onSuccess={handleBookingSuccess}
        onRequireAuth={() => {
          setBookingModalOpen(false);
        }}
      />

      {/* Worker Profile Modal */}
      <WorkerProfileModal
        isOpen={Boolean(profileWorker)}
        onClose={() => setProfileWorker(null)}
        worker={profileWorker}
        onRequestBooking={handleStartBooking}
      />
    </div>
  );
}
