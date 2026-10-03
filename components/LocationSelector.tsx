'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useLocation } from '@/context/LocationContext';
import { useLanguage } from '@/context/LanguageContext';
import {
  MapPin,
  Navigation,
  ChevronDown,
  Search,
  Check,
  Compass,
  Loader2,
} from 'lucide-react';

interface LocationSelectorProps {
  className?: string;
  isMobile?: boolean;
}

export default function LocationSelector({ className = '', isMobile = false }: LocationSelectorProps) {
  const { isHindi } = useLanguage();
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
    const success = await detectCurrentLocation({ userInitiated: true });
    if (success) {
      setIsOpen(false);
    } else {
      setCustomError(error || (isHindi ? 'जीपीएस निर्देशांक प्राप्त करने में विफल।' : 'Could not fetch precise GPS coordinates.'));
    }
  };

  const handleManualSearchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const query = searchQuery.trim();
    if (!query) return;

    setManualLoading(true);
    setCustomError(null);

    try {
      const geoRes = await fetch(`/api/location/geocode?q=${encodeURIComponent(query)}`);
      if (geoRes.ok) {
        const geoJson = await geoRes.json();
        if (geoJson.success && geoJson.data) {
          const d = geoJson.data;
          setManualLocation({
            displayName: d.area && d.city && d.area !== d.city ? `${d.area}, ${d.city}` : d.city || query,
            city: d.city || query,
            state: d.state || '',
            area: d.area || '',
            formattedAddress: d.formattedAddress || query,
            postalCode: d.postalCode || '',
            latitude: d.latitude,
            longitude: d.longitude,
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

  const displayText = location.displayName || 'Pimpri-Chinchwad, Maharashtra';

  if (isMobile) {
    return (
      <div className={`w-full font-devanagari ${className}`}>
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
            {/* Location Status Info */}
            <div className="p-2.5 bg-blue-50/60 rounded-xl border border-blue-100 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-blue-700 font-bold uppercase tracking-wider block">
                  {isHindi ? 'वर्तमान स्थान' : 'Current Location'}
                </span>
                <p className="text-xs font-bold text-slate-800 mt-0.5 line-clamp-1">
                  📍 {displayText}
                </p>
              </div>
              {location.source === 'gps' ? (
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-200">
                  GPS {location.accuracy ? `(±${location.accuracy}m)` : ''}
                </span>
              ) : location.source === 'ip' ? (
                <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full border border-amber-200">
                  {isHindi ? 'अनुमानित (IP)' : 'Approx (IP)'}
                </span>
              ) : location.source === 'manual' ? (
                <span className="text-[10px] font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full border border-blue-200">
                  {isHindi ? 'मैन्युअल' : 'Manual'}
                </span>
              ) : null}
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
                  <span>{isHindi ? 'जीपीएस सिग्नल प्राप्त हो रहा है...' : 'Acquiring GPS Signal...'}</span>
                </>
              ) : (
                <>
                  <Navigation className="w-4 h-4 text-brand-700" />
                  <span>{isHindi ? 'वर्तमान स्थान (GPS) का उपयोग करें' : 'Use Current Location (GPS)'}</span>
                </>
              )}
            </button>

            {customError && (
              <p className="text-[11px] text-amber-700 bg-amber-50 p-2 rounded-lg border border-amber-200">
                {customError}
              </p>
            )}

            {/* Manual Change Input */}
            <form onSubmit={handleManualSearchSubmit} className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">
                {isHindi ? 'स्थान खोजें या बदलें' : 'Search or Change Location'}
              </label>
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder={isHindi ? 'क्षेत्र या शहर लिखें (जैसे रावेत, वाकड)...' : 'Type area or city (e.g. Ravet, Wakad)...'}
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
    <div className={`relative font-devanagari min-w-0 ${className}`} ref={dropdownRef}>
      {/* Navbar Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1 sm:gap-1.5 text-xs font-bold px-2.5 sm:px-3 py-1.5 sm:py-2 min-h-[36px] sm:min-h-[38px] h-9 sm:h-9.5 rounded-full border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 text-slate-800 shadow-xs transition-colors min-w-0 max-w-[120px] sm:max-w-[140px] lg:max-w-[150px] xl:max-w-[180px] 2xl:max-w-[210px] shrink focus:outline-none focus:ring-2 focus:ring-[#1464D2]"
        title={displayText}
        aria-expanded={isOpen}
        aria-label={isHindi ? `स्थान: ${displayText}` : `Location: ${displayText}`}
      >
        <MapPin className="w-3.5 h-3.5 text-[#1464D2] shrink-0" />
        <span className="truncate font-semibold text-[11px] sm:text-xs min-w-0 flex-1 text-left">{displayText}</span>
        <ChevronDown
          className={`w-3.5 h-3.5 text-slate-400 shrink-0 transition-transform ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {/* Popover Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-slate-200 p-4 text-xs z-50 animate-in fade-in zoom-in-95 duration-150 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-brand-600" />
              <span className="font-bold text-slate-800">{isHindi ? 'स्थान सेटिंग्स' : 'Location Settings'}</span>
            </div>
            {location.source === 'gps' ? (
              <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                <Check className="w-2.5 h-2.5" /> {isHindi ? 'जीपीएस सक्रिय' : 'GPS Active'} {location.accuracy ? `(±${location.accuracy}m)` : ''}
              </span>
            ) : location.source === 'manual' ? (
              <span className="flex items-center gap-1 text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                <Check className="w-2.5 h-2.5" /> {isHindi ? 'मैन्युअल चयन' : 'Manual Selection'}
              </span>
            ) : location.source === 'ip' ? (
              <span className="flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                <Compass className="w-2.5 h-2.5" /> {isHindi ? 'अनुमानित (IP)' : 'Approx (IP)'}
              </span>
            ) : null}
          </div>

          {/* Current Selection */}
          <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
              {isHindi ? 'चयनित सेवा क्षेत्र' : 'Selected Service Area'}
            </span>
            <p className="text-xs font-bold text-slate-800 line-clamp-1 mt-0.5">
              📍 {displayText}
            </p>
          </div>

          {/* Re-detect GPS location */}
          <button
            onClick={handleUseCurrentLocation}
            disabled={isLoading}
            className="w-full py-2.5 px-3 bg-brand-50 hover:bg-brand-100 text-brand-800 font-bold text-xs rounded-xl border border-brand-200 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin text-brand-700" />
                <span>{isHindi ? 'जीपीएस सिग्नल प्राप्त हो रहा है...' : 'Acquiring GPS Signal...'}</span>
              </>
            ) : (
              <>
                <Navigation className="w-3.5 h-3.5 text-brand-700" />
                <span>{isHindi ? 'वर्तमान स्थान (GPS) का उपयोग करें' : 'Use Current Location (GPS)'}</span>
              </>
            )}
          </button>

          {customError && (
            <p className="text-[11px] text-amber-700 bg-amber-50 p-2 rounded-lg border border-amber-200">
              {customError}
            </p>
          )}

          {/* Manual Search */}
          <form onSubmit={handleManualSearchSubmit} className="space-y-1.5">
            <label className="block text-[11px] font-bold text-slate-600">
              {isHindi ? 'इलाका या शहर खोजें:' : 'Search locality or city:'}
            </label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                placeholder={isHindi ? 'जैसे रावेत, वाकड...' : 'e.g. Ravet, Wakad...'}
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
