import { Image, type ImageStyle, type StyleProp } from "react-native";

import { useTheme } from "../lib/use-theme";

interface ThemedLogoProps {
  style?: StyleProp<ImageStyle>;
}

/**
 * Picks a white silhouette in dark mode, a dark silhouette in light mode —
 * both rendered on a fully transparent background. Replaces the old
 * `icon.png`/`logo-full.png` usage in inline UI spots (Login, Home, About,
 * Splash), which had a solid dark background baked in and looked wrong
 * against a light-themed screen.
 */
export function ThemedLogo({ style }: ThemedLogoProps) {
  const theme = useTheme();
  const isDark = theme.background === "#121212"; // dark.background from lib/theme.ts

  const source = isDark
    ? require("../assets/logo-white.png")
    : require("../assets/logo-dark.png");

  return <Image source={source} style={style} resizeMode="contain" />;
}
