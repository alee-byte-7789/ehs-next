import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { StyleSheet, Text, View } from "react-native";

import { ScreenContainer } from "../components/ScreenContainer";
import { Card } from "../components/ui/Card";
import { Pressable } from "../components/ui/Pressable";
import { ScreenHeader } from "../components/ui/ScreenHeader";
import { useAuth } from "../lib/auth-context";
import { useResidentMe } from "../lib/resident-queries";
import { useAppTheme } from "../lib/theme/theme-context";

export default function ProfileScreen() {
  const { colors } = useAppTheme();
  const { logout } = useAuth();
  const { data: resident, isLoading } = useResidentMe(true);

  const handleLogout = async () => {
    await logout();
    router.replace("/login");
  };

  const initials = (resident?.full_name ?? "?")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");

  return (
    <ScreenContainer>
      <ScreenHeader title="Profile" subtitle="Your account details" />

      <Card style={styles.identityCard}>
        <View style={[styles.avatar, { backgroundColor: colors.primaryTint }]}>
          <Text style={[styles.avatarText, { color: colors.primary }]}>{initials || "?"}</Text>
        </View>
        <View style={styles.identityText}>
          <Text style={[styles.name, { color: colors.textPrimary }]}>
            {resident?.full_name ?? (isLoading ? "Loading…" : "Resident")}
          </Text>
          <View style={styles.badgeRow}>
            <VerificationBadge status={resident?.verification_status} />
          </View>
        </View>
      </Card>

      <SectionLabel text="Contact & residence" />
      <Card style={styles.infoCard}>
        <InfoRow icon="home-outline" label="House" value={resident ? `House ${resident.house_id}` : "—"} />
        <Divider />
        <InfoRow icon="id-card-outline" label="Resident code" value={resident?.resident_code ?? "Unverified"} />
        <Divider />
        <InfoRow
          icon="person-outline"
          label="Resident type"
          value={resident ? capitalize(resident.resident_type) : "—"}
        />
        <Divider />
        <InfoRow icon="call-outline" label="Phone" value={resident?.phone ?? "—"} />
        <Divider />
        <InfoRow icon="mail-outline" label="Email" value={resident?.email ?? "Not provided"} />
        {resident?.is_employee ? (
          <>
            <Divider />
            <InfoRow icon="briefcase-outline" label="Employee number" value={resident.employee_number ?? "—"} />
          </>
        ) : null}
      </Card>

      <SectionLabel text="Account" />
      <Card style={styles.linksCard}>
        <LinkRow icon="settings-outline" label="App settings" onPress={() => router.push("/settings")} />
        <Divider />
        <LinkRow
          icon="log-out-outline"
          label="Log out"
          danger
          onPress={handleLogout}
        />
      </Card>
    </ScreenContainer>
  );
}

function VerificationBadge({ status }: { status?: "pending" | "approved" | "rejected" }) {
  const { colors } = useAppTheme();
  const map = {
    approved: { label: "Verified resident", color: colors.success, tint: colors.successTint },
    pending: { label: "Verification pending", color: colors.warning, tint: colors.warningTint },
    rejected: { label: "Verification rejected", color: colors.danger, tint: colors.dangerTint },
  } as const;
  const entry = map[status ?? "pending"];
  return (
    <View style={[styles.chip, { backgroundColor: entry.tint }]}>
      <Text style={[styles.chipText, { color: entry.color }]}>{entry.label}</Text>
    </View>
  );
}

function InfoRow({ icon, label, value }: { icon: keyof typeof Ionicons.glyphMap; label: string; value: string }) {
  const { colors } = useAppTheme();
  return (
    <View style={styles.infoRow}>
      <View style={[styles.infoIcon, { backgroundColor: colors.surfaceSunken }]}>
        <Ionicons name={icon} size={16} color={colors.textSecondary} />
      </View>
      <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>{label}</Text>
      <Text style={[styles.infoValue, { color: colors.textPrimary }]} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

function LinkRow({
  icon,
  label,
  onPress,
  danger,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  danger?: boolean;
}) {
  const { colors } = useAppTheme();
  const color = danger ? colors.danger : colors.textPrimary;
  return (
    <Pressable onPress={onPress} style={styles.linkRow} scaleTo={0.98}>
      <Ionicons name={icon} size={18} color={color} />
      <Text style={[styles.linkLabel, { color }]}>{label}</Text>
      {!danger ? <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} /> : null}
    </Pressable>
  );
}

function SectionLabel({ text }: { text: string }) {
  const { colors } = useAppTheme();
  return <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>{text.toUpperCase()}</Text>;
}

function Divider() {
  const { colors } = useAppTheme();
  return <View style={[styles.divider, { backgroundColor: colors.border }]} />;
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

const styles = StyleSheet.create({
  identityCard: { flexDirection: "row", alignItems: "center", gap: 14, marginBottom: 20 },
  avatar: { width: 56, height: 56, borderRadius: 28, alignItems: "center", justifyContent: "center" },
  avatarText: { fontSize: 20, fontWeight: "700" },
  identityText: { flexShrink: 1, gap: 6 },
  name: { fontSize: 18, fontWeight: "700" },
  badgeRow: { flexDirection: "row" },
  chip: { alignSelf: "flex-start", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  chipText: { fontSize: 11, fontWeight: "600" },
  sectionLabel: { fontSize: 12, fontWeight: "700", letterSpacing: 0.6, marginBottom: 10, marginTop: 4 },
  infoCard: { gap: 0, marginBottom: 20 },
  infoRow: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 10 },
  infoIcon: { width: 30, height: 30, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  infoLabel: { fontSize: 13, flex: 1 },
  infoValue: { fontSize: 13, fontWeight: "600", flexShrink: 1, maxWidth: "50%", textAlign: "right" },
  divider: { height: StyleSheet.hairlineWidth, marginLeft: 40 },
  linksCard: { gap: 0 },
  linkRow: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 12 },
  linkLabel: { fontSize: 14, fontWeight: "600", flex: 1 },
});
