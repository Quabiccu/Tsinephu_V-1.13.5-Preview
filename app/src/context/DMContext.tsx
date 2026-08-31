import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from "react";
import type { Conversation, Message, User } from "@/types";
import { useAuth } from "./AuthContext";

interface DMContextType {
  conversations: Conversation[];
  registeredUsers: User[];
  typingUsers: Record<string, string[]>; // conversationId -> array of userIds typing
  getConversation: (userId: string) => Conversation | undefined;
  getOrCreateConversation: (userId: string) => Conversation;
  sendMessage: (
    conversationId: string,
    content: string,
    media?: string[],
  ) => void;
  editMessage: (
    conversationId: string,
    messageId: string,
    newContent: string,
  ) => void;
  deleteMessage: (conversationId: string, messageId: string) => void;
  addReaction: (
    conversationId: string,
    messageId: string,
    emoji: string,
  ) => void;
  removeReaction: (
    conversationId: string,
    messageId: string,
    emoji: string,
  ) => void;
  setTyping: (conversationId: string, isTyping: boolean) => void;
  markAsRead: (conversationId: string) => void;
  deleteConversation: (conversationId: string) => void;
  getUnreadCount: () => number;
  searchUsers: (query: string) => User[];
  registerUser: (user: User) => void;
  blockUser: (userId: string) => void;
  unblockUser: (userId: string) => void;
  isBlocked: (userId: string) => boolean;
}

const DMContext = createContext<DMContextType | undefined>(undefined);

// Demo users for messaging
const demoUsers: User[] = [
  {
    id: "user_1",
    username: "tsinephu_official",
    displayName: "Tsinephu Official",
    avatar:
      "https://api.dicebear.com/7.x/avataaars/svg?seed=tsinephu&backgroundColor=b6e3f4",
    bio: "Official Tsinephu account",
    joinedAt: new Date(),
    following: [],
    followers: [],
    isOnline: true,
  },
  {
    id: "user_2",
    username: "support_team",
    displayName: "Support Team",
    avatar:
      "https://api.dicebear.com/7.x/avataaars/svg?seed=support&backgroundColor=c0aede",
    bio: "Here to help!",
    joinedAt: new Date(),
    following: [],
    followers: [],
    isOnline: true,
  },
  {
    id: "user_3",
    username: "community_mod",
    displayName: "Community Mod",
    avatar:
      "https://api.dicebear.com/7.x/avataaars/svg?seed=mod&backgroundColor=ffdfbf",
    bio: "Keeping Tsinephu safe",
    joinedAt: new Date(),
    following: [],
    followers: [],
    isOnline: false,
    lastSeen: new Date(Date.now() - 3600000),
  },
];

// Common emoji reactions
export const REACTION_EMOJIS = ["❤️", "👍", "👎", "😂", "😮", "😢", "🎉", "🔥"];

