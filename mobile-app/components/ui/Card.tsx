import { StyleSheet, View, ViewProps } from "react-native";

import { useAppTheme } from "../../lib/theme/theme-context";

interface CardProps extends ViewProps {
  /** "elevated" gets a soft shadow (default surfaces); "flat" is border-only (nested inside another card). */
  variant?: "elevated" | "flat";
  padding?: number;
}

export function Card({ variant = "elevated", padding, style, children, ...rest }: CardProps) {
  const { colors } = useAppTheme();

  return (
    <View
      style={[
        styles.base,
        {
          backgroundColor: colors.surfaceElevated,
          borderRadius: colors.radii.lg,
          padding: padding ?? colors.spacing.md,
          borderWidth: variant === "flat" ? 1 : StyleSheet.hairlineWidth,
          borderColor: colors.border,
        },
        variant === "elevated" && !colors.isDark
          ? {
              shadowColor: colors.shadowColor,
              shadowOpacity: 0.06,
              shadowRadius: 12,
              shadowOffset: { width: 0, height: 4 },
              elevation: 2,
            }
          : null,
        style,
      ]}
      {...rest}
    >
      {children}
    </View>
  );
}

interface IconCircleProps {
  backgroundColor: string;
  size?: number;
  children: React.ReactNode;
}

export function IconCircle({ backgroundColor, size = 44, children }: IconCircleProps) {
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    width: "100%",
  },
});
