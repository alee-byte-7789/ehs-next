import { router } from "expo-router";
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { AppButton } from "../components/AppButton";
import { ScreenContainer } from "../components/ScreenContainer";
import { useAuth } from "../lib/auth-context";
import { useResidentMe } from "../lib/resident-queries";
import { spacing, radii } from "../lib/theme";
import { useTheme } from "../lib/use-theme";

export default function HomeScreen() {
  const { logout } = useAuth();
  const theme = useTheme();
  const { data: resident } = useResidentMe(true);

  const handleLogout = async () => {
    await logout();
    router.replace("/login");
  };

  return (
    <ScreenContainer>
      <View style={styles.headerRow}>
        <Image source={require("../assets/icon.png")} style={styles.headerLogo} resizeMode="contain" />
        <Text style={[styles.greeting, { color: theme.textPrimary }]}>
          Hi, {resident?.full_name?.split(" ")[0] ?? "there"}
        </Text>
      </View>

      <View style={styles.infoRow}>
        <View style={[styles.infoCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Text style={[styles.cardLabel, { color: theme.textSecondary }]}>Resident ID</Text>
          <Text style={[styles.cardValue, { color: theme.textPrimary }]} numberOfLines={1}>
            {resident?.resident_code ?? "—"}
          </Text>
        </View>
        <View style={[styles.infoCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Text style={[styles.cardLabel, { color: theme.textSecondary }]}>Status</Text>
          <Text style={[styles.cardValue, { color: theme.primary }]}>{resident?.verification_status ?? "—"}</Text>
        </View>
      </View>

      <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>Complaints</Text>
      <View style={styles.actionRow}>
        <AppButton label="Raise a Complaint" onPress={() => router.push("/complaints/new")} />
      </View>
      <View style={styles.actionRow}>
        <AppButton label="My Complaints" variant="secondary" onPress={() => router.push("/complaints")} />
      </View>

      <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>Society</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.panelScroll}>
        <PanelTile
          label="About EHS"
          onPress={() => router.push("/about")}
          theme={theme}
        />
        <PanelTile
          label="Prayer Timings"
          onPress={() => router.push("/prayer-timings")}
          theme={theme}
        />
        <PanelTile
          label="Settings"
          onPress={() => router.push("/settings")}
          theme={theme}
        />
      </ScrollView>

      <View style={styles.footer}>
        <AppButton label="Log out" variant="secondary" onPress={handleLogout} />
      </View>
    </ScreenContainer>
  );
}

function PanelTile({ label, onPress, theme }: { label: string; onPress: () => void; theme: ReturnType<typeof useTheme> }) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.panelTile, { backgroundColor: theme.surface, borderColor: theme.border }]}
    >
      <Text style={[styles.panelLabel, { color: theme.textPrimary }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  greeting: { fontSize: 26, fontWeight: "700", marginBottom: spacing.md },
  headerRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm, marginBottom: spacing.md },
  headerLogo: { width: 32, height: 32 },
  infoRow: { flexDirection: "row", gap: spacing.sm, marginBottom: spacing.lg },
  infoCard: { flex: 1, borderRadius: radii.md, borderWidth: 1, padding: spacing.md },
  cardLabel: { fontSize: 12, marginBottom: spacing.xs },
  cardValue: { fontSize: 16, fontWeight: "700" },
  sectionLabel: { fontSize: 13, fontWeight: "600", textTransform: "uppercase", marginBottom: spacing.sm, marginTop: spacing.sm },
  actionRow: { marginBottom: spacing.sm },
  panelScroll: { marginBottom: spacing.lg },
  panelTile: {
    borderWidth: 1,
    borderRadius: radii.md,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
    marginRight: spacing.sm,
    minWidth: 140,
    alignItems: "center",
    justifyContent: "center",
  },
  panelLabel: { fontSize: 14, fontWeight: "600", textAlign: "center" },
  footer: { marginTop: spacing.md },
});
