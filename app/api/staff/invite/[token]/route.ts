import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/db';
import { hashToken } from '@/lib/tokens';
import { hashPassword } from '@/lib/auth';
import { getPermissionLabel } from '@/lib/permissions';

const passwordSchema = z.string()
  .min(8, 'Password must be at least 8 characters long')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character');

export async function GET(
  req: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const rawToken = params.token;
    const tokenHash = hashToken(rawToken);

    const invitation = await prisma.staffInvitation.findUnique({
      where: { tokenHash },
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
        { success: false, error: 'Invalid or missing invitation token.' },
        { status: 404 }
      );
    }

    if (invitation.status === 'ACCEPTED') {
      return NextResponse.json(
        { success: false, error: 'This invitation has already been accepted. Please proceed to Staff Login.' },
        { status: 400 }
      );
    }

    if (invitation.status === 'REVOKED') {
      return NextResponse.json(
        { success: false, error: 'This invitation has been revoked by an administrator.' },
        { status: 403 }
      );
    }

    const isExpired = Date.now() > new Date(invitation.expiresAt).getTime();
    if (isExpired || invitation.status === 'EXPIRED') {
      if (invitation.status !== 'EXPIRED') {
        await prisma.staffInvitation.update({
          where: { id: invitation.id },
          data: { status: 'EXPIRED' },
        });
      }

      return NextResponse.json(
        {
          success: false,
          isExpired: true,
          error: 'This invitation has expired. Please contact your administrator to request a new invitation.',
        },
        { status: 410 }
      );
    }

    const permissionLabels = invitation.role.rolePermissions.map((rp) =>
      getPermissionLabel(rp.permission.key)
    );

    return NextResponse.json({
      success: true,
      invitation: {
        fullName: invitation.fullName,
        email: invitation.email,
        roleName: invitation.role.name,
        roleDescription: invitation.role.description,
        permissions: permissionLabels,
        expiresAt: invitation.expiresAt,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const rawToken = params.token;
    const tokenHash = hashToken(rawToken);

    const invitation = await prisma.staffInvitation.findUnique({
      where: { tokenHash },
      include: {
        role: true,
      },
    });

    if (!invitation) {
      return NextResponse.json(
        { success: false, error: 'Invalid or missing invitation token.' },
        { status: 404 }
      );
    }

    if (invitation.status !== 'PENDING') {
      return NextResponse.json(
        { success: false, error: `Invitation is no longer valid (Status: ${invitation.status}).` },
        { status: 400 }
      );
    }

    if (Date.now() > new Date(invitation.expiresAt).getTime()) {
      await prisma.staffInvitation.update({
        where: { id: invitation.id },
        data: { status: 'EXPIRED' },
      });

      return NextResponse.json(
        { success: false, isExpired: true, error: 'This invitation link has expired.' },
        { status: 410 }
      );
    }

    const body = await req.json();
    const { password, confirmPassword } = body;

    if (password !== confirmPassword) {
      return NextResponse.json(
        { success: false, error: 'Passwords do not match.' },
        { status: 400 }
      );
    }

    const parsedPass = passwordSchema.safeParse(password);
    if (!parsedPass.success) {
      return NextResponse.json(
        { success: false, error: parsedPass.error.errors[0].message },
        { status: 400 }
      );
    }

    // Hash new password
    const passwordHashValue = await hashPassword(password);
    const normalizedEmail = invitation.email.toLowerCase().trim();

    // Check if User already exists with this email
    let user = await prisma.user.findFirst({
      where: { email: normalizedEmail },
    });

    if (user) {
      // Update existing user to staff
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          passwordHash: passwordHashValue,
          role: 'STAFF',
          status: 'ACTIVE',
          isEmailVerified: true,
        },
      });
    } else {
      // Create new staff User record (generate dummy unique phone if needed)
      const dummyPhone = `+9199${Math.floor(10000000 + Math.random() * 90000000)}`;
      user = await prisma.user.create({
        data: {
          email: normalizedEmail,
          phone: dummyPhone,
          passwordHash: passwordHashValue,
          role: 'STAFF',
          status: 'ACTIVE',
          isEmailVerified: true,
          isPhoneVerified: true,
        },
      });
    }

    // Upsert StaffAssignment
    await prisma.staffAssignment.upsert({
      where: { userId: user.id },
      update: {
        roleId: invitation.roleId,
        status: 'ACTIVE',
      },
      create: {
        userId: user.id,
        roleId: invitation.roleId,
        status: 'ACTIVE',
        assignedByUserId: invitation.createdById,
      },
    });

    // Mark invitation as accepted
    await prisma.staffInvitation.update({
      where: { id: invitation.id },
      data: {
        status: 'ACCEPTED',
        acceptedAt: new Date(),
      },
    });

    // Audit Log
    const clientIp = req.headers.get('x-forwarded-for') || '127.0.0.1';
    await prisma.auditLog.create({
      data: {
        adminId: null,
        action: 'STAFF_ACCEPTED_INVITATION',
        targetType: 'USER',
        targetId: user.id,
        newState: JSON.stringify({ email: normalizedEmail, roleName: invitation.role.name }),
        ipAddress: clientIp,
        userAgent: req.headers.get('user-agent') || 'Browser',
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Staff account created successfully! You can now log in.',
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
