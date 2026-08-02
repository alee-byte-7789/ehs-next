/**
 * Back-compat shim. Old screens call `useTheme()` and expect a flat color
 * object; new screens should prefer `useAppTheme()` from
 * `lib/theme/theme-context` for the full token set (spacing, radii, status
 * colors, mode controls). Both read from the same ThemeProvider.
 */
import { useAppTheme } from "./theme/theme-context";

export function useTheme() {
  return useAppTheme().colors;
}
