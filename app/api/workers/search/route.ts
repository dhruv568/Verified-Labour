import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { calculateHaversineDistanceKm, sanitizeWorkerForPublic, forwardGeocode } from '@/lib/location';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const categorySlug = searchParams.get('category');
    const serviceSlug = searchParams.get('service');
    const latStr = searchParams.get('lat');
    const lngStr = searchParams.get('lng');
    const radiusStr = searchParams.get('radius') || '15';
    const city = searchParams.get('city');
    const minRatingStr = searchParams.get('minRating');
    const isAvailableOnly = searchParams.get('available') !== 'false'; // Default to available
    const pageStr = searchParams.get('page') || '1';
    const limitStr = searchParams.get('limit') || '20';

    let customerLat = latStr ? parseFloat(latStr) : undefined;
    let customerLng = lngStr ? parseFloat(lngStr) : undefined;
    const searchRadiusKm = parseFloat(radiusStr);
    const page = parseInt(pageStr, 10);
    const limit = parseInt(limitStr, 10);

    // If coordinates are missing but location/city query string is present, try server-side forward geocoding
    if ((customerLat === undefined || customerLng === undefined || isNaN(customerLat) || isNaN(customerLng)) && city) {
      const geocoded = await forwardGeocode(city);
      if (geocoded) {
        customerLat = geocoded.latitude;
        customerLng = geocoded.longitude;
      }
    }

    const hasCoords = customerLat !== undefined && customerLng !== undefined && !isNaN(customerLat) && !isNaN(customerLng);

    // Build Prisma query filter
    const whereClause: any = {
      status: 'VERIFIED', // Section 13: Only verified workers in public search
    };

    if (isAvailableOnly) {
      whereClause.isAvailable = true;
    }

    if (categorySlug) {
      const catLower = categorySlug.toLowerCase();
      if (catLower === 'other' || catLower === 'other-service' || categorySlug === 'OTHER') {
        whereClause.OR = [
          { primaryCategory: { slug: 'other-service' } },
          { skills: { some: { category: { slug: 'other-service' } } } },
          { status: 'VERIFIED' },
        ];
      } else if (catLower === 'ac-technician') {
        whereClause.OR = [
          { primaryCategory: { slug: 'ac-technician' } },
          { primaryCategory: { slug: 'electrical' } },
          { skills: { some: { category: { slug: 'electrical' } } } },
          { skills: { some: { service: { slug: 'ac-servicing-repair' } } } },
        ];
      } else {
        whereClause.OR = [
          { primaryCategory: { slug: categorySlug } },
          { skills: { some: { category: { slug: categorySlug } } } },
        ];
      }
    }

    // Only restrict DB query by location string if coordinates are NOT available.
    // When coordinates are available, Haversine geographic radius filtering handles location matching.
    if (city && !hasCoords) {
      const locationCondition = {
        OR: [
          { city: { contains: city } },
          { state: { contains: city } },
          { serviceAreas: { some: { areaName: { contains: city } } } },
          { serviceAreas: { some: { city: { contains: city } } } },
        ],
      };
      if (whereClause.OR) {
        whereClause.AND = [
          { OR: whereClause.OR },
          locationCondition,
        ];
        delete whereClause.OR;
      } else {
        whereClause.OR = locationCondition.OR;
      }
    }

    // Fetch matching workers with relations
    const rawWorkers = await prisma.workerProfile.findMany({
      where: whereClause,
      include: {
        primaryCategory: true,
        skills: {
          include: {
            category: true,
            service: true,
          },
        },
        serviceAreas: true,
        reviews: {
          where: { isHidden: false },
        },
        aadhaarVerif: true,
        bankVerif: true,
      },
    });

    // Server-side distance and radius filtering using Haversine
    let matchedWorkers = rawWorkers.map((worker) => {
      const sanitized = sanitizeWorkerForPublic(worker, customerLat, customerLng);
      return {
        ...sanitized,
        serviceRadiusKm: worker.serviceRadiusKm,
        rawWorkerLat: worker.latitude,
        rawWorkerLng: worker.longitude,
      };
    });

    // If customer coordinates provided, filter by service radius and search radius
    if (customerLat !== undefined && customerLng !== undefined && !isNaN(customerLat) && !isNaN(customerLng)) {
      matchedWorkers = matchedWorkers.filter((w) => {
        if (w.distanceKm === null) return true; // Keep if worker hasn't set coords yet
        // Check both customer's search radius AND worker's own defined service radius
        return w.distanceKm <= searchRadiusKm && w.distanceKm <= w.serviceRadiusKm;
      });

      // Sort deterministically: closest distance first, then highest rating, then experience
      matchedWorkers.sort((a, b) => {
        if (a.distanceKm !== null && b.distanceKm !== null) {
          if (a.distanceKm !== b.distanceKm) {
            return a.distanceKm - b.distanceKm;
          }
        }
        return b.rating - a.rating || b.experienceYears - a.experienceYears;
      });
    } else {
      // Sort by rating & experience when no coords
      matchedWorkers.sort((a, b) => b.rating - a.rating || b.experienceYears - a.experienceYears);
    }

    if (minRatingStr) {
      const minRating = parseFloat(minRatingStr);
      matchedWorkers = matchedWorkers.filter((w) => w.rating >= minRating);
    }

    // Pagination
    const total = matchedWorkers.length;
    const startIndex = (page - 1) * limit;
    const paginatedWorkers = matchedWorkers.slice(startIndex, startIndex + limit).map((w) => {
      // Ensure private raw coordinates are removed
      const { rawWorkerLat, rawWorkerLng, ...publicWorker } = w;
      return publicWorker;
    });

    return NextResponse.json({
      success: true,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      workers: paginatedWorkers,
      suggestions:
        total === 0
          ? {
              message: 'Currently no verified workers are available in this area.',
              actions: [
                { type: 'EXPAND_RADIUS', label: 'Expand Search Radius (30 km)', newRadius: 30 },
                { type: 'CHANGE_LOCATION', label: 'Change Location or Area' },
                { type: 'CHOOSE_ANOTHER_TIME', label: 'Schedule for another day / time' },
              ],
            }
          : null,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: 'Search error: ' + err.message },
      { status: 500 }
    );
  }
}
