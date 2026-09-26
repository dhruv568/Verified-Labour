import { NextRequest, NextResponse } from 'next/server';
import {
  getTestimonials,
  getTestimonialCount,
  setTestimonialCount,
  updateTestimonialSlot,
  deleteTestimonialSlot,
} from '@/lib/testimonials';
import prisma from '@/lib/db';
import { requirePermission } from '@/lib/rbac';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(req: NextRequest) {
  try {
    const auth = await requirePermission(req, 'testimonials.view');
    if (auth.error) return auth.error;

    const [testimonials, count] = await Promise.all([
      getTestimonials(false),
      getTestimonialCount(),
    ]);

    return NextResponse.json({
      success: true,
      count,
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
    const auth = await requirePermission(req, 'testimonials.edit');
    if (auth.error) return auth.error;

    const body = await req.json();

    // 1. Handle Count Update Action
    if (body.action === 'UPDATE_COUNT' || (body.count !== undefined && body.slot === undefined)) {
      const newCount = parseInt(body.count, 10);
      if (isNaN(newCount) || newCount < 0 || newCount > 20) {
        return NextResponse.json(
          { success: false, error: 'Invalid testimonial count. Must be between 0 and 20.' },
          { status: 400 }
        );
      }

      const updatedCount = await setTestimonialCount(newCount);
      const allTestimonials = await getTestimonials(false);

      await prisma.auditLog.create({
        data: {
          adminId: auth.user.adminUser?.id || null,
          action: 'UPDATE_TESTIMONIAL_COUNT',
          targetType: 'TESTIMONIAL_CONFIG',
          targetId: 'testimonial_count',
          newState: JSON.stringify({ count: updatedCount }),
        },
      }).catch(console.error);

      return NextResponse.json({
        success: true,
        message: `Number of testimonials updated to ${updatedCount}`,
        count: updatedCount,
        testimonials: allTestimonials,
      });
    }

    // 2. Handle Testimonial Slot Update Action
    const {
      slot,
      customerName,
      profession,
      location,
      testimonialText,
      rating,
      isActive,
      displayTarget,
      imageUrl,
      imageZoom,
      imageOffsetX,
      imageOffsetY,
    } = body;

    const slotNum = Number(slot);
    if (isNaN(slotNum) || slotNum < 1 || slotNum > 20) {
      return NextResponse.json(
        { success: false, error: 'Invalid slot number. Must be between 1 and 20.' },
        { status: 400 }
      );
    }

    if (!customerName || typeof customerName !== 'string' || !customerName.trim()) {
      return NextResponse.json(
        { success: false, error: 'Customer name is required' },
        { status: 400 }
      );
    }

    const validTarget =
      displayTarget === 'DESKTOP' || displayTarget === 'MOBILE' || displayTarget === 'BOTH'
        ? displayTarget
        : 'BOTH';

    const validImageUrl = typeof imageUrl === 'string' && imageUrl.trim().length > 0 ? imageUrl.trim() : undefined;

    const updatedSlot = await updateTestimonialSlot(slotNum, {
      customerName: customerName.trim(),
      profession: profession !== undefined ? String(profession).trim() : null,
      location: location !== undefined ? String(location).trim() : null,
      testimonialText: testimonialText !== undefined ? String(testimonialText).trim() : null,
      rating: rating !== undefined ? Math.min(Math.max(Number(rating), 1), 5) : 5,
      isActive: Boolean(isActive),
      displayTarget: validTarget,
      imageUrl: validImageUrl,
      imageZoom: imageZoom !== undefined ? Number(imageZoom) : undefined,
      imageOffsetX: imageOffsetX !== undefined ? Number(imageOffsetX) : undefined,
      imageOffsetY: imageOffsetY !== undefined ? Number(imageOffsetY) : undefined,
    });

    // Record audit log
    await prisma.auditLog.create({
      data: {
        adminId: auth.user.adminUser?.id || null,
        action: 'UPDATE_TESTIMONIAL_CARD',
        targetType: 'TESTIMONIAL',
        targetId: `slot_${slotNum}`,
        newState: JSON.stringify(updatedSlot),
      },
    }).catch(console.error);

    const [allTestimonials, currentCount] = await Promise.all([
      getTestimonials(false),
      getTestimonialCount(),
    ]);

    return NextResponse.json({
      success: true,
      message: `Testimonial Card ${slotNum} updated successfully`,
      testimonial: updatedSlot,
      count: currentCount,
      testimonials: allTestimonials,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: 'Failed to update testimonial: ' + err.message },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const auth = await requirePermission(req, 'testimonials.edit');
    if (auth.error) return auth.error;

    const { searchParams } = new URL(req.url);
    const slotParam = searchParams.get('slot');
    const slotNum = slotParam ? parseInt(slotParam, 10) : NaN;

    if (isNaN(slotNum) || slotNum < 1) {
      return NextResponse.json(
        { success: false, error: 'Invalid slot number provided for deletion.' },
        { status: 400 }
      );
    }

    await deleteTestimonialSlot(slotNum);

    await prisma.auditLog.create({
      data: {
        adminId: auth.user.adminUser?.id || null,
        action: 'DELETE_TESTIMONIAL_CARD',
        targetType: 'TESTIMONIAL',
        targetId: `slot_${slotNum}`,
      },
    }).catch(console.error);

    const [allTestimonials, currentCount] = await Promise.all([
      getTestimonials(false),
      getTestimonialCount(),
    ]);

    return NextResponse.json({
      success: true,
      message: `Testimonial Card ${slotNum} deleted successfully`,
      count: currentCount,
      testimonials: allTestimonials,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: 'Failed to delete testimonial: ' + err.message },
      { status: 500 }
    );
  }
}
