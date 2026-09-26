import assert from 'assert';
import { getTestimonials, updateTestimonialSlot } from '../lib/testimonials';

export async function runTestimonialTests(): Promise<{ passed: number; failed: number }> {
  console.log('\n--- 12. Testimonials Database & Zoom/Framing Tests ---');

  let passed = 0;
  let failed = 0;

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

  // 2. Test updating Slot 1 with Zoom and Framing controls via upsert
  await testAsync('updateTestimonialSlot updates Slot 1 with custom zoom & offsets via upsert', async () => {
    const updated1 = await updateTestimonialSlot(1, {
      customerName: 'Priya Sharma (Updated)',
      profession: 'Interior Designer',
      location: 'Surat, Gujarat',
      testimonialText: 'Fast and verified electrician service!',
      rating: 5,
      isActive: true,
      imageZoom: 1.35,
      imageOffsetX: 12.5,
      imageOffsetY: -8.0,
    });

    assert.strictEqual(updated1.slot, 1);
    assert.strictEqual(updated1.customerName, 'Priya Sharma (Updated)');
    assert.strictEqual(updated1.imageZoom, 1.35);
    assert.strictEqual(updated1.imageOffsetX, 12.5);
    assert.strictEqual(updated1.imageOffsetY, -8.0);
  });

  // 3. Test updating Slot 2 with Zoom and Framing controls via upsert
  await testAsync('updateTestimonialSlot updates Slot 2 with custom zoom & offsets via upsert', async () => {
    const updated2 = await updateTestimonialSlot(2, {
      customerName: 'Rajesh Kumar (Updated)',
      profession: 'Operations Manager',
      location: 'Mumbai, Maharashtra',
      testimonialText: 'Excellent service quality!',
      rating: 5,
      isActive: true,
      imageZoom: 1.5,
      imageOffsetX: -10.0,
      imageOffsetY: 15.0,
    });

    assert.strictEqual(updated2.slot, 2);
    assert.strictEqual(updated2.customerName, 'Rajesh Kumar (Updated)');
    assert.strictEqual(updated2.imageZoom, 1.5);
    assert.strictEqual(updated2.imageOffsetX, -10.0);
    assert.strictEqual(updated2.imageOffsetY, 15.0);
  });

  // 4. Verify public fetch returns updated slot data with zoom/offsets
  await testAsync('getTestimonials(true) returns active cards with saved zoom and positioning settings', async () => {
    const activeTestimonials = await getTestimonials(true);
    assert.strictEqual(activeTestimonials.length, 2);
    const card1 = activeTestimonials.find((t) => t.slot === 1);
    const card2 = activeTestimonials.find((t) => t.slot === 2);
    assert.strictEqual(card1?.imageZoom, 1.35);
    assert.strictEqual(card2?.imageZoom, 1.5);
  });

  return { passed, failed };
}
