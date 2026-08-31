/**
 * AuthContext - Types (de-minified)
 */

import type { User, AuthState } from "@/types";
import type { AuditEntry } from "./audit";

export interface AuthContextType extends AuthState {
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

export type { AuditEntry };
