import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs/promises';
import crypto from 'crypto';
import { getSessionUser } from '@/lib/auth';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB limit

const ALLOWED_MIME_TYPES = [
  'audio/webm',
  'audio/webm;codecs=opus',
  'audio/ogg',
  'audio/ogg;codecs=opus',
  'audio/mp4',
  'audio/m4a',
  'audio/aac',
  'audio/wav',
  'audio/x-m4a',
  'audio/mpeg',
];

export async function POST(req: NextRequest) {
  try {
    const sessionUser = await getSessionUser(req);
    if (!sessionUser) {
      return NextResponse.json(
        { success: false, error: 'Authentication required to upload voice notes.' },
        { status: 401 }
      );
    }

    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No audio file provided in request.' },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { success: false, error: 'Voice note file size exceeds 10MB limit.' },
        { status: 400 }
      );
    }

    const typePrefix = file.type ? file.type.split(';')[0].toLowerCase() : '';
    const isAudio = typePrefix.startsWith('audio/') || ALLOWED_MIME_TYPES.includes(file.type.toLowerCase());

    if (!isAudio && file.name && !/\.(webm|m4a|mp4|ogg|wav|aac|mp3)$/i.test(file.name)) {
      return NextResponse.json(
        { success: false, error: 'Unsupported file format. Please upload a valid audio file.' },
        { status: 400 }
      );
    }

    // Determine extension
    let ext = 'webm';
    if (file.type.includes('mp4') || file.type.includes('m4a') || file.type.includes('aac')) {
      ext = 'm4a';
    } else if (file.type.includes('ogg')) {
      ext = 'ogg';
    } else if (file.type.includes('wav')) {
      ext = 'wav';
    } else if (file.name && file.name.includes('.')) {
      ext = file.name.split('.').pop() || 'webm';
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'voice-notes');
    await fs.mkdir(uploadDir, { recursive: true });

    const fileUUID = crypto.randomUUID();
    const filename = `voice-${fileUUID}.${ext}`;
    const relativePath = `/uploads/voice-notes/${filename}`;
    const absolutePath = path.join(uploadDir, filename);

    await fs.writeFile(absolutePath, buffer);

    return NextResponse.json({
      success: true,
      url: relativePath,
      size: file.size,
      mimeType: file.type || 'audio/webm',
    });
  } catch (err: any) {
    console.error('Error uploading voice note:', err);
    return NextResponse.json(
      { success: false, error: 'Failed to upload voice note: ' + err.message },
      { status: 500 }
    );
  }
}
