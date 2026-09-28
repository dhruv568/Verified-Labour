import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getServiceHindiName } from '@/lib/service-translations';

export async function GET(req: NextRequest) {
  try {
    const rawCategories = await prisma.category.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
      include: {
        services: {
          where: { isActive: true },
          orderBy: { name: 'asc' },
        },
      },
    });

    const categories = rawCategories.map((cat) => ({
      ...cat,
      services: cat.services.map((svc) => ({
        ...svc,
        nameHi: getServiceHindiName(svc),
      })),
    }));

    return NextResponse.json({
      success: true,
      categories,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch categories: ' + err.message },
      { status: 500 }
    );
  }
}