export function DMProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>(() => {
    const saved = localStorage.getItem("tsinephu-conversations");
    if (saved) {
      const parsed = JSON.parse(saved);
      return parsed.map((c: Conversation) => ({
        ...c,
        lastMessageAt: new Date(c.lastMessageAt),
        messages: c.messages.map((m: Message) => ({
          ...m,
          createdAt: new Date(m.createdAt),
          editedAt: m.editedAt ? new Date(m.editedAt) : undefined,
        })),
      }));
    }
    return [];
  });

  const [registeredUsers, setRegisteredUsers] = useState<User[]>(() => {
    const saved = localStorage.getItem("tsinephu-registered-users");
    if (saved) {
      const parsed = JSON.parse(saved);
      return parsed.map((u: User) => ({
        ...u,
        joinedAt: new Date(u.joinedAt),
        lastSeen: u.lastSeen ? new Date(u.lastSeen) : undefined,
      }));
    }
    return demoUsers;
  });

  const [blockedUsers, setBlockedUsers] = useState<string[]>(() => {
    const saved = localStorage.getItem("tsinephu-blocked-users");
    return saved ? JSON.parse(saved) : [];
  });

  // Typing indicators
  const [typingUsers, setTypingUsers] = useState<Record<string, string[]>>({});
  const typingTimeoutsRef = useRef<
    Record<string, ReturnType<typeof setTimeout>>
  >({});

  useEffect(() => {
    localStorage.setItem(
      "tsinephu-conversations",
      JSON.stringify(conversations),
    );
  }, [conversations]);

  useEffect(() => {
    localStorage.setItem(
      "tsinephu-registered-users",
      JSON.stringify(registeredUsers),
    );
  }, [registeredUsers]);

  useEffect(() => {
    localStorage.setItem(
      "tsinephu-blocked-users",
      JSON.stringify(blockedUsers),
    );
  }, [blockedUsers]);

  // Register current user when they log in
  useEffect(() => {
    if (user) {
      setRegisteredUsers((prev) => {
        const exists = prev.find((u) => u.id === user.id);
        if (!exists) {
          return [...prev, user];
        }
        // Update user info if changed
        return prev.map((u) =>
          u.id === user.id ? { ...user, isOnline: true } : u,
        );
      });
    }
  }, [user]);

  const getConversation = useCallback(
    (userId: string) => {
      if (!user) return undefined;
      return conversations.find(
        (c) =>
          c.participants.includes(user.id) && c.participants.includes(userId),
      );
    },
    [conversations, user],
  );

  const getOrCreateConversation = useCallback(
    (userId: string): Conversation => {
      if (!user) throw new Error("User not authenticated");

      const existing = conversations.find(
        (c) =>
          c.participants.includes(user.id) && c.participants.includes(userId),
      );

      if (existing) return existing;

      const newConversation: Conversation = {
        id: `conv_${Date.now()}`,
        participants: [user.id, userId],
        messages: [],
        lastMessageAt: new Date(),
        unreadCount: 0,
      };

      setConversations((prev) => [newConversation, ...prev]);
      return newConversation;
    },
    [conversations, user],
  );

  const sendMessage = useCallback(
    (conversationId: string, content: string, media?: string[]) => {
      if (!user) return;

      const newMessage: Message = {
        id: `msg_${Date.now()}`,
        senderId: user.id,
        content,
        media,
        createdAt: new Date(),
        isRead: false,
        reactions: {},
      };

      setConversations((prev) =>
        prev.map((c) => {
          if (c.id === conversationId) {
            return {
              ...c,
              messages: [...c.messages, newMessage],
              lastMessageAt: new Date(),
            };
          }
          return c;
        }),
      );
    },
    [user],
  );

  const editMessage = useCallback(
    (conversationId: string, messageId: string, newContent: string) => {
      if (!user) return;

      setConversations((prev) =>
        prev.map((c) => {
          if (c.id === conversationId) {
            return {
              ...c,
              messages: c.messages.map((m) =>
                m.id === messageId && m.senderId === user.id
                  ? { ...m, content: newContent, editedAt: new Date() }
                  : m,
              ),
            };
          }
          return c;
        }),
      );
    },
    [user],
  );

  const deleteMessage = useCallback(
    (conversationId: string, messageId: string) => {
      if (!user) return;

      setConversations((prev) =>
        prev.map((c) => {
          if (c.id === conversationId) {
            return {
              ...c,
              messages: c.messages.map((m) =>
                m.id === messageId && m.senderId === user.id
                  ? { ...m, isDeleted: true, content: "" }
                  : m,
              ),
            };
          }
          return c;
        }),
      );
    },
    [user],
  );

  const addReaction = useCallback(
    (conversationId: string, messageId: string, emoji: string) => {
      if (!user) return;

      setConversations((prev) =>
        prev.map((c) => {
          if (c.id === conversationId) {
            return {
              ...c,
              messages: c.messages.map((m) => {
                if (m.id === messageId) {
                  const reactions = { ...m.reactions };
                  if (!reactions[emoji]) {
                    reactions[emoji] = [];
                  }
                  if (!reactions[emoji].includes(user.id)) {
                    reactions[emoji] = [...reactions[emoji], user.id];
                  }
                  return { ...m, reactions };
                }
                return m;
              }),
            };
          }
          return c;
        }),
      );
    },
    [user],
  );

  const removeReaction = useCallback(
    (conversationId: string, messageId: string, emoji: string) => {
      if (!user) return;

      setConversations((prev) =>
        prev.map((c) => {
          if (c.id === conversationId) {
            return {
              ...c,
              messages: c.messages.map((m) => {
                if (m.id === messageId && m.reactions?.[emoji]) {
                  const reactions = { ...m.reactions };
                  reactions[emoji] = reactions[emoji].filter(
                    (id) => id !== user.id,
                  );
                  if (reactions[emoji].length === 0) {
                    delete reactions[emoji];
                  }
                  return { ...m, reactions };
                }
                return m;
              }),
            };
          }
          return c;
        }),
      );
    },
    [user],
  );

  const setTyping = useCallback(
    (conversationId: string, isTyping: boolean) => {
      if (!user) return;

      // Clear existing timeout for this conversation
      if (typingTimeoutsRef.current[conversationId]) {
        clearTimeout(typingTimeoutsRef.current[conversationId]);
      }

      setTypingUsers((prev) => {
        const currentTyping = prev[conversationId] || [];
        if (isTyping) {
          if (!currentTyping.includes(user.id)) {
            return { ...prev, [conversationId]: [...currentTyping, user.id] };
          }
        } else {
          return {
            ...prev,
            [conversationId]: currentTyping.filter((id) => id !== user.id),
          };
        }
        return prev;
      });

      // Auto-clear typing status after 3 seconds
      if (isTyping) {
        typingTimeoutsRef.current[conversationId] = setTimeout(() => {
          setTypingUsers((prev) => ({
            ...prev,
            [conversationId]: (prev[conversationId] || []).filter(
              (id) => id !== user.id,
            ),
          }));
        }, 3000);
      }
    },
    [user],
  );

  const markAsRead = useCallback(
    (conversationId: string) => {
      if (!user) return;

      setConversations((prev) =>
        prev.map((c) => {
          if (c.id === conversationId) {
            return {
              ...c,
              unreadCount: 0,
              messages: c.messages.map((m) =>
                m.senderId !== user.id ? { ...m, isRead: true } : m,
              ),
            };
          }
          return c;
        }),
      );
    },
    [user],
  );

  const deleteConversation = useCallback((conversationId: string) => {
    setConversations((prev) => prev.filter((c) => c.id !== conversationId));
  }, []);

  const getUnreadCount = useCallback(() => {
    if (!user) return 0;
    return conversations.reduce((total, c) => {
      const unreadInConv = c.messages.filter(
        (m) => m.senderId !== user.id && !m.isRead,
      ).length;
      return total + unreadInConv;
    }, 0);
  }, [conversations, user]);

  const searchUsers = useCallback(
    (query: string): User[] => {
      if (!query.trim()) return [];
      const lowerQuery = query.toLowerCase();
      return registeredUsers.filter(
        (u) =>
          u.id !== user?.id &&
          !blockedUsers.includes(u.id) &&
          (u.displayName.toLowerCase().includes(lowerQuery) ||
            u.username.toLowerCase().includes(lowerQuery)),
      );
    },
    [registeredUsers, user, blockedUsers],
  );

  const registerUser = useCallback((newUser: User) => {
    setRegisteredUsers((prev) => {
      const exists = prev.find((u) => u.id === newUser.id);
      if (!exists) {
        return [...prev, newUser];
      }
      return prev;
    });
  }, []);

  const blockUser = useCallback(
    (userId: string) => {
      if (!blockedUsers.includes(userId)) {
        setBlockedUsers((prev) => [...prev, userId]);
      }
    },
    [blockedUsers],
  );

  const unblockUser = useCallback((userId: string) => {
    setBlockedUsers((prev) => prev.filter((id) => id !== userId));
  }, []);

  const isBlocked = useCallback(
    (userId: string) => {
      return blockedUsers.includes(userId);
    },
    [blockedUsers],
  );

  return (
    <DMContext.Provider
      value={{
        conversations,
        registeredUsers,
        typingUsers,
        getConversation,
        getOrCreateConversation,
        sendMessage,
        editMessage,
        deleteMessage,
        addReaction,
        removeReaction,
        setTyping,
        markAsRead,
        deleteConversation,
        getUnreadCount,
        searchUsers,
        registerUser,
        blockUser,
        unblockUser,
        isBlocked,
      }}
    >
      {children}
    </DMContext.Provider>
  );
}

export function useDM() {
  const context = useContext(DMContext);
  if (context === undefined) {
    throw new Error("useDM must be used within a DMProvider");
  }
  return context;
}
