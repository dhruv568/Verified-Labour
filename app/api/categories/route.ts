import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getServiceHindiName, isExcludedServiceOrCategory } from '@/lib/service-translations';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

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

    const categories = rawCategories
      .filter((cat) => !isExcludedServiceOrCategory(cat))
      .map((cat) => ({
        ...cat,
        services: cat.services
          .filter((svc) => !isExcludedServiceOrCategory(svc))
          .map((svc) => ({
            ...svc,
            nameHi: svc.nameHi || getServiceHindiName(svc),
          })),
      }));

    return NextResponse.json(
      {
        success: true,
        categories,
        total: categories.length,
      },
      {
        headers: {
          'Cache-Control': 'no-store, max-age=0, must-revalidate',
        },
      }
    );
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch categories: ' + err.message },
      { status: 500 }
    );
  }
}
