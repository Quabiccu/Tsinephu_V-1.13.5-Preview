import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { useAuth } from "./AuthContext";
import { useUsers } from "./UsersContext";
import { sanitizeInput } from "./AuthContext";

import type {
  Parnik,
  Reply,
  User,
  Poll,
  MapData,
  Ban,
  Report,
  CodeData,
} from "@/types";

// Admin user
const ADMIN_USERNAME = "anatolcyman_";

// Shared storage keys
const GLOBAL_PARNIKS_KEY = "tsinephu-parniks-global";
const BANS_STORAGE_KEY = "tsinephu-bans";
const REPORTS_STORAGE_KEY = "tsinephu-reports";

interface ParnikContextType {
  parniks: Parnik[];
  createParnik: (
    content: string,
    media?: string[],
    poll?: Poll,
    mapData?: MapData,
  ) => void;
  editParnik: (
    parnikId: string,
    content: string,
    media?: string[],
    mapData?: MapData,
    codeData?: CodeData,
  ) => void;
  deleteParnik: (parnikId: string) => void;
  likeParnik: (parnikId: string, userId: string) => void;
  unlikeParnik: (parnikId: string, userId: string) => void;
  reParnik: (parnikId: string, userId: string, user: User) => void;
  undoReParnik: (parnikId: string, userId: string) => void;
  addReply: (
    parnikId: string,
    content: string,
    userId: string,
    user: User,
  ) => void;
  votePoll: (parnikId: string, optionId: string, userId: string) => void;
  getUserParniks: (userId: string) => Parnik[];
  getUserLikedParniks: (userId: string) => Parnik[];
  getFeedParniks: () => Parnik[];
  getParnikById: (parnikId: string) => Parnik | undefined;
  // Translation
  translateParnik: (
    parnikId: string,
    targetLanguage: string,
  ) => Promise<string>;
  // Code Parniks
  createCodeParnik: (codeData: CodeData) => void;
  forkCodeParnik: (originalParnikId: string, userId: string) => void;
  // Admin
  isUserAdmin: (username: string) => boolean;
  banUser: (
    userId: string,
    bannedBy: string,
    reason: string,
    isPermanent?: boolean,
    expiresAt?: Date,
  ) => void;
  unbanUser: (userId: string) => void;
  reportParnik: (
    reporterId: string,
    reportedUserId: string,
    parnikId: string,
    reason: string,
  ) => void;
  isUserBanned: (userId: string) => boolean;
}

const ParnikContext = createContext<ParnikContextType | undefined>(undefined);

