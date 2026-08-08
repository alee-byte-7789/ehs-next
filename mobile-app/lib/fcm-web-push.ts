import { Platform } from "react-native";

import { apiClient } from "./api-client";

const firebaseConfig = {
  apiKey: "AIzaSyBkWtUO3wu_Xg_BZWd6dIBVslmowH9tTdE",
  authDomain: "ehs-next.firebaseapp.com",
  projectId: "ehs-next",
  storageBucket: "ehs-next.firebasestorage.app",
  messagingSenderId: "471386416446",
  appId: "1:471386416446:web:6b0f833a9f82b1f119f86f",
};

// Public VAPID key (the "P" in VAPID) — safe to ship in client code by
// design, same as the Firebase config above. Not a secret.
const VAPID_KEY =
  "BOYAhoubHjLOoL8yl41iU_Z9zGRy3XEFrR_HLJRP1rfN3elEVFAkc86wmrUmlNzsH0DhN7duwgl0farZkYUseZM";

export type WebPushResult = "unsupported" | "granted" | "denied" | "default" | "error";

/**
 * Checks the CURRENT permission state without prompting — a browser
 * that was denied once will silently never ask again, and until now
 * this app had no way to detect or surface that. This is what lets the
 * UI show a real "notifications are blocked, here's how to fix it"
 * message instead of things just silently never arriving.
 */
export function getWebPushPermissionState(): WebPushResult {
  if (Platform.OS !== "web") return "unsupported";
  if (typeof window === "undefined" || typeof Notification === "undefined") return "unsupported";
  return Notification.permission as WebPushResult;
}

/**
 * Registers this browser for Firebase web push and sends the resulting
 * FCM token to our backend. Web-only — the native app uses a completely
 * separate system (Expo's own push service, see push-notifications.ts).
 *
 * Returns the actual outcome instead of swallowing it silently, so
 * callers can show the user something real (e.g. "notifications are
 * blocked — here's how to fix it") rather than nothing happening with
 * no explanation.
 */
/**
 * Obtains an FCM token WITHOUT sending it anywhere.
 *
 * registerForWebPush() posts the token to an authenticated endpoint, which
 * is no use during registration — the resident has no account yet. This
 * returns the raw token so it can be included in the registration payload
 * instead, which is the only chance to capture a device before approval
 * (a pending resident cannot log in).
 */
export async function getWebPushToken(): Promise<string | null> {
  if (Platform.OS !== "web") return null;
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) return null;
  if (typeof Notification === "undefined") return null;

  try {
    const permission = await Notification.requestPermission();
    if (permission !== "granted") return null;

    const registration = await navigator.serviceWorker.register("/firebase-messaging-sw.js", {
      scope: "/firebase-cloud-messaging-push-scope",
    });
    const { initializeApp } = await import("firebase/app");
    const { getMessaging, getToken } = await import("firebase/messaging");
    const messaging = getMessaging(initializeApp(firebaseConfig));
    return (await getToken(messaging, { vapidKey: VAPID_KEY, serviceWorkerRegistration: registration })) || null;
  } catch {
    return null;
  }
}

export async function registerForWebPush(): Promise<WebPushResult> {
  if (Platform.OS !== "web") return "unsupported";
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) return "unsupported";
  if (typeof Notification === "undefined") return "unsupported";

  try {
    const permission = await Notification.requestPermission();
    if (permission !== "granted") return permission as WebPushResult;

    // Dedicated scope (Firebase's own default) rather than "/", so this
    // worker can never collide with an app-level service worker. See the
    // admin portal's copy of this file for the full explanation — that
    // collision is what made Firebase report success while nothing
    // actually displayed.
    const registration = await navigator.serviceWorker.register("/firebase-messaging-sw.js", {
      scope: "/firebase-cloud-messaging-push-scope",
    });

    const { initializeApp } = await import("firebase/app");
    const { getMessaging, getToken, onMessage } = await import("firebase/messaging");

    const app = initializeApp(firebaseConfig);
    const messaging = getMessaging(app);

    onMessage(messaging, (payload) => {
      const title = payload.notification?.title ?? "EHS Next";
      const body = payload.notification?.body ?? "";
      const link = payload.data?.link ?? "/";
      registration.showNotification(title, {
        body,
        icon: "/icons/icon-192.png",
        badge: "/icons/icon-192.png",
        data: { link },
      });
    });

    const token = await getToken(messaging, {
      vapidKey: VAPID_KEY,
      serviceWorkerRegistration: registration,
    });

    if (token) {
      await apiClient.post("/residents/me/fcm-token", { push_token: token });
      return "granted";
    }
    return "error";
  } catch {
    return "error";
  }
}
