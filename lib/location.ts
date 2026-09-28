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

  return Math.round(distance * 100) / 100; // Round to 2 decimal places for accuracy
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
  district?: string;
  state?: string;
  formattedAddress?: string;
}): string {
  const area = loc.area?.trim();
  const city = loc.city?.trim();
  const state = loc.state?.trim();

  if (area && city && area.toLowerCase() !== city.toLowerCase()) {
    return `${area}, ${city}`;
  }
  if (area && state && area.toLowerCase() !== state.toLowerCase()) {
    return `${area}, ${state}`;
  }
  if (city && state && city.toLowerCase() !== state.toLowerCase()) {
    return `${city}, ${state}`;
  }
  if (area) {
    return area;
  }
  if (city) {
    return city;
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
 * Known approximate coordinate map for key localities & cities
 */
export const LOCAL_COORDINATE_MAP: Record<string, { lat: number; lng: number; city: string; state: string; postalCode?: string; area?: string }> = {
  ravet: { lat: 18.648, lng: 73.748, city: 'Pimpri-Chinchwad', state: 'Maharashtra', postalCode: '412101', area: 'Ravet' },
  tathawade: { lat: 18.619, lng: 73.751, city: 'Pimpri-Chinchwad', state: 'Maharashtra', postalCode: '411033', area: 'Tathawade' },
  punawale: { lat: 18.630, lng: 73.740, city: 'Pimpri-Chinchwad', state: 'Maharashtra', postalCode: '411033', area: 'Punawale' },
  wakad: { lat: 18.599, lng: 73.769, city: 'Pimpri-Chinchwad', state: 'Maharashtra', postalCode: '411057', area: 'Wakad' },
  nigdi: { lat: 18.658, lng: 73.775, city: 'Pimpri-Chinchwad', state: 'Maharashtra', postalCode: '411044', area: 'Nigdi' },
  akurdi: { lat: 18.649, lng: 73.780, city: 'Pimpri-Chinchwad', state: 'Maharashtra', postalCode: '411035', area: 'Akurdi' },
  chinchwad: { lat: 18.627, lng: 73.800, city: 'Pimpri-Chinchwad', state: 'Maharashtra', postalCode: '411033', area: 'Chinchwad' },
  pimpri: { lat: 18.623, lng: 73.815, city: 'Pimpri-Chinchwad', state: 'Maharashtra', postalCode: '411018', area: 'Pimpri' },
  gahunje: { lat: 18.667, lng: 73.702, city: 'Pimpri-Chinchwad', state: 'Maharashtra', postalCode: '411033', area: 'Gahunje' },
  hinjawadi: { lat: 18.591, lng: 73.738, city: 'Pimpri-Chinchwad', state: 'Maharashtra', postalCode: '411057', area: 'Hinjawadi' },
  bhosari: { lat: 18.620, lng: 73.847, city: 'Pimpri-Chinchwad', state: 'Maharashtra', postalCode: '411026', area: 'Bhosari' },
  sangvi: { lat: 18.577, lng: 73.818, city: 'Pimpri-Chinchwad', state: 'Maharashtra', postalCode: '411027', area: 'Sangvi' },
  'pimpri-chinchwad': { lat: 18.627, lng: 73.800, city: 'Pimpri-Chinchwad', state: 'Maharashtra', postalCode: '411033', area: 'Pimpri-Chinchwad' },
  pune: { lat: 18.520, lng: 73.856, city: 'Pune', state: 'Maharashtra', postalCode: '411001', area: '' },
  surat: { lat: 21.170, lng: 72.831, city: 'Surat', state: 'Gujarat', postalCode: '395007', area: '' },
  adajan: { lat: 21.192, lng: 72.793, city: 'Surat', state: 'Gujarat', postalCode: '395009', area: 'Adajan' },
  vesu: { lat: 21.144, lng: 72.772, city: 'Surat', state: 'Gujarat', postalCode: '395007', area: 'Vesu' },
};

function cleanCityName(rawCity: string, addr: any): string {
  let cleaned = (rawCity || '').trim();

  // If city is a subdistrict/taluka like "Haveli Subdistrict" or "Mulshi Subdistrict"
  if (/subdistrict|taluka|tahsil|tehsil/i.test(cleaned) || !cleaned) {
    if (addr.city) return addr.city;
    if (addr.municipality) return addr.municipality;
    if (addr.town) return addr.town;

    const dist = (addr.state_district || addr.district || addr.county || '').replace(/\s+district/i, '').trim();
    const areaLower = (addr.suburb || addr.neighbourhood || addr.residential || addr.road || '').toLowerCase();

    const pcmcLocalities = ['ravet', 'tathawade', 'punawale', 'wakad', 'nigdi', 'akurdi', 'chinchwad', 'pimpri', 'gahunje', 'hinjawadi', 'bhosari', 'sangvi', 'thergaon'];
    if (pcmcLocalities.some((k) => areaLower.includes(k))) {
      return 'Pimpri-Chinchwad';
    }

    if (dist) return dist;
  }

  return cleaned;
}

/**
 * Reverse geocodes coordinates to an address using Nominatim with spatial fallback
 */
export async function reverseGeocode(lat: number, lng: number): Promise<{
  formattedAddress: string;
  city: string;
  state: string;
  district?: string;
  postalCode: string;
  area: string;
}> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1&zoom=18`;
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
      
      // Extract area/locality precisely without confusing city/suburb
      const area =
        addr.suburb ||
        addr.neighbourhood ||
        addr.residential ||
        addr.quarter ||
        addr.subdivision ||
        addr.locality ||
        addr.hamlet ||
        addr.road ||
        addr.village ||
        addr.commercial ||
        '';

      // Extract municipal city or corporation (Exclude suburb from city logic)
      const rawCity =
        addr.city ||
        addr.town ||
        addr.municipality ||
        addr.city_district ||
        addr.county ||
        addr.district ||
        '';

      const city = cleanCityName(rawCity, addr);
      const district = (addr.state_district || addr.district || addr.county || '').replace(/\s+district/i, '').trim();
      const state = addr.state || '';
      const postalCode = addr.postcode || '';

      const parts = [area, city, state, postalCode].filter(Boolean);
      const formattedAddress = data.display_name || parts.join(', ');

      return {
        formattedAddress,
        city,
        state,
        district,
        postalCode,
        area,
      };
    }
  } catch (err) {
    // Fallthrough to spatial coordinate map lookup
  }

  // Spatial lookup fallback: match closest known locality within 4.5 km
  let closestMatch: { name: string; dist: number; data: typeof LOCAL_COORDINATE_MAP['ravet'] } | null = null;
  for (const [key, item] of Object.entries(LOCAL_COORDINATE_MAP)) {
    const dist = calculateHaversineDistanceKm(lat, lng, item.lat, item.lng);
    if (dist <= 4.5 && (!closestMatch || dist < closestMatch.dist)) {
      closestMatch = { name: key, dist, data: item };
    }
  }

  if (closestMatch) {
    const item = closestMatch.data;
    const areaName = item.area || (closestMatch.name.charAt(0).toUpperCase() + closestMatch.name.slice(1));
    const displayName = `${areaName}, ${item.city}`;
    return {
      formattedAddress: `${displayName}, ${item.state}`,
      city: item.city,
      state: item.state,
      postalCode: item.postalCode || '',
      area: areaName,
    };
  }

  return {
    formattedAddress: `Location near (${lat.toFixed(4)}, ${lng.toFixed(4)})`,
    city: '',
    state: '',
    district: '',
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
  source: 'ip';
  isApproximate: boolean;
}> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000);

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
        const lat = data.latitude ? parseFloat(data.latitude.toFixed(6)) : null;
        const lng = data.longitude ? parseFloat(data.longitude.toFixed(6)) : null;
        const displayName = city && state ? `${city}, ${state} (Approximate)` : (city || 'Approximate Location');

        return {
          formattedAddress: displayName,
          city: city || 'Unknown City',
          state: state || '',
          postalCode,
          area: '',
          latitude: lat,
          longitude: lng,
          source: 'ip',
          isApproximate: true,
        };
      }
    }
  } catch {}

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000);

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
        const lat = data.lat ? parseFloat(data.lat.toFixed(6)) : null;
        const lng = data.lon ? parseFloat(data.lon.toFixed(6)) : null;
        const displayName = city && state ? `${city}, ${state} (Approximate)` : (city || 'Approximate Location');

        return {
          formattedAddress: displayName,
          city: city || 'Unknown City',
          state: state || '',
          postalCode,
          area: '',
          latitude: lat,
          longitude: lng,
          source: 'ip',
          isApproximate: true,
        };
      }
    }
  } catch {}

  return {
    formattedAddress: 'Pimpri-Chinchwad, Maharashtra (Approximate)',
    city: 'Pimpri-Chinchwad',
    state: 'Maharashtra',
    postalCode: '411033',
    area: '',
    latitude: 18.627,
    longitude: 73.800,
    source: 'ip',
    isApproximate: true,
  };
}

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
      const areaName = val.area || (key.charAt(0).toUpperCase() + key.slice(1));
      return {
        formattedAddress: `${areaName}, ${val.city}, ${val.state}`,
        city: val.city,
        state: val.state,
        postalCode: val.postalCode || '',
        area: areaName,
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
            addr.municipality ||
            addr.city_district ||
            addr.county ||
            cand.split(',')[0].trim();
          const state = addr.state || '';
          const area = addr.suburb || addr.neighbourhood || addr.residential || addr.road || queryParts[0] || '';

          return {
            formattedAddress: item.display_name || cleanQuery,
            city: cleanCityName(city, addr),
            state,
            postalCode: addr.postcode || '',
            area,
            latitude: parseFloat(item.lat),
            longitude: parseFloat(item.lon),
          };
        }
      }
    } catch {}
  }

  return null;
}
