'use client';

import React, { useState } from 'react';
import { MapPin, Navigation, Check, Edit3, AlertCircle, Search, Loader2 } from 'lucide-react';
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
    setStatusMessage('Requesting GPS location...');
    const success = await detectCurrentLocation();
    if (success) {
      setStatusMessage('Location updated from GPS!');
      setTimeout(() => setStatusMessage(null), 3000);
      if (onLocationSelected) {
        onLocationSelected(location);
      }
    } else {
      setStatusMessage(error || 'Could not detect location. Please enter manually.');
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
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
          query
        )}&format=json&addressdetails=1&limit=1`,
        {
          headers: {
            'User-Agent': 'VerifiedLabour/1.0 (info@verifiedlabour.com)',
          },
        }
      );

      if (res.ok) {
        const results = await res.json();
        if (results && results.length > 0) {
          const item = results[0];
          const addr = item.address || {};
          const city =
            addr.city ||
            addr.town ||
            addr.village ||
            addr.municipality ||
            addr.city_district ||
            addr.suburb ||
            addr.district ||
            query.split(',')[0].trim();
          const state = addr.state || '';
          const area =
            addr.suburb ||
            addr.neighbourhood ||
            addr.residential ||
            addr.road ||
            '';

          let displayName = query;
          if (area && city && area.toLowerCase() !== city.toLowerCase()) {
            displayName = `${area}, ${city}`;
          } else if (city && state) {
            displayName = `${city}, ${state}`;
          } else if (city) {
            displayName = city;
          }

          const newLoc = {
            displayName,
            city,
            state,
            area,
            formattedAddress: item.display_name || query,
            postalCode: addr.postcode || '',
            latitude: parseFloat(item.lat),
            longitude: parseFloat(item.lon),
          };

          setManualLocation(newLoc);
          setShowManualInput(false);
          setManualQuery('');
          setStatusMessage(`Location set to: ${displayName}`);
          setTimeout(() => setStatusMessage(null), 3000);
          return;
        }
      }
    } catch {
      // Fallback
    }

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
    <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        {/* Current Location Display */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-700 flex items-center justify-center shrink-0 border border-brand-200">
            <MapPin className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Service Location
              </span>
              {location.isConfirmed && isLocationSet ? (
                <span className="flex items-center gap-1 text-[11px] font-bold text-brand-700 bg-brand-50 px-2 py-0.5 rounded-full border border-brand-200">
                  <Check className="w-3 h-3" /> Confirmed
                </span>
              ) : (
                <span className="text-[11px] font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                  {isLocationSet ? 'Please Confirm' : 'Location Not Set'}
                </span>
              )}
            </div>
            <p className="text-sm font-bold text-slate-800 line-clamp-1">
              📍 {location.displayName || 'Select location'}
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          {!location.isConfirmed && isLocationSet ? (
            <button
              onClick={handleConfirmLocation}
              className="flex-1 sm:flex-none px-4 py-2 bg-brand-700 hover:bg-brand-800 text-white font-bold text-xs rounded-xl shadow-sm transition-colors flex items-center justify-center gap-1.5"
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
            title="Auto-detect via GPS"
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
              placeholder="Enter area, locality or city (e.g. Adajan, Surat or Bandra, Mumbai)"
              value={manualQuery}
              onChange={(e) => setManualQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-brand-500 outline-none"
            />
          </div>
          <button
            type="submit"
            disabled={!manualQuery.trim()}
            className="px-4 py-2 bg-navy-800 hover:bg-navy-900 text-white font-bold text-xs rounded-xl shadow-sm transition-colors disabled:opacity-50"
          >
            Set
          </button>
        </form>
      )}
    </div>
  );
}
