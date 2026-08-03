import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";

import { ScreenContainer } from "../components/ScreenContainer";
import { Card, IconCircle } from "../components/ui/Card";
import { ScreenHeader } from "../components/ui/ScreenHeader";
import { PRAYER_TIMINGS } from "../lib/mock-data";
import { useAppTheme } from "../lib/theme/theme-context";

export default function PrayerTimingsScreen() {
  const { colors } = useAppTheme();
  const today = new Date().toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long" });
  const nextPrayer = PRAYER_TIMINGS[0];

  return (
    <ScreenContainer>
      <ScreenHeader title="Prayer Timings" subtitle={today} />

      <View style={[styles.nextCard, { backgroundColor: colors.primary, borderRadius: colors.radii.lg }]}>
        <Text style={styles.nextLabel}>Next up</Text>
        <Text style={styles.nextName}>{nextPrayer.name}</Text>
        <Text style={styles.nextTime}>{nextPrayer.time}</Text>
      </View>

      {PRAYER_TIMINGS.map((prayer) => (
        <Card key={prayer.id} variant="flat" style={styles.row}>
          <IconCircle backgroundColor={colors.primaryTint} size={40}>
            <Ionicons name={prayer.icon} size={18} color={colors.primary} />
          </IconCircle>
          <View style={styles.rowInfo}>
            <Text style={[styles.rowName, { color: colors.textPrimary }]}>{prayer.name}</Text>
            <Text style={[styles.rowArabic, { color: colors.textTertiary }]}>{prayer.arabicName}</Text>
          </View>
          <Text style={[styles.rowTime, { color: colors.textPrimary }]}>{prayer.time}</Text>
        </Card>
      ))}

      <Text style={[styles.disclaimer, { color: colors.textTertiary }]}>
        Timings shown are placeholders pending integration with a live prayer-time source for your
        society's location.
      </Text>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  nextCard: { padding: 20, marginBottom: 20, alignItems: "center" },
  nextLabel: { color: "rgba(255,255,255,0.8)", fontSize: 12, fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.5 },
  nextName: { color: "#FFFFFF", fontSize: 26, fontWeight: "700", marginTop: 4 },
  nextTime: { color: "#FFFFFF", fontSize: 15, fontWeight: "600", marginTop: 2 },
  row: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 8 },
  rowInfo: { flex: 1 },
  rowName: { fontSize: 15, fontWeight: "600" },
  rowArabic: { fontSize: 12, marginTop: 1 },
  rowTime: { fontSize: 15, fontWeight: "700" },
  disclaimer: { fontSize: 12, lineHeight: 17, marginTop: 12, textAlign: "center" },
});
