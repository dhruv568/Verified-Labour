import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { getTestimonials, updateTestimonialSlot } from '@/lib/testimonials';
import prisma from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const sessionUser = await getSessionUser(req);
    if (!sessionUser || sessionUser.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Admin access required' },
        { status: 403 }
      );
    }

    const testimonials = await getTestimonials(false);
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

export async function POST(req: NextRequest) {
  try {
    const sessionUser = await getSessionUser(req);
    if (!sessionUser || sessionUser.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Admin access required' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { slot, customerName, profession, location, testimonialText, rating, isActive, imageUrl } = body;

    const slotNum = Number(slot);
    if (slotNum !== 1 && slotNum !== 2) {
      return NextResponse.json(
        { success: false, error: 'Invalid slot number. Only slot 1 and slot 2 are allowed.' },
        { status: 400 }
      );
    }

    if (!customerName || typeof customerName !== 'string' || !customerName.trim()) {
      return NextResponse.json(
        { success: false, error: 'Customer name is required' },
        { status: 400 }
      );
    }

    const updatedSlot = await updateTestimonialSlot(slotNum, {
      customerName: customerName.trim(),
      profession: profession !== undefined ? String(profession).trim() : null,
      location: location !== undefined ? String(location).trim() : null,
      testimonialText: testimonialText !== undefined ? String(testimonialText).trim() : null,
      rating: rating !== undefined ? Number(rating) : 5,
      isActive: Boolean(isActive),
      imageUrl: imageUrl !== undefined ? String(imageUrl).trim() : undefined,
    });

    // Record audit log
    if (sessionUser.adminUser?.id) {
      await prisma.auditLog.create({
        data: {
          adminId: sessionUser.adminUser.id,
          action: 'UPDATE_TESTIMONIAL_CARD',
          targetType: 'TESTIMONIAL',
          targetId: `slot_${slotNum}`,
          newState: JSON.stringify(updatedSlot),
        },
      }).catch(console.error);
    }

    const allTestimonials = await getTestimonials(false);

    return NextResponse.json({
      success: true,
      message: `Testimonial Card ${slotNum} updated successfully`,
      testimonial: updatedSlot,
      testimonials: allTestimonials,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: 'Failed to update testimonial: ' + err.message },
      { status: 500 }
    );
  }
}
