import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { sanitizeWorkerForPublic } from '@/lib/location';
import { getSessionUser } from '@/lib/auth';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const { searchParams } = new URL(req.url);
    const latStr = searchParams.get('lat');
    const lngStr = searchParams.get('lng');

    const customerLat = latStr ? parseFloat(latStr) : undefined;
    const customerLng = lngStr ? parseFloat(lngStr) : undefined;

    const worker = await prisma.workerProfile.findUnique({
      where: { id },
      include: {
        primaryCategory: true,
        skills: {
          include: {
            category: true,
            service: true,
          },
        },
        serviceAreas: true,
        availability: true,
        reviews: {
          where: { isHidden: false },
          include: {
            customer: {
              select: { fullName: true, avatarUrl: true },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
        aadhaarVerif: true,
        bankVerif: true,
      },
    });

    if (!worker) {
      return NextResponse.json(
        { success: false, error: 'Worker profile not found' },
        { status: 404 }
      );
    }

    // Completed jobs count
    const completedJobsCount = await prisma.job.count({
      where: {
        workerId: id,
        status: { in: ['COMPLETED', 'PAID', 'REVIEWED'] },
      },
    });

    const sanitized = sanitizeWorkerForPublic(worker, customerLat, customerLng);

    return NextResponse.json({
      success: true,
      worker: {
        ...sanitized,
        completedJobsCount,
        reviews: worker.reviews.map((r) => ({
          id: r.id,
          customerName: r.customer.fullName,
          customerAvatar: r.customer.avatarUrl,
          rating: r.rating,
          comment: r.comment,
          createdAt: r.createdAt,
        })),
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch worker: ' + err.message },
      { status: 500 }
    );
  }
}

// Worker self-update (availability, hourly rate, radius, bio)
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const sessionUser = await getSessionUser(req);
    if (!sessionUser) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;

    // Check ownership or admin
    if (sessionUser.role !== 'ADMIN' && sessionUser.workerProfile?.id !== id) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const { isAvailable, autoAccept, hourlyRate, bio, serviceRadiusKm, city, state, postalCode } = body;

    const updated = await prisma.workerProfile.update({
      where: { id },
      data: {
        ...(typeof isAvailable === 'boolean' && { isAvailable }),
        ...(typeof autoAccept === 'boolean' && { autoAccept }),
        ...(typeof hourlyRate === 'number' && { hourlyRate }),
        ...(typeof bio === 'string' && { bio }),
        ...(typeof serviceRadiusKm === 'number' && { serviceRadiusKm }),
        ...(typeof city === 'string' && { city }),
        ...(typeof state === 'string' && { state }),
        ...(typeof postalCode === 'string' && { postalCode }),
      },
    });

    return NextResponse.json({
      success: true,
      worker: updated,
      message: 'Worker profile updated successfully',
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: 'Update failed: ' + err.message },
      { status: 500 }
    );
  }
}
