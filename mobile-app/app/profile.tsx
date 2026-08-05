import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { StyleSheet, View } from "react-native";
import { AppText as Text } from "../components/ui/AppText";

import { ScreenContainer } from "../components/ScreenContainer";
import { Card } from "../components/ui/Card";
import { Pressable } from "../components/ui/Pressable";
import { ScreenHeader } from "../components/ui/ScreenHeader";
import { useAuth } from "../lib/auth-context";
import { useMyComplaints } from "../lib/complaint-queries";
import { useResidentMe } from "../lib/resident-queries";
import { useAppTheme } from "../lib/theme/theme-context";

/** Renders a stored 13-digit CNIC as 12345-1234567-1 for readability. */
function formatCnic(cnic: string): string {
  const d = cnic.replace(/\D/g, "");
  return d.length === 13 ? `${d.slice(0, 5)}-${d.slice(5, 12)}-${d.slice(12)}` : cnic;
}

export default function ProfileScreen() {
  const { colors } = useAppTheme();
  const { logout } = useAuth();
  const { data: resident } = useResidentMe(true);
  const { data: complaints } = useMyComplaints();

  const allComplaints = complaints ?? [];
  const resolvedCount = allComplaints.filter((c) => c.status === "resolved" || c.status === "closed").length;
  const openCount = allComplaints.length - resolvedCount;

  const handleLogout = async () => {
    await logout();
    router.replace("/login");
  };

  return (
    <ScreenContainer>
      <ScreenHeader title="Profile" />

      <View style={styles.avatarBlock}>
        <View style={[styles.avatar, { backgroundColor: colors.primaryTint }]}>
          <Text style={[styles.avatarInitial, { color: colors.primary }]}>
            {(resident?.full_name ?? "R").charAt(0).toUpperCase()}
          </Text>
        </View>
        <Text style={[styles.name, { color: colors.textPrimary }]}>{resident?.full_name ?? "Resident"}</Text>
        <Text style={[styles.houseId, { color: colors.textSecondary }]}>
          House {resident?.house_code ?? "—"} · {resident?.resident_type === "tenant" ? "Tenant" : "Owner"}
        </Text>
      </View>

      <View style={styles.statsRow}>
        <StatTile label="Total" value={allComplaints.length} colors={colors} />
        <StatTile label="Open" value={openCount} colors={colors} />
        <StatTile label="Resolved" value={resolvedCount} colors={colors} />
      </View>

      <Card padding={0} style={styles.listCard}>
        <InfoRow icon="call" label="Phone" value={resident?.phone ?? "—"} />
        <Divider />
        <InfoRow icon="mail" label="Email" value={resident?.email ?? "Not provided"} />
        <Divider />
        <InfoRow
          icon="checkmark-circle"
          label="Verification"
          value={resident?.verification_status ?? "—"}
        />
        <Divider />
        <InfoRow
          icon="card"
          label="CNIC"
          value={resident?.cnic ? formatCnic(resident.cnic) : "—"}
        />
      </Card>

      <Card padding={0} style={[styles.listCard, styles.actionsCard]}>
        <ActionRow icon="settings" label="Settings" onPress={() => router.push("/settings")} />
        <Divider />
        <ActionRow icon="log-out" label="Log out" onPress={handleLogout} destructive />
      </Card>
    </ScreenContainer>
  );
}

function StatTile({ label, value, colors }: { label: string; value: number; colors: ReturnType<typeof useAppTheme>["colors"] }) {
  return (
    <View style={[styles.statTile, { backgroundColor: colors.surfaceSunken, borderRadius: colors.radii.md }]}>
      <Text style={[styles.statValue, { color: colors.textPrimary }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{label}</Text>
    </View>
  );
}

function InfoRow({ icon, label, value }: { icon: keyof typeof Ionicons.glyphMap; label: string; value: string }) {
  const { colors } = useAppTheme();
  return (
    <View style={styles.row}>
      <View style={styles.rowLeft}>
        <Ionicons name={icon} size={18} color={colors.textSecondary} />
        <Text style={[styles.rowLabel, { color: colors.textSecondary }]}>{label}</Text>
      </View>
      <Text style={[styles.rowValue, { color: colors.textPrimary }]} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

function ActionRow({
  icon,
  label,
  onPress,
  destructive,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  destructive?: boolean;
}) {
  const { colors } = useAppTheme();
  const color = destructive ? colors.danger : colors.textPrimary;
  return (
    <Pressable onPress={onPress} scaleTo={0.98}>
      <View style={styles.row}>
        <View style={styles.rowLeft}>
          <Ionicons name={icon} size={18} color={color} />
          <Text style={[styles.rowLabel, { color, fontWeight: "600" }]}>{label}</Text>
        </View>
        <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} />
      </View>
    </Pressable>
  );
}

function Divider() {
  const { colors } = useAppTheme();
  return <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: colors.border }} />;
}

const styles = StyleSheet.create({
  avatarBlock: { alignItems: "center", marginBottom: 20 },
  avatar: { width: 84, height: 84, borderRadius: 42, alignItems: "center", justifyContent: "center", marginBottom: 12 },
  avatarInitial: { fontSize: 32, fontWeight: "700" },
  name: { fontSize: 20, fontWeight: "700" },
  houseId: { fontSize: 13, marginTop: 3 },
  statsRow: { flexDirection: "row", gap: 10, marginBottom: 20 },
  statTile: { flex: 1, alignItems: "center", paddingVertical: 14, gap: 2 },
  statValue: { fontSize: 20, fontWeight: "700" },
  statLabel: { fontSize: 12, fontWeight: "500" },
  listCard: { overflow: "hidden", marginBottom: 16 },
  actionsCard: { marginBottom: 8 },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 16, paddingVertical: 14 },
  rowLeft: { flexDirection: "row", alignItems: "center", gap: 12, flexShrink: 1 },
  rowLabel: { fontSize: 14 },
  rowValue: { fontSize: 14, fontWeight: "600", maxWidth: 160 },
});
