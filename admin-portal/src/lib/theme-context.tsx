import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type ThemeMode = "light" | "dark" | "system";
export type AccentKey = "emerald" | "blue" | "purple" | "red" | "cyan" | "yellow" | "orange" | "rose";

export const ACCENT_ORDER: AccentKey[] = ["emerald", "blue", "purple", "red", "cyan", "yellow", "orange", "rose"];

export const ACCENT_LABELS: Record<AccentKey, string> = {
  emerald: "Emerald", blue: "Blue", purple: "Purple", red: "Red",
  cyan: "Cyan", yellow: "Yellow", orange: "Orange", rose: "Rose",
};

export const ACCENT_SWATCH: Record<AccentKey, string> = {
  emerald: "#10B981", blue: "#3B82F6", purple: "#8B5CF6", red: "#EF4444",
  cyan: "#06B6D4", yellow: "#F5B700", orange: "#F97316", rose: "#F43F8B",
};

interface ThemeContextValue {
  mode: ThemeMode;
  setMode: (m: ThemeMode) => void;
  accent: AccentKey;
  setAccent: (a: AccentKey) => void;
  glassEffect: boolean;
  setGlassEffect: (v: boolean) => void;
  isDark: boolean;
}

const STORAGE_KEY = "ehs_admin_theme";
const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

function loadStored(): { mode: ThemeMode; accent: AccentKey; glassEffect: boolean } {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return { mode: "system", accent: "emerald", glassEffect: true, ...JSON.parse(raw) };
  } catch {
    // corrupt/unavailable storage — fall through to defaults
  }
  return { mode: "system", accent: "emerald", glassEffect: true };
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState(loadStored);
  const [systemPrefersDark, setSystemPrefersDark] = useState(
    () => window.matchMedia?.("(prefers-color-scheme: dark)").matches ?? false
  );

  useEffect(() => {
    const query = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = (e: MediaQueryListEvent) => setSystemPrefersDark(e.matches);
    query.addEventListener("change", handler);
    return () => query.removeEventListener("change", handler);
  }, []);

  const isDark = state.mode === "system" ? systemPrefersDark : state.mode === "dark";

  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute("data-theme", isDark ? "dark" : "light");
    root.setAttribute("data-accent", state.accent);
    root.setAttribute("data-glass", state.glassEffect ? "on" : "off");
  }, [isDark, state.accent, state.glassEffect]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  const value: ThemeContextValue = {
    mode: state.mode,
    setMode: (mode) => setState((s) => ({ ...s, mode })),
    accent: state.accent,
    setAccent: (accent) => setState((s) => ({ ...s, accent })),
    glassEffect: state.glassEffect,
    setGlassEffect: (glassEffect) => setState((s) => ({ ...s, glassEffect })),
    isDark,
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useAdminTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useAdminTheme must be used within a ThemeProvider");
  return ctx;
}
