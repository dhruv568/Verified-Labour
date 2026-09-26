import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/db';
import { requirePermission } from '@/lib/rbac';
import { generateSecureToken, hashToken } from '@/lib/tokens';
import { sendStaffInvitationEmail } from '@/services/resend-service';
import { getPermissionLabel } from '@/lib/permissions';

const inviteStaffSchema = z.object({
  fullName: z.string().min(2, 'Full name is required').max(100),
  email: z.string().email('Invalid email address'),
  roleId: z.string().uuid('Valid role ID required'),
});

export async function GET(req: NextRequest) {
  try {
    const auth = await requirePermission(req, 'staff.view');
    if (auth.error) return auth.error;

    // Fetch active staff assignments
    const staffAssignments = await prisma.staffAssignment.findMany({
      include: {
        user: {
          select: {
            id: true,
            email: true,
            phone: true,
            status: true,
            createdAt: true,
          },
        },
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
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Fetch invitations
    const invitations = await prisma.staffInvitation.findMany({
      include: {
        role: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    const formattedStaff = staffAssignments.map((sa) => {
      // Find matching invitation for full name
      const matchedInvite = invitations.find((i) => i.email.toLowerCase() === sa.user.email?.toLowerCase());

      return {
        id: sa.id,
        userId: sa.user.id,
        fullName: matchedInvite?.fullName || sa.user.email?.split('@')[0] || 'Staff Member',
        email: sa.user.email || '',
        phone: sa.user.phone,
        roleId: sa.roleId,
        roleName: sa.role.name,
        status: sa.status, // "ACTIVE" | "DISABLED"
        invitationStatus: 'ACCEPTED',
        lastLogin: sa.lastLoginAt,
        createdAt: sa.createdAt,
        permissionsCount: sa.role.rolePermissions.length,
        permissionKeys: sa.role.rolePermissions.map((rp) => rp.permission.key),
      };
    });

    // Pending/Expired invitations not yet accepted
    const pendingStaff = invitations
      .filter((inv) => inv.status === 'PENDING' || inv.status === 'EXPIRED')
      .map((inv) => {
        const isExpired = Date.now() > new Date(inv.expiresAt).getTime();
        return {
          id: inv.id,
          invitationId: inv.id,
          fullName: inv.fullName,
          email: inv.email,
          roleId: inv.roleId,
          roleName: inv.role.name,
          status: isExpired ? 'EXPIRED' : 'PENDING',
          invitationStatus: isExpired ? 'EXPIRED' : 'PENDING',
          expiresAt: inv.expiresAt,
          createdAt: inv.createdAt,
          lastLogin: null,
          permissionsCount: 0,
          permissionKeys: [],
        };
      });

    return NextResponse.json({
      success: true,
      staff: [...formattedStaff, ...pendingStaff],
      invitations,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requirePermission(req, 'staff.create');
    if (auth.error) return auth.error;

    const body = await req.json();
    const parsed = inviteStaffSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.errors[0].message },
        { status: 400 }
      );
    }

    const { fullName, email, roleId } = parsed.data;
    const normalizedEmail = email.toLowerCase().trim();

    // Verify role exists
    const role = await prisma.role.findUnique({
      where: { id: roleId },
      include: {
        rolePermissions: {
          include: {
            permission: true,
          },
        },
      },
    });

    if (!role) {
      return NextResponse.json(
        { success: false, error: 'Selected role does not exist.' },
        { status: 400 }
      );
    }

    // Check if email is already assigned staff
    const existingStaff = await prisma.staffAssignment.findFirst({
      where: {
        user: {
          email: normalizedEmail,
        },
      },
    });

    if (existingStaff) {
      return NextResponse.json(
        { success: false, error: `A staff member with email "${normalizedEmail}" already exists.` },
        { status: 400 }
      );
    }

    // Revoke any previous pending invitations for this email
    await prisma.staffInvitation.updateMany({
      where: {
        email: normalizedEmail,
        status: 'PENDING',
      },
      data: {
        status: 'REVOKED',
      },
    });

    // Generate secure token & expiration (7 days)
    const rawToken = generateSecureToken(32);
    const tokenHash = hashToken(rawToken);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    // Create StaffInvitation record
    const invitation = await prisma.staffInvitation.create({
      data: {
        email: normalizedEmail,
        fullName: fullName.trim(),
        roleId: role.id,
        tokenHash,
        expiresAt,
        status: 'PENDING',
        createdById: auth.user.id,
      },
    });

    // Prepare permission summary list for email
    const permissionLabels = role.rolePermissions.map((rp) => getPermissionLabel(rp.permission.key));

    // Send professional invitation email
    const emailResult = await sendStaffInvitationEmail({
      email: normalizedEmail,
      name: fullName.trim(),
      roleName: role.name,
      permissionsList: permissionLabels,
      inviteToken: rawToken,
      expiresAt,
    });

    // Audit Log
    const clientIp = req.headers.get('x-forwarded-for') || '127.0.0.1';
    await prisma.auditLog.create({
      data: {
        adminId: auth.user.adminUser?.id || null,
        action: 'INVITE_STAFF',
        targetType: 'STAFF_INVITATION',
        targetId: invitation.id,
        newState: JSON.stringify({
          fullName: invitation.fullName,
          email: invitation.email,
          roleName: role.name,
          expiresAt,
        }),
        ipAddress: clientIp,
        userAgent: req.headers.get('user-agent') || 'Browser',
      },
    });

    return NextResponse.json({
      success: true,
      message: `Staff invitation dispatched to ${normalizedEmail}`,
      invitation: {
        id: invitation.id,
        email: invitation.email,
        fullName: invitation.fullName,
        roleName: role.name,
        expiresAt: invitation.expiresAt,
      },
      devInviteLink: process.env.NODE_ENV !== 'production' ? emailResult.inviteUrl : undefined,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
