import { Ionicons } from "@expo/vector-icons";
import { Linking, StyleSheet, View } from "react-native";
import { AppText as Text } from "../components/ui/AppText";

import { Card } from "../components/ui/Card";
import { Pressable } from "../components/ui/Pressable";
import { ScreenContainer } from "../components/ScreenContainer";
import { ScreenHeader } from "../components/ui/ScreenHeader";
import { EMERGENCY_CONTACTS } from "../lib/mock-data";
import { useAppTheme } from "../lib/theme/theme-context";

export default function EmergencyScreen() {
  const { colors } = useAppTheme();
  const call = (phone: string) => Linking.openURL(`tel:${phone}`);

  return (
    <ScreenContainer>
      <ScreenHeader title="Emergency" subtitle="Tap any contact to call immediately" />

      <View style={[styles.warningBanner, { backgroundColor: colors.dangerTint, borderRadius: colors.radii.md }]}>
        <Ionicons name="warning" size={18} color={colors.danger} />
        <Text style={[styles.warningText, { color: colors.danger }]}>
          For life-threatening emergencies, call Ambulance or Fire immediately.
        </Text>
      </View>

      {/*
       * Real bug fixed here: the previous version forced every contact
       * into a fixed square (aspectRatio: 1) with no text truncation.
       * "Complaint Office (Landline)" or "EHS Security Reception (Main
       * Gate)" simply don't fit in a square the same way "CSO" does —
       * that's what "broken layout" meant. A row-card layout has no
       * such constraint: every card is the same height regardless of
       * name length, and long names wrap cleanly instead of overflowing.
       */}
      <View style={styles.list}>
        {EMERGENCY_CONTACTS.map((contact) => (
          <Pressable
            key={contact.id}
            onPress={() => call(contact.phone)}
            scaleTo={0.97}
            accessibilityLabel={`Call ${contact.name}`}
          >
            <Card style={styles.row}>
              <View style={[styles.iconWrap, { backgroundColor: colors.danger, borderRadius: colors.radii.md }]}>
                <Ionicons name={contact.icon} size={22} color="#FFFFFF" />
              </View>
              <View style={styles.rowText}>
                <Text style={[styles.contactName, { color: colors.textPrimary }]} numberOfLines={2}>
                  {contact.name}
                </Text>
                <Text style={[styles.contactPhone, { color: colors.textSecondary }]}>{contact.phone}</Text>
              </View>
              <View style={[styles.callBadge, { backgroundColor: colors.dangerTint, borderRadius: colors.radii.pill }]}>
                <Ionicons name="call" size={16} color={colors.danger} />
              </View>
            </Card>
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
  list: { gap: 12 },
  row: { flexDirection: "row", alignItems: "center", gap: 14 },
  iconWrap: { width: 48, height: 48, alignItems: "center", justifyContent: "center", flexShrink: 0 },
  rowText: { flex: 1, gap: 2 },
  contactName: { fontSize: 15, fontWeight: "700", lineHeight: 20 },
  contactPhone: { fontSize: 13, fontWeight: "500" },
  callBadge: { width: 36, height: 36, alignItems: "center", justifyContent: "center", flexShrink: 0 },
});
