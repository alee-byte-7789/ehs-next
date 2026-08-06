import { useRef } from "react";
import {
  Animated,
  Easing,
  GestureResponderEvent,
  Platform,
  Pressable as RNPressable,
  StyleProp,
  StyleSheet,
  View,
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
  /** Turn the accent glow off (e.g. plain list rows). */
  glow?: boolean;
  /**
   * Corner radius of the glow halo. Should match the child's radius,
   * otherwise square corners peek out from behind a rounded card. Falls
   * back to the style's own borderRadius, then to the card radius.
   */
  glowRadius?: number;
}

/**
 * Every tappable surface in the app (cards, buttons, chips, list rows)
 * uses this: a quick scale + fade on press, plus an accent-coloured glow.
 *
 * WHY THE GLOW IS A SEPARATE LAYER
 * --------------------------------
 * The obvious implementation — animating `shadowOpacity` directly — does
 * not work. react-native-web compiles shadowColor + shadowOpacity into a
 * single static CSS `box-shadow` STRING at style-processing time, via
 * normalizeColor(shadowColor, shadowOpacity). Handing it an Animated.Value
 * means that function receives an object where it expects a number, and it
 * emits no shadow at all — the glow silently never rendered.
 *
 * So instead there is a dedicated halo View sitting behind the content,
 * tinted with the current accent, carrying a STATIC shadow. Only its
 * `opacity` is animated, which is a real animatable property everywhere
 * (and on the native driver). The halo is inset slightly so the opaque
 * child covers its body and only the bloom around the edges shows.
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
  glow = true,
  glowRadius,
}: AnimatedPressableProps) {
  const { colors } = useAppTheme();
  const scale = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(1)).current;
  const glowAmount = useRef(new Animated.Value(0)).current;

  const flat = (StyleSheet.flatten(style) ?? {}) as ViewStyle;
  const radius =
    glowRadius ?? (typeof flat.borderRadius === "number" ? flat.borderRadius : colors.radii.lg);

  const showGlow = glow && !disabled;
  const supportsHover = Platform.OS === "web" && showGlow;

  const pulse = useRef<Animated.CompositeAnimation | null>(null);

  const animatePress = (toScale: number, toOpacity: number) => {
    Animated.parallel([
      Animated.spring(scale, { toValue: toScale, useNativeDriver: true, speed: 22, bounciness: 8 }),
      Animated.timing(opacity, {
        toValue: toOpacity,
        duration: 140,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start();
  };

  /**
   * Fires a complete glow pulse, in and out, on press-down.
   *
   * This deliberately does NOT track finger-down state. A tap on a phone
   * lasts around 100ms — roughly the time the glow took just to reach full
   * brightness — so tying the fade-out to release meant a tap produced
   * almost no visible glow at all. Running the pulse as a fixed sequence
   * guarantees the full effect regardless of how briefly the screen was
   * touched, which is what makes it read on touch rather than only hover.
   */
  const firePulse = () => {
    pulse.current?.stop();
    glowAmount.setValue(0);
    pulse.current = Animated.sequence([
      Animated.timing(glowAmount, {
        toValue: 1,
        duration: 90,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(glowAmount, {
        toValue: 0,
        duration: 420,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
    ]);
    pulse.current.start();
  };

  const animateHover = (to: number) => {
    // A pulse in flight owns the value; hover must not yank it mid-flight.
    pulse.current?.stop();
    Animated.timing(glowAmount, {
      toValue: to,
      duration: 180,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start();
  };

  return (
    <RNPressable
      onPress={onPress}
      onLongPress={onLongPress}
      disabled={disabled}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole={accessibilityRole}
      onPressIn={() => {
        animatePress(scaleTo, 0.85);
        if (showGlow) firePulse();
      }}
      onPressOut={() => animatePress(1, 1)}
      onHoverIn={supportsHover ? () => animateHover(0.45) : undefined}
      onHoverOut={supportsHover ? () => animateHover(0) : undefined}
      style={style}
    >
      <View>
        {showGlow ? (
          <Animated.View
            pointerEvents="none"
            style={[
              StyleSheet.absoluteFill,
              {
                // Flush with the content, not inset. Inset by 3px the bloom
                // started from inside the card's own edge and most of it was
                // hidden underneath the opaque child.
                borderRadius: radius,
                backgroundColor: colors.primary,
                opacity: glowAmount,
                // Static shadow — its strength is constant; the halo's own
                // opacity is what animates.
                shadowColor: colors.primary,
                shadowOpacity: 1,
                shadowRadius: 22,
                shadowOffset: { width: 0, height: 0 },
              },
            ]}
          />
        ) : null}
        <Animated.View style={{ transform: [{ scale }], opacity: disabled ? 0.5 : opacity }}>
          {children}
        </Animated.View>
      </View>
    </RNPressable>
  );
}
