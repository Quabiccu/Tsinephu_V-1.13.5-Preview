import { useState, useEffect, useCallback, useRef } from "react";

/**
 * Hook for managing Web Push Notifications
 * Handles permission requests, subscription, and service worker communication
 */
export function usePushNotifications() {
  const [permission, setPermission] =
    useState<NotificationPermission>("default");
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [subscription, setSubscription] = useState<PushSubscription | null>(
    null,
  );
  const [canInstall, setCanInstall] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [beforeInstallPrompt, setBeforeInstallPrompt] = useState<any>(null);
  const [badgeCount, setBadgeCount] = useState(0);
  const swRegistration = useRef<ServiceWorkerRegistration | null>(null);

  // Check support and current state
  useEffect(() => {
    const checkSupport = () => {
      const hasSW = "serviceWorker" in navigator;
      const hasPush = "PushManager" in window;
      const hasNotifications = "Notification" in window;
      setIsSupported(hasSW && hasPush && hasNotifications);

      if (hasNotifications) {
        setPermission(Notification.permission);
      }

      // Check if running as installed PWA
      if (window.matchMedia("(display-mode: standalone)").matches) {
        setIsInstalled(true);
      }
    };

    checkSupport();

    // Listen for install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setBeforeInstallPrompt(e);
      setCanInstall(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    // Listen for app installed
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setCanInstall(false);
      setBeforeInstallPrompt(null);
    };

    window.addEventListener("appinstalled", handleAppInstalled);

    // Listen for display mode changes
    const mql = window.matchMedia("(display-mode: standalone)");
    const handleDisplayModeChange = (e: MediaQueryListEvent) => {
      setIsInstalled(e.matches);
    };
    mql.addEventListener("change", handleDisplayModeChange);

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt,
      );
      window.removeEventListener("appinstalled", handleAppInstalled);
      mql.removeEventListener("change", handleDisplayModeChange);
    };
  }, []);

  // Get service worker registration and check subscription
  useEffect(() => {
    if (!isSupported) return;

    const getSubscription = async () => {
      try {
        const registration = await navigator.serviceWorker.ready;
        swRegistration.current = registration;

        const existingSubscription =
          await registration.pushManager.getSubscription();
        if (existingSubscription) {
          setSubscription(existingSubscription);
          setIsSubscribed(true);
        }
      } catch (error) {
        console.error("Error getting push subscription:", error);
      }
    };

    getSubscription();
  }, [isSupported]);

  // Request notification permission
  const requestPermission =
    useCallback(async (): Promise<NotificationPermission> => {
      if (!isSupported) return "denied";

      try {
        const result = await Notification.requestPermission();
        setPermission(result);
        return result;
      } catch (error) {
        console.error("Error requesting notification permission:", error);
        return "denied";
      }
    }, [isSupported]);

  // Subscribe to push notifications
  const subscribe = useCallback(async (): Promise<PushSubscription | null> => {
    if (!isSupported || !swRegistration.current) return null;

    try {
      // First request permission
      const perm = await requestPermission();
      if (perm !== "granted") return null;

      // Generate or get application server key
      // In production, this would come from your server
      const applicationServerKey = urlBase64ToUint8Array(
        "BEl62iTMXTXPldWa8P7wYGR734S6oJTpTW7o7j_Da9JZkC9w-0jFrAwG2YHRKkkfJmG6yZlLleVLPqFE_hEvZ0E",
      );

      const newSubscription =
        await swRegistration.current.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: applicationServerKey as BufferSource,
        });

      setSubscription(newSubscription);
      setIsSubscribed(true);

      // In production, send subscription to server
      // await sendSubscriptionToServer(newSubscription);

      return newSubscription;
    } catch (error) {
      console.error("Error subscribing to push:", error);
      return null;
    }
  }, [isSupported, requestPermission]);

  // Unsubscribe from push notifications
  const unsubscribe = useCallback(async (): Promise<boolean> => {
    if (!subscription) return false;

    try {
      const result = await subscription.unsubscribe();
      if (result) {
        setSubscription(null);
        setIsSubscribed(false);
      }
      return result;
    } catch (error) {
      console.error("Error unsubscribing from push:", error);
      return false;
    }
  }, [subscription]);

  // Show a local notification
  const showNotification = useCallback(
    async (title: string, options?: NotificationOptions) => {
      if (!isSupported || permission !== "granted") return false;

      try {
        const registration = await navigator.serviceWorker.ready;
        await registration.showNotification(title, {
          icon: "/icon-192x192.svg",
          badge: "/icon-72x72.svg",
          tag: `tsinephu-${Date.now()}`,
          requireInteraction: false,
          ...options,
        });
        return true;
      } catch (error) {
        console.error("Error showing notification:", error);
        return false;
      }
    },
    [isSupported, permission],
  );

  // Schedule a notification
  const scheduleNotification = useCallback(
    (title: string, options: NotificationOptions & { delay?: number }) => {
      const { delay = 0, ...notificationOptions } = options;

      setTimeout(async () => {
        await showNotification(title, notificationOptions);
      }, delay);
    },
    [showNotification],
  );

  // Update app badge count
  const updateBadge = useCallback(async (count: number) => {
    setBadgeCount(count);

    if ("setAppBadge" in navigator) {
      try {
        if (count > 0) {
          await (navigator as any).setAppBadge(count);
        } else {
          await (navigator as any).clearAppBadge();
        }
      } catch (error) {
        console.error("Error updating badge:", error);
      }
    }

    // Also send to service worker for persistence
    if (swRegistration.current?.active) {
      swRegistration.current.active.postMessage({
        type: "UPDATE_BADGE",
        payload: { count },
      });
    }
  }, []);

  // Install the PWA
  const installPWA = useCallback(async (): Promise<boolean> => {
    if (!beforeInstallPrompt) return false;

    try {
      beforeInstallPrompt.prompt();
      const { outcome } = await beforeInstallPrompt.userChoice;

      if (outcome === "accepted") {
        setCanInstall(false);
        setBeforeInstallPrompt(null);
        return true;
      }
      return false;
    } catch (error) {
      console.error("Error installing PWA:", error);
      return false;
    }
  }, [beforeInstallPrompt]);

  // Request persistent storage
  const requestPersistentStorage = useCallback(async (): Promise<boolean> => {
    if (!navigator.storage || !navigator.storage.persist) return false;

    try {
      const isPersistent = await navigator.storage.persist();
      return isPersistent;
    } catch (error) {
      console.error("Error requesting persistent storage:", error);
      return false;
    }
  }, []);

  // Register for periodic background sync (Android)
  const registerPeriodicSync = useCallback(
    async (tag: string, minInterval: number) => {
      if (!swRegistration.current) return false;

      try {
        // @ts-ignore - periodicSync is not in all browsers yet
        if (swRegistration.current.periodicSync) {
          // @ts-ignore
          await swRegistration.current.periodicSync.register(tag, {
            minInterval,
          });
          return true;
        }
        return false;
      } catch (error) {
        console.error("Error registering periodic sync:", error);
        return false;
      }
    },
    [],
  );

  // Register for background sync
  const registerBackgroundSync = useCallback(async (tag: string) => {
    if (!swRegistration.current) return false;

    try {
      // @ts-ignore - sync is not in all browsers yet
      if (swRegistration.current.sync) {
        // @ts-ignore
        await swRegistration.current.sync.register(tag);
        return true;
      }
      return false;
    } catch (error) {
      console.error("Error registering background sync:", error);
      return false;
    }
  }, []);

  return {
    permission,
    isSupported,
    isSubscribed,
    subscription,
    canInstall,
    isInstalled,
    badgeCount,
    requestPermission,
    subscribe,
    unsubscribe,
    showNotification,
    scheduleNotification,
    updateBadge,
    installPWA,
    requestPersistentStorage,
    registerPeriodicSync,
    registerBackgroundSync,
    swRegistration: swRegistration.current,
  };
}

// Helper function to convert VAPID key
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = (window as any).atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

/**
 * Hook for managing notification permission UI state
 */
export function useNotificationUI() {
  const [showBanner, setShowBanner] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Check if user previously dismissed
    const dismissedPref = localStorage.getItem(
      "tsinephu-notification-dismissed",
    );
    if (dismissedPref) {
      const dismissedDate = new Date(dismissedPref);
      const now = new Date();
      // Only show again after 7 days
      if (now.getTime() - dismissedDate.getTime() < 7 * 24 * 60 * 60 * 1000) {
        setDismissed(true);
        return;
      }
    }

    // Check if notifications are already granted or denied
    if ("Notification" in window) {
      const permission = Notification.permission;
      if (permission === "granted" || permission === "denied") {
        setDismissed(true);
        return;
      }
    }

    // Show banner after a delay
    const timer = setTimeout(() => {
      setShowBanner(true);
    }, 5000);

    return () => clearTimeout(timer);
  }, []);

  const dismiss = useCallback(() => {
    setShowBanner(false);
    setDismissed(true);
    localStorage.setItem(
      "tsinephu-notification-dismissed",
      new Date().toISOString(),
    );
  }, []);

  return {
    showBanner,
    dismissed,
    dismiss,
  };
}
