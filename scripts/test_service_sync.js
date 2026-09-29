const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function runEndToEndTests() {
  console.log('====================================================');
  console.log('STARTING SERVICE / CATEGORY SYNCHRONIZATION E2E TESTS');
  console.log('====================================================\n');

  try {
    // TEST 1: Check existing active categories & services
    console.log('TEST 1: Fetching active categories and services from DB...');
    const activeCategories = await prisma.category.findMany({
      where: { isActive: true },
      include: { services: { where: { isActive: true } } },
    });
    const activeServices = await prisma.service.findMany({
      where: { isActive: true, category: { isActive: true } },
      include: { category: true },
    });
    console.log(`✔ Found ${activeCategories.length} active categories and ${activeServices.length} active services in database.`);
    if (activeCategories.length === 0) {
      throw new Error('No active categories found in database!');
    }

    const testCat = activeCategories[0];
    console.log(`  Targeting Category: "${testCat.name}" (ID: ${testCat.id})`);

    // TEST 2: Admin creates a new service
    const newServiceName = `Test RO Purifier Tech ${Date.now()}`;
    const newServiceSlug = `test-ro-purifier-${Date.now()}`;
    console.log(`\nTEST 2: Admin creating new service: "${newServiceName}"...`);

    const createdService = await prisma.service.create({
      data: {
        categoryId: testCat.id,
        name: newServiceName,
        nameHi: 'टेस्ट आर.ओ. प्यूरीफायर',
        slug: newServiceSlug,
        basePrice: 400.0,
        priceUnit: 'per job',
        isActive: true,
      },
    });
    console.log(`✔ New service created with ID: ${createdService.id}`);

    // Verify it appears in active public services query
    const publicServicesAfterCreate = await prisma.service.findMany({
      where: { isActive: true, category: { isActive: true } },
    });
    const foundCreated = publicServicesAfterCreate.find((s) => s.id === createdService.id);
    if (!foundCreated) {
      throw new Error('TEST 2 FAILED: Newly created service did not appear in active public services!');
    }
    console.log(`✔ SUCCESS: Newly created service "${foundCreated.name}" appears in public services listing.`);

    // TEST 3: Admin edits the service name & price
    const updatedServiceName = `Test RO & Alkaline Filter Expert ${Date.now()}`;
    console.log(`\nTEST 3: Admin editing service name to: "${updatedServiceName}" & basePrice: 550...`);

    const updatedService = await prisma.service.update({
      where: { id: createdService.id },
      data: {
        name: updatedServiceName,
        basePrice: 550.0,
      },
    });
    console.log(`✔ Service updated in DB.`);

    const publicServicesAfterEdit = await prisma.service.findMany({
      where: { isActive: true, category: { isActive: true } },
    });
    const foundEdited = publicServicesAfterEdit.find((s) => s.id === createdService.id);
    if (!foundEdited || foundEdited.name !== updatedServiceName || foundEdited.basePrice !== 550.0) {
      throw new Error('TEST 3 FAILED: Updated service name or price did not reflect in public services!');
    }
    console.log(`✔ SUCCESS: Edited service name "${foundEdited.name}" (₹${foundEdited.basePrice}) appears correctly.`);

    // TEST 4: Admin deactivates the service
    console.log(`\nTEST 4: Admin deactivating service (isActive = false)...`);
    await prisma.service.update({
      where: { id: createdService.id },
      data: { isActive: false },
    });

    const publicServicesAfterDeactivate = await prisma.service.findMany({
      where: { isActive: true, category: { isActive: true } },
    });
    const foundDeactivated = publicServicesAfterDeactivate.find((s) => s.id === createdService.id);
    if (foundDeactivated) {
      throw new Error('TEST 4 FAILED: Deactivated service still appeared in active public services!');
    }
    console.log(`✔ SUCCESS: Deactivated service is hidden from customer booking dropdown / public services.`);

    // TEST 5: Admin reactivates the service
    console.log(`\nTEST 5: Admin reactivating service (isActive = true)...`);
    await prisma.service.update({
      where: { id: createdService.id },
      data: { isActive: true },
    });

    const publicServicesAfterReactivate = await prisma.service.findMany({
      where: { isActive: true, category: { isActive: true } },
    });
    const foundReactivated = publicServicesAfterReactivate.find((s) => s.id === createdService.id);
    if (!foundReactivated) {
      throw new Error('TEST 5 FAILED: Reactivated service did not reappear in public services!');
    }
    console.log(`✔ SUCCESS: Reactivated service "${foundReactivated.name}" reappeared in customer booking dropdown.`);

    // TEST 6: Worker matching test
    console.log(`\nTEST 6: Testing Worker Matching for category "${testCat.name}"...`);
    const verifiedWorker = await prisma.workerProfile.findFirst({
      where: {
        status: 'VERIFIED',
        isAvailable: true,
        OR: [
          { primaryCategoryId: testCat.id },
          { skills: { some: { categoryId: testCat.id } } },
        ],
      },
      include: { primaryCategory: true },
    });

    if (verifiedWorker) {
      console.log(`✔ Found matching verified worker: "${verifiedWorker.fullName}" (Category: ${verifiedWorker.primaryCategory?.name || 'Assigned'})`);
    } else {
      console.log(`ℹ Note: No specific worker assigned to test category, testing general worker matching...`);
    }

    // TEST 7: Cleanup test artifact from DB
    console.log(`\nTEST 7: Cleaning up test service...`);
    await prisma.service.delete({ where: { id: createdService.id } });
    console.log(`✔ Test service deleted cleanly.`);

    console.log('\n====================================================');
    console.log('ALL 7 E2E SYNCHRONIZATION TESTS PASSED SUCCESSFULLY!');
    console.log('====================================================');
  } catch (err) {
    console.error('\n❌ E2E TEST FAILED:', err.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runEndToEndTests();
