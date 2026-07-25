import { useEffect, useState } from "react";
import { Platform, useColorScheme as useRNColorScheme } from "react-native";

import { colors } from "./theme";
import { useSettings } from "./settings-context";

/**
 * On web, this app is statically pre-rendered (`expo export --platform
 * web`) — the build runs in a headless Node environment with no real
 * browser, so react-native-web's Appearance module can bake in whatever
 * `window.matchMedia` happened to report AT BUILD TIME (usually 'light',
 * since there's no OS preference to read), and if hydration doesn't
 * re-check it, the app gets stuck on that stale build-time value instead
 * of the user's actual device setting. This was a real, confirmed bug —
 * not a hypothetical one.
 *
 * Fix: on web specifically, explicitly re-read `window.matchMedia`
 * ourselves in an effect (guaranteed to run client-side, after mount,
 * in the user's real browser), and subscribe to live changes so OS theme
 * switches apply instantly.
 */
function useSystemColorScheme(): "light" | "dark" {
  const rnScheme = useRNColorScheme();
  const [webScheme, setWebScheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    if (Platform.OS !== "web" || typeof window === "undefined" || !window.matchMedia) return;

    const query = window.matchMedia("(prefers-color-scheme: dark)");
    setWebScheme(query.matches ? "dark" : "light");

    const handler = (e: MediaQueryListEvent) => setWebScheme(e.matches ? "dark" : "light");
    query.addEventListener("change", handler);
    return () => query.removeEventListener("change", handler);
  }, []);

  if (Platform.OS === "web") return webScheme;
  // "unspecified" (a possible value on some Android versions) and null
  // both fall back to light, same as react-native-web's own default.
  return rnScheme === "dark" ? "dark" : "light";
}

export function useTheme() {
  const systemScheme = useSystemColorScheme();
  const { themeMode } = useSettings();

  const effectiveScheme = themeMode === "system" ? systemScheme : themeMode;
  return effectiveScheme === "dark" ? colors.dark : colors.light;
}
