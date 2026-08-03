/**
 * Drop-in replacement for RN's `TextInput` that applies the Settings >
 * Display size scale. See AppText.tsx for why the old global monkey-patch
 * (lib/theme/font-scaling.ts) didn't work and crashed the app on boot.
 */
import { forwardRef } from "react";
import { StyleSheet, TextInput as RNTextInput, type TextInput as RNTextInputInstance, type TextInputProps } from "react-native";

import { useAppTheme } from "../../lib/theme/theme-context";

export const AppTextInput = forwardRef<RNTextInputInstance, TextInputProps>(function AppTextInput(
  { style, ...props },
  ref
) {
  const { fontScale } = useAppTheme();

  const flat = (StyleSheet.flatten(style) ?? {}) as { fontSize?: number };
  const baseFontSize = typeof flat.fontSize === "number" ? flat.fontSize : 14;

  return <RNTextInput ref={ref} {...props} style={[style, { fontSize: baseFontSize * fontScale }]} />;
});
