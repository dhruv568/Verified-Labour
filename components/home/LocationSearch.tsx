'use client';

import React, { useState, useEffect } from 'react';
import { MapPin, Navigation, Loader2, Search, ArrowRight } from 'lucide-react';
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
    <form onSubmit={handleSubmit} className="w-full">
      <div className="bg-white p-2 sm:p-2.5 rounded-2xl sm:rounded-3xl border border-slate-200/90 shadow-xl flex flex-col sm:flex-row items-center gap-2 sm:gap-3 focus-within:border-[#1264D6] focus-within:ring-4 focus-within:ring-[#1264D6]/10 transition-all">
        {/* Left Location Selector & Input */}
        <div className="relative flex-1 w-full flex items-center min-h-[46px] px-2">
          <MapPin className="w-5 h-5 text-[#1264D6] ml-1 mr-2.5 shrink-0" />
          <input
            type="text"
            placeholder="📍 स्थान चुनें / Select location (e.g. Surat, Adajan)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full py-2.5 pr-2 text-sm sm:text-base text-[#09265C] font-extrabold bg-transparent border-none outline-none placeholder:text-slate-400 placeholder:font-normal font-devanagari"
          />
          <button
            type="button"
            onClick={handleDetectGPS}
            title="स्थान पहचानें / Detect location via GPS"
            className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center text-slate-400 hover:text-[#1264D6] transition-colors shrink-0 rounded-xl hover:bg-blue-50 active:scale-95 cursor-pointer ml-1"
          >
            {isLoading ? (
              <Loader2 className="w-4.5 h-4.5 animate-spin text-[#1264D6]" />
            ) : (
              <Navigation className="w-4.5 h-4.5 text-[#1264D6]" />
            )}
          </button>
        </div>

        {/* Right CTA Button: Find a Worker */}
        <button
          type="submit"
          className="w-full sm:w-auto px-6 sm:px-7 py-3 sm:py-3.5 min-h-[48px] sm:min-h-[52px] bg-[#1264D6] hover:bg-blue-700 active:scale-98 text-white font-black text-sm sm:text-base rounded-xl sm:rounded-2xl shadow-md transition-all flex items-center justify-center gap-2 shrink-0 cursor-pointer font-devanagari"
        >
          <Search className="w-4.5 h-4.5 stroke-[2.5]" />
          <span>कामगार खोजें / Find a Worker</span>
          <ArrowRight className="w-4.5 h-4.5 stroke-[2.5] ml-0.5" />
        </button>
      </div>
    </form>
  );
}
