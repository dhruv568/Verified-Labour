import prisma from '../lib/db';

async function seedTargetWorker() {
  const workerId = '4abeba38-4f85-40a7-b823-dba77891e542';
  const userId = 'user-jariwala-dhruv-test';

  const electricalCategory = await prisma.category.findUnique({
    where: { slug: 'electrical' },
  });

  if (!electricalCategory) {
    throw new Error('Electrical category not found');
  }

  const electricianService = await prisma.service.findFirst({
    where: { categoryId: electricalCategory.id, isActive: true },
  });

  // Ensure user
  await prisma.user.upsert({
    where: { id: userId },
    update: {
      role: 'WORKER',
      status: 'ACTIVE',
    },
    create: {
      id: userId,
      phone: '+919876549999',
      email: 'dhruv.jariwala.test@example.com',
      role: 'WORKER',
      status: 'ACTIVE',
      isPhoneVerified: true,
      isEmailVerified: true,
    },
  });

  // Ensure workerProfile with EXACT target ID and PENDING_REVIEW state
  const worker = await prisma.workerProfile.upsert({
    where: { id: workerId },
    update: {
      fullName: 'Jariwala Dhruv Ajaybhai',
      primaryCategoryId: electricalCategory.id,
      status: 'PENDING_REVIEW',
      identityVerified: false,
      bankVerified: false,
      skillVerified: false,
      isAvailable: true,
      city: 'Pimpri-Chinchwad',
      state: 'Maharashtra',
      latitude: 18.6298,
      longitude: 73.7997,
      serviceRadiusKm: 50.0,
      hourlyRate: 250.0,
    },
    create: {
      id: workerId,
      userId: userId,
      fullName: 'Jariwala Dhruv Ajaybhai',
      primaryCategoryId: electricalCategory.id,
      status: 'PENDING_REVIEW',
      identityVerified: false,
      bankVerified: false,
      skillVerified: false,
      isAvailable: true,
      city: 'Pimpri-Chinchwad',
      state: 'Maharashtra',
      latitude: 18.6298,
      longitude: 73.7997,
      serviceRadiusKm: 50.0,
      hourlyRate: 250.0,
    },
  });

  // Service Area
  await prisma.workerServiceArea.deleteMany({
    where: { workerId: worker.id },
  });

  await prisma.workerServiceArea.create({
    data: {
      workerId: worker.id,
      city: 'Pimpri-Chinchwad',
      areaName: 'Pimpri-Chinchwad',
      postalCode: '411018',
    },
  });

  console.log("✔ Target worker created/updated with ID:", worker.id);
  console.log(worker);
}

seedTargetWorker()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
