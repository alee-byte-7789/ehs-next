import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type ThemeMode = "system" | "light" | "dark";
export type FontScale = "small" | "default" | "large" | "extra_large";
export type Language = "en" | "ur";

export interface NotificationPrefs {
  complaintUpdates: boolean;
  announcements: boolean;
  emergencyAlerts: boolean;
  general: boolean;
}

interface Settings {
  themeMode: ThemeMode;
  fontScale: FontScale;
  language: Language;
  notifications: NotificationPrefs;
}

interface SettingsContextValue extends Settings {
  setThemeMode: (mode: ThemeMode) => void;
  setFontScale: (scale: FontScale) => void;
  setLanguage: (lang: Language) => void;
  setNotificationPref: (key: keyof NotificationPrefs, value: boolean) => void;
  isLoaded: boolean;
}

const STORAGE_KEY = "ehs_app_settings";

const DEFAULT_SETTINGS: Settings = {
  themeMode: "system",
  fontScale: "default",
  language: "en",
  notifications: {
    complaintUpdates: true,
    announcements: true,
    emergencyAlerts: true,
    general: true,
  },
};

/** Multiplier applied to base font sizes app-wide — see components that
 * read `fontScaleMultiplier(fontScale)` from lib/theme.ts. */
export function fontScaleMultiplier(scale: FontScale): number {
  switch (scale) {
    case "small": return 0.9;
    case "large": return 1.15;
    case "extra_large": return 1.3;
    default: return 1;
  }
}

const SettingsContext = createContext<SettingsContextValue | undefined>(undefined);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((raw) => {
      if (raw) {
        try {
          setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(raw) });
        } catch {
          // corrupt stored value — fall back to defaults silently
        }
      }
      setIsLoaded(true);
    });
  }, []);

  const persist = (next: Settings) => {
    setSettings(next);
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch(() => undefined);
  };

  const value: SettingsContextValue = {
    ...settings,
    isLoaded,
    setThemeMode: (themeMode) => persist({ ...settings, themeMode }),
    setFontScale: (fontScale) => persist({ ...settings, fontScale }),
    setLanguage: (language) => persist({ ...settings, language }),
    setNotificationPref: (key, val) =>
      persist({ ...settings, notifications: { ...settings.notifications, [key]: val } }),
  };

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings(): SettingsContextValue {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error("useSettings must be used within a SettingsProvider");
  return ctx;
}
