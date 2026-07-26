/**
 * Design tokens — must match PROJECT_ROADMAP.md Section 5 exactly.
 * Both mobile and admin frontends should read from their own copy of
 * these values so the "one design system, two apps" intent holds.
 */
/**
 * Design tokens. Two independent axes:
 *   - mode: light / dark — controls neutrals (background, text, etc.)
 *   - colorTheme: green / red / yellow / blue — controls the accent
 *     (`primary`) only, so any color theme works correctly in either mode.
 * `secondary` (navy) stays fixed to the logo's branding regardless of
 * colorTheme — it's not a user-facing "theme color," just a design accent.
 */
export type ColorThemeName = "green" | "red" | "yellow" | "blue";

const accents: Record<ColorThemeName, { light: string; dark: string; tintLight: string; tintDark: string }> = {
  green: { light: "#10B981", dark: "#10B981", tintLight: "#ECFDF5", tintDark: "#0F2A22" },
  red: { light: "#DC2626", dark: "#EF4444", tintLight: "#FEF2F2", tintDark: "#3A1414" },
  yellow: { light: "#D97706", dark: "#F59E0B", tintLight: "#FFFBEB", tintDark: "#3A2A0A" },
  blue: { light: "#2563EB", dark: "#3B82F6", tintLight: "#EFF6FF", tintDark: "#122740" },
};

const neutrals = {
  light: {
    background: "#FFFFFF",
    surface: "#F5F6F7",
    surfaceElevated: "#FFFFFF",
    secondary: "#1E3A5F",
    secondaryTint: "#EFF4F9",
    textPrimary: "#111827",
    textSecondary: "#6B7280",
    border: "#E5E7EB",
    danger: "#EF4444",
  },
  dark: {
    background: "#121212",
    surface: "#1E1E1E",
    surfaceElevated: "#252525",
    secondary: "#5B8DBE",
    secondaryTint: "#16232E",
    textPrimary: "#FFFFFF",
    textSecondary: "#9CA3AF",
    accent: "#34D399",
    border: "#2C2C2C",
    danger: "#F87171",
  },
} as const;

export function getThemeColors(mode: "light" | "dark", colorTheme: ColorThemeName) {
  const accent = accents[colorTheme];
  return {
    ...neutrals[mode],
    primary: mode === "dark" ? accent.dark : accent.light,
    primaryTint: mode === "dark" ? accent.tintDark : accent.tintLight,
  };
}

// Kept for any code that still imports the static palette directly —
// defaults to the green theme, same visual result as before this change.
export const colors = {
  light: getThemeColors("light", "green"),
  dark: getThemeColors("dark", "green"),
} as const;

export const shadow = {
  card: {
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
} as const;

export const statusColors = {
  pending: "#F59E0B",
  accepted: "#3B82F6",
  assigned: "#6366F1",
  in_progress: "#06B6D4",
  resolved: "#10B981",
  reopened: "#EF4444",
  closed: "#6B7280",
} as const;

export const radii = {
  md: 12,
  lg: 16,
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};
