import { Ionicons } from "@expo/vector-icons";
import { Linking, StyleSheet, Text, View } from "react-native";

import { ScreenContainer } from "../components/ScreenContainer";
import { Pressable } from "../components/ui/Pressable";
import { ScreenHeader } from "../components/ui/ScreenHeader";
import { EMERGENCY_CONTACTS } from "../lib/mock-data";
import { useAppTheme } from "../lib/theme/theme-context";

export default function EmergencyScreen() {
  const { colors } = useAppTheme();
  const call = (phone: string) => Linking.openURL(`tel:${phone}`);

  return (
    <ScreenContainer>
      <ScreenHeader title="Emergency" subtitle="Tap any card to call immediately" />

      <View style={[styles.warningBanner, { backgroundColor: colors.dangerTint, borderRadius: colors.radii.md }]}>
        <Ionicons name="warning" size={18} color={colors.danger} />
        <Text style={[styles.warningText, { color: colors.danger }]}>
          For life-threatening emergencies, call Ambulance or Fire immediately.
        </Text>
      </View>

      <View style={styles.grid}>
        {EMERGENCY_CONTACTS.map((contact) => (
          <Pressable
            key={contact.id}
            onPress={() => call(contact.phone)}
            scaleTo={0.95}
            style={styles.tilePress}
            accessibilityLabel={`Call ${contact.name}`}
          >
            <View
              style={[
                styles.tile,
                { backgroundColor: colors.danger, borderRadius: colors.radii.lg },
              ]}
            >
              <Ionicons name={contact.icon} size={30} color="#FFFFFF" />
              <Text style={styles.tileName}>{contact.name}</Text>
              <Text style={styles.tilePhone}>{contact.phone}</Text>
            </View>
          </Pressable>
        ))}
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  warningBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 14,
    marginBottom: 20,
  },
  warningText: { flex: 1, fontSize: 13, fontWeight: "600", lineHeight: 18 },
  grid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", rowGap: 14 },
  tilePress: { width: "47%" },
  tile: {
    aspectRatio: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  tileName: { color: "#FFFFFF", fontSize: 16, fontWeight: "700" },
  tilePhone: { color: "rgba(255,255,255,0.85)", fontSize: 13, fontWeight: "600" },
});
