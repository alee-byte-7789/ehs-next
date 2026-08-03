import { useState } from "react";
import { StyleSheet, TextInputProps, View } from "react-native";
import { AppText as Text } from "./ui/AppText";
import { AppTextInput as TextInput } from "./ui/AppTextInput";

import { useAppTheme } from "../lib/theme/theme-context";

interface AppTextFieldProps extends TextInputProps {
  label: string;
  error?: string;
  hint?: string;
}

export function AppTextField({ label, error, hint, style, onFocus, onBlur, ...inputProps }: AppTextFieldProps) {
  const { colors } = useAppTheme();
  const [focused, setFocused] = useState(false);

  const borderColor = error ? colors.danger : focused ? colors.primary : colors.border;

  return (
    <View style={styles.container}>
      <Text style={[styles.label, { color: colors.textSecondary }]}>{label}</Text>
      <TextInput
        placeholderTextColor={colors.textTertiary}
        onFocus={(e) => {
          setFocused(true);
          onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocused(false);
          onBlur?.(e);
        }}
        style={[
          styles.input,
          {
            borderColor,
            borderWidth: focused ? 1.5 : 1,
            color: colors.textPrimary,
            backgroundColor: colors.surfaceSunken,
            borderRadius: colors.radii.md,
          },
          style,
        ]}
        {...inputProps}
      />
      {error ? (
        <Text style={[styles.helper, { color: colors.danger }]}>{error}</Text>
      ) : hint ? (
        <Text style={[styles.helper, { color: colors.textTertiary }]}>{hint}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 6,
  },
  input: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
  },
  helper: {
    fontSize: 12,
    marginTop: 6,
  },
});
