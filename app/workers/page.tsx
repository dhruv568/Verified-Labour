'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import WorkerCard, { WorkerData } from '@/components/WorkerCard';
import JobRequestModal from '@/components/JobRequestModal';
import WorkerProfileModal from '@/components/WorkerProfileModal';
import AuthModal from '@/components/AuthModal';
import { useLocation } from '@/context/LocationContext';
import { useLanguage } from '@/context/LanguageContext';
import { fetchWithTimeout } from '@/lib/fetch-utils';
import {
  Search,
  Filter,
  MapPin,
  ShieldCheck,
  AlertCircle,
  Loader2,
  Sparkles,
  Users,
  CheckCircle2,
} from 'lucide-react';
import ServiceFilterBar from '@/components/ui/ServiceFilterBar';

function FindWorkerContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialCategory = searchParams ? searchParams.get('category') || '' : '';
  const { location } = useLocation();
  const { isHindi } = useLanguage();

  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchRadius, setSearchRadius] = useState<number>(15);

  const [workers, setWorkers] = useState<WorkerData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Modals
  const [authModalOpen, setAuthModalOpen] = useState<boolean>(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register'>('login');
  const [authDefaultRole, setAuthDefaultRole] = useState<'CUSTOMER' | 'WORKER' | 'BUSINESS'>('CUSTOMER');
  const [bookingModalOpen, setBookingModalOpen] = useState<boolean>(false);
  const [selectedWorkerForBooking, setSelectedWorkerForBooking] = useState<WorkerData | null>(null);
  const [profileWorker, setProfileWorker] = useState<WorkerData | null>(null);

  // Fetch categories
  useEffect(() => {
    fetchWithTimeout('/api/categories', { timeoutMs: 3000 })
      .then((res) => res.json())
      .then((data) => {
        if (data.categories) setCategories(data.categories);
      })
      .catch(console.error);
  }, []);

  // Fetch workers
  const fetchWorkers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedCategory) params.set('category', selectedCategory);
      if (location.latitude !== null && location.latitude !== undefined) {
        params.set('lat', location.latitude.toString());
      }
      if (location.longitude !== null && location.longitude !== undefined) {
        params.set('lng', location.longitude.toString());
      }
      params.set('radius', searchRadius.toString());
      if (location.city) params.set('city', location.city);

      const res = await fetchWithTimeout(`/api/workers/search?${params.toString()}`, { timeoutMs: 5000 });
      const data = await res.json();

      if (data.success) {
        let list: WorkerData[] = data.workers || [];
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          list = list.filter(
            (w) =>
              w.fullName?.toLowerCase().includes(q) ||
              w.primaryCategory?.name?.toLowerCase().includes(q) ||
              w.bio?.toLowerCase().includes(q) ||
              w.city?.toLowerCase().includes(q)
          );
        }
        setWorkers(list);
      }
    } catch (err) {
      console.error('Failed to search workers:', err);
    } finally {
      setLoading(false);
    }
  };

  // Sync state with URL searchParams if browser back/forward navigation occurs
  useEffect(() => {
    const cat = searchParams ? searchParams.get('category') || '' : '';
    if (cat !== selectedCategory) {
      setSelectedCategory(cat);
    }
  }, [searchParams]);

  const handleSelectCategory = (slug: string) => {
    setSelectedCategory(slug);
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (slug) {
        params.set('category', slug);
      } else {
        params.delete('category');
      }
      const queryString = params.toString();
      const newUrl = queryString ? `/workers?${queryString}` : '/workers';
      router.replace(newUrl, { scroll: false });
    }
  };

  useEffect(() => {
    fetchWorkers();
  }, [selectedCategory, searchRadius, location.latitude, location.longitude, location.city]);

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
    router.push(`/customer/jobs/${jobId}`);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-[#082B66]">
      <Navbar onOpenAuth={handleOpenAuth} />

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-6">
        {/* Banner Section */}
        <div className="bg-gradient-to-r from-[#082B66] via-[#0F3880] to-[#1264D6] rounded-3xl p-6 sm:p-10 text-white shadow-xl relative overflow-hidden">
          <div className="relative z-10 max-w-3xl space-y-3">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-emerald-500/20 text-emerald-300 border border-emerald-400/40">
              <Sparkles className="w-3.5 h-3.5 text-emerald-300" />
              <span>{isHindi ? 'सत्यापित कामगार खोजें' : 'Verified Labour Search'}</span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight leading-tight font-devanagari">
              {isHindi ? 'अपने पास सत्यापित कामगार और कुशल पेशेवर बुक करें / Book Verified Workers' : 'Find & Book Verified Skilled Workers Near You / कामगार खोजें'}
            </h1>

            <p className="text-xs sm:text-sm text-blue-100 font-medium leading-relaxed font-devanagari">
              {isHindi
                ? 'आधार और बैंक खाते द्वारा सत्यापित कारीगर — 30s में बुक करें (100% Verified)'
                : '100% Aadhaar identity & Bank verified professionals available in your locality'}
            </p>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
            {/* Search Input */}
            <div className="md:col-span-8 relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="text"
                placeholder={
                  isHindi
                    ? 'इलेक्ट्रीशियन, प्लंबर, पेंटर, रसोइया, सफाईकर्मी खोजें... / Search workers...'
                    : 'Search electrician, plumber, painter, cook, cleaner...'
                }
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') fetchWorkers();
                }}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-[#1264D6] outline-none min-h-[44px]"
              />
            </div>

            {/* Radius Selector */}
            <div className="md:col-span-4 flex items-center gap-2">
              <span className="text-xs font-bold text-slate-600 shrink-0 font-devanagari">दायरा / Radius:</span>
              <div className="grid grid-cols-3 gap-1.5 w-full">
                {[5, 15, 30].map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setSearchRadius(r)}
                    className={`py-2 px-2 rounded-xl text-xs font-bold transition-all min-h-[40px] flex items-center justify-center ${
                      searchRadius === r
                        ? 'bg-[#1264D6] text-white shadow-xs'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {r} km
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Category Quick Selector Pills */}
          <ServiceFilterBar
            selectedCategory={selectedCategory}
            onSelectCategory={handleSelectCategory}
          />
        </div>

        {/* Results Header */}
        <div className="flex items-center justify-between pt-2">
          <div>
            <h2 className="text-lg font-black text-[#082B66]">
              {isHindi ? 'उपलब्ध सत्यापित कामगार' : 'Available Verified Workers'}
            </h2>
            <p className="text-xs text-slate-500">
              {isHindi ? 'स्थान:' : 'Coverage area:'}{' '}
              <strong className="text-[#1264D6]">{location.displayName || 'your location'}</strong>
            </p>
          </div>
          <span className="text-xs font-bold text-slate-600 bg-white px-3 py-1.5 rounded-xl border border-slate-200">
            {workers.length} {isHindi ? 'कामगार मिले' : 'Workers Found'}
          </span>
        </div>

        {/* Workers Grid */}
        {loading ? (
          <div className="py-20 text-center space-y-3 bg-white rounded-3xl border border-slate-200 shadow-2xs">
            <Loader2 className="w-10 h-10 animate-spin text-[#1264D6] mx-auto" />
            <p className="text-sm font-semibold text-slate-600">
              {isHindi ? 'आस-पास के सत्यापित कामगार खोजे जा रहे हैं...' : 'Locating nearby verified professionals...'}
            </p>
          </div>
        ) : workers.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
          <div className="bg-white rounded-3xl p-8 sm:p-12 text-center border border-slate-200 shadow-2xs space-y-3 max-w-lg mx-auto font-devanagari">
            <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mx-auto border border-amber-200">
              <AlertCircle className="w-6 h-6 text-amber-600" />
            </div>
            <h3 className="text-base font-bold text-slate-900">
              {selectedCategory
                ? isHindi
                  ? selectedCategory === 'OTHER' || selectedCategory === 'other' || selectedCategory === 'other-service'
                    ? 'अन्य सेवा (OTHER) श्रेणी में आपके क्षेत्र में कोई कामगार उपलब्ध नहीं है'
                    : 'इस चुनी गई श्रेणी में आपके क्षेत्र में कोई सत्यापित कामगार उपलब्ध नहीं है'
                  : selectedCategory === 'OTHER' || selectedCategory === 'other' || selectedCategory === 'other-service'
                  ? 'No verified workers found for Other Services in your area'
                  : 'No verified workers found in this category in your area'
                : isHindi
                ? 'इस दायरा में कोई सत्यापित कामगार उपलब्ध नहीं है'
                : 'No verified workers found in this immediate radius'}
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              {selectedCategory
                ? isHindi
                  ? 'कृपया सभी सेवाएं देखने के लिए फ़िल्टर हटाएं या सर्च का दायरा (Radius) बढ़ाएं।'
                  : 'Try clearing the category filter or expanding your search radius.'
                : isHindi
                ? 'कृपया सर्च का दायरा (Radius) बढ़ाकर 30 km करें या अन्य श्रेणी चुनें।'
                : 'Try expanding your search radius to 30 km or selecting a different category.'}
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
              {selectedCategory && (
                <button
                  type="button"
                  onClick={() => handleSelectCategory('')}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
                >
                  {isHindi ? 'सभी सेवाएं देखें (Clear Filter)' : 'Clear Filter / View All'}
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  setSearchRadius(30);
                  fetchWorkers();
                }}
                className="px-4 py-2 bg-[#1264D6] hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                {isHindi ? 'दायरा बढ़ाकर 30 km करें' : 'Expand Radius to 30 km'}
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Booking Modal */}
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

      <Footer />
    </div>
  );
}

export default function FindWorkerPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
          <Loader2 className="w-8 h-8 animate-spin text-[#1264D6]" />
        </div>
      }
    >
      <FindWorkerContent />
    </Suspense>
  );
}
