import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { useAuth } from "./AuthContext";

export interface Notification {
  id: string;
  userId: string;
  type: "like" | "reply" | "reparnik" | "follow" | "mention" | "report";
  title: string;
  message: string;
  relatedUserId?: string;
  relatedParnikId?: string;
  isRead: boolean;
  createdAt: Date;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  addNotification: (
    notification: Omit<Notification, "id" | "createdAt" | "isRead">,
  ) => void;
  markAsRead: (notificationId: string) => void;
  markAllAsRead: () => void;
  clearNotifications: () => void;
}

const NOTIFICATIONS_STORAGE_KEY = "tsinephu-notifications";

const NotificationContext = createContext<NotificationContextType | undefined>(
  undefined,
);

export function NotificationProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = useAuth();

  const [notifications, setNotifications] = useState<Notification[]>(() => {
    if (!user) return [];
    const saved = localStorage.getItem(
      `${NOTIFICATIONS_STORAGE_KEY}-${user.id}`,
    );
    if (saved) {
      const parsed = JSON.parse(saved);
      return parsed.map((n: Notification) => ({
        ...n,
        createdAt: new Date(n.createdAt),
      }));
    }
    return [];
  });

  // Save notifications when they change
  useEffect(() => {
    if (user) {
      localStorage.setItem(
        `${NOTIFICATIONS_STORAGE_KEY}-${user.id}`,
        JSON.stringify(notifications),
      );
    }
  }, [notifications, user]);

  // Load notifications when user changes
  useEffect(() => {
    if (user) {
      const saved = localStorage.getItem(
        `${NOTIFICATIONS_STORAGE_KEY}-${user.id}`,
      );
      if (saved) {
        const parsed = JSON.parse(saved);
        setNotifications(
          parsed.map((n: Notification) => ({
            ...n,
            createdAt: new Date(n.createdAt),
          })),
        );
      } else {
        setNotifications([]);
      }
    } else {
      setNotifications([]);
    }
  }, [user?.id]);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const addNotification = useCallback(
    (notification: Omit<Notification, "id" | "createdAt" | "isRead">) => {
      const newNotification: Notification = {
        ...notification,
        id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        createdAt: new Date(),
        isRead: false,
      };
      setNotifications((prev) => [newNotification, ...prev]);
    },
    [],
  );

  const markAsRead = useCallback((notificationId: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === notificationId ? { ...n, isRead: true } : n)),
    );
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  }, []);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        addNotification,
        markAsRead,
        markAllAsRead,
        clearNotifications,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error(
      "useNotifications must be used within a NotificationProvider",
    );
  }
  return context;
}
