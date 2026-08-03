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

/**
 * Registers this browser for Firebase web push and sends the resulting
 * FCM token to our backend. Web-only — the native app uses a completely
 * separate system (Expo's own push service, see push-notifications.ts).
 *
 * Safe to call unconditionally: no-ops on native, and swallows its own
 * errors so a denied permission or unsupported browser never breaks app
 * startup.
 */
export async function registerForWebPush(): Promise<void> {
  if (Platform.OS !== "web") return;
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;
  if (typeof Notification === "undefined") return;

  try {
    const permission = await Notification.requestPermission();
    if (permission !== "granted") return;

    const registration = await navigator.serviceWorker.register("/firebase-messaging-sw.js");

    const { initializeApp } = await import("firebase/app");
    const { getMessaging, getToken } = await import("firebase/messaging");

    const app = initializeApp(firebaseConfig);
    const messaging = getMessaging(app);

    const token = await getToken(messaging, {
      vapidKey: VAPID_KEY,
      serviceWorkerRegistration: registration,
    });

    if (token) {
      await apiClient.post("/residents/me/fcm-token", { push_token: token });
    }
  } catch {
    // Never let push registration failure break app startup.
  }
}
