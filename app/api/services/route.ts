import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getServiceHindiName } from '@/lib/service-translations';

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

    // Remove duplicates based on ID or unique slug
    const seenIds = new Set<string>();
    const services = [];

    for (const svc of rawServices) {
      if (!seenIds.has(svc.id)) {
        seenIds.add(svc.id);
        services.push({
          ...svc,
          nameHi: getServiceHindiName(svc),
        });
      }
    }

    return NextResponse.json({
      success: true,
      services,
      total: services.length,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch active services: ' + err.message },
      { status: 500 }
    );
  }
}
