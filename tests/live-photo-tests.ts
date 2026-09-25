import assert from 'assert';
import { NextRequest } from 'next/server';
import prisma from '../lib/db';
import { POST as uploadPhotoHandler } from '../app/api/workers/upload-photo/route';
import { sanitizeWorkerForPublic } from '../lib/location';
import { signAuthToken } from '../lib/auth';
import sharp from 'sharp';

export async function runLivePhotoTests() {
  console.log('\n--- 10. Worker Live Photo Capture & Security Tests ---');

  let passed = 0;
  let failed = 0;

  function test(name: string, fn: () => void) {
    try {
      fn();
      console.log(`  ✔ PASS: ${name}`);
      passed++;
    } catch (err: any) {
      console.error(`  ✖ FAIL: ${name}`);
      console.error(`    ${err.message}`);
      failed++;
    }
  }

  async function testAsync(name: string, fn: () => Promise<void>) {
    try {
      await fn();
      console.log(`  ✔ PASS: ${name}`);
      passed++;
    } catch (err: any) {
      console.error(`  ✖ FAIL: ${name}`);
      console.error(`    ${err.message}`);
      failed++;
    }
  }

  // Create isolated test user & worker profile for testing photo upload
  const testPhone = `+9198${Date.now().toString().slice(-8)}`;
  const testUser = await prisma.user.create({
    data: {
      phone: testPhone,
      email: `photo.worker.${Date.now()}@example.com`,
      role: 'WORKER',
      status: 'ACTIVE',
      isPhoneVerified: true,
      isEmailVerified: true,
      workerProfile: {
        create: {
          fullName: 'Anil Kumar',
          status: 'ONBOARDING',
          isAvailable: true,
          city: 'Surat',
          state: 'Gujarat',
        },
      },
    },
    include: { workerProfile: true },
  });

  const jwtToken = await signAuthToken({
    userId: testUser.id,
    phone: testUser.phone,
    email: testUser.email || undefined,
    role: 'WORKER',
  });

  const workerId = testUser.workerProfile!.id;

  try {
    // 1. Upload API rejects unauthenticated requests
    await testAsync('Upload live photo rejects unauthenticated requests (401)', async () => {
      const req = new NextRequest('http://localhost:3000/api/workers/upload-photo', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ imageBase64: 'data:image/jpeg;base64,1234' }),
      });
      const res = await uploadPhotoHandler(req);
      assert.strictEqual(res.status, 401);
      const data = await res.json();
      assert.strictEqual(data.success, false);
    });

    // 2. Upload API accepts valid base64 image and processes with sharp
    await testAsync('Upload live photo compresses image via Sharp and updates WorkerProfile avatarUrl & document', async () => {
      // Create a 100x100 mock PNG buffer using Sharp
      const samplePngBuffer = await sharp({
        create: {
          width: 100,
          height: 100,
          channels: 3,
          background: { r: 18, g: 100, b: 214 },
        },
      })
        .png()
        .toBuffer();

      const base64Data = `data:image/png;base64,${samplePngBuffer.toString('base64')}`;

      const req = new NextRequest('http://localhost:3000/api/workers/upload-photo', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          authorization: `Bearer ${jwtToken}`,
        },
        body: JSON.stringify({ imageBase64: base64Data }),
      });

      const res = await uploadPhotoHandler(req);
      const data = await res.json();

      assert.strictEqual(res.status, 200);
      assert.strictEqual(data.success, true);
      assert(data.avatarUrl.includes('/uploads/workers/worker-live-'));
      assert(data.avatarUrl.endsWith('.webp'));

      // Check DB update
      const updatedWorker = await prisma.workerProfile.findUnique({ where: { id: workerId } });
      assert.strictEqual(updatedWorker?.avatarUrl, data.avatarUrl);

      // Check WorkerDocument created
      const doc = await prisma.workerDocument.findFirst({
        where: { workerId, documentType: 'LIVE_PHOTO' },
      });
      assert(doc !== null);
      assert.strictEqual(doc?.status, 'VERIFIED');
      assert.strictEqual(doc?.fileUrl, data.avatarUrl);
    });

    // 3. Photo visibility rule: hidden when ONBOARDING, visible when VERIFIED
    test('Live photo is hidden for public discovery when worker registration is ONBOARDING', () => {
      const rawOnboardingWorker = {
        id: workerId,
        fullName: 'Anil Kumar',
        avatarUrl: '/uploads/workers/sample.webp',
        status: 'ONBOARDING',
        isAvailable: true,
      };

      const sanitized = sanitizeWorkerForPublic(rawOnboardingWorker);
      assert.strictEqual(sanitized.avatarUrl, null);
    });

    test('Live photo is displayed on public profile when worker status is VERIFIED', () => {
      const rawVerifiedWorker = {
        id: workerId,
        fullName: 'Anil Kumar',
        avatarUrl: '/uploads/workers/sample.webp',
        status: 'VERIFIED',
        isAvailable: true,
      };

      const sanitized = sanitizeWorkerForPublic(rawVerifiedWorker);
      assert.strictEqual(sanitized.avatarUrl, '/uploads/workers/sample.webp');
    });
  } finally {
    // Cleanup test user and session
    try {
      await prisma.user.delete({ where: { id: testUser.id } });
    } catch {
      // Ignore
    }
  }

  if (failed > 0) {
    throw new Error(`${failed} Live Photo tests failed!`);
  }

  return { passed, failed };
}
