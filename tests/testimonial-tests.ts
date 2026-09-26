import assert from 'assert';
import fs from 'fs';
import path from 'path';
import { getTestimonials, updateTestimonialSlot } from '../lib/testimonials';

export async function runTestimonialTests(): Promise<{ passed: number; failed: number }> {
  console.log('\n--- 12. Testimonials Database & Zoom/Framing Tests ---');

  let passed = 0;
  let failed = 0;

  const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'testimonials');
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  const testFile1 = path.join(uploadDir, `test-slot-1-${Date.now()}.jpg`);
  const testFile2 = path.join(uploadDir, `test-slot-2-${Date.now()}.jpg`);

  fs.writeFileSync(testFile1, 'dummy-image-content-1');
  fs.writeFileSync(testFile2, 'dummy-image-content-2');

  const relPath1 = `/uploads/testimonials/${path.basename(testFile1)}`;
  const relPath2 = `/uploads/testimonials/${path.basename(testFile2)}`;

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

  try {
    // 1. Ensure default 2 slots exist in DB without Prisma table errors
    await testAsync('getTestimonials ensures default Slot 1 and Slot 2 exist without database errors', async () => {
      const list = await getTestimonials(false);
      assert(Array.isArray(list), 'Testimonials must return an array');
      assert.strictEqual(list.length, 2, 'Must return exactly 2 slots');
      const slot1 = list.find((t) => t.slot === 1);
      const slot2 = list.find((t) => t.slot === 2);
      assert(slot1, 'Slot 1 must exist');
      assert(slot2, 'Slot 2 must exist');
    });

    // 2. Test updating Slot 1 with custom image URL, Zoom, and Framing controls via upsert
    await testAsync('updateTestimonialSlot updates Slot 1 image URL & zoom/offsets in DB', async () => {
      const updated1 = await updateTestimonialSlot(1, {
        customerName: 'Priya Sharma (Updated)',
        profession: 'Interior Designer',
        location: 'Surat, Gujarat',
        testimonialText: 'Fast and verified electrician service!',
        rating: 5,
        isActive: true,
        imageUrl: relPath1,
        imageZoom: 1.35,
        imageOffsetX: 12.5,
        imageOffsetY: -8.0,
      });

      assert.strictEqual(updated1.slot, 1);
      assert.strictEqual(updated1.customerName, 'Priya Sharma (Updated)');
      assert.strictEqual(updated1.imageUrl, relPath1);
      assert.strictEqual(updated1.imageZoom, 1.35);
      assert.strictEqual(updated1.imageOffsetX, 12.5);
      assert.strictEqual(updated1.imageOffsetY, -8.0);

      // Verify DB fetch returns newly persisted image URL
      const freshList = await getTestimonials(false);
      const dbCard1 = freshList.find((t) => t.slot === 1);
      assert.strictEqual(dbCard1?.imageUrl, relPath1);
    });

    // 3. Test updating Slot 2 independently without affecting Slot 1
    await testAsync('updateTestimonialSlot updates Slot 2 image URL independently without affecting Slot 1', async () => {
      const updated2 = await updateTestimonialSlot(2, {
        customerName: 'Rajesh Kumar (Updated)',
        profession: 'Operations Manager',
        location: 'Mumbai, Maharashtra',
        testimonialText: 'Excellent service quality!',
        rating: 5,
        isActive: true,
        imageUrl: relPath2,
        imageZoom: 1.5,
        imageOffsetX: -10.0,
        imageOffsetY: 15.0,
      });

      assert.strictEqual(updated2.slot, 2);
      assert.strictEqual(updated2.customerName, 'Rajesh Kumar (Updated)');
      assert.strictEqual(updated2.imageUrl, relPath2);

      // Verify Slot 1 image URL was untouched
      const freshList = await getTestimonials(false);
      const dbCard1 = freshList.find((t) => t.slot === 1);
      const dbCard2 = freshList.find((t) => t.slot === 2);
      assert(dbCard1?.imageUrl.includes('test-slot-1'), 'Slot 1 image URL must remain independent');
      assert.strictEqual(dbCard2?.imageUrl, relPath2);
    });

    // 4. Verify public fetch returns updated slot data with custom image URLs and zoom/offsets
    await testAsync('getTestimonials(true) returns active cards with saved new image URLs and framing settings', async () => {
      const activeTestimonials = await getTestimonials(true);
      assert.strictEqual(activeTestimonials.length, 2);
      const card1 = activeTestimonials.find((t) => t.slot === 1);
      const card2 = activeTestimonials.find((t) => t.slot === 2);
      assert(card1?.imageUrl.startsWith('/uploads/testimonials/'), 'Card 1 must return uploaded image URL');
      assert(card2?.imageUrl.startsWith('/uploads/testimonials/'), 'Card 2 must return uploaded image URL');
      assert.strictEqual(card1?.imageZoom, 1.35);
      assert.strictEqual(card2?.imageZoom, 1.5);
    });
  } finally {
    if (fs.existsSync(testFile1)) fs.unlinkSync(testFile1);
    if (fs.existsSync(testFile2)) fs.unlinkSync(testFile2);
  }

  return { passed, failed };
}
