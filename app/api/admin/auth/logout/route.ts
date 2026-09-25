import { NextRequest, NextResponse } from 'next/server';
import { clearAuthCookie, getSessionUser } from '@/lib/auth';
import prisma from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const sessionUser = await getSessionUser(req);
    if (sessionUser && sessionUser.adminUser) {
      await prisma.auditLog.create({
        data: {
          adminId: sessionUser.adminUser.id,
          action: 'ADMIN_LOGOUT',
          targetType: 'SESSION',
          targetId: sessionUser.id,
          ipAddress: req.headers.get('x-forwarded-for') || '127.0.0.1',
          userAgent: req.headers.get('user-agent') || 'Browser',
        },
      });
    }

    const response = NextResponse.json({
      success: true,
      message: 'Admin session invalidated successfully',
    });

    clearAuthCookie(response);
    return response;
  } catch (err: any) {
    const response = NextResponse.json({
      success: true,
      message: 'Logged out',
    });
    clearAuthCookie(response);
    return response;
  }
}
