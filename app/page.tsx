'use client';

import React, { useState, useEffect } from 'react';
import Header from '@/components/home/Header';
import Hero from '@/components/home/Hero';
import ServiceCategories from '@/components/home/ServiceCategories';
import HowItWorks from '@/components/home/HowItWorks';
import CustomerCTA from '@/components/home/CustomerCTA';
import WorkerCTA from '@/components/home/WorkerCTA';
import TrustStats from '@/components/home/TrustStats';
import MobileHomeView from '@/components/home/MobileHomeView';
import TestimonialsSection from '@/components/home/TestimonialsSection';
import Footer from '@/components/Footer';
import AuthModal from '@/components/AuthModal';
import WorkerCard, { WorkerData } from '@/components/WorkerCard';
import JobRequestModal from '@/components/JobRequestModal';
import WorkerProfileModal from '@/components/WorkerProfileModal';
import { useLocation } from '@/context/LocationContext';
import {
  X,
  Search,
  Filter,
  AlertCircle,
  Users,
  MapPin,
  ChevronDown,
} from 'lucide-react';

interface PlatformStats {
  verifiedWorkers: number;
  jobsCompleted: number;
  averageRating: number | null;
  reviewCount: number;
  citiesCovered: number;
  cities: string[];
}

export default function HomePage() {
  const { location } = useLocation();

  // Categories & Filtering
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [platformStats, setPlatformStats] = useState<PlatformStats | null>(null);

  // Workers search state
  const [workers, setWorkers] = useState<WorkerData[]>([]);
  const [searchRadius, setSearchRadius] = useState<number>(15);
  const [minRating, setMinRating] = useState<string>('');
  const [onlyAvailable, setOnlyAvailable] = useState<boolean>(true);
  const [loadingWorkers, setLoadingWorkers] = useState<boolean>(false);
  const [workersModalOpen, setWorkersModalOpen] = useState<boolean>(false);

  // Modals
  const [authModalOpen, setAuthModalOpen] = useState<boolean>(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register'>('login');
  const [authDefaultRole, setAuthDefaultRole] = useState<'CUSTOMER' | 'WORKER' | 'BUSINESS'>('CUSTOMER');
  const [bookingModalOpen, setBookingModalOpen] = useState<boolean>(false);
  const [selectedWorkerForBooking, setSelectedWorkerForBooking] = useState<WorkerData | null>(null);
  const [profileWorker, setProfileWorker] = useState<WorkerData | null>(null);

  // Fetch real platform stats
  useEffect(() => {
    fetch('/api/stats')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.stats) {
          setPlatformStats(data.stats);
        }
      })
      .catch(console.error);
  }, []);

  // Fetch matching workers based on selected filters and location
  const fetchWorkers = async (categoryToSearch = selectedCategory) => {
    setLoadingWorkers(true);
    try {
      const params = new URLSearchParams();
      if (categoryToSearch) params.set('category', categoryToSearch);
      if (location.latitude !== null && location.latitude !== undefined) {
        params.set('lat', location.latitude.toString());
      }
      if (location.longitude !== null && location.longitude !== undefined) {
        params.set('lng', location.longitude.toString());
      }
      params.set('radius', searchRadius.toString());
      if (location.city) params.set('city', location.city);
      if (minRating) params.set('minRating', minRating);
      params.set('available', onlyAvailable ? 'true' : 'false');

      const res = await fetch(`/api/workers/search?${params.toString()}`);
      const data = await res.json();

      if (data.success) {
        setWorkers(data.workers || []);
      }
    } catch (err) {
      console.error('Failed to search workers:', err);
    } finally {
      setLoadingWorkers(false);
    }
  };

  const handleOpenAuth = (
    mode: 'login' | 'register' = 'login',
    role: 'CUSTOMER' | 'WORKER' | 'BUSINESS' = 'CUSTOMER'
  ) => {
    setAuthModalMode(mode);
    setAuthDefaultRole(role);
    setAuthModalOpen(true);
  };

  const handleStartBooking = (worker: WorkerData) => {
    setSelectedWorkerForBooking(worker);
    setBookingModalOpen(true);
  };

  const handleBookingSuccess = (jobId: string) => {
    window.location.href = `/customer/jobs/${jobId}`;
  };

  const handleSearchWorkers = (query?: string) => {
    if (query) {
      // If a search query slug was passed
      setSelectedCategory(query);
      fetchWorkers(query);
    } else {
      fetchWorkers();
    }
    setWorkersModalOpen(true);
  };

  const handleSelectCategory = (slug: string) => {
    setSelectedCategory(slug);
    fetchWorkers(slug);
    setWorkersModalOpen(true);
  };

  return (
    <div className="min-h-screen flex flex-col bg-white text-[#09265C] font-sans antialiased selection:bg-[#1264D6] selection:text-white">
      {/* 1. HEADER */}
      <Header onOpenAuth={handleOpenAuth} />

      {/* ================= DESKTOP VIEW ONLY (md and above) ================= */}
      <div className="hidden md:block">
        <Hero
          onSearchWorker={handleSearchWorkers}
          onSelectCategory={handleSelectCategory}
          onViewAllCategories={() => {
            const el = document.getElementById('services');
            if (el) el.scrollIntoView({ behavior: 'smooth' });
          }}
        />
        <ServiceCategories
          selectedCategorySlug={selectedCategory}
          onSelectCategory={handleSelectCategory}
          onViewAll={handleSearchWorkers}
        />
        <HowItWorks onFindWorker={handleSearchWorkers} />
        <section className="py-12 sm:py-16 bg-white border-b border-slate-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
              <CustomerCTA onFindWorker={handleSearchWorkers} />
              <WorkerCTA onRegisterWorker={() => handleOpenAuth('register', 'WORKER')} />
            </div>
          </div>
        </section>
        <TrustStats stats={platformStats} />
      </div>

      {/* ================= MOBILE VIEW ONLY (< md / 320px - 430px) ================= */}
      <div className="block md:hidden">
        <MobileHomeView
          selectedCategory={selectedCategory}
          onSelectCategory={handleSelectCategory}
          onSearchWorker={handleSearchWorkers}
          onOpenAuth={handleOpenAuth}
          platformStats={platformStats}
        />
      </div>

      {/* TESTIMONIALS SECTION */}
      <TestimonialsSection />

      {/* FOOTER */}
      <Footer />

      {/* ================= MODALS & ACTIVE FUNCTIONALITY ================= */}

      {/* Active Worker Search Results Modal */}
      {workersModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-navy-950/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white rounded-t-3xl sm:rounded-3xl max-w-4xl w-full max-h-[92vh] sm:max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="px-4 sm:px-6 py-3.5 sm:py-4 border-b border-slate-200 flex items-center justify-between shrink-0">
              <div>
                <h3 className="text-lg sm:text-xl font-black text-[#082B66]">
                  Nearby Verified Workers
                </h3>
                <p className="text-xs text-slate-500 mt-0.5 truncate max-w-[220px] sm:max-w-none">
                  Showing available professionals near{' '}
                  <span className="font-bold text-[#1264D6]">
                    {location.displayName || 'your location'}
                  </span>
                </p>
              </div>

              <button
                type="button"
                onClick={() => setWorkersModalOpen(false)}
                aria-label="Close"
                className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-slate-700 active:bg-slate-200 rounded-full hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Filter Bar */}
            <div className="px-4 sm:px-6 py-2.5 sm:py-3 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2.5 text-xs shrink-0">
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-600">Radius:</span>
                {[5, 15, 30].map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => {
                      setSearchRadius(r);
                      fetchWorkers();
                    }}
                    className={`min-h-[38px] px-3.5 py-1.5 rounded-xl transition-all flex items-center justify-center ${
                      searchRadius === r
                        ? 'bg-[#1264D6] text-white font-bold shadow-xs'
                        : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100 active:bg-slate-200 font-semibold'
                    }`}
                  >
                    {r} km
                  </button>
                ))}
              </div>

              {selectedCategory && (
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 bg-blue-50 text-[#1264D6] font-bold rounded-md border border-blue-200 uppercase text-[10px]">
                    Category: {selectedCategory}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedCategory('');
                      fetchWorkers('');
                    }}
                    className="min-h-[38px] px-2 text-red-600 hover:underline font-bold text-xs flex items-center"
                  >
                    Clear Filter
                  </button>
                </div>
              )}
            </div>

            {/* Workers Grid Content */}
            <div className="p-3.5 sm:p-6 overflow-y-auto flex-1">
              {loadingWorkers ? (
                <div className="py-20 text-center space-y-3">
                  <div className="w-10 h-10 border-4 border-[#1264D6] border-t-transparent rounded-full animate-spin mx-auto" />
                  <p className="text-sm font-semibold text-slate-600">
                    Locating nearby verified professionals...
                  </p>
                </div>
              ) : workers.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 sm:gap-4">
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
                <div className="py-16 text-center space-y-3 max-w-md mx-auto">
                  <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mx-auto border border-amber-200">
                    <AlertCircle className="w-6 h-6" />
                  </div>
                  <h4 className="text-base font-bold text-slate-900">
                    No verified workers found in this immediate radius
                  </h4>
                  <p className="text-xs text-slate-500">
                    Try expanding your search radius to 30 km or browsing all available categories.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setSearchRadius(30);
                      setSelectedCategory('');
                      fetchWorkers('');
                    }}
                    className="mt-2 px-5 py-2.5 bg-[#1264D6] text-white font-bold text-xs rounded-xl shadow-xs hover:bg-blue-700 transition-colors"
                  >
                    Expand Radius to 30 km
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Authentication Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        initialMode={authModalMode}
        defaultRole={authDefaultRole}
        onSuccess={() => {
          fetchWorkers();
        }}
      />

      {/* Job Request Booking Modal */}
      <JobRequestModal
        isOpen={bookingModalOpen}
        onClose={() => setBookingModalOpen(false)}
        worker={selectedWorkerForBooking}
        selectedLocation={location}
        onSuccess={handleBookingSuccess}
        onRequireAuth={() => {
          setBookingModalOpen(false);
          handleOpenAuth('register', 'CUSTOMER');
        }}
      />

      {/* Worker Public Profile Modal */}
      <WorkerProfileModal
        isOpen={Boolean(profileWorker)}
        onClose={() => setProfileWorker(null)}
        worker={profileWorker}
        onRequestBooking={handleStartBooking}
      />
    </div>
  );
}
