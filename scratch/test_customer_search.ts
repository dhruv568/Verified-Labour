import prisma from '../lib/db';
import { calculateHaversineDistanceKm, sanitizeWorkerForPublic, forwardGeocode } from '../lib/location';

async function testCustomerSearch() {
  console.log("=== CUSTOMER SEARCH VERIFICATION ===");

  // Simulation of /api/workers/search?category=electrical&city=Pimpri-Chinchwad
  const categorySlug = 'electrical';
  const city = 'Pimpri-Chinchwad';
  const radiusStr = '25';

  const searchRadiusKm = parseFloat(radiusStr);
  const geocoded = await forwardGeocode(city);
  const customerLat = geocoded?.latitude;
  const customerLng = geocoded?.longitude;

  console.log("Customer Location Geocoded:", geocoded);

  const whereClause: any = {
    status: 'VERIFIED',
    isAvailable: true,
    OR: [
      { primaryCategory: { slug: categorySlug } },
      { skills: { some: { category: { slug: categorySlug } } } },
    ],
  };

  const rawWorkers = await prisma.workerProfile.findMany({
    where: whereClause,
    include: {
      primaryCategory: true,
      skills: { include: { category: true, service: true } },
      serviceAreas: true,
      aadhaarVerif: true,
      bankVerif: true,
    },
  });

  console.log(`Raw DB Verified Available Workers matched: ${rawWorkers.length}`);

  let matchedWorkers = rawWorkers.map((worker) => {
    const sanitized = sanitizeWorkerForPublic(worker, customerLat, customerLng);
    return {
      ...sanitized,
      serviceRadiusKm: worker.serviceRadiusKm,
    };
  });

  if (customerLat !== undefined && customerLng !== undefined) {
    matchedWorkers = matchedWorkers.filter((w) => {
      if (w.distanceKm === null) return true;
      return w.distanceKm <= searchRadiusKm && w.distanceKm <= w.serviceRadiusKm;
    });
  }

  console.log("Matched Workers for Customer:", matchedWorkers.map(w => ({
    id: w.id,
    fullName: w.fullName,
    distanceKm: w.distanceKm,
    isIdentityVerified: w.badges?.isIdentityVerified,
    isBankVerified: w.badges?.isBankVerified,
    primaryCategory: w.primaryCategory?.name,
  })));
}

testCustomerSearch()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
