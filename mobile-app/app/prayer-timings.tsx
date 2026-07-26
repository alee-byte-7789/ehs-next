import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AppButton } from "../components/AppButton";
import { AppTextField } from "../components/AppTextField";
import { useAdminAuth } from "../lib/admin-auth-context";
import { useUpdatePrayerTiming } from "../lib/admin-prayer-timing-mutations";
import { usePrayerTimings } from "../lib/society-queries";
import { radii, shadow, spacing } from "../lib/theme";
import { useTheme } from "../lib/use-theme";
import type { MosqueName, PrayerTimingOut } from "../lib/types";

const MOSQUE_LABELS: Record<MosqueName, string> = {
  bilal_mosque: "Bilal Mosque",
  markazi_jamia_mosque: "Markazi Jamia Mosque",
};

const PRAYER_FIELDS: { key: keyof PrayerTimingOut; label: string }[] = [
  { key: "fajr", label: "Fajr" },
  { key: "zuhr", label: "Zuhr" },
  { key: "asr", label: "Asr" },
  { key: "maghrib", label: "Maghrib" },
  { key: "isha", label: "Isha" },
  { key: "jummah", label: "Jummah" },
];

export default function PrayerTimingsScreen() {
  const theme = useTheme();
  const { data: timings, isLoading } = usePrayerTimings();
  const { isAdminSignedIn, logout } = useAdminAuth();

  return (
    <SafeAreaView style={[styles.flex, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backRow}>
          <Ionicons name="arrow-back" size={18} color={theme.primary} />
          <Text style={{ color: theme.primary, fontSize: 15 }}>Back</Text>
        </Pressable>
        <View style={styles.titleRow}>
          <Ionicons name="moon-outline" size={22} color={theme.secondary} />
          <Text style={[styles.title, { color: theme.textPrimary }]}>Prayer Timings</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {isLoading && <Text style={{ color: theme.textSecondary }}>Loading...</Text>}

        {timings?.map((timing) => (
          <MosqueCard key={timing.mosque_name} timing={timing} isAdmin={isAdminSignedIn} />
        ))}

        <View style={styles.footer}>
          {isAdminSignedIn ? (
            <AppButton label="Log out (admin)" variant="secondary" onPress={logout} />
          ) : (
            <Pressable onPress={() => router.push("/admin-login")}>
              <Text style={{ color: theme.textSecondary, fontSize: 13, textAlign: "center" }}>
                Housing Office Admin? <Text style={{ color: theme.primary, fontWeight: "600" }}>Log in to edit</Text>
              </Text>
            </Pressable>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function MosqueCard({ timing, isAdmin }: { timing: PrayerTimingOut; isAdmin: boolean }) {
  const theme = useTheme();
  const [editing, setEditing] = useState(false);
  const [values, setValues] = useState<Record<string, string>>({});
  const updateTiming = useUpdatePrayerTiming();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setValues({
      fajr: timing.fajr, zuhr: timing.zuhr, asr: timing.asr,
      maghrib: timing.maghrib, isha: timing.isha, jummah: timing.jummah ?? "",
    });
  }, [timing]);

  const handleSave = async () => {
    setError(null);
    try {
      await updateTiming.mutateAsync({
        mosqueName: timing.mosque_name,
        payload: {
          fajr: values.fajr, zuhr: values.zuhr, asr: values.asr,
          maghrib: values.maghrib, isha: values.isha, jummah: values.jummah || null,
        },
      });
      setEditing(false);
    } catch {
      setError("Could not save. Check your admin session hasn't expired.");
    }
  };

  return (
    <View style={[styles.card, { backgroundColor: theme.surfaceElevated }, shadow.card]}>
      <View style={styles.cardHeader}>
        <Text style={[styles.mosqueName, { color: theme.textPrimary }]}>{MOSQUE_LABELS[timing.mosque_name]}</Text>
        {isAdmin && !editing && (
          <Pressable onPress={() => setEditing(true)}>
            <Text style={{ color: theme.primary, fontWeight: "600", fontSize: 13 }}>Edit</Text>
          </Pressable>
        )}
      </View>

      {!editing &&
        PRAYER_FIELDS.map((f) => {
          const value = timing[f.key] as string | null;
          if (!value) return null;
          return (
            <View key={f.key} style={styles.row}>
              <Text style={{ color: theme.textSecondary, fontSize: 14 }}>{f.label}</Text>
              <Text style={{ color: theme.textPrimary, fontSize: 14, fontWeight: "600" }}>{value}</Text>
            </View>
          );
        })}

      {editing && (
        <View>
          {PRAYER_FIELDS.map((f) => (
            <AppTextField
              key={f.key}
              label={f.label}
              value={values[f.key as string] ?? ""}
              onChangeText={(v) => setValues((prev) => ({ ...prev, [f.key as string]: v }))}
            />
          ))}
          {error && <Text style={{ color: theme.danger, fontSize: 12, marginBottom: spacing.sm }}>{error}</Text>}
          <View style={styles.editActions}>
            <AppButton label="Save" onPress={handleSave} loading={updateTiming.isPending} />
            <AppButton label="Cancel" variant="secondary" onPress={() => setEditing(false)} />
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  header: { paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.sm, gap: spacing.xs },
  backRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  titleRow: { flexDirection: "row", alignItems: "center", gap: spacing.xs },
  title: { fontSize: 24, fontWeight: "700" },
  content: { padding: spacing.lg },
  card: { borderRadius: radii.lg, padding: spacing.md, marginBottom: spacing.md },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: spacing.sm },
  mosqueName: { fontSize: 16, fontWeight: "700" },
  row: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 4 },
  editActions: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.sm },
  footer: { marginTop: spacing.md },
});
