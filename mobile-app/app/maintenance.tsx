import { Ionicons } from "@expo/vector-icons";
import { Alert, Linking, StyleSheet, Text, View } from "react-native";

import { ScreenContainer } from "../components/ScreenContainer";
import { Card } from "../components/ui/Card";
import { Pressable } from "../components/ui/Pressable";
import { ScreenHeader } from "../components/ui/ScreenHeader";
import { MAINTENANCE_SERVICES, type MaintenanceService } from "../lib/mock-data";
import { useAppTheme } from "../lib/theme/theme-context";

export default function MaintenanceScreen() {
  const { colors } = useAppTheme();

  const callService = (service: MaintenanceService) => {
    if (!service.available) {
      Alert.alert(
        `${service.name} unavailable`,
        "This service desk isn't taking calls right now. Please try again later or register a complaint instead."
      );
      return;
    }
    Linking.openURL(`tel:${service.phone}`).catch(() =>
      Alert.alert("Couldn't place call", `You can reach ${service.name} directly at ${service.phone}.`)
    );
  };

  return (
    <ScreenContainer>
      <ScreenHeader title="Maintenance" subtitle="One-tap call to a service desk" />

      <View style={styles.list}>
        {MAINTENANCE_SERVICES.map((service) => (
          <Pressable key={service.id} onPress={() => callService(service)} scaleTo={0.98} style={styles.pressWrap}>
            <Card style={styles.card}>
              <View
                style={[
                  styles.iconWrap,
                  { backgroundColor: colors.primaryTint, borderRadius: colors.radii.md },
                ]}
              >
                <Ionicons name={service.icon} size={22} color={colors.primary} />
              </View>
              <View style={styles.textWrap}>
                <Text style={[styles.name, { color: colors.textPrimary }]}>{service.name}</Text>
                <Text style={[styles.description, { color: colors.textSecondary }]} numberOfLines={1}>
                  {service.description}
                </Text>
                {!service.available ? (
                  <Text style={[styles.unavailable, { color: colors.textTertiary }]}>Unavailable right now</Text>
                ) : (
                  <Text style={[styles.phone, { color: colors.textTertiary }]}>{service.phone}</Text>
                )}
              </View>
              <View
                style={[
                  styles.callButton,
                  { backgroundColor: service.available ? colors.success : colors.surfaceSunken },
                ]}
              >
                <Ionicons
                  name="call"
                  size={16}
                  color={service.available ? "#FFFFFF" : colors.textTertiary}
                />
              </View>
            </Card>
          </Pressable>
        ))}
      </View>

      <Text style={[styles.footNote, { color: colors.textTertiary }]}>
        Prefer a written record? You can register a complaint instead from the home screen — it stays tracked
        until it's resolved.
      </Text>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  list: { gap: 10 },
  pressWrap: {},
  card: { flexDirection: "row", alignItems: "center", gap: 12 },
  iconWrap: { width: 48, height: 48, alignItems: "center", justifyContent: "center" },
  textWrap: { flex: 1, gap: 2 },
  name: { fontSize: 15, fontWeight: "700" },
  description: { fontSize: 12 },
  phone: { fontSize: 12, fontWeight: "600", marginTop: 2 },
  unavailable: { fontSize: 12, fontWeight: "600", marginTop: 2 },
  callButton: { width: 38, height: 38, borderRadius: 19, alignItems: "center", justifyContent: "center" },
  footNote: { fontSize: 12, lineHeight: 18, textAlign: "center", marginTop: 20, paddingHorizontal: 8 },
});
