/**
 * AuthContext - Audit Logging (de-minified)
 * Keeps last 500 admin actions in localStorage
 */

import { AUDIT_LOG_KEY } from "./constants";

export interface AuditEntry {
  action: "ban" | "unban";
  targetUserId: string;
  performedBy: string;
  reason?: string;
  timestamp: string;
}

export function addAuditEntry(entry: Omit<AuditEntry, "timestamp">): void {
  try {
    const saved = localStorage.getItem(AUDIT_LOG_KEY);
    const logs: AuditEntry[] = saved ? JSON.parse(saved) : [];
    logs.push({ ...entry, timestamp: new Date().toISOString() });

    // Keep last 500
    if (logs.length > 500) {
      logs.splice(0, logs.length - 500);
    }

    localStorage.setItem(AUDIT_LOG_KEY, JSON.stringify(logs));
  } catch {
    // Silently fail if localStorage unavailable
  }
}

export function getAuditLog(): AuditEntry[] {
  try {
    const saved = localStorage.getItem(AUDIT_LOG_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
}
