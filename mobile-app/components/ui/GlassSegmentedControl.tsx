import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useRef, useState } from "react";
import {
  Animated,
  Easing,
  LayoutChangeEvent,
  Platform,
  Pressable,
  StyleSheet,
  View,
} from "react-native";

import { useAppTheme } from "../../lib/theme/theme-context";
import { AppText as Text } from "./AppText";

export interface SegmentOption<T extends string> {
  key: T;
  label: string;
  icon?: keyof typeof Ionicons.glyphMap;
}

interface GlassSegmentedControlProps<T extends string> {
  options: SegmentOption<T>[];
  value: T;
  onChange: (key: T) => void;
  /** Stacks the icon above the label (the reference layout). */
  iconAbove?: boolean;
}

/**
 * Liquid-glass segmented control.
 *
 * The selected segment is a single "thumb" that SLIDES between positions
 * rather than each segment independently toggling its own background. That
 * is what makes it read as one physical piece of glass with something
 * moving underneath, instead of three separate buttons lighting up.
 *
 * Built from the same layers as Card's glass surface, so the two match:
 *   blur -> translucent fill -> accent wash -> soft diagonal sheen -> rim
 *
 * The outer shape uses `pill` radius deliberately, even though the rest of
 * the app is now 4px: the reference design is a pill, and `pill` was kept
 * in RADII for exactly these cases.
 */
export function GlassSegmentedControl<T extends string>({
  options,
  value,
  onChange,
  iconAbove = true,
}: GlassSegmentedControlProps<T>) {
  const { colors } = useAppTheme();
  const [trackWidth, setTrackWidth] = useState(0);

  const activeIndex = Math.max(0, options.findIndex((o) => o.key === value));
  const thumbX = useRef(new Animated.Value(0)).current;

  // onLayout reports the OUTER width, which includes the 5px padding on
  // each side. Dividing that directly would make the thumb wider than a
  // segment and push it past the right edge on the last option.
  const TRACK_PADDING = 5;
  const innerWidth = Math.max(0, trackWidth - TRACK_PADDING * 2);
  const segmentWidth = innerWidth > 0 ? innerWidth / options.length : 0;

  useEffect(() => {
    if (segmentWidth === 0) return;
    Animated.timing(thumbX, {
      toValue: activeIndex * segmentWidth,
      duration: 260,
      // Decelerating ease — the thumb arrives softly rather than stopping
      // dead, which is most of what makes the movement feel like glass
      // sliding rather than a state flip.
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [activeIndex, segmentWidth, thumbX]);

  const onTrackLayout = (e: LayoutChangeEvent) => setTrackWidth(e.nativeEvent.layout.width);

  const fill = colors.isDark ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.45)";
  const rim = colors.isDark ? "rgba(255,255,255,0.14)" : "rgba(255,255,255,0.85)";
  const sheen: [string, string, string] = colors.isDark
    ? ["rgba(255,255,255,0.07)", "rgba(255,255,255,0.02)", "rgba(255,255,255,0)"]
    : ["rgba(255,255,255,0.55)", "rgba(255,255,255,0.18)", "rgba(255,255,255,0)"];

  return (
    <View
      onLayout={onTrackLayout}
      style={[styles.track, { borderRadius: colors.radii.pill, borderColor: rim }]}
    >
      {/* --- the glass pane itself --- */}
      <BlurView
        intensity={colors.isDark ? 40 : 55}
        tint={colors.isDark ? "dark" : "light"}
        experimentalBlurMethod={Platform.OS === "android" ? "dimezisBlurView" : undefined}
        style={StyleSheet.absoluteFill}
      />
      <View style={[StyleSheet.absoluteFill, { backgroundColor: fill }]} />
      <LinearGradient
        colors={sheen}
        locations={[0, 0.55, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />

      {/* --- sliding selection thumb --- */}
      {segmentWidth > 0 ? (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.thumb,
            {
              width: segmentWidth,
              borderRadius: colors.radii.pill,
              backgroundColor: colors.isDark ? "rgba(255,255,255,0.13)" : "rgba(255,255,255,0.92)",
              transform: [{ translateX: thumbX }],
            },
          ]}
        />
      ) : null}

      {/* --- segments --- */}
      {options.map((opt) => {
        const active = opt.key === value;
        return (
          <Pressable
            key={opt.key}
            onPress={() => onChange(opt.key)}
            style={[styles.segment, iconAbove ? styles.segmentStacked : styles.segmentInline]}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            accessibilityLabel={opt.label}
          >
            {opt.icon ? (
              <Ionicons
                name={opt.icon}
                size={iconAbove ? 20 : 16}
                color={active ? colors.primary : colors.textSecondary}
              />
            ) : null}
            <Text
              numberOfLines={1}
              style={[
                styles.label,
                { color: active ? colors.primary : colors.textSecondary, fontWeight: active ? "700" : "500" },
              ]}
            >
              {opt.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    flexDirection: "row",
    overflow: "hidden",
    borderWidth: 1,
    padding: 5,
  },
  thumb: {
    position: "absolute",
    top: 5,
    bottom: 5,
    left: 5,
  },
  segment: { flex: 1, alignItems: "center", justifyContent: "center" },
  segmentStacked: { paddingVertical: 10, gap: 5 },
  segmentInline: { flexDirection: "row", paddingVertical: 11, gap: 7 },
  label: { fontSize: 12 },
});
