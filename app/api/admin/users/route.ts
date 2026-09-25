import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/db';
import { getSessionUser } from '@/lib/auth';

const userActionSchema = z.object({
  userId: z.string(),
  action: z.enum(['ACTIVATE', 'SUSPEND', 'BLOCK']),
  reason: z.string().optional(),
});

export async function GET(req: NextRequest) {
  try {
    const sessionUser = await getSessionUser(req);
    if (!sessionUser || sessionUser.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Admin access required' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const role = searchParams.get('role');
    const status = searchParams.get('status');
    const search = searchParams.get('search');

    const users = await prisma.user.findMany({
      where: {
        ...(role && role !== 'ALL' ? { role } : {}),
        ...(status && status !== 'ALL' ? { status } : {}),
        ...(search
          ? {
              OR: [
                { phone: { contains: search } },
                { email: { contains: search } },
                { customerProfile: { fullName: { contains: search } } },
                { workerProfile: { fullName: { contains: search } } },
                { businessProfile: { companyName: { contains: search } } },
              ],
            }
          : {}),
      },
      include: {
        customerProfile: true,
        workerProfile: {
          include: { primaryCategory: true },
        },
        businessProfile: true,
        adminUser: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    const formattedUsers = users.map((u) => {
      let name = 'N/A';
      if (u.customerProfile) name = u.customerProfile.fullName;
      else if (u.workerProfile) name = u.workerProfile.fullName;
      else if (u.businessProfile) name = u.businessProfile.companyName;
      else if (u.role === 'ADMIN') name = 'System Administrator';

      return {
        id: u.id,
        phone: u.phone,
        email: u.email || 'N/A',
        name,
        role: u.role,
        status: u.status,
        isPhoneVerified: u.isPhoneVerified,
        isEmailVerified: u.isEmailVerified,
        createdAt: u.createdAt,
        customerProfile: u.customerProfile,
        workerProfile: u.workerProfile
          ? {
              id: u.workerProfile.id,
              fullName: u.workerProfile.fullName,
              category: u.workerProfile.primaryCategory?.name || 'Unassigned',
              status: u.workerProfile.status,
            }
          : null,
        businessProfile: u.businessProfile,
      };
    });

    return NextResponse.json({
      success: true,
      users: formattedUsers,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch users: ' + err.message },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const sessionUser = await getSessionUser(req);
    if (!sessionUser || sessionUser.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Admin access required' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const parsed = userActionSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.errors[0].message },
        { status: 400 }
      );
    }

    const { userId, action, reason } = parsed.data;

    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!targetUser) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    if (targetUser.role === 'ADMIN' && targetUser.id !== sessionUser.id) {
      return NextResponse.json(
        { success: false, error: 'Superadmin accounts cannot be modified via standard users endpoint.' },
        { status: 403 }
      );
    }

    let newStatus = targetUser.status;
    if (action === 'ACTIVATE') newStatus = 'ACTIVE';
    else if (action === 'SUSPEND') newStatus = 'SUSPENDED';
    else if (action === 'BLOCK') newStatus = 'BLOCKED';

    await prisma.$transaction([
      prisma.user.update({
        where: { id: userId },
        data: { status: newStatus },
      }),
      prisma.auditLog.create({
        data: {
          adminId: sessionUser.adminUser?.id || null,
          action: `USER_${action}`,
          targetType: 'USER',
          targetId: userId,
          previousState: JSON.stringify({ status: targetUser.status }),
          newState: JSON.stringify({ status: newStatus, reason: reason || 'Admin state change' }),
          ipAddress: req.headers.get('x-forwarded-for') || '127.0.0.1',
          userAgent: req.headers.get('user-agent') || 'Browser',
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      newStatus,
      message: `User status changed to ${newStatus}`,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: 'User status update failed: ' + err.message },
      { status: 500 }
    );
  }
}
