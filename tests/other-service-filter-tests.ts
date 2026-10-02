import assert from 'assert';
import prisma from '../lib/db';

export async function runOtherServiceFilterTests() {
  console.log('--- Running Other Service Filter & Integration Tests ---');

  // 1. Verify Category & Service exist in Database
  const otherCat = await prisma.category.findUnique({
    where: { slug: 'other-service' },
    include: { services: true }
  });

  assert(otherCat, 'Category other-service must exist in DB');
  assert(otherCat.services.length > 0, 'Service in other-service category must exist in DB');

  const otherService = otherCat.services[0];
  assert.strictEqual(otherService.slug, 'other-work-service', 'Service slug must be other-work-service');
  console.log(`  ✔ PASS: Found category '${otherCat.name}' (ID: ${otherCat.id}) and service '${otherService.name}' (ID: ${otherService.id})`);

  // 2. Query workers with primaryCategory = other-service
  const otherWorkers = await prisma.workerProfile.findMany({
    where: {
      status: 'VERIFIED',
      OR: [
        { primaryCategory: { slug: 'other-service' } },
        { skills: { some: { category: { slug: 'other-service' } } } }
      ]
    }
  });

  console.log(`  ✔ PASS: Worker query for other-service executed cleanly, found ${otherWorkers.length} matching workers.`);

  // 3. Test Booking Flow with Other Worker
  // Create or retrieve a test worker for Other service
  let otherWorkerProfile = await prisma.workerProfile.findFirst({
    where: { primaryCategoryId: otherCat.id, status: 'VERIFIED' }
  });

  if (!otherWorkerProfile) {
    const testUser = await prisma.user.create({
      data: {
        phone: '+919999988888',
        role: 'WORKER',
        status: 'ACTIVE',
        workerProfile: {
          create: {
            fullName: 'Other Work Specialist',
            primaryCategoryId: otherCat.id,
            status: 'VERIFIED',
            isAvailable: true,
            hourlyRate: 400
          }
        }
      },
      include: { workerProfile: true }
    });
    otherWorkerProfile = testUser.workerProfile!;
  }

  // Create customer
  let customerUser = await prisma.user.findFirst({
    where: { role: 'CUSTOMER' },
    include: { customerProfile: true }
  });

  if (!customerUser?.customerProfile) {
    customerUser = await prisma.user.create({
      data: {
        phone: '+919888877777',
        role: 'CUSTOMER',
        status: 'ACTIVE',
        customerProfile: {
          create: { fullName: 'Other Filter Customer' }
        }
      },
      include: { customerProfile: true }
    });
  }

  const customerProfileId = customerUser.customerProfile!.id;

  // Create Job Request & Job using valid otherService.id
  const { job } = await prisma.$transaction(async (tx) => {
    const jr = await tx.jobRequest.create({
      data: {
        customerId: customerProfileId,
        categoryId: otherCat.id,
        serviceId: otherService.id,
        description: 'Custom work booking test',
        formattedAddress: 'Adajan, Surat',
        latitude: 21.1925,
        longitude: 72.7933,
        preferredDate: new Date().toISOString().split('T')[0],
        preferredTime: '10:00 AM',
        urgency: 'IMMEDIATE',
        budget: otherService.basePrice,
        status: 'MATCHED'
      }
    });

    const j = await tx.job.create({
      data: {
        jobRequestId: jr.id,
        customerId: customerProfileId,
        workerId: otherWorkerProfile!.id,
        serviceId: otherService.id,
        status: 'REQUESTED',
        baseAmount: otherService.basePrice,
        finalAmount: otherService.basePrice
      }
    });

    return { jobRequest: jr, job: j };
  });

  assert(job.id, 'Job should be created successfully');
  assert.strictEqual(job.serviceId, otherService.id, 'Job serviceId must match valid DB service ID');
  console.log(`  ✔ PASS: Job created successfully with valid Service ID (${job.serviceId}) - No foreign key violation!`);

  // Clean up test job
  await prisma.job.delete({ where: { id: job.id } });
  await prisma.jobRequest.delete({ where: { id: job.jobRequestId } });

  console.log('--- ALL OTHER SERVICE FILTER & BOOKING TESTS PASSED ---');
}
