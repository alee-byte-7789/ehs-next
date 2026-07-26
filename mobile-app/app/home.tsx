import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { AppButton } from "../components/AppButton";
import { ScreenContainer } from "../components/ScreenContainer";
import { ThemedLogo } from "../components/ThemedLogo";
import { useAuth } from "../lib/auth-context";
import { useTranslation } from "../lib/i18n";
import { useUnreadNotificationCount } from "../lib/notification-queries";
import { useResidentMe } from "../lib/resident-queries";
import { radii, shadow, spacing } from "../lib/theme";
import { useTheme } from "../lib/use-theme";

export default function HomeScreen() {
  const { logout } = useAuth();
  const theme = useTheme();
  const { data: resident } = useResidentMe(true);
  const { t } = useTranslation();
  const { data: unread } = useUnreadNotificationCount();

  const handleLogout = async () => {
    await logout();
    router.replace("/login");
  };

  return (
    <ScreenContainer>
      <View style={styles.headerRow}>
        <ThemedLogo style={styles.headerLogo} />
        <Text style={[styles.greeting, { color: theme.textPrimary, flex: 1 }]}>
          {t("hi")}, {resident?.full_name?.split(" ")[0] ?? "there"}
        </Text>
        <Pressable onPress={() => router.push("/notifications")} style={styles.bellWrap}>
          <Ionicons name="notifications-outline" size={24} color={theme.textPrimary} />
          {!!unread?.count && (
            <View style={[styles.badge, { backgroundColor: theme.danger }]}>
              <Text style={styles.badgeText}>{unread.count > 9 ? "9+" : unread.count}</Text>
            </View>
          )}
        </Pressable>
      </View>

      <View style={styles.infoRow}>
        <View style={[styles.infoCard, { backgroundColor: theme.secondaryTint }, shadow.card]}>
          <Text style={[styles.cardLabel, { color: theme.secondary }]}>{t("residentId")}</Text>
          <Text style={[styles.cardValue, { color: theme.textPrimary }]} numberOfLines={1}>
            {resident?.resident_code ?? "—"}
          </Text>
        </View>
        <View style={[styles.infoCard, { backgroundColor: theme.primaryTint }, shadow.card]}>
          <Text style={[styles.cardLabel, { color: theme.primary }]}>{t("status")}</Text>
          <Text style={[styles.cardValue, { color: theme.primary }]}>{resident?.verification_status ?? "—"}</Text>
        </View>
      </View>

      <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>{t("complaints")}</Text>
      <View style={styles.actionRow}>
        <AppButton label={t("raiseComplaint")} onPress={() => router.push("/complaints/new")} />
      </View>
      <View style={styles.actionRow}>
        <AppButton label={t("myComplaints")} variant="secondary" onPress={() => router.push("/complaints")} />
      </View>

      <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>{t("society")}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.panelScroll}>
        <PanelTile
          label={t("prayerTimings")}
          icon="time-outline"
          onPress={() => router.push("/prayer-timings")}
          theme={theme}
        />
        <PanelTile
          label={t("settings")}
          icon="settings-outline"
          onPress={() => router.push("/settings")}
          theme={theme}
        />
      </ScrollView>

      <View style={styles.footer}>
        <AppButton label={t("logout")} variant="secondary" onPress={handleLogout} />
      </View>
    </ScreenContainer>
  );
}

function PanelTile({
  label,
  icon,
  onPress,
  theme,
}: {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  theme: ReturnType<typeof useTheme>;
}) {
  return (
    <Pressable onPress={onPress} style={[styles.panelTile, { backgroundColor: theme.surfaceElevated }, shadow.card]}>
      <View style={[styles.panelIconWrap, { backgroundColor: theme.primaryTint }]}>
        <Ionicons name={icon} size={22} color={theme.primary} />
      </View>
      <Text style={[styles.panelLabel, { color: theme.textPrimary }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  greeting: { fontSize: 26, fontWeight: "700" },
  headerRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm, marginBottom: spacing.lg },
  headerLogo: { width: 32, height: 32 },
  bellWrap: { position: "relative", padding: 4 },
  badge: {
    position: "absolute",
    top: 0,
    right: 0,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 3,
  },
  badgeText: { color: "#FFFFFF", fontSize: 9, fontWeight: "700" },
  infoRow: { flexDirection: "row", gap: spacing.sm, marginBottom: spacing.lg },
  infoCard: { flex: 1, borderRadius: radii.lg, padding: spacing.md },
  cardLabel: { fontSize: 12, fontWeight: "600", marginBottom: spacing.xs },
  cardValue: { fontSize: 16, fontWeight: "700" },
  sectionLabel: { fontSize: 13, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: spacing.sm, marginTop: spacing.sm },
  actionRow: { marginBottom: spacing.sm },
  panelScroll: { marginBottom: spacing.lg },
  panelTile: {
    borderRadius: radii.lg,
    padding: spacing.md,
    marginRight: spacing.sm,
    minWidth: 120,
    alignItems: "center",
    justifyContent: "center",
  },
  panelIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.xs,
  },
  panelLabel: { fontSize: 13, fontWeight: "600", textAlign: "center" },
  footer: { marginTop: spacing.md },
});
