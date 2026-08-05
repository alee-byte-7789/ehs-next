import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";

import { useAuth } from "./auth-context";
import { useLocale } from "./i18n/locale-context";
import { useAppTheme } from "./theme/theme-context";

export interface NavItem {
  key: string;
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  /** Shown right-aligned — used for the current Language / Theme value. */
  value?: string;
  onPress: () => void;
}

/**
 * Single source of truth for the app's navigation items.
 *
 * Both the mobile drawer (AppDrawer) and the desktop sidebar
 * (ResponsiveShell) render from this list, so adding a destination in one
 * place updates both. Previously the drawer owned this inline, which meant
 * a desktop sidebar would have silently drifted out of sync the first time
 * anything changed.
 */
export function useNavItems(onNavigate?: () => void): {
  items: NavItem[];
  logout: () => Promise<void>;
} {
  const { locale, setLocale } = useLocale();
  const { mode, setMode } = useAppTheme();
  const { logout: doLogout } = useAuth();

  const go = (path: string) => {
    onNavigate?.();
    router.push(path as never);
  };

  const cycleTheme = () => setMode(mode === "system" ? "light" : mode === "light" ? "dark" : "system");
  const themeLabel = mode === "system" ? "System" : mode === "light" ? "Light" : "Dark";
  const themeIcon: keyof typeof Ionicons.glyphMap =
    mode === "dark" ? "moon" : mode === "light" ? "sunny" : "phone-portrait";

  const items: NavItem[] = [
    { key: "home", icon: "home", label: "Home", onPress: () => go("/home") },
    { key: "complaints", icon: "document-text", label: "My Complaints", onPress: () => go("/complaints") },
    { key: "emergency", icon: "alert-circle", label: "Emergency", onPress: () => go("/emergency") },
    { key: "prayer", icon: "moon", label: "Prayer Timings", onPress: () => go("/prayer-timings") },
    { key: "notifications", icon: "notifications", label: "Notifications", onPress: () => go("/notifications") },
    { key: "profile", icon: "person", label: "Profile", onPress: () => go("/profile") },
    { key: "settings", icon: "settings", label: "Settings", onPress: () => go("/settings") },
    {
      key: "language",
      icon: "language",
      label: "Language",
      value: locale === "ur" ? "اردو" : "English",
      onPress: () => setLocale(locale === "en" ? "ur" : "en"),
    },
    { key: "theme", icon: themeIcon, label: "Theme", value: themeLabel, onPress: cycleTheme },
  ];

  const logout = async () => {
    onNavigate?.();
    await doLogout();
    router.replace("/login");
  };

  return { items, logout };
}
