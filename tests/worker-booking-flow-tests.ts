import assert from 'assert';
import prisma from '../lib/db';

export async function runWorkerBookingFlowTests() {
  console.log('--- Running Worker Booking Flow Tests ---');

  // 1. Fetch Categories
  const categories = await prisma.category.findMany({
    include: { services: true },
  });

  const electricalCat = categories.find((c) => c.slug === 'electrical');
  const plumbingCat = categories.find((c) => c.slug === 'plumbing');
  const carpenterCat = categories.find((c) => c.slug === 'carpenter');

  assert(electricalCat, 'Electrical category must exist');
  assert(plumbingCat, 'Plumbing category must exist');
  assert(carpenterCat, 'Carpenter category must exist');

  console.log('  ✔ Categories loaded: Electrical, Plumbing, Carpenter');

  // 2. Fetch or Create Test Customer
  let customerUser = await prisma.user.findFirst({
    where: { role: 'CUSTOMER' },
    include: { customerProfile: true },
  });

  if (!customerUser) {
    customerUser = await prisma.user.create({
      data: {
        phone: '+919999888877',
        role: 'CUSTOMER',
        status: 'ACTIVE',
        customerProfile: {
          create: {
            fullName: 'Test Customer',
          },
        },
      },
      include: { customerProfile: true },
    });
  }

  assert(customerUser?.customerProfile?.id, 'Test customer profile must exist');
  const customerProfileId = customerUser.customerProfile.id;

  // 3. Create or Fetch Test Electrician Worker
  let electricianWorker = await prisma.workerProfile.findFirst({
    where: { primaryCategoryId: electricalCat.id },
  });

  if (!electricianWorker) {
    const workerUser = await prisma.user.create({
      data: {
        phone: '+919888000111',
        role: 'WORKER',
        status: 'ACTIVE',
        workerProfile: {
          create: {
            fullName: 'Vijay Gupta (Electrician)',
            primaryCategoryId: electricalCat.id,
            status: 'VERIFIED',
            isAvailable: true,
            hourlyRate: 350,
          },
        },
      },
      include: { workerProfile: true },
    });
    electricianWorker = workerUser.workerProfile!;
  }

  assert(electricianWorker, 'Electrician worker profile must exist');
  assert.strictEqual(electricianWorker.primaryCategoryId, electricalCat.id, "Worker's primary category must be Electrical");

  // 4. Test JobRequest creation with specific service for Electrician
  const electricalService = electricalCat.services[0];
  assert(electricalService, 'Electrical service must exist');

  const jobReq1 = await prisma.$transaction(async (tx) => {
    const jr = await tx.jobRequest.create({
      data: {
        customerId: customerProfileId,
        categoryId: electricianWorker.primaryCategoryId!, // Worker's actual category ID!
        serviceId: electricalService.id,
        description: 'Fixing ceiling fan capacitor and wiring',
        formattedAddress: '402 Shivalik Heights, Surat',
        latitude: 21.1925,
        longitude: 72.7933,
        preferredDate: new Date().toISOString().split('T')[0],
        preferredTime: '10:00 AM',
        urgency: 'IMMEDIATE',
        budget: electricalService.basePrice,
        status: 'MATCHED',
      },
    });

    const job = await tx.job.create({
      data: {
        jobRequestId: jr.id,
        customerId: customerProfileId,
        workerId: electricianWorker.id,
        serviceId: electricalService.id,
        status: 'REQUESTED',
        baseAmount: electricalService.basePrice,
        finalAmount: electricalService.basePrice,
      },
    });

    return { jr, job };
  });

  assert.strictEqual(jobReq1.jr.categoryId, electricalCat.id, 'JobRequest categoryId must match Electrician worker category ID');
  assert.strictEqual(jobReq1.jr.serviceId, electricalService.id, 'JobRequest serviceId must match selected service');
  console.log('  ✔ PASS: Electrician booking succeeds with correct Category ID and Service ID');

  // 5. Test "OTHER" Custom Work booking for Electrician
  const customWorkDescription = 'Custom work: Short Circuit Repair near main DB box';

  const jobReq2 = await prisma.$transaction(async (tx) => {
    const jr = await tx.jobRequest.create({
      data: {
        customerId: customerProfileId,
        categoryId: electricianWorker.primaryCategoryId!, // Worker's actual category ID!
        serviceId: null, // 'OTHER' maps to null serviceId in JobRequest
        description: `[विशिष्ट काम / Custom Work: Short Circuit Repair] ${customWorkDescription}`,
        formattedAddress: '402 Shivalik Heights, Surat',
        latitude: 21.1925,
        longitude: 72.7933,
        preferredDate: new Date().toISOString().split('T')[0],
        preferredTime: '11:00 AM',
        urgency: 'IMMEDIATE',
        budget: 450,
        status: 'MATCHED',
      },
    });

    const job = await tx.job.create({
      data: {
        jobRequestId: jr.id,
        customerId: customerProfileId,
        workerId: electricianWorker.id,
        serviceId: electricalService.id, // Fallback service under electrician category for Job model
        status: 'REQUESTED',
        baseAmount: 450,
        finalAmount: 450,
      },
    });

    return { jr, job };
  });

  assert.strictEqual(jobReq2.jr.categoryId, electricalCat.id, 'Custom work JobRequest categoryId must STILL match Electrician worker category ID');
  assert.strictEqual(jobReq2.jr.serviceId, null, 'Custom work JobRequest serviceId must be null');
  assert(jobReq2.jr.description.includes('Short Circuit Repair'), 'Custom work description must be preserved in JobRequest');
  console.log('  ✔ PASS: "OTHER" custom work booking succeeds with worker category ID and custom description');

  // 6. Test Plumber Worker category resolution
  let plumberWorker = await prisma.workerProfile.findFirst({
    where: { primaryCategoryId: plumbingCat.id },
  });

  if (!plumberWorker) {
    const plumberUser = await prisma.user.create({
      data: {
        phone: '+919888000222',
        role: 'WORKER',
        status: 'ACTIVE',
        workerProfile: {
          create: {
            fullName: 'Amit Shinde (Plumber)',
            primaryCategoryId: plumbingCat.id,
            status: 'VERIFIED',
            isAvailable: true,
            hourlyRate: 300,
          },
        },
      },
      include: { workerProfile: true },
    });
    plumberWorker = plumberUser.workerProfile!;
  }

  const plumbingService = plumbingCat.services[0];
  assert(plumbingService, 'Plumbing service must exist');

  const jobReq3 = await prisma.$transaction(async (tx) => {
    const jr = await tx.jobRequest.create({
      data: {
        customerId: customerProfileId,
        categoryId: plumberWorker.primaryCategoryId!,
        serviceId: plumbingService.id,
        description: 'Tap leakage fixing in bathroom',
        formattedAddress: '402 Shivalik Heights, Surat',
        latitude: 21.1925,
        longitude: 72.7933,
        preferredDate: new Date().toISOString().split('T')[0],
        preferredTime: '02:00 PM',
        urgency: 'SCHEDULED',
        budget: plumbingService.basePrice,
        status: 'MATCHED',
      },
    });

    return jr;
  });

  assert.strictEqual(jobReq3.categoryId, plumbingCat.id, 'Plumber JobRequest categoryId must match Plumbing Category ID');
  console.log('  ✔ PASS: Plumber worker booking succeeds with Plumbing Category ID');

  console.log('\n✔ All Worker Booking Flow Tests PASSED Successfully!\n');
}
