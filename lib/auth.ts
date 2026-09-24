import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import prisma from './db';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'verified-labour-secret-key-min-32-characters-required-for-jwt-signing'
);

const TOKEN_COOKIE_NAME = 'vl_auth_token';

export interface AuthPayload {
  userId: string;
  phone: string;
  email?: string;
  role: 'CUSTOMER' | 'WORKER' | 'BUSINESS' | 'ADMIN';
}

export function normalizePhone(rawPhone: string): string {
  let digits = rawPhone.replace(/[\s\-\(\)]/g, '');
  if (digits.startsWith('+91')) {
    digits = digits.substring(3);
  } else if (digits.startsWith('91') && digits.length === 12) {
    digits = digits.substring(2);
  } else if (digits.startsWith('0') && digits.length === 11) {
    digits = digits.substring(1);
  }
  return `+91${digits}`;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function signAuthToken(payload: AuthPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('30d')
    .sign(JWT_SECRET);
}

export async function verifyAuthToken(token: string): Promise<AuthPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as unknown as AuthPayload;
  } catch (err) {
    return null;
  }
}

export function setAuthCookie(response: NextResponse, token: string) {
  response.cookies.set({
    name: TOKEN_COOKIE_NAME,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  });
}

export function clearAuthCookie(response: NextResponse) {
  response.cookies.set({
    name: TOKEN_COOKIE_NAME,
    value: '',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });
}

export async function getSessionUser(req?: NextRequest) {
  let token: string | undefined;

  if (req) {
    token = req.cookies.get(TOKEN_COOKIE_NAME)?.value;
    if (!token) {
      const authHeader = req.headers.get('authorization');
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7);
      }
    }
  } else {
    try {
      const cookieStore = cookies();
      token = cookieStore.get(TOKEN_COOKIE_NAME)?.value;
    } catch {
      // Not in server component context with cookies()
    }
  }

  if (!token) return null;

  const payload = await verifyAuthToken(token);
  if (!payload || !payload.userId) return null;

  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    include: {
      customerProfile: {
        include: { addresses: true },
      },
      workerProfile: {
        include: {
          primaryCategory: true,
          skills: { include: { category: true } },
          serviceAreas: true,
          availability: true,
          aadhaarVerif: true,
          bankVerif: true,
        },
      },
      businessProfile: true,
      adminUser: true,
    },
  });

  if (!user || user.status === 'SUSPENDED' || user.status === 'PENDING_VERIFICATION' || !user.isEmailVerified) return null;

  return user;
}

export function requireRole(allowedRoles: string[]) {
  return async (req: NextRequest) => {
    const user = await getSessionUser(req);
    if (!user) {
      return { error: 'Unauthorized: Authentication required', status: 401 };
    }
    if (!allowedRoles.includes(user.role)) {
      return { error: 'Forbidden: Insufficient permissions for this action', status: 403 };
    }
    return { user, error: null };
  };
}
