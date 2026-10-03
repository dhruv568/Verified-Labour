'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { X, Calendar, Clock, MapPin, AlertCircle, ShieldCheck, RefreshCw } from 'lucide-react';
import { WorkerData } from './WorkerCard';
import { LocationData } from '@/context/LocationContext';
import VoiceNoteRecorder from './VoiceNoteRecorder';
import { fetchWithTimeout } from '@/lib/fetch-utils';
import ServiceSearchableSelect, { ServiceItem } from '@/components/ui/ServiceSearchableSelect';
import { useLanguage } from '@/context/LanguageContext';

interface JobRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  worker: WorkerData | null;
  selectedLocation: LocationData;
  onSuccess: (jobId: string) => void;
  onRequireAuth: () => void;
}

const TRADE_TO_CATEGORY_SLUG: Record<string, string> = {
  electrician: 'electrical',
  electrical: 'electrical',
  plumber: 'plumbing',
  plumbing: 'plumbing',
  carpenter: 'carpenter',
  painter: 'painting',
  painting: 'painting',
  cook: 'cook',
  cleaner: 'cleaning',
  cleaning: 'cleaning',
  housekeeper: 'cleaning',
  driver: 'driver',
  mason: 'construction',
  construction: 'construction',
  mechanic: 'mechanic',
  'ac technician': 'electrical',
  'ac-technician': 'electrical',
  'ac repair': 'electrical',
  ac: 'electrical',
  watchman: 'watchman',
  'security guard': 'watchman',
  'office boy': 'office-boy',
  washerman: 'washerman',
};

function findCategoryForWorker(w: WorkerData | null, catList: any[]): any | null {
  if (!w || !catList || catList.length === 0) return null;

  const pCat = w.primaryCategory;
  const targetId = typeof pCat === 'object' ? (pCat as any)?.id : (w as any)?.primaryCategoryId || null;
  const targetSlug = typeof pCat === 'object' ? pCat?.slug : (typeof pCat === 'string' ? pCat : null);
  const targetName = typeof pCat === 'object' ? pCat?.name : (typeof pCat === 'string' ? pCat : null);

  // 1. Direct ID match
  if (targetId) {
    const match = catList.find((c) => c.id === targetId);
    if (match) return match;
  }

  // 2. Direct Slug match
  if (targetSlug) {
    const match = catList.find((c) => c.slug?.toLowerCase() === String(targetSlug).toLowerCase());
    if (match) return match;
  }

  // 3. Direct Name match
  if (targetName) {
    const match = catList.find((c) => c.name?.toLowerCase() === String(targetName).toLowerCase());
    if (match) return match;
  }

  // 4. Trade alias lookup (e.g. Electrician -> Electrical, AC Technician -> Electrical/AC)
  const tradeTerm = (targetName || targetSlug || w.bio || '').toLowerCase();
  for (const [trade, catSlug] of Object.entries(TRADE_TO_CATEGORY_SLUG)) {
    if (tradeTerm.includes(trade)) {
      const match = catList.find((c) => c.slug?.toLowerCase() === catSlug || c.name?.toLowerCase().includes(trade));
      if (match) return match;
    }
  }

  // 5. Skill category match
  if (w.skills && Array.isArray(w.skills) && w.skills.length > 0) {
    for (const skill of w.skills) {
      const sCatId = skill.categoryId || skill.category?.id;
      const sCatSlug = skill.category?.slug;
      const sCatName = skill.category?.name;

      const match = catList.find(
        (c) =>
          (sCatId && c.id === sCatId) ||
          (sCatSlug && c.slug?.toLowerCase() === String(sCatSlug).toLowerCase()) ||
          (sCatName && c.name?.toLowerCase() === String(sCatName).toLowerCase())
      );
      if (match) return match;
    }
  }

  return null;
}

