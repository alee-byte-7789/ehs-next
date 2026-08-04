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

    // Dedicated scope — NOT the default "/".
    //
    // vite-plugin-pwa registers its own Workbox service worker at /sw.js
    // with scope "/". Registering a DIFFERENT script at an existing scope
    // replaces that registration, so these two were clobbering each
    // other. If Workbox's sw.js won, push messages arrived at a worker
    // with no Firebase handler — Firebase would report success while
    // nothing ever displayed.
    //
    // "/firebase-cloud-messaging-push-scope" is the same scope Firebase's
    // own SDK uses by default, for exactly this reason. Both workers now
    // coexist: sw.js keeps handling offline caching, this one handles
    // push. Push delivery is bound to the registration passed to
    // getToken() below, not to page scope, so a narrow scope is fine.
    const registration = await navigator.serviceWorker.register("/firebase-messaging-sw.js", {
      scope: "/firebase-cloud-messaging-push-scope",
    });

    const { initializeApp } = await import("firebase/app");
    const { getMessaging, getToken } = await import("firebase/messaging");

    const app = initializeApp(firebaseConfig);
    const messaging = getMessaging(app);

    const { onMessage } = await import("firebase/messaging");
    onMessage(messaging, (payload) => {
      const title = payload.notification?.title ?? "EHS Next Admin";
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
      await apiClient.post("/admins/me/fcm-token", { push_token: token });
    }
  } catch {
    // Never let push registration failure break the dashboard.
  }
}
