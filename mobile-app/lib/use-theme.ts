import { useColorScheme } from "react-native";

import { colors } from "./theme";
import { useSettings } from "./settings-context";

export function useTheme() {
  const systemScheme = useColorScheme();
  const { themeMode } = useSettings();

  const effectiveScheme = themeMode === "system" ? systemScheme : themeMode;
  return effectiveScheme === "dark" ? colors.dark : colors.light;
}