export default function JobRequestModal({
  isOpen,
  onClose,
  worker,
  selectedLocation,
  onSuccess,
  onRequireAuth,
}: JobRequestModalProps) {
  const { isHindi, t } = useLanguage();
  const [categories, setCategories] = useState<any[]>([]);
  const [workerCategory, setWorkerCategory] = useState<any | null>(null);
  const [allServices, setAllServices] = useState<ServiceItem[]>([]);
  const [selectedServiceId, setSelectedServiceId] = useState<string>('');
  const [loadingServices, setLoadingServices] = useState<boolean>(true);
  const [categoriesError, setCategoriesError] = useState<string | null>(null);

  const [description, setDescription] = useState('');
  const [voiceNoteBlob, setVoiceNoteBlob] = useState<Blob | null>(null);
  const [voiceNoteDuration, setVoiceNoteDuration] = useState<number>(0);
  const [voiceNotePreviewUrl, setVoiceNotePreviewUrl] = useState<string | null>(null);

  const [address, setAddress] = useState(
    selectedLocation?.formattedAddress || selectedLocation?.displayName || ''
  );
  const [preferredDate, setPreferredDate] = useState(new Date().toISOString().split('T')[0]);
  const [preferredTime, setPreferredTime] = useState('10:00 AM');
  const [urgency, setUrgency] = useState<'IMMEDIATE' | 'SCHEDULED'>('IMMEDIATE');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (selectedLocation) {
      setAddress(selectedLocation.formattedAddress || selectedLocation.displayName || '');
    }
  }, [selectedLocation]);

  useEffect(() => {
    if (!isOpen) {
      setDescription('');
      if (voiceNotePreviewUrl) {
        URL.revokeObjectURL(voiceNotePreviewUrl);
      }
      setVoiceNoteBlob(null);
      setVoiceNoteDuration(0);
      setVoiceNotePreviewUrl(null);
      setError(null);
    }
  }, [isOpen]);

  // Fetch categories & services from API and determine matching category for selected worker
  const fetchCategoriesAndServices = async () => {
    setLoadingServices(true);
    setCategoriesError(null);
    try {
      const [catRes, svcRes] = await Promise.all([
        fetchWithTimeout('/api/categories', { timeoutMs: 4000 }),
        fetchWithTimeout('/api/services', { timeoutMs: 4000 }),
      ]);

      const catData = await catRes.json();
      const svcData = await svcRes.json();

      let catList: any[] = [];
      if (catData.success && Array.isArray(catData.categories)) {
        catList = catData.categories;
        setCategories(catList);
      }

      let svcList: ServiceItem[] = [];
      if (svcData.success && Array.isArray(svcData.services)) {
        svcList = svcData.services;
      } else if (catList.length > 0) {
        const extracted: ServiceItem[] = [];
        catList.forEach((c: any) => {
          if (c.services && Array.isArray(c.services)) {
            c.services.forEach((s: any) => {
              extracted.push({ ...s, categoryId: s.categoryId || c.id, category: c });
            });
          }
        });
        svcList = extracted;
      }

      const seenIds = new Set<string>();
      const uniqueServices: ServiceItem[] = [];
      for (const s of svcList) {
        if (s && s.id && !seenIds.has(s.id)) {
          seenIds.add(s.id);
          uniqueServices.push(s);
        }
      }

      setAllServices(uniqueServices);

      // Match worker category using IDs, slugs, names, trade aliases, and skills
      const matchedCat = findCategoryForWorker(worker, catList);
      setWorkerCategory(matchedCat);
    } catch (err: any) {
      console.error('Error loading services:', err);
      setCategoriesError(t.unableToLoadServices);
    } finally {
      setLoadingServices(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      setError(null);
      fetchCategoriesAndServices();
    }

    const handleUpdate = () => {
      if (isOpen) {
        fetchCategoriesAndServices();
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('categories-updated', handleUpdate);
      window.addEventListener('site-content-updated', handleUpdate);
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('categories-updated', handleUpdate);
        window.removeEventListener('site-content-updated', handleUpdate);
      }
    };
  }, [isOpen, worker]);

  // Compute available services strictly provided by the selected worker
  const availableServices = useMemo(() => {
    if (!worker || allServices.length === 0) return [];

    const workerCategoryIds = new Set<string>();
    const workerServiceIds = new Set<string>();

    const pCatId =
      typeof worker.primaryCategory === 'object'
        ? worker.primaryCategory?.id
        : worker.primaryCategoryId;
    if (pCatId) workerCategoryIds.add(pCatId);

    if (workerCategory?.id) workerCategoryIds.add(workerCategory.id);

    const matchedCat = findCategoryForWorker(worker, categories);
    if (matchedCat?.id) workerCategoryIds.add(matchedCat.id);

    if (worker.skills && Array.isArray(worker.skills)) {
      for (const skill of worker.skills) {
        const cId = skill.categoryId || skill.category?.id;
        if (cId) workerCategoryIds.add(cId);
        const sId = skill.serviceId || skill.service?.id;
        if (sId) workerServiceIds.add(sId);
      }
    }

    let filtered = allServices.filter(
      (s) =>
        (s.categoryId && workerCategoryIds.has(s.categoryId)) ||
        workerServiceIds.has(s.id)
    );

    // Fallback 1: Match by trade slug or name (e.g. electrician -> electrical, plumber -> plumbing)
    if (filtered.length === 0 && worker) {
      const rawCatTerm = (
        worker.primaryCategory?.slug ||
        worker.primaryCategory?.name ||
        workerCategory?.slug ||
        workerCategory?.name ||
        ''
      ).toLowerCase();

      const TRADE_SLUG_MAP: Record<string, string> = {
        electrician: 'electrical',
        electrical: 'electrical',
        plumber: 'plumbing',
        plumbing: 'plumbing',
        carpenter: 'carpenter',
        painter: 'painting',
        painting: 'painting',
        cook: 'cook',
        cleaner: 'cleaning',
        cleaning: 'cleaning',
        driver: 'driver',
        mason: 'construction',
        construction: 'construction',
        mechanic: 'mechanic',
        'ac-technician': 'electrical',
        'ac technician': 'electrical',
        watchman: 'watchman',
        'office-boy': 'office-boy',
        washerman: 'washerman',
      };

      let mappedSlug = '';
      for (const [trade, catSlug] of Object.entries(TRADE_SLUG_MAP)) {
        if (rawCatTerm.includes(trade)) {
          mappedSlug = catSlug;
          break;
        }
      }

      filtered = allServices.filter((s) => {
        const sCatSlug = (s.category?.slug || '').toLowerCase();
        const sCatName = (s.category?.name || '').toLowerCase();
        return (
          (mappedSlug && sCatSlug === mappedSlug) ||
          (rawCatTerm && (sCatSlug.includes(rawCatTerm) || rawCatTerm.includes(sCatSlug)))
        );
      });
    }

    // Fallback 2: Guaranteed fallback to allServices if no specific category match found
    if (filtered.length === 0) {
      filtered = allServices;
    }

    return filtered;
  }, [allServices, categories, workerCategory, worker]);

  // Auto-select the worker's service (or first available service) when modal opens or availableServices updates
  useEffect(() => {
    if (availableServices.length > 0) {
      const isValid = availableServices.some((s) => s.id === selectedServiceId);
      if (!isValid) {
        setSelectedServiceId(availableServices[0].id);
      }
    } else if (allServices.length > 0) {
      setSelectedServiceId(allServices[0].id);
    }
  }, [availableServices, allServices, selectedServiceId]);

  // Handle service selection by user from SearchableSelect
  const handleServiceSelect = (serviceId: string) => {
    setSelectedServiceId(serviceId);
  };

  if (!isOpen || !worker) return null;

  const selectedService = availableServices.find((s) => s.id === selectedServiceId) || allServices.find((s) => s.id === selectedServiceId);
  const estimatedAmount = selectedService?.basePrice || worker.hourlyRate || 250;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    let effectiveServiceId = selectedServiceId;
    if (!effectiveServiceId && availableServices.length > 0) {
      effectiveServiceId = availableServices[0].id;
    } else if (!effectiveServiceId && allServices.length > 0) {
      effectiveServiceId = allServices[0].id;
    }

    const workerCatId =
      typeof worker.primaryCategory === 'object'
        ? (worker.primaryCategory as any)?.id
        : worker.primaryCategoryId || null;

    const selectedServiceObj = allServices.find((s) => s.id === effectiveServiceId);

    let finalCategoryId = '';
    if (selectedServiceObj && selectedServiceObj.categoryId && selectedServiceObj.categoryId !== 'ALL') {
      finalCategoryId = selectedServiceObj.categoryId;
    } else if (workerCategory?.id && workerCategory.id !== 'ALL') {
      finalCategoryId = workerCategory.id;
    } else if (workerCatId && workerCatId !== 'ALL') {
      finalCategoryId = workerCatId;
    }

    setLoading(true);

    try {
      let uploadedVoiceUrl: string | null = null;

      if (voiceNoteBlob) {
        const formData = new FormData();
        const ext =
          voiceNoteBlob.type.includes('mp4') || voiceNoteBlob.type.includes('m4a')
            ? 'm4a'
            : 'webm';
        formData.append('file', voiceNoteBlob, `voice-note.${ext}`);

        const uploadRes = await fetch('/api/upload/voice-note', {
          method: 'POST',
          body: formData,
        });

        const uploadData = await uploadRes.json();
        if (!uploadRes.ok || !uploadData.success) {
          throw new Error(uploadData.error || 'Failed to upload voice note');
        }

        uploadedVoiceUrl = uploadData.url;
      }

      const res = await fetch('/api/jobs/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workerId: worker.id,
          categoryId: finalCategoryId,
          serviceId: effectiveServiceId,
          description,
          voiceNoteUrl: uploadedVoiceUrl,
          voiceNoteDuration: voiceNoteDuration || 0,
          formattedAddress: address,
          city: selectedLocation.city || 'Surat',
          postalCode: selectedLocation.postalCode,
          latitude: selectedLocation.latitude,
          longitude: selectedLocation.longitude,
          preferredDate: urgency === 'IMMEDIATE' ? new Date().toISOString().split('T')[0] : preferredDate,
          preferredTime: urgency === 'IMMEDIATE' ? (isHindi ? 'तुरंत / अति आवश्यक' : 'Immediate / Urgent') : preferredTime,
          urgency,
          budget: estimatedAmount,
        }),
      });

      const data = await res.json();

      if (res.status === 401) {
        onRequireAuth();
        return;
      }

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to request worker');
      }

      // Cleanup local preview object URL
      if (voiceNotePreviewUrl) {
        URL.revokeObjectURL(voiceNotePreviewUrl);
      }
      setVoiceNoteBlob(null);
      setVoiceNoteDuration(0);
      setVoiceNotePreviewUrl(null);

      onSuccess(data.jobId);
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 font-sans">
      <div className="bg-white rounded-2xl max-w-lg w-[calc(100vw-24px)] sm:w-full shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200 max-h-[90dvh] sm:max-h-[92vh] flex flex-col my-auto">
        {/* Modal Header */}
        <div className="bg-navy-800 p-3.5 sm:p-5 text-white flex items-center justify-between shrink-0 min-w-0 font-devanagari">
          <div className="min-w-0 flex-1 pr-2">
            <span className="text-[10px] sm:text-xs font-bold text-brand-400 tracking-wider uppercase block">
              {t.onDemandBooking}
            </span>
            <h2 className="text-sm sm:text-lg font-black text-white leading-snug break-words">
              {isHindi ? `${worker.fullName} को बुक करें` : `${t.requestWorkerTitle}: ${worker.fullName}`}
            </h2>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center rounded-full text-slate-400 hover:text-white hover:bg-navy-700 active:bg-navy-600 transition-colors shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Worker Snapshot */}
        <div className="px-3.5 sm:px-6 py-2.5 sm:py-3 bg-slate-50 border-b border-slate-200 flex flex-col xs:flex-row items-start xs:items-center justify-between text-xs shrink-0 gap-2.5 sm:gap-3 min-w-0 font-devanagari">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
            {worker.avatarUrl ? (
              <img
                src={worker.avatarUrl}
                alt={worker.fullName}
                className="w-10 h-10 rounded-xl object-cover border border-slate-200 shadow-2xs shrink-0"
              />
            ) : (
              <div className="w-10 h-10 rounded-xl bg-brand-100 text-brand-800 font-bold text-xs flex items-center justify-center border border-brand-200 shrink-0 font-sans">
                {worker.fullName ? worker.fullName.slice(0, 2).toUpperCase() : 'WL'}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 font-bold text-slate-800 flex-wrap">
                <span className="truncate">{worker.fullName}</span>
                <span className="text-slate-400 font-normal shrink-0">•</span>
                <span className="text-slate-600 font-medium truncate">
                  {worker.primaryCategory?.name || (isHindi ? 'कुशल पेशेवर' : 'Skilled Professional')}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium truncate">
                {worker.experienceYears || 1}+ {t.yearsExp} • {worker.formattedDistance || t.nearby}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1 font-bold text-brand-800 bg-brand-50 px-2 py-1 rounded-lg border border-brand-200 shrink-0 text-[11px] self-start xs:self-center">
            <ShieldCheck className="w-3.5 h-3.5 text-brand-600 shrink-0" />
            <span>{t.verifiedBadge}</span>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 overflow-y-auto overflow-x-hidden flex-1 min-w-0">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-start gap-2 font-devanagari">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Booking Service Display */}
          <div className="space-y-3 font-devanagari">
            {categoriesError ? (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center justify-between gap-2">
                <span>{categoriesError}</span>
                <button
                  type="button"
                  onClick={fetchCategoriesAndServices}
                  className="px-2.5 py-1 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 transition-colors flex items-center gap-1 text-xs shrink-0"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>{t.retryBtn}</span>
                </button>
              </div>
            ) : (
              <div className="bg-brand-50/70 p-3.5 rounded-xl border border-brand-200/90 flex items-center justify-between shadow-2xs gap-2 min-w-0">
                <div className="min-w-0 flex-1">
                  <span className="text-[11px] font-extrabold text-brand-800 uppercase tracking-wider block">
                    {t.bookingServiceLabel}
                  </span>
                  <div className="text-xs sm:text-sm font-black text-navy-900 mt-0.5 flex items-center gap-1.5 truncate">
                    <span className="truncate">{worker.primaryCategory?.name || selectedService?.name || (isHindi ? 'कुशल सेवा' : 'Skilled Service')}</span>
                  </div>
                </div>
                <span className="px-2.5 py-1 bg-brand-700 text-white font-bold text-xs rounded-lg shrink-0 shadow-2xs">
                  ₹{estimatedAmount} / job
                </span>
              </div>
            )}

            {availableServices.length > 1 && !loadingServices && (
              <ServiceSearchableSelect
                label={t.selectSpecificService}
                disabled={loadingServices}
                placeholder={t.selectOrSearchService}
                services={availableServices}
                value={selectedServiceId}
                onChange={handleServiceSelect}
              />
            )}
          </div>

          {/* Address */}
          <div className="font-devanagari">
            <label className="block text-xs font-bold text-slate-700 mb-1">
              {t.serviceAddressLabel}
            </label>
            <div className="relative">
              <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-3.5 sm:top-3" />
              <input
                type="text"
                required
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder={t.addressPlaceholder}
                className="w-full pl-9 pr-3.5 py-3 sm:py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-brand-500 outline-none min-h-[44px]"
              />
            </div>
          </div>

          {/* Urgency */}
          <div className="font-devanagari">
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              {t.urgencyLabel}
            </label>
            <div className="grid grid-cols-2 gap-2 sm:gap-3">
              <button
                type="button"
                onClick={() => setUrgency('IMMEDIATE')}
                className={`min-h-[48px] py-2 px-2.5 text-xs font-bold rounded-xl border text-center transition-all flex flex-col items-center justify-center ${
                  urgency === 'IMMEDIATE'
                    ? 'border-brand-600 bg-brand-50 text-brand-800 ring-1 ring-brand-500 shadow-2xs'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <span>{t.immediateUrgent}</span>
              </button>
              <button
                type="button"
                onClick={() => setUrgency('SCHEDULED')}
                className={`min-h-[48px] py-2 px-2.5 text-xs font-bold rounded-xl border text-center transition-all flex flex-col items-center justify-center ${
                  urgency === 'SCHEDULED'
                    ? 'border-brand-600 bg-brand-50 text-brand-800 ring-1 ring-brand-500 shadow-2xs'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <span>{t.scheduleLater}</span>
              </button>
            </div>
          </div>

          {/* Schedule Date & Time */}
          {urgency === 'SCHEDULED' && (
            <div className="grid grid-cols-1 min-[380px]:grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200 animate-in fade-in duration-150 font-devanagari">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {t.preferredDateLabel}
                </label>
                <div className="relative">
                  <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-3.5 sm:top-3" />
                  <input
                    type="date"
                    required
                    value={preferredDate}
                    onChange={(e) => setPreferredDate(e.target.value)}
                    className="w-full pl-9 pr-3 py-3 sm:py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-brand-500 outline-none bg-white min-h-[44px]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {t.preferredTimeLabel}
                </label>
                <div className="relative">
                  <Clock className="w-4 h-4 text-slate-400 absolute left-3 top-3.5 sm:top-3" />
                  <select
                    value={preferredTime}
                    onChange={(e) => setPreferredTime(e.target.value)}
                    className="w-full pl-9 pr-3 py-3 sm:py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-brand-500 outline-none bg-white min-h-[44px]"
                  >
                    <option value="09:00 AM">09:00 AM - 11:00 AM</option>
                    <option value="11:00 AM">11:00 AM - 01:00 PM</option>
                    <option value="02:00 PM">02:00 PM - 04:00 PM</option>
                    <option value="04:00 PM">04:00 PM - 06:00 PM</option>
                    <option value="06:00 PM">06:00 PM - 08:00 PM</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Description & Voice Note */}
          <div className="font-devanagari">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-1 gap-0.5">
              <label className="block text-xs font-bold text-slate-700">
                {t.workDetailsLabel}
              </label>
              <span className="text-[10px] sm:text-[11px] text-slate-500 font-medium">
                {t.textVoiceBoth}
              </span>
            </div>
            <textarea
              rows={2}
              placeholder={t.workDetailsPlaceholder}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm focus:ring-2 focus:ring-brand-500 outline-none resize-none font-devanagari"
            />
            <VoiceNoteRecorder
              onVoiceNoteChange={(blob, durSec, previewUrl) => {
                if (voiceNotePreviewUrl && voiceNotePreviewUrl !== previewUrl) {
                  URL.revokeObjectURL(voiceNotePreviewUrl);
                }
                setVoiceNoteBlob(blob);
                setVoiceNoteDuration(durSec);
                setVoiceNotePreviewUrl(previewUrl);
              }}
              disabled={loading}
            />
          </div>

          {/* Pricing Summary */}
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 flex items-center justify-between gap-3 min-w-0 font-devanagari">
            <div className="min-w-0 flex-1">
              <span className="text-xs font-bold text-slate-700 block">
                {t.estimatedFeeLabel}
              </span>
              <span className="text-[11px] text-slate-500 leading-snug block">
                {t.payAfterWork}
              </span>
            </div>
            <span className="text-base sm:text-lg font-black text-navy-900 shrink-0 font-sans">
              ₹{estimatedAmount}
            </span>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={
              loading ||
              (!description.trim() && !voiceNoteBlob) ||
              loadingServices
            }
            className="w-full min-h-[48px] py-3 px-4 bg-brand-700 hover:bg-brand-800 active:scale-98 text-white font-bold rounded-xl shadow-md disabled:opacity-50 disabled:cursor-not-allowed transition-all text-xs sm:text-sm leading-snug flex items-center justify-center font-devanagari text-center"
          >
            {loading ? t.sendingRequest : t.confirmRequestBtn}
          </button>
        </form>
      </div>
    </div>
  );
}
