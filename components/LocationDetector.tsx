'use client';

import React, { useState } from 'react';
import { MapPin, Navigation, Check, Edit3, AlertCircle, Search, Loader2, Compass } from 'lucide-react';
import { useLocation, LocationData } from '@/context/LocationContext';

export type { LocationData };

interface LocationDetectorProps {
  onLocationSelected?: (location: LocationData) => void;
  defaultLocation?: LocationData;
}

export default function LocationDetector({
  onLocationSelected,
}: LocationDetectorProps) {
  const {
    location,
    isLoading,
    error,
    permissionState,
    detectCurrentLocation,
    setManualLocation,
  } = useLocation();

  const [showManualInput, setShowManualInput] = useState(false);
  const [manualQuery, setManualQuery] = useState('');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const handleDetect = async () => {
    setStatusMessage('Acquiring high-accuracy GPS location...');
    const success = await detectCurrentLocation({ userInitiated: true });
    if (success) {
      setStatusMessage('Location updated from device GPS!');
      setTimeout(() => setStatusMessage(null), 3500);
      if (onLocationSelected) {
        onLocationSelected(location);
      }
    } else {
      setStatusMessage(error || 'Could not detect exact GPS location. Please select manually.');
      setShowManualInput(true);
    }
  };

  const handleConfirmLocation = () => {
    if (onLocationSelected) {
      onLocationSelected(location);
    }
    setShowManualInput(false);
    setStatusMessage('Location confirmed!');
    setTimeout(() => setStatusMessage(null), 3000);
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const query = manualQuery.trim();
    if (!query) return;

    setStatusMessage('Setting location...');

    try {
      const res = await fetch(`/api/location/geocode?q=${encodeURIComponent(query)}`);
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          const d = json.data;
          const newLoc = {
            displayName: d.area && d.city && d.area !== d.city ? `${d.area}, ${d.city}` : d.city || query,
            city: d.city || query,
            state: d.state || '',
            area: d.area || '',
            formattedAddress: d.formattedAddress || query,
            postalCode: d.postalCode || '',
            latitude: d.latitude,
            longitude: d.longitude,
          };

          setManualLocation(newLoc);
          setShowManualInput(false);
          setManualQuery('');
          setStatusMessage(`Location set to: ${newLoc.displayName}`);
          setTimeout(() => setStatusMessage(null), 3000);
          return;
        }
      }
    } catch {}

    const parts = query.split(',').map((p) => p.trim());
    const area = parts.length > 1 ? parts[0] : '';
    const city = parts.length > 1 ? parts[1] : parts[0];

    const fallbackLoc = {
      displayName: query,
      city: city || query,
      area,
      formattedAddress: query,
      latitude: null,
      longitude: null,
    };

    setManualLocation(fallbackLoc);
    setShowManualInput(false);
    setManualQuery('');
    setStatusMessage(`Location set to: ${query}`);
    setTimeout(() => setStatusMessage(null), 3000);
  };

  const isLocationSet =
    location.displayName && location.displayName !== 'Select location';

  return (
    <div className="bg-white rounded-2xl p-4 shadow-xs border border-slate-200">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        {/* Current Location Display */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-700 flex items-center justify-center shrink-0 border border-brand-200">
            <MapPin className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Service Area
              </span>
              {location.source === 'gps' ? (
                <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200" title={`GPS Accuracy: ${location.accuracy ? location.accuracy + 'm' : 'High'}`}>
                  <Check className="w-3 h-3 text-emerald-600" /> GPS {location.accuracy ? `(±${location.accuracy}m)` : ''}
                </span>
              ) : location.source === 'manual' ? (
                <span className="flex items-center gap-1 text-[11px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                  <Check className="w-3 h-3 text-blue-600" /> Manual
                </span>
              ) : location.source === 'ip' ? (
                <span className="flex items-center gap-1 text-[11px] font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                  <Compass className="w-3 h-3 text-amber-600" /> Approximate (IP)
                </span>
              ) : (
                <span className="text-[11px] font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
                  Default Location
                </span>
              )}
            </div>
            <p className="text-sm font-bold text-slate-800 line-clamp-1 mt-0.5">
              📍 {location.displayName || 'Select location'}
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          {!location.isConfirmed && isLocationSet ? (
            <button
              onClick={handleConfirmLocation}
              className="flex-1 sm:flex-none px-4 py-2 bg-brand-700 hover:bg-brand-800 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5"
            >
              <Check className="w-3.5 h-3.5" />
              Use This Location
            </button>
          ) : null}

          <button
            onClick={() => setShowManualInput(!showManualInput)}
            className="flex-1 sm:flex-none px-3 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold text-xs rounded-xl transition-colors flex items-center justify-center gap-1.5"
          >
            <Edit3 className="w-3.5 h-3.5 text-slate-500" />
            Change Location
          </button>

          <button
            onClick={handleDetect}
            disabled={isLoading}
            title="Auto-detect high accuracy GPS"
            className="p-2 border border-slate-300 hover:border-brand-500 hover:bg-brand-50 text-brand-700 rounded-xl transition-colors disabled:opacity-50"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin text-brand-700" />
            ) : (
              <Navigation className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>

      {/* Helper / Permission Alerts */}
      {(statusMessage || error || permissionState === 'denied') && (
        <div className="mt-3 p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-brand-600 shrink-0" />
          <span>{statusMessage || error || 'Browser location permission denied. Please search or set your locality manually.'}</span>
        </div>
      )}

      {/* Manual Input Expandable Drawer */}
      {showManualInput && (
        <form onSubmit={handleManualSubmit} className="mt-3 pt-3 border-t border-slate-100 flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Enter area, locality or city (e.g. Ravet, Wakad, Tathawade or Adajan, Surat)"
              value={manualQuery}
              onChange={(e) => setManualQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-brand-500 outline-none"
            />
          </div>
          <button
            type="submit"
            disabled={!manualQuery.trim()}
            className="px-4 py-2 bg-navy-800 hover:bg-navy-900 text-white font-bold text-xs rounded-xl shadow-xs transition-colors disabled:opacity-50"
          >
            Set
          </button>
        </form>
      )}
    </div>
  );
}
