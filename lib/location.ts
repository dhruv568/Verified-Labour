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
    avatarUrl: worker.avatarUrl,
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
