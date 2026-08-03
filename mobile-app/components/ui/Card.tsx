import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { Platform, StyleSheet, View, ViewProps } from "react-native";

import { useAppTheme } from "../../lib/theme/theme-context";

// Defined locally instead of relying on StyleSheet.absoluteFillObject /
// StyleSheet.absoluteFill, whose exact export name has moved between RN
// versions — this works identically everywhere.
const ABSOLUTE_FILL = { position: "absolute" as const, top: 0, left: 0, right: 0, bottom: 0 };

interface CardProps extends ViewProps {
  /** "elevated" gets a soft shadow / glass surface (default surfaces); "flat" is border-only (nested inside another card). */
  variant?: "elevated" | "flat";
  padding?: number;
}

/**
 * "Liquid Glass" card surface (iOS 26 style): a blurred, faintly
 * accent-tinted pane with a bright top-left rim and a soft diagonal sheen,
 * so it reads as glass sitting *above* the background rather than a flat
 * tinted rectangle.
 *
 * Previous version was broken in light mode: it layered a 45%-opacity
 * white fill over the blur on top of a background that is *also*
 * near-white (#FBFBFA), so the card had almost no contrast against the
 * page and the "glass" was invisible. Fixed here by (1) giving the glass
 * fill enough opacity + a touch of accent tint to always read against the
 * page, and (2) adding a two-tone rim (bright highlight top/left, soft
 * shadow-line bottom/right) that mimics how real glass catches light at
 * its edges, in both modes.
 */
export function Card({ variant = "elevated", padding, style, children, ...rest }: CardProps) {
  const { colors, glassEffect } = useAppTheme();
  const radius = colors.radii.lg;
  const pad = padding ?? colors.spacing.md;

  const shadowStyle = {
    shadowColor: colors.shadowColor,
    shadowOpacity: variant === "elevated" ? (colors.isDark ? 0.35 : 0.12) : 0,
    shadowRadius: variant === "elevated" ? 20 : 0,
    shadowOffset: { width: 0, height: 8 },
    elevation: variant === "elevated" ? 4 : 0,
  };

  if (variant === "elevated" && glassEffect) {
    const fillColor = colors.isDark ? "rgba(28,30,34,0.55)" : "rgba(255,255,255,0.62)";
    const tintColor = colors.isDark ? withAlpha(colors.primary, 0.1) : withAlpha(colors.primary, 0.07);
    const rimHighlight = colors.isDark ? "rgba(255,255,255,0.16)" : "rgba(255,255,255,0.9)";
    const rimShadow = colors.isDark ? "rgba(0,0,0,0.5)" : "rgba(20,22,26,0.1)";
    const sheenTop = colors.isDark ? "rgba(255,255,255,0.10)" : "rgba(255,255,255,0.55)";

    return (
      <View style={[styles.base, shadowStyle, style]}>
        <View style={[styles.glassClip, { borderRadius: radius }]}>
          <BlurView
            intensity={colors.isDark ? 45 : 70}
            tint={colors.isDark ? "dark" : "light"}
            experimentalBlurMethod={Platform.OS === "android" ? "dimezisBlurView" : undefined}
            style={ABSOLUTE_FILL}
          />
          {/* Base tint: gives the pane a color of its own so it never disappears against a same-toned background. */}
          <View style={[ABSOLUTE_FILL, { backgroundColor: fillColor }]} />
          {/* Accent wash: glass subtly "picks up" the app's theme color, like real glass over a colored surface. */}
          <View style={[ABSOLUTE_FILL, { backgroundColor: tintColor }]} />
          {/* Specular sheen: soft diagonal highlight across the top third, the signature liquid-glass glint. */}
          <LinearGradient
            colors={[sheenTop, "rgba(255,255,255,0)"]}
            start={{ x: 0.1, y: 0 }}
            end={{ x: 0.7, y: 0.6 }}
            style={ABSOLUTE_FILL}
          />
          {/* Glass rim: bright catch-light on the top/left edge, soft shadow line on the bottom/right edge. */}
          <View
            pointerEvents="none"
            style={[
              ABSOLUTE_FILL,
              {
                borderRadius: radius,
                borderTopWidth: 1,
                borderLeftWidth: 1,
                borderTopColor: rimHighlight,
                borderLeftColor: rimHighlight,
              },
            ]}
          />
          <View
            pointerEvents="none"
            style={[
              ABSOLUTE_FILL,
              {
                borderRadius: radius,
                borderBottomWidth: 1,
                borderRightWidth: 1,
                borderBottomColor: rimShadow,
                borderRightColor: rimShadow,
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

/** Adds an alpha channel to a "#RRGGBB" hex color for the accent wash. */
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
