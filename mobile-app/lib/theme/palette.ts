/**
 * EHS Next — Design tokens (v2, "Premium" pass).
 *
 * Model: ONE consistent neutral scale for light/dark (backgrounds, surfaces,
 * text, borders) + a swappable ACCENT hue layered on top (primary buttons,
 * links, active states, selected chips). This is the same pattern Linear /
 * Notion / Stripe Dashboard use for user-selectable "theme colors" — it
 * keeps the whole app calm and legible in every accent, instead of
 * repainting entire screens per color.
 *
 * Complaint status colors are semantic and intentionally do NOT follow the
 * accent — a "resolved" chip must always read as resolved regardless of
 * whether the resident picked purple or red as their app color.
 */

export type AccentKey =
  | "emerald"
  | "blue"
  | "purple"
  | "red"
  | "cyan"
  | "yellow"
  | "orange"
  | "rose";

export interface AccentSwatch {
  key: AccentKey;
  label: string;
  /** Solid accent color, used identically in light & dark mode. */
  base: string;
  /** Slightly deeper shade — pressed states, gradients. */
  strong: string;
  /** Low-opacity tint for chip/badge backgrounds, selected rows. */
  tintLight: string;
  tintDark: string;
  /** Color to place text/icons on top of `base`. */
  onBase: string;
}

export const ACCENTS: Record<AccentKey, AccentSwatch> = {
  emerald: {
    key: "emerald",
    label: "Emerald",
    base: "#10B981",
    strong: "#059669",
    tintLight: "#D1FAE5",
    tintDark: "#0B3B2E",
    onBase: "#FFFFFF",
  },
  blue: {
    key: "blue",
    label: "Blue",
    base: "#3B82F6",
    strong: "#2563EB",
    tintLight: "#DBEAFE",
    tintDark: "#0F2C57",
    onBase: "#FFFFFF",
  },
  purple: {
    key: "purple",
    label: "Purple",
    base: "#8B5CF6",
    strong: "#7C3AED",
    tintLight: "#EDE4FF",
    tintDark: "#2E1F52",
    onBase: "#FFFFFF",
  },
  red: {
    key: "red",
    label: "Red",
    base: "#EF4444",
    strong: "#DC2626",
    tintLight: "#FEE2E2",
    tintDark: "#4A1414",
    onBase: "#FFFFFF",
  },
  cyan: {
    key: "cyan",
    label: "Cyan",
    base: "#06B6D4",
    strong: "#0891B2",
    tintLight: "#CFFAFE",
    tintDark: "#0A3A42",
    onBase: "#04222A",
  },
  yellow: {
    key: "yellow",
    label: "Yellow",
    base: "#F5B700",
    strong: "#D69E00",
    tintLight: "#FFF3C4",
    tintDark: "#4A3A05",
    onBase: "#241C00",
  },
  orange: {
    key: "orange",
    label: "Orange",
    base: "#F97316",
    strong: "#EA580C",
    tintLight: "#FFE3CC",
    tintDark: "#4A2508",
    onBase: "#2A1400",
  },
  rose: {
    key: "rose",
    label: "Rose",
    base: "#F43F8B",
    strong: "#DB2777",
    tintLight: "#FCE4EF",
    tintDark: "#441026",
    onBase: "#FFFFFF",
  },
};

export const ACCENT_ORDER: AccentKey[] = [
  "emerald",
  "blue",
  "purple",
  "red",
  "cyan",
  "yellow",
  "orange",
  "rose",
];

/** Fixed neutral scale — identical shape for light & dark. */
export const NEUTRALS = {
  light: {
    background: "#FBFBFA",
    surface: "#FFFFFF",
    surfaceElevated: "#FFFFFF",
    surfaceSunken: "#F2F3F5",
    border: "#E7E8EC",
    borderStrong: "#D3D5DB",
    textPrimary: "#14161A",
    textSecondary: "#6B7076",
    textTertiary: "#9AA0A8",
    overlay: "rgba(17,20,24,0.45)",
    statusBarStyle: "dark" as const,
    shadowColor: "#14161A",
  },
  dark: {
    background: "#0B0C0E",
    surface: "#17181B",
    surfaceElevated: "#1E2024",
    surfaceSunken: "#101113",
    border: "#2A2C30",
    borderStrong: "#3A3D42",
    textPrimary: "#F5F6F7",
    textSecondary: "#A0A5AC",
    textTertiary: "#6D7178",
    overlay: "rgba(0,0,0,0.6)",
    statusBarStyle: "light" as const,
    shadowColor: "#000000",
  },
};

/** Semantic colors — do not shift with accent selection. */
export const SEMANTIC = {
  success: { base: "#10B981", tintLight: "#D1FAE5", tintDark: "#0B3B2E" },
  warning: { base: "#F59E0B", tintLight: "#FEF3C7", tintDark: "#453208" },
  danger: { base: "#EF4444", tintLight: "#FEE2E2", tintDark: "#4A1414" },
  info: { base: "#3B82F6", tintLight: "#DBEAFE", tintDark: "#0F2C57" },
};

/** Complaint lifecycle colors — fixed meaning across the whole app. */
export const STATUS_COLORS = {
  pending: SEMANTIC.warning.base,
  accepted: SEMANTIC.info.base,
  assigned: "#6366F1",
  in_progress: "#06B6D4",
  resolved: SEMANTIC.success.base,
  reopened: SEMANTIC.danger.base,
  closed: "#6B7280",
} as const;

export const RADII = { sm: 8, md: 14, lg: 20, xl: 28, pill: 999 };

export const SPACING = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48 };

export type DisplaySize = "small" | "default" | "large" | "xlarge";

/** Font scale multiplier — drives the Settings > Display option. */
export const DISPLAY_SCALE: Record<DisplaySize, number> = {
  small: 0.92,
  default: 1,
  large: 1.12,
  xlarge: 1.26,
};
