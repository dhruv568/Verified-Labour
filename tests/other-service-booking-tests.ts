import assert from 'assert';
import prisma from '../lib/db';
import { POPULAR_SERVICE_FILTERS } from '../components/ui/ServiceFilterBar';

export async function runOtherServiceBookingTests() {
  console.log('--- Running Other Service & Category Tests ---');

  // 1. Verify 6-7 Popular Services Configuration
  assert.strictEqual(POPULAR_SERVICE_FILTERS.length, 6, 'Popular service filter list must contain 6 main services');
  const slugs = POPULAR_SERVICE_FILTERS.map(s => s.slug);
  assert(slugs.includes('electrical'), 'Electrician must be present');
  assert(slugs.includes('plumbing'), 'Plumber must be present');
  assert(slugs.includes('ac-technician'), 'AC Technician must be present');
  assert(slugs.includes('carpenter'), 'Carpenter must be present');
  assert(slugs.includes('painting'), 'Painter must be present');
  assert(slugs.includes('cleaning'), 'Cleaning must be present');
  console.log('  ✔ PASS: 6 popular service filter definitions verified');

  // 2. Verify 'other-service' Category and 'other-work-service' Service exist in Database
  const otherCat = await prisma.category.findUnique({
    where: { slug: 'other-service' },
    include: { services: true }
  });
  assert(otherCat, "Category 'other-service' must exist in DB");
  assert.strictEqual(otherCat.slug, 'other-service', "Category slug must be 'other-service'");

  const otherService = await prisma.service.findUnique({
    where: { slug: 'other-work-service' }
  });
  assert(otherService, "Service 'other-work-service' must exist in DB");
  assert.strictEqual(otherService.categoryId, otherCat.id, "Other service categoryId must match other-service category ID");
  console.log('  ✔ PASS: Database backing records for Other Work / Other Service verified in DB');

  // 3. Test Booking Flow with OTHER service
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
          create: { fullName: 'Other Test Customer' }
        }
      },
      include: { customerProfile: true }
    });
  }

  const customerProfileId = customerUser.customerProfile!.id;

  let worker = await prisma.workerProfile.findFirst({
    where: { status: 'VERIFIED', isAvailable: true }
  });

  if (!worker) {
    const workerUser = await prisma.user.create({
      data: {
        phone: '+919876543211',
        role: 'WORKER',
        status: 'ACTIVE',
        workerProfile: {
          create: {
            fullName: 'General Worker',
            status: 'VERIFIED',
            isAvailable: true,
            hourlyRate: 350
          }
        }
      },
      include: { workerProfile: true }
    });
    worker = workerUser.workerProfile!;
  }

  // Perform transaction creating JobRequest and Job using 'other-work-service' backing ID
  const customTaskText = 'Custom work: Repair custom outdoor garden LED strip';
  const { jr, job } = await prisma.$transaction(async (tx) => {
    const jrCreated = await tx.jobRequest.create({
      data: {
        customerId: customerProfileId,
        categoryId: otherCat.id,
        serviceId: otherService.id,
        description: `[विशिष्ट काम / Custom Work: ${customTaskText}] Requirement details`,
        formattedAddress: '101 Horizon Plaza, Surat',
        latitude: 21.1702,
        longitude: 72.8311,
        preferredDate: new Date().toISOString().split('T')[0],
        preferredTime: '04:00 PM',
        urgency: 'IMMEDIATE',
        budget: 500,
        status: 'MATCHED'
      }
    });

    const jobCreated = await tx.job.create({
      data: {
        jobRequestId: jrCreated.id,
        customerId: customerProfileId,
        workerId: worker!.id,
        serviceId: otherService.id, // Valid FK in Service table
        status: 'REQUESTED',
        baseAmount: 500,
        finalAmount: 500
      }
    });

    return { jr: jrCreated, job: jobCreated };
  });

  assert(jr.id, 'JobRequest created successfully');
  assert(job.id, 'Job created successfully');
  assert.strictEqual(job.serviceId, otherService.id, 'Job serviceId must match valid Service.id');
  console.log('  ✔ PASS: OTHER custom work booking creates valid Job record with valid Service FK');

  console.log('\n✔ All Other Service & Category Tests PASSED Successfully!\n');
}
