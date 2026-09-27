'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { formatLocationDisplayName } from '@/lib/location';
import { fetchWithTimeout } from '@/lib/fetch-utils';

export interface LocationData {
  displayName: string;
  city: string;
  state?: string;
  area?: string;
  formattedAddress: string;
  postalCode?: string;
  latitude: number | null;
  longitude: number | null;
  isConfirmed: boolean;
  source: 'geolocation' | 'manual' | 'cached' | 'default';
}

export interface LocationContextType {
  location: LocationData;
  isLoading: boolean;
  error: string | null;
  permissionState: 'idle' | 'prompt' | 'granted' | 'denied' | 'unavailable';
  detectCurrentLocation: () => Promise<boolean>;
  setManualLocation: (loc: Partial<LocationData> & { displayName: string }) => void;
  clearLocation: () => void;
}

const STORAGE_KEY = 'vl_user_location';

const DEFAULT_FALLBACK_LOCATION: LocationData = {
  displayName: 'Surat, Gujarat',
  city: 'Surat',
  state: 'Gujarat',
  area: '',
  formattedAddress: 'Surat, Gujarat',
  postalCode: '395007',
  latitude: 21.170,
  longitude: 72.831,
  isConfirmed: true,
  source: 'default',
};

const LocationContext = createContext<LocationContextType | undefined>(undefined);

export function LocationProvider({ children }: { children: ReactNode }) {
  const [location, setLocation] = useState<LocationData>(DEFAULT_FALLBACK_LOCATION);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [permissionState, setPermissionState] = useState<
    'idle' | 'prompt' | 'granted' | 'denied' | 'unavailable'
  >('idle');

  const fallbackToIPLocation = async (): Promise<LocationData> => {
    try {
      const res = await fetchWithTimeout('/api/location/ip', { timeoutMs: 3000 });
      const json = await res.json();
      if (json.success && json.data) {
        const d = json.data;
        const displayName = d.formattedAddress || (d.city && d.state ? `${d.city}, ${d.state}` : d.city || 'Surat, Gujarat');
        const loc: LocationData = {
          displayName,
          city: d.city || 'Surat',
          state: d.state || 'Gujarat',
          area: d.area || '',
          formattedAddress: d.formattedAddress || displayName,
          postalCode: d.postalCode || '',
          latitude: d.latitude ? parseFloat(d.latitude.toFixed(3)) : null,
          longitude: d.longitude ? parseFloat(d.longitude.toFixed(3)) : null,
          isConfirmed: true,
          source: 'geolocation',
        };
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(loc));
        } catch {}
        return loc;
      }
    } catch {}

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_FALLBACK_LOCATION));
    } catch {}
    return DEFAULT_FALLBACK_LOCATION;
  };

  // Detect current location via browser navigator.geolocation
  const detectCurrentLocation = async (opts?: { silent?: boolean; userInitiated?: boolean }): Promise<boolean> => {
    const isSilent = opts?.silent ?? false;
    const isUserInitiated = opts?.userInitiated ?? !isSilent;

    if (!isSilent) {
      setIsLoading(true);
    }
    setError(null);

    if (typeof window === 'undefined' || !navigator.geolocation) {
      if (isUserInitiated) {
        setError('Geolocation is not supported by your browser. Used IP fallback.');
      }
      setPermissionState('unavailable');
      const ipLoc = await fallbackToIPLocation();
      setLocation(ipLoc);
      if (!isSilent) setIsLoading(false);
      return true;
    }

    setPermissionState('prompt');

    return new Promise((resolve) => {
      let isSettled = false;
      const finish = (result: boolean) => {
        if (isSettled) return;
        isSettled = true;
        if (!isSilent) setIsLoading(false);
        resolve(result);
      };

      // Safety timeout: abort if browser geolocation modal hangs
      const timer = setTimeout(async () => {
        if (isSettled) return;
        setPermissionState('unavailable');
        const ipLoc = await fallbackToIPLocation();
        setLocation(ipLoc);
        finish(true);
      }, 3500);

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const { latitude, longitude } = position.coords;
            const roundLat = parseFloat(latitude.toFixed(3));
            const roundLng = parseFloat(longitude.toFixed(3));
            setPermissionState('granted');

            const res = await fetchWithTimeout(`/api/location/reverse?lat=${roundLat}&lng=${roundLng}`, { timeoutMs: 3000 });
            const json = await res.json();

            let area = '';
            let city = '';
            let state = '';
            let postalCode = '';
            let formattedAddress = '';

            if (json.success && json.data) {
              area = json.data.area || '';
              city = json.data.city || '';
              state = json.data.state || '';
              postalCode = json.data.postalCode || '';
              formattedAddress = json.data.formattedAddress || '';
            }

            const displayName = formatLocationDisplayName({ area, city, state, formattedAddress });

            const newLoc: LocationData = {
              displayName: displayName !== 'Select location' ? displayName : `${city || 'Surat'}, ${state || 'Gujarat'}`,
              city: city || 'Surat',
              state,
              area,
              formattedAddress: formattedAddress || displayName,
              postalCode,
              latitude: roundLat,
              longitude: roundLng,
              isConfirmed: true,
              source: 'geolocation',
            };

            setLocation(newLoc);
            try {
              localStorage.setItem(STORAGE_KEY, JSON.stringify(newLoc));
            } catch {}
          } catch {
            const ipLoc = await fallbackToIPLocation();
            setLocation(ipLoc);
          } finally {
            clearTimeout(timer);
            finish(true);
          }
        },
        async (geoErr) => {
          clearTimeout(timer);
          if (geoErr.code === geoErr.PERMISSION_DENIED) {
            setPermissionState('denied');
          } else {
            setPermissionState('unavailable');
          }
          const ipLoc = await fallbackToIPLocation();
          setLocation(ipLoc);
          finish(true);
        },
        { timeout: 3500, enableHighAccuracy: false, maximumAge: 300000 }
      );
    });
  };

  // Set manual location
  const setManualLocation = (manualData: Partial<LocationData> & { displayName: string }) => {
    const updated: LocationData = {
      displayName: manualData.displayName,
      city: manualData.city || manualData.displayName.split(',')[0].trim(),
      state: manualData.state || '',
      area: manualData.area || '',
      formattedAddress: manualData.formattedAddress || manualData.displayName,
      postalCode: manualData.postalCode || '',
      latitude: manualData.latitude ? parseFloat(manualData.latitude.toFixed(3)) : null,
      longitude: manualData.longitude ? parseFloat(manualData.longitude.toFixed(3)) : null,
      isConfirmed: true,
      source: 'manual',
    };

    setLocation(updated);
    setError(null);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch {}
  };

  // Clear location
  const clearLocation = () => {
    setLocation(DEFAULT_FALLBACK_LOCATION);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {}
  };

  // Non-blocking location check on initial mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.displayName && parsed.displayName !== 'Select location') {
          setLocation({
            ...parsed,
            source: 'cached',
          });
          setPermissionState('granted');
          return;
        }
      }
    } catch {}

    // Non-blocking background detection after initial page render
    const idleId = setTimeout(() => {
      detectCurrentLocation({ silent: true });
    }, 1000);

    return () => clearTimeout(idleId);
  }, []);

  return (
    <LocationContext.Provider
      value={{
        location,
        isLoading,
        error,
        permissionState,
        detectCurrentLocation,
        setManualLocation,
        clearLocation,
      }}
    >
      {children}
    </LocationContext.Provider>
  );
}

export function useLocation() {
  const context = useContext(LocationContext);
  if (!context) {
    throw new Error('useLocation must be used within a LocationProvider');
  }
  return context;
}
