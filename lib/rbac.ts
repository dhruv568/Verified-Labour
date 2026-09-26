import { NextRequest, NextResponse } from 'next/server';
import prisma from './db';
import { getSessionUser } from './auth';
import { ALL_PERMISSIONS } from './permissions';

/**
 * Seeds all standard permissions into the database if they do not already exist.
 * Also ensures the default system "Super Admin" role exists.
 */
export async function seedPermissionsInDb() {
  try {
    for (const p of ALL_PERMISSIONS) {
      await prisma.permission.upsert({
        where: { key: p.key },
        update: {
          category: p.category,
          label: p.label,
          description: p.description,
        },
        create: {
          key: p.key,
          category: p.category,
          label: p.label,
          description: p.description,
        },
      });
    }

    // Ensure Super Admin system role exists
    const superAdminRole = await prisma.role.upsert({
      where: { name: 'Super Admin' },
      update: {
        description: 'Complete unrestricted platform administration access.',
        isSystem: true,
      },
      create: {
        name: 'Super Admin',
        description: 'Complete unrestricted platform administration access.',
        isSystem: true,
      },
    });

    // Attach all permissions to Super Admin role
    const allDbPermissions = await prisma.permission.findMany();
    for (const perm of allDbPermissions) {
      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: {
            roleId: superAdminRole.id,
            permissionId: perm.id,
          },
        },
        update: {},
        create: {
          roleId: superAdminRole.id,
          permissionId: perm.id,
        },
      });
    }
  } catch (err) {
    console.error('Failed to seed RBAC permissions:', err);
  }
}

/**
 * Fetches all effective permission keys for a given user.
 */
export async function getUserPermissions(userId: string): Promise<{
  isSuperAdmin: boolean;
  roleName: string;
  permissions: string[];
  isDisabled: boolean;
}> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      adminUser: true,
      staffAssignment: {
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
      },
    },
  });

  if (!user || user.status !== 'ACTIVE') {
    return { isSuperAdmin: false, roleName: 'None', permissions: [], isDisabled: true };
  }

  // Super Admin bypass (User with role ADMIN and adminUser profile)
  if (user.role === 'ADMIN' && !user.staffAssignment) {
    return {
      isSuperAdmin: true,
      roleName: 'Super Admin',
      permissions: ALL_PERMISSIONS.map((p) => p.key),
      isDisabled: false,
    };
  }

  // Staff Assignment check
  if (user.staffAssignment) {
    if (user.staffAssignment.status !== 'ACTIVE') {
      return {
        isSuperAdmin: false,
        roleName: user.staffAssignment.role.name,
        permissions: [],
        isDisabled: true,
      };
    }

    const roleName = user.staffAssignment.role.name;
    const isSuperAdmin = roleName === 'Super Admin';
    const permissions = isSuperAdmin
      ? ALL_PERMISSIONS.map((p) => p.key)
      : user.staffAssignment.role.rolePermissions.map((rp) => rp.permission.key);

    return {
      isSuperAdmin,
      roleName,
      permissions,
      isDisabled: false,
    };
  }

  return { isSuperAdmin: false, roleName: 'None', permissions: [], isDisabled: false };
}

/**
 * Server-side authorization check middleware function for protected admin API routes.
 * Verifies authentication, active user status, and required permission.
 * Automatically allows Super Admin.
 */
export type RequirePermissionResult =
  | { user: any; permissions: string[]; isSuperAdmin: boolean; roleName: string; error: null }
  | { user: null; permissions: string[]; isSuperAdmin: boolean; roleName: string; error: NextResponse };

export async function requirePermission(
  req: NextRequest,
  requiredPermission: string
): Promise<RequirePermissionResult> {
  const user = await getSessionUser(req);

  if (!user) {
    return {
      user: null,
      permissions: [],
      isSuperAdmin: false,
      roleName: '',
      error: NextResponse.json(
        { success: false, error: 'Unauthorized: Authentication required.' },
        { status: 401 }
      ),
    };
  }

  if (user.status !== 'ACTIVE') {
    return {
      user: null,
      permissions: [],
      isSuperAdmin: false,
      roleName: '',
      error: NextResponse.json(
        { success: false, error: 'Forbidden: Account has been suspended or disabled.' },
        { status: 403 }
      ),
    };
  }

  // Check permissions
  const permData = await getUserPermissions(user.id);

  if (permData.isDisabled) {
    return {
      user: null,
      permissions: [],
      isSuperAdmin: false,
      roleName: permData.roleName,
      error: NextResponse.json(
        { success: false, error: 'Forbidden: Staff access has been disabled by administrator.' },
        { status: 403 }
      ),
    };
  }

  // Allow if Super Admin OR has explicit required permission
  const hasAccess =
    permData.isSuperAdmin ||
    permData.permissions.includes(requiredPermission) ||
    permData.permissions.includes('*');

  if (!hasAccess) {
    // Log unauthorized access attempt in AuditLog
    const clientIp = req.headers.get('x-forwarded-for') || '127.0.0.1';
    await prisma.auditLog.create({
      data: {
        adminId: user.adminUser?.id || null,
        action: 'UNAUTHORIZED_ACCESS_ATTEMPT',
        targetType: 'API_ROUTE',
        targetId: req.nextUrl.pathname,
        newState: JSON.stringify({
          requiredPermission,
          userEmail: user.email,
          roleName: permData.roleName,
          timestamp: new Date().toISOString(),
        }),
        ipAddress: clientIp,
        userAgent: req.headers.get('user-agent') || 'Browser',
      },
    });

    return {
      user: null,
      permissions: [],
      isSuperAdmin: false,
      roleName: permData.roleName,
      error: NextResponse.json(
        {
          success: false,
          error: `Forbidden: You do not have permission (${requiredPermission}) to perform this action.`,
        },
        { status: 403 }
      ),
    };
  }

  return {
    user,
    permissions: permData.permissions,
    isSuperAdmin: permData.isSuperAdmin,
    roleName: permData.roleName,
    error: null,
  };
}
