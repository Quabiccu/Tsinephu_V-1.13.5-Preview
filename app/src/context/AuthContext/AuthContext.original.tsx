import { createContext, useContext, useState, useEffect } from "react";
import type { User, AuthState } from "@/types";

// --- Secure Admin System ---
// Admin usernames are paired with hashed passwords
// The hash is computed with iterated hashing for brute-force resistance.
// This is NOT a real bcrypt/scrypt (we're client-side), but it
// prevents trivial modification of localStorage to gain admin rights.
const SECRET_SALT = "ts1n3phu_quab1ccu_2026_salt_v2";
const HASH_ITERATIONS = 10000;

// --- Input Sanitization ---
const DANGEROUS_PATTERNS = [
  /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script\s*>/gi,
  /javascript\s*:/gi,
  /on\w+\s*=/gi,
  /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe\s*>/gi,
  /<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object\s*>/gi,
  /<embed\b[^<]*>?/gi,
  /<link\b[^<]*>?/gi,
];

/**
 * sanitizeInput - Strips potentially dangerous content from user inputs.
 * Removes script tags, event handlers, javascript: URLs, and other XSS vectors.
 */
export function sanitizeInput(input: string): string {
  if (!input || typeof input !== "string") return input;
  let sanitized = input;
  for (const pattern of DANGEROUS_PATTERNS) {
    sanitized = sanitized.replace(pattern, "");
  }
  // Also remove any remaining HTML tag-like content as a safety net
  sanitized = sanitized.replace(/<[^>]*>/g, "");
  // Trim to prevent whitespace-only attacks
  sanitized = sanitized.trim();
  return sanitized;
}

// --- Rate Limiting ---
interface LoginAttempt {
  key: string; // username or IP identifier
  timestamp: number;
}

const loginAttempts: LoginAttempt[] = [];
const RATE_LIMIT_MAX = 5;
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute

