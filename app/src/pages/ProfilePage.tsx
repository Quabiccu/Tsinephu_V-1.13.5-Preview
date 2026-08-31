import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useUsers } from "@/context/UsersContext";
import { useParniks } from "@/context/ParnikContext";
import { useLanguage } from "@/context/LanguageContext";
import { ParnikCard } from "@/components/ParnikCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Calendar,
  Edit2,
  Check,
  X,
  Camera,
  Upload,
  Trash2,
  ArrowLeft,
  MessageCircle,
  UserPlus,
  UserMinus,
  Ban,
} from "lucide-react";

interface ProfilePageProps {
  userId?: string;
  onBack?: () => void;
  onViewProfile?: (userId: string) => void;
  onMessage?: (userId: string) => void;
}

export function ProfilePage({
  userId,
  onBack,
  onViewProfile,
  onMessage,
}: ProfilePageProps) {
  const {
    user: currentUser,
    updateUser,
    updateAvatar,
    isAdmin,
    banUser,
  } = useAuth();
  const { getUserById, followUser, unfollowUser, isFollowing } = useUsers();
  const { getUserParniks, getUserLikedParniks } = useParniks();
  const { t } = useLanguage();

  // Determine if viewing own profile or another user's
  const isOwnProfile = !userId || userId === currentUser?.id;
  const profileUser = isOwnProfile ? currentUser : getUserById(userId);

  const [isEditing, setIsEditing] = useState(false);
  const [isPhotoEditing, setIsPhotoEditing] = useState(false);
  const [isReporting, setIsReporting] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [activeTab, setActiveTab] = useState<
    "parniks" | "replies" | "media" | "likes"
  >("parniks");
  const [editData, setEditData] = useState({
    displayName: profileUser?.displayName || "",
    bio: profileUser?.bio || "",
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Update edit data when profile user changes
  useEffect(() => {
    if (profileUser) {
      setEditData({
        displayName: profileUser.displayName,
        bio: profileUser.bio || "",
      });
    }
  }, [profileUser]);

  if (!profileUser || !currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">❓</span>
          </div>
          <p className="text-lg font-medium">{t("userNotFound")}</p>
          {onBack && (
            <Button onClick={onBack} className="mt-4" variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              {t("goBack")}
            </Button>
          )}
        </div>
      </div>
    );
  }

  const userParniks = getUserParniks(profileUser.id);
  const likedParniks = getUserLikedParniks(profileUser.id);

  // Filter parniks by tab
  const filteredParniks =
    activeTab === "likes"
      ? likedParniks
      : activeTab === "media"
        ? userParniks.filter((p) => p.media && p.media.length > 0)
        : userParniks;

  const handleSave = () => {
    updateUser({
      displayName: editData.displayName,
      bio: editData.bio,
    });
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditData({
      displayName: profileUser.displayName,
      bio: profileUser.bio || "",
    });
    setIsEditing(false);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        updateAvatar(reader.result as string);
        setIsPhotoEditing(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRandomAvatar = () => {
    const randomId = Math.random().toString(36).substring(7);
    const newAvatar = `https://api.dicebear.com/7.x/avataaars/svg?seed=${randomId}&backgroundColor=b6e3f4`;
    updateAvatar(newAvatar);
    setIsPhotoEditing(false);
  };

  const handleRemovePhoto = () => {
    const defaultAvatar = `https://api.dicebear.com/7.x/avataaars/svg?seed=${profileUser.username}&backgroundColor=b6e3f4`;
    updateAvatar(defaultAvatar);
    setIsPhotoEditing(false);
  };

  const handleFollow = () => {
    if (!isOwnProfile) {
      if (isFollowing(currentUser.id, profileUser.id)) {
        unfollowUser(currentUser.id, profileUser.id);
      } else {
        followUser(currentUser.id, profileUser.id);
      }
    }
  };

  const handleReport = () => {
    if (reportReason.trim() && isAdmin) {
      banUser(profileUser.id, reportReason);
      setIsReporting(false);
      setReportReason("");
    }
  };

  const joinedDate = new Date(profileUser.joinedAt).toLocaleDateString(
    "en-US",
    {
      month: "long",
      year: "numeric",
    },
  );

  const amIFollowing = isFollowing(currentUser.id, profileUser.id);
  const areTheyFollowing = isFollowing(profileUser.id, currentUser.id);

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="sticky top-0 bg-background/95 backdrop-blur-md border-b border-border z-10">
        <div className="px-4 py-3 flex items-center gap-4">
          {(onBack || !isOwnProfile) && (
            <button
              onClick={onBack || (() => window.history.back())}
              className="p-2 hover:bg-muted rounded-full transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
          )}
          <div>
            <h1 className="text-xl font-bold">{profileUser.displayName}</h1>
            <p className="text-sm text-muted-foreground">
              {userParniks.length} {t("parniks")}
            </p>
          </div>
        </div>
      </div>

      {/* Profile Header */}
      <div className="relative">
        {/* Banner */}
        <div className="h-48 bg-gradient-to-r from-[#DC143C]/30 via-primary/20 to-yellow-500/20" />

        {/* Avatar */}
        <div className="absolute -bottom-16 left-4">
          <div className="relative group">
            <img
              src={profileUser.avatar}
              alt={profileUser.displayName}
              className="h-32 w-32 rounded-full border-4 border-background bg-muted"
            />
            {isOwnProfile && (
              <button
                onClick={() => setIsPhotoEditing(true)}
                className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Camera className="h-8 w-8 text-white" />
              </button>
            )}
            {profileUser.isAdmin && (
              <div className="absolute -top-2 -right-2 w-8 h-8 bg-[#DC143C] rounded-full flex items-center justify-center border-2 border-background">
                <span className="text-yellow-400 text-sm">☄️</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Profile Info */}
      <div className="pt-20 px-4 pb-4 border-b border-border">
        <div className="flex justify-end mb-4 gap-2">
          {isOwnProfile ? (
            <Button
              variant="outline"
              className="rounded-full gap-2"
              onClick={() => setIsEditing(true)}
            >
              <Edit2 className="h-4 w-4" />
              {t("editProfile")}
            </Button>
          ) : (
            <>
              {isAdmin && (
                <Button
                  variant="outline"
                  className="rounded-full gap-2 text-destructive hover:text-destructive"
                  onClick={() => setIsReporting(true)}
                >
                  <Ban className="h-4 w-4" />
                  {t("ban")}
                </Button>
              )}
              <Button
                variant="outline"
                className="rounded-full gap-2"
                onClick={() => onMessage?.(profileUser.id)}
              >
                <MessageCircle className="h-4 w-4" />
                {t("message")}
              </Button>
              <Button
                variant={amIFollowing ? "outline" : "default"}
                className={
                  amIFollowing
                    ? "rounded-full gap-2"
                    : "rounded-full gap-2 bg-[#DC143C] hover:bg-[#B01030]"
                }
                onClick={handleFollow}
              >
                {amIFollowing ? (
                  <>
                    <UserMinus className="h-4 w-4" />
                    {t("unfollow")}
                  </>
                ) : (
                  <>
                    <UserPlus className="h-4 w-4" />
                    {t("follow")}
                  </>
                )}
              </Button>
            </>
          )}
        </div>

        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-bold">{profileUser.displayName}</h2>
            {profileUser.isAdmin && (
              <span className="text-yellow-400" title="Admin">
                ☄️
              </span>
            )}
          </div>
          <p className="text-muted-foreground">@{profileUser.username}</p>
        </div>

        {profileUser.bio && (
          <p className="mt-3 text-base leading-relaxed">{profileUser.bio}</p>
        )}

        <div className="flex flex-wrap gap-4 mt-3 text-muted-foreground text-sm">
          <div className="flex items-center gap-1">
            <Calendar className="h-4 w-4" />
            <span>
              {t("joined")} {joinedDate}
            </span>
          </div>
          {!isOwnProfile && areTheyFollowing && (
            <div className="flex items-center gap-1">
              <span className="text-xs bg-muted px-2 py-0.5 rounded-full">
                {t("followsYou")}
              </span>
            </div>
          )}
        </div>

        <div className="flex gap-6 mt-4">
          <div className="flex gap-1 hover:underline cursor-pointer">
            <span className="font-semibold">
              {profileUser.following.length}
            </span>
            <span className="text-muted-foreground">{t("following")}</span>
          </div>
          <div className="flex gap-1 hover:underline cursor-pointer">
            <span className="font-semibold">
              {profileUser.followers.length}
            </span>
            <span className="text-muted-foreground">{t("followers")}</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border">
        <button
          onClick={() => setActiveTab("parniks")}
          className={`flex-1 py-4 font-semibold hover:bg-muted/50 transition-colors ${activeTab === "parniks" ? "border-b-2 border-primary" : "text-muted-foreground"}`}
        >
          {t("parniks")}
        </button>
        <button
          onClick={() => setActiveTab("replies")}
          className={`flex-1 py-4 hover:bg-muted/50 transition-colors ${activeTab === "replies" ? "border-b-2 border-primary font-semibold" : "text-muted-foreground"}`}
        >
          {t("replies")}
        </button>
        <button
          onClick={() => setActiveTab("media")}
          className={`flex-1 py-4 hover:bg-muted/50 transition-colors ${activeTab === "media" ? "border-b-2 border-primary font-semibold" : "text-muted-foreground"}`}
        >
          {t("media")}
        </button>
        <button
          onClick={() => setActiveTab("likes")}
          className={`flex-1 py-4 hover:bg-muted/50 transition-colors ${activeTab === "likes" ? "border-b-2 border-primary font-semibold" : "text-muted-foreground"}`}
        >
          {t("likes")}
        </button>
      </div>

      {/* Parniks */}
      <div>
        {filteredParniks.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">📝</span>
            </div>
            <p className="text-lg font-medium">
              {activeTab === "likes" ? t("noLikesYet") : t("noParniksYet")}
            </p>
            <p className="text-sm mt-1">
              {activeTab === "likes"
                ? t("likeParniksToSeeThem")
                : t("shareFirstThought")}
            </p>
          </div>
        ) : (
          filteredParniks.map((parnik) => (
            <ParnikCard
              key={parnik.id}
              parnik={parnik}
              author={profileUser}
              onViewProfile={onViewProfile}
            />
          ))
        )}
      </div>

      {/* Edit Profile Dialog */}
      {isOwnProfile && (
        <Dialog open={isEditing} onOpenChange={setIsEditing}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>{t("editProfile")}</DialogTitle>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  {t("displayName")}
                </label>
                <Input
                  value={editData.displayName}
                  onChange={(e) =>
                    setEditData((prev) => ({
                      ...prev,
                      displayName: e.target.value,
                    }))
                  }
                  placeholder={t("displayNamePlaceholder")}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">{t("bio")}</label>
                <Textarea
                  value={editData.bio}
                  onChange={(e) =>
                    setEditData((prev) => ({ ...prev, bio: e.target.value }))
                  }
                  placeholder={t("bioPlaceholder")}
                  rows={3}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={handleCancel}>
                <X className="h-4 w-4 mr-2" />
                {t("cancel")}
              </Button>
              <Button onClick={handleSave}>
                <Check className="h-4 w-4 mr-2" />
                {t("save")}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Photo Edit Dialog */}
      {isOwnProfile && (
        <Dialog open={isPhotoEditing} onOpenChange={setIsPhotoEditing}>
          <DialogContent className="sm:max-w-sm">
            <DialogHeader>
              <DialogTitle>{t("changePhoto")}</DialogTitle>
            </DialogHeader>

            <div className="space-y-3 py-4">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept="image/*"
                className="hidden"
              />

              <Button
                variant="outline"
                className="w-full justify-start gap-3"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="h-5 w-5" />
                {t("uploadPhoto")}
              </Button>

              <Button
                variant="outline"
                className="w-full justify-start gap-3"
                onClick={handleRandomAvatar}
              >
                <span className="text-lg">🎲</span>
                {t("randomAvatar")}
              </Button>

              <Button
                variant="outline"
                className="w-full justify-start gap-3 text-destructive hover:text-destructive"
                onClick={handleRemovePhoto}
              >
                <Trash2 className="h-5 w-5" />
                {t("removePhoto")}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Ban/Report Dialog */}
      {isAdmin && !isOwnProfile && (
        <Dialog open={isReporting} onOpenChange={setIsReporting}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Ban className="h-5 w-5 text-destructive" />
                {t("banUser")}: @{profileUser.username}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">{t("banReason")}</label>
                <Textarea
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value)}
                  placeholder={t("banReasonPlaceholder")}
                  rows={4}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsReporting(false)}>
                <X className="h-4 w-4 mr-2" />
                {t("cancel")}
              </Button>
              <Button
                onClick={handleReport}
                disabled={!reportReason.trim()}
                variant="destructive"
              >
                <Ban className="h-4 w-4 mr-2" />
                {t("banUser")}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
