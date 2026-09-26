import prisma from './db';

export interface TestimonialData {
  id?: string;
  slot: number; // 1 or 2
  customerName: string;
  profession?: string | null;
  location?: string | null;
  testimonialText?: string | null;
  rating?: number;
  isActive: boolean;
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
    imageUrl: '/images/testimonials/testimonial-2.jpg',
    imageZoom: 1.0,
    imageOffsetX: 0.0,
    imageOffsetY: 0.0,
  },
];

/**
 * Ensures exactly slots 1 and 2 exist in DB.
 */
export async function ensureDefaultTestimonials() {
  try {
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
            imageUrl: def.imageUrl,
            imageZoom: def.imageZoom ?? 1.0,
            imageOffsetX: def.imageOffsetX ?? 0.0,
            imageOffsetY: def.imageOffsetY ?? 0.0,
          },
        });
      }
    }
  } catch (err) {
    console.error('Failed to ensure default testimonials:', err);
  }
}

import fs from 'fs';
import path from 'path';

/**
 * Fetch testimonials. If onlyActive is true, returns only active cards.
 */
export async function getTestimonials(onlyActive: boolean = true): Promise<TestimonialData[]> {
  try {
    await ensureDefaultTestimonials();
    const records = await prisma.testimonial.findMany({
      orderBy: { slot: 'asc' },
    });

    // Validate that uploaded image files actually exist on disk; otherwise heal DB record to default image
    const validatedRecords = await Promise.all(
      records.map(async (rec) => {
        if (rec.imageUrl && rec.imageUrl.startsWith('/uploads/')) {
          const diskPath = path.join(process.cwd(), 'public', rec.imageUrl);
          if (!fs.existsSync(diskPath)) {
            const defaultUrl = `/images/testimonials/testimonial-${rec.slot}.jpg`;
            await prisma.testimonial.update({
              where: { slot: rec.slot },
              data: { imageUrl: defaultUrl },
            }).catch(console.error);
            return { ...rec, imageUrl: defaultUrl };
          }
        }
        return rec;
      })
    );

    if (validatedRecords.length === 0) {
      return DEFAULT_TESTIMONIALS.filter((t) => !onlyActive || t.isActive);
    }

    if (onlyActive) {
      return validatedRecords.filter((t) => t.isActive);
    }

    return validatedRecords;
  } catch (err) {
    console.error('Error in getTestimonials:', err);
    return DEFAULT_TESTIMONIALS.filter((t) => !onlyActive || t.isActive);
  }
}

/**
 * Update a specific testimonial slot (1 or 2 only).
 */
export async function updateTestimonialSlot(
  slot: number,
  data: Partial<TestimonialData>
): Promise<TestimonialData> {
  if (slot !== 1 && slot !== 2) {
    throw new Error('Invalid testimonial slot. Only slot 1 and slot 2 are supported.');
  }

  await ensureDefaultTestimonials();

  const updated = await prisma.testimonial.upsert({
    where: { slot },
    update: {
      customerName: data.customerName !== undefined ? data.customerName : undefined,
      profession: data.profession !== undefined ? data.profession : undefined,
      location: data.location !== undefined ? data.location : undefined,
      testimonialText: data.testimonialText !== undefined ? data.testimonialText : undefined,
      rating: typeof data.rating === 'number' ? data.rating : undefined,
      isActive: data.isActive !== undefined ? data.isActive : undefined,
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
      imageUrl: data.imageUrl || `/images/testimonials/testimonial-${slot}.jpg`,
      imageZoom: data.imageZoom ?? 1.0,
      imageOffsetX: data.imageOffsetX ?? 0.0,
      imageOffsetY: data.imageOffsetY ?? 0.0,
    },
  });

  return updated;
}
