import { useState } from "react";
import { ThemeProvider } from "@/context/ThemeContext";
import { LanguageProvider } from "@/context/LanguageContext";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { ParnikProvider } from "@/context/ParnikContext";
import { DMProvider, useDM } from "@/context/DMContext";
import { NotificationProvider } from "@/context/NotificationContext";
import { UsersProvider } from "@/context/UsersContext";
import { Sidebar } from "@/components/Sidebar";
import { Feed } from "@/components/Feed";
import { ComposeModal } from "@/components/ComposeModal";
import { LoginPage } from "@/pages/LoginPage";
import { ProfilePage } from "@/pages/ProfilePage";
import { SettingsPage } from "@/pages/SettingsPage";
import { MessagesPage } from "@/pages/MessagesPage";
import { NotificationsPage } from "@/pages/NotificationsPage";
import { ExplorePage } from "@/pages/ExplorePage";
import { TermsOfServicePage } from "@/pages/TermsOfServicePage";
import { PrivacyPolicyPage } from "@/pages/PrivacyPolicyPage";
import { Toaster } from "@/components/ui/sonner";
import { NotificationBanner } from "@/components/NotificationBanner";
import { useLanguage } from "@/context/LanguageContext";

type Tab =
  | "home"
  | "explore"
  | "notifications"
  | "messages"
  | "bookmarks"
  | "profile"
  | "settings"
  | "terms"
  | "privacy";

interface ProfileViewState {
  isOpen: boolean;
  userId?: string;
}

function MainApp() {
  const { isAuthenticated, isObserver } = useAuth();
  const { getOrCreateConversation } = useDM();
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<Tab>("home");
  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const [profileView, setProfileView] = useState<ProfileViewState>({
    isOpen: false,
  });

  if (!isAuthenticated && !isObserver) {
    return <LoginPage />;
  }

  const handleViewProfile = (userId: string) => {
    setProfileView({ isOpen: true, userId });
  };

  const handleCloseProfile = () => {
    setProfileView({ isOpen: false });
    // Don't change tab, just close the profile view
  };

  const handleMessageUser = (userId: string) => {
    // Create conversation and switch to messages tab
    getOrCreateConversation(userId);
    setActiveTab("messages");
    setProfileView({ isOpen: false });
  };

  const handleTabChange = (tab: Tab) => {
    setActiveTab(tab);
    // Close profile view when switching tabs
    if (profileView.isOpen) {
      setProfileView({ isOpen: false });
    }
  };

  const renderContent = () => {
    // If viewing a profile, show the ProfilePage
    if (profileView.isOpen) {
      return (
        <ProfilePage
          userId={profileView.userId}
          onBack={handleCloseProfile}
          onViewProfile={handleViewProfile}
          onMessage={handleMessageUser}
        />
      );
    }

    switch (activeTab) {
      case "home":
        return (
          <Feed
            onCompose={() => setIsComposeOpen(true)}
            onViewProfile={handleViewProfile}
          />
        );
      case "explore":
        return <ExplorePage onViewProfile={handleViewProfile} />;
      case "notifications":
        return <NotificationsPage onViewProfile={handleViewProfile} />;
      case "messages":
        return <MessagesPage onViewProfile={handleViewProfile} />;
      case "bookmarks":
        return (
          <div className="min-h-screen">
            <div className="sticky top-0 bg-background/95 backdrop-blur-md border-b border-border z-10">
              <div className="px-4 py-4">
                <h1 className="text-xl font-bold">{t("bookmarks")}</h1>
              </div>
            </div>
            <div className="p-8 text-center text-muted-foreground">
              <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">🔖</span>
              </div>
              <h2 className="text-xl font-semibold mb-2">{t("bookmarks")}</h2>
              <p>Save Parniks to view them later!</p>
            </div>
          </div>
        );
      case "profile":
        return (
          <ProfilePage
            onViewProfile={handleViewProfile}
            onMessage={handleMessageUser}
          />
        );
      case "settings":
        return <SettingsPage />;
      case "terms":
        return <TermsOfServicePage onClose={() => handleTabChange("home")} />;
      case "privacy":
        return <PrivacyPolicyPage onClose={() => handleTabChange("home")} />;
      default:
        return (
          <Feed
            onCompose={() => setIsComposeOpen(true)}
            onViewProfile={handleViewProfile}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="flex max-w-7xl mx-auto">
        {/* Sidebar */}
        <Sidebar
          activeTab={activeTab}
          onTabChange={(tab) => handleTabChange(tab as Tab)}
          onCompose={() => setIsComposeOpen(true)}
        />

        {/* Main Content */}
        <main className="flex-1 ml-20 xl:ml-72 min-h-screen border-r border-border page-transition-enter-active">
          {renderContent()}
        </main>

        {/* Right Sidebar */}
        <aside className="hidden lg:block w-80 p-4">
          <div className="sticky top-4 space-y-4">
            {/* Search */}
            <div className="relative">
              <input
                type="text"
                placeholder={t("search")}
                className="w-full bg-muted rounded-full px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary transition-all"
              />
            </div>

            {/* What's happening */}
            <div className="bg-muted rounded-2xl p-4">
              <h2 className="font-bold text-lg mb-4">{t("whatsHappening")}</h2>
              <div className="space-y-4 text-muted-foreground text-sm">
                <p>{t("trendsText")}</p>
              </div>
            </div>

            {/* Who to follow */}
            <div className="bg-muted rounded-2xl p-4">
              <h2 className="font-bold text-lg mb-4">{t("whoToFollow")}</h2>
              <div className="space-y-4 text-muted-foreground text-sm">
                <p>{t("followText")}</p>
              </div>
            </div>

            {/* Footer */}
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
              <button
                onClick={() => handleTabChange("terms")}
                className="hover:text-primary transition-colors"
              >
                {t("termsShort") || t("terms")}
              </button>
              <button
                onClick={() => handleTabChange("privacy")}
                className="hover:text-primary transition-colors"
              >
                {t("privacy") || "Privacy"}
              </button>
              <span className="text-muted-foreground/50">|</span>
              <span className="text-muted-foreground/70">Quabiccu | 2026</span>
              <span className="text-muted-foreground/50">|</span>
              <span className="text-muted-foreground/70">Apache 2.0</span>
            </div>

            <p className="text-xs text-muted-foreground">
              2026 Quabiccu. {t("allRightsReserved") || "All rights reserved."}
            </p>
          </div>
        </aside>
      </div>

      {/* Compose Modal */}
      <ComposeModal
        isOpen={isComposeOpen}
        onClose={() => setIsComposeOpen(false)}
      />

      {/* Terms overlay removed - now uses tab navigation */}

      {/* Notification Permission Banner */}
      <NotificationBanner />

      <Toaster />
    </div>
  );
}

function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <AuthProvider>
          <UsersProvider>
            <NotificationProvider>
              <ParnikProvider>
                <DMProvider>
                  <MainApp />
                </DMProvider>
              </ParnikProvider>
            </NotificationProvider>
          </UsersProvider>
        </AuthProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}

export default App;
