import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import { Platform, StyleSheet, View } from "react-native";
import { AppText as Text } from "./ui/AppText";

import { getWebPushPermissionState } from "../lib/fcm-web-push";
import { useAppTheme } from "../lib/theme/theme-context";

/**
 * Shows up ONLY when notifications are actually blocked — silent
 * otherwise. This exists because a browser that was denied once never
 * prompts again automatically, and there was previously no way for
 * anyone to tell that this was the reason notifications "just weren't
 * working."
 */
export function NotificationPermissionBanner() {
  const { colors } = useAppTheme();
  const [state, setState] = useState<"granted" | "denied" | "default" | "unsupported">("unsupported");

  useEffect(() => {
    if (Platform.OS === "web") {
      setState(getWebPushPermissionState() as never);
    }
  }, []);

  if (state !== "denied") return null; // only the actionable "blocked" case needs a banner

  return (
    <View style={[styles.banner, { backgroundColor: colors.dangerTint, borderRadius: colors.radii.md }]}>
      <Ionicons name="notifications-off" size={18} color={colors.danger} />
      <View style={styles.textWrap}>
        <Text style={[styles.title, { color: colors.danger }]}>Notifications are blocked</Text>
        <Text style={[styles.body, { color: colors.danger }]}>
          {Platform.OS === "web"
            ? "Tap the site info icon next to the address bar, set Notifications to Allow, then reload."
            : "Enable notifications for this app in your device settings."}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: { flexDirection: "row", gap: 10, padding: 12, marginBottom: 16, alignItems: "flex-start" },
  textWrap: { flex: 1, gap: 2 },
  title: { fontSize: 13, fontWeight: "700" },
  body: { fontSize: 12, lineHeight: 16 },
});
