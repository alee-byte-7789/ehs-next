import { apiClient } from "./api-client";

const firebaseConfig = {
  apiKey: "AIzaSyBkWtUO3wu_Xg_BZWd6dIBVslmowH9tTdE",
  authDomain: "ehs-next.firebaseapp.com",
  projectId: "ehs-next",
  storageBucket: "ehs-next.firebasestorage.app",
  messagingSenderId: "471386416446",
  appId: "1:471386416446:web:6b0f833a9f82b1f119f86f",
};

const VAPID_KEY =
  "BOYAhoubHjLOoL8yl41iU_Z9zGRy3XEFrR_HLJRP1rfN3elEVFAkc86wmrUmlNzsH0DhN7duwgl0farZkYUseZM";

/**
 * Registers this admin's browser for push notifications. Same pattern
 * as the resident PWA — safe to call unconditionally, swallows its own
 * errors so a denied permission never breaks the dashboard.
 */
export async function registerAdminForWebPush(): Promise<void> {
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
      await apiClient.post("/admins/me/fcm-token", { push_token: token });
    }
  } catch {
    // Never let push registration failure break the dashboard.
  }
}
