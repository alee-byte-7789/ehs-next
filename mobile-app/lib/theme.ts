/**
 * @deprecated Prefer importing from `lib/theme/palette` and
 * `lib/theme/theme-context` directly. Kept so any remaining old imports of
 * `radii` / `spacing` / `statusColors` from this path don't break the build.
 */
export { RADII as radii, SPACING as spacing, STATUS_COLORS as statusColors } from "./theme/palette";

/**
 * @deprecated Static back-compat shadow style for screens still on the old
 * theme system (they call `shadow.card` directly instead of computing a
 * theme-aware shadow the way `components/ui/Card.tsx` does). Not reactive
 * to light/dark mode — genuinely fine for a shadow, since these values are
 * subtle enough to read acceptably in both.
 */
export const shadow = {
  card: {
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 4,
  },
};

/**
 * @deprecated Old name for the accent-color picker, before it became the
 * 8-color `AccentKey` system in `lib/theme/palette.ts`. `lib/settings-context.tsx`
 * (the legacy settings store — see note there) still stores a `colorTheme` in
 * this 4-color shape, so this type has to exist for that file to compile.
 * NOT wired to the actual accent shown anywhere — see the note below.
 */
export type ColorThemeName = "green" | "red" | "yellow" | "blue";
