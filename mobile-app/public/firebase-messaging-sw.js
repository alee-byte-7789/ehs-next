// Firebase Cloud Messaging service worker.
//
// This file MUST be plain JavaScript (no bundler, no imports) — it's
// loaded directly by the browser as a raw script, not through Metro/
// Expo's bundling pipeline. That's why the Firebase config is duplicated
// here rather than imported from lib/ — service workers can't reach into
// the app bundle. Version pinned to match the `firebase` npm package
// version used elsewhere in this app (12.17.0).

importScripts("https://www.gstatic.com/firebasejs/12.17.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/12.17.0/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey: "AIzaSyBkWtUO3wu_Xg_BZWd6dIBVslmowH9tTdE",
  authDomain: "ehs-next.firebaseapp.com",
  projectId: "ehs-next",
  storageBucket: "ehs-next.firebasestorage.app",
  messagingSenderId: "471386416446",
  appId: "1:471386416446:web:6b0f833a9f82b1f119f86f",
});

const messaging = firebase.messaging();

// Fires when a push arrives while the PWA tab is NOT focused/open — this
// is what actually shows up in the phone/desktop notification tray.
messaging.onBackgroundMessage((payload) => {
  const title = payload.notification?.title ?? "EHS Next";
  const body = payload.notification?.body ?? "";
  const link = payload.data?.link ?? "/";

  self.registration.showNotification(title, {
    body,
    icon: "/icons/icon-192.png",
    badge: "/icons/icon-192.png",
    data: { link },
  });
});

// Real gap fixed here: there was no click handler at all before this —
// tapping a notification just closed it and did nothing else. Now it
// focuses an existing app window if one's open (navigating it to the
// link), or opens a new one at that link if not.
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const link = event.notification.data?.link || "/";

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if ("focus" in client) {
          client.navigate(link);
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(link);
      }
    })
  );
});
