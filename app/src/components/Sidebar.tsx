import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { useLanguage } from "@/context/LanguageContext";
import { useDM } from "@/context/DMContext";
import { useNotifications } from "@/context/NotificationContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Home,
  User,
  Settings,
  LogOut,
  Sun,
  Moon,
  Globe,
  MessageCircle,
  Search,
  Bookmark,
  Bell,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  onCompose: () => void;
}

// Admin username
const ADMIN_USERNAME = "anatolcyman_";

export function Sidebar({ activeTab, onTabChange, onCompose }: SidebarProps) {
  const { user, logout, isObserver } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { t, language, setLanguage, livingLanguages, ancientLanguages } =
    useLanguage();
  const { getUnreadCount } = useDM();
  const { unreadCount: notificationCount } = useNotifications();
  const [languageSearch, setLanguageSearch] = useState("");

  const unreadMessages = getUnreadCount();

  // Filter languages
  const filteredLiving = languageSearch.trim()
    ? livingLanguages.filter((lang) =>
        lang.name.toLowerCase().includes(languageSearch.toLowerCase().trim()),
      )
    : livingLanguages;

  const filteredAncient = languageSearch.trim()
    ? ancientLanguages.filter((lang) =>
        lang.name.toLowerCase().includes(languageSearch.toLowerCase().trim()),
      )
    : ancientLanguages;

  const navItems = [
    { id: "home", label: t("home"), icon: Home },
    { id: "explore", label: t("explore"), icon: Search },
    {
      id: "notifications",
      label: t("notifications"),
      icon: Bell,
      badge: notificationCount,
    },
    {
      id: "messages",
      label: t("messages"),
      icon: MessageCircle,
      badge: unreadMessages,
    },
    { id: "bookmarks", label: t("bookmarks"), icon: Bookmark },
    { id: "profile", label: t("profile"), icon: User },
    { id: "settings", label: t("settings"), icon: Settings },
  ];

  // Filter nav items for observers
  const visibleNavItems = isObserver
    ? navItems.filter((item) =>
        ["home", "explore", "settings"].includes(item.id),
      )
    : navItems;

  const currentLang = [...livingLanguages, ...ancientLanguages].find(
    (l) => l.code === language,
  );
  const isAdmin = user?.username === ADMIN_USERNAME;

  return (
    <div className="fixed left-0 top-0 h-full w-20 xl:w-72 border-r border-border bg-background flex flex-col z-20">
      {/* Logo */}
      <div className="p-4 flex justify-center xl:justify-start">
        <button
          onClick={() => onTabChange("home")}
          className="p-3 rounded-full hover:bg-muted transition-colors"
        >
          <img
            src="/logo.png"
            alt="Tsinephu"
            className="h-8 w-8 object-contain"
          />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 space-y-1 overflow-y-auto">
        {visibleNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`w-full flex items-center gap-4 px-4 py-3 rounded-full transition-all duration-200 relative ${
                isActive
                  ? "font-semibold bg-primary/10 text-primary"
                  : "hover:bg-muted"
              }`}
            >
              <div className="relative">
                <Icon className={`h-6 w-6 ${isActive ? "text-primary" : ""}`} />
                {item.badge !== undefined && item.badge > 0 && (
                  <Badge
                    variant="destructive"
                    className="absolute -top-2 -right-2 h-5 min-w-[20px] px-1 text-xs flex items-center justify-center"
                  >
                    {item.badge > 99 ? "99+" : item.badge}
                  </Badge>
                )}
              </div>
              <span className="hidden xl:block text-lg">{item.label}</span>
            </button>
          );
        })}

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="w-full flex items-center gap-4 px-4 py-3 rounded-full hover:bg-muted transition-colors"
        >
          {theme === "classic" ? (
            <>
              <Sun className="h-6 w-6" />
              <span className="hidden xl:block text-lg">{t("light")}</span>
            </>
          ) : (
            <>
              <Moon className="h-6 w-6" />
              <span className="hidden xl:block text-lg">{t("classic")}</span>
            </>
          )}
        </button>

        {/* Language Selector */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="w-full flex items-center gap-4 px-4 py-3 rounded-full hover:bg-muted transition-colors">
              <Globe className="h-6 w-6" />
              <span className="hidden xl:block text-lg">
                {currentLang?.flag} {currentLang?.name}
              </span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="start"
            className="w-72 max-h-[500px] overflow-y-auto"
          >
            <div className="p-2 sticky top-0 bg-popover z-10 border-b">
              <Input
                placeholder={t("search") + "..."}
                value={languageSearch}
                onChange={(e) => setLanguageSearch(e.target.value)}
                className="h-8 text-sm"
                onClick={(e) => e.stopPropagation()}
              />
            </div>

            {/* Living Languages */}
            {!languageSearch.trim() && (
              <DropdownMenuLabel className="text-xs font-semibold text-muted-foreground">
                Living Languages ({filteredLiving.length})
              </DropdownMenuLabel>
            )}
            <div className="py-1">
              {filteredLiving.length > 0 ? (
                filteredLiving.map((lang) => (
                  <DropdownMenuItem
                    key={lang.code}
                    onClick={() => {
                      setLanguage(lang.code);
                      setLanguageSearch("");
                    }}
                    className={language === lang.code ? "bg-primary/10" : ""}
                  >
                    <span className="mr-2">{lang.flag}</span>
                    {lang.name}
                  </DropdownMenuItem>
                ))
              ) : (
                <div className="px-3 py-2 text-sm text-muted-foreground">
                  No languages found
                </div>
              )}
            </div>

            {/* Ancient Languages */}
            {filteredAncient.length > 0 && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuLabel className="text-xs font-semibold text-muted-foreground">
                  🏛️ Ancient & Symbolic Languages ({filteredAncient.length})
                </DropdownMenuLabel>
                <div className="py-1">
                  {filteredAncient.map((lang) => (
                    <DropdownMenuItem
                      key={lang.code}
                      onClick={() => {
                        setLanguage(lang.code);
                        setLanguageSearch("");
                      }}
                      className={language === lang.code ? "bg-primary/10" : ""}
                    >
                      <span className="mr-2">{lang.flag}</span>
                      {lang.name}
                    </DropdownMenuItem>
                  ))}
                </div>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </nav>

      {/* Compose Button - Hidden for observers */}
      {!isObserver && (
        <div className="p-4">
          <Button
            size="lg"
            className="w-full h-14 rounded-full text-lg font-semibold gap-2 bg-[#DC143C] hover:bg-[#B01030] text-white shadow-lg hover:shadow-xl transition-all"
            onClick={onCompose}
          >
            <span className="text-yellow-400 text-xl">⚡</span>
            <span className="hidden xl:inline">{t("newParnik")}</span>
          </Button>
        </div>
      )}

      {/* Observer Notice */}
      {isObserver && (
        <div className="p-4 mx-4 mb-2 bg-muted/50 rounded-lg">
          <p className="text-xs text-muted-foreground text-center">
            👁️ Observer Mode - Sign in to interact
          </p>
        </div>
      )}

      {/* User Profile */}
      {user && (
        <div className="p-4 border-t border-border">
          <button
            onClick={() => onTabChange("profile")}
            className="w-full flex items-center gap-3 p-3 rounded-full hover:bg-muted transition-colors"
          >
            <img
              src={user.avatar}
              alt={user.displayName}
              className="h-10 w-10 rounded-full bg-muted"
            />
            <div className="hidden xl:block text-left flex-1 min-w-0">
              <p className="font-semibold truncate flex items-center gap-1">
                {user.displayName}
                {isAdmin && <span title="Admin">☄️</span>}
              </p>
              <p className="text-sm text-muted-foreground truncate">
                @{user.username}
              </p>
            </div>
            <LogOut
              className="h-5 w-5 text-muted-foreground hidden xl:block cursor-pointer hover:text-destructive transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                logout();
              }}
            />
          </button>
        </div>
      )}
    </div>
  );
}
