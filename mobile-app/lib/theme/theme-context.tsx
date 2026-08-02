import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useColorScheme } from "react-native";

import {
  ACCENTS,
  DISPLAY_SCALE,
  NEUTRALS,
  RADII,
  SEMANTIC,
  SPACING,
  STATUS_COLORS,
  type AccentKey,
  type DisplaySize,
} from "./palette";

export type ThemeMode = "light" | "dark" | "system";

const MODE_KEY = "ehs_theme_mode";
const ACCENT_KEY = "ehs_theme_accent";
const DISPLAY_KEY = "ehs_theme_display_size";

/** The fully resolved token set a screen actually consumes. */
export function buildTokens(resolvedMode: "light" | "dark", accent: AccentKey) {
  const neutrals = NEUTRALS[resolvedMode];
  const swatch = ACCENTS[accent];
  const isDark = resolvedMode === "dark";

  return {
    mode: resolvedMode,
    isDark,
    // Neutrals
    background: neutrals.background,
    surface: neutrals.surface,
    surfaceElevated: neutrals.surfaceElevated,
    surfaceSunken: neutrals.surfaceSunken,
    border: neutrals.border,
    borderStrong: neutrals.borderStrong,
    textPrimary: neutrals.textPrimary,
    textSecondary: neutrals.textSecondary,
    textTertiary: neutrals.textTertiary,
    overlay: neutrals.overlay,
    statusBarStyle: neutrals.statusBarStyle,
    shadowColor: neutrals.shadowColor,
    // Accent
    primary: swatch.base,
    primaryStrong: swatch.strong,
    primaryTint: isDark ? swatch.tintDark : swatch.tintLight,
    onPrimary: swatch.onBase,
    // Semantic (fixed)
    success: SEMANTIC.success.base,
    successTint: isDark ? SEMANTIC.success.tintDark : SEMANTIC.success.tintLight,
    warning: SEMANTIC.warning.base,
    warningTint: isDark ? SEMANTIC.warning.tintDark : SEMANTIC.warning.tintLight,
    danger: SEMANTIC.danger.base,
    dangerTint: isDark ? SEMANTIC.danger.tintDark : SEMANTIC.danger.tintLight,
    info: SEMANTIC.info.base,
    infoTint: isDark ? SEMANTIC.info.tintDark : SEMANTIC.info.tintLight,
    // Complaint status colors
    status: STATUS_COLORS,
    // Layout
    radii: RADII,
    spacing: SPACING,
  };
}

export type ThemeTokens = ReturnType<typeof buildTokens>;

interface ThemeContextValue {
  mode: ThemeMode;
  resolvedMode: "light" | "dark";
  accent: AccentKey;
  displaySize: DisplaySize;
  fontScale: number;
  colors: ThemeTokens;
  setMode: (mode: ThemeMode) => void;
  setAccent: (accent: AccentKey) => void;
  setDisplaySize: (size: DisplaySize) => void;
  ready: boolean;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const systemScheme = useColorScheme();
  const [mode, setModeState] = useState<ThemeMode>("system");
  const [accent, setAccentState] = useState<AccentKey>("emerald");
  const [displaySize, setDisplaySizeState] = useState<DisplaySize>("default");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const [storedMode, storedAccent, storedDisplay] = await Promise.all([
          AsyncStorage.getItem(MODE_KEY),
          AsyncStorage.getItem(ACCENT_KEY),
          AsyncStorage.getItem(DISPLAY_KEY),
        ]);
        if (storedMode === "light" || storedMode === "dark" || storedMode === "system") {
          setModeState(storedMode);
        }
        if (storedAccent && storedAccent in ACCENTS) {
          setAccentState(storedAccent as AccentKey);
        }
        if (
          storedDisplay === "small" ||
          storedDisplay === "default" ||
          storedDisplay === "large" ||
          storedDisplay === "xlarge"
        ) {
          setDisplaySizeState(storedDisplay);
        }
      } finally {
        setReady(true);
      }
    })();
  }, []);

  const setMode = useCallback((next: ThemeMode) => {
    setModeState(next);
    AsyncStorage.setItem(MODE_KEY, next).catch(() => undefined);
  }, []);

  const setAccent = useCallback((next: AccentKey) => {
    setAccentState(next);
    AsyncStorage.setItem(ACCENT_KEY, next).catch(() => undefined);
  }, []);

  const setDisplaySize = useCallback((next: DisplaySize) => {
    setDisplaySizeState(next);
    AsyncStorage.setItem(DISPLAY_KEY, next).catch(() => undefined);
  }, []);

  const resolvedMode: "light" | "dark" =
    mode === "system" ? (systemScheme === "dark" ? "dark" : "light") : mode;

  const colors = useMemo(() => buildTokens(resolvedMode, accent), [resolvedMode, accent]);

  const value = useMemo<ThemeContextValue>(
    () => ({
      mode,
      resolvedMode,
      accent,
      displaySize,
      fontScale: DISPLAY_SCALE[displaySize],
      colors,
      setMode,
      setAccent,
      setDisplaySize,
      ready,
    }),
    [mode, resolvedMode, accent, displaySize, colors, setMode, setAccent, setDisplaySize, ready]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useAppTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useAppTheme must be used within a ThemeProvider");
  return ctx;
}
