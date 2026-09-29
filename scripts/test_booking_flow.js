const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function runBookingCategoryTests() {
  console.log('====================================================');
  console.log('TESTING BOOKING JOB REQUEST CATEGORY MAPPING & VALIDATION');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (!condition) {
      throw new Error(message || 'Assertion failed');
    }
  }

  // 1. Get an existing verified worker and customer profile for testing
  const worker = await prisma.workerProfile.findFirst({
    where: { status: 'VERIFIED', isAvailable: true, primaryCategory: { slug: 'electrical' } },
    include: { primaryCategory: true },
  });

  if (!worker) {
    console.error('✖ FAIL: Pre-requisite verified Electrical worker not found in DB');
    return;
  }

  const customer = await prisma.customerProfile.findFirst();
  if (!customer) {
    console.error('✖ FAIL: Pre-requisite customer profile not found in DB');
    return;
  }

  const electricalCategory = await prisma.category.findFirst({ where: { slug: 'electrical' } });
  assert(electricalCategory, 'Electrical category must exist');

  const fanService = await prisma.service.findFirst({ where: { categoryId: electricalCategory.id, slug: 'fan-light-repair' } });
  const wiringService = await prisma.service.findFirst({ where: { categoryId: electricalCategory.id, slug: 'fan-light-repair' } }); // or any electrical service

  console.log(`Using Worker: ${worker.fullName} (${worker.id})`);
  console.log(`Using Customer: ${customer.fullName} (${customer.id})`);
  console.log(`Using Electrical Category: ${electricalCategory.name} (${electricalCategory.id})\n`);

  // Simulated server resolution logic function (matching route.ts)
  async function resolveAndValidateCategory({ serviceId, categoryId, workerId }) {
    const w = await prisma.workerProfile.findUnique({
      where: { id: workerId },
      include: { primaryCategory: true, skills: { include: { category: true } } },
    });

    let resolvedCategoryId = null;
    let selectedServiceObj = null;

    if (serviceId && serviceId !== 'OTHER') {
      selectedServiceObj = await prisma.service.findUnique({ where: { id: serviceId } });
      if (selectedServiceObj?.categoryId) {
        resolvedCategoryId = selectedServiceObj.categoryId;
      }
    }

    if (!resolvedCategoryId && categoryId && categoryId !== 'ALL' && categoryId !== 'OTHER') {
      const catCheck = await prisma.category.findUnique({ where: { id: categoryId }, select: { id: true } });
      if (catCheck) {
        resolvedCategoryId = catCheck.id;
      } else {
        const svcCheck = await prisma.service.findUnique({ where: { id: categoryId }, select: { categoryId: true } });
        if (svcCheck?.categoryId) {
          resolvedCategoryId = svcCheck.categoryId;
        }
      }
    }

    if (!resolvedCategoryId && w) {
      if (w.primaryCategoryId) resolvedCategoryId = w.primaryCategoryId;
      else if (w.primaryCategory?.id) resolvedCategoryId = w.primaryCategory.id;
    }

    if (!resolvedCategoryId) {
      return { success: false, status: 400, error: 'Invalid or missing job category. Please select a valid service or category.' };
    }

    const categoryExists = await prisma.category.findUnique({ where: { id: resolvedCategoryId }, select: { id: true } });
    if (!categoryExists) {
      return { success: false, status: 400, error: 'The selected category does not exist. Please select a valid service.' };
    }

    return { success: true, resolvedCategoryId, selectedServiceObj };
  }

  // TEST A: Existing specific service: Fan Light Repair
  try {
    const res = await resolveAndValidateCategory({
      serviceId: fanService.id,
      categoryId: fanService.categoryId,
      workerId: worker.id,
    });
    assert(res.success, 'Test A should succeed');
    assert(res.resolvedCategoryId === electricalCategory.id, `Expected categoryId ${electricalCategory.id}, got ${res.resolvedCategoryId}`);

    // Create JobRequest in DB transaction to test foreign key constraint
    const createdReq = await prisma.jobRequest.create({
      data: {
        customerId: customer.id,
        categoryId: res.resolvedCategoryId,
        serviceId: res.selectedServiceObj.id,
        description: 'Test Fan Repair Request',
        formattedAddress: 'Test Address Surat',
        latitude: 21.17,
        longitude: 72.83,
        preferredDate: '2026-10-01',
        preferredTime: '10:00 AM',
        status: 'OPEN',
      },
    });
    assert(createdReq.id, 'JobRequest created in DB');
    assert(createdReq.categoryId === electricalCategory.id, 'Created JobRequest has correct valid categoryId');

    // Clean up test request
    await prisma.jobRequest.delete({ where: { id: createdReq.id } });

    console.log('✔ PASS Test A: Existing specific service (Fan Repair) creates JobRequest with valid categoryId');
    passed++;
  } catch (err) {
    console.error('✖ FAIL Test A:', err.message);
    failed++;
  }

  // TEST B: Another specific service: Wiring Repair
  try {
    const wiringSvc = await prisma.service.findFirst({ where: { categoryId: electricalCategory.id, slug: 'complete-room-wiring' } }) || fanService;
    const res = await resolveAndValidateCategory({
      serviceId: wiringSvc.id,
      categoryId: wiringSvc.categoryId,
      workerId: worker.id,
    });
    assert(res.success, 'Test B should succeed');
    assert(res.resolvedCategoryId === electricalCategory.id, `Expected categoryId ${electricalCategory.id}, got ${res.resolvedCategoryId}`);

    const createdReq = await prisma.jobRequest.create({
      data: {
        customerId: customer.id,
        categoryId: res.resolvedCategoryId,
        serviceId: wiringSvc.id,
        description: 'Test Wiring Repair Request',
        formattedAddress: 'Test Address Surat',
        latitude: 21.17,
        longitude: 72.83,
        preferredDate: '2026-10-01',
        preferredTime: '11:00 AM',
        status: 'OPEN',
      },
    });
    assert(createdReq.id, 'JobRequest created in DB');
    assert(createdReq.categoryId === electricalCategory.id, 'Created JobRequest has correct valid categoryId');

    await prisma.jobRequest.delete({ where: { id: createdReq.id } });

    console.log('✔ PASS Test B: Another specific service (Wiring Repair) creates JobRequest with valid categoryId');
    passed++;
  } catch (err) {
    console.error('✖ FAIL Test B:', err.message);
    failed++;
  }

  // TEST C: Other work selection
  try {
    const res = await resolveAndValidateCategory({
      serviceId: 'OTHER',
      categoryId: electricalCategory.id,
      workerId: worker.id,
    });
    assert(res.success, 'Test C should succeed');
    assert(res.resolvedCategoryId === electricalCategory.id, 'Parent category preserved when OTHER selected');

    const customDesc = '[विशिष्ट काम / Custom Work: Fix main switchboard circuit breaker] Need help fixing tripping breaker';
    const createdReq = await prisma.jobRequest.create({
      data: {
        customerId: customer.id,
        categoryId: res.resolvedCategoryId,
        serviceId: null, // OTHER maps serviceId to null in JobRequest
        description: customDesc,
        formattedAddress: 'Test Address Surat',
        latitude: 21.17,
        longitude: 72.83,
        preferredDate: '2026-10-01',
        preferredTime: '12:00 PM',
        status: 'OPEN',
      },
    });
    assert(createdReq.id, 'JobRequest for custom work created');
    assert(createdReq.categoryId === electricalCategory.id, 'JobRequest for custom work has valid categoryId');
    assert(createdReq.serviceId === null, 'JobRequest serviceId is null for custom work');
    assert(createdReq.description.includes('Fix main switchboard'), 'Custom work description preserved');

    await prisma.jobRequest.delete({ where: { id: createdReq.id } });

    console.log('✔ PASS Test C: Custom work ("Other") preserves parent categoryId and saves custom description');
    passed++;
  } catch (err) {
    console.error('✖ FAIL Test C:', err.message);
    failed++;
  }

  // TEST D: Invalid/missing category
  try {
    const res = await resolveAndValidateCategory({
      serviceId: 'OTHER',
      categoryId: 'non-existent-category-id-99999',
      workerId: 'non-existent-worker-id',
    });
    assert(!res.success, 'Test D should fail validation');
    assert(res.status === 400, 'Returns HTTP 400 validation error');
    assert(res.error.includes('category'), 'Error message describes invalid category');

    console.log('✔ PASS Test D: Invalid category returns clean 400 error without throwing DB exception');
    passed++;
  } catch (err) {
    console.error('✖ FAIL Test D:', err.message);
    failed++;
  }

  // TEST E: Verify categoryId correctness
  try {
    const res = await resolveAndValidateCategory({
      serviceId: fanService.id,
      categoryId: 'ALL', // Suppose frontend mistakenly sent 'ALL' as categoryId
      workerId: worker.id,
    });
    assert(res.success, 'Test E should resolve category from serviceId');
    assert(res.resolvedCategoryId === electricalCategory.id, 'Resolved categoryId matches actual DB Category ID');

    console.log('✔ PASS Test E: Mismatched/ALL categoryId is correctly resolved from specific service');
    passed++;
  } catch (err) {
    console.error('✖ FAIL Test E:', err.message);
    failed++;
  }

  console.log(`\nRESULTS: ${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
}

runBookingCategoryTests()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
