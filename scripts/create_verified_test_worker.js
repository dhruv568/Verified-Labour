const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const email = 'teamwizranger@gmail.com';
  const rawPassword = 'Pass@123';
  const passwordHash = await bcrypt.hash(rawPassword, 10);

  console.log('=== CREATING/UPDATING VERIFIED TEST WORKER ACCOUNT ===');

  // 1. Fetch existing user before fix for diagnostic report
  const existingUserBefore = await prisma.user.findFirst({
    where: { email: email.toLowerCase() },
    include: {
      workerProfile: {
        include: {
          aadhaarVerif: true,
          bankVerif: true,
          skills: true,
          serviceAreas: true,
        },
      },
    },
  });

  console.log('--- Account Status Before Fix ---');
  if (!existingUserBefore) {
    console.log('Status: User did not exist in database');
  } else {
    console.log('User ID:', existingUserBefore.id);
    console.log('Role:', existingUserBefore.role);
    console.log('Status:', existingUserBefore.status);
    console.log('WorkerProfile exists:', !!existingUserBefore.workerProfile);
    if (existingUserBefore.workerProfile) {
      console.log('Worker Profile Status:', existingUserBefore.workerProfile.status);
      console.log('Worker Profile Available:', existingUserBefore.workerProfile.isAvailable);
      console.log('Latitude:', existingUserBefore.workerProfile.latitude);
      console.log('Longitude:', existingUserBefore.workerProfile.longitude);
      console.log('City:', existingUserBefore.workerProfile.city);
    }
  }

  // 2. Fetch Base Category (Electrical)
  let category = await prisma.category.findUnique({ where: { slug: 'electrical' } });
  if (!category) {
    category = await prisma.category.findFirst();
  }
  if (!category) {
    throw new Error('No categories found in database');
  }

  // Fetch or create service under category
  let service = await prisma.service.findFirst({ where: { categoryId: category.id } });
  if (!service) {
    service = await prisma.service.create({
      data: {
        slug: 'electrical-repair-servicing',
        name: 'Electrical Repair & Servicing',
        basePrice: 350,
        priceUnit: 'per service',
        categoryId: category.id,
        isActive: true,
      },
    });
  }

  // 3. Upsert User
  const testPhone = '+919900000999';
  let user = await prisma.user.findFirst({ where: { email: email.toLowerCase() } });
  if (!user) {
    user = await prisma.user.findFirst({ where: { phone: testPhone } });
  }

  if (user) {
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

  // 4. Complete Worker Profile Data
  const profileData = {
    fullName: 'Team Wiz Ranger (TEST)',
    dateOfBirth: new Date('1995-05-15'),
    gender: 'MALE',
    avatarUrl: 'https://images.unsplash.com/photo-1540569014015-19a7be504e3a?auto=format&fit=crop&w=300&q=80',
    bio: 'Verified skilled electrician & appliance specialist serving Ravet, Pimpri-Chinchwad & Pune. Experienced in residential wiring, switchboards, fan repair, light fittings, and inverter setups. [TEST WORKER ACCOUNT]',
    experienceYears: 7,
    primaryCategoryId: category.id,
    status: 'VERIFIED',
    isAvailable: true,
    autoAccept: false,
    latitude: 18.6480, // Ravet locality center coordinates
    longitude: 73.7480, // Ravet locality center coordinates
    city: 'Pimpri-Chinchwad',
    state: 'Maharashtra',
    postalCode: '412101', // Ravet PIN code
    serviceRadiusKm: 30.0, // Service radius covering Ravet, Pimpri-Chinchwad, Pune & nearby areas
    hourlyRate: 400.0,
    identityVerified: true,
    bankVerified: true,
    skillVerified: true,
  };

  const profile = await prisma.workerProfile.upsert({
    where: { userId: user.id },
    update: profileData,
    create: {
      userId: user.id,
      ...profileData,
    },
  });

  // 5. Aadhaar Verification
  await prisma.aadhaarVerification.upsert({
    where: { workerId: profile.id },
    update: {
      refId: `MOCK_AADHAAR_TEAMWIZ`,
      maskedAadhaar: 'XXXXXXXX9999',
      nameOnAadhaar: 'Team Wiz Ranger',
      status: 'VERIFIED',
      verifiedAt: new Date(),
    },
    create: {
      workerId: profile.id,
      refId: `MOCK_AADHAAR_TEAMWIZ`,
      maskedAadhaar: 'XXXXXXXX9999',
      nameOnAadhaar: 'Team Wiz Ranger',
      status: 'VERIFIED',
      verifiedAt: new Date(),
    },
  });

  // 6. Bank Verification
  await prisma.bankVerification.upsert({
    where: { workerId: profile.id },
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
      workerId: profile.id,
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

  // 7. Service Areas
  const serviceAreas = ['Ravet', 'Tathawade', 'Punawale', 'Nigdi', 'Akurdi', 'Chinchwad', 'Pimpri', 'Wakad', 'Pune'];
  await prisma.workerServiceArea.deleteMany({ where: { workerId: profile.id } });
  await prisma.workerServiceArea.createMany({
    data: serviceAreas.map((area) => ({
      workerId: profile.id,
      city: 'Pimpri-Chinchwad',
      areaName: area,
      postalCode: '412101',
    })),
  });

  // 8. Worker Availability (All 7 Days, 08:00 - 20:00)
  await prisma.workerAvailability.deleteMany({ where: { workerId: profile.id } });
  await prisma.workerAvailability.createMany({
    data: [0, 1, 2, 3, 4, 5, 6].map((day) => ({
      workerId: profile.id,
      dayOfWeek: day,
      startTime: '08:00',
      endTime: '20:00',
      isWorking: true,
    })),
  });

  // 9. Worker Skills
  await prisma.workerSkill.deleteMany({ where: { workerId: profile.id } });
  await prisma.workerSkill.create({
    data: {
      workerId: profile.id,
      categoryId: category.id,
      serviceId: service ? service.id : null,
      yearsExperience: 7,
      isVerified: true,
    },
  });

  // 10. Completed Jobs & Customer Reviews (For Rating Calculation)
  let customerUser = await prisma.user.findFirst({
    where: { role: 'CUSTOMER' },
    include: { customerProfile: true },
  });

  if (customerUser && customerUser.customerProfile) {
    const existingJobs = await prisma.job.findMany({
      where: { workerId: profile.id },
      select: { id: true, jobRequestId: true },
    });
    for (const j of existingJobs) {
      await prisma.review.deleteMany({ where: { jobId: j.id } });
      await prisma.job.delete({ where: { id: j.id } });
      await prisma.jobRequest.delete({ where: { id: j.jobRequestId } });
    }

    const reviewsData = [
      { rating: 5, comment: 'Punctual, professional, and excellent electrical wiring work in Ravet.' },
      { rating: 5, comment: 'Quick response and fixed switchboard issue cleanly.' },
      { rating: 5, comment: 'Highly skilled electrician, solved fan and light fitting issue.' },
      { rating: 4, comment: 'Good quality service, polite behavior.' },
    ];

    for (let i = 0; i < reviewsData.length; i++) {
      const rev = reviewsData[i];
      const jobReq = await prisma.jobRequest.create({
        data: {
          customerId: customerUser.customerProfile.id,
          categoryId: category.id,
          serviceId: service ? service.id : null,
          description: `Test Electrical Service ${i + 1}`,
          formattedAddress: `Ravet, Pimpri-Chinchwad, Maharashtra`,
          city: 'Pimpri-Chinchwad',
          postalCode: '412101',
          latitude: 18.6480,
          longitude: 73.7480,
          preferredDate: '2026-09-25',
          preferredTime: '10:00 AM',
          status: 'MATCHED',
        },
      });

      const job = await prisma.job.create({
        data: {
          jobRequestId: jobReq.id,
          customerId: customerUser.customerProfile.id,
          workerId: profile.id,
          serviceId: service.id,
          status: 'COMPLETED',
          baseAmount: 400.0,
          finalAmount: 400.0,
          actualStartTime: new Date(Date.now() - 86400000 * (i + 1)),
          actualEndTime: new Date(Date.now() - 86400000 * (i + 1) + 7200000),
        },
      });

      await prisma.review.create({
        data: {
          jobId: job.id,
          customerId: customerUser.customerProfile.id,
          workerId: profile.id,
          rating: rev.rating,
          comment: rev.comment,
          isModerated: true,
          isHidden: false,
        },
      });
    }
  }

  console.log('✅ Worker profile successfully created and updated.');
}

main()
  .catch((e) => {
    console.error('Error updating worker profile:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
