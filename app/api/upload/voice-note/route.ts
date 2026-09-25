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
  'audio/mp3',
  'audio/3gpp',
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
    const isAudio =
      typePrefix.startsWith('audio/') ||
      ALLOWED_MIME_TYPES.includes(file.type.toLowerCase());

    if (!isAudio && file.name && !/\.(webm|m4a|mp4|ogg|wav|aac|mp3|3gp)$/i.test(file.name)) {
      return NextResponse.json(
        { success: false, error: 'Unsupported file format. Please upload a valid audio file.' },
        { status: 400 }
      );
    }

    // Determine extension safely
    let ext = 'webm';
    const lowerType = (file.type || '').toLowerCase();
    if (lowerType.includes('mp4') || lowerType.includes('m4a') || lowerType.includes('aac')) {
      ext = 'm4a';
    } else if (lowerType.includes('ogg')) {
      ext = 'ogg';
    } else if (lowerType.includes('wav')) {
      ext = 'wav';
    } else if (lowerType.includes('mpeg') || lowerType.includes('mp3')) {
      ext = 'mp3';
    } else if (file.name && file.name.includes('.')) {
      const parts = file.name.split('.');
      const candidateExt = parts.pop()?.toLowerCase();
      if (candidateExt && ['webm', 'm4a', 'mp4', 'ogg', 'wav', 'aac', 'mp3', '3gp'].includes(candidateExt)) {
        ext = candidateExt;
      }
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'voice-notes');

    // Create target directory if it does not exist with mode 0o755
    try {
      await fs.mkdir(uploadDir, { recursive: true, mode: 0o755 });
    } catch (dirErr: any) {
      console.error('[Voice Note Upload] Failed to create upload directory:', dirErr);
      if (dirErr.code === 'EACCES') {
        return NextResponse.json(
          {
            success: false,
            error:
              'Permission denied creating upload directory on server. Please check application folder permissions.',
          },
          { status: 500 }
        );
      }
      throw dirErr;
    }

    const fileUUID = crypto.randomUUID();
    const filename = `voice-${fileUUID}.${ext}`;
    const relativePath = `/uploads/voice-notes/${filename}`;
    const absolutePath = path.join(uploadDir, filename);

    try {
      await fs.writeFile(absolutePath, buffer);
    } catch (writeErr: any) {
      console.error('[Voice Note Upload] Write file failed:', writeErr);
      if (writeErr.code === 'EACCES') {
        return NextResponse.json(
          {
            success: false,
            error:
              'Permission denied writing audio file to server storage. Please check upload folder write permissions.',
          },
          { status: 500 }
        );
      }
      throw writeErr;
    }

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
