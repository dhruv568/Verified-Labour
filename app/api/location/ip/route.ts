import { NextResponse } from 'next/server';
import { detectLocationFromIP } from '@/lib/location';

export async function GET() {
  try {
    const result = await detectLocationFromIP();
    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (err: any) {
    return NextResponse.json({
      success: true,
      data: {
        formattedAddress: 'Surat, Gujarat',
        city: 'Surat',
        state: 'Gujarat',
        postalCode: '395007',
        area: '',
        latitude: 21.170,
        longitude: 72.831,
      },
    });
  }
}
