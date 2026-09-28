/**
 * In-memory OTP storage singleton (In production, replace with Redis or SMS provider verification)
 */

export interface OtpEntry {
  otp: string;
  expiresAt: number;
  attempts: number;
  token?: string;
}

const globalForOtps = globalThis as unknown as {
  activeOtps: Map<string, OtpEntry> | undefined;
  tokenToEmail: Map<string, string> | undefined;
};

export const activeOtps =
  globalForOtps.activeOtps ?? new Map<string, OtpEntry>();

export const tokenToEmail =
  globalForOtps.tokenToEmail ?? new Map<string, string>();

if (process.env.NODE_ENV !== 'production') {
  globalForOtps.activeOtps = activeOtps;
  globalForOtps.tokenToEmail = tokenToEmail;
}

export default activeOtps;
