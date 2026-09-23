import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/db';
import { getSessionUser } from '@/lib/auth';

const createBulkSchema = z.object({
  categoryId: z.string(),
  title: z.string().min(5),
  workersNeeded: z.number().int().min(1),
  experienceRequiredYears: z.number().int().min(0).default(1),
  location: z.string().min(3),
  city: z.string().default('Surat'),
  state: z.string().default('Gujarat'),
  postalCode: z.string().optional(),
  startDate: z.string(),
  endDate: z.string(),
  dailyHours: z.number().min(1).max(16).default(8),
  budgetPerWorker: z.number().min(100),
  description: z.string().min(10),
});

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const categorySlug = searchParams.get('category');
    const city = searchParams.get('city');

    const requirements = await prisma.bulkRequirement.findMany({
      where: {
        status: 'OPEN',
        ...(categorySlug && { category: { slug: categorySlug } }),
        ...(city && { city }),
      },
      include: {
        category: true,
        business: {
          select: { companyName: true, isVerified: true, city: true } as any,
        },
        _count: {
          select: { applications: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      success: true,
      requirements,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch bulk requirements: ' + err.message },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const sessionUser = await getSessionUser(req);
    if (!sessionUser) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    if (sessionUser.role !== 'BUSINESS' && sessionUser.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Only Business accounts can post bulk labour requirements' },
        { status: 403 }
      );
    }

    const businessId = sessionUser.businessProfile?.id;
    if (!businessId) {
      return NextResponse.json(
        { success: false, error: 'Business profile not found for user' },
        { status: 400 }
      );
    }

    const body = await req.json();
    const parsed = createBulkSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.errors[0].message },
        { status: 400 }
      );
    }

    const data = parsed.data;

    const requirement = await prisma.bulkRequirement.create({
      data: {
        businessId,
        categoryId: data.categoryId,
        title: data.title,
        workersNeeded: data.workersNeeded,
        experienceRequiredYears: data.experienceRequiredYears,
        location: data.location,
        city: data.city,
        state: data.state,
        postalCode: data.postalCode,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        dailyHours: data.dailyHours,
        budgetPerWorker: data.budgetPerWorker,
        description: data.description,
        status: 'OPEN',
      },
      include: {
        category: true,
      },
    });

    return NextResponse.json({
      success: true,
      requirement,
      message: 'Bulk labour requirement posted successfully',
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: 'Failed to post requirement: ' + err.message },
      { status: 500 }
    );
  }
}
