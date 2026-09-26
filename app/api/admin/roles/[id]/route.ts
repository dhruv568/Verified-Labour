import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/db';
import { requirePermission, seedPermissionsInDb } from '@/lib/rbac';

const updateRoleSchema = z.object({
  name: z.string().min(2).max(50).optional(),
  description: z.string().optional(),
  permissionKeys: z.array(z.string()).optional(),
});

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await requirePermission(req, 'roles.view');
    if (auth.error) return auth.error;

    const role = await prisma.role.findUnique({
      where: { id: params.id },
      include: {
        rolePermissions: {
          include: {
            permission: true,
          },
        },
        staffAssignments: {
          include: {
            user: {
              select: {
                id: true,
                phone: true,
                email: true,
                status: true,
              },
            },
          },
        },
      },
    });

    if (!role) {
      return NextResponse.json({ success: false, error: 'Role not found.' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      role: {
        id: role.id,
        name: role.name,
        description: role.description || '',
        isSystem: role.isSystem,
        permissionKeys: role.rolePermissions.map((rp) => rp.permission.key),
        staff: role.staffAssignments.map((sa) => sa.user),
        createdAt: role.createdAt,
        updatedAt: role.updatedAt,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await requirePermission(req, 'roles.edit');
    if (auth.error) return auth.error;

    const body = await req.json();
    const parsed = updateRoleSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.errors[0].message },
        { status: 400 }
      );
    }

    const { name, description, permissionKeys } = parsed.data;

    const existingRole = await prisma.role.findUnique({
      where: { id: params.id },
      include: { rolePermissions: { include: { permission: true } } },
    });

    if (!existingRole) {
      return NextResponse.json({ success: false, error: 'Role not found.' }, { status: 404 });
    }

    if (existingRole.isSystem && name && name !== existingRole.name) {
      return NextResponse.json(
        { success: false, error: 'System roles cannot be renamed.' },
        { status: 400 }
      );
    }

    // Check duplicate name if changing
    if (name && name.trim() !== existingRole.name) {
      const duplicate = await prisma.role.findUnique({ where: { name: name.trim() } });
      if (duplicate) {
        return NextResponse.json(
          { success: false, error: `A role named "${name}" already exists.` },
          { status: 400 }
        );
      }
    }

    await seedPermissionsInDb();

    // Perform transaction to update details & replace role permissions
    const updatedRole = await prisma.$transaction(async (tx) => {
      const role = await tx.role.update({
        where: { id: params.id },
        data: {
          name: name ? name.trim() : existingRole.name,
          description: description !== undefined ? description.trim() : existingRole.description,
        },
      });

      if (permissionKeys !== undefined) {
        // Delete old role permissions
        await tx.rolePermission.deleteMany({
          where: { roleId: role.id },
        });

        // Add new permissions
        const dbPermissions = await tx.permission.findMany({
          where: { key: { in: permissionKeys } },
        });

        if (dbPermissions.length > 0) {
          await tx.rolePermission.createMany({
            data: dbPermissions.map((p) => ({
              roleId: role.id,
              permissionId: p.id,
            })),
          });
        }
      }

      return role;
    });

    // Audit Log
    const clientIp = req.headers.get('x-forwarded-for') || '127.0.0.1';
    await prisma.auditLog.create({
      data: {
        adminId: auth.user.adminUser?.id || null,
        action: 'UPDATE_ROLE',
        targetType: 'ROLE',
        targetId: updatedRole.id,
        previousState: JSON.stringify({
          name: existingRole.name,
          permissionsCount: existingRole.rolePermissions.length,
        }),
        newState: JSON.stringify({
          name: updatedRole.name,
          permissionKeys: permissionKeys || [],
        }),
        ipAddress: clientIp,
        userAgent: req.headers.get('user-agent') || 'Browser',
      },
    });

    return NextResponse.json({
      success: true,
      message: `Role "${updatedRole.name}" updated successfully.`,
      role: updatedRole,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await requirePermission(req, 'roles.delete');
    if (auth.error) return auth.error;

    const role = await prisma.role.findUnique({
      where: { id: params.id },
      include: {
        _count: {
          select: {
            staffAssignments: true,
            invitations: true,
          },
        },
      },
    });

    if (!role) {
      return NextResponse.json({ success: false, error: 'Role not found.' }, { status: 404 });
    }

    if (role.isSystem) {
      return NextResponse.json(
        { success: false, error: 'System roles cannot be deleted.' },
        { status: 400 }
      );
    }

    if (role._count.staffAssignments > 0) {
      return NextResponse.json(
        {
          success: false,
          error: `Cannot delete role "${role.name}" because it is currently assigned to ${role._count.staffAssignments} staff member(s). Reassign them first.`,
        },
        { status: 400 }
      );
    }

    await prisma.role.delete({
      where: { id: params.id },
    });

    // Audit Log
    const clientIp = req.headers.get('x-forwarded-for') || '127.0.0.1';
    await prisma.auditLog.create({
      data: {
        adminId: auth.user.adminUser?.id || null,
        action: 'DELETE_ROLE',
        targetType: 'ROLE',
        targetId: params.id,
        previousState: JSON.stringify({ name: role.name }),
        ipAddress: clientIp,
        userAgent: req.headers.get('user-agent') || 'Browser',
      },
    });

    return NextResponse.json({
      success: true,
      message: `Role "${role.name}" deleted successfully.`,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
