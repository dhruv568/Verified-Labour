import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/db';
import { requirePermission, seedPermissionsInDb } from '@/lib/rbac';
import { ALL_PERMISSIONS } from '@/lib/permissions';

const createRoleSchema = z.object({
  name: z.string().min(2, 'Role name must be at least 2 characters').max(50),
  description: z.string().optional(),
  permissionKeys: z.array(z.string()),
});

export async function GET(req: NextRequest) {
  try {
    const auth = await requirePermission(req, 'roles.view');
    if (auth.error) return auth.error;

    // Ensure permissions are seeded in DB
    await seedPermissionsInDb();

    const roles = await prisma.role.findMany({
      include: {
        rolePermissions: {
          include: {
            permission: true,
          },
        },
        staffAssignments: {
          select: {
            id: true,
            status: true,
            user: {
              select: {
                id: true,
                email: true,
              },
            },
          },
        },
        _count: {
          select: {
            staffAssignments: true,
          },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    const formattedRoles = roles.map((r) => ({
      id: r.id,
      name: r.name,
      description: r.description || '',
      isSystem: r.isSystem,
      staffCount: r._count.staffAssignments,
      permissionsCount: r.rolePermissions.length,
      permissionKeys: r.rolePermissions.map((rp) => rp.permission.key),
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
    }));

    return NextResponse.json({
      success: true,
      roles: formattedRoles,
      availablePermissions: ALL_PERMISSIONS,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requirePermission(req, 'roles.create');
    if (auth.error) return auth.error;

    const body = await req.json();
    const parsed = createRoleSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.errors[0].message },
        { status: 400 }
      );
    }

    const { name, description, permissionKeys } = parsed.data;

    // Check for duplicate role name
    const existing = await prisma.role.findUnique({
      where: { name: name.trim() },
    });

    if (existing) {
      return NextResponse.json(
        { success: false, error: `A role named "${name}" already exists.` },
        { status: 400 }
      );
    }

    // Ensure permissions exist in DB
    await seedPermissionsInDb();

    // Find permission IDs for keys
    const dbPermissions = await prisma.permission.findMany({
      where: { key: { in: permissionKeys } },
    });

    // Create Role and RolePermissions in transaction
    const newRole = await prisma.$transaction(async (tx) => {
      const role = await tx.role.create({
        data: {
          name: name.trim(),
          description: description?.trim() || null,
          isSystem: false,
        },
      });

      if (dbPermissions.length > 0) {
        await tx.rolePermission.createMany({
          data: dbPermissions.map((p) => ({
            roleId: role.id,
            permissionId: p.id,
          })),
        });
      }

      return role;
    });

    // Audit Log
    const clientIp = req.headers.get('x-forwarded-for') || '127.0.0.1';
    await prisma.auditLog.create({
      data: {
        adminId: auth.user.adminUser?.id || null,
        action: 'CREATE_ROLE',
        targetType: 'ROLE',
        targetId: newRole.id,
        newState: JSON.stringify({
          roleName: newRole.name,
          permissionsCount: dbPermissions.length,
          permissionKeys,
        }),
        ipAddress: clientIp,
        userAgent: req.headers.get('user-agent') || 'Browser',
      },
    });

    return NextResponse.json({
      success: true,
      message: `Role "${newRole.name}" created successfully.`,
      role: newRole,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
