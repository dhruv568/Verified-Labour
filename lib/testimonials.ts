import prisma from './db';
import fs from 'fs';
import path from 'path';

export interface TestimonialData {
  id?: string;
  slot: number;
  customerName: string;
  profession?: string | null;
  location?: string | null;
  testimonialText?: string | null;
  rating?: number;
  isActive: boolean;
  displayTarget: 'DESKTOP' | 'MOBILE' | 'BOTH';
  imageUrl: string;
  imageZoom?: number;
  imageOffsetX?: number;
  imageOffsetY?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export const DEFAULT_TESTIMONIALS: TestimonialData[] = [
  {
    slot: 1,
    customerName: 'Priya Sharma',
    profession: 'Homeowner & Interior Designer',
    location: 'Surat, Gujarat',
    testimonialText:
      'Verified Labour sent an experienced electrician within 35 minutes. Aadhaar verification gave me complete peace of mind!',
    rating: 5,
    isActive: true,
    displayTarget: 'BOTH',
    imageUrl: '/images/testimonials/testimonial-1.jpg',
    imageZoom: 1.0,
    imageOffsetX: 0.0,
    imageOffsetY: 0.0,
  },
  {
    slot: 2,
    customerName: 'Rajesh Kumar',
    profession: 'Operations Manager',
    location: 'Mumbai, Maharashtra',
    testimonialText:
      'The level of professionalism and quality delivered by this team exceeded our expectations! A fantastic job.',
    rating: 5,
    isActive: true,
    displayTarget: 'BOTH',
    imageUrl: '/images/testimonials/testimonial-2.jpg',
    imageZoom: 1.0,
    imageOffsetX: 0.0,
    imageOffsetY: 0.0,
  },
];

/**
 * Gets configured number of active testimonial slots.
 */
export async function getTestimonialCount(): Promise<number> {
  try {
    const config = await prisma.platformConfig.findUnique({
      where: { key: 'testimonial_count' },
    });
    if (config && config.value) {
      const val = parseInt(config.value, 10);
      if (!isNaN(val) && val >= 0) return val;
    }
  } catch (err) {
    console.error('Failed to get testimonial count config:', err);
  }
  return 2; // Default to 2
}

/**
 * Updates configured number of testimonial slots in PlatformConfig.
 */
export async function setTestimonialCount(count: number): Promise<number> {
  const safeCount = Math.min(Math.max(0, count), 20); // Limit 0 to 20
  await prisma.platformConfig.upsert({
    where: { key: 'testimonial_count' },
    update: { value: safeCount.toString() },
    create: {
      key: 'testimonial_count',
      value: safeCount.toString(),
      description: 'Configured number of active testimonial slots on website',
    },
  });
  await ensureDefaultTestimonials(safeCount);
  return safeCount;
}

/**
 * Ensures testimonial records exist up to targetCount without deleting existing records.
 */
export async function ensureDefaultTestimonials(targetCount?: number) {
  try {
    const countToEnsure = targetCount ?? (await getTestimonialCount());

    // Ensure default initial records (slots 1 and 2) if database is empty
    for (const def of DEFAULT_TESTIMONIALS) {
      const existing = await prisma.testimonial.findUnique({
        where: { slot: def.slot },
      });
      if (!existing) {
        await prisma.testimonial.create({
          data: {
            slot: def.slot,
            customerName: def.customerName,
            profession: def.profession,
            location: def.location,
            testimonialText: def.testimonialText,
            rating: def.rating ?? 5,
            isActive: def.isActive,
            displayTarget: def.displayTarget || 'BOTH',
            imageUrl: def.imageUrl,
            imageZoom: def.imageZoom ?? 1.0,
            imageOffsetX: def.imageOffsetX ?? 0.0,
            imageOffsetY: def.imageOffsetY ?? 0.0,
          },
        });
      }
    }

    // Ensure slots up to countToEnsure exist
    for (let slot = 1; slot <= countToEnsure; slot++) {
      const existing = await prisma.testimonial.findUnique({
        where: { slot },
      });
      if (!existing) {
        await prisma.testimonial.create({
          data: {
            slot,
            customerName: `Customer ${slot}`,
            profession: 'Verified Client',
            location: 'Surat, Gujarat',
            testimonialText: 'Great service provided by Verified Labour professionals.',
            rating: 5,
            isActive: true,
            displayTarget: 'BOTH',
            imageUrl: `/images/testimonials/testimonial-${((slot - 1) % 2) + 1}.jpg`,
            imageZoom: 1.0,
            imageOffsetX: 0.0,
            imageOffsetY: 0.0,
          },
        });
      }
    }
  } catch (err) {
    console.error('Failed to ensure testimonials:', err);
  }
}

/**
 * Fetch testimonials.
 * If onlyActive is true (public website), returns up to `testimonial_count` active cards.
 * If onlyActive is false (admin panel), returns all testimonial cards in DB up to max(count, maxSlot).
 */
export async function getTestimonials(onlyActive: boolean = true): Promise<TestimonialData[]> {
  try {
    const configuredCount = await getTestimonialCount();
    await ensureDefaultTestimonials(configuredCount);

    const records = await prisma.testimonial.findMany({
      orderBy: { slot: 'asc' },
    });

    const validatedRecords: TestimonialData[] = await Promise.all(
      records.map(async (rec) => {
        let finalUrl = rec.imageUrl;
        if (rec.imageUrl && rec.imageUrl.startsWith('/uploads/')) {
          const diskPath = path.join(process.cwd(), 'public', rec.imageUrl);
          if (!fs.existsSync(diskPath)) {
            finalUrl = `/images/testimonials/testimonial-${((rec.slot - 1) % 2) + 1}.jpg`;
            await prisma.testimonial.update({
              where: { slot: rec.slot },
              data: { imageUrl: finalUrl },
            }).catch(console.error);
          }
        }
        const target: 'DESKTOP' | 'MOBILE' | 'BOTH' =
          rec.displayTarget === 'DESKTOP' || rec.displayTarget === 'MOBILE' || rec.displayTarget === 'BOTH'
            ? (rec.displayTarget as 'DESKTOP' | 'MOBILE' | 'BOTH')
            : 'BOTH';

        return {
          id: rec.id,
          slot: rec.slot,
          customerName: rec.customerName,
          profession: rec.profession,
          location: rec.location,
          testimonialText: rec.testimonialText,
          rating: rec.rating,
          isActive: rec.isActive,
          displayTarget: target,
          imageUrl: finalUrl,
          imageZoom: rec.imageZoom,
          imageOffsetX: rec.imageOffsetX,
          imageOffsetY: rec.imageOffsetY,
          createdAt: rec.createdAt,
          updatedAt: rec.updatedAt,
        };
      })
    );

    if (onlyActive) {
      if (configuredCount === 0) return [];
      // Return active testimonials within the configured slot count
      return validatedRecords.filter((t) => t.slot <= configuredCount && t.isActive);
    }

    return validatedRecords;
  } catch (err) {
    console.error('Error in getTestimonials:', err);
    return DEFAULT_TESTIMONIALS.filter((t) => !onlyActive || t.isActive);
  }
}

/**
 * Update a specific testimonial slot.
 */
export async function updateTestimonialSlot(
  slot: number,
  data: Partial<TestimonialData>
): Promise<TestimonialData> {
  const target: 'DESKTOP' | 'MOBILE' | 'BOTH' =
    data.displayTarget === 'DESKTOP' || data.displayTarget === 'MOBILE' || data.displayTarget === 'BOTH'
      ? data.displayTarget
      : 'BOTH';

  const updated = await prisma.testimonial.upsert({
    where: { slot },
    update: {
      customerName: data.customerName !== undefined ? data.customerName : undefined,
      profession: data.profession !== undefined ? data.profession : undefined,
      location: data.location !== undefined ? data.location : undefined,
      testimonialText: data.testimonialText !== undefined ? data.testimonialText : undefined,
      rating: typeof data.rating === 'number' ? data.rating : undefined,
      isActive: data.isActive !== undefined ? data.isActive : undefined,
      displayTarget: target,
      imageUrl: data.imageUrl !== undefined ? data.imageUrl : undefined,
      imageZoom: typeof data.imageZoom === 'number' ? data.imageZoom : undefined,
      imageOffsetX: typeof data.imageOffsetX === 'number' ? data.imageOffsetX : undefined,
      imageOffsetY: typeof data.imageOffsetY === 'number' ? data.imageOffsetY : undefined,
    },
    create: {
      slot,
      customerName: data.customerName || `Customer ${slot}`,
      profession: data.profession || null,
      location: data.location || null,
      testimonialText: data.testimonialText || null,
      rating: data.rating ?? 5,
      isActive: data.isActive ?? true,
      displayTarget: target,
      imageUrl: data.imageUrl || `/images/testimonials/testimonial-${((slot - 1) % 2) + 1}.jpg`,
      imageZoom: data.imageZoom ?? 1.0,
      imageOffsetX: data.imageOffsetX ?? 0.0,
      imageOffsetY: data.imageOffsetY ?? 0.0,
    },
  });

  return {
    ...updated,
    displayTarget: updated.displayTarget as 'DESKTOP' | 'MOBILE' | 'BOTH',
  };
}

/**
 * Delete a specific testimonial record and reorder remaining slots.
 */
export async function deleteTestimonialSlot(slot: number) {
  await prisma.testimonial.delete({
    where: { slot },
  }).catch(() => {});

  // Re-index slots greater than slot
  const higherSlots = await prisma.testimonial.findMany({
    where: { slot: { gt: slot } },
    orderBy: { slot: 'asc' },
  });

  for (const item of higherSlots) {
    await prisma.testimonial.update({
      where: { id: item.id },
      data: { slot: item.slot - 1 },
    });
  }

  // Adjust count if count was greater than remaining total
  const totalLeft = await prisma.testimonial.count();
  const currentConfig = await getTestimonialCount();
  if (currentConfig > totalLeft) {
    await setTestimonialCount(Math.max(0, totalLeft));
  }
}
