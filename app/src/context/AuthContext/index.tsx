/**
 * AuthContext - Main entry point (de-minified)
 *
 * Structure:
 * ├── constants.ts     → salts, patterns, keys
 * ├── sanitization.ts  → sanitizeInput
 * ├── hashing.ts       → iterativeHash, hashPassword, etc.
 * ├── rateLimit.ts     → rate limiting logic
 * ├── audit.ts         → audit logging
 * ├── types.ts         → AuthContextType
 * ├── provider.tsx     → React provider (main logic)
 * └── index.tsx        → This file (public API)
 */

export * from "./provider";
export * from "./types";
export { sanitizeInput } from "./sanitization";
export { getAuditLog } from "./audit";
export { hashPassword, hashUserPassword, verifyAdminPassword } from "./hashing";
export { checkRateLimit, recordLoginAttempt } from "./rateLimit";
