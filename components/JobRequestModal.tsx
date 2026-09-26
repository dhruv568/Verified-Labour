'use client';

import React, { useState, useEffect } from 'react';
import { X, Calendar, Clock, MapPin, AlertCircle, ShieldCheck, RefreshCw } from 'lucide-react';
import { WorkerData } from './WorkerCard';
import { LocationData } from '@/context/LocationContext';
import VoiceNoteRecorder from './VoiceNoteRecorder';

interface JobRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  worker: WorkerData | null;
  selectedLocation: LocationData;
  onSuccess: (jobId: string) => void;
  onRequireAuth: () => void;
}

export default function JobRequestModal({
  isOpen,
  onClose,
  worker,
  selectedLocation,
  onSuccess,
  onRequireAuth,
}: JobRequestModalProps) {
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
  const [services, setServices] = useState<any[]>([]);
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

  // Fetch all categories with their associated services from backend API
  const fetchCategoriesAndServices = async () => {
    setLoadingServices(true);
    setCategoriesError(null);
    try {
      const res = await fetch('/api/categories');
      const data = await res.json();
      if (data.success && Array.isArray(data.categories)) {
        setCategories(data.categories);

        // Determine matching category for current worker
        let matchedCat = null;
        if (worker) {
          const pCat = worker.primaryCategory;
          const targetSlug = typeof pCat === 'object' ? pCat?.slug : pCat;
          const targetName = typeof pCat === 'object' ? pCat?.name : pCat;
          const targetId = typeof pCat === 'object' ? (pCat as any)?.id : null;

          matchedCat = data.categories.find((c: any) =>
            (targetId && c.id === targetId) ||
            (targetSlug && c.slug.toLowerCase() === String(targetSlug).toLowerCase()) ||
            (targetName && c.name.toLowerCase() === String(targetName).toLowerCase())
          );

          if (!matchedCat && worker.skills && worker.skills.length > 0) {
            const skillCatId =
              worker.skills[0]?.categoryId ||
              worker.skills[0]?.category?.id ||
              worker.skills[0]?.category?.slug;
            matchedCat = data.categories.find(
              (c: any) => c.id === skillCatId || c.slug === skillCatId
            );
          }
        }

        if (!matchedCat && data.categories.length > 0) {
          matchedCat = data.categories[0];
        }

        if (matchedCat) {
          setSelectedCategoryId(matchedCat.id);
          const catServices = matchedCat.services || [];
          setServices(catServices);
          if (catServices.length > 0) {
            setSelectedServiceId(catServices[0].id);
          } else {
            setSelectedServiceId('');
          }
        }
      } else {
        throw new Error(data.error || 'Failed to load categories');
      }
    } catch (err: any) {
      console.error('Error loading services:', err);
      setCategoriesError('सेवाएं लोड नहीं हो सकीं / Unable to load services');
    } finally {
      setLoadingServices(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchCategoriesAndServices();
    }
  }, [isOpen, worker]);

  // Handle category change by user
  const handleCategoryChange = (newCatId: string) => {
    setSelectedCategoryId(newCatId);
    const cat = categories.find((c) => c.id === newCatId);
    const catServices = cat?.services || [];
    setServices(catServices);

    // Reset selected service if it doesn't belong to the newly selected category
    const isStillValid = catServices.some((s: any) => s.id === selectedServiceId);
    if (!isStillValid) {
      setSelectedServiceId(catServices.length > 0 ? catServices[0].id : '');
    }
  };

  if (!isOpen || !worker) return null;

  const selectedService = services.find((s) => s.id === selectedServiceId);
  const estimatedAmount = selectedService?.basePrice || worker.hourlyRate || 350;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!selectedCategoryId) {
      setError('कृपया एक श्रेणी चुनें / Please select a category');
      return;
    }

    if (!selectedServiceId) {
      setError('कृपया एक विशिष्ट कार्य/सेवा चुनें / Please select a specific work/service');
      return;
    }

    setLoading(true);

    try {
      let uploadedVoiceUrl: string | null = null;

      // 1. Upload voice note if recorded for this job request
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

      // 2. Create JobRequest with selected category & service ID
      const res = await fetch('/api/jobs/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workerId: worker.id,
          categoryId: selectedCategoryId,
          serviceId: selectedServiceId,
          description,
          voiceNoteUrl: uploadedVoiceUrl,
          voiceNoteDuration: voiceNoteDuration || 0,
          formattedAddress: address,
          city: selectedLocation.city || 'Surat',
          postalCode: selectedLocation.postalCode,
          latitude: selectedLocation.latitude,
          longitude: selectedLocation.longitude,
          preferredDate: urgency === 'IMMEDIATE' ? new Date().toISOString().split('T')[0] : preferredDate,
          preferredTime: urgency === 'IMMEDIATE' ? 'Immediate / Urgent' : preferredTime,
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
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white rounded-t-2xl sm:rounded-2xl max-w-lg w-full shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] sm:max-h-[92vh] flex flex-col">
        {/* Modal Header */}
        <div className="bg-navy-800 p-4 sm:p-5 text-white flex items-center justify-between shrink-0">
          <div>
            <span className="text-[11px] sm:text-xs font-bold text-brand-400 tracking-wider uppercase">
              तुरंत बुकिंग / On-Demand Booking
            </span>
            <h2 className="text-base sm:text-lg font-black text-white truncate max-w-[240px] sm:max-w-none">
              {worker.fullName} को बुक करें / Request Worker
            </h2>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="w-10 h-10 flex items-center justify-center rounded-full text-slate-400 hover:text-white hover:bg-navy-700 active:bg-navy-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Worker Snapshot with Live Photo */}
        <div className="px-4 sm:px-6 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs shrink-0 gap-3">
          <div className="flex items-center gap-3">
            {worker.avatarUrl ? (
              <img
                src={worker.avatarUrl}
                alt={worker.fullName}
                className="w-10 h-10 rounded-xl object-cover border border-slate-200 shadow-2xs shrink-0"
              />
            ) : (
              <div className="w-10 h-10 rounded-xl bg-brand-100 text-brand-800 font-bold text-xs flex items-center justify-center border border-brand-200 shrink-0">
                {worker.fullName ? worker.fullName.slice(0, 2).toUpperCase() : 'WL'}
              </div>
            )}
            <div>
              <div className="flex items-center gap-1.5 font-bold text-slate-800 truncate">
                <span>{worker.fullName}</span>
                <span className="text-slate-400 font-normal">•</span>
                <span className="text-slate-600 font-medium">
                  {worker.primaryCategory?.name || 'Skilled Professional'}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium">
                {worker.experienceYears || 1}+ yrs exp • {worker.formattedDistance || 'Nearby'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1 font-bold text-brand-800 bg-brand-50 px-2 py-1 rounded-lg border border-brand-200 shrink-0">
            <ShieldCheck className="w-3.5 h-3.5 text-brand-600" />
            <span className="hidden sm:inline">सत्यापित पेशेवर / Verified</span>
            <span className="sm:hidden">सत्यापित</span>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 overflow-y-auto">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Main Category Selection */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              मुख्य श्रेणी / Main Category *
            </label>
            <select
              value={selectedCategoryId}
              onChange={(e) => handleCategoryChange(e.target.value)}
              disabled={loadingServices}
              className="w-full px-3.5 py-3 sm:py-2.5 rounded-xl border border-slate-300 text-base sm:text-sm focus:ring-2 focus:ring-brand-500 outline-none bg-white min-h-[44px]"
            >
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.nameHi ? `${cat.nameHi} / ${cat.name}` : cat.name}
                </option>
              ))}
            </select>
          </div>

          {/* Service Selection */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              विशिष्ट कार्य / सेवा / Select Specific Work / Service *
            </label>
            {categoriesError ? (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center justify-between gap-2">
                <span>{categoriesError}</span>
                <button
                  type="button"
                  onClick={fetchCategoriesAndServices}
                  className="px-2.5 py-1 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 transition-colors flex items-center gap-1 text-xs shrink-0"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>पुनः प्रयास करें / Retry</span>
                </button>
              </div>
            ) : (
              <select
                value={selectedServiceId}
                onChange={(e) => setSelectedServiceId(e.target.value)}
                disabled={loadingServices || services.length === 0}
                className="w-full px-3.5 py-3 sm:py-2.5 rounded-xl border border-slate-300 text-base sm:text-sm focus:ring-2 focus:ring-brand-500 outline-none bg-white min-h-[44px] disabled:bg-slate-100 disabled:text-slate-500"
              >
                {loadingServices ? (
                  <option value="" disabled>
                    सेवाएं लोड हो रही हैं... / Loading services...
                  </option>
                ) : services.length === 0 ? (
                  <option value="" disabled>
                    इस श्रेणी के लिए कोई सेवा उपलब्ध नहीं है / No services available for this category
                  </option>
                ) : (
                  services.map((svc) => (
                    <option key={svc.id} value={svc.id}>
                      {svc.nameHi ? `${svc.nameHi} / ${svc.name}` : svc.name} — ₹{svc.basePrice} ({svc.priceUnit || 'per job'})
                    </option>
                  ))
                )}
              </select>
            )}
          </div>

          {/* Address */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              सेवा का पता / Service Address & Landmark *
            </label>
            <div className="relative">
              <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-3.5 sm:top-3" />
              <input
                type="text"
                required
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="House / Flat no., Society / Building, Landmark"
                className="w-full pl-9 pr-3.5 py-3 sm:py-2.5 rounded-xl border border-slate-300 text-base sm:text-sm focus:ring-2 focus:ring-brand-500 outline-none min-h-[44px]"
              />
            </div>
          </div>

          {/* Urgency */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              आवश्यकता / Urgency *
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setUrgency('IMMEDIATE')}
                className={`min-h-[48px] py-2.5 px-3 text-xs font-bold rounded-xl border text-center transition-all flex flex-col items-center justify-center ${
                  urgency === 'IMMEDIATE'
                    ? 'border-brand-600 bg-brand-50 text-brand-800 ring-1 ring-brand-500 shadow-2xs'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <span>तुरंत / अति आवश्यक</span>
                <span className="text-[10px] font-normal opacity-80 mt-0.5">Immediate / Urgent</span>
              </button>
              <button
                type="button"
                onClick={() => setUrgency('SCHEDULED')}
                className={`min-h-[48px] py-2.5 px-3 text-xs font-bold rounded-xl border text-center transition-all flex flex-col items-center justify-center ${
                  urgency === 'SCHEDULED'
                    ? 'border-brand-600 bg-brand-50 text-brand-800 ring-1 ring-brand-500 shadow-2xs'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <span>बाद में शेड्यूल करें</span>
                <span className="text-[10px] font-normal opacity-80 mt-0.5">Schedule Later</span>
              </button>
            </div>
          </div>

          {/* Schedule Date & Time (Active when Schedule Later is selected) */}
          {urgency === 'SCHEDULED' && (
            <div className="grid grid-cols-1 min-[380px]:grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200 animate-in fade-in duration-150">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  पसंदीदा तारीख / Preferred Date *
                </label>
                <div className="relative">
                  <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-3.5 sm:top-3" />
                  <input
                    type="date"
                    required
                    value={preferredDate}
                    onChange={(e) => setPreferredDate(e.target.value)}
                    className="w-full pl-9 pr-3 py-3 sm:py-2.5 rounded-xl border border-slate-300 text-base sm:text-xs focus:ring-2 focus:ring-brand-500 outline-none bg-white min-h-[44px]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  समय सीमा / Time Slot *
                </label>
                <div className="relative">
                  <Clock className="w-4 h-4 text-slate-400 absolute left-3 top-3.5 sm:top-3" />
                  <select
                    value={preferredTime}
                    onChange={(e) => setPreferredTime(e.target.value)}
                    className="w-full pl-9 pr-3 py-3 sm:py-2.5 rounded-xl border border-slate-300 text-base sm:text-xs focus:ring-2 focus:ring-brand-500 outline-none bg-white min-h-[44px]"
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
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-bold text-slate-700">
                कार्य विवरण / Work Requirement Details
              </label>
              <span className="text-[11px] text-slate-500 font-medium">
                टेक्स्ट, वॉइस नोट या दोनों / Text, Voice Note, or Both
              </span>
            </div>
            <textarea
              rows={2}
              placeholder="अपनी आवश्यकता का विवरण लिखें (जैसे: रसोई के सिंक का नल लीक हो रहा है) / Describe your requirement in detail"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-base sm:text-sm focus:ring-2 focus:ring-brand-500 outline-none resize-none"
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
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-slate-700 block">
                अनुमानित सेवा शुल्क / Estimated Service Fee
              </span>
              <span className="text-[11px] text-slate-500">
                काम पूरा होने के बाद सुरक्षित भुगतान करें / Pay securely after work is done
              </span>
            </div>
            <span className="text-lg font-black text-navy-900">
              ₹{estimatedAmount}
            </span>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading || (!description.trim() && !voiceNoteBlob) || loadingServices || !selectedServiceId}
            className="w-full min-h-[48px] py-3 bg-brand-700 hover:bg-brand-800 active:scale-98 text-white font-bold rounded-xl shadow-md disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm sm:text-base flex items-center justify-center font-devanagari"
          >
            {loading ? 'अनुरोध भेजा जा रहा है... / Sending Request...' : 'पुष्टि करें और वर्कर बुक करें / Confirm & Request Worker'}
          </button>
        </form>
      </div>
    </div>
  );
}