function getClientIdentifier(): string {
  // Simple client fingerprint - not perfect but helps rate-limit per browser
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

function checkRateLimit(key: string): {
  allowed: boolean;
  remaining: number;
  resetAfterMs: number;
} {
  const now = Date.now();
  const windowStart = now - RATE_LIMIT_WINDOW_MS;

  // Clean up old attempts
  for (let i = loginAttempts.length - 1; i >= 0; i--) {
    if (loginAttempts[i].timestamp < windowStart) {
      loginAttempts.splice(i, 1);
    }
  }

  // Count attempts for this key in the current window
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

function recordLoginAttempt(key: string): void {
  const fullKey = `${getClientIdentifier()}:${key.toLowerCase()}`;
  loginAttempts.push({ key: fullKey, timestamp: Date.now() });
}

// --- Audit Logging ---
const AUDIT_LOG_KEY = "tsinephu-admin-audit-log";

interface AuditEntry {
  action: "ban" | "unban";
  targetUserId: string;
  performedBy: string;
  reason?: string;
  timestamp: string;
}

function addAuditEntry(entry: Omit<AuditEntry, "timestamp">): void {
  try {
    const saved = localStorage.getItem(AUDIT_LOG_KEY);
    const logs: AuditEntry[] = saved ? JSON.parse(saved) : [];
    logs.push({ ...entry, timestamp: new Date().toISOString() });
    // Keep last 500 entries to prevent unbounded growth
    if (logs.length > 500) {
      logs.splice(0, logs.length - 500);
    }
    localStorage.setItem(AUDIT_LOG_KEY, JSON.stringify(logs));
  } catch {
    // Silently fail if localStorage is unavailable
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

// --- Password Hashing ---

/**
 * Compute a stable string hash using FNV-1a inspired mixing.
 * Iterated many times to slow down brute-force attacks.
 */
function iterativeHash(input: string, iterations: number): string {
  let hash = 0x811c9dc5; // FNV offset basis
  for (let iter = 0; iter < iterations; iter++) {
    for (let i = 0; i < input.length; i++) {
      hash ^= input.charCodeAt(i);
      hash = Math.imul(hash, 0x01000193); // FNV prime
    }
    // Mix iteration count into the hash to prevent shortcut attacks
    hash ^= iter;
    hash = Math.imul(hash, 0x01000193);
  }
  // Convert to unsigned 32-bit, then to base64
  const unsigned = hash >>> 0;
  return btoa(String(unsigned) + "_" + input.length);
}

// Pre-defined admin accounts with their password hashes
// Admin passwords are hashed with iterations
function hashPassword(username: string, password: string): string {
  const raw = `${username.toLowerCase()}:${SECRET_SALT}:${password}`;
  return iterativeHash(raw, HASH_ITERATIONS);
}

// Verify admin password
function verifyAdminPassword(username: string, passwordHash: string): boolean {
  // Check against all known admin password hashes
  const knownAdminHashes: Record<string, string[]> = {
    anatolcyman_: [hashPassword("anatolcyman_", "comet_star_2026_admin")],
    tsinephu_official: [
      hashPassword("tsinephu_official", "official_platform_2026"),
    ],
  };

  const hashes = knownAdminHashes[username.toLowerCase()];
  if (!hashes) return false;
  return hashes.includes(passwordHash);
}

interface AuthContextType extends AuthState {
  login: (
    username: string,
    displayName: string,
    password: string,
    avatar?: string,
  ) => { user: User; error?: string };
  logout: () => void;
  updateUser: (updates: Partial<User>) => void;
  updateAvatar: (avatarUrl: string) => void;
  startObserverMode: () => void;
  exitObserverMode: () => void;
  isObserver: boolean;
  isAdmin: boolean;
  adminLogin: (username: string, password: string) => boolean;
  banUser: (userId: string, reason: string) => void;
  unbanUser: (userId: string) => void;
  isUserBanned: (userId: string) => boolean;
  verifyAdmin: (password: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function generateAvatar(username: string): string {
  const encoded = encodeURIComponent(username);
  return `https://api.dicebear.com/7.x/avataaars/svg?seed=${encoded}&backgroundColor=b6e3f4`;
}

// Hash user password for storage (with iterations for brute-force resistance)
function hashUserPassword(password: string): string {
  const salted = `${SECRET_SALT}:${password}:${SECRET_SALT}`;
  return iterativeHash(salted, HASH_ITERATIONS);
}

// Verify user password
function verifyUserPassword(password: string, storedHash: string): boolean {
  return hashUserPassword(password) === storedHash;
}

// Legacy hash function for backward compatibility with existing accounts
function legacyHashUserPassword(password: string): string {
  const salted = `${SECRET_SALT}:${password}:${SECRET_SALT}`;
  let hash = 0;
  for (let i = 0; i < salted.length; i++) {
    const char = salted.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return btoa(String(hash) + "_" + password.length);
}

const GLOBAL_USERS_KEY = "tsinephu-users";
const BANNED_USERS_KEY = "tsinephu-banned-users";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>(() => {
    const saved = localStorage.getItem("tsinephu-auth");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Verify the stored admin status is legitimate (has hash)
        let isAdmin = false;
        if (parsed.user?.isAdmin && parsed.user?.adminHash) {
          isAdmin = verifyAdminPassword(
            parsed.user.username,
            parsed.user.adminHash,
          );
        }
        return {
          ...parsed,
          user: parsed.user
            ? {
                ...parsed.user,
                joinedAt: new Date(parsed.user.joinedAt),
                displayName: sanitizeInput(
                  parsed.user.displayName || parsed.user.username,
                ),
                bio: parsed.user.bio ? sanitizeInput(parsed.user.bio) : "",
                isAdmin,
              }
            : null,
          isObserver: parsed.isObserver || false,
        };
      } catch {
        return { user: null, isAuthenticated: false, isObserver: false };
      }
    }
    return { user: null, isAuthenticated: false, isObserver: false };
  });

  useEffect(() => {
    localStorage.setItem(
      "tsinephu-auth",
      JSON.stringify({
        ...authState,
        user: authState.user
          ? {
              ...authState.user,
              joinedAt: authState.user.joinedAt.toISOString(),
            }
          : null,
      }),
    );
  }, [authState]);

  const isObserver = authState.isObserver || false;

  // Secure admin check - requires adminHash verification
  const isAdmin =
    authState.user?.isAdmin === true && authState.user?.adminHash
      ? verifyAdminPassword(authState.user.username, authState.user.adminHash)
      : false;

  const registerUserGlobally = (user: User) => {
    const saved = localStorage.getItem(GLOBAL_USERS_KEY);
    const users: User[] = saved ? JSON.parse(saved) : [];
    const existingIndex = users.findIndex(
      (u) => u.id === user.id || u.username === user.username,
    );
    if (existingIndex >= 0) {
      users[existingIndex] = { ...users[existingIndex], ...user };
    } else {
      users.push(user);
    }
    localStorage.setItem(GLOBAL_USERS_KEY, JSON.stringify(users));
  };

  const login = (
    username: string,
    displayName: string,
    password: string,
    avatar?: string,
  ): { user: User; error?: string } => {
    // Sanitize inputs immediately
    const sanitizedUsername = sanitizeInput(username)
      .toLowerCase()
      .replace(/\s+/g, "_");
    const sanitizedDisplayName =
      sanitizeInput(displayName) || sanitizedUsername;

    if (!sanitizedUsername) {
      return { user: null as any, error: "Invalid username." };
    }

    // Check rate limit before processing
    const rateLimit = checkRateLimit(sanitizedUsername);
    if (!rateLimit.allowed) {
      const secondsLeft = Math.ceil(rateLimit.resetAfterMs / 1000);
      return {
        user: null as any,
        error: `Too many login attempts. Please try again in ${secondsLeft} seconds.`,
      };
    }

    // Record this attempt
    recordLoginAttempt(sanitizedUsername);

    // Check if user exists globally
    const saved = localStorage.getItem(GLOBAL_USERS_KEY);
    const users: User[] = saved ? JSON.parse(saved) : [];
    const existingUser = users.find((u) => u.username === sanitizedUsername);

    // Check if user is banned
    const bannedSaved = localStorage.getItem(BANNED_USERS_KEY);
    const bannedUsers = bannedSaved ? JSON.parse(bannedSaved) : [];
    const isBanned = bannedUsers.some(
      (b: any) => b.userId === existingUser?.id,
    );
    if (isBanned) {
      return { user: null as any, error: "This account has been banned." };
    }

    if (existingUser) {
      // Verify password (try new hash first, fall back to legacy)
      if (!existingUser.passwordHash) {
        return {
          user: null as any,
          error: "Please update your account with a password.",
        };
      }
      if (
        !verifyUserPassword(password, existingUser.passwordHash) &&
        !(legacyHashUserPassword(password) === existingUser.passwordHash)
      ) {
        return { user: null as any, error: "Incorrect password." };
      }

      // Restore admin status
      let isAdminRestored = false;
      let adminHashRestored = "";
      if (existingUser.isAdmin && existingUser.adminHash) {
        isAdminRestored = verifyAdminPassword(
          sanitizedUsername,
          existingUser.adminHash,
        );
        if (isAdminRestored) adminHashRestored = existingUser.adminHash;
      }

      const restoredUser: User = {
        ...existingUser,
        displayName: sanitizeInput(
          existingUser.displayName || existingUser.username,
        ),
        bio: existingUser.bio ? sanitizeInput(existingUser.bio) : "",
        joinedAt: new Date(existingUser.joinedAt),
        isAdmin: isAdminRestored,
        adminHash: adminHashRestored,
      };

      setAuthState({
        user: restoredUser,
        isAuthenticated: true,
      });
      return { user: restoredUser };
    }

    // New user registration
    if (!password || password.length < 4) {
      return {
        user: null as any,
        error: "Password must be at least 4 characters.",
      };
    }

    const newUser: User = {
      id: `user_${Date.now()}`,
      username: sanitizedUsername,
      displayName: sanitizedDisplayName,
      avatar: avatar || generateAvatar(username),
      bio: "",
      joinedAt: new Date(),
      following: [],
      followers: [],
      passwordHash: hashUserPassword(password),
    };

    registerUserGlobally(newUser);

    setAuthState({
      user: newUser,
      isAuthenticated: true,
    });

    return { user: newUser };
  };

  const adminLogin = (username: string, password: string): boolean => {
    const sanitizedUsername = sanitizeInput(username)
      .toLowerCase()
      .replace(/\s+/g, "_");
    const passwordHash = hashPassword(sanitizedUsername, password);

    if (verifyAdminPassword(sanitizedUsername, passwordHash)) {
      // Find or create admin user
      const saved = localStorage.getItem(GLOBAL_USERS_KEY);
      const users: User[] = saved ? JSON.parse(saved) : [];
      let adminUser = users.find((u) => u.username === sanitizedUsername);

      if (!adminUser) {
        adminUser = {
          id: `admin_${Date.now()}`,
          username: sanitizedUsername,
          displayName: sanitizedUsername,
          avatar: generateAvatar(sanitizedUsername),
          bio: "Platform Administrator",
          joinedAt: new Date(),
          following: [],
          followers: [],
          isAdmin: true,
          adminHash: passwordHash,
          passwordHash: hashUserPassword(password),
        };
        registerUserGlobally(adminUser);
      }

      const restoredAdmin: User = {
        ...adminUser,
        joinedAt: new Date(adminUser.joinedAt),
        isAdmin: true,
        adminHash: passwordHash,
      };

      setAuthState({
        user: restoredAdmin,
        isAuthenticated: true,
      });
      return true;
    }
    return false;
  };

  const verifyAdmin = (password: string): boolean => {
    if (!authState.user) return false;
    const passwordHash = hashPassword(authState.user.username, password);
    return verifyAdminPassword(authState.user.username, passwordHash);
  };

  const logout = () => {
    setAuthState({
      user: null,
      isAuthenticated: false,
    });
    localStorage.removeItem("tsinephu-auth");
  };

  const updateUser = (updates: Partial<User>) => {
    if (authState.user) {
      // Sanitize text fields before updating
      const sanitizedUpdates: Partial<User> = { ...updates };
      if (updates.displayName !== undefined) {
        sanitizedUpdates.displayName = sanitizeInput(updates.displayName);
      }
      if (updates.bio !== undefined) {
        sanitizedUpdates.bio = sanitizeInput(updates.bio);
      }

      setAuthState({
        ...authState,
        user: { ...authState.user, ...sanitizedUpdates },
      });
    }
  };

  const updateAvatar = (avatarUrl: string) => {
    if (authState.user) {
      setAuthState({
        ...authState,
        user: { ...authState.user, avatar: avatarUrl },
      });
    }
  };

  const startObserverMode = () => {
    setAuthState({
      user: null,
      isAuthenticated: false,
      isObserver: true,
    });
  };

  const exitObserverMode = () => {
    setAuthState({
      user: null,
      isAuthenticated: false,
      isObserver: false,
    });
  };

  const banUser = (userId: string, reason: string) => {
    if (!isAdmin) return;

    const saved = localStorage.getItem(BANNED_USERS_KEY);
    const bannedUsers: {
      userId: string;
      reason: string;
      bannedAt: string;
      bannedBy: string;
    }[] = saved ? JSON.parse(saved) : [];

    // Remove existing ban if present
    const existingIndex = bannedUsers.findIndex((b) => b.userId === userId);
    const sanitizedReason = sanitizeInput(reason);
    if (existingIndex >= 0) {
      bannedUsers[existingIndex] = {
        userId,
        reason: sanitizedReason,
        bannedAt: new Date().toISOString(),
        bannedBy: authState.user?.username || "unknown",
      };
    } else {
      bannedUsers.push({
        userId,
        reason: sanitizedReason,
        bannedAt: new Date().toISOString(),
        bannedBy: authState.user?.username || "unknown",
      });
    }

    localStorage.setItem(BANNED_USERS_KEY, JSON.stringify(bannedUsers));

    // Also update the user's banned status in global users
    const usersSaved = localStorage.getItem(GLOBAL_USERS_KEY);
    if (usersSaved) {
      const users: User[] = JSON.parse(usersSaved);
      const updatedUsers = users.map((u) =>
        u.id === userId
          ? { ...u, isBanned: true, banReason: sanitizedReason }
          : u,
      );
      localStorage.setItem(GLOBAL_USERS_KEY, JSON.stringify(updatedUsers));
    }

    // Record audit log entry
    addAuditEntry({
      action: "ban",
      targetUserId: userId,
      performedBy: authState.user?.username || "unknown",
      reason: sanitizedReason,
    });
  };

  const unbanUser = (userId: string) => {
    if (!isAdmin) return;

    const saved = localStorage.getItem(BANNED_USERS_KEY);
    if (saved) {
      const bannedUsers = JSON.parse(saved);
      const updated = bannedUsers.filter((b: any) => b.userId !== userId);
      localStorage.setItem(BANNED_USERS_KEY, JSON.stringify(updated));
    }

    const usersSaved = localStorage.getItem(GLOBAL_USERS_KEY);
    if (usersSaved) {
      const users: User[] = JSON.parse(usersSaved);
      const updatedUsers = users.map((u) =>
        u.id === userId ? { ...u, isBanned: false, banReason: undefined } : u,
      );
      localStorage.setItem(GLOBAL_USERS_KEY, JSON.stringify(updatedUsers));
    }

    // Record audit log entry
    addAuditEntry({
      action: "unban",
      targetUserId: userId,
      performedBy: authState.user?.username || "unknown",
    });
  };

  const isUserBanned = (userId: string): boolean => {
    const saved = localStorage.getItem(BANNED_USERS_KEY);
    if (!saved) return false;
    const bannedUsers = JSON.parse(saved);
    return bannedUsers.some((b: any) => b.userId === userId);
  };

  return (
    <AuthContext.Provider
      value={{
        ...authState,
        login,
        logout,
        updateUser,
        updateAvatar,
        startObserverMode,
        exitObserverMode,
        isObserver,
        isAdmin,
        adminLogin,
        banUser,
        unbanUser,
        isUserBanned,
        verifyAdmin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
