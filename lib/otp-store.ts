/**
 * In-memory OTP storage singleton (In production, replace with Redis or SMS provider verification)
 */

interface OtpEntry {
  otp: string;
  expiresAt: number;
  attempts: number;
}

const globalForOtps = globalThis as unknown as {
  activeOtps: Map<string, OtpEntry> | undefined;
};

export const activeOtps =
  globalForOtps.activeOtps ?? new Map<string, OtpEntry>();

if (process.env.NODE_ENV !== 'production') {
  globalForOtps.activeOtps = activeOtps;
}

export default activeOtps;
