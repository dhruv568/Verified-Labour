import { NextRequest, NextResponse } from 'next/server';
import { forwardGeocode } from '@/lib/location';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get('q');

    if (!q || !q.trim()) {
      return NextResponse.json(
        { success: false, error: 'Query parameter q is required' },
        { status: 400 }
      );
    }

    const result = await forwardGeocode(q);
    if (!result) {
      return NextResponse.json(
        { success: false, error: 'Location coordinates not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: 'Geocoding error: ' + err.message },
      { status: 500 }
    );
  }
}
