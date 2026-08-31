import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { useLanguage } from "@/context/LanguageContext";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import {
  LogOut,
  Moon,
  Sun,
  Palette,
  Globe,
  Mail,
  Bell,
  BookOpen,
  Eye,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { NotificationSettingsPanel } from "@/components/NotificationBanner";

export function SettingsPage() {
  const { user, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const { t, language, languages, setLanguage } = useLanguage();

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="sticky top-0 bg-background/95 backdrop-blur-md border-b border-border z-10">
        <div className="px-4 py-3">
          <h1 className="text-xl font-bold">{t("settings")}</h1>
        </div>
      </div>

      <div className="p-4 space-y-6 max-w-2xl">
        {/* Language Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              {t("language")}
            </CardTitle>
            <CardDescription>{t("choosePreferredLanguage")}</CardDescription>
          </CardHeader>
          <CardContent>
            <Select
              value={language}
              onValueChange={(value) => setLanguage(value as any)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder={t("selectLanguage")} />
              </SelectTrigger>
              <SelectContent className="max-h-80">
                {languages.map((lang) => (
                  <SelectItem key={lang.code} value={lang.code}>
                    <span className="mr-2">{lang.flag}</span>
                    {lang.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* Theme Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="h-5 w-5" />
              {t("appearance")}
            </CardTitle>
            <CardDescription>{t("appearanceDesc")}</CardDescription>
          </CardHeader>
          <CardContent>
            <RadioGroup
              value={theme}
              onValueChange={(value) =>
                setTheme(value as "classic" | "light" | "sepia" | "lecture")
              }
              className="space-y-3"
            >
              <div className="flex items-center space-x-3 p-3 rounded-lg border border-border hover:bg-muted/50 cursor-pointer transition-colors">
                <RadioGroupItem value="classic" id="classic" />
                <Label htmlFor="classic" className="flex-1 cursor-pointer">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-900 flex items-center justify-center">
                      <Moon className="h-5 w-5 text-slate-100" />
                    </div>
                    <div>
                      <p className="font-medium">{t("classic")}</p>
                      <p className="text-sm text-muted-foreground">
                        {t("classicDesc") || "Dark mode with Tsinephu colors"}
                      </p>
                    </div>
                  </div>
                </Label>
              </div>

              <div className="flex items-center space-x-3 p-3 rounded-lg border border-border hover:bg-muted/50 cursor-pointer transition-colors">
                <RadioGroupItem value="light" id="light" />
                <Label htmlFor="light" className="flex-1 cursor-pointer">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-white border-2 border-gray-200 flex items-center justify-center">
                      <Sun className="h-5 w-5 text-yellow-500" />
                    </div>
                    <div>
                      <p className="font-medium">{t("light")}</p>
                      <p className="text-sm text-muted-foreground">
                        {t("lightDesc") || "Clean light theme"}
                      </p>
                    </div>
                  </div>
                </Label>
              </div>

              <div className="flex items-center space-x-3 p-3 rounded-lg border border-border hover:bg-muted/50 cursor-pointer transition-colors">
                <RadioGroupItem value="sepia" id="sepia" />
                <Label htmlFor="sepia" className="flex-1 cursor-pointer">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#e8d5b5] border-2 border-[#c9a96e] flex items-center justify-center">
                      <BookOpen className="h-5 w-5 text-[#8b6914]" />
                    </div>
                    <div>
                      <p className="font-medium">{t("sepia") || "Sepia"}</p>
                      <p className="text-sm text-muted-foreground">
                        {t("sepiaDesc") || "Warm reading mode"}
                      </p>
                    </div>
                  </div>
                </Label>
              </div>

              <div className="flex items-center space-x-3 p-3 rounded-lg border border-border hover:bg-muted/50 cursor-pointer transition-colors">
                <RadioGroupItem value="lecture" id="lecture" />
                <Label htmlFor="lecture" className="flex-1 cursor-pointer">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-white border-2 border-black flex items-center justify-center">
                      <Eye className="h-5 w-5 text-black" />
                    </div>
                    <div>
                      <p className="font-medium">{t("lecture") || "Lecture"}</p>
                      <p className="text-sm text-muted-foreground">
                        {t("lectureDesc") || "High-contrast accessibility mode"}
                      </p>
                    </div>
                  </div>
                </Label>
              </div>
            </RadioGroup>
          </CardContent>
        </Card>

        {/* Notification Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              {t("notifications")}
            </CardTitle>
            <CardDescription>
              {t("notificationsDesc") ||
                "Manage push notifications and app installation"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <NotificationSettingsPanel />
          </CardContent>
        </Card>

        {/* Account Settings */}
        <Card>
          <CardHeader>
            <CardTitle>{t("account")}</CardTitle>
            <CardDescription>{t("accountDesc")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-lg border border-border">
              <div>
                <p className="font-medium">{t("username")}</p>
                <p className="text-sm text-muted-foreground">
                  @{user?.username}
                </p>
              </div>
              <Button variant="outline" size="sm" disabled>
                {t("change")}
              </Button>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg border border-border">
              <div>
                <p className="font-medium">{t("email")}</p>
                <p className="text-sm text-muted-foreground">
                  {t("connectedViaGoogle")}
                </p>
              </div>
              <Button variant="outline" size="sm" disabled>
                {t("manage")}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Danger Zone */}
        <Card className="border-destructive/20">
          <CardHeader>
            <CardTitle className="text-destructive">
              {t("dangerZone")}
            </CardTitle>
            <CardDescription>{t("dangerZoneDesc")}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              variant="destructive"
              className="w-full gap-2"
              onClick={logout}
            >
              <LogOut className="h-4 w-4" />
              {t("signOut")}
            </Button>
          </CardContent>
        </Card>

        {/* Footer */}
        <Separator />

        <div className="text-center space-y-4 py-4">
          <div className="flex items-center justify-center gap-4 text-muted-foreground">
            <button
              onClick={() => (window.location.href = "/terms")}
              className="text-sm hover:text-primary transition-colors underline"
            >
              {t("termsShort") || "Terms of Service"}
            </button>
            <span className="text-muted-foreground/30">|</span>
            <a
              href="mailto:quabiccuteamoff@gmail.com"
              className="text-sm hover:text-primary transition-colors flex items-center gap-1"
            >
              <Mail className="h-3 w-3" />
              quabiccuteamoff@gmail.com
            </a>
          </div>

          <p className="text-sm text-muted-foreground">
            2026 Quabiccu. {t("allRightsReserved") || "All rights reserved."}
          </p>

          <p className="text-xs text-muted-foreground">Apache 2.0 License</p>

          <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
            <a href="#" className="hover:text-primary transition-colors">
              {t("terms")}
            </a>
            <a href="#" className="hover:text-primary transition-colors">
              {t("privacy")}
            </a>
            <a href="#" className="hover:text-primary transition-colors">
              {t("cookies")}
            </a>
            <a href="#" className="hover:text-primary transition-colors">
              {t("accessibility")}
            </a>
            <a href="#" className="hover:text-primary transition-colors">
              {t("ads")}
            </a>
          </div>

          <p className="text-xs text-muted-foreground">Tsinephu v 1.13.5</p>
        </div>
      </div>
    </div>
  );
}
