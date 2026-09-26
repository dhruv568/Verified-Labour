'use client';

import React, { useState, useEffect } from 'react';
import { MapPin, Navigation, Loader2 } from 'lucide-react';
import { useLocation } from '@/context/LocationContext';

interface LocationSearchProps {
  onSearch?: (locationQuery: string) => void;
}

export default function LocationSearch({ onSearch }: LocationSearchProps) {
  const { location, detectCurrentLocation, setManualLocation, isLoading } = useLocation();
  const [query, setQuery] = useState('');

  useEffect(() => {
    if (location.displayName && location.displayName !== 'Select location') {
      setQuery(location.displayName);
    }
  }, [location.displayName]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanQuery = query.trim();
    if (cleanQuery && cleanQuery !== location.displayName) {
      setManualLocation({
        displayName: cleanQuery,
        city: cleanQuery.split(',')[0].trim(),
        formattedAddress: cleanQuery,
        latitude: null,
        longitude: null,
      });
    }
    if (onSearch) {
      onSearch(cleanQuery);
    }
  };

  const handleDetectGPS = async () => {
    await detectCurrentLocation();
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-xl">
      <div className="bg-white p-2 rounded-2xl border border-slate-300 shadow-sm flex flex-col sm:flex-row items-center gap-2 focus-within:border-[#1264D6] focus-within:ring-2 focus-within:ring-[#1264D6]/20 transition-all">
        {/* Left Input Area with MapPin Icon */}
        <div className="relative flex-1 w-full flex items-center min-h-[44px]">
          <MapPin className="w-5 h-5 text-[#1264D6] ml-2 mr-2 shrink-0" />
          <input
            type="text"
            placeholder="अपना स्थान चुनें / Select location (e.g. Delhi, Surat)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full py-2.5 pr-2 text-base sm:text-sm text-[#09265C] font-bold bg-transparent border-none outline-none placeholder:text-slate-400 placeholder:font-normal font-devanagari"
          />
          <button
            type="button"
            onClick={handleDetectGPS}
            title="स्थान पहचानें / Detect location"
            className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-[#1264D6] transition-colors shrink-0 rounded-lg hover:bg-blue-50 active:scale-95 cursor-pointer"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin text-[#1264D6]" />
            ) : (
              <Navigation className="w-4 h-4 text-[#1264D6]" />
            )}
          </button>
        </div>

        {/* Attached Blue "Find a Worker" / "Book in 30s" Button */}
        <button
          type="submit"
          className="w-full sm:w-auto px-6 py-3.5 sm:py-3 min-h-[48px] bg-[#1264D6] hover:bg-blue-700 text-white font-black text-sm rounded-xl shadow-xs transition-all flex items-center justify-center shrink-0 tracking-wide active:scale-98 cursor-pointer"
        >
          <span className="font-devanagari text-sm">30s में बुक करें</span>
          <span className="text-[11px] font-normal opacity-85 ml-1.5 font-sans">• Find Worker</span>
        </button>
      </div>
    </form>
  );
}
