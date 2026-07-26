/**
 * Design tokens — must match PROJECT_ROADMAP.md Section 5 exactly.
 * Both mobile and admin frontends should read from their own copy of
 * these values so the "one design system, two apps" intent holds.
 */
/**
 * Design tokens. Palette derived from the actual EHS Next logo (navy
 * blue house + emerald green arrow) — a deliberate two-color system with
 * muted neutrals, not a rainbow. `secondary` (navy) is used for visual
 * variety on things like panel tiles and info cards, `primary` (emerald)
 * stays reserved for actions/CTAs so it keeps its meaning.
 */
export const colors = {
  light: {
    primary: "#10B981",
    primaryTint: "#ECFDF5",
    secondary: "#1E3A5F",
    secondaryTint: "#EFF4F9",
    background: "#FFFFFF",
    surface: "#F5F6F7",
    surfaceElevated: "#FFFFFF",
    textPrimary: "#111827",
    textSecondary: "#6B7280",
    border: "#E5E7EB",
    danger: "#EF4444",
  },
  dark: {
    primary: "#10B981",
    primaryTint: "#0F2A22",
    secondary: "#5B8DBE",
    secondaryTint: "#16232E",
    background: "#121212",
    surface: "#1E1E1E",
    surfaceElevated: "#252525",
    textPrimary: "#FFFFFF",
    textSecondary: "#9CA3AF",
    accent: "#34D399",
    border: "#2C2C2C",
    danger: "#F87171",
  },
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
