'use client';

import React, { useEffect, useRef, useState } from 'react';
import { MapPin, Navigation, Clock, ShieldCheck, AlertCircle } from 'lucide-react';
import { formatDistance } from '@/lib/location';

interface LiveJobMapProps {
  customerLocation: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  workerLocation: {
    latitude: number;
    longitude: number;
    accuracy?: number | null;
    updatedAt?: string;
  } | null;
  workerName: string;
  status: string;
  distanceKm?: number | null;
}

export default function LiveJobMap({
  customerLocation,
  workerLocation,
  workerName,
  status,
  distanceKm,
}: LiveJobMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const leafletMapRef = useRef<any>(null);
  const customerMarkerRef = useRef<any>(null);
  const workerMarkerRef = useRef<any>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [scriptError, setScriptError] = useState(false);

  // Load Leaflet CSS & JS from CDN safely in browser environment
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Load Leaflet CSS if not already injected
    if (!document.getElementById('leaflet-css')) {
      const link = document.createElement('link');
      link.id = 'leaflet-css';
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
    }

    // Load Leaflet JS script if not already present
    if ((window as any).L) {
      setMapLoaded(true);
      return;
    }

    const script = document.createElement('script');
    script.id = 'leaflet-js';
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    script.async = true;
    script.onload = () => setMapLoaded(true);
    script.onerror = () => setScriptError(true);
    document.body.appendChild(script);
  }, []);

  // Initialize and update Leaflet map markers
  useEffect(() => {
    if (!mapLoaded || !mapContainerRef.current || typeof window === 'undefined') return;
    const L = (window as any).L;
    if (!L) return;

    const cLat = customerLocation.latitude;
    const cLng = customerLocation.longitude;

    if (!leafletMapRef.current) {
      // Create Leaflet map instance
      const map = L.map(mapContainerRef.current, {
        zoomControl: true,
        attributionControl: false,
      }).setView([cLat, cLng], 14);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
      }).addTo(map);

      // Customer marker
      const customerIcon = L.divIcon({
        className: 'custom-customer-pin',
        html: `<div style="background:#0F2A5F;color:white;width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;border:2px solid white;box-shadow:0 3px 8px rgba(0,0,0,0.3);"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg></div>`,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      });

      customerMarkerRef.current = L.marker([cLat, cLng], { icon: customerIcon })
        .addTo(map)
        .bindPopup(`<b>Service Location</b><br/>${customerLocation.address || 'Destination'}`);

      leafletMapRef.current = map;
    } else {
      customerMarkerRef.current.setLatLng([cLat, cLng]);
    }

    const map = leafletMapRef.current;

    // Worker marker update
    if (workerLocation && workerLocation.latitude && workerLocation.longitude) {
      const wLat = workerLocation.latitude;
      const wLng = workerLocation.longitude;

      const workerIcon = L.divIcon({
        className: 'custom-worker-pin',
        html: `<div style="background:#08783b;color:white;width:36px;height:36px;border-radius:50%;display:flex;align-items:center;justify-content:center;border:2.5px solid white;box-shadow:0 4px 10px rgba(8,120,59,0.4);"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="3 11 22 2 13 21 11 13 3 11"/></svg></div>`,
        iconSize: [36, 36],
        iconAnchor: [18, 18],
      });

      if (!workerMarkerRef.current) {
        workerMarkerRef.current = L.marker([wLat, wLng], { icon: workerIcon })
          .addTo(map)
          .bindPopup(`<b>${workerName}</b><br/>On The Way`);
      } else {
        workerMarkerRef.current.setLatLng([wLat, wLng]);
      }

      // Auto fit bounds to show both customer and worker pins
      const bounds = L.latLngBounds([
        [cLat, cLng],
        [wLat, wLng],
      ]);
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 16 });
    }
  }, [mapLoaded, customerLocation, workerLocation, workerName]);

  const lastUpdatedFormatted = workerLocation?.updatedAt
    ? new Date(workerLocation.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    : null;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden space-y-0">
      {/* Map Header Status Banner */}
      <div className="p-3.5 bg-navy-900 text-white flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
          <span className="font-bold">{workerName} is On The Way</span>
        </div>
        <div className="flex items-center gap-3 font-semibold text-slate-200 text-[11px]">
          {distanceKm !== undefined && distanceKm !== null && (
            <span className="bg-navy-800 px-2.5 py-1 rounded-lg border border-navy-700">
              {formatDistance(distanceKm)}
            </span>
          )}
          {lastUpdatedFormatted ? (
            <span className="text-slate-300">Updated: {lastUpdatedFormatted}</span>
          ) : (
            <span className="text-amber-300 animate-pulse">Waiting for GPS location...</span>
          )}
        </div>
      </div>

      {/* Map Canvas / Fallback Container */}
      <div className="relative w-full h-[280px] sm:h-[320px] bg-slate-100">
        <div ref={mapContainerRef} className="w-full h-full z-0" />

        {/* Fallback Display if Leaflet JS loading fails */}
        {scriptError && (
          <div className="absolute inset-0 bg-slate-50 flex flex-col items-center justify-center p-6 text-center space-y-2">
            <Navigation className="w-10 h-10 text-brand-600 animate-bounce" />
            <h4 className="font-bold text-slate-800 text-sm">Live Location Active</h4>
            <p className="text-xs text-slate-500 max-w-xs">
              Worker <strong>{workerName}</strong> is travelling to your location.
              {distanceKm !== undefined && distanceKm !== null && ` Currently ${formatDistance(distanceKm)}.`}
            </p>
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-600">
        <span className="flex items-center gap-1 font-medium">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Private job-specific location sharing
        </span>
        <span className="text-slate-400">OpenStreetMap Live Tracker</span>
      </div>
    </div>
  );
}
