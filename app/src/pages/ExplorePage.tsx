import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useUsers } from "@/context/UsersContext";
import { useParniks } from "@/context/ParnikContext";
import { useLanguage } from "@/context/LanguageContext";
import { ParnikCard } from "@/components/ParnikCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, TrendingUp, UserPlus, UserMinus, Hash } from "lucide-react";

interface ExplorePageProps {
  onViewProfile?: (userId: string) => void;
}

export function ExplorePage({ onViewProfile }: ExplorePageProps) {
  const { user } = useAuth();
  const { users, getUserById, followUser, unfollowUser, isFollowing } =
    useUsers();
  const { parniks } = useParniks();
  const { t } = useLanguage();

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<typeof users>([]);
  const [activeTab, setActiveTab] = useState<"trending" | "users" | "search">(
    "trending",
  );
  const [isSearching, setIsSearching] = useState(false);

  // Search users
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.trim()) {
        setIsSearching(true);
        const query = searchQuery.toLowerCase();
        const results = users.filter(
          (u) =>
            u.id !== user?.id &&
            (u.displayName.toLowerCase().includes(query) ||
              u.username.toLowerCase().includes(query) ||
              u.bio?.toLowerCase().includes(query)),
        );
        setSearchResults(results);
        setIsSearching(false);
      } else {
        setSearchResults([]);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, users, user]);

  // Get trending parniks (most liked/reparniked recently)
  const trendingParniks = [...parniks]
    .filter((p) => !p.isReParnik)
    .sort(
      (a, b) =>
        b.likes.length +
        b.reparniks.length -
        (a.likes.length + a.reparniks.length),
    )
    .slice(0, 10);

  // Get suggested users (users not following)
  const suggestedUsers = users
    .filter((u) => u.id !== user?.id && !isFollowing(user?.id || "", u.id))
    .slice(0, 5);

  const handleFollow = (userId: string) => {
    if (!user) return;
    if (isFollowing(user.id, userId)) {
      unfollowUser(user.id, userId);
    } else {
      followUser(user.id, userId);
    }
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="sticky top-0 bg-background/95 backdrop-blur-md border-b border-border z-10">
        <div className="px-4 py-4">
          <h1 className="text-xl font-bold">{t("explore")}</h1>
        </div>

        {/* Search Bar */}
        <div className="px-4 pb-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t("search")}
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                if (e.target.value.trim()) {
                  setActiveTab("search");
                } else {
                  setActiveTab("trending");
                }
              }}
              className="pl-10 rounded-full bg-muted border-0"
            />
          </div>
        </div>

        {/* Tabs */}
        {!searchQuery.trim() && (
          <div className="flex border-b border-border">
            <button
              onClick={() => setActiveTab("trending")}
              className={`flex-1 py-3 font-medium transition-colors ${
                activeTab === "trending"
                  ? "border-b-2 border-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <TrendingUp className="h-4 w-4 inline mr-2" />
              {t("trending")}
            </button>
            <button
              onClick={() => setActiveTab("users")}
              className={`flex-1 py-3 font-medium transition-colors ${
                activeTab === "users"
                  ? "border-b-2 border-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <UserPlus className="h-4 w-4 inline mr-2" />
              {t("users")}
            </button>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Search Results */}
        {activeTab === "search" && (
          <div className="space-y-4">
            <h2 className="font-semibold text-lg">{t("searchResults")}</h2>
            {isSearching ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
              </div>
            ) : searchResults.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>
                  {t("noUsersFoundMatching").replace("{query}", searchQuery)}
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {searchResults.map((foundUser) => (
                  <div
                    key={foundUser.id}
                    className="flex items-center gap-3 p-4 bg-muted/50 rounded-xl hover:bg-muted transition-colors"
                  >
                    <button onClick={() => onViewProfile?.(foundUser.id)}>
                      <img
                        src={foundUser.avatar}
                        alt={foundUser.displayName}
                        className="h-12 w-12 rounded-full object-cover"
                      />
                    </button>
                    <div className="flex-1">
                      <button
                        onClick={() => onViewProfile?.(foundUser.id)}
                        className="font-semibold hover:underline"
                      >
                        {foundUser.displayName}
                      </button>
                      <p className="text-sm text-muted-foreground">
                        @{foundUser.username}
                      </p>
                      {foundUser.bio && (
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-1">
                          {foundUser.bio}
                        </p>
                      )}
                    </div>
                    {user && (
                      <Button
                        variant={
                          isFollowing(user.id, foundUser.id)
                            ? "outline"
                            : "default"
                        }
                        size="sm"
                        onClick={() => handleFollow(foundUser.id)}
                        className={
                          !isFollowing(user.id, foundUser.id)
                            ? "bg-[#DC143C] hover:bg-[#B01030]"
                            : ""
                        }
                      >
                        {isFollowing(user.id, foundUser.id) ? (
                          <>
                            <UserMinus className="h-4 w-4 mr-1" />
                            {t("unfollow")}
                          </>
                        ) : (
                          <>
                            <UserPlus className="h-4 w-4 mr-1" />
                            {t("follow")}
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Trending */}
        {activeTab === "trending" && (
          <div className="space-y-4">
            {/* Trending Topics - derived from actual content */}
            <div className="bg-muted/50 rounded-xl p-4">
              <h2 className="font-semibold text-lg mb-4 flex items-center gap-2">
                <Hash className="h-5 w-5" />
                {t("trendsForYou")}
              </h2>
              {trendingParniks.length === 0 ? (
                <div className="text-center py-4 text-muted-foreground">
                  <p className="text-sm">{t("noTrendingParniksYet")}</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {Array.from(
                    new Set(
                      trendingParniks.flatMap((p) => {
                        const tags =
                          p.content.match(/#[\w\u0080-\uFFFF]+/g) || [];
                        return tags.slice(0, 3);
                      }),
                    ),
                  )
                    .slice(0, 5)
                    .map((hashtag) => {
                      const count = parniks.filter((p) =>
                        p.content.includes(hashtag),
                      ).length;
                      return (
                        <div
                          key={hashtag}
                          className="flex items-center justify-between hover:bg-muted p-2 rounded-lg cursor-pointer transition-colors"
                        >
                          <div>
                            <p className="font-medium">{hashtag}</p>
                            <p className="text-sm text-muted-foreground">
                              {count} Parniks
                            </p>
                          </div>
                          <TrendingUp className="h-4 w-4 text-muted-foreground" />
                        </div>
                      );
                    })}
                </div>
              )}
            </div>

            {/* Trending Parniks */}
            <div>
              <h2 className="font-semibold text-lg mb-4">
                {t("trendingParniks")}
              </h2>
              {trendingParniks.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>{t("noTrendingParniksYet")}</p>
                </div>
              ) : (
                <div className="divide-y divide-border border rounded-xl overflow-hidden">
                  {trendingParniks.map((parnik) => {
                    const author = getUserById(parnik.authorId) || user;
                    if (!author) return null;
                    return (
                      <ParnikCard
                        key={parnik.id}
                        parnik={parnik}
                        author={author}
                        onViewProfile={onViewProfile}
                      />
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Users Tab */}
        {activeTab === "users" && (
          <div className="space-y-4">
            <h2 className="font-semibold text-lg">{t("whoToFollow")}</h2>
            {suggestedUsers.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>{t("noSuggestedUsers")}</p>
              </div>
            ) : (
              <div className="space-y-2">
                {suggestedUsers.map((suggestedUser) => (
                  <div
                    key={suggestedUser.id}
                    className="flex items-center gap-3 p-4 bg-muted/50 rounded-xl hover:bg-muted transition-colors"
                  >
                    <button onClick={() => onViewProfile?.(suggestedUser.id)}>
                      <img
                        src={suggestedUser.avatar}
                        alt={suggestedUser.displayName}
                        className="h-12 w-12 rounded-full object-cover"
                      />
                    </button>
                    <div className="flex-1">
                      <button
                        onClick={() => onViewProfile?.(suggestedUser.id)}
                        className="font-semibold hover:underline"
                      >
                        {suggestedUser.displayName}
                      </button>
                      <p className="text-sm text-muted-foreground">
                        @{suggestedUser.username}
                      </p>
                      {suggestedUser.bio && (
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-1">
                          {suggestedUser.bio}
                        </p>
                      )}
                    </div>
                    {user && (
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => handleFollow(suggestedUser.id)}
                        className="bg-[#DC143C] hover:bg-[#B01030]"
                      >
                        <UserPlus className="h-4 w-4 mr-1" />
                        {t("follow")}
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* All Users */}
            <h2 className="font-semibold text-lg mt-6">{t("allUsers")}</h2>
            <div className="space-y-2">
              {users
                .filter((u) => u.id !== user?.id)
                .map((u) => (
                  <div
                    key={u.id}
                    className="flex items-center gap-3 p-3 hover:bg-muted/50 rounded-lg transition-colors cursor-pointer"
                    onClick={() => onViewProfile?.(u.id)}
                  >
                    <img
                      src={u.avatar}
                      alt={u.displayName}
                      className="h-10 w-10 rounded-full object-cover"
                    />
                    <div className="flex-1">
                      <p className="font-medium">{u.displayName}</p>
                      <p className="text-sm text-muted-foreground">
                        @{u.username}
                      </p>
                    </div>
                    {u.isOnline && (
                      <span className="w-2.5 h-2.5 bg-green-500 rounded-full" />
                    )}
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
