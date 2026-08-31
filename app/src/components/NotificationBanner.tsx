import { useState } from "react";
import { Bell, X, Download, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  usePushNotifications,
  useNotificationUI,
} from "@/hooks/usePushNotifications";
import { useLanguage } from "@/context/LanguageContext";

/**
 * Notification Permission Banner
 * Shows a banner to request notification permissions
 * Optimized for Android and other mobile platforms
 */
export function NotificationBanner() {
  const { t } = useLanguage();
  const { showBanner, dismiss } = useNotificationUI();
  const {
    permission,
    isSupported,
    isSubscribed,
    isInstalled,
    canInstall,
    requestPermission,
    subscribe,
    installPWA,
  } = usePushNotifications();

  const [isRequesting, setIsRequesting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  if (!showBanner || !isSupported) return null;

  // If already granted, show install prompt if available
  if (permission === "granted" && !isSubscribed) {
    return (
      <div className="fixed bottom-4 left-4 right-4 z-50 md:left-auto md:right-4 md:w-96">
        <div className="bg-background border border-border rounded-xl shadow-lg p-4 animate-in slide-in-from-bottom-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-[#DC143C]/10 flex items-center justify-center flex-shrink-0">
              <Bell className="h-5 w-5 text-[#DC143C]" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm">
                {t("notificationsAvailable") || "Notifications Ready"}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {t("enablePushNotifications") ||
                  "Enable push notifications to receive alerts even when Tsinephu is closed."}
              </p>
              <div className="flex gap-2 mt-3">
                <Button
                  size="sm"
                  className="bg-[#DC143C] hover:bg-[#B01030]"
                  onClick={async () => {
                    setIsRequesting(true);
                    await subscribe();
                    setIsRequesting(false);
                    setShowSuccess(true);
                    setTimeout(() => dismiss(), 2000);
                  }}
                  disabled={isRequesting}
                >
                  {isRequesting ? "..." : t("enable") || "Enable"}
                </Button>
                <Button size="sm" variant="ghost" onClick={dismiss}>
                  {t("notNow") || "Not Now"}
                </Button>
              </div>
            </div>
            <button
              onClick={dismiss}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Main permission request banner
  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 md:left-auto md:right-4 md:w-96">
      <div className="bg-background border border-border rounded-xl shadow-lg p-4 animate-in slide-in-from-bottom-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-[#DC143C]/10 flex items-center justify-center flex-shrink-0">
            <Bell className="h-5 w-5 text-[#DC143C]" />
          </div>
          <div className="flex-1 min-w-0">
            {showSuccess ? (
              <>
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500" />
                  <p className="font-medium text-sm">
                    {t("notificationsEnabled") || "Notifications Enabled!"}
                  </p>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {t("youWillReceiveNotifications") ||
                    "You'll now receive notifications for likes, replies, and messages."}
                </p>
              </>
            ) : (
              <>
                <p className="font-medium text-sm">
                  {t("stayConnected") || "Stay Connected"}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {t("notificationBannerText") ||
                    "Enable notifications to get alerts for likes, replies, messages, and new followers — even when Tsinephu is closed."}
                </p>

                {/* PWA Install prompt */}
                {canInstall && !isInstalled && (
                  <div className="mt-2 p-2 bg-muted rounded-lg">
                    <p className="text-xs text-muted-foreground">
                      {t("installForBetterExperience") ||
                        "Install Tsinephu as an app for the best notification experience."}
                    </p>
                    <Button
                      size="sm"
                      variant="outline"
                      className="mt-1 w-full"
                      onClick={async () => {
                        await installPWA();
                      }}
                    >
                      <Download className="h-3 w-3 mr-1" />
                      {t("installApp") || "Install App"}
                    </Button>
                  </div>
                )}

                <div className="flex gap-2 mt-3">
                  <Button
                    size="sm"
                    className="bg-[#DC143C] hover:bg-[#B01030]"
                    onClick={async () => {
                      setIsRequesting(true);
                      const result = await requestPermission();
                      if (result === "granted") {
                        await subscribe();
                        setShowSuccess(true);
                        setTimeout(() => dismiss(), 3000);
                      }
                      setIsRequesting(false);
                    }}
                    disabled={isRequesting}
                  >
                    <Bell className="h-3 w-3 mr-1" />
                    {isRequesting
                      ? "..."
                      : t("enableNotifications") || "Enable Notifications"}
                  </Button>
                  <Button size="sm" variant="ghost" onClick={dismiss}>
                    {t("notNow") || "Not Now"}
                  </Button>
                </div>
              </>
            )}
          </div>
          <button
            onClick={dismiss}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Notification Settings Panel
 * For use in the Settings page
 */
export function NotificationSettingsPanel() {
  const { t } = useLanguage();
  const {
    permission,
    isSupported,
    isSubscribed,
    isInstalled,
    canInstall,
    requestPermission,
    subscribe,
    unsubscribe,
    installPWA,
    showNotification,
  } = usePushNotifications();

  const [isLoading, setIsLoading] = useState(false);
  const [testSent, setTestSent] = useState(false);

  if (!isSupported) {
    return (
      <div className="p-4 bg-muted/50 rounded-lg">
        <p className="text-sm text-muted-foreground">
          {t("notificationsNotSupported") ||
            "Notifications are not supported in this browser."}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Permission Status */}
      <div className="flex items-center justify-between p-3 rounded-lg border">
        <div>
          <p className="font-medium">
            {t("notificationPermission") || "Notification Permission"}
          </p>
          <p className="text-sm text-muted-foreground">
            {permission === "granted"
              ? t("permissionGranted") || "Granted"
              : permission === "denied"
                ? t("permissionDenied") ||
                  "Denied - Please enable in browser settings"
                : t("permissionDefault") || "Not requested yet"}
          </p>
        </div>
        {permission === "default" && (
          <Button
            size="sm"
            className="bg-[#DC143C] hover:bg-[#B01030]"
            onClick={async () => {
              setIsLoading(true);
              await requestPermission();
              setIsLoading(false);
            }}
            disabled={isLoading}
          >
            {t("requestPermission") || "Request Permission"}
          </Button>
        )}
      </div>

      {/* Push Subscription */}
      {permission === "granted" && (
        <div className="flex items-center justify-between p-3 rounded-lg border">
          <div>
            <p className="font-medium">
              {t("pushNotifications") || "Push Notifications"}
            </p>
            <p className="text-sm text-muted-foreground">
              {isSubscribed
                ? t("pushSubscribed") || "Subscribed to push notifications"
                : t("pushNotSubscribed") ||
                  "Not subscribed to push notifications"}
            </p>
          </div>
          <Button
            size="sm"
            variant={isSubscribed ? "outline" : "default"}
            className={!isSubscribed ? "bg-[#DC143C] hover:bg-[#B01030]" : ""}
            onClick={async () => {
              setIsLoading(true);
              if (isSubscribed) {
                await unsubscribe();
              } else {
                await subscribe();
              }
              setIsLoading(false);
            }}
            disabled={isLoading}
          >
            {isLoading
              ? "..."
              : isSubscribed
                ? t("unsubscribe") || "Unsubscribe"
                : t("subscribe") || "Subscribe"}
          </Button>
        </div>
      )}

      {/* App Install Status */}
      <div className="flex items-center justify-between p-3 rounded-lg border">
        <div>
          <p className="font-medium">
            {t("appInstallation") || "App Installation"}
          </p>
          <p className="text-sm text-muted-foreground">
            {isInstalled
              ? t("appInstalled") || "Tsinephu is installed as an app"
              : canInstall
                ? t("appCanInstall") || "Tsinephu can be installed as an app"
                : t("appAlreadyBrowser") || "Running in browser"}
          </p>
        </div>
        {canInstall && !isInstalled && (
          <Button
            size="sm"
            variant="outline"
            onClick={async () => {
              setIsLoading(true);
              await installPWA();
              setIsLoading(false);
            }}
            disabled={isLoading}
          >
            <Download className="h-3 w-3 mr-1" />
            {t("install") || "Install"}
          </Button>
        )}
        {isInstalled && (
          <span className="text-sm text-green-500 flex items-center gap-1">
            <Check className="h-4 w-4" />
            {t("installed") || "Installed"}
          </span>
        )}
      </div>

      {/* Test Notification */}
      {permission === "granted" && (
        <div className="p-3 rounded-lg border">
          <p className="font-medium mb-2">
            {t("testNotification") || "Test Notification"}
          </p>
          <Button
            size="sm"
            variant="outline"
            onClick={async () => {
              await showNotification(
                t("testNotificationTitle") || "Tsinephu Test",
                {
                  body:
                    t("testNotificationBody") ||
                    "This is a test notification from Tsinephu!",
                  icon: "/icon-192x192.svg",
                  badge: "/icon-72x72.svg",
                  tag: "test-notification",
                  requireInteraction: false,
                },
              );
              setTestSent(true);
              setTimeout(() => setTestSent(false), 3000);
            }}
          >
            {testSent ? (
              <>
                <Check className="h-3 w-3 mr-1 text-green-500" />
                {t("sent") || "Sent!"}
              </>
            ) : (
              t("sendTest") || "Send Test"
            )}
          </Button>
        </div>
      )}

      {/* Information */}
      <div className="p-3 rounded-lg bg-muted/50 text-sm text-muted-foreground">
        <p className="font-medium text-foreground mb-1">
          {t("aboutNotifications") || "About Notifications"}
        </p>
        <p>
          {t("notificationInfoText") ||
            "Tsinephu uses Web Push technology to deliver notifications. For the best experience on Android, install Tsinephu as a Progressive Web App (PWA) from your browser menu. This allows notifications to work even outside the Play Store."}
        </p>
      </div>
    </div>
  );
}
