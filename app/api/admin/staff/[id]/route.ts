import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/db';
import { requirePermission } from '@/lib/rbac';
import { getPermissionLabel } from '@/lib/permissions';

const updateStaffSchema = z.object({
  roleId: z.string().uuid().optional(),
  status: z.enum(['ACTIVE', 'DISABLED']).optional(),
});

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await requirePermission(req, 'staff.view');
    if (auth.error) return auth.error;

    // Find staff assignment or invitation
    const staffAssignment = await prisma.staffAssignment.findFirst({
      where: {
        OR: [{ id: params.id }, { userId: params.id }],
      },
      include: {
        user: true,
        role: {
          include: {
            rolePermissions: {
              include: {
                permission: true,
              },
            },
          },
        },
      },
    });

    if (staffAssignment) {
      const invite = await prisma.staffInvitation.findFirst({
        where: { email: staffAssignment.user.email || '' },
        orderBy: { createdAt: 'desc' },
      });

      return NextResponse.json({
        success: true,
        staff: {
          id: staffAssignment.id,
          userId: staffAssignment.user.id,
          fullName: invite?.fullName || staffAssignment.user.email?.split('@')[0] || 'Staff Member',
          email: staffAssignment.user.email,
          phone: staffAssignment.user.phone,
          status: staffAssignment.status,
          role: {
            id: staffAssignment.role.id,
            name: staffAssignment.role.name,
            description: staffAssignment.role.description,
          },
          permissions: staffAssignment.role.rolePermissions.map((rp) => ({
            key: rp.permission.key,
            label: rp.permission.label || getPermissionLabel(rp.permission.key),
            category: rp.permission.category,
          })),
          lastLogin: staffAssignment.lastLoginAt,
          createdAt: staffAssignment.createdAt,
          invitationStatus: 'ACCEPTED',
        },
      });
    }

    // Check if it's a pending invitation ID
    const invitation = await prisma.staffInvitation.findUnique({
      where: { id: params.id },
      include: {
        role: {
          include: {
            rolePermissions: {
              include: {
                permission: true,
              },
            },
          },
        },
      },
    });

    if (!invitation) {
      return NextResponse.json({ success: false, error: 'Staff record not found.' }, { status: 404 });
    }

    const isExpired = Date.now() > new Date(invitation.expiresAt).getTime();

    return NextResponse.json({
      success: true,
      staff: {
        id: invitation.id,
        fullName: invitation.fullName,
        email: invitation.email,
        status: isExpired ? 'EXPIRED' : 'PENDING',
        invitationStatus: isExpired ? 'EXPIRED' : 'PENDING',
        role: {
          id: invitation.role.id,
          name: invitation.role.name,
          description: invitation.role.description,
        },
        permissions: invitation.role.rolePermissions.map((rp) => ({
          key: rp.permission.key,
          label: rp.permission.label || getPermissionLabel(rp.permission.key),
          category: rp.permission.category,
        })),
        expiresAt: invitation.expiresAt,
        createdAt: invitation.createdAt,
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
    const auth = await requirePermission(req, 'staff.edit');
    if (auth.error) return auth.error;

    const body = await req.json();
    const parsed = updateStaffSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.errors[0].message },
        { status: 400 }
      );
    }

    const { roleId, status } = parsed.data;

    // Find staff assignment
    const sa = await prisma.staffAssignment.findFirst({
      where: {
        OR: [{ id: params.id }, { userId: params.id }],
      },
      include: {
        user: true,
        role: true,
      },
    });

    if (!sa) {
      return NextResponse.json(
        { success: false, error: 'Active staff assignment not found.' },
        { status: 404 }
      );
    }

    let updatedRoleName = sa.role.name;
    if (roleId && roleId !== sa.roleId) {
      const targetRole = await prisma.role.findUnique({ where: { id: roleId } });
      if (!targetRole) {
        return NextResponse.json({ success: false, error: 'Role not found.' }, { status: 404 });
      }
      updatedRoleName = targetRole.name;
    }

    // Update assignment and user status
    const updated = await prisma.$transaction(async (tx) => {
      const updatedSa = await tx.staffAssignment.update({
        where: { id: sa.id },
        data: {
          roleId: roleId || sa.roleId,
          status: status || sa.status,
        },
        include: {
          role: true,
        },
      });

      if (status) {
        await tx.user.update({
          where: { id: sa.userId },
          data: {
            status: status === 'DISABLED' ? 'SUSPENDED' : 'ACTIVE',
          },
        });

        // Invalidate sessions if disabled
        if (status === 'DISABLED') {
          await tx.session.deleteMany({
            where: { userId: sa.userId },
          });
        }
      }

      return updatedSa;
    });

    // Audit Log
    const clientIp = req.headers.get('x-forwarded-for') || '127.0.0.1';
    await prisma.auditLog.create({
      data: {
        adminId: auth.user.adminUser?.id || null,
        action: 'UPDATE_STAFF',
        targetType: 'STAFF_ASSIGNMENT',
        targetId: sa.id,
        previousState: JSON.stringify({ roleName: sa.role.name, status: sa.status }),
        newState: JSON.stringify({ roleName: updatedRoleName, status: updated.status }),
        ipAddress: clientIp,
        userAgent: req.headers.get('user-agent') || 'Browser',
      },
    });

    return NextResponse.json({
      success: true,
      message: `Staff member updated successfully.`,
      staff: updated,
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
    const auth = await requirePermission(req, 'staff.delete');
    if (auth.error) return auth.error;

    // Check if assignment or invitation
    const sa = await prisma.staffAssignment.findFirst({
      where: {
        OR: [{ id: params.id }, { userId: params.id }],
      },
      include: {
        user: true,
        role: true,
      },
    });

    if (sa) {
      // Remove staff assignment and invalidate sessions
      await prisma.$transaction(async (tx) => {
        await tx.staffAssignment.delete({ where: { id: sa.id } });
        await tx.user.update({
          where: { id: sa.userId },
          data: { role: 'CUSTOMER', status: 'SUSPENDED' },
        });
        await tx.session.deleteMany({ where: { userId: sa.userId } });
      });

      // Audit Log
      const clientIp = req.headers.get('x-forwarded-for') || '127.0.0.1';
      await prisma.auditLog.create({
        data: {
          adminId: auth.user.adminUser?.id || null,
          action: 'REMOVE_STAFF',
          targetType: 'STAFF_ASSIGNMENT',
          targetId: sa.id,
          previousState: JSON.stringify({ email: sa.user.email, roleName: sa.role.name }),
          ipAddress: clientIp,
          userAgent: req.headers.get('user-agent') || 'Browser',
        },
      });

      return NextResponse.json({
        success: true,
        message: 'Staff member removed and admin access revoked.',
      });
    }

    // Check invitation
    const invitation = await prisma.staffInvitation.findUnique({
      where: { id: params.id },
    });

    if (invitation) {
      await prisma.staffInvitation.delete({ where: { id: invitation.id } });

      return NextResponse.json({
        success: true,
        message: 'Pending staff invitation cancelled.',
      });
    }

    return NextResponse.json({ success: false, error: 'Staff record not found.' }, { status: 404 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
