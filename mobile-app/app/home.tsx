import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { AppText as Text } from "../components/ui/AppText";

import { AppDrawer } from "../components/AppDrawer";
import { Card } from "../components/ui/Card";
import { Pressable } from "../components/ui/Pressable";
import { QuickActionCard } from "../components/ui/QuickActionCard";
import { RegisterComplaintFab } from "../components/RegisterComplaintFab";
import { ScreenContainer } from "../components/ScreenContainer";
import { StatusChip } from "../components/ui/StatusChip";
import { useMyComplaints } from "../lib/complaint-queries";
import { registerForWebPush } from "../lib/fcm-web-push";
import { useLocale } from "../lib/i18n/locale-context";
import { useUnreadNotificationCount } from "../lib/notification-queries";
import { registerForPushNotifications } from "../lib/push-notifications";
import { useResidentMe } from "../lib/resident-queries";
import { useAppTheme } from "../lib/theme/theme-context";

export default function HomeScreen() {
  const { colors } = useAppTheme();
  const { t } = useLocale();
  const { data: resident } = useResidentMe(true);
  const { data: complaints, isLoading: complaintsLoading } = useMyComplaints();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const firstName = resident?.full_name?.split(" ")[0] ?? "there";
  const { data: unread } = useUnreadNotificationCount();
  const unreadCount = unread?.count ?? 0;

  useEffect(() => {
    registerForPushNotifications();
    registerForWebPush();
  }, []);

  const allComplaints = complaints ?? [];
  const openComplaints = allComplaints.filter((c) => c.status !== "resolved" && c.status !== "closed");
  const resolvedComplaints = allComplaints.filter((c) => c.status === "resolved");
  const recentComplaints = [...allComplaints]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 3);

  const greeting = getGreeting(t);

  return (
    <View style={{ flex: 1 }}>
      <ScreenContainer>
        <View style={styles.topBar}>
          <Pressable
            onPress={() => setDrawerOpen(true)}
            scaleTo={0.9}
            style={[styles.iconBtn, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}
            accessibilityLabel="Open menu"
          >
            <Ionicons name="menu" size={22} color={colors.textPrimary} />
          </Pressable>

          <View style={styles.headerCenter}>
            <Text style={[styles.greeting, { color: colors.textSecondary }]}>{greeting} 👋</Text>
            <Text style={[styles.name, { color: colors.textPrimary }]}>{firstName}</Text>
          </View>

          <Pressable
            onPress={() => router.push("/notifications")}
            scaleTo={0.9}
            style={[styles.iconBtn, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}
            accessibilityLabel="Notifications"
          >
            <Ionicons name="notifications-outline" size={20} color={colors.textPrimary} />
            {unreadCount > 0 ? (
              <View style={[styles.bellBadge, { backgroundColor: colors.danger, borderColor: colors.background }]} />
            ) : null}
          </Pressable>
        </View>

        <View style={styles.houseRow}>
          <Ionicons name="home" size={13} color={colors.textTertiary} />
          <Text style={[styles.houseText, { color: colors.textTertiary }]}>
            House {resident?.house_id ?? "—"} · {resident?.resident_code ?? "Unverified"}
          </Text>
        </View>

        <View style={styles.summaryRow}>
          <SummaryTile label={t("summary_open")} value={openComplaints.length} color={colors.warning} tint={colors.warningTint} />
          <SummaryTile label={t("summary_resolved")} value={resolvedComplaints.length} color={colors.success} tint={colors.successTint} />
          <SummaryTile label={t("summary_total")} value={allComplaints.length} color={colors.primary} tint={colors.primaryTint} />
        </View>

        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>{t("quick_actions")}</Text>
        <View style={styles.grid}>
          <QuickActionCard
            label={t("action_my_complaints")}
            description={t("action_my_complaints_desc")}
            icon="document-text-outline"
            onPress={() => router.push("/complaints")}
            badge={openComplaints.length}
          />
          <QuickActionCard
            label={t("action_emergency")}
            description={t("action_emergency_desc")}
            icon="alert-circle-outline"
            onPress={() => router.push("/emergency")}
          />
          <QuickActionCard
            label={t("action_prayer_timings")}
            description={t("action_prayer_timings_desc")}
            icon="mosque-outline"
            iconFamily="material-community"
            onPress={() => router.push("/prayer-timings")}
          />
        </View>

        <View style={styles.sectionHeaderRow}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>{t("recent_activity")}</Text>
          <Pressable onPress={() => router.push("/complaints")}>
            <Text style={[styles.seeAll, { color: colors.primary }]}>{t("see_all")}</Text>
          </Pressable>
        </View>

        {complaintsLoading ? (
          <View style={{ paddingVertical: 20, alignItems: "center" }}>
            <ActivityIndicator color={colors.primary} />
          </View>
        ) : recentComplaints.length === 0 ? (
          <Text style={{ color: colors.textSecondary, fontSize: 13, marginBottom: 12 }}>{t("no_complaints_home")}</Text>
        ) : (
          recentComplaints.map((c) => (
            <Pressable key={c.id} onPress={() => router.push(`/complaints/${c.id}`)} style={styles.complaintPress}>
              <Card style={styles.complaintCard}>
                <View style={styles.complaintTop}>
                  <Text style={[styles.complaintCode, { color: colors.textTertiary }]}>{c.complaint_code}</Text>
                  <StatusChip status={c.status} />
                </View>
                <Text style={[styles.complaintTitle, { color: colors.textPrimary }]} numberOfLines={1}>
                  {c.subcategory}
                </Text>
                <Text style={[styles.complaintMeta, { color: colors.textSecondary }]}>
                  {c.category} · {formatDate(c.created_at)}
                </Text>
              </Card>
            </Pressable>
          ))
        )}

        <View style={{ height: 90 }} />
      </ScreenContainer>

      <RegisterComplaintFab onPress={() => router.push("/complaints/new")} />
      <AppDrawer visible={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </View>
  );
}

function SummaryTile({ label, value, color, tint }: { label: string; value: number; color: string; tint: string }) {
  const { colors } = useAppTheme();
  return (
    <View style={[styles.summaryTile, { backgroundColor: tint, borderRadius: colors.radii.md }]}>
      <Text style={[styles.summaryValue, { color }]}>{value}</Text>
      <Text style={[styles.summaryLabel, { color }]}>{label}</Text>
    </View>
  );
}

function getGreeting(t: (key: "good_morning" | "good_afternoon" | "good_evening") => string) {
  const hour = new Date().getHours();
  if (hour < 12) return t("good_morning");
  if (hour < 17) return t("good_afternoon");
  return t("good_evening");
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { day: "numeric", month: "short" });
}

const styles = StyleSheet.create({
  topBar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 },
  headerCenter: { flex: 1, alignItems: "center" },
  greeting: { fontSize: 13, fontWeight: "500" },
  name: { fontSize: 18, fontWeight: "700", marginTop: 1 },
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: "center",
    justifyContent: "center",
  },
  bellBadge: { position: "absolute", top: 9, right: 10, width: 9, height: 9, borderRadius: 5, borderWidth: 1.5 },
  houseRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 5, marginBottom: 20 },
  houseText: { fontSize: 12, fontWeight: "500" },
  summaryRow: { flexDirection: "row", gap: 10, marginBottom: 24 },
  summaryTile: { flex: 1, paddingVertical: 14, alignItems: "center", gap: 2 },
  summaryValue: { fontSize: 22, fontWeight: "700" },
  summaryLabel: { fontSize: 12, fontWeight: "600" },
  sectionTitle: { fontSize: 17, fontWeight: "700", marginBottom: 12 },
  sectionHeaderRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 8, marginBottom: 12 },
  seeAll: { fontSize: 13, fontWeight: "600" },
  grid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", rowGap: 12, marginBottom: 8 },
  complaintPress: { marginBottom: 10 },
  complaintCard: { gap: 6 },
  complaintTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  complaintCode: { fontSize: 11, fontWeight: "600", letterSpacing: 0.3 },
  complaintTitle: { fontSize: 15, fontWeight: "600" },
  complaintMeta: { fontSize: 12 },
});
