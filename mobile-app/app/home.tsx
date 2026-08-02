import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { StyleSheet, Text, View } from "react-native";

import { Card } from "../components/ui/Card";
import { Pressable } from "../components/ui/Pressable";
import { QuickActionCard } from "../components/ui/QuickActionCard";
import { StatusChip } from "../components/ui/StatusChip";
import { ScreenContainer } from "../components/ScreenContainer";
import { useAuth } from "../lib/auth-context";
import { MOCK_COMPLAINTS, MOCK_NOTIFICATIONS } from "../lib/mock-data";
import { useResidentMe } from "../lib/resident-queries";
import { useAppTheme } from "../lib/theme/theme-context";

export default function HomeScreen() {
  const { logout } = useAuth();
  const { colors } = useAppTheme();
  const { data: resident } = useResidentMe(true);

  const firstName = resident?.full_name?.split(" ")[0] ?? "there";
  const unreadCount = MOCK_NOTIFICATIONS.filter((n) => !n.read).length;
  const openComplaints = MOCK_COMPLAINTS.filter((c) => c.status !== "resolved" && c.status !== "closed");
  const recentComplaints = MOCK_COMPLAINTS.slice(0, 3);

  const handleLogout = async () => {
    await logout();
    router.replace("/login");
  };

  const greeting = getGreeting();

  return (
    <ScreenContainer>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={[styles.greeting, { color: colors.textSecondary }]}>{greeting} 👋</Text>
          <Text style={[styles.name, { color: colors.textPrimary }]}>{firstName}</Text>
          <View style={styles.houseRow}>
            <Ionicons name="home" size={13} color={colors.textTertiary} />
            <Text style={[styles.houseText, { color: colors.textTertiary }]}>
              House {resident?.house_id ?? "—"} · {resident?.resident_code ?? "Unverified"}
            </Text>
          </View>
        </View>

        <Pressable
          onPress={() => router.push("/notifications")}
          scaleTo={0.9}
          style={[styles.bell, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}
        >
          <Ionicons name="notifications-outline" size={20} color={colors.textPrimary} />
          {unreadCount > 0 ? (
            <View style={[styles.bellBadge, { backgroundColor: colors.danger, borderColor: colors.background }]} />
          ) : null}
        </Pressable>
      </View>

      {/* Complaint summary strip */}
      <View style={styles.summaryRow}>
        <SummaryTile
          label="Open"
          value={openComplaints.length}
          color={colors.warning}
          tint={colors.warningTint}
        />
        <SummaryTile
          label="Resolved"
          value={MOCK_COMPLAINTS.filter((c) => c.status === "resolved").length}
          color={colors.success}
          tint={colors.successTint}
        />
        <SummaryTile label="Total" value={MOCK_COMPLAINTS.length} color={colors.primary} tint={colors.primaryTint} />
      </View>

      {/* Quick actions */}
      <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Quick actions</Text>
      <View style={styles.grid}>
        <QuickActionCard
          label="Register Complaint"
          description="Report an issue"
          icon="add-circle-outline"
          onPress={() => router.push("/complaints/new")}
        />
        <QuickActionCard
          label="My Complaints"
          description="Track & manage"
          icon="document-text-outline"
          onPress={() => router.push("/complaints")}
          badge={openComplaints.length}
        />
        <QuickActionCard
          label="Maintenance"
          description="Call a service"
          icon="construct-outline"
          onPress={() => router.push("/maintenance")}
        />
        <QuickActionCard
          label="Emergency"
          description="One-tap dial"
          icon="alert-circle-outline"
          onPress={() => router.push("/emergency")}
        />
        <QuickActionCard
          label="Prayer Timings"
          description="Today's schedule"
          icon="time-outline"
          onPress={() => router.push("/prayer-timings")}
        />
        <QuickActionCard
          label="Notifications"
          description="Updates & alerts"
          icon="notifications-outline"
          onPress={() => router.push("/notifications")}
          badge={unreadCount}
        />
        <QuickActionCard
          label="Profile"
          description="Your details"
          icon="person-outline"
          onPress={() => router.push("/profile")}
        />
        <QuickActionCard
          label="Settings"
          description="Theme & app"
          icon="settings-outline"
          onPress={() => router.push("/settings")}
        />
      </View>

      {/* Recent activity */}
      <View style={styles.sectionHeaderRow}>
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Recent activity</Text>
        <Pressable onPress={() => router.push("/complaints")}>
          <Text style={[styles.seeAll, { color: colors.primary }]}>See all</Text>
        </Pressable>
      </View>

      {recentComplaints.map((c) => (
        <Pressable key={c.id} onPress={() => router.push(`/complaints/${c.id}`)} style={styles.complaintPress}>
          <Card style={styles.complaintCard}>
            <View style={styles.complaintTop}>
              <Text style={[styles.complaintCode, { color: colors.textTertiary }]}>{c.code}</Text>
              <StatusChip status={c.status} />
            </View>
            <Text style={[styles.complaintTitle, { color: colors.textPrimary }]} numberOfLines={1}>
              {c.title}
            </Text>
            <Text style={[styles.complaintMeta, { color: colors.textSecondary }]}>
              {c.category} · {formatDate(c.submittedAt)}
            </Text>
          </Card>
        </Pressable>
      ))}

      <Pressable onPress={handleLogout} style={styles.logoutRow}>
        <Ionicons name="log-out-outline" size={18} color={colors.textSecondary} />
        <Text style={[styles.logoutText, { color: colors.textSecondary }]}>Log out</Text>
      </Pressable>
    </ScreenContainer>
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

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { day: "numeric", month: "short" });
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 20,
  },
  headerLeft: { flexShrink: 1 },
  greeting: { fontSize: 14, fontWeight: "500" },
  name: { fontSize: 26, fontWeight: "700", marginTop: 2 },
  houseRow: { flexDirection: "row", alignItems: "center", gap: 5, marginTop: 6 },
  houseText: { fontSize: 12, fontWeight: "500" },
  bell: {
    width: 44,
    height: 44,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: "center",
    justifyContent: "center",
  },
  bellBadge: {
    position: "absolute",
    top: 9,
    right: 10,
    width: 9,
    height: 9,
    borderRadius: 5,
    borderWidth: 1.5,
  },
  summaryRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 24,
  },
  summaryTile: {
    flex: 1,
    paddingVertical: 14,
    alignItems: "center",
    gap: 2,
  },
  summaryValue: { fontSize: 22, fontWeight: "700" },
  summaryLabel: { fontSize: 12, fontWeight: "600" },
  sectionTitle: { fontSize: 17, fontWeight: "700", marginBottom: 12 },
  sectionHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8,
    marginBottom: 12,
  },
  seeAll: { fontSize: 13, fontWeight: "600" },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: 12,
    marginBottom: 8,
  },
  complaintPress: { marginBottom: 10 },
  complaintCard: { gap: 6 },
  complaintTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  complaintCode: { fontSize: 11, fontWeight: "600", letterSpacing: 0.3 },
  complaintTitle: { fontSize: 15, fontWeight: "600" },
  complaintMeta: { fontSize: 12 },
  logoutRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 20,
    paddingVertical: 12,
  },
  logoutText: { fontSize: 14, fontWeight: "600" },
});
