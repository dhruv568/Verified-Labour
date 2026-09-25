import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getSessionUser } from '@/lib/auth';
import sharp from 'sharp';
import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import { syncWorkerVerificationStatus } from '@/lib/worker-verification';

// Allowed MIME types for live worker photo
const ALLOWED_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/jpg']);
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB

export async function POST(req: NextRequest) {
  try {
    const sessionUser = await getSessionUser(req);
    if (!sessionUser) {
      return NextResponse.json(
        { success: false, error: 'Authentication required to upload live photo' },
        { status: 401 }
      );
    }

    const worker = await prisma.workerProfile.findUnique({
      where: { userId: sessionUser.id },
    });

    if (!worker) {
      return NextResponse.json(
        { success: false, error: 'Worker profile not found for active user' },
        { status: 404 }
      );
    }

    const contentType = req.headers.get('content-type') || '';
    let imageBuffer: Buffer | null = null;
    let mimeType = 'image/jpeg';

    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      const file = formData.get('photo') || formData.get('file');

      if (!file || !(file instanceof File)) {
        return NextResponse.json(
          { success: false, error: 'No image file provided in upload request' },
          { status: 400 }
        );
      }

      if (file.size > MAX_FILE_SIZE_BYTES) {
        return NextResponse.json(
          { success: false, error: 'File size exceeds maximum 5MB limit' },
          { status: 400 }
        );
      }

      mimeType = file.type || 'image/jpeg';
      if (!ALLOWED_MIME_TYPES.has(mimeType.toLowerCase())) {
        return NextResponse.json(
          { success: false, error: 'Invalid file type. Only JPEG, PNG, and WebP images are allowed.' },
          { status: 400 }
        );
      }

      const arrayBuffer = await file.arrayBuffer();
      imageBuffer = Buffer.from(arrayBuffer);
    } else if (contentType.includes('application/json')) {
      const body = await req.json();
      const { imageBase64 } = body;

      if (!imageBase64 || typeof imageBase64 !== 'string') {
        return NextResponse.json(
          { success: false, error: 'No imageBase64 data provided' },
          { status: 400 }
        );
      }

      // Extract format and buffer from data URL (e.g. data:image/jpeg;base64,...)
      const matches = imageBase64.match(/^data:(image\/[a-zA-Z+]+);base64,(.+)$/);
      if (matches) {
        mimeType = matches[1];
        imageBuffer = Buffer.from(matches[2], 'base64');
      } else {
        imageBuffer = Buffer.from(imageBase64.replace(/^data:image\/\w+;base64,/, ''), 'base64');
      }

      if (imageBuffer.length > MAX_FILE_SIZE_BYTES) {
        return NextResponse.json(
          { success: false, error: 'Image size exceeds maximum 5MB limit' },
          { status: 400 }
        );
      }
    } else {
      return NextResponse.json(
        { success: false, error: 'Unsupported Content-Type header' },
        { status: 400 }
      );
    }

    if (!imageBuffer || imageBuffer.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Image buffer is empty' },
        { status: 400 }
      );
    }

    // Process & Optimize Image with Sharp:
    // 1. Auto-rotate based on EXIF orientation
    // 2. Resize to 600x600 square avatar max
    // 3. Compress to WebP with 80% quality
    // 4. Strip EXIF metadata for privacy
    const processedBuffer = await sharp(imageBuffer)
      .rotate()
      .resize(600, 600, {
        fit: 'cover',
        position: 'center',
      })
      .webp({ quality: 80, effort: 4 })
      .toBuffer();

    // Ensure uploads directory exists securely
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'workers');
    await fs.mkdir(uploadDir, { recursive: true });

    // Cryptographically secure unique filename preventing directory traversal or enumeration
    const fileUUID = crypto.randomUUID();
    const filename = `worker-live-${fileUUID}.webp`;
    const relativePath = `/uploads/workers/${filename}`;
    const absolutePath = path.join(uploadDir, filename);

    // Save compressed file to disk
    await fs.writeFile(absolutePath, processedBuffer);

    // Update WorkerProfile avatarUrl
    const updatedWorker = await prisma.workerProfile.update({
      where: { id: worker.id },
      data: {
        avatarUrl: relativePath,
      },
    });

    // Create / Update WorkerDocument record for verification record auditing
    const existingLivePhotoDoc = await prisma.workerDocument.findFirst({
      where: {
        workerId: worker.id,
        documentType: 'LIVE_PHOTO',
      },
    });

    if (existingLivePhotoDoc) {
      await prisma.workerDocument.update({
        where: { id: existingLivePhotoDoc.id },
        data: {
          fileUrl: relativePath,
          fileName: filename,
          mimeType: 'image/webp',
          fileSize: processedBuffer.length,
          status: 'VERIFIED',
          verifiedAt: new Date(),
        },
      });
    } else {
      await prisma.workerDocument.create({
        data: {
          workerId: worker.id,
          documentType: 'LIVE_PHOTO',
          fileUrl: relativePath,
          fileName: filename,
          mimeType: 'image/webp',
          fileSize: processedBuffer.length,
          status: 'VERIFIED',
          verifiedAt: new Date(),
        },
      });
    }

    // Evaluate & Sync worker status
    await syncWorkerVerificationStatus(worker.id);

    return NextResponse.json({
      success: true,
      avatarUrl: relativePath,
      message: 'Worker live photo captured, compressed, and saved securely!',
    });
  } catch (err: any) {
    console.error('Error uploading worker live photo:', err);
    return NextResponse.json(
      { success: false, error: 'Failed to process live photo: ' + err.message },
      { status: 500 }
    );
  }
}
