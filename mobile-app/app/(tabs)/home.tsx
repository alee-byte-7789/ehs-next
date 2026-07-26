import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { ScreenContainer } from "../../components/ScreenContainer";
import { ThemedLogo } from "../../components/ThemedLogo";
import { useTranslation } from "../../lib/i18n";
import { useResidentMe } from "../../lib/resident-queries";
import { radii, shadow, spacing } from "../../lib/theme";
import { useTheme } from "../../lib/use-theme";

export default function HomeScreen() {
  const theme = useTheme();
  const { data: resident } = useResidentMe(true);
  const { t } = useTranslation();

  const firstName = resident?.full_name?.split(" ")[0] ?? "there";

  return (
    <ScreenContainer>
      <View style={styles.logoRow}>
        <ThemedLogo style={styles.headerLogo} />
      </View>

      <Text style={[styles.hero, { color: theme.textPrimary }]}>
        {t("hi")}, {firstName}
      </Text>
      <Text style={[styles.heroSubtitle, { color: theme.textSecondary }]}>
        {t("heroSubtitle")}
      </Text>

      <View style={styles.statRow}>
        <View style={[styles.statCard, { backgroundColor: theme.secondaryTint }, shadow.card]}>
          <Text style={[styles.statLabel, { color: theme.secondary }]}>{t("residentId")}</Text>
          <Text style={[styles.statValue, { color: theme.textPrimary }]} numberOfLines={1}>
            {resident?.resident_code ?? "—"}
          </Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: theme.primaryTint }, shadow.card]}>
          <Text style={[styles.statLabel, { color: theme.primary }]}>{t("status")}</Text>
          <Text style={[styles.statValue, { color: theme.primary }]}>{resident?.verification_status ?? "—"}</Text>
        </View>
      </View>

      <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>{t("complaints")}</Text>

      <Pressable
        onPress={() => router.push("/complaints/new")}
        style={[styles.actionCard, { backgroundColor: theme.primary }, shadow.card]}
      >
        <View style={styles.actionIconWrap}>
          <Ionicons name="add-circle" size={28} color="#FFFFFF" />
        </View>
        <View style={styles.actionTextWrap}>
          <Text style={styles.actionTitle}>{t("raiseComplaint")}</Text>
          <Text style={styles.actionSubtitle}>{t("raiseComplaintSubtitle")}</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color="#FFFFFF" />
      </Pressable>

      <Pressable
        onPress={() => router.push("/complaints")}
        style={[styles.actionCardSecondary, { backgroundColor: theme.surfaceElevated }, shadow.card]}
      >
        <View style={[styles.actionIconWrap, { backgroundColor: theme.secondaryTint }]}>
          <Ionicons name="document-text-outline" size={24} color={theme.secondary} />
        </View>
        <View style={styles.actionTextWrap}>
          <Text style={[styles.actionTitleSecondary, { color: theme.textPrimary }]}>{t("myComplaints")}</Text>
          <Text style={[styles.actionSubtitleSecondary, { color: theme.textSecondary }]}>
            {t("myComplaintsSubtitle")}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color={theme.textSecondary} />
      </Pressable>

      <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>{t("society")}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.panelScroll}>
        <PanelTile
          label={t("prayerTimings")}
          icon="time-outline"
          onPress={() => router.push("/prayer-timings")}
          theme={theme}
        />
      </ScrollView>
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
  logoRow: { marginBottom: spacing.md },
  headerLogo: { width: 32, height: 32 },
  hero: { fontSize: 34, fontWeight: "800", letterSpacing: -0.5, marginBottom: spacing.xs },
  heroSubtitle: { fontSize: 15, marginBottom: spacing.lg },
  statRow: { flexDirection: "row", gap: spacing.sm, marginBottom: spacing.lg },
  statCard: { flex: 1, borderRadius: radii.lg, padding: spacing.md },
  statLabel: { fontSize: 12, fontWeight: "600", marginBottom: spacing.xs },
  statValue: { fontSize: 16, fontWeight: "700" },
  sectionLabel: {
    fontSize: 13,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: spacing.sm,
    marginTop: spacing.sm,
  },
  actionCard: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: radii.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  actionCardSecondary: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: radii.lg,
    padding: spacing.md,
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },
  actionIconWrap: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },
  actionTextWrap: { flex: 1 },
  actionTitle: { color: "#FFFFFF", fontSize: 16, fontWeight: "700" },
  actionSubtitle: { color: "rgba(255,255,255,0.85)", fontSize: 12, marginTop: 2 },
  actionTitleSecondary: { fontSize: 16, fontWeight: "700" },
  actionSubtitleSecondary: { fontSize: 12, marginTop: 2 },
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
});
