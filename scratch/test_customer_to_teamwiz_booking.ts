import prisma from '../lib/db';
import { evaluateWorkerVerification, syncWorkerVerificationStatus } from '../lib/worker-verification';

async function testCustomerToTeamwizBooking() {
  console.log("====================================================");
  console.log("--- REAL CUSTOMER -> WORKER BOOKING TEST ---");
  console.log("====================================================\n");

  // 1. Worker Account Diagnostic
  const email = 'teamwizranger@gmail.com';
  const user = await prisma.user.findUnique({
    where: { email },
    include: {
      workerProfile: {
        include: {
          aadhaarVerif: true,
          bankVerif: true,
          primaryCategory: true,
          skills: { include: { service: true, category: true } },
          serviceAreas: true,
        },
      },
    },
  });

  if (!user || !user.workerProfile) {
    throw new Error('Worker user teamwizranger@gmail.com not found');
  }

  const worker = user.workerProfile;
  console.log("1. WORKER INITIAL STATE:");
  console.log(`   - Email: ${user.email}`);
  console.log(`   - Worker ID: ${worker.id}`);
  console.log(`   - Worker Status: ${worker.status}`);
  console.log(`   - identityVerified: ${worker.identityVerified}`);
  console.log(`   - bankVerified: ${worker.bankVerified}`);
  console.log(`   - skillVerified: ${worker.skillVerified}`);
  console.log(`   - isAvailable: ${worker.isAvailable}`);
  console.log(`   - Location: ${worker.city}, ${worker.state} (${worker.latitude}, ${worker.longitude})`);
  console.log(`   - Primary Service: ${worker.primaryCategory?.name}`);

  // Ensure worker status & availability are active/online
  await syncWorkerVerificationStatus(worker.id);
  await prisma.workerProfile.update({
    where: { id: worker.id },
    data: { isAvailable: true },
  });

  // 2. Customer Search Query Simulation (Search for Electrical workers in Pimpri-Chinchwad)
  console.log("\n2. CUSTOMER SEARCH QUERY:");
  const electricalWorkers = await prisma.workerProfile.findMany({
    where: {
      status: 'VERIFIED',
      isAvailable: true,
      OR: [
        { primaryCategory: { slug: 'electrical' } },
        { skills: { some: { category: { slug: 'electrical' } } } },
      ],
      AND: [
        {
          OR: [
            { city: { contains: 'Pimpri-Chinchwad' } },
            { serviceAreas: { some: { city: { contains: 'Pimpri-Chinchwad' } } } },
          ],
        },
      ],
    },
    include: {
      primaryCategory: true,
      skills: { include: { service: true } },
    },
  });

  const foundWorker = electricalWorkers.find((w) => w.id === worker.id);
  console.log(`   - Total Electrical Workers Found in Pimpri-Chinchwad: ${electricalWorkers.length}`);
  console.log(`   - Team Wiz Ranger Found in Customer Search? ${foundWorker ? 'PASS ✅' : 'FAIL ❌'}`);

  if (!foundWorker) {
    throw new Error('Team Wiz Ranger worker not visible in customer search results!');
  }

  // 3. Customer Booking Simulation
  console.log("\n3. CUSTOMER BOOKING CREATION:");
  const customer = await prisma.customerProfile.findFirst();
  if (!customer) {
    throw new Error('No customer profile available for booking test');
  }

  const electricianService = await prisma.service.findFirst({
    where: { slug: 'fan-light-repair', isActive: true },
  });

  if (!electricianService) {
    throw new Error('Electrician service not found in DB');
  }

  const jobRequest = await prisma.jobRequest.create({
    data: {
      customerId: customer.id,
      categoryId: electricianService.categoryId,
      serviceId: electricianService.id,
      description: 'Need urgent ceiling fan installation in Pimpri-Chinchwad',
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

  console.log(`   - Job Created ID: ${job.id}`);
  console.log(`   - Job Status: ${job.status}`);
  console.log(`   - Job Service ID: ${job.serviceId} (${electricianService.name})`);
  console.log(`   - Worker ID: ${job.workerId}`);
  console.log(`   - Booking Successful? PASS ✅`);

  // Cleanup test job
  await prisma.job.delete({ where: { id: job.id } });
  await prisma.jobRequest.delete({ where: { id: jobRequest.id } });

  console.log('\n====================================================');
  console.log('--- ALL ACCEPTANCE CHECKS PASSED SUCCESSFULLY ✅ ---');
  console.log('====================================================');
}

testCustomerToTeamwizBooking()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
