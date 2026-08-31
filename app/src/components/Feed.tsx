import { useAuth } from "@/context/AuthContext";
import { useParniks } from "@/context/ParnikContext";
import { useUsers } from "@/context/UsersContext";
import { useLanguage } from "@/context/LanguageContext";
import { ParnikCard } from "./ParnikCard";
import { Button } from "@/components/ui/button";

interface FeedProps {
  onCompose: () => void;
  onViewProfile?: (userId: string) => void;
}

export function Feed({ onCompose, onViewProfile }: FeedProps) {
  const { user, isObserver } = useAuth();
  const { getFeedParniks } = useParniks();
  const { getUserById } = useUsers();
  const { t } = useLanguage();
  const parniks = getFeedParniks();

  // Get user info for each parnik from global users list
  const getAuthor = (authorId: string) => {
    // First check if it's the current user
    if (user && authorId === user.id) {
      return user;
    }
    // Otherwise get from global users list
    return getUserById(authorId);
  };

  if (parniks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-4 text-center min-h-[60vh]">
        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center mb-6">
          <span className="text-4xl">✨</span>
        </div>
        <h2 className="text-3xl font-bold mb-3">{t("emptyFeedTitle")}</h2>
        <p className="text-muted-foreground max-w-md mb-8 text-lg">
          {t("emptyFeedText")}
        </p>
        {!isObserver && user && (
          <Button
            size="lg"
            className="rounded-full gap-2 bg-[#DC143C] hover:bg-[#B01030] text-white px-8"
            onClick={onCompose}
          >
            <span className="text-yellow-400 text-xl">⚡</span>
            {t("createFirstParnik")}
          </Button>
        )}
        {isObserver && (
          <p className="text-sm text-muted-foreground">
            👁️ Sign in to create your first Parnik
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="divide-y divide-border">
      {/* Header */}
      <div className="sticky top-0 bg-background/95 backdrop-blur-md border-b border-border z-10">
        <div className="px-4 py-4">
          <h1 className="text-xl font-bold">{t("home")}</h1>
        </div>
      </div>

      {/* Quick Compose */}
      {!isObserver && user && (
        <div
          className="p-4 border-b border-border hover:bg-muted/30 transition-colors cursor-pointer"
          onClick={onCompose}
        >
          <div className="flex gap-3">
            <img
              src={user.avatar}
              alt={user.displayName}
              className="h-10 w-10 rounded-full bg-muted"
            />
            <div className="flex-1">
              <div className="text-left text-muted-foreground hover:text-foreground transition-colors rounded-full px-4 py-3 border border-border hover:border-primary/50">
                {t("whatsOnMind")}
              </div>
              <div className="flex items-center gap-4 mt-3">
                <button className="p-2 text-primary hover:bg-primary/10 rounded-full transition-colors">
                  <svg
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                </button>
                <button className="p-2 text-primary hover:bg-primary/10 rounded-full transition-colors">
                  <svg
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                    />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Parniks with stagger animation */}
      {parniks.map((parnik, index) => {
        const author = getAuthor(parnik.authorId);
        if (!author) return null;

        return (
          <div
            key={parnik.id}
            className="stagger-item"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <ParnikCard
              parnik={parnik}
              author={author}
              onViewProfile={onViewProfile}
            />
          </div>
        );
      })}
    </div>
  );
}
