/**
 * Drop-in replacement for RN's `Text` that actually applies the app's
 * Settings > Display size control.
 *
 * The previous approach (lib/theme/font-scaling.ts) tried to monkey-patch
 * `Text.render` / `TextInput.render` globally. That doesn't work on this
 * RN version (0.86 + React 19's ref-as-prop components): `Text` and
 * `TextInput` are plain function components, not `forwardRef` objects, so
 * they have no `.render` property — assigning one is a no-op for `Text`
 * calls, and reading `undefined.bind(...)` on `TextInput` throws a
 * `TypeError` the instant the app boots (see `patchTextScaling()` being
 * called unconditionally at module scope in the old `app/_layout.tsx`).
 * That's the crash behind "font size control not working".
 *
 * This component reads `fontScale` straight from ThemeProvider and scales
 * whatever `fontSize` was already in the style (defaulting to RN's normal
 * 14pt base when none is set), the same way the old patch intended to —
 * just via a real React component instead of patching internals.
 */
import { forwardRef } from "react";
import { StyleSheet, Text as RNText, type Text as RNTextInstance, type TextProps } from "react-native";

import { useAppTheme } from "../../lib/theme/theme-context";

export const AppText = forwardRef<RNTextInstance, TextProps>(function AppText({ style, ...props }, ref) {
  const { fontScale } = useAppTheme();

  const flat = (StyleSheet.flatten(style) ?? {}) as { fontSize?: number };
  const baseFontSize = typeof flat.fontSize === "number" ? flat.fontSize : 14;

  return <RNText ref={ref} {...props} style={[style, { fontSize: baseFontSize * fontScale }]} />;
});
