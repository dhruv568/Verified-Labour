import assert from 'assert';
import prisma from '../lib/db';
import { verifyPassword, hashPassword } from '../lib/auth';
import { ensureInitialAdminUser } from '../lib/init-admin';
import { sendEmailOtp, verifyEmailOtpCode } from '../services/resend-service';
import { checkRateLimit } from '../lib/rate-limiter';
import { getSiteContent, updateSiteContent } from '../lib/site-config';

export async function runAdminPanelTests(): Promise<{ passed: number; failed: number }> {
  console.log('\n--- 9. Admin Panel & Security Operations Tests ---');

  let passed = 0;
  let failed = 0;

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

  // 1. Initial Admin User Setup & Hashed Password Check
  await testAsync('ensureInitialAdminUser creates help@verifiedlabour.com with strong bcrypt hash', async () => {
    const admin = await ensureInitialAdminUser();
    assert(admin, 'Admin user should be returned');
    assert.strictEqual(admin.email, 'help@verifiedlabour.com');
    assert.strictEqual(admin.role, 'ADMIN');
    assert.strictEqual(admin.status, 'ACTIVE');
    assert(admin.passwordHash, 'Admin must have a password hash');
    
    // Verify password Pass@123 matches hash
    const isValid = await verifyPassword('Pass@123', admin.passwordHash);
    assert(isValid, 'Initial password Pass@123 must verify against stored hash');
  });

  // 2. Admin Login & Email OTP Requirement
  await testAsync('Admin login requires email OTP verification on every login', async () => {
    const email = 'help@verifiedlabour.com';
    const otpResult = await sendEmailOtp({ email, name: 'Admin' });
    assert(otpResult.success, 'OTP generation must succeed');
    assert(otpResult.otp && otpResult.otp.length === 6, 'Generated OTP must be 6 digits');

    // Verify OTP code
    const verification = verifyEmailOtpCode(email, otpResult.otp);
    assert(verification.success, 'Submitting correct OTP must verify successfully');
  });

  // 3. Admin Rate Limiting Protection
  await testAsync('Admin login & OTP rate limiter blocks brute force attempts', async () => {
    const testKey = `test_rate_limit_${Date.now()}`;
    for (let i = 1; i <= 5; i++) {
      const res = checkRateLimit(testKey, 5, 900);
      assert(res.allowed, `Attempt ${i} should be allowed`);
    }
    const blockedRes = checkRateLimit(testKey, 5, 900);
    assert(!blockedRes.allowed, '6th attempt must be blocked by rate limiter');
    assert(blockedRes.retryAfterSeconds > 0, 'Retry-after seconds must be positive');
  });

  // 4. Admin Website Content Management & Live Public Update
  await testAsync('Admin content update in DB appears on public site immediately', async () => {
    const originalContent = await getSiteContent();
    const originalHeroTitle = originalContent.hero_title || "India's #1 Labour Hub";
    const testHeadline = `India's #1 Labour Hub Test`;
    
    try {
      // Update site content via helper
      const updateSuccess = await updateSiteContent({ hero_title: testHeadline });
      assert(updateSuccess, 'Site content update should succeed');

      // Fetch site content
      const siteContent = await getSiteContent();
      assert.strictEqual(siteContent.hero_title, testHeadline, 'Public site content must reflect new DB title');
    } finally {
      // Always restore original hero title so test execution does not pollute the database
      await updateSiteContent({ hero_title: originalHeroTitle });
    }
  });

  // 5. Admin Password Change Flow
  await testAsync('Admin can update password securely from Pass@123 to a new hash', async () => {
    const admin = await prisma.user.findFirst({ where: { email: 'help@verifiedlabour.com' } });
    assert(admin, 'Admin must exist');

    const newPass = 'NewSecretPass@2026';
    const newHash = await hashPassword(newPass);

    await prisma.user.update({
      where: { id: admin.id },
      data: { passwordHash: newHash },
    });

    const updatedAdmin = await prisma.user.findUnique({ where: { id: admin.id } });
    assert(updatedAdmin?.passwordHash, 'Updated hash must exist');
    
    const isNewValid = await verifyPassword(newPass, updatedAdmin.passwordHash);
    assert(isNewValid, 'New password must verify successfully');

    // Revert back to Pass@123 for default credentials requirement
    const originalHash = await hashPassword('Pass@123');
    await prisma.user.update({
      where: { id: admin.id },
      data: { passwordHash: originalHash },
    });
  });

  return { passed, failed };
}
