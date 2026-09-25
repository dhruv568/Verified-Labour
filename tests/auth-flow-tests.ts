import assert from 'assert';
import { NextRequest } from 'next/server';
import prisma from '../lib/db';
import { hashPassword, verifyPassword, signAuthToken, verifyAuthToken, normalizePhone, getSessionUser } from '../lib/auth';
import activeOtps from '../lib/otp-store';
import { POST as registerHandler } from '../app/api/auth/register/route';
import { POST as loginHandler } from '../app/api/auth/login/route';
import { POST as verifyOtpHandler } from '../app/api/auth/verify-otp/route';
import { POST as resendOtpHandler } from '../app/api/auth/resend-otp/route';

export async function runAuthFlowTests() {
  console.log('\n--- Mandatory Email OTP Authentication & Verification Tests ---');

  let passed = 0;
  let failed = 0;

  function test(name: string, fn: () => void) {
    try {
      fn();
      console.log(`  ✔ PASS: ${name}`);
      passed++;
    } catch (err: any) {
      console.error(`  ✖ FAIL: ${name}`);
      console.error(`    ${err.message}`);
      failed++;
    }
  }

  async function testAsync(name: string, fn: () => Promise<void>) {
    try {
      await fn();
      console.log(`  ✔ PASS: ${name}`);
      passed++;
    } catch (err: any) {
      console.error(`  ✖ FAIL: ${name}`);
      console.error(`    ${err.message}`);
      failed++;
    }
  }

  // 1. Phone Normalization tests
  test('Phone normalizer formats 10-digit number to E.164 (+919876543210)', () => {
    assert.strictEqual(normalizePhone('9876543210'), '+919876543210');
    assert.strictEqual(normalizePhone('+919876543210'), '+919876543210');
    assert.strictEqual(normalizePhone('09876543210'), '+919876543210');
    assert.strictEqual(normalizePhone('919876543210'), '+919876543210');
    assert.strictEqual(normalizePhone(' 98765-43210 '), '+919876543210');
  });

  // 2. Password Hashing and JWT tests
  await testAsync('Password hashing & verification with bcrypt', async () => {
    const raw = 'SecurePass@2026';
    const hash = await hashPassword(raw);
    assert.notStrictEqual(hash, raw);
    const matches = await verifyPassword(raw, hash);
    assert.strictEqual(matches, true);
    const wrongMatches = await verifyPassword('WrongPassword', hash);
    assert.strictEqual(wrongMatches, false);
  });

  await testAsync('JWT Auth Token signs and verifies with email and phone payload', async () => {
    const payload = {
      userId: 'user-auth-test-id',
      phone: '+919876543210',
      email: 'test.auth@example.com',
      role: 'CUSTOMER' as const,
    };
    const token = await signAuthToken(payload);
    assert(token.length > 20);
    const verified = await verifyAuthToken(token);
    assert(verified !== null);
    assert.strictEqual(verified?.userId, payload.userId);
    assert.strictEqual(verified?.email, payload.email);
    assert.strictEqual(verified?.phone, payload.phone);
    assert.strictEqual(verified?.role, payload.role);
  });

  // 3. Mandatory Email OTP Registration Flow
  const uniqueSuffix = Date.now().toString().slice(-6);
  const testRegEmail = `unverified_${uniqueSuffix}@example.com`;
  const testRegPhone = `98${uniqueSuffix}12`;

  await testAsync('Registration creates user as PENDING_VERIFICATION / unverified, dispatches email OTP, and sets NO auth cookie', async () => {
    const req = new NextRequest('http://localhost:3000/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Unverified Test User',
        email: testRegEmail,
        phone: testRegPhone,
        password: 'Password@123',
        role: 'CUSTOMER',
      }),
    });
    const res = await registerHandler(req);
    const data = await res.json();
    assert.strictEqual(res.status, 200);
    assert.strictEqual(data.success, true);
    assert.strictEqual(data.requiresVerification, true);
    assert.strictEqual(data.user.status, 'PENDING_VERIFICATION');
    assert.strictEqual(data.user.isEmailVerified, false);
    assert.strictEqual(res.cookies.get('vl_auth_token'), undefined, 'Registration MUST NOT set vl_auth_token cookie');

    // Verify user record in database
    const dbUser = await prisma.user.findFirst({ where: { email: testRegEmail.toLowerCase() } });
    assert(dbUser !== null);
    assert.strictEqual(dbUser?.status, 'PENDING_VERIFICATION');
    assert.strictEqual(dbUser?.isEmailVerified, false);

    // Verify OTP was stored in activeOtps
    const storedOtp = activeOtps.get(testRegEmail.toLowerCase());
    assert(storedOtp !== undefined, 'Email OTP must be generated and stored in activeOtps');
    assert.strictEqual(storedOtp?.otp.length, 6);
  });

  await testAsync('Resend OTP API endpoint generates a fresh OTP, invalidates old OTP, and returns 10 min expiry', async () => {
    const initialOtp = activeOtps.get(testRegEmail.toLowerCase())?.otp;
    assert(initialOtp !== undefined);

    const req = new NextRequest('http://localhost:3000/api/auth/resend-otp', {
      method: 'POST',
      body: JSON.stringify({ email: testRegEmail }),
    });
    const res = await resendOtpHandler(req);
    const data = await res.json();

    assert.strictEqual(res.status, 200);
    assert.strictEqual(data.success, true);
    assert.strictEqual(data.expiresInSeconds, 600);

    const newStoredOtp = activeOtps.get(testRegEmail.toLowerCase());
    assert(newStoredOtp !== undefined);
    assert.notStrictEqual(newStoredOtp?.otp, initialOtp, 'Resent OTP must differ from initial OTP');
    assert.strictEqual(newStoredOtp?.otp.length, 6);
  });

  await testAsync('Unverified user trying protected access is blocked (getSessionUser returns null)', async () => {
    const dbUser = await prisma.user.findFirst({ where: { email: testRegEmail.toLowerCase() } });
    const token = await signAuthToken({
      userId: dbUser!.id,
      phone: dbUser!.phone,
      email: dbUser!.email || undefined,
      role: dbUser!.role as any,
    });
    const req = new NextRequest('http://localhost:3000/api/customer/dashboard', {
      headers: { cookie: `vl_auth_token=${token}` },
    });
    const sessionUser = await getSessionUser(req);
    assert.strictEqual(sessionUser, null, 'Unverified user MUST NOT be allowed session access');
  });

  await testAsync('Email OTP verification rejects incorrect OTP code', async () => {
    const req = new NextRequest('http://localhost:3000/api/auth/verify-otp', {
      method: 'POST',
      body: JSON.stringify({
        email: testRegEmail,
        otp: '000000',
      }),
    });
    const res = await verifyOtpHandler(req);
    const data = await res.json();
    assert.strictEqual(res.status, 400);
    assert.strictEqual(data.success, false);
    assert(data.error.includes('Incorrect verification code') || data.error.includes('Invalid'));
  });

  await testAsync('Email OTP verification accepts correct OTP, marks email verified, activates user, and sets auth cookie', async () => {
    const storedOtp = activeOtps.get(testRegEmail.toLowerCase());
    assert(storedOtp !== undefined);
    const realOtp = storedOtp.otp;

    const req = new NextRequest('http://localhost:3000/api/auth/verify-otp', {
      method: 'POST',
      body: JSON.stringify({
        email: testRegEmail,
        otp: realOtp,
      }),
    });
    const res = await verifyOtpHandler(req);
    const data = await res.json();

    assert.strictEqual(res.status, 200);
    assert.strictEqual(data.success, true);
    assert.strictEqual(data.user.isEmailVerified, true);
    assert.strictEqual(data.user.status, 'ACTIVE');
    assert(res.cookies.get('vl_auth_token') !== undefined, 'Successful OTP verification MUST set vl_auth_token cookie');

    // Verify database state updated
    const dbUser = await prisma.user.findFirst({ where: { email: testRegEmail.toLowerCase() } });
    assert.strictEqual(dbUser?.isEmailVerified, true);
    assert.strictEqual(dbUser?.status, 'ACTIVE');

    // Verify OTP was invalidated
    assert.strictEqual(activeOtps.get(testRegEmail.toLowerCase()), undefined);
  });

  // 4. Test Existing Unverified User Login Flow
  const unverifiedEmail = `existing_unverified_${uniqueSuffix}@example.com`;
  const unverifiedPhone = `97${uniqueSuffix}99`;
  const hashedPass = await hashPassword('Password@123');

  await prisma.user.create({
    data: {
      phone: `+91${unverifiedPhone}`,
      email: unverifiedEmail,
      passwordHash: hashedPass,
      role: 'CUSTOMER',
      status: 'PENDING_VERIFICATION',
      isEmailVerified: false,
    },
  });

  await testAsync('Existing unverified user login requires OTP, dispatches email OTP, and sets NO auth cookie', async () => {
    const req = new NextRequest('http://localhost:3000/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: unverifiedEmail,
        password: 'Password@123',
      }),
    });
    const res = await loginHandler(req);
    const data = await res.json();

    assert.strictEqual(res.status, 200);
    assert.strictEqual(data.success, true);
    assert.strictEqual(data.requiresVerification, true);
    assert.strictEqual(res.cookies.get('vl_auth_token'), undefined, 'Unverified login MUST NOT set vl_auth_token cookie');

    // Verify OTP was dispatched and stored
    const stored = activeOtps.get(unverifiedEmail.toLowerCase());
    assert(stored !== undefined);
  });

  await testAsync('Existing unverified user completing correct OTP login becomes ACTIVE and receives auth cookie', async () => {
    const stored = activeOtps.get(unverifiedEmail.toLowerCase());
    const realOtp = stored!.otp;

    const req = new NextRequest('http://localhost:3000/api/auth/verify-otp', {
      method: 'POST',
      body: JSON.stringify({
        email: unverifiedEmail,
        otp: realOtp,
      }),
    });
    const res = await verifyOtpHandler(req);
    const data = await res.json();

    assert.strictEqual(res.status, 200);
    assert.strictEqual(data.success, true);
    assert.strictEqual(data.user.isEmailVerified, true);
    assert.strictEqual(data.user.status, 'ACTIVE');
    assert(res.cookies.get('vl_auth_token') !== undefined);
  });

  await testAsync('Mandatory OTP: Even an already active/verified user login requires OTP verification every time', async () => {
    const req = new NextRequest('http://localhost:3000/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: unverifiedEmail,
        password: 'Password@123',
      }),
    });
    const res = await loginHandler(req);
    const data = await res.json();

    assert.strictEqual(res.status, 200);
    assert.strictEqual(data.success, true);
    assert.strictEqual(data.requiresVerification, true, 'Mandatory OTP must require verification on EVERY login');
    assert.strictEqual(res.cookies.get('vl_auth_token'), undefined, 'Login MUST NOT set auth cookie prior to OTP verification');

    // Complete mandatory OTP login
    const stored = activeOtps.get(unverifiedEmail.toLowerCase());
    assert(stored !== undefined);

    const verifyReq = new NextRequest('http://localhost:3000/api/auth/verify-otp', {
      method: 'POST',
      body: JSON.stringify({
        email: unverifiedEmail,
        otp: stored.otp,
      }),
    });
    const verifyRes = await verifyOtpHandler(verifyReq);
    const verifyData = await verifyRes.json();

    assert.strictEqual(verifyRes.status, 200);
    assert.strictEqual(verifyData.success, true);
    assert(verifyRes.cookies.get('vl_auth_token') !== undefined, 'Auth cookie MUST be set after OTP verification');
  });

  // Clean up created test users from database
  try {
    await prisma.user.deleteMany({
      where: {
        email: { in: [testRegEmail.toLowerCase(), unverifiedEmail.toLowerCase()] },
      },
    });
  } catch (cleanErr) {
    // Ignore cleanup error in test
  }

  if (failed > 0) {
    throw new Error(`${failed} auth flow tests failed!`);
  }

  return { passed, failed };
}
