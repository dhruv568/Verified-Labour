import { NextResponse } from 'next/server';
import { getSiteContent } from '@/lib/site-config';

export async function GET() {
  try {
    const content = await getSiteContent();
    return NextResponse.json(
      { success: true, content },
      {
        headers: {
          'Cache-Control': 'no-store, max-age=0',
        },
      }
    );
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}
