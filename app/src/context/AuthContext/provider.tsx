/**
 * AuthContext - Provider (de-minified and refactored)
 *
 * Original: 581 lines, single file mixing sanitization, hashing, rate limiting, audit, provider
 * Refactored:
 *  - constants.ts     → salts, patterns, keys, rate limit config
 *  - sanitization.ts  → sanitizeInput
 *  - hashing.ts       → iterativeHash, hashPassword, verifyAdminPassword, etc.
 *  - rateLimit.ts     → checkRateLimit, recordLoginAttempt, getClientIdentifier
 *  - audit.ts         → addAuditEntry, getAuditLog
 *  - types.ts         → AuthContextType
 *  - provider.tsx     → This file, React provider logic (clean)
 */

import { createContext, useContext, useState, useEffect } from "react";
import type { User, AuthState } from "@/types";

// De-minified modules
import { GLOBAL_USERS_KEY, BANNED_USERS_KEY } from "./constants";
import { sanitizeInput } from "./sanitization";
import {
  hashPassword,
  hashUserPassword,
  legacyHashUserPassword,
  verifyUserPassword,
  verifyAdminPassword,
} from "./hashing";
import { checkRateLimit, recordLoginAttempt } from "./rateLimit";
import { addAuditEntry } from "./audit";
import type { AuthContextType } from "./types";

// ------------------------------------------------------------------
// Helpers
// ------------------------------------------------------------------

function generateAvatar(username: string): string {
  const encoded = encodeURIComponent(username);
  return `https://api.dicebear.com/7.x/avataaars/svg?seed=${encoded}&backgroundColor=b6e3f4`;
}

// ------------------------------------------------------------------
// Context
// ------------------------------------------------------------------

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ------------------------------------------------------------------
// Provider
// ------------------------------------------------------------------

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>(() => {
    const saved = localStorage.getItem("tsinephu-auth");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Verify stored admin status is legitimate (has hash)
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

  // Persist auth state
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

  // ----- User registration in global list -----

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

  // ----- Login / Registration -----

  const login = (
    username: string,
    displayName: string,
    password: string,
    avatar?: string,
  ) => {
    // Sanitize inputs immediately
    const sanitizedUsername = sanitizeInput(username)
      .toLowerCase()
      .replace(/\s+/g, "_");
    const sanitizedDisplayName =
      sanitizeInput(displayName) || sanitizedUsername;

    if (!sanitizedUsername) {
      return { user: null as any, error: "Invalid username." };
    }

    // Rate limiting
    const rateLimit = checkRateLimit(sanitizedUsername);
    if (!rateLimit.allowed) {
      const secondsLeft = Math.ceil(rateLimit.resetAfterMs / 1000);
      return {
        user: null as any,
        error: `Too many login attempts. Please try again in ${secondsLeft} seconds.`,
      };
    }

    recordLoginAttempt(sanitizedUsername);

    // Check existing user
    const saved = localStorage.getItem(GLOBAL_USERS_KEY);
    const users: User[] = saved ? JSON.parse(saved) : [];
    const existingUser = users.find((u) => u.username === sanitizedUsername);

    // Check banned
    const bannedSaved = localStorage.getItem(BANNED_USERS_KEY);
    const bannedUsers = bannedSaved ? JSON.parse(bannedSaved) : [];
    const isBanned = bannedUsers.some(
      (b: any) => b.userId === existingUser?.id,
    );
    if (isBanned) {
      return { user: null as any, error: "This account has been banned." };
    }

    if (existingUser) {
      // Verify password (new hash first, legacy fallback)
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

    // New registration
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

    const sanitizedReason = sanitizeInput(reason);
    const existingIndex = bannedUsers.findIndex((b) => b.userId === userId);
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

// Re-export sanitization for other modules (ParnikCard, ParnikContext)
export { sanitizeInput } from "./sanitization";
export { getAuditLog } from "./audit";
