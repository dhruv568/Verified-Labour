import crypto from 'crypto';

/**
 * Generates a cryptographically secure random token string.
 */
export function generateSecureToken(bytes: number = 32): string {
  return crypto.randomBytes(bytes).toString('hex');
}

/**
 * Computes SHA-256 hash of a token for secure database storage.
 */
export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

/**
 * Compares a plain raw token with a stored SHA-256 hash.
 */
export function verifyTokenHash(rawToken: string, storedHash: string): boolean {
  const hash = hashToken(rawToken);
  return crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(storedHash));
}
