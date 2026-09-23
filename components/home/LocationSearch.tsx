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
      <div className="bg-white p-1.5 sm:p-2 rounded-xl sm:rounded-2xl border border-slate-300 shadow-sm flex flex-col sm:flex-row items-center gap-2 focus-within:border-[#1264D6] focus-within:ring-2 focus-within:ring-[#1264D6]/20 transition-all">
        {/* Left Input Area with MapPin Icon */}
        <div className="relative flex-1 w-full flex items-center">
          <MapPin className="w-5 h-5 text-[#1264D6] ml-2.5 mr-2 shrink-0" />
          <input
            type="text"
            placeholder="Enter your location (e.g. Delhi, Noida, Gurugram)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full py-2 pr-2 text-xs sm:text-sm text-[#09265C] font-semibold bg-transparent border-none outline-none placeholder:text-slate-400 placeholder:font-normal"
          />
          <button
            type="button"
            onClick={handleDetectGPS}
            title="Detect GPS location"
            className="p-1.5 text-slate-400 hover:text-[#1264D6] transition-colors shrink-0"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin text-[#1264D6]" />
            ) : (
              <Navigation className="w-4 h-4 text-[#1264D6]" />
            )}
          </button>
        </div>

        {/* Attached Blue "Find a Worker" Button */}
        <button
          type="submit"
          className="w-full sm:w-auto px-6 py-2.5 sm:py-3 bg-[#1264D6] hover:bg-blue-700 text-white font-bold text-xs sm:text-sm rounded-lg sm:rounded-xl shadow-xs transition-all flex items-center justify-center shrink-0 tracking-wide"
        >
          Find a Worker
        </button>
      </div>
    </form>
  );
}
