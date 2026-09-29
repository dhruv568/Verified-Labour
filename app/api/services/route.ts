import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getServiceHindiName } from '@/lib/service-translations';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(req: NextRequest) {
  try {
    const rawServices = await prisma.service.findMany({
      where: {
        isActive: true,
        category: {
          isActive: true,
        },
      },
      orderBy: [
        { category: { sortOrder: 'asc' } },
        { name: 'asc' },
      ],
      include: {
        category: true,
      },
    });

    // Remove duplicates based on ID
    const seenIds = new Set<string>();
    const services = [];

    for (const svc of rawServices) {
      if (!seenIds.has(svc.id)) {
        seenIds.add(svc.id);
        services.push({
          ...svc,
          nameHi: svc.nameHi || getServiceHindiName(svc),
        });
      }
    }

    return NextResponse.json(
      {
        success: true,
        services,
        total: services.length,
      },
      {
        headers: {
          'Cache-Control': 'no-store, max-age=0, must-revalidate',
        },
      }
    );
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch active services: ' + err.message },
      { status: 500 }
    );
  }
}
