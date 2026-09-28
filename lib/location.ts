/**
 * Location, Geocoding, and Haversine Distance Calculation Utilities
 */

/**
 * Calculates the great-circle distance between two points on the Earth's surface
 * using the Haversine formula. Returns distance in Kilometers.
 */
export function calculateHaversineDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return Math.round(distance * 10) / 10; // Round to 1 decimal place
}

function toRad(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

/**
 * Formats a distance into a human-friendly string
 */
export function formatDistance(distanceKm: number | null | undefined): string {
  if (distanceKm === null || distanceKm === undefined) return 'Nearby';
  if (distanceKm < 1) {
    const meters = Math.round(distanceKm * 1000);
    return `${meters} m away`;
  }
  return `${distanceKm.toFixed(1)} km away`;
}

/**
 * Sanitizes a worker profile for public customer discovery:
 * - Worker's exact base coordinates are NEVER exposed publicly!
 * - Returns only approximate distance and service areas.
 */
export function sanitizeWorkerForPublic(worker: any, customerLat?: number, customerLng?: number) {
  let distanceKm: number | null = null;
  if (
    customerLat !== undefined &&
    customerLng !== undefined &&
    worker.latitude !== null &&
    worker.longitude !== null
  ) {
    distanceKm = calculateHaversineDistanceKm(
      customerLat,
      customerLng,
      worker.latitude,
      worker.longitude
    );
  }

  // Calculate rating summary
  const reviews = worker.reviews || [];
  const reviewCount = reviews.length;
  const avgRating = reviewCount > 0
    ? Math.round((reviews.reduce((acc: number, r: any) => acc + r.rating, 0) / reviewCount) * 10) / 10
    : 5.0;

  return {
    id: worker.id,
    fullName: worker.fullName,
    avatarUrl: worker.status === 'VERIFIED' || worker.status === 'ACTIVE' ? worker.avatarUrl : null,
    bio: worker.bio,
    experienceYears: worker.experienceYears,
    status: worker.status,
    isAvailable: worker.isAvailable,
    hourlyRate: worker.hourlyRate,
    city: worker.city,
    state: worker.state,
    primaryCategory: worker.primaryCategory,
    skills: worker.skills,
    serviceAreas: worker.serviceAreas ? worker.serviceAreas.map((sa: any) => sa.areaName) : [],
    distanceKm,
    formattedDistance: formatDistance(distanceKm),
    badges: {
      isIdentityVerified: worker.identityVerified || (worker.aadhaarVerif && worker.aadhaarVerif.status === 'VERIFIED'),
      isBankVerified: worker.bankVerified || (worker.bankVerif && worker.bankVerif.status === 'VERIFIED'),
      isSkillVerified: worker.skillVerified,
      isFullyVerified: worker.status === 'VERIFIED',
    },
    rating: avgRating,
    reviewCount,
    // Sensitive fields omitted: latitude, longitude, postalCode, aadhaarVerif, bankVerif
  };
}

export function formatLocationDisplayName(loc: {
  area?: string;
  city?: string;
  state?: string;
  formattedAddress?: string;
}): string {
  const area = loc.area?.trim();
  const city = loc.city?.trim();
  const state = loc.state?.trim();

  if (area && city && area.toLowerCase() !== city.toLowerCase()) {
    return `${area}, ${city}`;
  }
  if (city && state && city.toLowerCase() !== state.toLowerCase()) {
    return `${city}, ${state}`;
  }
  if (city) {
    return city;
  }
  if (area) {
    return area;
  }
  if (loc.formattedAddress) {
    const parts = loc.formattedAddress.split(',').map((p) => p.trim()).filter(Boolean);
    if (parts.length >= 2) {
      return `${parts[0]}, ${parts[1]}`;
    }
    if (parts.length === 1) {
      return parts[0];
    }
  }
  return 'Select location';
}

/**
 * Reverse geocodes coordinates to an address using OpenStreetMap / Nominatim
 */
export async function reverseGeocode(lat: number, lng: number): Promise<{
  formattedAddress: string;
  city: string;
  state: string;
  postalCode: string;
  area: string;
}> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`;
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'VerifiedLabour/1.0 (info@verifiedlabour.com)',
      },
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      const addr = data.address || {};
      const city =
        addr.city ||
        addr.town ||
        addr.village ||
        addr.municipality ||
        addr.city_district ||
        addr.suburb ||
        addr.district ||
        addr.county ||
        '';
      const state = addr.state || '';
      const postalCode = addr.postcode || '';
      const area =
        addr.suburb ||
        addr.neighbourhood ||
        addr.residential ||
        addr.subdivision ||
        addr.road ||
        addr.hamlet ||
        '';

      const parts = [area, city, state, postalCode].filter(Boolean);
      const formattedAddress = data.display_name || parts.join(', ');

      return {
        formattedAddress,
        city,
        state,
        postalCode,
        area,
      };
    }
  } catch (err) {
    // Graceful fallback if external geocoder times out or fails
  }

  // Graceful fallback without hardcoded city
  return {
    formattedAddress: `Location near (${lat.toFixed(3)}, ${lng.toFixed(3)})`,
    city: '',
    state: '',
    postalCode: '',
    area: '',
  };
}

/**
 * Detects approximate location using server-side IP lookup as a fallback
 * when browser Geolocation is denied or unavailable.
 */
export async function detectLocationFromIP(): Promise<{
  formattedAddress: string;
  city: string;
  state: string;
  postalCode: string;
  area: string;
  latitude: number | null;
  longitude: number | null;
}> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 1500);

    const res = await fetch('https://ipwho.is/', {
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      if (data.success) {
        const city = data.city || '';
        const state = data.region || '';
        const postalCode = data.postal || '';
        const lat = data.latitude ? parseFloat(data.latitude.toFixed(3)) : null;
        const lng = data.longitude ? parseFloat(data.longitude.toFixed(3)) : null;
        const displayName = city && state ? `${city}, ${state}` : city || 'Surat, Gujarat';

        return {
          formattedAddress: displayName,
          city: city || 'Surat',
          state: state || 'Gujarat',
          postalCode,
          area: '',
          latitude: lat,
          longitude: lng,
        };
      }
    }
  } catch {}

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 1500);

    const res = await fetch('https://ip-api.com/json/?fields=status,city,regionName,zip,lat,lon', {
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      if (data.status === 'success') {
        const city = data.city || '';
        const state = data.regionName || '';
        const postalCode = data.postalCode || data.zip || '';
        const lat = data.lat ? parseFloat(data.lat.toFixed(3)) : null;
        const lng = data.lon ? parseFloat(data.lon.toFixed(3)) : null;
        const displayName = city && state ? `${city}, ${state}` : city || 'Surat, Gujarat';

        return {
          formattedAddress: displayName,
          city: city || 'Surat',
          state: state || 'Gujarat',
          postalCode,
          area: '',
          latitude: lat,
          longitude: lng,
        };
      }
    }
  } catch {}

  return {
    formattedAddress: 'Surat, Gujarat',
    city: 'Surat',
    state: 'Gujarat',
    postalCode: '395007',
    area: '',
    latitude: 21.170,
    longitude: 72.831,
  };
}

/**
 * Known approximate coordinate map for key localities & cities
 */
const LOCAL_COORDINATE_MAP: Record<string, { lat: number; lng: number; city: string; state: string; postalCode?: string }> = {
  gahunje: { lat: 18.667, lng: 73.702, city: 'Pimpri-Chinchwad', state: 'Maharashtra', postalCode: '411033' },
  ravet: { lat: 18.648, lng: 73.748, city: 'Pimpri-Chinchwad', state: 'Maharashtra', postalCode: '412101' },
  tathawade: { lat: 18.619, lng: 73.751, city: 'Pimpri-Chinchwad', state: 'Maharashtra', postalCode: '411033' },
  wakad: { lat: 18.599, lng: 73.769, city: 'Pimpri-Chinchwad', state: 'Maharashtra', postalCode: '411057' },
  punawale: { lat: 18.630, lng: 73.740, city: 'Pimpri-Chinchwad', state: 'Maharashtra', postalCode: '411033' },
  nigdi: { lat: 18.658, lng: 73.775, city: 'Pimpri-Chinchwad', state: 'Maharashtra', postalCode: '411044' },
  akurdi: { lat: 18.649, lng: 73.780, city: 'Pimpri-Chinchwad', state: 'Maharashtra', postalCode: '411035' },
  chinchwad: { lat: 18.627, lng: 73.800, city: 'Pimpri-Chinchwad', state: 'Maharashtra', postalCode: '411033' },
  pimpri: { lat: 18.623, lng: 73.815, city: 'Pimpri-Chinchwad', state: 'Maharashtra', postalCode: '411018' },
  'pimpri-chinchwad': { lat: 18.627, lng: 73.800, city: 'Pimpri-Chinchwad', state: 'Maharashtra', postalCode: '411033' },
  pune: { lat: 18.520, lng: 73.856, city: 'Pune', state: 'Maharashtra', postalCode: '411001' },
  surat: { lat: 21.170, lng: 72.831, city: 'Surat', state: 'Gujarat', postalCode: '395007' },
  adajan: { lat: 21.192, lng: 72.793, city: 'Surat', state: 'Gujarat', postalCode: '395009' },
  vesu: { lat: 21.144, lng: 72.772, city: 'Surat', state: 'Gujarat', postalCode: '395007' },
};

/**
 * Forward geocodes a location text query to coordinates & structured address details.
 * Performs multi-stage token matching and fallback lookup.
 */
export async function forwardGeocode(query: string): Promise<{
  formattedAddress: string;
  city: string;
  state: string;
  postalCode: string;
  area: string;
  latitude: number;
  longitude: number;
} | null> {
  const cleanQuery = query.trim();
  if (!cleanQuery) return null;

  // 1. Check local lookup dictionary for known locality tokens
  const lowerQuery = cleanQuery.toLowerCase();
  for (const [key, val] of Object.entries(LOCAL_COORDINATE_MAP)) {
    if (lowerQuery.includes(key)) {
      return {
        formattedAddress: cleanQuery,
        city: val.city,
        state: val.state,
        postalCode: val.postalCode || '',
        area: key.charAt(0).toUpperCase() + key.slice(1),
        latitude: val.lat,
        longitude: val.lng,
      };
    }
  }

  // 2. Try Nominatim candidate queries
  const queryParts = cleanQuery.split(',').map((p) => p.trim()).filter(Boolean);
  const candidates = [cleanQuery];
  if (queryParts.length > 1) {
    for (let i = 1; i < queryParts.length; i++) {
      candidates.push(queryParts.slice(i).join(', '));
    }
  }

  for (const cand of candidates) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2500);

      const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(cand)}&format=json&addressdetails=1&limit=1`;
      const res = await fetch(url, {
        headers: { 'User-Agent': 'VerifiedLabour/1.0 (info@verifiedlabour.com)' },
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

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
            cand.split(',')[0].trim();
          const state = addr.state || '';
          const area = addr.suburb || addr.neighbourhood || addr.residential || addr.road || queryParts[0] || '';

          return {
            formattedAddress: item.display_name || cleanQuery,
            city,
            state,
            postalCode: addr.postcode || '',
            area,
            latitude: parseFloat(parseFloat(item.lat).toFixed(3)),
            longitude: parseFloat(parseFloat(item.lon).toFixed(3)),
          };
        }
      }
    } catch {}
  }

  return null;
}



