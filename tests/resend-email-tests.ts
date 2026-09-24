import assert from 'assert';
import { renderOtpEmailHtml, sendEmailOtp, verifyEmailOtpCode } from '../services/resend-service';
import activeOtps from '../lib/otp-store';

export async function runResendEmailTests() {
  console.log('\n--- 8. Resend OTP & HTML Email Template Tests ---');
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

  const testEmail = 'email.test@verifiedlabour.com';
  const sampleOtp = '187509';

  test('HTML email template renders all required structure and branding elements', () => {
    const { html, text } = renderOtpEmailHtml({
      otp: sampleOtp,
      email: testEmail,
      name: 'Ramesh Patel',
    });

    // 1. Logo & Tagline
    assert(html.includes('logo.jpeg'), 'HTML must include logo reference');
    assert(html.includes("India's Trusted Skilled Labour Marketplace"), 'HTML must include tagline');

    // 2. Heading & Message
    assert(html.includes('Verify Your Email'), 'HTML must include heading "Verify Your Email"');
    assert(html.includes('Ramesh Patel'), 'HTML must render recipient name');

    // 3. Prominent OTP Card & Monospace Copy/Paste structure
    assert(html.includes('#F0FDF4'), 'HTML OTP card must have rounded background #F0FDF4');
    assert(html.includes('#0B9B5A'), 'HTML OTP card must have brand border #0B9B5A');
    assert(html.includes(sampleOtp), 'HTML must display the 6-digit OTP code');
    assert(html.includes("font-family: 'Courier New', Courier, Consolas, monospace"), 'OTP text must use monospace font');
    assert(html.includes('letter-spacing: 10px'), 'OTP text must include letter spacing for readability');
    assert(html.includes('user-select: all'), 'OTP text must allow single-click select/copy on mobile/web');

    // 4. Validity badge & Security Notice
    assert(html.includes('Valid for 10 minutes'), 'HTML must include "Valid for 10 minutes" badge');
    assert(html.includes('Never share this code with anyone.'), 'HTML must include security warning');
    assert(html.includes('If you did not request this verification code, you can safely ignore this email.'), 'HTML must include safety notice');

    // 5. CTA Button
    assert(html.includes('Verify Email'), 'HTML must include CTA button "Verify Email"');

    // 6. Footer Links & Branding
    assert(html.includes('Privacy Policy'), 'Footer must contain Privacy Policy link');
    assert(html.includes('Terms &amp; Conditions') || html.includes('Terms & Conditions'), 'Footer must contain Terms & Conditions link');
    assert(html.includes('verifiedlabour@gmail.com'), 'Footer must contain support contact info');
    assert(html.includes('© 2025 Verified Labour'), 'Footer must contain copyright notice');
    assert(html.includes('Powered by'), 'Footer must contain Powered by line');
    assert(html.includes('https://myprofunnels.com/'), 'Footer must link to MyProFunnels');
    assert(html.includes('MyProFunnels ❤️'), 'Footer must render MyProFunnels ❤️ text');

    // 7. Plain text fallback checks
    assert(text.includes(sampleOtp), 'Plain text fallback must include OTP');
    assert(text.includes('Valid for 10 minutes'), 'Plain text fallback must include validity duration');
    assert(text.includes('Never share this code with anyone'), 'Plain text fallback must include security notice');
    assert(text.includes('MyProFunnels ❤️'), 'Plain text fallback must include MyProFunnels link text');
  });

  await testAsync('sendEmailOtp generates dynamic OTP and stores it in activeOtps', async () => {
    const res = await sendEmailOtp({ email: testEmail, name: 'Test User' });
    assert.strictEqual(res.success, true);
    assert.strictEqual(res.otp.length, 6);
    assert(/^\d{6}$/.test(res.otp), 'Generated OTP must be a 6-digit numeric string');

    const stored = activeOtps.get(testEmail);
    assert.strictEqual(stored?.otp, res.otp);
    assert(stored.expiresAt > Date.now());
  });

  await testAsync('Resending email OTP generates a NEW OTP and invalidates previous OTP', async () => {
    const firstRes = await sendEmailOtp({ email: testEmail });
    const firstOtp = firstRes.otp;

    // Simulate resend
    const secondRes = await sendEmailOtp({ email: testEmail, isResend: true });
    const secondOtp = secondRes.otp;

    assert.strictEqual(secondRes.success, true);
    assert.notStrictEqual(firstOtp, secondOtp, 'Resending OTP must generate a fresh OTP code');

    // Verifying with old OTP should fail
    const oldVerify = verifyEmailOtpCode(testEmail, firstOtp);
    assert.strictEqual(oldVerify.success, false, 'Previous invalidated OTP must be rejected');

    // Verifying with new OTP should succeed
    const newVerify = verifyEmailOtpCode(testEmail, secondOtp);
    assert.strictEqual(newVerify.success, true, 'New OTP must be accepted');
  });

  test('verifyEmailOtpCode enforces attempt count limits', () => {
    const email = 'limit.test@verifiedlabour.com';
    activeOtps.set(email, { otp: '654321', expiresAt: Date.now() + 600000, attempts: 4 });

    // 5th attempt fails and deletes OTP
    const res = verifyEmailOtpCode(email, '000000');
    assert.strictEqual(res.success, false);
    assert(res.error?.includes('Too many incorrect attempts') || res.error?.includes('Incorrect verification code'));

    // Next call should state expired/invalid
    const nextCall = verifyEmailOtpCode(email, '654321');
    assert.strictEqual(nextCall.success, false);
  });

  return { passed, failed };
}
