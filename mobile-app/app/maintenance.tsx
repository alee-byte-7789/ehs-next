import { Ionicons } from "@expo/vector-icons";
import { Linking, StyleSheet, Text, View } from "react-native";

import { ScreenContainer } from "../components/ScreenContainer";
import { Card, IconCircle } from "../components/ui/Card";
import { Pressable } from "../components/ui/Pressable";
import { ScreenHeader } from "../components/ui/ScreenHeader";
import { MAINTENANCE_SERVICES } from "../lib/mock-data";
import { useAppTheme } from "../lib/theme/theme-context";

export default function MaintenanceScreen() {
  const { colors } = useAppTheme();

  const call = (phone: string) => Linking.openURL(`tel:${phone}`);

  return (
    <ScreenContainer>
      <ScreenHeader title="Maintenance" subtitle="Request a service or call the on-duty team" />

      {MAINTENANCE_SERVICES.map((service) => (
        <Card key={service.id} style={styles.card}>
          <View style={styles.row}>
            <IconCircle backgroundColor={colors.primaryTint} size={48}>
              <Ionicons name={service.icon} size={22} color={colors.primary} />
            </IconCircle>
            <View style={styles.info}>
              <Text style={[styles.name, { color: colors.textPrimary }]}>{service.name}</Text>
              <Text style={[styles.description, { color: colors.textSecondary }]}>{service.description}</Text>
              <View style={styles.statusRow}>
                <View
                  style={[
                    styles.dot,
                    { backgroundColor: service.available ? colors.success : colors.textTertiary },
                  ]}
                />
                <Text style={[styles.statusText, { color: service.available ? colors.success : colors.textTertiary }]}>
                  {service.available ? "Available now" : "Unavailable"}
                </Text>
              </View>
            </View>
          </View>

          <Pressable
            onPress={() => call(service.phone)}
            disabled={!service.available}
            scaleTo={0.96}
            style={[
              styles.callButton,
              {
                backgroundColor: service.available ? colors.primary : colors.surfaceSunken,
                borderRadius: colors.radii.md,
              },
            ]}
          >
            <Ionicons
              name="call"
              size={16}
              color={service.available ? colors.onPrimary : colors.textTertiary}
            />
            <Text
              style={[
                styles.callText,
                { color: service.available ? colors.onPrimary : colors.textTertiary },
              ]}
            >
              Call {service.phone}
            </Text>
          </Pressable>
        </Card>
      ))}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: 12, gap: 14 },
  row: { flexDirection: "row", gap: 14 },
  info: { flex: 1, gap: 4 },
  name: { fontSize: 16, fontWeight: "700" },
  description: { fontSize: 13, lineHeight: 18 },
  statusRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 4 },
  dot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 12, fontWeight: "600" },
  callButton: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 12 },
  callText: { fontSize: 14, fontWeight: "700" },
});
