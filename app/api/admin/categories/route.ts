import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/db';
import { getSessionUser } from '@/lib/auth';

const categorySchema = z.object({
  id: z.string().optional(),
  name: z.string().min(2),
  nameHi: z.string().optional(),
  slug: z.string().min(2),
  description: z.string().optional(),
  iconUrl: z.string().optional(),
  sortOrder: z.number().int().default(0),
  isActive: z.boolean().default(true),
});

export async function GET(req: NextRequest) {
  try {
    const sessionUser = await getSessionUser(req);
    if (!sessionUser || sessionUser.role !== 'ADMIN') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 });
    }

    const categories = await prisma.category.findMany({
      orderBy: { sortOrder: 'asc' },
      include: {
        services: true,
        _count: { select: { workerProfiles: true, jobRequests: true } },
      },
    });

    return NextResponse.json({ success: true, categories });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const sessionUser = await getSessionUser(req);
    if (!sessionUser || sessionUser.role !== 'ADMIN') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 });
    }

    const body = await req.json();
    const parsed = categorySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.error.errors[0].message }, { status: 400 });
    }

    const { id, name, nameHi, slug, description, iconUrl, sortOrder, isActive } = parsed.data;

    let category;
    if (id) {
      category = await prisma.category.update({
        where: { id },
        data: { name, nameHi, slug, description, iconUrl, sortOrder, isActive },
      });
    } else {
      category = await prisma.category.create({
        data: { name, nameHi, slug, description, iconUrl, sortOrder, isActive },
      });
    }

    // Audit log
    await prisma.auditLog.create({
      data: {
        adminId: sessionUser.adminUser?.id || null,
        action: id ? 'CATEGORY_UPDATE' : 'CATEGORY_CREATE',
        targetType: 'CATEGORY',
        targetId: category.id,
        newState: JSON.stringify(category),
      },
    });

    return NextResponse.json({ success: true, category });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
