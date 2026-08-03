import { ActivityIndicator, StyleSheet, View } from "react-native";
import { AppText as Text } from "./ui/AppText";

import { useAppTheme } from "../lib/theme/theme-context";
import { Pressable } from "./ui/Pressable";

interface AppButtonProps {
  label: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: "primary" | "secondary" | "ghost" | "danger";
  icon?: React.ReactNode;
}

export function AppButton({ label, onPress, loading, disabled, variant = "primary", icon }: AppButtonProps) {
  const { colors } = useAppTheme();
  const isDisabled = disabled || loading;

  const bg =
    variant === "primary"
      ? colors.primary
      : variant === "danger"
      ? colors.danger
      : "transparent";
  const borderColor =
    variant === "secondary" ? colors.primary : variant === "ghost" ? "transparent" : bg;
  const textColor =
    variant === "primary" || variant === "danger"
      ? colors.onPrimary
      : variant === "secondary"
      ? colors.primary
      : colors.textPrimary;

  return (
    <Pressable onPress={onPress} disabled={isDisabled} scaleTo={0.97}>
      <View
        style={[
          styles.base,
          {
            backgroundColor: bg,
            borderColor,
            borderWidth: variant === "secondary" ? 1.5 : 0,
            borderRadius: colors.radii.md,
            opacity: isDisabled ? 0.55 : 1,
          },
        ]}
      >
        {loading ? (
          <ActivityIndicator color={textColor} />
        ) : (
          <>
            {icon}
            <Text style={[styles.label, { color: textColor }]}>{label}</Text>
          </>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 15,
    minHeight: 52,
  },
  label: {
    fontSize: 16,
    fontWeight: "700",
  },
});
