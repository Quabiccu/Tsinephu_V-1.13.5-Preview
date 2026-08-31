/**
 * AuthContext - Constants (de-minified)
 */

export const SECRET_SALT = "ts1n3phu_quab1ccu_2026_salt_v2";
export const HASH_ITERATIONS = 10000;

export const DANGEROUS_PATTERNS = [
  /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script\s*>/gi,
  /javascript\s*:/gi,
  /on\w+\s*=/gi,
  /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe\s*>/gi,
  /<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object\s*>/gi,
  /<embed\b[^<]*>?/gi,
  /<link\b[^<]*>?/gi,
];

export const GLOBAL_USERS_KEY = "tsinephu-users";
export const BANNED_USERS_KEY = "tsinephu-banned-users";
export const AUDIT_LOG_KEY = "tsinephu-admin-audit-log";

export const RATE_LIMIT_MAX = 5;
export const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
