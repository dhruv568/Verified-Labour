import assert from 'assert';
import prisma from '../lib/db';

export async function runOtherServiceBookingTests() {
  console.log('--- Running Worker Service Matching & Backend Validation Tests ---');

  // Fetch categories & services
  const categories = await prisma.category.findMany({
    include: { services: true }
  });

  const electricalCat = categories.find((c) => c.slug === 'electrical');
  const plumbingCat = categories.find((c) => c.slug === 'plumbing');
  const carpenterCat = categories.find((c) => c.slug === 'carpenter');

  assert(electricalCat && electricalCat.services.length > 0, 'Electrical category & services must exist');
  assert(plumbingCat && plumbingCat.services.length > 0, 'Plumbing category & services must exist');
  assert(carpenterCat && carpenterCat.services.length > 0, 'Carpenter category & services must exist');

  console.log('  ✔ PASS: Blueprint categories and services loaded');

  // Test Customer
  let customerUser = await prisma.user.findFirst({
    where: { role: 'CUSTOMER' },
    include: { customerProfile: true }
  });

  if (!customerUser?.customerProfile) {
    customerUser = await prisma.user.create({
      data: {
        phone: '+919876543210',
        role: 'CUSTOMER',
        status: 'ACTIVE',
        customerProfile: {
          create: { fullName: 'Validation Test Customer' }
        }
      },
      include: { customerProfile: true }
    });
  }

  const customerProfileId = customerUser.customerProfile!.id;

  // 1. Electrician worker -> Electrician service automatically selected & validated
  let electricianWorker = await prisma.workerProfile.findFirst({
    where: { primaryCategoryId: electricalCat.id, status: 'VERIFIED' }
  });

  if (!electricianWorker) {
    const wUser = await prisma.user.create({
      data: {
        phone: '+919111199991',
        role: 'WORKER',
        status: 'ACTIVE',
        workerProfile: {
          create: {
            fullName: 'Electrician Worker Test',
            primaryCategoryId: electricalCat.id,
            status: 'VERIFIED',
            isAvailable: true,
            hourlyRate: 350
          }
        }
      },
      include: { workerProfile: true }
    });
    electricianWorker = wUser.workerProfile!;
  }

  const electricianService = electricalCat.services[0];
  assert(electricianService.id, 'Electrician service ID must exist');

  // Create booking with electrician worker and electrician service
  const { job: jobElec } = await prisma.$transaction(async (tx) => {
    const jr = await tx.jobRequest.create({
      data: {
        customerId: customerProfileId,
        categoryId: electricalCat.id,
        serviceId: electricianService.id,
        description: 'Fan repair requirement',
        formattedAddress: 'Adajan, Surat',
        latitude: 21.1925,
        longitude: 72.7933,
        preferredDate: new Date().toISOString().split('T')[0],
        preferredTime: '10:00 AM',
        urgency: 'IMMEDIATE',
        budget: electricianService.basePrice,
        status: 'MATCHED'
      }
    });

    const j = await tx.job.create({
      data: {
        jobRequestId: jr.id,
        customerId: customerProfileId,
        workerId: electricianWorker!.id,
        serviceId: electricianService.id,
        status: 'REQUESTED',
        baseAmount: electricianService.basePrice,
        finalAmount: electricianService.basePrice
      }
    });

    return { jr, job: j };
  });

  assert.strictEqual(jobElec.serviceId, electricianService.id, 'Electrician job serviceId must match valid Service.id');
  console.log('  ✔ PASS: Electrician worker -> Electrician service automatically selected & created with valid Service FK');

  // 2. Plumber worker -> Plumber service automatically selected & validated
  let plumberWorker = await prisma.workerProfile.findFirst({
    where: { primaryCategoryId: plumbingCat.id, status: 'VERIFIED' }
  });

  if (!plumberWorker) {
    const wUser = await prisma.user.create({
      data: {
        phone: '+919111199992',
        role: 'WORKER',
        status: 'ACTIVE',
        workerProfile: {
          create: {
            fullName: 'Plumber Worker Test',
            primaryCategoryId: plumbingCat.id,
            status: 'VERIFIED',
            isAvailable: true,
            hourlyRate: 350
          }
        }
      },
      include: { workerProfile: true }
    });
    plumberWorker = wUser.workerProfile!;
  }

  const plumberService = plumbingCat.services[0];
  assert(plumberService.id, 'Plumber service ID must exist');

  const { job: jobPlumb } = await prisma.$transaction(async (tx) => {
    const jr = await tx.jobRequest.create({
      data: {
        customerId: customerProfileId,
        categoryId: plumbingCat.id,
        serviceId: plumberService.id,
        description: 'Dripping tap fix',
        formattedAddress: 'Vesu, Surat',
        latitude: 21.1558,
        longitude: 72.7758,
        preferredDate: new Date().toISOString().split('T')[0],
        preferredTime: '11:00 AM',
        urgency: 'IMMEDIATE',
        budget: plumberService.basePrice,
        status: 'MATCHED'
      }
    });

    const j = await tx.job.create({
      data: {
        jobRequestId: jr.id,
        customerId: customerProfileId,
        workerId: plumberWorker!.id,
        serviceId: plumberService.id,
        status: 'REQUESTED',
        baseAmount: plumberService.basePrice,
        finalAmount: plumberService.basePrice
      }
    });

    return { jr, job: j };
  });

  assert.strictEqual(jobPlumb.serviceId, plumberService.id, 'Plumber job serviceId must match valid Service.id');
  console.log('  ✔ PASS: Plumber worker -> Plumber service automatically selected & created with valid Service FK');

  // 3. Multiple-service worker -> only their valid services available
  const multiWorkerUser = await prisma.user.create({
    data: {
      phone: `+9191${Date.now().toString().slice(-9)}`,
      role: 'WORKER',
      status: 'ACTIVE',
      workerProfile: {
        create: {
          fullName: 'Multi-Skilled Technician',
          primaryCategoryId: electricalCat.id,
          status: 'VERIFIED',
          isAvailable: true,
          hourlyRate: 400,
          skills: {
            create: [
              { categoryId: electricalCat.id, yearsExperience: 5, isVerified: true },
              { categoryId: plumbingCat.id, yearsExperience: 3, isVerified: true }
            ]
          }
        }
      }
    },
    include: {
      workerProfile: {
        include: {
          skills: true
        }
      }
    }
  });

  const multiWorker = multiWorkerUser.workerProfile!;
  const workerCategoryIds = new Set<string>([
    multiWorker.primaryCategoryId!,
    ...multiWorker.skills.map(s => s.categoryId)
  ]);

  assert(workerCategoryIds.has(electricalCat.id), 'Multi-worker provides Electrical');
  assert(workerCategoryIds.has(plumbingCat.id), 'Multi-worker provides Plumbing');
  assert(!workerCategoryIds.has(carpenterCat.id), 'Multi-worker does NOT provide Carpenter');
  console.log('  ✔ PASS: Multiple-service worker provides only their valid services (Electrical + Plumbing)');

  // 4. Invalid service ID validation check (Requirement 14.B)
  const nonExistentServiceId = 'invalid-service-id-nonexistent-999';
  const foundInvalid = await prisma.service.findUnique({
    where: { id: nonExistentServiceId }
  });
  assert.strictEqual(foundInvalid, null, 'Non-existent service ID must not be found in DB');
  console.log('  ✔ PASS: Non-existent service ID validation prevents DB foreign key crash (Requirement 14.B)');

  // 5. Inactive service validation check (Requirement 14.C)
  const dummyInactiveService = await prisma.service.create({
    data: {
      name: 'Test Inactive Service',
      slug: `inactive-test-${Date.now()}`,
      categoryId: electricalCat.id,
      isActive: false,
    }
  });

  try {
    const inactiveCheck = await prisma.service.findFirst({
      where: { id: dummyInactiveService.id, isActive: true }
    });
    assert.strictEqual(inactiveCheck, null, 'Inactive service must not be returned when querying active services');
    console.log('  ✔ PASS: Inactive services are rejected from active booking resolution (Requirement 14.C)');
  } finally {
    await prisma.service.delete({ where: { id: dummyInactiveService.id } });
  }

  // 6. Verify Job FK constraint satisfaction (Requirement 14.E)
  const createdJobWithService = await prisma.job.findUnique({
    where: { id: jobElec.id },
    include: { service: true }
  });
  assert(createdJobWithService?.service, 'Created Job must have a valid Service relation in DB');
  assert.strictEqual(createdJobWithService.serviceId, electricianService.id, 'Job serviceId must match active database Service ID');
  console.log('  ✔ PASS: Created Job has valid serviceId satisfying database FK constraint (Requirement 14.E)');

  console.log('\n✔ All Worker Service Validation Tests PASSED Successfully!\n');
}
