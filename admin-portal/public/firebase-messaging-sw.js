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

messaging.onBackgroundMessage((payload) => {
  const title = payload.notification?.title ?? "EHS Next Admin";
  const body = payload.notification?.body ?? "";
  const link = payload.data?.link ?? "/";
  self.registration.showNotification(title, {
    body,
    icon: "/icons/icon-192.png",
    badge: "/icons/icon-192.png",
    data: { link },
  });
});

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
