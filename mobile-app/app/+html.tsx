import { ScrollViewStyleReset } from "expo-router/html";

/**
 * Expo Router's static web export uses this file to build the root HTML
 * document wrapping every page. This is the only mechanism for injecting
 * PWA-related <head> tags (manifest link, theme-color, iOS home-screen
 * meta tags) since Expo's default export doesn't include them — verified
 * directly: a plain `expo export --platform web` produced zero manifest
 * or PWA meta tags at all before this file existed.
 */
export default function Root({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <title>EHS Next</title>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, shrink-to-fit=no, viewport-fit=cover" />

        {/* Android / Chrome PWA installability */}
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#10B981" />

        {/* iOS Safari "Add to Home Screen" — Safari ignores manifest.json
            for standalone/full-screen behavior and uses these meta tags
            instead. */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="EHS Next" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />

        <ScrollViewStyleReset />
      </head>
      <body>{children}</body>
    </html>
  );
}
