/**
 * AuthContext - Rate Limiting (de-minified)
 * Simple client-side fingerprint + windowed counter
 */

import { RATE_LIMIT_MAX, RATE_LIMIT_WINDOW_MS } from "./constants";

interface LoginAttempt {
  key: string;
  timestamp: number;
}

const loginAttempts: LoginAttempt[] = [];

/**
 * Simple client fingerprint - not perfect but helps per-browser limit
 */
export function getClientIdentifier(): string {
  const raw =
    navigator.userAgent +
    (navigator.language || "") +
    screen.width +
    "x" +
    screen.height;
  let hash = 0;
  for (let i = 0; i < raw.length; i++) {
    const char = raw.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return String(hash);
}

export function checkRateLimit(key: string): {
  allowed: boolean;
  remaining: number;
  resetAfterMs: number;
} {
  const now = Date.now();
  const windowStart = now - RATE_LIMIT_WINDOW_MS;

  // Clean old attempts
  for (let i = loginAttempts.length - 1; i >= 0; i--) {
    if (loginAttempts[i].timestamp < windowStart) {
      loginAttempts.splice(i, 1);
    }
  }

  const fullKey = `${getClientIdentifier()}:${key.toLowerCase()}`;
  const recentAttempts = loginAttempts.filter(
    (a) => a.key === fullKey && a.timestamp >= windowStart,
  );
  const remaining = Math.max(0, RATE_LIMIT_MAX - recentAttempts.length);

  if (recentAttempts.length >= RATE_LIMIT_MAX) {
    const oldestInWindow = recentAttempts[0]?.timestamp || windowStart;
    return {
      allowed: false,
      remaining: 0,
      resetAfterMs: RATE_LIMIT_WINDOW_MS - (now - oldestInWindow),
    };
  }

  return { allowed: true, remaining, resetAfterMs: 0 };
}

export function recordLoginAttempt(key: string): void {
  const fullKey = `${getClientIdentifier()}:${key.toLowerCase()}`;
  loginAttempts.push({ key: fullKey, timestamp: Date.now() });
}
