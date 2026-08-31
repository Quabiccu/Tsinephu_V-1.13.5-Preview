/**
 * AuthContext - Password Hashing (de-minified)
 * Client-side iterated hashing for brute-force resistance
 * NOTE: Not real bcrypt/scrypt, but prevents trivial localStorage tampering
 */

import { SECRET_SALT, HASH_ITERATIONS } from "./constants";

/**
 * Compute stable hash using FNV-1a inspired mixing
 * Iterated many times to slow brute-force
 */
export function iterativeHash(input: string, iterations: number): string {
  let hash = 0x811c9dc5; // FNV offset basis

  for (let iter = 0; iter < iterations; iter++) {
    for (let i = 0; i < input.length; i++) {
      hash ^= input.charCodeAt(i);
      hash = Math.imul(hash, 0x01000193); // FNV prime
    }
    // Mix iteration count to prevent shortcut attacks
    hash ^= iter;
    hash = Math.imul(hash, 0x01000193);
  }

  // Convert to unsigned 32-bit, then base64
  const unsigned = hash >>> 0;
  return btoa(String(unsigned) + "_" + input.length);
}

/**
 * Hash admin password: username:salt:password
 */
export function hashPassword(username: string, password: string): string {
  const raw = `${username.toLowerCase()}:${SECRET_SALT}:${password}`;
  return iterativeHash(raw, HASH_ITERATIONS);
}

/**
 * Hash user password for storage
 */
export function hashUserPassword(password: string): string {
  const salted = `${SECRET_SALT}:${password}:${SECRET_SALT}`;
  return iterativeHash(salted, HASH_ITERATIONS);
}

/**
 * Legacy hash for backward compatibility
 */
export function legacyHashUserPassword(password: string): string {
  const salted = `${SECRET_SALT}:${password}:${SECRET_SALT}`;
  let hash = 0;
  for (let i = 0; i < salted.length; i++) {
    const char = salted.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return btoa(String(hash) + "_" + password.length);
}

/**
 * Verify user password
 */
export function verifyUserPassword(
  password: string,
  storedHash: string,
): boolean {
  return hashUserPassword(password) === storedHash;
}

/**
 * Known admin hashes - prevents localStorage tampering
 */
export function getKnownAdminHashes(): Record<string, string[]> {
  return {
    anatolcyman_: [hashPassword("anatolcyman_", "comet_star_2026_admin")],
    tsinephu_official: [
      hashPassword("tsinephu_official", "official_platform_2026"),
    ],
  };
}

/**
 * Verify admin password against known hashes
 */
export function verifyAdminPassword(
  username: string,
  passwordHash: string,
): boolean {
  const knownAdminHashes = getKnownAdminHashes();
  const hashes = knownAdminHashes[username.toLowerCase()];
  if (!hashes) return false;
  return hashes.includes(passwordHash);
}
