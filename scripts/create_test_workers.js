const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding 5 TEST workers for Ravet, Pimpri-Chinchwad area...');

  const passwordHash = await bcrypt.hash('TestWorker@123', 10);

  // Fetch or create categories
  const electricalCat = await prisma.category.findUnique({ where: { slug: 'electrical' } });
  const plumbingCat = await prisma.category.findUnique({ where: { slug: 'plumbing' } });
  const carpenterCat = await prisma.category.findUnique({ where: { slug: 'carpenter' } });
  const paintingCat = await prisma.category.findUnique({ where: { slug: 'painting' } });

  if (!electricalCat || !plumbingCat || !carpenterCat || !paintingCat) {
    throw new Error('Required base categories not found in database.');
  }

  // Ensure AC service exists under electrical
  let acService = await prisma.service.findFirst({
    where: { slug: 'ac-servicing-repair' },
  });

  if (!acService) {
    acService = await prisma.service.create({
      data: {
        slug: 'ac-servicing-repair',
        name: 'AC Servicing & Repair',
        basePrice: 500,
        priceUnit: 'per service',
        categoryId: electricalCat.id,
        isActive: true,
      },
    });
  }

  const testCustomer = await prisma.user.findFirst({
    where: { role: 'CUSTOMER' },
    include: { customerProfile: true },
  });

  const workersData = [
    {
      phone: '+919900000001',
      email: 'test.rajesh@verifiedlabour.test',
      fullName: 'Rajesh Patil (TEST)',
      displayName: 'Rajesh Patil',
      skillName: 'Electrician',
      category: electricalCat,
      experienceYears: 8,
      locationName: 'Ravet, Pimpri-Chinchwad',
      city: 'Pimpri-Chinchwad',
      state: 'Maharashtra',
      postalCode: '412101',
      lat: 18.6476,
      lng: 73.7480,
      hourlyRate: 350,
      availability: true,
      languages: 'Hindi, Marathi, English',
      targetRating: 4.8,
      bio: 'Experienced electrician specializing in residential wiring, switches, lighting, fans, and electrical repairs. [TEST ACCOUNT]',
      avatar: 'https://images.unsplash.com/photo-1540569014015-19a7be504e3a?auto=format&fit=crop&w=300&q=80',
      maskedAadhaar: 'XXXXXXXX1001',
      maskedBank: 'XXXXXXXX9001',
      serviceAreas: ['Ravet', 'Tathawade', 'Punawale', 'Nigdi', 'Akurdi', 'Chinchwad', 'Pimpri'],
      reviews: [
        { rating: 5, comment: 'Punctual and very efficient electrical wiring work in Ravet.' },
        { rating: 5, comment: 'Great job fixing switchboard and ceiling fan.' },
        { rating: 5, comment: 'Highly skilled electrician, solved complex circuit issue.' },
        { rating: 5, comment: 'Professional and polite service.' },
        { rating: 4, comment: 'Good work, arrived 10 mins late due to traffic.' },
      ],
    },
    {
      phone: '+919900000002',
      email: 'test.amit@verifiedlabour.test',
      fullName: 'Amit Shinde (TEST)',
      displayName: 'Amit Shinde',
      skillName: 'Plumber',
      category: plumbingCat,
      experienceYears: 6,
      locationName: 'Tathawade, Pimpri-Chinchwad',
      city: 'Pimpri-Chinchwad',
      state: 'Maharashtra',
      postalCode: '411033',
      lat: 18.6186,
      lng: 73.7508,
      hourlyRate: 300,
      availability: true,
      languages: 'Marathi, Hindi',
      targetRating: 4.7,
      bio: 'Skilled plumber experienced in bathroom fittings, leakage repair, pipelines, taps, and water connections. [TEST ACCOUNT]',
      avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=300&q=80',
      maskedAadhaar: 'XXXXXXXX1002',
      maskedBank: 'XXXXXXXX9002',
      serviceAreas: ['Tathawade', 'Ravet', 'Wakad', 'Punawale', 'Chinchwad', 'Pimpri'],
      reviews: [
        { rating: 5, comment: 'Fixed pipe leakage quickly in Tathawade. Clean work.' },
        { rating: 5, comment: 'Replaced bathroom tap and checked all fittings.' },
        { rating: 4, comment: 'Very reliable plumbing service.' },
      ],
    },
    {
      phone: '+919900000003',
      email: 'test.suresh@verifiedlabour.test',
      fullName: 'Suresh Jadhav (TEST)',
      displayName: 'Suresh Jadhav',
      skillName: 'Carpenter',
      category: carpenterCat,
      experienceYears: 10,
      locationName: 'Wakad, Pimpri-Chinchwad',
      city: 'Pimpri-Chinchwad',
      state: 'Maharashtra',
      postalCode: '411057',
      lat: 18.5987,
      lng: 73.7688,
      hourlyRate: 450,
      availability: true,
      languages: 'Marathi, Hindi, English',
      targetRating: 4.9,
      bio: 'Experienced carpenter specializing in furniture repair, doors, wardrobes, shelves, and custom woodwork. [TEST ACCOUNT]',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=80',
      maskedAadhaar: 'XXXXXXXX1003',
      maskedBank: 'XXXXXXXX9003',
      serviceAreas: ['Wakad', 'Tathawade', 'Punawale', 'Ravet', 'Hinjewadi', 'Pimpri-Chinchwad'],
      reviews: [
        { rating: 5, comment: 'Master carpenter! Custom wardrobe repair in Wakad was flawless.' },
        { rating: 5, comment: 'Fixed door hinges and sliding locks perfectly.' },
        { rating: 5, comment: 'Top quality wood work and very polite.' },
        { rating: 5, comment: 'Excellent craftsmanship.' },
        { rating: 5, comment: 'Highly recommended for any carpentry needs.' },
        { rating: 5, comment: 'Great job on modular kitchen cabinets.' },
        { rating: 5, comment: 'Very experienced and reliable.' },
        { rating: 5, comment: 'Clean work and fair pricing.' },
        { rating: 5, comment: 'Fast and high quality work.' },
        { rating: 4, comment: 'Satisfied with shelf installation.' },
      ],
    },
    {
      phone: '+919900000004',
      email: 'test.rahul@verifiedlabour.test',
      fullName: 'Rahul More (TEST)',
      displayName: 'Rahul More',
      skillName: 'Painter',
      category: paintingCat,
      experienceYears: 5,
      locationName: 'Punawale, Pimpri-Chinchwad',
      city: 'Pimpri-Chinchwad',
      state: 'Maharashtra',
      postalCode: '411033',
      lat: 18.6298,
      lng: 73.7402,
      hourlyRate: 400,
      availability: true,
      languages: 'Hindi, Marathi',
      targetRating: 4.6,
      bio: 'Professional house painter experienced in interior walls, exterior painting, texture work, and repainting. [TEST ACCOUNT]',
      avatar: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=300&q=80',
      maskedAadhaar: 'XXXXXXXX1004',
      maskedBank: 'XXXXXXXX9004',
      serviceAreas: ['Punawale', 'Ravet', 'Tathawade', 'Wakad', 'Nigdi', 'Pimpri-Chinchwad'],
      reviews: [
        { rating: 5, comment: 'Neat interior painting in Punawale.' },
        { rating: 5, comment: 'Good wall texture finishing.' },
        { rating: 5, comment: 'Professional painter, completed on time.' },
        { rating: 4, comment: 'Good quality paint work.' },
        { rating: 4, comment: 'Cleaned up area after painting.' },
      ],
    },
    {
      phone: '+919900000005',
      email: 'test.mahesh@verifiedlabour.test',
      fullName: 'Mahesh Kumar (TEST)',
      displayName: 'Mahesh Kumar',
      skillName: 'AC Technician',
      category: electricalCat,
      experienceYears: 7,
      locationName: 'Nigdi, Pimpri-Chinchwad',
      city: 'Pimpri-Chinchwad',
      state: 'Maharashtra',
      postalCode: '411044',
      lat: 18.6579,
      lng: 73.7745,
      hourlyRate: 500,
      availability: true,
      languages: 'Hindi, Marathi, English',
      targetRating: 4.8,
      bio: 'Experienced AC technician specializing in AC servicing, installation, gas charging, troubleshooting, and maintenance. [TEST ACCOUNT]',
      avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=300&q=80',
      maskedAadhaar: 'XXXXXXXX1005',
      maskedBank: 'XXXXXXXX9005',
      serviceAreas: ['Nigdi', 'Ravet', 'Akurdi', 'Chinchwad', 'Tathawade', 'Pimpri-Chinchwad'],
      reviews: [
        { rating: 5, comment: 'Excellent AC deep cleaning and gas charging in Nigdi.' },
        { rating: 5, comment: 'Diagnosed cooling issue quickly and fixed compressor leak.' },
        { rating: 5, comment: 'Professional split AC installation.' },
        { rating: 5, comment: 'Very skilled AC technician.' },
        { rating: 4, comment: 'Good service and honest advice on maintenance.' },
      ],
    },
  ];

  for (const w of workersData) {
    // 1. Create or Update User
    const user = await prisma.user.upsert({
      where: { phone: w.phone },
      update: {
        email: w.email,
        passwordHash,
        role: 'WORKER',
        status: 'ACTIVE',
        isPhoneVerified: true,
        isEmailVerified: true,
      },
      create: {
        phone: w.phone,
        email: w.email,
        passwordHash,
        role: 'WORKER',
        status: 'ACTIVE',
        isPhoneVerified: true,
        isEmailVerified: true,
      },
    });

    // 2. Create or Update Worker Profile
    const profile = await prisma.workerProfile.upsert({
      where: { userId: user.id },
      update: {
        fullName: w.fullName,
        dateOfBirth: new Date('1992-06-15'),
        gender: 'MALE',
        avatarUrl: w.avatar,
        bio: w.bio,
        experienceYears: w.experienceYears,
        primaryCategoryId: w.category.id,
        status: 'VERIFIED',
        isAvailable: w.availability,
        autoAccept: false,
        latitude: w.lat,
        longitude: w.lng,
        city: w.city,
        state: w.state,
        postalCode: w.postalCode,
        serviceRadiusKm: 20.0,
        hourlyRate: w.hourlyRate,
        identityVerified: true,
        bankVerified: true,
        skillVerified: true,
      },
      create: {
        userId: user.id,
        fullName: w.fullName,
        dateOfBirth: new Date('1992-06-15'),
        gender: 'MALE',
        avatarUrl: w.avatar,
        bio: w.bio,
        experienceYears: w.experienceYears,
        primaryCategoryId: w.category.id,
        status: 'VERIFIED',
        isAvailable: w.availability,
        autoAccept: false,
        latitude: w.lat,
        longitude: w.lng,
        city: w.city,
        state: w.state,
        postalCode: w.postalCode,
        serviceRadiusKm: 20.0,
        hourlyRate: w.hourlyRate,
        identityVerified: true,
        bankVerified: true,
        skillVerified: true,
      },
    });

    // 3. Aadhaar Verification
    await prisma.aadhaarVerification.upsert({
      where: { workerId: profile.id },
      update: {
        refId: `MOCK_AADHAAR_${w.phone}`,
        maskedAadhaar: w.maskedAadhaar,
        nameOnAadhaar: w.displayName,
        status: 'VERIFIED',
        verifiedAt: new Date(),
      },
      create: {
        workerId: profile.id,
        refId: `MOCK_AADHAAR_${w.phone}`,
        maskedAadhaar: w.maskedAadhaar,
        nameOnAadhaar: w.displayName,
        status: 'VERIFIED',
        verifiedAt: new Date(),
      },
    });

    // 4. Bank Verification
    await prisma.bankVerification.upsert({
      where: { workerId: profile.id },
      update: {
        refId: `MOCK_BANK_${w.phone}`,
        maskedAccountNo: w.maskedBank,
        ifsc: 'SBIN0001234',
        accountHolderName: w.displayName,
        nameMatchScore: 99.0,
        bankName: 'State Bank of India',
        status: 'VERIFIED',
        verifiedAt: new Date(),
      },
      create: {
        workerId: profile.id,
        refId: `MOCK_BANK_${w.phone}`,
        maskedAccountNo: w.maskedBank,
        ifsc: 'SBIN0001234',
        accountHolderName: w.displayName,
        nameMatchScore: 99.0,
        bankName: 'State Bank of India',
        status: 'VERIFIED',
        verifiedAt: new Date(),
      },
    });

    // 5. Worker Service Areas
    await prisma.workerServiceArea.deleteMany({ where: { workerId: profile.id } });
    await prisma.workerServiceArea.createMany({
      data: w.serviceAreas.map((area) => ({
        workerId: profile.id,
        city: w.city,
        areaName: area,
        postalCode: w.postalCode,
      })),
    });

    // 6. Worker Availability
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

    // 7. Worker Skills
    await prisma.workerSkill.deleteMany({ where: { workerId: profile.id } });
    await prisma.workerSkill.create({
      data: {
        workerId: profile.id,
        categoryId: w.category.id,
        serviceId: w.skillName === 'AC Technician' ? acService.id : null,
        yearsExperience: w.experienceYears,
        isVerified: true,
      },
    });

    // 8. Completed Jobs and Reviews for exact rating calculation
    if (testCustomer && testCustomer.customerProfile) {
      const existingJobs = await prisma.job.findMany({
        where: { workerId: profile.id },
        select: { id: true, jobRequestId: true },
      });
      for (const j of existingJobs) {
        await prisma.review.deleteMany({ where: { jobId: j.id } });
        await prisma.job.delete({ where: { id: j.id } });
        await prisma.jobRequest.delete({ where: { id: j.jobRequestId } });
      }

      for (let i = 0; i < w.reviews.length; i++) {
        const rev = w.reviews[i];
        const jobReq = await prisma.jobRequest.create({
          data: {
            customerId: testCustomer.customerProfile.id,
            categoryId: w.category.id,
            serviceId: w.skillName === 'AC Technician' ? acService.id : null,
            description: `Test Service ${i + 1} for ${w.displayName}`,
            formattedAddress: `${w.locationName}, ${w.city}, ${w.state}`,
            city: w.city,
            postalCode: w.postalCode,
            latitude: w.lat,
            longitude: w.lng,
            preferredDate: '2026-09-20',
            preferredTime: '10:00 AM',
            status: 'MATCHED',
          },
        });

        const defaultService = (await prisma.service.findFirst({ where: { categoryId: w.category.id } })) || acService;

        const job = await prisma.job.create({
          data: {
            jobRequestId: jobReq.id,
            customerId: testCustomer.customerProfile.id,
            workerId: profile.id,
            serviceId: w.skillName === 'AC Technician' ? acService.id : defaultService.id,
            status: 'COMPLETED',
            baseAmount: w.hourlyRate,
            finalAmount: w.hourlyRate,
            actualStartTime: new Date(Date.now() - 86400000 * (i + 2)),
            actualEndTime: new Date(Date.now() - 86400000 * (i + 2) + 3600000 * 2),
          },
        });

        await prisma.review.create({
          data: {
            jobId: job.id,
            customerId: testCustomer.customerProfile.id,
            workerId: profile.id,
            rating: rev.rating,
            comment: rev.comment,
            isModerated: true,
            isHidden: false,
          },
        });
      }
    }

    console.log(`✔ Worker ${w.displayName} (${w.skillName}) created successfully!`);
  }

  console.log('✔ All 5 TEST workers successfully created and verified.');
}

main()
  .catch((e) => {
    console.error('Error creating test workers:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
