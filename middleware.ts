import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'verified-labour-secret-key-min-32-characters-required-for-jwt-signing'
);

const PROTECTED_ROUTES = [
  '/customer',
  '/worker',
  '/admin',
  '/business',
];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const isProtectedRoute = PROTECTED_ROUTES.some((route) =>
    pathname.startsWith(route)
  );

  if (!isProtectedRoute) {
    return NextResponse.next();
  }

  const token = req.cookies.get('vl_auth_token')?.value;

  if (!token) {
    const url = new URL('/logout', req.url);
    url.searchParams.set('reason', 'unauthorized');
    return NextResponse.redirect(url);
  }

  try {
    await jwtVerify(token, JWT_SECRET);
    return NextResponse.next();
  } catch (err) {
    const url = new URL('/logout', req.url);
    url.searchParams.set('reason', 'expired');
    const response = NextResponse.redirect(url);
    response.cookies.set({
      name: 'vl_auth_token',
      value: '',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 0,
    });
    return response;
  }
}

export const config = {
  matcher: [
    '/customer/:path*',
    '/worker/:path*',
    '/admin/:path*',
    '/business/:path*',
  ],
};
