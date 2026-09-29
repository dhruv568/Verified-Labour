import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { writeFile, mkdir, unlink } from 'fs/promises';
import path from 'path';
import prisma from '@/lib/db';
import { updateTestimonialSlot } from '@/lib/testimonials';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB limit

export async function POST(req: NextRequest) {
  try {
    const sessionUser = await getSessionUser(req);
    if (!sessionUser || sessionUser.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Admin access required' },
        { status: 403 }
      );
    }

    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const slotStr = formData.get('slot') as string | null;

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No image file uploaded' },
        { status: 400 }
      );
    }

    const slot = Number(slotStr);
    if (isNaN(slot) || slot < 1 || slot > 20) {
      return NextResponse.json(
        { success: false, error: 'Invalid slot number. Must be between 1 and 20.' },
        { status: 400 }
      );
    }

    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json(
        { success: false, error: 'Invalid file format. Please upload JPG, PNG, or WEBP image.' },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json(
        { success: false, error: 'File size too large. Maximum allowed size is 5MB.' },
        { status: 400 }
      );
    }

    // Capture previous custom uploaded image path for deferred cleanup
    const existingRecord = await prisma.testimonial.findUnique({ where: { slot } });
    const previousImageUrl = existingRecord?.imageUrl;

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'testimonials');
    await mkdir(uploadsDir, { recursive: true });

    const fileExt = path.extname(file.name) || '.jpg';
    const fileName = `testimonial-slot-${slot}-${Date.now()}${fileExt}`;
    const filePath = path.join(uploadsDir, fileName);

    await writeFile(filePath, buffer);

    const publicUrl = `/uploads/testimonials/${fileName}`;

    // Immediately persist new image URL to database
    const updatedTestimonial = await updateTestimonialSlot(slot, { imageUrl: publicUrl });

    // Clean up old custom uploaded file ONLY AFTER new file write and DB update succeed
    if (
      previousImageUrl &&
      previousImageUrl.startsWith('/uploads/testimonials/') &&
      previousImageUrl !== publicUrl
    ) {
      const oldFilePath = path.join(process.cwd(), 'public', previousImageUrl);
      try {
        await unlink(oldFilePath);
      } catch {
        // Silently ignore if file doesn't exist
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Testimonial image uploaded and persisted successfully',
      imageUrl: publicUrl,
      testimonial: updatedTestimonial,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: 'Image upload failed: ' + err.message },
      { status: 500 }
    );
  }
}
