'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useLocation } from '@/context/LocationContext';
import {
  MapPin,
  Navigation,
  ChevronDown,
  Search,
  Check,
  AlertCircle,
  Loader2,
  X,
} from 'lucide-react';

interface LocationSelectorProps {
  className?: string;
  isMobile?: boolean;
}

// Quick selection presets for popular service hubs (with coordinates)
const POPULAR_CITIES = [
  { name: 'Surat', state: 'Gujarat', lat: 21.1702, lng: 72.8311 },
  { name: 'Ahmedabad', state: 'Gujarat', lat: 23.0225, lng: 72.5714 },
  { name: 'Vadodara', state: 'Gujarat', lat: 22.3072, lng: 73.1812 },
  { name: 'Rajkot', state: 'Gujarat', lat: 22.3039, lng: 70.8022 },
  { name: 'Mumbai', state: 'Maharashtra', lat: 19.076, lng: 72.8777 },
  { name: 'Pune', state: 'Maharashtra', lat: 18.5204, lng: 73.8567 },
  { name: 'Delhi NCR', state: 'Delhi', lat: 28.6139, lng: 77.209 },
  { name: 'Bengaluru', state: 'Karnataka', lat: 12.9716, lng: 77.5946 },
];

export default function LocationSelector({ className = '', isMobile = false }: LocationSelectorProps) {
  const {
    location,
    isLoading,
    error,
    permissionState,
    detectCurrentLocation,
    setManualLocation,
  } = useLocation();

  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [manualLoading, setManualLoading] = useState(false);
  const [customError, setCustomError] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleUseCurrentLocation = async () => {
    setCustomError(null);
    const success = await detectCurrentLocation();
    if (success) {
      setIsOpen(false);
    }
  };

  const handleSelectCityPreset = (city: typeof POPULAR_CITIES[0]) => {
    setManualLocation({
      displayName: `${city.name}, ${city.state}`,
      city: city.name,
      state: city.state,
      formattedAddress: `${city.name}, ${city.state}`,
      latitude: city.lat,
      longitude: city.lng,
    });
    setIsOpen(false);
  };

  const handleManualSearchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const query = searchQuery.trim();
    if (!query) return;

    setManualLoading(true);
    setCustomError(null);

    try {
      // Query Nominatim for accurate coordinates without backend overhead
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

          setManualLocation({
            displayName,
            city,
            state,
            area,
            formattedAddress: item.display_name || query,
            postalCode: addr.postcode || '',
            latitude: parseFloat(item.lat),
            longitude: parseFloat(item.lon),
          });

          setSearchQuery('');
          setIsOpen(false);
          setManualLoading(false);
          return;
        }
      }
    } catch {
      // Fallback if network or geocoding fails
    }

    // Graceful offline fallback parsing
    const parts = query.split(',').map((p) => p.trim());
    const area = parts.length > 1 ? parts[0] : '';
    const city = parts.length > 1 ? parts[1] : parts[0];

    setManualLocation({
      displayName: query,
      city: city || query,
      area,
      formattedAddress: query,
      latitude: null,
      longitude: null,
    });

    setSearchQuery('');
    setIsOpen(false);
    setManualLoading(false);
  };

  const displayText = location.displayName || 'Select location';

  if (isMobile) {
    return (
      <div className={`w-full ${className}`}>
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="w-full flex items-center justify-between min-h-[44px] px-3.5 py-2.5 text-sm font-semibold rounded-xl border border-slate-200 bg-slate-50 text-slate-800 active:bg-slate-100 transition-colors"
        >
          <span className="flex items-center gap-2 truncate">
            <MapPin className="w-4 h-4 text-[#1264D6] shrink-0" />
            <span className="truncate font-bold">{displayText}</span>
          </span>
          <ChevronDown className={`w-4 h-4 text-slate-500 shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>

        {isOpen && (
          <div className="mt-2.5 p-3.5 bg-white rounded-2xl border border-slate-200 shadow-xl space-y-3.5 animate-in fade-in duration-150">
            {/* Error or Permission Alert */}
            {(error || customError || permissionState === 'denied') && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>
                  {error || customError || 'Location permission denied. Please select your city manually.'}
                </span>
              </div>
            )}

            {/* Use My Current Location */}
            <button
              type="button"
              onClick={handleUseCurrentLocation}
              disabled={isLoading}
              className="w-full min-h-[46px] py-3 px-3.5 bg-brand-50 hover:bg-brand-100 border border-brand-200 text-brand-800 font-bold text-sm rounded-xl flex items-center justify-center gap-2 transition-colors disabled:opacity-50 active:scale-98"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-brand-700" />
                  <span>Detecting GPS Location...</span>
                </>
              ) : (
                <>
                  <Navigation className="w-4 h-4 text-brand-700" />
                  <span>Use my current location</span>
                </>
              )}
            </button>

            {/* Manual Search Form */}
            <form onSubmit={handleManualSearchSubmit} className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Change Location / Search Area
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                  <input
                    type="text"
                    placeholder="Enter city or area (e.g. Adajan, Surat)"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-brand-500 outline-none"
                  />
                </div>
                <button
                  type="submit"
                  disabled={manualLoading || !searchQuery.trim()}
                  className="px-4 py-2.5 bg-navy-800 text-white font-bold text-sm rounded-xl hover:bg-navy-900 disabled:opacity-50 shrink-0 active:scale-95 transition-all"
                >
                  {manualLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Set'}
                </button>
              </div>
            </form>

            {/* Quick Popular Cities */}
            <div>
              <span className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                Popular Cities
              </span>
              <div className="flex flex-wrap gap-2">
                {POPULAR_CITIES.map((c) => (
                  <button
                    key={c.name}
                    type="button"
                    onClick={() => handleSelectCityPreset(c)}
                    className={`min-h-[36px] px-3 py-1.5 text-xs rounded-lg border transition-colors flex items-center gap-1 active:scale-95 ${
                      location.city === c.name
                        ? 'bg-brand-700 text-white border-brand-700 font-bold'
                        : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200 font-medium'
                    }`}
                  >
                    <span>{c.name}</span>
                    {location.city === c.name && <Check className="w-3 h-3 text-white" />}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Navbar Trigger Button: matches reference style with MapPin icon */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 text-slate-800 shadow-xs transition-colors max-w-[190px]"
        title={displayText}
      >
        <MapPin className="w-3.5 h-3.5 text-[#1464D2] shrink-0" />
        <span className="truncate font-semibold">{displayText}</span>
        <ChevronDown
          className={`w-3.5 h-3.5 text-slate-400 shrink-0 transition-transform ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {/* Popover Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-slate-200 p-4 text-xs z-50 animate-in fade-in zoom-in-95 duration-150">
          <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-100">
            <div className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-brand-600" />
              <span className="font-bold text-slate-800">Your Location</span>
            </div>
            {location.isConfirmed && (
              <span className="flex items-center gap-1 text-[10px] font-bold text-brand-700 bg-brand-50 px-2 py-0.5 rounded-full border border-brand-200">
                <Check className="w-2.5 h-2.5" /> Selected
              </span>
            )}
          </div>

          {/* Current Location Display if set */}
          {location.displayName && location.displayName !== 'Select location' && (
            <div className="mb-3 p-2 bg-slate-50 rounded-lg border border-slate-100">
              <span className="text-[10px] text-slate-400 font-bold uppercase block">
                Current selection
              </span>
              <p className="text-xs font-semibold text-slate-800 line-clamp-1">
                📍 {location.displayName}
              </p>
            </div>
          )}

          {/* Error / Permission Status banner */}
          {(error || customError || permissionState === 'denied') && (
            <div className="mb-3 p-2.5 bg-amber-50 border border-amber-200 rounded-lg text-[11px] text-amber-800 flex items-start gap-2">
              <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
              <span>
                {error || customError || 'Browser location permission denied. Choose your city manually below.'}
              </span>
            </div>
          )}

          {/* Option 1: "Use my current location" */}
          <button
            onClick={handleUseCurrentLocation}
            disabled={isLoading}
            className="w-full py-2 px-3 bg-brand-50 hover:bg-brand-100 text-brand-800 font-bold text-xs rounded-lg border border-brand-200 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin text-brand-700" />
                <span>Detecting GPS Location...</span>
              </>
            ) : (
              <>
                <Navigation className="w-3.5 h-3.5 text-brand-700" />
                <span>Use my current location</span>
              </>
            )}
          </button>

          {/* Divider */}
          <div className="relative my-3">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200" />
            </div>
            <div className="relative flex justify-center text-[10px] uppercase font-bold text-slate-400">
              <span className="bg-white px-2">or change location</span>
            </div>
          </div>

          {/* Option 2: "Change location" / Manual Search */}
          <form onSubmit={handleManualSearchSubmit} className="space-y-1.5 mb-3">
            <div className="flex gap-1.5">
              <div className="relative flex-1">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                <input
                  type="text"
                  placeholder="Enter city or area (e.g. Adajan, Surat)"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-2.5 py-1.5 text-xs rounded-lg border border-slate-300 focus:ring-2 focus:ring-brand-500 outline-none"
                />
              </div>
              <button
                type="submit"
                disabled={manualLoading || !searchQuery.trim()}
                className="px-3 py-1.5 bg-navy-800 hover:bg-navy-900 text-white font-bold text-xs rounded-lg transition-colors disabled:opacity-50"
              >
                {manualLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Set'}
              </button>
            </div>
          </form>

          {/* Quick Popular Cities */}
          <div>
            <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
              Popular Cities
            </span>
            <div className="grid grid-cols-2 gap-1.5">
              {POPULAR_CITIES.map((c) => (
                <button
                  key={c.name}
                  onClick={() => handleSelectCityPreset(c)}
                  className={`text-left px-2 py-1.5 rounded-lg border text-[11px] font-medium transition-colors flex items-center justify-between ${
                    location.city === c.name
                      ? 'bg-brand-50 border-brand-300 text-brand-800 font-bold'
                      : 'hover:bg-slate-50 border-slate-100 text-slate-700'
                  }`}
                >
                  <span className="truncate">{c.name}</span>
                  {location.city === c.name && (
                    <Check className="w-3 h-3 text-brand-600 shrink-0" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
