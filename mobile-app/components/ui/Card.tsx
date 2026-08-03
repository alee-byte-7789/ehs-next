import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { Platform, StyleSheet, View, ViewProps } from "react-native";

import { useAppTheme } from "../../lib/theme/theme-context";

const ABSOLUTE_FILL = { position: "absolute" as const, top: 0, left: 0, right: 0, bottom: 0 };

interface CardProps extends ViewProps {
  variant?: "elevated" | "flat";
  padding?: number;
}

/**
 * "Liquid Glass" card surface.
 *
 * Two real bugs fixed in this version, both confirmed against an actual
 * screenshot before touching anything:
 *
 * 1. "Squares behind the rounded tiles" — the outer container that holds
 *    the shadow had NO borderRadius of its own (only the inner clipped
 *    layer did). On web, react-native-web renders iOS-style shadow props
 *    as a CSS box-shadow — and a box-shadow on an element with no
 *    border-radius is a sharp rectangle, regardless of what rounded
 *    content sits inside it. That's exactly what was bleeding out from
 *    behind every card. Fixed by giving the outer container the same
 *    borderRadius as the inner clipped pane.
 *
 * 2. Light-mode glass looked "dull" after an earlier pass that toned
 *    down the tint to fix a different problem (hard rim-border edges).
 *    That fix was correct to remove the hard borders, but went too far
 *    on opacity. Restored a more saturated accent wash + fill in light
 *    mode specifically, without reintroducing the hard-edged borders.
 */
export function Card({ variant = "elevated", padding, style, children, ...rest }: CardProps) {
  const { colors, glassEffect } = useAppTheme();
  const radius = colors.radii.lg;
  const pad = padding ?? colors.spacing.md;

  const shadowStyle = {
    shadowColor: colors.shadowColor,
    shadowOpacity: variant === "elevated" ? (colors.isDark ? 0.35 : 0.14) : 0,
    shadowRadius: variant === "elevated" ? 20 : 0,
    shadowOffset: { width: 0, height: 8 },
    elevation: variant === "elevated" ? 4 : 0,
  };

  if (variant === "elevated" && glassEffect) {
    const fillColor = colors.isDark ? "rgba(28,30,34,0.55)" : "rgba(255,255,255,0.58)";
    const tintColor = colors.isDark ? withAlpha(colors.primary, 0.12) : withAlpha(colors.primary, 0.14);
    const sheenTop = colors.isDark ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.45)";

    return (
      // borderRadius here (not just on the inner glassClip) is the fix —
      // without it, the shadow below renders as a sharp rectangle on web.
      <View style={[styles.base, { borderRadius: radius }, shadowStyle, style]}>
        <View style={[styles.glassClip, { borderRadius: radius }]}>
          <BlurView
            intensity={colors.isDark ? 45 : 60}
            tint={colors.isDark ? "dark" : "light"}
            experimentalBlurMethod={Platform.OS === "android" ? "dimezisBlurView" : undefined}
            style={ABSOLUTE_FILL}
          />
          <View style={[ABSOLUTE_FILL, { backgroundColor: fillColor }]} />
          {/* Accent wash — more saturated in light mode than the previous
              pass, so the glass reads as colorful rather than dull grey. */}
          <View style={[ABSOLUTE_FILL, { backgroundColor: tintColor }]} />
          <LinearGradient
            colors={[sheenTop, "rgba(255,255,255,0)"]}
            start={{ x: 0.1, y: 0 }}
            end={{ x: 0.8, y: 0.9 }}
            style={ABSOLUTE_FILL}
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

function withAlpha(hex: string, alpha: number): string {
  const clean = hex.replace("#", "");
  const r = parseInt(clean.substring(0, 2), 16);
  const g = parseInt(clean.substring(2, 4), 16);
  const b = parseInt(clean.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
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
