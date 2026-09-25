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
} from 'lucide-react';

interface LocationSelectorProps {
  className?: string;
  isMobile?: boolean;
}

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

  const handleManualSearchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const query = searchQuery.trim();
    if (!query) return;

    setManualLoading(true);
    setCustomError(null);

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

          setManualLocation({
            displayName,
            city,
            state,
            area,
            formattedAddress: item.display_name || query,
            postalCode: addr.postcode || '',
            latitude: parseFloat(parseFloat(item.lat).toFixed(3)),
            longitude: parseFloat(parseFloat(item.lon).toFixed(3)),
          });

          setSearchQuery('');
          setIsOpen(false);
          setManualLoading(false);
          return;
        }
      }
    } catch {}

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

  const displayText = location.displayName || 'Surat, Gujarat';

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
            {/* Auto Detected Location Info */}
            <div className="p-2.5 bg-blue-50/60 rounded-xl border border-blue-100">
              <span className="text-[10px] text-blue-700 font-bold uppercase tracking-wider block">
                Automatically Detected Location
              </span>
              <p className="text-xs font-bold text-slate-800 mt-0.5 line-clamp-1">
                📍 {displayText}
              </p>
            </div>

            {/* Re-detect GPS Location */}
            <button
              type="button"
              onClick={handleUseCurrentLocation}
              disabled={isLoading}
              className="w-full min-h-[44px] py-2.5 px-3.5 bg-brand-50 hover:bg-brand-100 border border-brand-200 text-brand-800 font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-colors disabled:opacity-50 active:scale-98"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-brand-700" />
                  <span>Detecting Location...</span>
                </>
              ) : (
                <>
                  <Navigation className="w-4 h-4 text-brand-700" />
                  <span>Re-detect Location (GPS)</span>
                </>
              )}
            </button>

            {/* Manual Change Input */}
            <form onSubmit={handleManualSearchSubmit} className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">
                Change Location
              </label>
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="Type city or area to change (e.g. Adajan, Surat)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-10 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-brand-500 outline-none"
                />
                {manualLoading && (
                  <Loader2 className="w-4 h-4 animate-spin text-slate-400 absolute right-3 top-3" />
                )}
              </div>
            </form>
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
        <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-xl border border-slate-200 p-4 text-xs z-50 animate-in fade-in zoom-in-95 duration-150 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-brand-600" />
              <span className="font-bold text-slate-800">Location Settings</span>
            </div>
            {location.isConfirmed && (
              <span className="flex items-center gap-1 text-[10px] font-bold text-brand-700 bg-brand-50 px-2 py-0.5 rounded-full border border-brand-200">
                <Check className="w-2.5 h-2.5" /> Auto Selected
              </span>
            )}
          </div>

          {/* Current Selection */}
          <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
              Current Location
            </span>
            <p className="text-xs font-bold text-slate-800 line-clamp-1 mt-0.5">
              📍 {displayText}
            </p>
          </div>

          {/* Re-detect GPS location */}
          <button
            onClick={handleUseCurrentLocation}
            disabled={isLoading}
            className="w-full py-2 px-3 bg-brand-50 hover:bg-brand-100 text-brand-800 font-bold text-xs rounded-xl border border-brand-200 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin text-brand-700" />
                <span>Detecting Location...</span>
              </>
            ) : (
              <>
                <Navigation className="w-3.5 h-3.5 text-brand-700" />
                <span>Re-detect Location (GPS)</span>
              </>
            )}
          </button>

          {/* Manual Search */}
          <form onSubmit={handleManualSearchSubmit} className="space-y-1.5">
            <label className="block text-[11px] font-bold text-slate-600">
              Change location manually:
            </label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                placeholder="Type city or area & press Enter..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-8 py-1.5 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-brand-500 outline-none"
              />
              {manualLoading && (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-400 absolute right-2.5 top-2.5" />
              )}
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
