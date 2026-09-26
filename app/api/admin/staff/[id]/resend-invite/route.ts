import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { requirePermission } from '@/lib/rbac';
import { generateSecureToken, hashToken } from '@/lib/tokens';
import { sendStaffInvitationEmail } from '@/services/resend-service';
import { getPermissionLabel } from '@/lib/permissions';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await requirePermission(req, 'staff.create');
    if (auth.error) return auth.error;

    // Find invitation by ID or email
    const invitation = await prisma.staffInvitation.findFirst({
      where: {
        OR: [{ id: params.id }, { email: params.id }],
      },
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
      return NextResponse.json(
        { success: false, error: 'Staff invitation not found.' },
        { status: 404 }
      );
    }

    // Generate new token & extend expiration (7 days)
    const rawToken = generateSecureToken(32);
    const tokenHash = hashToken(rawToken);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const updatedInvitation = await prisma.staffInvitation.update({
      where: { id: invitation.id },
      data: {
        tokenHash,
        expiresAt,
        status: 'PENDING',
      },
    });

    const permissionLabels = invitation.role.rolePermissions.map((rp) =>
      getPermissionLabel(rp.permission.key)
    );

    // Send invitation email
    const emailResult = await sendStaffInvitationEmail({
      email: invitation.email,
      name: invitation.fullName,
      roleName: invitation.role.name,
      permissionsList: permissionLabels,
      inviteToken: rawToken,
      expiresAt,
    });

    // Audit Log
    const clientIp = req.headers.get('x-forwarded-for') || '127.0.0.1';
    await prisma.auditLog.create({
      data: {
        adminId: auth.user.adminUser?.id || null,
        action: 'RESEND_STAFF_INVITATION',
        targetType: 'STAFF_INVITATION',
        targetId: invitation.id,
        newState: JSON.stringify({ email: invitation.email, expiresAt }),
        ipAddress: clientIp,
        userAgent: req.headers.get('user-agent') || 'Browser',
      },
    });

    return NextResponse.json({
      success: true,
      message: `Staff invitation resent to ${invitation.email}`,
      devInviteLink: process.env.NODE_ENV !== 'production' ? emailResult.inviteUrl : undefined,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
