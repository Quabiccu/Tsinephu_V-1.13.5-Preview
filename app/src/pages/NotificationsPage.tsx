import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useParniks } from "@/context/ParnikContext";
import { useUsers } from "@/context/UsersContext";
import { useLanguage } from "@/context/LanguageContext";
import { Button } from "@/components/ui/button";
import {
  Heart,
  MessageCircle,
  Repeat2,
  UserPlus,
  Bell,
  Check,
} from "lucide-react";
import { formatDistanceToNow } from "@/lib/utils";

interface NotificationsPageProps {
  onViewProfile?: (userId: string) => void;
}

type NotificationType = "like" | "reply" | "reparnik" | "follow";

interface Notification {
  id: string;
  type: NotificationType;
  userId: string;
  parnikId?: string;
  content?: string;
  createdAt: Date;
  isRead: boolean;
}

export function NotificationsPage({ onViewProfile }: NotificationsPageProps) {
  const { user } = useAuth();
  const { parniks } = useParniks();
  const { getUserById } = useUsers();
  const { t } = useLanguage();

  const [activeTab, setActiveTab] = useState<"all" | "mentions">("all");
  const [notifications, setNotifications] = useState<Notification[]>(() => {
    // Generate notifications from parniks data
    const notifs: Notification[] = [];

    if (user) {
      parniks.forEach((parnik) => {
        // Likes on user's parniks
        if (parnik.authorId === user.id) {
          parnik.likes.forEach((likerId) => {
            if (likerId !== user.id) {
              notifs.push({
                id: `like_${parnik.id}_${likerId}`,
                type: "like",
                userId: likerId,
                parnikId: parnik.id,
                content:
                  parnik.content.slice(0, 50) +
                  (parnik.content.length > 50 ? "..." : ""),
                createdAt: parnik.createdAt,
                isRead: false,
              });
            }
          });

          // ReParniks
          parnik.reparniks.forEach((reParnikerId) => {
            if (reParnikerId !== user.id) {
              notifs.push({
                id: `reparnik_${parnik.id}_${reParnikerId}`,
                type: "reparnik",
                userId: reParnikerId,
                parnikId: parnik.id,
                content:
                  parnik.content.slice(0, 50) +
                  (parnik.content.length > 50 ? "..." : ""),
                createdAt: parnik.createdAt,
                isRead: false,
              });
            }
          });

          // Replies
          parnik.replies.forEach((reply) => {
            if (reply.authorId !== user.id) {
              notifs.push({
                id: `reply_${reply.id}`,
                type: "reply",
                userId: reply.authorId,
                parnikId: parnik.id,
                content:
                  reply.content.slice(0, 50) +
                  (reply.content.length > 50 ? "..." : ""),
                createdAt: reply.createdAt,
                isRead: false,
              });
            }
          });
        }
      });
    }

    // Sort by date, newest first
    return notifs.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  });

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  const getNotificationIcon = (type: NotificationType) => {
    switch (type) {
      case "like":
        return <Heart className="h-5 w-5 text-red-500" />;
      case "reply":
        return <MessageCircle className="h-5 w-5 text-blue-500" />;
      case "reparnik":
        return <Repeat2 className="h-5 w-5 text-green-500" />;
      case "follow":
        return <UserPlus className="h-5 w-5 text-primary" />;
      default:
        return <Bell className="h-5 w-5" />;
    }
  };

  const getNotificationText = (notification: Notification) => {
    const actor = getUserById(notification.userId);
    if (!actor) return null;

    switch (notification.type) {
      case "like":
        return (
          <>
            <button
              onClick={() => onViewProfile?.(actor.id)}
              className="font-semibold hover:underline"
            >
              {actor.displayName}
            </button>{" "}
            {t("likedYourParnik")}
          </>
        );
      case "reply":
        return (
          <>
            <button
              onClick={() => onViewProfile?.(actor.id)}
              className="font-semibold hover:underline"
            >
              {actor.displayName}
            </button>{" "}
            {t("repliedToYourParnik")}
          </>
        );
      case "reparnik":
        return (
          <>
            <button
              onClick={() => onViewProfile?.(actor.id)}
              className="font-semibold hover:underline"
            >
              {actor.displayName}
            </button>{" "}
            {t("reparnikedYourParnik")}
          </>
        );
      case "follow":
        return (
          <>
            <button
              onClick={() => onViewProfile?.(actor.id)}
              className="font-semibold hover:underline"
            >
              {actor.displayName}
            </button>{" "}
            {t("startedFollowingYou")}
          </>
        );
      default:
        return null;
    }
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="sticky top-0 bg-background/95 backdrop-blur-md border-b border-border z-10">
        <div className="flex items-center justify-between px-4 py-4">
          <h1 className="text-xl font-bold">{t("notifications")}</h1>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" onClick={markAllAsRead}>
              <Check className="h-4 w-4 mr-2" />
              {t("markAllRead")}
            </Button>
          )}
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border">
          <button
            onClick={() => setActiveTab("all")}
            className={`flex-1 py-3 font-medium transition-colors relative ${
              activeTab === "all"
                ? "border-b-2 border-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t("all")}
            {unreadCount > 0 && activeTab !== "all" && (
              <span className="ml-2 px-2 py-0.5 bg-[#DC143C] text-white text-xs rounded-full">
                {unreadCount}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab("mentions")}
            className={`flex-1 py-3 font-medium transition-colors ${
              activeTab === "mentions"
                ? "border-b-2 border-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t("mentions")}
          </button>
        </div>
      </div>

      {/* Notifications List */}
      <div className="divide-y divide-border">
        {notifications.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#DC143C]/20 to-yellow-400/20 flex items-center justify-center mx-auto mb-4">
              <Bell className="h-10 w-10" />
            </div>
            <p className="text-lg font-medium">{t("noNotificationsYet")}</p>
            <p className="text-sm mt-1">{t("whenSomeoneInteracts")}</p>
          </div>
        ) : (
          notifications.map((notification) => {
            const actor = getUserById(notification.userId);
            if (!actor) return null;

            return (
              <div
                key={notification.id}
                className={`flex items-start gap-3 p-4 hover:bg-muted/50 transition-colors ${
                  !notification.isRead
                    ? "bg-blue-50/50 dark:bg-blue-950/20"
                    : ""
                }`}
              >
                {/* Icon */}
                <div className="mt-1">
                  {getNotificationIcon(notification.type)}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start gap-3">
                    <button onClick={() => onViewProfile?.(actor.id)}>
                      <img
                        src={actor.avatar}
                        alt={actor.displayName}
                        className="h-10 w-10 rounded-full object-cover"
                      />
                    </button>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm">
                        {getNotificationText(notification)}
                      </p>
                      {notification.content && (
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-1">
                          &ldquo;{notification.content}&rdquo;
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatDistanceToNow(notification.createdAt)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Unread indicator */}
                {!notification.isRead && (
                  <span className="w-2.5 h-2.5 bg-[#DC143C] rounded-full flex-shrink-0 mt-2" />
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
