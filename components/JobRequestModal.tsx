'use client';

import React, { useState, useEffect } from 'react';
import { X, Calendar, Clock, MapPin, AlertCircle, CheckCircle2, ShieldCheck } from 'lucide-react';
import { WorkerData } from './WorkerCard';
import { LocationData } from '@/context/LocationContext';

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
  const [services, setServices] = useState<any[]>([]);
  const [selectedServiceId, setSelectedServiceId] = useState<string>('');
  const [description, setDescription] = useState('');
  const [address, setAddress] = useState(
    selectedLocation?.formattedAddress || selectedLocation?.displayName || ''
  );
  const [preferredDate, setPreferredDate] = useState(new Date().toISOString().split('T')[0]);
  const [preferredTime, setPreferredTime] = useState('10:00 AM');
  const [urgency, setUrgency] = useState<'IMMEDIATE' | 'TODAY' | 'SCHEDULED'>('TODAY');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (selectedLocation) {
      setAddress(selectedLocation.formattedAddress || selectedLocation.displayName || '');
    }
  }, [selectedLocation]);

  useEffect(() => {
    if (worker && worker.primaryCategory) {
      // Fetch services for worker's category
      fetch('/api/categories')
        .then((res) => res.json())
        .then((data) => {
          if (data.categories) {
            const match = data.categories.find(
              (c: any) => c.slug === worker.primaryCategory?.slug
            );
            if (match && match.services) {
              setServices(match.services);
              if (match.services.length > 0) {
                setSelectedServiceId(match.services[0].id);
              }
            }
          }
        })
        .catch(console.error);
    }
  }, [worker]);

  if (!isOpen || !worker) return null;

  const selectedService = services.find((s) => s.id === selectedServiceId);
  const estimatedAmount = selectedService?.basePrice || worker.hourlyRate || 350;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch('/api/jobs/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workerId: worker.id,
          categoryId: worker.primaryCategory ? (worker.primaryCategory as any).id || (services[0]?.categoryId) : undefined,
          serviceId: selectedServiceId,
          description,
          formattedAddress: address,
          city: selectedLocation.city || '',
          postalCode: selectedLocation.postalCode,
          latitude: selectedLocation.latitude,
          longitude: selectedLocation.longitude,
          preferredDate,
          preferredTime,
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
              On-Demand Booking
            </span>
            <h2 className="text-base sm:text-lg font-black text-white truncate max-w-[240px] sm:max-w-none">
              Request {worker.fullName}
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
                <span className="text-slate-600 font-medium">{worker.primaryCategory?.name}</span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium">
                {worker.experienceYears || 1}+ yrs exp • {worker.formattedDistance || 'Nearby'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1 font-bold text-brand-800 bg-brand-50 px-2 py-1 rounded-lg border border-brand-200 shrink-0">
            <ShieldCheck className="w-3.5 h-3.5 text-brand-600" />
            <span className="hidden sm:inline">Verified Professional</span>
            <span className="sm:hidden">Verified</span>
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

          {/* Service Selection */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Select Specific Work / Service
            </label>
            <select
              value={selectedServiceId}
              onChange={(e) => setSelectedServiceId(e.target.value)}
              className="w-full px-3.5 py-3 sm:py-2.5 rounded-xl border border-slate-300 text-base sm:text-sm focus:ring-2 focus:ring-brand-500 outline-none bg-white min-h-[44px]"
            >
              {services.map((svc) => (
                <option key={svc.id} value={svc.id}>
                  {svc.name} — ₹{svc.basePrice} ({svc.priceUnit})
                </option>
              ))}
            </select>
          </div>

          {/* Address */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Service Address & Landmark
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

          {/* Schedule Date & Time */}
          <div className="grid grid-cols-1 min-[380px]:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Preferred Date
              </label>
              <div className="relative">
                <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-3.5 sm:top-3" />
                <input
                  type="date"
                  required
                  value={preferredDate}
                  onChange={(e) => setPreferredDate(e.target.value)}
                  className="w-full pl-9 pr-3 py-3 sm:py-2.5 rounded-xl border border-slate-300 text-base sm:text-xs focus:ring-2 focus:ring-brand-500 outline-none min-h-[44px]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Time Slot
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

          {/* Urgency */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Urgency
            </label>
            <div className="grid grid-cols-1 min-[360px]:grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setUrgency('TODAY')}
                className={`min-h-[44px] py-2 px-2 text-xs font-bold rounded-xl border text-center transition-all flex items-center justify-center ${
                  urgency === 'TODAY'
                    ? 'border-brand-600 bg-brand-50 text-brand-800 ring-1 ring-brand-500'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                Today
              </button>
              <button
                type="button"
                onClick={() => setUrgency('IMMEDIATE')}
                className={`min-h-[44px] py-2 px-2 text-xs font-bold rounded-xl border text-center transition-all flex items-center justify-center ${
                  urgency === 'IMMEDIATE'
                    ? 'border-brand-600 bg-brand-50 text-brand-800 ring-1 ring-brand-500'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                Immediate / Urgent
              </button>
              <button
                type="button"
                onClick={() => setUrgency('SCHEDULED')}
                className={`min-h-[44px] py-2 px-2 text-xs font-bold rounded-xl border text-center transition-all flex items-center justify-center ${
                  urgency === 'SCHEDULED'
                    ? 'border-brand-600 bg-brand-50 text-brand-800 ring-1 ring-brand-500'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                Schedule Later
              </button>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Work Requirement Details
            </label>
            <textarea
              rows={2}
              required
              placeholder="Describe the issue or requirements (e.g. leaking kitchen tap pipe, need washer replaced)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-base sm:text-sm focus:ring-2 focus:ring-brand-500 outline-none resize-none"
            />
          </div>

          {/* Pricing Summary */}
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-slate-700 block">Estimated Service Fee</span>
              <span className="text-[11px] text-slate-500">Pay securely only after work is done</span>
            </div>
            <span className="text-lg font-black text-navy-900">
              ₹{estimatedAmount}
            </span>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading || !description.trim()}
            className="w-full min-h-[48px] py-3 bg-brand-700 hover:bg-brand-800 active:scale-98 text-white font-bold rounded-xl shadow-md disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm sm:text-base flex items-center justify-center"
          >
            {loading ? 'Sending Request to Worker...' : 'Confirm & Request Worker'}
          </button>
        </form>
      </div>
    </div>
  );
}
