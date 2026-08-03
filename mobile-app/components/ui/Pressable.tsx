import { useRef } from "react";
import {
  Animated,
  Easing,
  GestureResponderEvent,
  Pressable as RNPressable,
  StyleProp,
  ViewStyle,
} from "react-native";

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
}: AnimatedPressableProps) {
  const scale = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(1)).current;

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
      style={style}
    >
      <Animated.View style={{ transform: [{ scale }], opacity: disabled ? 0.5 : opacity }}>
        {children}
      </Animated.View>
    </RNPressable>
  );
}
