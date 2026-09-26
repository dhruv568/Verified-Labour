import { NextResponse } from 'next/server';
import { getTestimonials } from '@/lib/testimonials';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const testimonials = await getTestimonials(true);
    return NextResponse.json({
      success: true,
      testimonials,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch testimonials: ' + err.message },
      { status: 500 }
    );
  }
}
