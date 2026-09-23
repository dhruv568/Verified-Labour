'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { formatLocationDisplayName } from '@/lib/location';

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

const DEFAULT_EMPTY_LOCATION: LocationData = {
  displayName: 'Select location',
  city: '',
  state: '',
  area: '',
  formattedAddress: '',
  postalCode: '',
  latitude: null,
  longitude: null,
  isConfirmed: false,
  source: 'default',
};

const LocationContext = createContext<LocationContextType | undefined>(undefined);

export function LocationProvider({ children }: { children: ReactNode }) {
  const [location, setLocation] = useState<LocationData>(DEFAULT_EMPTY_LOCATION);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [permissionState, setPermissionState] = useState<
    'idle' | 'prompt' | 'granted' | 'denied' | 'unavailable'
  >('idle');

  // Detect current location via browser navigator.geolocation
  const detectCurrentLocation = async (): Promise<boolean> => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      setError('Geolocation is not supported by your browser.');
      setPermissionState('unavailable');
      return false;
    }

    setIsLoading(true);
    setError(null);
    setPermissionState('prompt');

    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const { latitude, longitude } = position.coords;
            setPermissionState('granted');

            const res = await fetch(`/api/location/reverse?lat=${latitude}&lng=${longitude}`);
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
              displayName: displayName !== 'Select location' ? displayName : 'Current Location',
              city,
              state,
              area,
              formattedAddress: formattedAddress || displayName,
              postalCode,
              latitude,
              longitude,
              isConfirmed: true,
              source: 'geolocation',
            };

            setLocation(newLoc);
            try {
              localStorage.setItem(STORAGE_KEY, JSON.stringify(newLoc));
            } catch {}

            setIsLoading(false);
            resolve(true);
          } catch {
            setError('Failed to resolve address from coordinates.');
            setIsLoading(false);
            resolve(false);
          }
        },
        (geoErr) => {
          setIsLoading(false);
          if (geoErr.code === geoErr.PERMISSION_DENIED) {
            setPermissionState('denied');
            setError('Location permission was denied in your browser.');
          } else if (geoErr.code === geoErr.TIMEOUT) {
            setPermissionState('unavailable');
            setError('Location request timed out. Please enter your location manually.');
          } else {
            setPermissionState('unavailable');
            setError('Location information is unavailable. Please enter your location manually.');
          }
          resolve(false);
        },
        { timeout: 10000, enableHighAccuracy: true, maximumAge: 60000 }
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
      latitude: manualData.latitude ?? null,
      longitude: manualData.longitude ?? null,
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
    setLocation(DEFAULT_EMPTY_LOCATION);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {}
  };

  // Auto-detect on initial mount
  useEffect(() => {
    // 1. Check if user already has a saved location in localStorage
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.displayName) {
          setLocation({
            ...parsed,
            source: 'cached',
          });
          setPermissionState('granted');
          return;
        }
      }
    } catch {}

    // 2. If no saved location, request browser geolocation permission
    detectCurrentLocation();
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
