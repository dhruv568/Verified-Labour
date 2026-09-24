import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser, clearAuthCookie } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    if (!user) {
      return NextResponse.json({ authenticated: false, user: null });
    }

    return NextResponse.json({
      authenticated: true,
      user: {
        id: user.id,
        phone: user.phone,
        email: user.email,
        role: user.role,
        status: user.status,
        isPhoneVerified: user.isPhoneVerified,
        customerProfile: user.customerProfile,
        workerProfile: user.workerProfile,
        businessProfile: user.businessProfile,
        adminUser: user.adminUser,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ authenticated: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const response = NextResponse.json({ success: true, message: 'Logged out successfully' });
  clearAuthCookie(response);
  return response;
}
