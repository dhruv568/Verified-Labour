import { PrismaClient } from '@prisma/client';
import { NotificationService } from '../services/notification';

const prisma = new PrismaClient();

export async function runBookingNotificationFlowAudit() {
  console.log('====================================================');
  console.log('--- END-TO-END BOOKING NOTIFICATION FLOW AUDIT ---');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string) {
    if (condition) {
      console.log(`  ✔ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${testName}`);
      failed++;
    }
  }

  try {
    // 1. Fetch active Customer and Worker Profiles from Database
    const customerProfile = await prisma.customerProfile.findFirst({
      include: { user: true },
    });
    const workerProfile = await prisma.workerProfile.findFirst({
      where: { status: 'VERIFIED' },
      include: { user: true, primaryCategory: true },
    });

    assert(!!customerProfile, '1. Active Customer Profile exists in DB');
    assert(!!workerProfile, '2. Verified Worker Profile exists in DB');

    if (!customerProfile || !workerProfile) {
      throw new Error('Test prerequisites failed: Customer or Worker profile missing');
    }

    // 2. Test Service ID Resolution for Worker's Primary Category
    const workerCatId = workerProfile.primaryCategoryId || workerProfile.primaryCategory?.id;
    let resolvedService = await prisma.service.findFirst({
      where: { categoryId: workerCatId, isActive: true },
    });

    if (!resolvedService) {
      resolvedService = await prisma.service.findFirst({
        where: { isActive: true },
      });
    }

    assert(!!resolvedService && !!resolvedService.id, '3. Service ID auto-resolved to valid active Service UUID in DB');
    const validService = resolvedService!;

    // 3. Test Job Creation with REQUESTED Status
    const jobRequest = await prisma.jobRequest.create({
      data: {
        customerId: customerProfile.id,
        categoryId: validService.categoryId,
        serviceId: validService.id,
        description: 'Need to install 3 ceiling fans in living room',
        formattedAddress: '102 Green Heights, Surat, Gujarat 395007',
        latitude: 21.1702,
        longitude: 72.8311,
        preferredDate: new Date().toISOString().split('T')[0],
        preferredTime: '10:00 AM',
        urgency: 'IMMEDIATE',
        budget: 250.0,
        status: 'MATCHED',
      },
    });

    const testJob = await prisma.job.create({
      data: {
        jobRequestId: jobRequest.id,
        customerId: customerProfile.id,
        workerId: workerProfile.id,
        serviceId: validService.id,
        status: 'REQUESTED',
        baseAmount: 250.0,
        finalAmount: 250.0,
        history: {
          create: {
            fromStatus: 'NONE',
            toStatus: 'REQUESTED',
            changedByUserId: customerProfile.userId,
            note: 'Automated test job request',
          },
        },
      },
    });

    assert(!!testJob && testJob.status === 'REQUESTED', '4. Job created successfully with initial status "REQUESTED"');
    assert(testJob.serviceId === validService.id, '5. Job.serviceId matches actual database Service UUID (Foreign key safe)');

    // 4. Test Notification Persistence for Worker
    const notification = await NotificationService.notifyJobEvent({
      customerId: customerProfile.userId,
      workerId: workerProfile.userId,
      jobId: testJob.id,
      eventType: 'REQUESTED',
      serviceName: validService.name,
    });

    const storedNotification = await prisma.notification.findFirst({
      where: { userId: workerProfile.userId, linkUrl: `/worker/jobs/${testJob.id}` },
    });

    assert(!!storedNotification, '6. Worker notification persisted in database Notification table');

    // 5. Test Atomic Acceptance Flow
    const acceptUpdate = await prisma.job.updateMany({
      where: {
        id: testJob.id,
        workerId: workerProfile.id,
        status: 'REQUESTED',
      },
      data: {
        status: 'ACCEPTED',
        updatedAt: new Date(),
      },
    });

    assert(acceptUpdate.count === 1, '7. Worker atomic ACCEPT update succeeded');

    const acceptedJob = await prisma.job.findUnique({
      where: { id: testJob.id },
    });
    assert(acceptedJob?.status === 'ACCEPTED', '8. Job status transitioned atomically to "ACCEPTED"');

    // 6. Test Concurrency & Double Action Prevention
    const doubleAccept = await prisma.job.updateMany({
      where: {
        id: testJob.id,
        workerId: workerProfile.id,
        status: 'REQUESTED',
      },
      data: {
        status: 'ACCEPTED',
      },
    });
    assert(doubleAccept.count === 0, '9. Second accept/reject attempt blocked (Atomic concurrency safe, zero duplicate actions)');

    // 7. Test Rejection Flow with a Second Test Job
    const jobRequest2 = await prisma.jobRequest.create({
      data: {
        customerId: customerProfile.id,
        categoryId: validService.categoryId,
        serviceId: validService.id,
        description: 'Fix pipe leakage in bathroom',
        formattedAddress: '404 Blue Star Apartment, Surat',
        latitude: 21.1702,
        longitude: 72.8311,
        preferredDate: new Date().toISOString().split('T')[0],
        preferredTime: '02:00 PM',
        urgency: 'SCHEDULED',
        budget: 250.0,
        status: 'MATCHED',
      },
    });

    const testJob2 = await prisma.job.create({
      data: {
        jobRequestId: jobRequest2.id,
        customerId: customerProfile.id,
        workerId: workerProfile.id,
        serviceId: validService.id,
        status: 'REQUESTED',
        baseAmount: 250.0,
        finalAmount: 250.0,
      },
    });

    const rejectUpdate = await prisma.job.updateMany({
      where: {
        id: testJob2.id,
        workerId: workerProfile.id,
        status: 'REQUESTED',
      },
      data: {
        status: 'REJECTED',
        rejectionReason: 'Worker unavailable',
        updatedAt: new Date(),
      },
    });

    assert(rejectUpdate.count === 1, '10. Worker atomic REJECT update succeeded');

    const rejectedJob = await prisma.job.findUnique({
      where: { id: testJob2.id },
    });
    assert(rejectedJob?.status === 'REJECTED', '11. Job status transitioned atomically to "REJECTED"');

    // Cleanup test jobs & jobRequests
    await prisma.jobStatusHistory.deleteMany({ where: { jobId: { in: [testJob.id, testJob2.id] } } });
    await prisma.job.deleteMany({ where: { id: { in: [testJob.id, testJob2.id] } } });
    await prisma.jobRequest.deleteMany({ where: { id: { in: [jobRequest.id, jobRequest2.id] } } });

  } catch (err: any) {
    console.error('Test execution error:', err);
    failed++;
  } finally {
    await prisma.$disconnect();
  }

  console.log('\n====================================================');
  console.log(`END-TO-END BOOKING FLOW AUDIT RESULT: ${passed} PASSED, ${failed} FAILED`);
  console.log('====================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

if (require.main === module) {
  runBookingNotificationFlowAudit();
}
