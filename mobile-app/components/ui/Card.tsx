import { BlurView } from "expo-blur";
import { StyleSheet, View, ViewProps } from "react-native";

import { useAppTheme } from "../../lib/theme/theme-context";

interface CardProps extends ViewProps {
  /** "elevated" gets a soft shadow / glass surface (default surfaces); "flat" is border-only (nested inside another card). */
  variant?: "elevated" | "flat";
  padding?: number;
}

export function Card({ variant = "elevated", padding, style, children, ...rest }: CardProps) {
  const { colors, glassEffect } = useAppTheme();
  const radius = colors.radii.lg;
  const pad = padding ?? colors.spacing.md;

  const shadowStyle = !colors.isDark
    ? {
        shadowColor: colors.shadowColor,
        shadowOpacity: variant === "elevated" ? 0.08 : 0,
        shadowRadius: 16,
        shadowOffset: { width: 0, height: 6 },
        elevation: variant === "elevated" ? 3 : 0,
      }
    : null;

  if (variant === "elevated" && glassEffect) {
    return (
      <View style={[styles.base, shadowStyle, style]}>
        <View style={[styles.glassClip, { borderRadius: radius }]}>
          <BlurView
            intensity={colors.isDark ? 40 : 60}
            tint={colors.isDark ? "dark" : "light"}
            style={StyleSheet.absoluteFillObject}
          />
          <View
            style={[
              StyleSheet.absoluteFillObject,
              {
                borderWidth: StyleSheet.hairlineWidth,
                borderColor: colors.border,
                borderRadius: radius,
                backgroundColor: colors.isDark ? "rgba(30,32,36,0.35)" : "rgba(255,255,255,0.45)",
              },
            ]}
          />
          <View style={{ padding: pad }} {...rest}>
            {children}
          </View>
        </View>
      </View>
    );
  }

  return (
    <View
      style={[
        styles.base,
        {
          backgroundColor: colors.surfaceElevated,
          borderRadius: radius,
          padding: pad,
          borderWidth: variant === "flat" ? 1 : StyleSheet.hairlineWidth,
          borderColor: colors.border,
        },
        shadowStyle,
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
  glassClip: {
    width: "100%",
    overflow: "hidden",
  },
});
