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
  self.registration.showNotification(title, {
    body,
    icon: "/icons/icon-192.png",
    badge: "/icons/icon-192.png",
  });
});
