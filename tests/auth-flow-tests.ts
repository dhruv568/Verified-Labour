import assert from 'assert';
import { NextRequest } from 'next/server';
import prisma from '../lib/db';
import { hashPassword, verifyPassword, signAuthToken, verifyAuthToken, normalizePhone } from '../lib/auth';
import { POST as registerHandler } from '../app/api/auth/register/route';
import { POST as loginHandler } from '../app/api/auth/login/route';

export async function runAuthFlowTests() {
  console.log('\n--- 6. Authentication Flow & Security Tests ---');

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

  // 3. Registration API validations
  const uniqueSuffix = Date.now().toString().slice(-6);
  const testRegEmail = `newuser_${uniqueSuffix}@example.com`;
  const testRegPhone = `98${uniqueSuffix}12`;

  await testAsync('Registration requires Name, Email, Phone, and Password', async () => {
    const req = new NextRequest('http://localhost:3000/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Arjun Verma',
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
    assert.strictEqual(data.user.email, testRegEmail.toLowerCase());
    assert.strictEqual(data.user.phone, `+91${testRegPhone}`);
    assert.strictEqual(data.user.isPhoneVerified, false); // Stored securely for future OTP
    assert.strictEqual(data.user.role, 'CUSTOMER');
    assert.strictEqual(data.user.customerProfile.fullName, 'Arjun Verma');
  });

  await testAsync('Registration rejects duplicate email', async () => {
    const req = new NextRequest('http://localhost:3000/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Duplicate Email User',
        email: testRegEmail,
        phone: `97${uniqueSuffix}99`,
        password: 'Password@123',
        role: 'CUSTOMER',
      }),
    });
    const res = await registerHandler(req);
    const data = await res.json();
    assert.strictEqual(res.status, 409);
    assert.strictEqual(data.success, false);
    assert(data.error.includes('email address already exists'));
  });

  await testAsync('Registration rejects duplicate phone number', async () => {
    const req = new NextRequest('http://localhost:3000/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Duplicate Phone User',
        email: `different_${uniqueSuffix}@example.com`,
        phone: testRegPhone,
        password: 'Password@123',
        role: 'CUSTOMER',
      }),
    });
    const res = await registerHandler(req);
    const data = await res.json();
    assert.strictEqual(res.status, 409);
    assert.strictEqual(data.success, false);
    assert(data.error.includes('mobile number already exists'));
  });

  await testAsync('Registration rejects weak password (<8 characters or no letters/digits)', async () => {
    const req = new NextRequest('http://localhost:3000/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Test Weak',
        email: `weak_${uniqueSuffix}@example.com`,
        phone: `96${uniqueSuffix}11`,
        password: 'short',
        role: 'CUSTOMER',
      }),
    });
    const res = await registerHandler(req);
    const data = await res.json();
    assert.strictEqual(res.status, 400);
    assert.strictEqual(data.success, false);
    assert(data.error.includes('at least 8 characters'));
  });

  await testAsync('Registration rejects invalid phone format', async () => {
    const req = new NextRequest('http://localhost:3000/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Invalid Phone',
        email: `phone_${uniqueSuffix}@example.com`,
        phone: '12345',
        password: 'Password@123',
        role: 'CUSTOMER',
      }),
    });
    const res = await registerHandler(req);
    const data = await res.json();
    assert.strictEqual(res.status, 400);
    assert.strictEqual(data.success, false);
    assert(data.error.includes('valid 10-digit Indian mobile number'));
  });

  // 4. Login: Email + Password API tests
  await testAsync('Login succeeds with registered Email and Password', async () => {
    const req = new NextRequest('http://localhost:3000/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: testRegEmail,
        password: 'Password@123',
      }),
    });
    const res = await loginHandler(req);
    const data = await res.json();
    assert.strictEqual(res.status, 200);
    assert.strictEqual(data.success, true);
    assert.strictEqual(data.user.email, testRegEmail.toLowerCase());
    assert(data.message.includes('successful'));
  });

  await testAsync('Login explicitly rejects using Phone Number as Login ID', async () => {
    const req = new NextRequest('http://localhost:3000/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: `+91${testRegPhone}`,
        password: 'Password@123',
      }),
    });
    const res = await loginHandler(req);
    const data = await res.json();
    assert.strictEqual(res.status, 400);
    assert.strictEqual(data.success, false);
    assert(data.error.includes('Phone number cannot be used as a login ID'));
  });

  await testAsync('Login rejects incorrect password', async () => {
    const req = new NextRequest('http://localhost:3000/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: testRegEmail,
        password: 'WrongPassword@999',
      }),
    });
    const res = await loginHandler(req);
    const data = await res.json();
    assert.strictEqual(res.status, 401);
    assert.strictEqual(data.success, false);
    assert(data.error.includes('Incorrect password'));
  });

  await testAsync('Login rejects unregistered email', async () => {
    const req = new NextRequest('http://localhost:3000/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: 'unregistered.nonexistent@example.com',
        password: 'Password@123',
      }),
    });
    const res = await loginHandler(req);
    const data = await res.json();
    assert.strictEqual(res.status, 401);
    assert.strictEqual(data.success, false);
    assert(data.error.includes('Invalid email or password'));
  });

  // Clean up created test user from database
  try {
    const createdUser = await prisma.user.findFirst({ where: { email: testRegEmail.toLowerCase() } });
    if (createdUser) {
      await prisma.user.delete({ where: { id: createdUser.id } });
    }
  } catch (cleanErr) {
    // Ignore cleanup error in test
  }

  if (failed > 0) {
    throw new Error(`${failed} auth flow tests failed!`);
  }

  return { passed, failed };
}
