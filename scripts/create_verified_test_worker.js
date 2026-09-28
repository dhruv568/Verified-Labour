const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const email = 'teamwizranger@gmail.com';
  const rawPassword = 'Pass@123';
  const passwordHash = await bcrypt.hash(rawPassword, 10);

  // 1. Fetch Primary Category (Electrical)
  const category = await prisma.category.findUnique({
    where: { slug: 'electrical' },
  });

  if (!category) {
    throw new Error('Electrical category not found in database');
  }

  const service = await prisma.service.findFirst({
    where: { categoryId: category.id },
  });

  // 2. Check if user with email exists or phone exists
  let user = await prisma.user.findFirst({
    where: { email: email.toLowerCase() },
  });

  const testPhone = '+919900000999';

  if (!user) {
    // Check if phone exists
    user = await prisma.user.findFirst({
      where: { phone: testPhone },
    });
  }

  if (user) {
    console.log(`Updating existing user: ${user.id} (${user.email || user.phone})`);
    user = await prisma.user.update({
      where: { id: user.id },
      data: {
        email: email.toLowerCase(),
        passwordHash,
        role: 'WORKER',
        status: 'ACTIVE',
        isEmailVerified: true,
        isPhoneVerified: true,
      },
    });
  } else {
    console.log(`Creating new user with email: ${email}`);
    user = await prisma.user.create({
      data: {
        phone: testPhone,
        email: email.toLowerCase(),
        passwordHash,
        role: 'WORKER',
        status: 'ACTIVE',
        isEmailVerified: true,
        isPhoneVerified: true,
      },
    });
  }

  // 3. Create or update WorkerProfile
  const profileData = {
    fullName: 'Team Wiz Ranger (TEST)',
    dateOfBirth: new Date('1995-05-15'),
    gender: 'MALE',
    avatarUrl: 'https://images.unsplash.com/photo-1540569014015-19a7be504e3a?auto=format&fit=crop&w=300&q=80',
    bio: 'Verified test worker profile for testing worker dashboard and discovery around Ravet / Pimpri-Chinchwad. [TEST ACCOUNT]',
    experienceYears: 7,
    primaryCategoryId: category.id,
    status: 'VERIFIED',
    isAvailable: true,
    autoAccept: false,
    latitude: 18.6550,
    longitude: 73.7250,
    city: 'Pimpri-Chinchwad',
    state: 'Maharashtra',
    postalCode: '412101',
    serviceRadiusKm: 20.0,
    hourlyRate: 400.0,
    identityVerified: true,
    bankVerified: true,
    skillVerified: true,
  };

  const workerProfile = await prisma.workerProfile.upsert({
    where: { userId: user.id },
    update: profileData,
    create: {
      userId: user.id,
      ...profileData,
    },
  });

  // 4. Aadhaar Verification (Mock/Test data only)
  await prisma.aadhaarVerification.upsert({
    where: { workerId: workerProfile.id },
    update: {
      refId: `MOCK_AADHAAR_TEAMWIZ`,
      maskedAadhaar: 'XXXXXXXX9999',
      nameOnAadhaar: 'Team Wiz Ranger',
      status: 'VERIFIED',
      verifiedAt: new Date(),
    },
    create: {
      workerId: workerProfile.id,
      refId: `MOCK_AADHAAR_TEAMWIZ`,
      maskedAadhaar: 'XXXXXXXX9999',
      nameOnAadhaar: 'Team Wiz Ranger',
      status: 'VERIFIED',
      verifiedAt: new Date(),
    },
  });

  // 5. Bank Verification (Mock/Test data only)
  await prisma.bankVerification.upsert({
    where: { workerId: workerProfile.id },
    update: {
      refId: `MOCK_BANK_TEAMWIZ`,
      maskedAccountNo: 'XXXXXXXX8888',
      ifsc: 'SBIN0001234',
      accountHolderName: 'Team Wiz Ranger',
      nameMatchScore: 100.0,
      bankName: 'State Bank of India',
      status: 'VERIFIED',
      verifiedAt: new Date(),
    },
    create: {
      workerId: workerProfile.id,
      refId: `MOCK_BANK_TEAMWIZ`,
      maskedAccountNo: 'XXXXXXXX8888',
      ifsc: 'SBIN0001234',
      accountHolderName: 'Team Wiz Ranger',
      nameMatchScore: 100.0,
      bankName: 'State Bank of India',
      status: 'VERIFIED',
      verifiedAt: new Date(),
    },
  });

  // 6. Service Areas
  const serviceAreas = ['Ravet', 'Tathawade', 'Punawale', 'Nigdi', 'Akurdi', 'Chinchwad', 'Pimpri'];
  await prisma.workerServiceArea.deleteMany({ where: { workerId: workerProfile.id } });
  await prisma.workerServiceArea.createMany({
    data: serviceAreas.map((area) => ({
      workerId: workerProfile.id,
      city: 'Pimpri-Chinchwad',
      areaName: area,
      postalCode: '412101',
    })),
  });

  // 7. Availability
  await prisma.workerAvailability.deleteMany({ where: { workerId: workerProfile.id } });
  await prisma.workerAvailability.createMany({
    data: [0, 1, 2, 3, 4, 5, 6].map((day) => ({
      workerId: workerProfile.id,
      dayOfWeek: day,
      startTime: '08:00',
      endTime: '20:00',
      isWorking: true,
    })),
  });

  // 8. Worker Skills
  await prisma.workerSkill.deleteMany({ where: { workerId: workerProfile.id } });
  await prisma.workerSkill.create({
    data: {
      workerId: workerProfile.id,
      categoryId: category.id,
      serviceId: service ? service.id : null,
      yearsExperience: 7,
      isVerified: true,
    },
  });

  console.log(`✅ VERIFIED TEST WORKER created/updated successfully!`);
  console.log(`Email: ${user.email}`);
  console.log(`Password: ${rawPassword}`);
  console.log(`WorkerProfile ID: ${workerProfile.id}`);
  console.log(`Status: ${workerProfile.status}`);
}

main()
  .catch((e) => {
    console.error('Error creating worker:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
