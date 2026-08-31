/**
 * AuthContext - Input Sanitization (de-minified)
 * Prevents XSS by stripping dangerous patterns
 */

import { DANGEROUS_PATTERNS } from "./constants";

/**
 * sanitizeInput - Strips potentially dangerous content
 * Removes script tags, event handlers, javascript: URLs, iframes, etc.
 * Also removes any remaining HTML tags as safety net.
 */
export function sanitizeInput(input: string): string {
  if (!input || typeof input !== "string") return input;

  let sanitized = input;

  // Remove known dangerous patterns
  for (const pattern of DANGEROUS_PATTERNS) {
    sanitized = sanitized.replace(pattern, "");
  }

  // Remove any remaining HTML tags
  sanitized = sanitized.replace(/<[^>]*>/g, "");

  // Trim whitespace
  sanitized = sanitized.trim();

  return sanitized;
}
