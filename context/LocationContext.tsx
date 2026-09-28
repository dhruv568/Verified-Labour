'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { formatLocationDisplayName } from '@/lib/location';
import { fetchWithTimeout } from '@/lib/fetch-utils';

export interface LocationData {
  displayName: string;
  city: string;
  state?: string;
  area?: string;
  district?: string;
  formattedAddress: string;
  postalCode?: string;
  latitude: number | null;
  longitude: number | null;
  accuracy: number | null; // in meters
  isConfirmed: boolean;
  source: 'gps' | 'ip' | 'manual' | 'cached' | 'default';
  isHighAccuracy?: boolean;
}

export interface LocationContextType {
  location: LocationData;
  isLoading: boolean;
  error: string | null;
  permissionState: 'idle' | 'prompt' | 'granted' | 'denied' | 'unavailable';
  detectCurrentLocation: (opts?: { silent?: boolean; userInitiated?: boolean }) => Promise<boolean>;
  setManualLocation: (loc: Partial<LocationData> & { displayName: string }) => void;
  clearLocation: () => void;
}

const STORAGE_KEY = 'vl_user_location';

const DEFAULT_FALLBACK_LOCATION: LocationData = {
  displayName: 'Pimpri-Chinchwad, Maharashtra',
  city: 'Pimpri-Chinchwad',
  state: 'Maharashtra',
  area: '',
  district: 'Pune',
  formattedAddress: 'Pimpri-Chinchwad, Maharashtra',
  postalCode: '411033',
  latitude: 18.627,
  longitude: 73.800,
  accuracy: null,
  isConfirmed: true,
  source: 'default',
  isHighAccuracy: false,
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
      const res = await fetchWithTimeout('/api/location/ip', { timeoutMs: 2500 });
      const json = await res.json();
      if (json.success && json.data) {
        const d = json.data;
        const displayName = d.formattedAddress || (d.city && d.state ? `${d.city}, ${d.state}` : d.city || 'Pimpri-Chinchwad, Maharashtra');
        const loc: LocationData = {
          displayName,
          city: d.city || 'Pimpri-Chinchwad',
          state: d.state || 'Maharashtra',
          area: d.area || '',
          district: d.district || '',
          formattedAddress: d.formattedAddress || displayName,
          postalCode: d.postalCode || '',
          latitude: d.latitude ? d.latitude : null,
          longitude: d.longitude ? d.longitude : null,
          accuracy: 5000, // IP location accuracy is low (~5 km)
          isConfirmed: true,
          source: 'ip',
          isHighAccuracy: false,
        };
        return loc;
      }
    } catch {}

    return DEFAULT_FALLBACK_LOCATION;
  };

  // Detect current location via browser navigator.geolocation
  const detectCurrentLocation = React.useCallback(
    async (opts?: { silent?: boolean; userInitiated?: boolean }): Promise<boolean> => {
      const isSilent = opts?.silent ?? false;
      const isUserInitiated = opts?.userInitiated ?? !isSilent;

      if (!isSilent) {
        setIsLoading(true);
      }
      setError(null);

      if (typeof window === 'undefined' || !navigator.geolocation) {
        if (isUserInitiated) {
          setError('Geolocation is not supported by your browser. Using approximate fallback.');
        }
        setPermissionState('unavailable');
        const ipLoc = await fallbackToIPLocation();
        setLocation((prev) => (prev.source === 'manual' && !isUserInitiated ? prev : ipLoc));
        if (!isSilent) setIsLoading(false);
        return false;
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

        // Safety timeout: abort if browser geolocation modal hangs or takes longer than 10 seconds
        const timer = setTimeout(async () => {
          if (isSettled) return;
          setPermissionState('unavailable');
          if (isUserInitiated) {
            setError('GPS request timed out. Falling back to approximate location.');
          }
          const ipLoc = await fallbackToIPLocation();
          setLocation((prev) => (prev.source === 'manual' && !isUserInitiated ? prev : ipLoc));
          finish(false);
        }, 10000);

        const geoOptions: PositionOptions = {
          enableHighAccuracy: true,
          timeout: 9500,
          maximumAge: isUserInitiated ? 0 : 30000,
        };

        navigator.geolocation.getCurrentPosition(
          async (position) => {
            try {
              const { latitude, longitude, accuracy } = position.coords;
              const isHighAccuracy = accuracy <= 200; // Accurate within 200 meters

              setPermissionState('granted');

              const res = await fetchWithTimeout(
                `/api/location/reverse?lat=${latitude}&lng=${longitude}`,
                { timeoutMs: 4000 }
              );
              const json = await res.json();

              let area = '';
              let city = '';
              let state = '';
              let district = '';
              let postalCode = '';
              let formattedAddress = '';

              if (json.success && json.data) {
                area = json.data.area || '';
                city = json.data.city || '';
                state = json.data.state || '';
                district = json.data.district || '';
                postalCode = json.data.postalCode || '';
                formattedAddress = json.data.formattedAddress || '';
              }

              const displayName = formatLocationDisplayName({ area, city, district, state, formattedAddress });

              const newLoc: LocationData = {
                displayName: displayName !== 'Select location' ? displayName : `${city || 'Pimpri-Chinchwad'}, ${state || 'Maharashtra'}`,
                city: city || 'Pimpri-Chinchwad',
                state,
                area,
                district,
                formattedAddress: formattedAddress || displayName,
                postalCode,
                latitude,
                longitude,
                accuracy: Math.round(accuracy),
                isConfirmed: true,
                source: 'gps',
                isHighAccuracy,
              };

              setLocation(newLoc);
              try {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(newLoc));
              } catch {}
              finish(true);
            } catch {
              const ipLoc = await fallbackToIPLocation();
              setLocation((prev) => (prev.source === 'manual' && !isUserInitiated ? prev : ipLoc));
              finish(false);
            } finally {
              clearTimeout(timer);
            }
          },
          async (geoErr) => {
            clearTimeout(timer);
            if (geoErr.code === geoErr.PERMISSION_DENIED) {
              setPermissionState('denied');
              if (isUserInitiated) {
                setError('Location permission denied. Please search or set your locality manually.');
              }
            } else {
              setPermissionState('unavailable');
              if (isUserInitiated) {
                setError('Unable to acquire GPS signal. Using approximate fallback.');
              }
            }

            // Only fallback to IP if user didn't already set a manual location
            const ipLoc = await fallbackToIPLocation();
            setLocation((prev) => (prev.source === 'manual' && !isUserInitiated ? prev : ipLoc));
            finish(false);
          },
          geoOptions
        );
      });
    },
    []
  );

  // Set manual location (Never overwritten by background auto-detection)
  const setManualLocation = React.useCallback(
    (manualData: Partial<LocationData> & { displayName: string }) => {
      const updated: LocationData = {
        displayName: manualData.displayName,
        city: manualData.city || manualData.displayName.split(',')[0].trim(),
        state: manualData.state || '',
        area: manualData.area || '',
        district: manualData.district || '',
        formattedAddress: manualData.formattedAddress || manualData.displayName,
        postalCode: manualData.postalCode || '',
        latitude: manualData.latitude !== undefined && manualData.latitude !== null ? manualData.latitude : null,
        longitude: manualData.longitude !== undefined && manualData.longitude !== null ? manualData.longitude : null,
        accuracy: null,
        isConfirmed: true,
        source: 'manual',
        isHighAccuracy: true,
      };

      setLocation(updated);
      setError(null);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch {}
    },
    []
  );

  // Clear location
  const clearLocation = React.useCallback(() => {
    setLocation(DEFAULT_FALLBACK_LOCATION);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {}
  }, []);

  // Fast non-blocking location check on initial mount
  useEffect(() => {
    let loadedLoc: LocationData | null = null;
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.displayName && parsed.displayName !== 'Select location') {
          const locToSet: LocationData = {
            ...parsed,
            source: parsed.source || 'cached',
          };
          loadedLoc = locToSet;
          setLocation(locToSet);
        }
      }
    } catch {}

    // Check navigator permission status asynchronously without blocking page render
    if (typeof window !== 'undefined' && 'permissions' in navigator && navigator.permissions.query) {
      navigator.permissions
        .query({ name: 'geolocation' })
        .then((permissionStatus) => {
          setPermissionState(permissionStatus.state as any);

          permissionStatus.onchange = () => {
            setPermissionState(permissionStatus.state as any);
            if (permissionStatus.state === 'granted') {
              detectCurrentLocation({ silent: true, userInitiated: false });
            }
          };

          // If permission is granted and user hasn't explicitly set a manual location, do a silent background GPS update
          if (permissionStatus.state === 'granted' && loadedLoc?.source !== 'manual') {
            detectCurrentLocation({ silent: true, userInitiated: false });
          }
        })
        .catch(() => {});
    }
  }, [detectCurrentLocation]);

  const value = React.useMemo(
    () => ({
      location,
      isLoading,
      error,
      permissionState,
      detectCurrentLocation,
      setManualLocation,
      clearLocation,
    }),
    [location, isLoading, error, permissionState, detectCurrentLocation, setManualLocation, clearLocation]
  );

  return <LocationContext.Provider value={value}>{children}</LocationContext.Provider>;
}

export function useLocation() {
  const context = useContext(LocationContext);
  if (!context) {
    throw new Error('useLocation must be used within a LocationProvider');
  }
  return context;
}