export function ParnikProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const { registerUser } = useUsers();

  // Global/shared parniks storage - all users can see all parniks
  const [parniks, setParniks] = useState<Parnik[]>(() => {
    const saved = localStorage.getItem(GLOBAL_PARNIKS_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      return parsed.map((p: Parnik) => ({
        ...p,
        createdAt: new Date(p.createdAt),
        editedAt: p.editedAt ? new Date(p.editedAt) : undefined,
        poll: p.poll
          ? {
              ...p.poll,
              expiresAt: new Date(p.poll.expiresAt),
            }
          : undefined,
        replies:
          p.replies?.map((r: Reply) => ({
            ...r,
            createdAt: new Date(r.createdAt),
          })) || [],
      }));
    }
    return [];
  });

  // Bans state
  const [bans, setBans] = useState<Ban[]>(() => {
    const saved = localStorage.getItem(BANS_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      return parsed.map((b: Ban) => ({
        ...b,
        bannedAt: new Date(b.bannedAt),
        expiresAt: b.expiresAt ? new Date(b.expiresAt) : undefined,
      }));
    }
    return [];
  });

  // Reports state
  const [reports, setReports] = useState<Report[]>(() => {
    const saved = localStorage.getItem(REPORTS_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      return parsed.map((r: Report) => ({
        ...r,
        createdAt: new Date(r.createdAt),
      }));
    }
    return [];
  });

  // Save parniks to global storage
  useEffect(() => {
    localStorage.setItem(GLOBAL_PARNIKS_KEY, JSON.stringify(parniks));
  }, [parniks]);

  // Save bans to localStorage
  useEffect(() => {
    localStorage.setItem(BANS_STORAGE_KEY, JSON.stringify(bans));
  }, [bans]);

  // Save reports to localStorage
  useEffect(() => {
    localStorage.setItem(REPORTS_STORAGE_KEY, JSON.stringify(reports));
  }, [reports]);

  // Register current user in global users list
  useEffect(() => {
    if (user) {
      registerUser(user);
    }
  }, [user, registerUser]);

  // Check if user is admin
  const isUserAdmin = useCallback((username: string) => {
    return username === ADMIN_USERNAME;
  }, []);

  // Check if user is banned
  const isUserBanned = useCallback(
    (userId: string) => {
      const now = new Date();
      return bans.some((ban) => {
        if (ban.userId !== userId) return false;
        if (ban.isPermanent) return true;
        if (ban.expiresAt && new Date(ban.expiresAt) > now) return true;
        return false;
      });
    },
    [bans],
  );

  // Ban user
  const banUser = useCallback(
    (
      userId: string,
      bannedBy: string,
      reason: string,
      isPermanent = false,
      expiresAt?: Date,
    ) => {
      const newBan: Ban = {
        id: `ban_${Date.now()}`,
        userId,
        bannedBy,
        reason,
        bannedAt: new Date(),
        expiresAt,
        isPermanent,
      };
      setBans((prev) => [...prev, newBan]);
    },
    [],
  );

  // Unban user
  const unbanUser = useCallback((userId: string) => {
    setBans((prev) => prev.filter((b) => b.userId !== userId));
  }, []);

  // Report parnik
  const reportParnik = useCallback(
    (
      reporterId: string,
      reportedUserId: string,
      parnikId: string,
      reason: string,
    ) => {
      const sanitizedReason = sanitizeInput(reason);
      if (!sanitizedReason) return;

      const newReport: Report = {
        id: `report_${Date.now()}`,
        reporterId,
        reportedUserId,
        parnikId,
        reason: sanitizedReason,
        createdAt: new Date(),
        status: "pending",
      };
      setReports((prev) => [...prev, newReport]);
    },
    [],
  );

  const createParnik = useCallback(
    (content: string, media?: string[], poll?: Poll, mapData?: MapData) => {
      if (!user) return;

      const sanitizedContent = sanitizeInput(content);
      if (!sanitizedContent) return;

      const newParnik: Parnik = {
        id: `parnik_${Date.now()}`,
        authorId: user.id,
        content: sanitizedContent,
        media,
        poll,
        mapData,
        createdAt: new Date(),
        likes: [],
        replies: [],
        reparniks: [],
        originalLanguage: "en",
      };
      setParniks((prev) => [newParnik, ...prev]);
    },
    [user],
  );

  // Edit Parnik
  const createCodeParnik = useCallback(
    (codeData: CodeData) => {
      if (!user) return;

      const sanitizedTitle = sanitizeInput(codeData.title);
      const newParnik: Parnik = {
        id: `parnik_${Date.now()}`,
        authorId: user.id,
        content: `Code: ${sanitizedTitle || "Untitled"}`,
        codeData: {
          ...codeData,
          title: sanitizedTitle || "Untitled",
        },
        createdAt: new Date(),
        likes: [],
        replies: [],
        reparniks: [],
        originalLanguage: "en",
      };
      setParniks((prev) => [newParnik, ...prev]);
    },
    [user],
  );

  const forkCodeParnik = useCallback(
    (originalParnikId: string, userId: string) => {
      const originalParnik = parniks.find((p) => p.id === originalParnikId);
      if (!originalParnik || !originalParnik.codeData) return;

      // Increment fork count on original
      setParniks((prev) =>
        prev.map((p) => {
          if (p.id === originalParnikId) {
            return {
              ...p,
              codeData: p.codeData
                ? {
                    ...p.codeData,
                    forkCount: p.codeData.forkCount + 1,
                  }
                : undefined,
            };
          }
          return p;
        }),
      );

      // Create forked copy
      const forkedParnik: Parnik = {
        id: `parnik_${Date.now()}`,
        authorId: userId,
        content: `Code: ${sanitizeInput(originalParnik.codeData.title) || "Untitled"} (fork)`,
        codeData: {
          ...originalParnik.codeData,
          title: sanitizeInput(originalParnik.codeData.title) || "Untitled",
          forkedFrom: originalParnikId,
          forkCount: 0,
        },
        createdAt: new Date(),
        likes: [],
        replies: [],
        reparniks: [],
        originalLanguage: "en",
      };
      setParniks((prev) => [forkedParnik, ...prev]);
    },
    [parniks],
  );

  const editParnik = useCallback(
    (
      parnikId: string,
      content: string,
      media?: string[],
      mapData?: MapData,
      codeData?: CodeData,
    ) => {
      if (!user) return;

      const sanitizedContent = sanitizeInput(content);
      if (!sanitizedContent && !codeData) return;

      setParniks((prev) =>
        prev.map((p) => {
          if (p.id === parnikId && p.authorId === user.id) {
            const updated: Parnik = {
              ...p,
              content: sanitizedContent || p.content,
              media,
              mapData,
              editedAt: new Date(),
            };
            if (codeData) {
              updated.codeData = {
                ...codeData,
                title: sanitizeInput(codeData.title),
              };
            }
            return updated;
          }
          return p;
        }),
      );
    },
    [user],
  );

  // Translate Parnik (mock translation)
  const translateParnik = useCallback(
    async (parnikId: string, targetLanguage: string): Promise<string> => {
      const parnik = parniks.find((p) => p.id === parnikId);
      if (!parnik) return "";

      if (parnik.translations?.[targetLanguage]) {
        return parnik.translations[targetLanguage];
      }

      const translatedContent = `[Translated to ${targetLanguage}] ${parnik.content}`;

      setParniks((prev) =>
        prev.map((p) => {
          if (p.id === parnikId) {
            return {
              ...p,
              translations: {
                ...p.translations,
                [targetLanguage]: translatedContent,
              },
            };
          }
          return p;
        }),
      );

      return translatedContent;
    },
    [parniks],
  );

  const deleteParnik = useCallback((parnikId: string) => {
    setParniks((prev) => prev.filter((p) => p.id !== parnikId));
  }, []);

  const likeParnik = useCallback((parnikId: string, userId: string) => {
    setParniks((prev) =>
      prev.map((p) => {
        if (p.id === parnikId) {
          return { ...p, likes: [...p.likes, userId] };
        }
        return p;
      }),
    );
  }, []);

  const unlikeParnik = useCallback((parnikId: string, userId: string) => {
    setParniks((prev) =>
      prev.map((p) => {
        if (p.id === parnikId) {
          return { ...p, likes: p.likes.filter((id) => id !== userId) };
        }
        return p;
      }),
    );
  }, []);

  const reParnik = useCallback(
    (parnikId: string, userId: string) => {
      const originalParnik = parniks.find((p) => p.id === parnikId);
      if (!originalParnik) return;

      setParniks((prev) =>
        prev.map((p) => {
          if (p.id === parnikId) {
            return { ...p, reparniks: [...p.reparniks, userId] };
          }
          return p;
        }),
      );

      const reParnikEntry: Parnik = {
        id: `reparnik_${Date.now()}`,
        authorId: userId,
        content: "",
        createdAt: new Date(),
        likes: [],
        replies: [],
        reparniks: [],
        isReParnik: true,
        originalParnikId: parnikId,
      };

      setParniks((prev) => [reParnikEntry, ...prev]);
    },
    [parniks],
  );

  const undoReParnik = useCallback((parnikId: string, userId: string) => {
    setParniks((prev) =>
      prev.map((p) => {
        if (p.id === parnikId) {
          return { ...p, reparniks: p.reparniks.filter((id) => id !== userId) };
        }
        return p;
      }),
    );

    setParniks((prev) =>
      prev.filter(
        (p) =>
          !(
            p.isReParnik &&
            p.originalParnikId === parnikId &&
            p.authorId === userId
          ),
      ),
    );
  }, []);

  const addReply = useCallback(
    (parnikId: string, content: string, userId: string) => {
      const sanitizedContent = sanitizeInput(content);
      if (!sanitizedContent) return;

      const newReply: Reply = {
        id: `reply_${Date.now()}`,
        authorId: userId,
        content: sanitizedContent,
        createdAt: new Date(),
        likes: [],
      };

      setParniks((prev) =>
        prev.map((p) => {
          if (p.id === parnikId) {
            return { ...p, replies: [...p.replies, newReply] };
          }
          return p;
        }),
      );
    },
    [],
  );

  const votePoll = useCallback(
    (parnikId: string, optionId: string, userId: string) => {
      setParniks((prev) =>
        prev.map((p) => {
          if (p.id === parnikId && p.poll) {
            const updatedOptions = p.poll.options.map((opt) => ({
              ...opt,
              votes: opt.votes.filter((v) => v !== userId),
            }));

            const finalOptions = updatedOptions.map((opt) =>
              opt.id === optionId
                ? { ...opt, votes: [...opt.votes, userId] }
                : opt,
            );

            return {
              ...p,
              poll: {
                ...p.poll,
                options: finalOptions,
                totalVotes: finalOptions.reduce(
                  (sum, opt) => sum + opt.votes.length,
                  0,
                ),
              },
            };
          }
          return p;
        }),
      );
    },
    [],
  );

  const getUserParniks = useCallback(
    (userId: string) => {
      return parniks.filter((p) => p.authorId === userId && !p.isReParnik);
    },
    [parniks],
  );

  const getUserLikedParniks = useCallback(
    (userId: string) => {
      return parniks.filter((p) => p.likes.includes(userId));
    },
    [parniks],
  );

  const getFeedParniks = useCallback(() => {
    return [...parniks].sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  }, [parniks]);

  const getParnikById = useCallback(
    (parnikId: string) => {
      return parniks.find((p) => p.id === parnikId);
    },
    [parniks],
  );

  return (
    <ParnikContext.Provider
      value={{
        parniks,
        createParnik,
        editParnik,
        deleteParnik,
        likeParnik,
        unlikeParnik,
        reParnik,
        undoReParnik,
        addReply,
        votePoll,
        getUserParniks,
        getUserLikedParniks,
        getFeedParniks,
        getParnikById,
        translateParnik,
        createCodeParnik,
        forkCodeParnik,
        isUserAdmin,
        banUser,
        unbanUser,
        reportParnik,
        isUserBanned,
      }}
    >
      {children}
    </ParnikContext.Provider>
  );
}

export function useParniks() {
  const context = useContext(ParnikContext);
  if (context === undefined) {
    throw new Error("useParniks must be used within a ParnikProvider");
  }
  return context;
}
