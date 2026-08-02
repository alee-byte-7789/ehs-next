import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";

import { ScreenContainer } from "../components/ScreenContainer";
import { Card } from "../components/ui/Card";
import { ScreenHeader } from "../components/ui/ScreenHeader";
import { MOCK_PRAYER_TIMINGS, type PrayerTiming } from "../lib/mock-data";
import { useAppTheme } from "../lib/theme/theme-context";

const ROWS: { key: keyof PrayerTiming; label: string }[] = [
  { key: "fajr", label: "Fajr" },
  { key: "zuhr", label: "Zuhr" },
  { key: "asr", label: "Asr" },
  { key: "maghrib", label: "Maghrib" },
  { key: "isha", label: "Isha" },
];

export default function PrayerTimingsScreen() {
  const { colors } = useAppTheme();

  return (
    <ScreenContainer>
      <ScreenHeader title="Prayer Timings" subtitle="Today's schedule for society mosques" />

      {MOCK_PRAYER_TIMINGS.map((timing) => (
        <Card key={timing.mosque_name} style={styles.card}>
          <View style={styles.header}>
            <View style={[styles.iconWrap, { backgroundColor: colors.primaryTint, borderRadius: colors.radii.md }]}>
              <Ionicons name="moon-outline" size={18} color={colors.primary} />
            </View>
            <Text style={[styles.mosqueName, { color: colors.textPrimary }]}>{timing.label}</Text>
          </View>

          <View style={styles.rows}>
            {ROWS.map((row) => (
              <View key={row.key} style={styles.row}>
                <Text style={[styles.rowLabel, { color: colors.textSecondary }]}>{row.label}</Text>
                <Text style={[styles.rowValue, { color: colors.textPrimary }]}>{String(timing[row.key])}</Text>
              </View>
            ))}
            {timing.jummah ? (
              <View style={[styles.row, styles.jummahRow, { borderTopColor: colors.border }]}>
                <Text style={[styles.rowLabel, { color: colors.primary, fontWeight: "700" }]}>Jummah</Text>
                <Text style={[styles.rowValue, { color: colors.primary, fontWeight: "700" }]}>{timing.jummah}</Text>
              </View>
            ) : null}
          </View>

          <Text style={[styles.updated, { color: colors.textTertiary }]}>
            Last updated {formatDate(timing.updatedAt)}
          </Text>
        </Card>
      ))}

      <Text style={[styles.disclaimer, { color: colors.textTertiary }]}>
        Timings are set by the Housing Office and may shift slightly with the season. For Ramadan and Eid
        schedules, check the society notice board.
      </Text>
    </ScreenContainer>
  );
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}

const styles = StyleSheet.create({
  card: { marginBottom: 14, gap: 14 },
  header: { flexDirection: "row", alignItems: "center", gap: 10 },
  iconWrap: { width: 36, height: 36, alignItems: "center", justifyContent: "center" },
  mosqueName: { fontSize: 16, fontWeight: "700" },
  rows: { gap: 0 },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
  },
  jummahRow: { borderTopWidth: StyleSheet.hairlineWidth, marginTop: 4, paddingTop: 10 },
  rowLabel: { fontSize: 13, fontWeight: "500" },
  rowValue: { fontSize: 13, fontWeight: "600" },
  updated: { fontSize: 11 },
  disclaimer: { fontSize: 12, lineHeight: 18, textAlign: "center", marginTop: 8, paddingHorizontal: 8 },
});
