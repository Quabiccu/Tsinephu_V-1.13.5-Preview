import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import type { User } from "@/types";

const USERS_STORAGE_KEY = "tsinephu-users";

interface UsersContextType {
  users: User[];
  getUserById: (userId: string) => User | undefined;
  getUserByUsername: (username: string) => User | undefined;
  registerUser: (user: User) => void;
  updateUser: (userId: string, updates: Partial<User>) => void;
  followUser: (userId: string, targetUserId: string) => void;
  unfollowUser: (userId: string, targetUserId: string) => void;
  isFollowing: (userId: string, targetUserId: string) => boolean;
}

const UsersContext = createContext<UsersContextType | undefined>(undefined);

export function UsersProvider({ children }: { children: React.ReactNode }) {
  const [users, setUsers] = useState<User[]>(() => {
    const saved = localStorage.getItem(USERS_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      return parsed.map((u: User) => ({
        ...u,
        joinedAt: new Date(u.joinedAt),
      }));
    }
    return [];
  });

  // Save to localStorage whenever users change
  useEffect(() => {
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
  }, [users]);

  const getUserById = useCallback(
    (userId: string) => {
      return users.find((u) => u.id === userId);
    },
    [users],
  );

  const getUserByUsername = useCallback(
    (username: string) => {
      return users.find(
        (u) => u.username.toLowerCase() === username.toLowerCase(),
      );
    },
    [users],
  );

  const registerUser = useCallback((user: User) => {
    setUsers((prev) => {
      // Don't duplicate users
      if (prev.some((u) => u.id === user.id)) {
        return prev;
      }
      return [...prev, user];
    });
  }, []);

  const updateUser = useCallback((userId: string, updates: Partial<User>) => {
    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, ...updates } : u)),
    );
  }, []);

  const followUser = useCallback((userId: string, targetUserId: string) => {
    setUsers((prev) =>
      prev.map((u) => {
        if (u.id === userId && !u.following.includes(targetUserId)) {
          return { ...u, following: [...u.following, targetUserId] };
        }
        if (u.id === targetUserId && !u.followers.includes(userId)) {
          return { ...u, followers: [...u.followers, userId] };
        }
        return u;
      }),
    );
  }, []);

  const unfollowUser = useCallback((userId: string, targetUserId: string) => {
    setUsers((prev) =>
      prev.map((u) => {
        if (u.id === userId) {
          return {
            ...u,
            following: u.following.filter((id) => id !== targetUserId),
          };
        }
        if (u.id === targetUserId) {
          return { ...u, followers: u.followers.filter((id) => id !== userId) };
        }
        return u;
      }),
    );
  }, []);

  const isFollowing = useCallback(
    (userId: string, targetUserId: string) => {
      const user = users.find((u) => u.id === userId);
      return user?.following.includes(targetUserId) || false;
    },
    [users],
  );

  return (
    <UsersContext.Provider
      value={{
        users,
        getUserById,
        getUserByUsername,
        registerUser,
        updateUser,
        followUser,
        unfollowUser,
        isFollowing,
      }}
    >
      {children}
    </UsersContext.Provider>
  );
}

export function useUsers() {
  const context = useContext(UsersContext);
  if (context === undefined) {
    throw new Error("useUsers must be used within a UsersProvider");
  }
  return context;
}
