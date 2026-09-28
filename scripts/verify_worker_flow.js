const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

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
  return R * c;
}

function sanitizeWorkerForPublic(worker, customerLat, customerLng) {
  let distanceKm = null;
  if (customerLat !== undefined && customerLng !== undefined && worker.latitude != null && worker.longitude != null) {
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
    serviceAreas: worker.serviceAreas ? worker.serviceAreas.map((sa) => sa.areaName) : [],
    distanceKm,
    formattedDistance: distanceKm !== null ? `${distanceKm.toFixed(1)} km away` : 'Nearby',
    badges: {
      isIdentityVerified: worker.identityVerified || (worker.aadhaarVerif && worker.aadhaarVerif.status === 'VERIFIED'),
      isBankVerified: worker.bankVerified || (worker.bankVerif && worker.bankVerif.status === 'VERIFIED'),
      isSkillVerified: worker.skillVerified,
      isFullyVerified: worker.status === 'VERIFIED',
    },
    rating: avgRating,
    reviewCount,
  };
}

async function runVerification() {
  console.log('===========================================================');
  console.log('COMPLETE FLOW VERIFICATION FOR TEST WORKER: teamwizranger@gmail.com');
  console.log('===========================================================\n');

  const email = 'teamwizranger@gmail.com';
  const password = 'Pass@123';

  // 1. LOGIN VERIFICATION
  const user = await prisma.user.findFirst({
    where: { email: email.toLowerCase() },
    include: {
      workerProfile: {
        include: {
          primaryCategory: true,
          skills: { include: { category: true, service: true } },
          serviceAreas: true,
          availability: true,
          aadhaarVerif: true,
          bankVerif: true,
          reviews: { where: { isHidden: false } },
        },
      },
    },
  });

  if (!user) throw new Error('STEP 1 FAILED: User account not found');
  if (!user.passwordHash) throw new Error('STEP 1 FAILED: Password hash missing');
  const passMatch = await bcrypt.compare(password, user.passwordHash);
  if (!passMatch) throw new Error('STEP 1 FAILED: Password comparison failed for Pass@123');
  console.log('✔ STEP 1 PASSED: Successful authentication with email teamwizranger@gmail.com and password Pass@123');

  // 2. DASHBOARD & PROFILE COMPLETION VERIFICATION
  if (user.role !== 'WORKER') throw new Error(`STEP 2 FAILED: Role is ${user.role}`);
  if (user.status !== 'ACTIVE') throw new Error(`STEP 2 FAILED: User status is ${user.status}`);
  if (!user.isEmailVerified) throw new Error('STEP 2 FAILED: Email is not verified');
  if (!user.isPhoneVerified) throw new Error('STEP 2 FAILED: Phone is not verified');
  if (!user.workerProfile) throw new Error('STEP 2 FAILED: WorkerProfile is missing');
  console.log('✔ STEP 2 PASSED: Worker dashboard session verified (Role=WORKER, Status=ACTIVE, EmailVerified=true, PhoneVerified=true)');

  // 3. WORKER PROFILE COMPLETE FIELDS
  const wp = user.workerProfile;
  const missingFields = [];
  if (!wp.fullName) missingFields.push('fullName');
  if (!wp.dateOfBirth) missingFields.push('dateOfBirth');
  if (!wp.gender) missingFields.push('gender');
  if (!wp.avatarUrl) missingFields.push('avatarUrl');
  if (!wp.bio) missingFields.push('bio');
  if (wp.experienceYears == null) missingFields.push('experienceYears');
  if (wp.hourlyRate == null) missingFields.push('hourlyRate');
  if (!wp.primaryCategoryId) missingFields.push('primaryCategoryId');
  if (!wp.city) missingFields.push('city');
  if (!wp.state) missingFields.push('state');
  if (!wp.postalCode) missingFields.push('postalCode');
  if (wp.latitude == null) missingFields.push('latitude');
  if (wp.longitude == null) missingFields.push('longitude');
  if (wp.serviceRadiusKm == null) missingFields.push('serviceRadiusKm');

  if (missingFields.length > 0) {
    throw new Error(`STEP 3 FAILED: Missing required profile fields: ${missingFields.join(', ')}`);
  }
  console.log('✔ STEP 3 PASSED: WorkerProfile is 100% complete with all required fields.');

  // 4. WORKER ACTIVE
  console.log(`✔ STEP 4 PASSED: User Account Status is ${user.status}`);

  // 5. WORKER AVAILABLE
  if (!wp.isAvailable) throw new Error('STEP 5 FAILED: Worker is not available');
  console.log(`✔ STEP 5 PASSED: Worker Availability is set to ${wp.isAvailable}`);

  // 6. MOCK/TEST VERIFICATIONS
  if (!wp.identityVerified || wp.aadhaarVerif?.status !== 'VERIFIED') throw new Error('STEP 6 FAILED: Aadhaar identity verification is not VERIFIED');
  if (!wp.bankVerified || wp.bankVerif?.status !== 'VERIFIED') throw new Error('STEP 6 FAILED: Bank verification is not VERIFIED');
  if (!wp.skillVerified || !wp.skills.some((s) => s.isVerified)) throw new Error('STEP 6 FAILED: Skill verification is not VERIFIED');
  if (wp.status !== 'VERIFIED') throw new Error(`STEP 6 FAILED: Overall profile status is ${wp.status}`);
  console.log('✔ STEP 6 PASSED: All test verifications (Aadhaar, Bank, Skill, Profile) are VERIFIED/APPROVED using safe mock data.');

  // 7. ADMIN WORKER MANAGEMENT LIST
  const adminWorkers = await prisma.workerProfile.findMany({
    include: { user: { select: { email: true, phone: true } }, primaryCategory: true, aadhaarVerif: true, bankVerif: true },
  });
  const inAdminList = adminWorkers.find((w) => w.user.email === email.toLowerCase());
  if (!inAdminList) throw new Error('STEP 7 FAILED: Worker missing from Admin Management');
  console.log('✔ STEP 7 PASSED: Worker appears in Admin Worker/User Management list.');

  // 8. CUSTOMER "FIND WORKER" LISTING
  const verifiedWorkers = await prisma.workerProfile.findMany({
    where: { status: 'VERIFIED', isAvailable: true },
  });
  const inPublicFind = verifiedWorkers.find((w) => w.id === wp.id);
  if (!inPublicFind) throw new Error('STEP 8 FAILED: Worker missing from public Find Worker search');
  console.log('✔ STEP 8 PASSED: Worker appears in customer "Find Worker" search.');

  // 9 & 10. NEARBY SEARCH & DISTANCE RADIUS FILTERING (5km, 15km, 30km around Ravet)
  const ravetLat = 18.6480;
  const ravetLng = 73.7480;
  const distToRavetCenter = calculateHaversineDistanceKm(ravetLat, ravetLng, wp.latitude, wp.longitude);

  console.log(`\n  Location Check for Ravet Center (${ravetLat}, ${ravetLng}):`);
  console.log(`  Worker Location: Lat ${wp.latitude}, Lng ${wp.longitude} (${wp.city}, PIN ${wp.postalCode})`);
  console.log(`  Geographic Distance to Ravet: ${distToRavetCenter.toFixed(2)} km`);

  for (const radiusKm of [5, 15, 30]) {
    const isWithinCustomerRadius = distToRavetCenter <= radiusKm;
    const isWithinWorkerRadius = distToRavetCenter <= wp.serviceRadiusKm;
    if (!isWithinCustomerRadius || !isWithinWorkerRadius) {
      throw new Error(`STEP 9/10 FAILED: Worker excluded from ${radiusKm}km radius search`);
    }
    console.log(`  - ${radiusKm} km radius search: MATCHED (Distance ${distToRavetCenter.toFixed(2)} km <= ${radiusKm} km)`);
  }
  console.log('✔ STEP 9 & 10 PASSED: Worker appears in 5 km, 15 km, and 30 km nearby searches around Ravet.');

  // 11. WORKER CARD PUBLIC DISPLAY DETAILS
  const publicCard = sanitizeWorkerForPublic(wp, ravetLat, ravetLng);
  console.log('\n--- PUBLIC WORKER CARD DETAILS ---');
  console.log('  Name:', publicCard.fullName);
  console.log('  Primary Category:', publicCard.primaryCategory?.name);
  console.log('  Rating:', publicCard.rating, `(${publicCard.reviewCount} reviews)`);
  console.log('  Experience:', publicCard.experienceYears, 'years');
  console.log('  Location/City:', publicCard.city);
  console.log('  Service Areas:', publicCard.serviceAreas.join(', '));
  console.log('  Badges:', publicCard.badges);
  console.log('  Availability:', publicCard.isAvailable);

  console.log('\n===========================================================');
  console.log('ALL 11 VERIFICATION CHECKS PASSED PERFECTLY!');
  console.log('===========================================================');
}

runVerification()
  .catch((e) => {
    console.error('\n❌ VERIFICATION ERROR:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
