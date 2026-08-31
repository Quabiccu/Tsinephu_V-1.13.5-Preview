import { useState, useRef, useEffect, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { useDM, REACTION_EMOJIS } from "@/context/DMContext";
import { useLanguage } from "@/context/LanguageContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Search,
  Send,
  MoreVertical,
  ArrowLeft,
  UserPlus,
  Users,
  Image,
  X,
  Edit2,
  Trash2,
  Smile,
  Ban,
  Check,
  CheckCheck,
} from "lucide-react";
import { formatDistanceToNow } from "@/lib/utils";
import type { Conversation, Message, User } from "@/types";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface MessagesPageProps {
  onViewProfile?: (userId: string) => void;
}

export function MessagesPage({ onViewProfile }: MessagesPageProps) {
  const { user } = useAuth();
  const {
    conversations,
    registeredUsers,
    typingUsers,
    getOrCreateConversation,
    sendMessage,
    editMessage,
    deleteMessage,
    addReaction,
    removeReaction,
    setTyping,
    markAsRead,
    searchUsers,
    blockUser,
    isBlocked,
  } = useDM();
  const { t } = useLanguage();
  const [selectedConversation, setSelectedConversation] =
    useState<Conversation | null>(null);
  const [messageText, setMessageText] = useState("");
  const [media, setMedia] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showNewMessage, setShowNewMessage] = useState(false);
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Message editing
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);

  // Reaction picker
  const [reactionMessageId, setReactionMessageId] = useState<string | null>(
    null,
  );

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [selectedConversation?.messages]);

  // Mark as read when selecting conversation
  useEffect(() => {
    if (selectedConversation) {
      markAsRead(selectedConversation.id);
    }
  }, [selectedConversation, markAsRead]);

  // Handle typing indicator
  const handleTyping = useCallback(() => {
    if (!selectedConversation) return;

    setTyping(selectedConversation.id, true);

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout to stop typing
    typingTimeoutRef.current = setTimeout(() => {
      setTyping(selectedConversation.id, false);
    }, 1000);
  }, [selectedConversation, setTyping]);

  const handleSendMessage = () => {
    if ((!messageText.trim() && media.length === 0) || !selectedConversation)
      return;

    if (editingMessageId) {
      editMessage(
        selectedConversation.id,
        editingMessageId,
        messageText.trim(),
      );
      setEditingMessageId(null);
    } else {
      sendMessage(
        selectedConversation.id,
        messageText.trim(),
        media.length > 0 ? media : undefined,
      );
    }

    setMessageText("");
    setMedia([]);
    setTyping(selectedConversation.id, false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach((file) => {
      if (!file.type.startsWith("image/")) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setMedia((prev) =>
            [...prev, event.target!.result as string].slice(0, 4),
          );
        }
      };
      reader.readAsDataURL(file);
    });

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const removeImage = (index: number) => {
    setMedia((prev) => prev.filter((_, i) => i !== index));
  };

  const startConversationWithUser = (userId: string) => {
    const conv = getOrCreateConversation(userId);
    setSelectedConversation(conv);
    setShowNewMessage(false);
  };

  const getOtherParticipant = (conv: Conversation): User | undefined => {
    const otherId = conv.participants.find((id) => id !== user?.id);
    return registeredUsers.find((u) => u.id === otherId);
  };

  const startEditingMessage = (message: Message) => {
    setEditingMessageId(message.id);
    setMessageText(message.content);
  };

  const cancelEditing = () => {
    setEditingMessageId(null);
    setMessageText("");
  };

  const handleReaction = (messageId: string, emoji: string) => {
    if (!selectedConversation) return;

    const message = selectedConversation.messages.find(
      (m) => m.id === messageId,
    );
    if (message?.reactions?.[emoji]?.includes(user?.id || "")) {
      removeReaction(selectedConversation.id, messageId, emoji);
    } else {
      addReaction(selectedConversation.id, messageId, emoji);
    }
    setReactionMessageId(null);
  };

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.trim()) {
        setIsSearching(true);
        const results = searchUsers(searchQuery);
        setSearchResults(results);
        setIsSearching(false);
      } else {
        setSearchResults([]);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, searchUsers]);

  // Show all registered users when no search query
  const displayedUsers = searchQuery.trim()
    ? searchResults
    : registeredUsers.filter((u) => u.id !== user?.id && !isBlocked(u.id));

  const sortedConversations = [...conversations].sort(
    (a, b) =>
      new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime(),
  );

  // Check if other user is typing
  const isOtherUserTyping = (conv: Conversation) => {
    const otherId = conv.participants.find((id) => id !== user?.id);
    return typingUsers[conv.id]?.includes(otherId || "");
  };

  if (showNewMessage) {
    return (
      <div className="min-h-screen flex flex-col">
        {/* Header */}
        <div className="sticky top-0 bg-background/95 backdrop-blur-md border-b border-border z-10">
          <div className="flex items-center gap-4 px-4 py-3">
            <button
              onClick={() => setShowNewMessage(false)}
              className="p-2 hover:bg-muted rounded-full transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <h1 className="text-xl font-bold">{t("newMessage")}</h1>
          </div>
          <div className="px-4 pb-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t("searchMessages")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 rounded-full bg-muted border-0"
                autoFocus
              />
            </div>
          </div>
        </div>

        {/* Search Results / User List */}
        <div className="flex-1 overflow-y-auto">
          {/* Suggested Users Section */}
          {!searchQuery.trim() && (
            <div className="p-4 border-b border-border">
              <p className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                <Users className="h-4 w-4" />
                {t("whoToFollow")}
              </p>
            </div>
          )}

          {isSearching ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : displayedUsers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>{searchQuery.trim() ? t("noUsersFound") : t("noMessages")}</p>
            </div>
          ) : (
            displayedUsers.map((foundUser) => (
              <button
                key={foundUser.id}
                onClick={() => startConversationWithUser(foundUser.id)}
                className="w-full flex items-center gap-3 p-4 hover:bg-muted/50 transition-colors border-b border-border"
              >
                <div className="relative">
                  <img
                    src={foundUser.avatar}
                    alt={foundUser.displayName}
                    className="h-12 w-12 rounded-full object-cover"
                  />
                  {foundUser.isOnline && (
                    <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-background" />
                  )}
                </div>
                <div className="flex-1 text-left">
                  <p className="font-semibold">{foundUser.displayName}</p>
                  <p className="text-sm text-muted-foreground">
                    @{foundUser.username}
                  </p>
                  {foundUser.bio && (
                    <p className="text-xs text-muted-foreground truncate mt-0.5">
                      {foundUser.bio}
                    </p>
                  )}
                </div>
                <UserPlus className="h-5 w-5 text-muted-foreground" />
              </button>
            ))
          )}
        </div>
      </div>
    );
  }

  if (selectedConversation) {
    const otherUser = getOtherParticipant(selectedConversation);
    if (!otherUser) return null;

    const isBlockedUser = isBlocked(otherUser.id);

    return (
      <div className="min-h-screen flex flex-col">
        {/* Header */}
        <div className="sticky top-0 bg-background/95 backdrop-blur-md border-b border-border z-10">
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSelectedConversation(null)}
                className="p-2 hover:bg-muted rounded-full transition-colors lg:hidden"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <button
                onClick={() => onViewProfile?.(otherUser.id)}
                className="relative"
              >
                <img
                  src={otherUser.avatar}
                  alt={otherUser.displayName}
                  className="h-10 w-10 rounded-full object-cover"
                />
                {otherUser.isOnline && (
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-background" />
                )}
              </button>
              <button onClick={() => onViewProfile?.(otherUser.id)}>
                <p className="font-semibold text-left">
                  {otherUser.displayName}
                </p>
                <p className="text-xs text-muted-foreground text-left">
                  @{otherUser.username} ·{" "}
                  {otherUser.isOnline
                    ? t("online")
                    : otherUser.lastSeen
                      ? `${t("lastSeen")} ${formatDistanceToNow(otherUser.lastSeen)}`
                      : t("offline")}
                </p>
              </button>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="p-2 hover:bg-muted rounded-full transition-colors">
                  <MoreVertical className="h-5 w-5" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onViewProfile?.(otherUser.id)}>
                  <UserPlus className="h-4 w-4 mr-2" />
                  {t("viewProfile")}
                </DropdownMenuItem>
                {!isBlockedUser ? (
                  <DropdownMenuItem
                    onClick={() => blockUser(otherUser.id)}
                    className="text-destructive"
                  >
                    <Ban className="h-4 w-4 mr-2" />
                    {t("blockUser")}
                  </DropdownMenuItem>
                ) : (
                  <DropdownMenuItem onClick={() => blockUser(otherUser.id)}>
                    <Check className="h-4 w-4 mr-2" />
                    {t("unblockUser")}
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {selectedConversation.messages.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">👋</span>
              </div>
              <p className="font-medium">{t("startConversation")}</p>
              <p className="text-sm mt-1">
                {t("sendMessageTo").replace("{name}", otherUser.displayName)}
              </p>
            </div>
          ) : (
            selectedConversation.messages.map((message, index) => {
              const isOwn = message.senderId === user?.id;
              const showDate =
                index === 0 ||
                new Date(message.createdAt).toDateString() !==
                  new Date(
                    selectedConversation.messages[index - 1].createdAt,
                  ).toDateString();

              return (
                <div key={message.id}>
                  {showDate && (
                    <div className="flex justify-center my-4">
                      <span className="text-xs text-muted-foreground bg-muted px-3 py-1 rounded-full">
                        {new Date(message.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                  <div
                    className={`flex ${isOwn ? "justify-end" : "justify-start"} gap-2 group`}
                  >
                    {!isOwn && (
                      <img
                        src={otherUser.avatar}
                        alt={otherUser.displayName}
                        className="w-8 h-8 rounded-full object-cover flex-shrink-0 mt-1"
                      />
                    )}
                    <div className="relative max-w-[75%]">
                      <div
                        className={`${isOwn ? "bg-[#DC143C] text-white" : "bg-muted"} rounded-2xl px-4 py-2.5`}
                      >
                        {/* Media */}
                        {message.media && message.media.length > 0 && (
                          <div
                            className={`grid gap-1 mb-2 ${message.media.length > 1 ? "grid-cols-2" : "grid-cols-1"}`}
                          >
                            {message.media.map((img, i) => (
                              <img
                                key={i}
                                src={img}
                                alt={`${t("shared")} ${i + 1}`}
                                className={`rounded-lg object-cover ${message.media!.length === 1 ? "h-40" : "h-24"}`}
                              />
                            ))}
                          </div>
                        )}
                        {/* Text */}
                        {message.isDeleted ? (
                          <p className="text-sm italic opacity-60">
                            {t("messageDeleted")}
                          </p>
                        ) : (
                          <p className="text-sm">{message.content}</p>
                        )}
                        <p
                          className={`text-xs mt-1 ${isOwn ? "text-white/70" : "text-muted-foreground"} flex items-center gap-1`}
                        >
                          {new Date(message.createdAt).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                          {message.editedAt && <span>({t("edited")})</span>}
                          {isOwn && (
                            <span className="ml-1">
                              {message.isRead ? (
                                <CheckCheck className="h-3 w-3" />
                              ) : (
                                <Check className="h-3 w-3" />
                              )}
                            </span>
                          )}
                        </p>
                      </div>

                      {/* Reactions */}
                      {message.reactions &&
                        Object.keys(message.reactions).length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {Object.entries(message.reactions).map(
                              ([emoji, userIds]) => (
                                <button
                                  key={emoji}
                                  onClick={() =>
                                    handleReaction(message.id, emoji)
                                  }
                                  className={`text-xs px-2 py-0.5 rounded-full border transition-colors ${
                                    userIds.includes(user?.id || "")
                                      ? "bg-primary/20 border-primary"
                                      : "bg-background border-border hover:bg-muted"
                                  }`}
                                >
                                  {emoji} {userIds.length}
                                </button>
                              ),
                            )}
                          </div>
                        )}

                      {/* Message Actions */}
                      {!message.isDeleted && (
                        <div
                          className={`absolute top-0 ${isOwn ? "left-0 -translate-x-full" : "right-0 translate-x-full"} opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 px-1`}
                        >
                          <button
                            onClick={() =>
                              setReactionMessageId(
                                reactionMessageId === message.id
                                  ? null
                                  : message.id,
                              )
                            }
                            className="p-1.5 hover:bg-muted rounded-full"
                          >
                            <Smile className="h-4 w-4" />
                          </button>
                          {isOwn && (
                            <>
                              <button
                                onClick={() => startEditingMessage(message)}
                                className="p-1.5 hover:bg-muted rounded-full"
                              >
                                <Edit2 className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() =>
                                  deleteMessage(
                                    selectedConversation.id,
                                    message.id,
                                  )
                                }
                                className="p-1.5 hover:bg-destructive/10 hover:text-destructive rounded-full"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </>
                          )}
                        </div>
                      )}

                      {/* Reaction Picker */}
                      {reactionMessageId === message.id && (
                        <div className="absolute z-20 mt-1 p-2 bg-background border rounded-xl shadow-lg flex gap-1">
                          {REACTION_EMOJIS.map((emoji) => (
                            <button
                              key={emoji}
                              onClick={() => handleReaction(message.id, emoji)}
                              className="text-xl hover:scale-125 transition-transform"
                            >
                              {emoji}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}

          {/* Typing Indicator */}
          {isOtherUserTyping(selectedConversation) && (
            <div className="flex justify-start gap-2">
              <img
                src={otherUser.avatar}
                alt={otherUser.displayName}
                className="w-8 h-8 rounded-full object-cover flex-shrink-0 mt-1"
              />
              <div className="bg-muted rounded-2xl px-4 py-3">
                <div className="flex gap-1">
                  <span
                    className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"
                    style={{ animationDelay: "0ms" }}
                  />
                  <span
                    className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"
                    style={{ animationDelay: "150ms" }}
                  />
                  <span
                    className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"
                    style={{ animationDelay: "300ms" }}
                  />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Blocked Warning */}
        {isBlockedUser && (
          <div className="border-t border-border p-4 bg-destructive/5">
            <p className="text-sm text-center text-destructive">
              {t("youBlockedThisUser")}
            </p>
          </div>
        )}

        {/* Media Preview */}
        {media.length > 0 && (
          <div className="border-t border-border p-2 bg-muted/30">
            <div className="flex gap-2 overflow-x-auto">
              {media.map((img, index) => (
                <div key={index} className="relative flex-shrink-0">
                  <img
                    src={img}
                    alt={`Upload ${index + 1}`}
                    className="h-16 w-16 rounded-lg object-cover"
                  />
                  <button
                    onClick={() => removeImage(index)}
                    className="absolute -top-1 -right-1 w-5 h-5 bg-destructive text-white rounded-full flex items-center justify-center"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Input */}
        {!isBlockedUser && (
          <div className="border-t border-border p-4 bg-background">
            {editingMessageId && (
              <div className="flex items-center gap-2 mb-2 px-2 py-1 bg-muted rounded-lg">
                <Edit2 className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  {t("editingMessage")}
                </span>
                <button onClick={cancelEditing} className="ml-auto">
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileSelect}
              className="hidden"
            />
            <div className="flex gap-2 items-end">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="p-2 text-primary hover:bg-primary/10 rounded-full transition-colors"
                title={t("addImage")}
              >
                <Image className="h-5 w-5" />
              </button>
              <div className="flex-1 bg-muted rounded-2xl px-4 py-2">
                <textarea
                  placeholder={t("typeMessage")}
                  value={messageText}
                  onChange={(e) => {
                    setMessageText(e.target.value);
                    handleTyping();
                  }}
                  onKeyDown={handleKeyPress}
                  className="w-full bg-transparent resize-none outline-none text-sm min-h-[20px] max-h-[120px]"
                  rows={1}
                  style={{ height: "auto" }}
                />
              </div>
              <Button
                onClick={handleSendMessage}
                disabled={!messageText.trim() && media.length === 0}
                className="bg-[#DC143C] hover:bg-[#B01030] rounded-full w-10 h-10 p-0 flex items-center justify-center"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="sticky top-0 bg-background/95 backdrop-blur-md border-b border-border z-10">
        <div className="flex items-center justify-between px-4 py-3">
          <h1 className="text-xl font-bold">{t("messages")}</h1>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowNewMessage(true)}
            className="gap-2"
          >
            <span className="text-yellow-400">⚡</span>
            {t("newMessage")}
          </Button>
        </div>
      </div>

      {/* Conversation List */}
      <div className="divide-y divide-border">
        {sortedConversations.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#DC143C]/20 to-yellow-400/20 flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">💬</span>
            </div>
            <p className="text-lg font-medium">{t("noMessages")}</p>
            <p className="text-sm mt-1 mb-6">{t("startConversation")}</p>
            <Button
              className="bg-[#DC143C] hover:bg-[#B01030] rounded-full px-6"
              onClick={() => setShowNewMessage(true)}
            >
              <span className="text-yellow-400 mr-2">⚡</span>
              {t("newMessage")}
            </Button>

            {/* Quick Start - Show some users to message */}
            <div className="mt-8 px-4">
              <p className="text-sm text-muted-foreground mb-3">
                {t("whoToFollow")}
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                {registeredUsers
                  .filter((u) => u.id !== user?.id && !isBlocked(u.id))
                  .slice(0, 5)
                  .map((u) => (
                    <button
                      key={u.id}
                      onClick={() => {
                        const conv = getOrCreateConversation(u.id);
                        setSelectedConversation(conv);
                      }}
                      className="flex items-center gap-2 px-3 py-2 bg-muted rounded-full hover:bg-muted/80 transition-colors"
                    >
                      <img
                        src={u.avatar}
                        alt={u.displayName}
                        className="w-6 h-6 rounded-full"
                      />
                      <span className="text-sm">{u.displayName}</span>
                    </button>
                  ))}
              </div>
            </div>
          </div>
        ) : (
          sortedConversations.map((conv) => {
            const otherUser = getOtherParticipant(conv);
            if (!otherUser) return null;

            const lastMessage = conv.messages[conv.messages.length - 1];
            const hasUnread = conv.messages.some(
              (m) => m.senderId !== user?.id && !m.isRead,
            );
            const unreadCount = conv.messages.filter(
              (m) => m.senderId !== user?.id && !m.isRead,
            ).length;

            return (
              <button
                key={conv.id}
                onClick={() => setSelectedConversation(conv)}
                className="w-full flex items-center gap-3 p-4 hover:bg-muted/50 transition-colors"
              >
                <div className="relative">
                  <img
                    src={otherUser.avatar}
                    alt={otherUser.displayName}
                    className="h-12 w-12 rounded-full object-cover"
                  />
                  {otherUser.isOnline && (
                    <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-background" />
                  )}
                </div>
                <div className="flex-1 text-left min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold truncate">
                      {otherUser.displayName}
                    </p>
                    {lastMessage && (
                      <span
                        className={`text-xs ${hasUnread ? "text-primary font-medium" : "text-muted-foreground"}`}
                      >
                        {formatDistanceToNow(lastMessage.createdAt)}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <p
                      className={`text-sm truncate ${hasUnread ? "text-foreground font-medium" : "text-muted-foreground"}`}
                    >
                      {lastMessage ? (
                        <>
                          {lastMessage.senderId === user?.id && (
                            <span className="opacity-70">{t("you")}: </span>
                          )}
                          {lastMessage.isDeleted ? (
                            <span className="italic">
                              {t("messageDeleted")}
                            </span>
                          ) : (
                            <>
                              {lastMessage.media &&
                                lastMessage.media.length > 0 && (
                                  <span className="inline-flex items-center gap-1">
                                    <Image className="h-3 w-3" />
                                    {lastMessage.media.length}{" "}
                                    {lastMessage.media.length > 1
                                      ? t("images")
                                      : t("image")}
                                    {lastMessage.content && " · "}
                                  </span>
                                )}
                              {lastMessage.content}
                            </>
                          )}
                        </>
                      ) : (
                        t("startConversation")
                      )}
                    </p>
                    {unreadCount > 0 && (
                      <span className="flex-shrink-0 min-w-[1.25rem] h-5 px-1.5 bg-[#DC143C] text-white text-xs font-medium rounded-full flex items-center justify-center">
                        {unreadCount}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
