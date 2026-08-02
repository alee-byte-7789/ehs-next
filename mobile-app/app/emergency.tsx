import { Ionicons } from "@expo/vector-icons";
import { Alert, Linking, StyleSheet, Text, View } from "react-native";

import { ScreenContainer } from "../components/ScreenContainer";
import { Card } from "../components/ui/Card";
import { Pressable } from "../components/ui/Pressable";
import { ScreenHeader } from "../components/ui/ScreenHeader";
import { EMERGENCY_CONTACTS, type EmergencyContact } from "../lib/mock-data";
import { useAppTheme } from "../lib/theme/theme-context";

export default function EmergencyScreen() {
  const { colors } = useAppTheme();

  const call = (contact: EmergencyContact) => {
    Linking.openURL(`tel:${contact.phone}`).catch(() =>
      Alert.alert("Couldn't place call", `You can reach ${contact.name} directly at ${contact.phone}.`)
    );
  };

  return (
    <ScreenContainer>
      <ScreenHeader title="Emergency" subtitle="One-tap dial — for urgent situations only" />

      <View style={[styles.banner, { backgroundColor: colors.dangerTint, borderRadius: colors.radii.lg }]}>
        <Ionicons name="warning-outline" size={18} color={colors.danger} />
        <Text style={[styles.bannerText, { color: colors.danger }]}>
          If this is a life-threatening emergency, call Fire or Ambulance immediately.
        </Text>
      </View>

      <View style={styles.list}>
        {EMERGENCY_CONTACTS.map((contact) => (
          <Pressable key={contact.id} onPress={() => call(contact)} scaleTo={0.97} style={styles.pressWrap}>
            <Card style={styles.card}>
              <View style={[styles.iconWrap, { backgroundColor: colors.dangerTint, borderRadius: colors.radii.md }]}>
                <Ionicons name={contact.icon} size={24} color={colors.danger} />
              </View>
              <View style={styles.textWrap}>
                <Text style={[styles.name, { color: colors.textPrimary }]}>{contact.name}</Text>
                <Text style={[styles.phone, { color: colors.textSecondary }]}>{contact.phone}</Text>
              </View>
              <View style={[styles.callButton, { backgroundColor: colors.danger }]}>
                <Ionicons name="call" size={18} color="#FFFFFF" />
              </View>
            </Card>
          </Pressable>
        ))}
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  banner: { flexDirection: "row", gap: 10, alignItems: "flex-start", padding: 14, marginBottom: 20 },
  bannerText: { fontSize: 13, fontWeight: "600", flex: 1, lineHeight: 18 },
  list: { gap: 10 },
  pressWrap: {},
  card: { flexDirection: "row", alignItems: "center", gap: 14 },
  iconWrap: { width: 52, height: 52, alignItems: "center", justifyContent: "center" },
  textWrap: { flex: 1, gap: 2 },
  name: { fontSize: 16, fontWeight: "700" },
  phone: { fontSize: 13, fontWeight: "500" },
  callButton: { width: 42, height: 42, borderRadius: 21, alignItems: "center", justifyContent: "center" },
});
