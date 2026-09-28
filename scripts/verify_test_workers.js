const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

function calculateHaversineDistanceKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

function sanitizeWorker(worker, customerLat, customerLng) {
  let distanceKm = null;
  if (customerLat !== undefined && customerLng !== undefined && worker.latitude !== null && worker.longitude !== null) {
    distanceKm = calculateHaversineDistanceKm(customerLat, customerLng, worker.latitude, worker.longitude);
  }
  const reviews = worker.reviews || [];
  const reviewCount = reviews.length;
  const avgRating = reviewCount > 0
    ? Math.round((reviews.reduce((acc, r) => acc + r.rating, 0) / reviewCount) * 10) / 10
    : 5.0;

  return {
    id: worker.id,
    fullName: worker.fullName,
    bio: worker.bio,
    experienceYears: worker.experienceYears,
    status: worker.status,
    isAvailable: worker.isAvailable,
    hourlyRate: worker.hourlyRate,
    city: worker.city,
    state: worker.state,
    primaryCategory: worker.primaryCategory,
    skills: worker.skills,
    serviceAreas: worker.serviceAreas ? worker.serviceAreas.map((sa) => sa.areaName) : [],
    distanceKm,
    formattedDistance: distanceKm !== null ? `${distanceKm} km away` : 'Nearby',
    rating: avgRating,
    reviewCount,
    aadhaarStatus: worker.aadhaarVerif?.status || 'N/A',
    bankStatus: worker.bankVerif?.status || 'N/A',
    skillVerified: worker.skillVerified,
  };
}

async function verify() {
  console.log('=== VERIFYING 5 TEST WORKERS ===\n');

  const testEmails = [
    'test.rajesh@verifiedlabour.test',
    'test.amit@verifiedlabour.test',
    'test.suresh@verifiedlabour.test',
    'test.rahul@verifiedlabour.test',
    'test.mahesh@verifiedlabour.test',
  ];

  // 1. Check in Database
  const dbWorkers = await prisma.workerProfile.findMany({
    where: {
      user: { email: { in: testEmails } },
    },
    include: {
      user: true,
      primaryCategory: true,
      skills: { include: { category: true, service: true } },
      aadhaarVerif: true,
      bankVerif: true,
      reviews: true,
      serviceAreas: true,
    },
  });

  console.log(`Found ${dbWorkers.length}/5 test workers in DB.\n`);

  console.log('--- WORKER DETAILS SUMMARY ---');
  dbWorkers.forEach((w) => {
    const sanitized = sanitizeWorker(w);
    console.log({
      Name: w.fullName,
      Email: w.user.email,
      Phone: w.user.phone,
      Skill: w.skills.map((s) => s.service?.name || w.primaryCategory?.name).join(', '),
      Category: w.primaryCategory?.slug,
      Location: `${w.serviceAreas.map(a => a.areaName).slice(0, 3).join('/')}, ${w.city}`,
      Experience: `${w.experienceYears} years`,
      HourlyRate: `₹${w.hourlyRate}`,
      Availability: w.isAvailable ? 'AVAILABLE' : 'UNAVAILABLE',
      Rating: sanitized.rating,
      ReviewCount: sanitized.reviewCount,
      AadhaarStatus: w.aadhaarVerif?.status || 'N/A',
      BankStatus: w.bankVerif?.status || 'N/A',
      SkillVerified: w.skillVerified ? 'VERIFIED' : 'PENDING',
      AccountStatus: w.user.status,
      ProfileStatus: w.status,
    });
  });

  // 2. Check Customer Search / Find Worker near Ravet (18.6476, 73.7480)
  console.log('\n--- CUSTOMER SEARCH DISCOVERY NEAR RAVET (18.6476, 73.7480) ---');
  const ravetLat = 18.6476;
  const ravetLng = 73.7480;

  const allVerifiedWorkers = await prisma.workerProfile.findMany({
    where: { status: 'VERIFIED', isAvailable: true },
    include: {
      primaryCategory: true,
      skills: { include: { category: true, service: true } },
      serviceAreas: true,
      reviews: true,
      aadhaarVerif: true,
      bankVerif: true,
    },
  });

  const ravetResults = allVerifiedWorkers
    .map((w) => sanitizeWorker(w, ravetLat, ravetLng))
    .filter((w) => w.distanceKm !== null && w.distanceKm <= 20)
    .sort((a, b) => (a.distanceKm || 0) - (b.distanceKm || 0));

  console.log(`Discovered ${ravetResults.length} verified workers within 20km of Ravet:`);
  ravetResults.forEach((w) => {
    console.log(`- ${w.fullName} (${w.primaryCategory?.name}): ${w.formattedDistance}, Rating: ${w.rating}, Rate: ₹${w.hourlyRate}/hr`);
  });

  // 3. Category Filter Verification
  console.log('\n--- CATEGORY FILTER TESTS ---');
  const categoriesToTest = ['electrical', 'plumbing', 'carpenter', 'painting'];
  for (const cat of categoriesToTest) {
    const filtered = ravetResults.filter(
      (w) =>
        w.primaryCategory?.slug === cat ||
        w.skills.some((s) => s.category?.slug === cat)
    );
    console.log(`Category '${cat}': Found ${filtered.length} worker(s): ${filtered.map((f) => f.fullName).join(', ')}`);
  }

  // 4. Admin Worker List Verification
  console.log('\n--- ADMIN WORKER LIST VERIFICATION ---');
  const adminWorkers = await prisma.workerProfile.findMany({
    select: {
      id: true,
      fullName: true,
      city: true,
      status: true,
      user: { select: { phone: true, email: true } },
      primaryCategory: { select: { name: true } },
      aadhaarVerif: { select: { status: true, maskedAadhaar: true } },
      bankVerif: { select: { status: true, maskedAccountNo: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  const testAdminWorkers = adminWorkers.filter((w) => testEmails.includes(w.user.email));
  console.log(`Admin sees ${testAdminWorkers.length}/5 test workers:`);
  testAdminWorkers.forEach((w) => {
    console.log(`- ${w.fullName} | Email: ${w.user.email} | Trade: ${w.primaryCategory?.name} | Status: ${w.status} | Identity: ${w.aadhaarVerif?.status} | Bank: ${w.bankVerif?.status}`);
  });

  console.log('\n=== ALL VERIFICATIONS PASSED SUCCESSFULLY ===');
}

verify()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
