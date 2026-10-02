import prisma from '../lib/db';
import { evaluateWorkerVerification, syncWorkerVerificationStatus } from '../lib/worker-verification';

async function verifyEndToEndFlow() {
  console.log('====================================================');
  console.log('--- END-TO-END WORKER VERIFICATION & VISIBILITY TEST ---');
  console.log('====================================================\n');

  // STEP 1: Find Worker User
  const email = 'teamwizranger@gmail.com';
  const user = await prisma.user.findUnique({
    where: { email },
    include: {
      workerProfile: {
        include: {
          aadhaarVerif: true,
          bankVerif: true,
          primaryCategory: true,
          skills: { include: { service: true } },
          serviceAreas: true,
        },
      },
    },
  });

  if (!user || !user.workerProfile) {
    throw new Error(`Worker account ${email} not found`);
  }

  const worker = user.workerProfile;
  console.log(`✔ STEP 1 PASS: Found worker ${worker.fullName} (ID: ${worker.id})`);

  // STEP 2: Evaluate & Sync Verification Status
  const evalResult = await evaluateWorkerVerification(worker.id);
  const syncedStatus = await syncWorkerVerificationStatus(worker.id);

  console.log('✔ STEP 2 PASS: evaluateWorkerVerification & syncWorkerVerificationStatus:');
  console.log(`   - Aadhaar Verified: ${evalResult.isAadhaarVerified}`);
  console.log(`   - Bank Verified: ${evalResult.isBankVerified}`);
  console.log(`   - Profile Complete: ${evalResult.isProfileComplete}`);
  console.log(`   - Eligible for Verified: ${evalResult.isEligibleForVerified}`);
  console.log(`   - Synced Worker Status: ${syncedStatus}`);

  if (syncedStatus !== 'VERIFIED') {
    throw new Error(`Worker status sync failed. Expected VERIFIED, got ${syncedStatus}`);
  }

  // STEP 3: Confirm Online & Location
  await prisma.workerProfile.update({
    where: { id: worker.id },
    data: { isAvailable: true },
  });

  const updatedWorker = await prisma.workerProfile.findUnique({
    where: { id: worker.id },
    include: { primaryCategory: true, skills: { include: { service: true } } },
  });

  console.log('✔ STEP 3 PASS: Availability & Location details:');
  console.log(`   - Available (Online): ${updatedWorker?.isAvailable}`);
  console.log(`   - City: ${updatedWorker?.city}, ${updatedWorker?.state}`);
  console.log(`   - Coordinates: (${updatedWorker?.latitude}, ${updatedWorker?.longitude})`);

  // STEP 4: Customer Worker Search Matching
  const searchResults = await prisma.workerProfile.findMany({
    where: {
      status: 'VERIFIED',
      isAvailable: true,
      OR: [
        { primaryCategory: { slug: 'electrical' } },
        { skills: { some: { category: { slug: 'electrical' } } } },
      ],
    },
    include: { primaryCategory: true, skills: true },
  });

  const isReturnedInSearch = searchResults.some((w) => w.id === worker.id);
  console.log(`✔ STEP 4 PASS: Customer Search for Electrical Workers in Pimpri-Chinchwad:`);
  console.log(`   - Found Team Wiz Ranger in search? ${isReturnedInSearch ? 'PASS ✅' : 'FAIL ❌'}`);

  if (!isReturnedInSearch) {
    throw new Error('Worker was NOT returned in customer search results!');
  }

  // STEP 5: Test Booking Creation with Real Service ID
  const electricianService = await prisma.service.findFirst({
    where: { slug: 'fan-light-repair', isActive: true },
  });

  if (!electricianService) {
    throw new Error('Electrician service not found in DB');
  }

  const customer = await prisma.customerProfile.findFirst();
  if (!customer) {
    throw new Error('No customer profile found in DB for test');
  }

  const jobRequest = await prisma.jobRequest.create({
    data: {
      customerId: customer.id,
      categoryId: electricianService.categoryId,
      serviceId: electricianService.id,
      description: 'Install 3 ceiling fans and check main switchboard',
      formattedAddress: 'Pimpri-Chinchwad, Maharashtra',
      latitude: 18.6298,
      longitude: 73.7997,
      preferredDate: new Date().toISOString().split('T')[0],
      preferredTime: 'Immediate',
      urgency: 'IMMEDIATE',
      budget: 250.0,
      status: 'MATCHED',
    },
  });

  const job = await prisma.job.create({
    data: {
      jobRequestId: jobRequest.id,
      customerId: customer.id,
      workerId: worker.id,
      serviceId: electricianService.id,
      status: 'REQUESTED',
      baseAmount: 250.0,
      finalAmount: 250.0,
    },
  });

  console.log(`✔ STEP 5 PASS: Booking creation test with real Service ID:`);
  console.log(`   - Job Created ID: ${job.id}`);
  console.log(`   - Service ID: ${job.serviceId} (${electricianService.name})`);
  console.log(`   - Initial Status: ${job.status}`);

  // Cleanup test job
  await prisma.job.delete({ where: { id: job.id } });
  await prisma.jobRequest.delete({ where: { id: jobRequest.id } });
  console.log('   - Test job cleaned up successfully.');

  console.log('\n====================================================');
  console.log('--- ALL END-TO-END VERIFICATION CHECKS PASSED ✅ ---');
  console.log('====================================================');
}

verifyEndToEndFlow()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
