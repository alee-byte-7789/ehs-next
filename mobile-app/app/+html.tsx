import { ScrollViewStyleReset } from "expo-router/html";
import { type PropsWithChildren } from "react";

/**
 * Custom HTML shell for the web (static) export.
 *
 * WHY THIS FILE EXISTS
 * --------------------
 * The `expo.web` block in app.json (name / shortName / themeColor /
 * display: "standalone") is only honoured by Expo's OLD webpack builder.
 * This project uses Metro with `output: "static"`, which silently ignores
 * those fields and emits NO PWA manifest and NO Apple meta tags at all.
 *
 * That was fatal on iPhone: iOS only delivers Web Push to a genuinely
 * home-screen-INSTALLED PWA, and without `<link rel="manifest">` plus
 * display:standalone, "Add to Home Screen" produces a plain bookmark that
 * still runs in Safari — so push could never arrive, no matter how correct
 * the Firebase code was. The Admin Portal worked on phones only because
 * vite-plugin-pwa generates a real manifest for it.
 *
 * `+html.tsx` is Expo Router's supported way to customise this shell, so
 * these tags survive every export rather than being patched in after build.
 */
export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        {/* viewport-fit=cover so the app fills the screen under iOS notches
            once it's running standalone from the home screen. */}
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, shrink-to-fit=no, viewport-fit=cover"
        />

        {/* The manifest is what makes this an installable PWA — and on iOS,
            what makes Web Push possible at all. */}
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#10B981" />

        {/* iOS ignores the manifest for several of these and needs its own
            tags; without them an installed icon can still launch in Safari. */}
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="EHS Next" />
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />

        <meta
          name="description"
          content="Register and track complaints for Employees Housing Society."
        />

        {/* Expo Router: keeps the root scroll behaviour consistent on web. */}
        <ScrollViewStyleReset />
      </head>
      <body>{children}</body>
    </html>
  );
}
