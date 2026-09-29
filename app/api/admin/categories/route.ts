import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/db';
import { requirePermission } from '@/lib/rbac';

const categorySchema = z.object({
  id: z.string().optional(),
  name: z.string().min(2),
  nameHi: z.string().optional().nullable(),
  slug: z.string().min(2),
  description: z.string().optional().nullable(),
  iconUrl: z.string().optional().nullable(),
  sortOrder: z.number().int().default(0),
  isActive: z.boolean().default(true),
});

export async function GET(req: NextRequest) {
  try {
    const auth = await requirePermission(req, 'categories.view');
    if (auth.error) return auth.error;

    const categories = await prisma.category.findMany({
      orderBy: { sortOrder: 'asc' },
      include: {
        services: {
          orderBy: { name: 'asc' },
        },
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
    const body = await req.json();
    const parsed = categorySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.error.errors[0].message }, { status: 400 });
    }

    const { id, name, nameHi, slug, description, iconUrl, sortOrder, isActive } = parsed.data;

    const auth = await requirePermission(req, id ? 'categories.edit' : 'categories.create');
    if (auth.error) return auth.error;

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
        adminId: auth.user.adminUser?.id || null,
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

export async function PATCH(req: NextRequest) {
  try {
    const auth = await requirePermission(req, 'categories.edit');
    if (auth.error) return auth.error;

    const body = await req.json();
    const { id, isActive } = body;

    if (!id || typeof isActive !== 'boolean') {
      return NextResponse.json({ success: false, error: 'Invalid parameters' }, { status: 400 });
    }

    const category = await prisma.category.update({
      where: { id },
      data: { isActive },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        adminId: auth.user.adminUser?.id || null,
        action: isActive ? 'CATEGORY_REACTIVATE' : 'CATEGORY_DEACTIVATE',
        targetType: 'CATEGORY',
        targetId: category.id,
        newState: JSON.stringify({ id: category.id, name: category.name, isActive }),
      },
    });

    return NextResponse.json({ success: true, category });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
