import { useEffect } from "react";
import { Image, StyleSheet, Text, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from "react-native-reanimated";

import { useTheme } from "../lib/use-theme";

/**
 * A real, working entrance animation — not a static splash image. Logo
 * fades in while scaling up from 0.85 to 1.0, then a soft green accent
 * ring fades in slightly after, all using Reanimated's UI-thread
 * animations (smooth even on lower-end Android, per the spec's
 * performance requirement).
 */
export function AnimatedSplash() {
  const theme = useTheme();
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.85);
  const accentOpacity = useSharedValue(0);

  useEffect(() => {
    opacity.value = withTiming(1, { duration: 500, easing: Easing.out(Easing.cubic) });
    scale.value = withTiming(1, { duration: 500, easing: Easing.out(Easing.back(1.2)) });
    accentOpacity.value = withDelay(300, withTiming(1, { duration: 400 }));
  }, [accentOpacity, opacity, scale]);

  const logoStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  const accentStyle = useAnimatedStyle(() => ({
    opacity: accentOpacity.value * 0.5,
  }));

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Animated.View style={[styles.accentRing, { borderColor: theme.primary }, accentStyle]} />
      <Animated.View style={[styles.logoWrap, logoStyle]}>
        <Image source={require("../assets/icon.png")} style={styles.logo} resizeMode="contain" />
      </Animated.View>
      <Animated.Text style={[styles.brand, { color: theme.textPrimary }, logoStyle]}>EHS Next</Animated.Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  accentRing: {
    position: "absolute",
    width: 180,
    height: 180,
    borderRadius: 90,
    borderWidth: 2,
  },
  logoWrap: {
    width: 96,
    height: 96,
    marginBottom: 16,
  },
  logo: {
    width: "100%",
    height: "100%",
  },
  brand: {
    fontSize: 22,
    fontWeight: "700",
  },
});
