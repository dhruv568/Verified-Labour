import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/db';
import { requirePermission } from '@/lib/rbac';

const serviceSchema = z.object({
  id: z.string().optional(),
  categoryId: z.string().min(1, 'Category is required'),
  subcategoryId: z.string().optional().nullable(),
  name: z.string().min(2, 'Service name must be at least 2 characters'),
  nameHi: z.string().optional().nullable(),
  slug: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  basePrice: z.number().min(0).default(300.0),
  priceUnit: z.string().default('per job'),
  isActive: z.boolean().default(true),
});

export async function GET(req: NextRequest) {
  try {
    const auth = await requirePermission(req, 'categories.view');
    if (auth.error) return auth.error;

    const services = await prisma.service.findMany({
      orderBy: [
        { category: { sortOrder: 'asc' } },
        { name: 'asc' },
      ],
      include: {
        category: true,
        _count: { select: { jobs: true, jobRequests: true, workerSkills: true } },
      },
    });

    return NextResponse.json({ success: true, services });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = serviceSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.errors[0].message },
        { status: 400 }
      );
    }

    const {
      id,
      categoryId,
      subcategoryId,
      name,
      nameHi,
      slug: inputSlug,
      description,
      basePrice,
      priceUnit,
      isActive,
    } = parsed.data;

    const auth = await requirePermission(req, id ? 'categories.edit' : 'categories.create');
    if (auth.error) return auth.error;

    // Verify category exists
    const category = await prisma.category.findUnique({ where: { id: categoryId } });
    if (!category) {
      return NextResponse.json({ success: false, error: 'Category not found' }, { status: 404 });
    }

    // Determine slug
    const finalSlug =
      inputSlug && inputSlug.trim().length > 0
        ? inputSlug.trim().toLowerCase().replace(/\s+/g, '-')
        : name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

    let service;
    if (id) {
      // Check for slug conflict with other services
      const existingWithSlug = await prisma.service.findFirst({
        where: { slug: finalSlug, NOT: { id } },
      });
      const resolvedSlug = existingWithSlug ? `${finalSlug}-${Date.now().toString().slice(-4)}` : finalSlug;

      service = await prisma.service.update({
        where: { id },
        data: {
          categoryId,
          subcategoryId: subcategoryId || null,
          name: name.trim(),
          nameHi: nameHi?.trim() || null,
          slug: resolvedSlug,
          description: description?.trim() || null,
          basePrice,
          priceUnit: priceUnit || 'per job',
          isActive,
        },
        include: { category: true },
      });
    } else {
      // Check for slug conflict
      const existingWithSlug = await prisma.service.findUnique({ where: { slug: finalSlug } });
      const resolvedSlug = existingWithSlug ? `${finalSlug}-${Date.now().toString().slice(-4)}` : finalSlug;

      service = await prisma.service.create({
        data: {
          categoryId,
          subcategoryId: subcategoryId || null,
          name: name.trim(),
          nameHi: nameHi?.trim() || null,
          slug: resolvedSlug,
          description: description?.trim() || null,
          basePrice,
          priceUnit: priceUnit || 'per job',
          isActive,
        },
        include: { category: true },
      });
    }

    // Audit log
    await prisma.auditLog.create({
      data: {
        adminId: auth.user.adminUser?.id || null,
        action: id ? 'SERVICE_UPDATE' : 'SERVICE_CREATE',
        targetType: 'SERVICE',
        targetId: service.id,
        newState: JSON.stringify({ id: service.id, name: service.name, categoryId: service.categoryId, isActive: service.isActive }),
      },
    });

    return NextResponse.json({ success: true, service });
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

    const service = await prisma.service.update({
      where: { id },
      data: { isActive },
      include: { category: true },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        adminId: auth.user.adminUser?.id || null,
        action: isActive ? 'SERVICE_REACTIVATE' : 'SERVICE_DEACTIVATE',
        targetType: 'SERVICE',
        targetId: service.id,
        newState: JSON.stringify({ id: service.id, name: service.name, isActive }),
      },
    });

    return NextResponse.json({ success: true, service });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
