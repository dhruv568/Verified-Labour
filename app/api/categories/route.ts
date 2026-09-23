import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const categories = await prisma.category.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
      include: {
        services: {
          where: { isActive: true },
          orderBy: { name: 'asc' },
        },
      },
    });

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
