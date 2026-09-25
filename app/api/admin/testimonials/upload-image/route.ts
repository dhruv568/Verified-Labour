import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

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
    if (slot !== 1 && slot !== 2) {
      return NextResponse.json(
        { success: false, error: 'Invalid slot. Must be 1 or 2.' },
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

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'testimonials');
    await mkdir(uploadsDir, { recursive: true });

    const fileExt = path.extname(file.name) || '.jpg';
    const fileName = `testimonial-slot-${slot}-${Date.now()}${fileExt}`;
    const filePath = path.join(uploadsDir, fileName);

    await writeFile(filePath, buffer);

    const publicUrl = `/uploads/testimonials/${fileName}`;

    return NextResponse.json({
      success: true,
      message: 'Testimonial image uploaded successfully',
      imageUrl: publicUrl,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: 'Image upload failed: ' + err.message },
      { status: 500 }
    );
  }
}
