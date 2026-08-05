import { useRef } from "react";
import {
  Animated,
  Easing,
  GestureResponderEvent,
  Platform,
  Pressable as RNPressable,
  StyleProp,
  ViewStyle,
} from "react-native";

import { useAppTheme } from "../../lib/theme/theme-context";

interface AnimatedPressableProps {
  onPress?: (e: GestureResponderEvent) => void;
  onLongPress?: (e: GestureResponderEvent) => void;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  children: React.ReactNode;
  /** How much to shrink on press. 0.97 = subtle (default), 0.94 = punchy (small icon buttons). */
  scaleTo?: number;
  accessibilityLabel?: string;
  accessibilityRole?: "button" | "link" | "none";
  /** Disable the desktop hover lift/glow (e.g. for full-width list rows). */
  hoverEffect?: boolean;
}

/**
 * Every tappable surface in the app (cards, buttons, chips, list rows)
 * should use this instead of a bare Pressable — it's what gives the UI its
 * "premium" tactile feel: a quick scale + fade on press-in, springing back
 * on release. Cheap on performance (native driver, transform + opacity
 * only) and works identically on web via react-native-web.
 */
export function Pressable({
  onPress,
  onLongPress,
  disabled,
  style,
  children,
  scaleTo = 0.97,
  accessibilityLabel,
  accessibilityRole = "button",
  hoverEffect = true,
}: AnimatedPressableProps) {
  const { colors } = useAppTheme();
  const scale = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(1)).current;

  // Hover only exists on desktop. On touch there is no hover state, so
  // these listeners are not attached at all rather than firing on press
  // and double-animating alongside the press-in scale.
  const hover = useRef(new Animated.Value(0)).current;
  const supportsHover = Platform.OS === "web" && hoverEffect && !disabled;

  const animateHover = (to: number) =>
    Animated.timing(hover, {
      toValue: to,
      duration: 180,
      easing: Easing.out(Easing.quad),
      // Colour/shadow interpolation is not native-driver compatible.
      useNativeDriver: false,
    }).start();

  // Lift on hover: a small scale-up plus a coloured glow, so the element
  // feels like it rises toward the cursor rather than just changing colour.
  const hoverScale = hover.interpolate({ inputRange: [0, 1], outputRange: [1, 1.02] });
  const glowOpacity = hover.interpolate({ inputRange: [0, 1], outputRange: [0, 0.45] });

  const animateTo = (toScale: number, toOpacity: number) => {
    Animated.parallel([
      Animated.spring(scale, {
        toValue: toScale,
        useNativeDriver: true,
        speed: 22,
        bounciness: 8,
      }),
      Animated.timing(opacity, {
        toValue: toOpacity,
        duration: 140,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start();
  };

  return (
    <RNPressable
      onPress={onPress}
      onLongPress={onLongPress}
      disabled={disabled}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole={accessibilityRole}
      onPressIn={() => animateTo(scaleTo, 0.85)}
      onPressOut={() => animateTo(1, 1)}
      onHoverIn={supportsHover ? () => animateHover(1) : undefined}
      onHoverOut={supportsHover ? () => animateHover(0) : undefined}
      style={style}
    >
      <Animated.View
        style={{
          transform: [{ scale }, ...(supportsHover ? [{ scale: hoverScale }] : [])],
          opacity: disabled ? 0.5 : opacity,
          ...(supportsHover
            ? {
                shadowColor: colors.primary,
                shadowOpacity: glowOpacity as unknown as number,
                shadowRadius: 14,
                shadowOffset: { width: 0, height: 4 },
              }
            : {}),
        }}
      >
        {children}
      </Animated.View>
    </RNPressable>
  );
}
