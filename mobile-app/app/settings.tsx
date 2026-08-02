import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { StyleSheet, Text, View } from "react-native";

import { ScreenContainer } from "../components/ScreenContainer";
import { Card } from "../components/ui/Card";
import { Pressable } from "../components/ui/Pressable";
import { ScreenHeader } from "../components/ui/ScreenHeader";
import { useAuth } from "../lib/auth-context";
import { ACCENTS, ACCENT_ORDER, type AccentKey } from "../lib/theme/palette";
import { useAppTheme, type ThemeMode } from "../lib/theme/theme-context";
import type { DisplaySize } from "../lib/theme/palette";

const MODE_OPTIONS: { key: ThemeMode; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { key: "system", label: "Follow System", icon: "phone-portrait-outline" },
  { key: "light", label: "Light", icon: "sunny-outline" },
  { key: "dark", label: "Dark", icon: "moon-outline" },
];

const DISPLAY_OPTIONS: { key: DisplaySize; label: string }[] = [
  { key: "small", label: "Small" },
  { key: "default", label: "Default" },
  { key: "large", label: "Large" },
  { key: "xlarge", label: "Extra Large" },
];

export default function SettingsScreen() {
  const { colors, mode, setMode, accent, setAccent, displaySize, setDisplaySize } = useAppTheme();
  const { logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    router.replace("/login");
  };

  return (
    <ScreenContainer>
      <ScreenHeader title="Settings" subtitle="Personalize how EHS Next looks and feels" />

      <SectionLabel text="Appearance" />
      <Card style={styles.segmentCard}>
        <View style={styles.segmentRow}>
          {MODE_OPTIONS.map((opt) => {
            const active = mode === opt.key;
            return (
              <Pressable key={opt.key} onPress={() => setMode(opt.key)} style={styles.segmentPress} scaleTo={0.96}>
                <View
                  style={[
                    styles.segmentItem,
                    {
                      backgroundColor: active ? colors.primaryTint : "transparent",
                      borderColor: active ? colors.primary : colors.border,
                      borderRadius: colors.radii.sm,
                    },
                  ]}
                >
                  <Ionicons name={opt.icon} size={18} color={active ? colors.primary : colors.textSecondary} />
                  <Text
                    style={[
                      styles.segmentLabel,
                      { color: active ? colors.primary : colors.textSecondary },
                    ]}
                  >
                    {opt.label}
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </View>
      </Card>

      <SectionLabel text="Theme Color" />
      <Card>
        <View style={styles.swatchGrid}>
          {ACCENT_ORDER.map((key) => (
            <AccentSwatch key={key} accentKey={key} active={accent === key} onPress={() => setAccent(key)} />
          ))}
        </View>
      </Card>

      <SectionLabel text="Display" />
      <Card style={styles.segmentCard}>
        <View style={styles.displayRow}>
          {DISPLAY_OPTIONS.map((opt) => {
            const active = displaySize === opt.key;
            return (
              <Pressable key={opt.key} onPress={() => setDisplaySize(opt.key)} scaleTo={0.94}>
                <View
                  style={[
                    styles.displayPill,
                    {
                      backgroundColor: active ? colors.primary : colors.surfaceSunken,
                      borderRadius: colors.radii.pill,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.displayPillText,
                      { color: active ? colors.onPrimary : colors.textSecondary },
                    ]}
                  >
                    {opt.label}
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </View>
      </Card>

      <SectionLabel text="General" />
      <Card padding={0} style={styles.listCard}>
        <Row icon="language-outline" label="Language" value="English" onPress={() => {}} />
        <Divider />
        <Row icon="notifications-outline" label="Notifications" onPress={() => router.push("/notifications")} />
        <Divider />
        <Row icon="lock-closed-outline" label="Privacy" onPress={() => {}} />
        <Divider />
        <Row icon="information-circle-outline" label="About EHS Next" onPress={() => {}} />
      </Card>

      <Pressable onPress={handleLogout} style={styles.logoutRow}>
        <Ionicons name="log-out-outline" size={18} color={colors.danger} />
        <Text style={[styles.logoutText, { color: colors.danger }]}>Log out</Text>
      </Pressable>
    </ScreenContainer>
  );
}

function SectionLabel({ text }: { text: string }) {
  const { colors } = useAppTheme();
  return <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>{text}</Text>;
}

function AccentSwatch({
  accentKey,
  active,
  onPress,
}: {
  accentKey: AccentKey;
  active: boolean;
  onPress: () => void;
}) {
  const { colors } = useAppTheme();
  const swatch = ACCENTS[accentKey];
  return (
    <Pressable onPress={onPress} scaleTo={0.9} style={styles.swatchWrap}>
      <View
        style={[
          styles.swatchOuter,
          { borderColor: active ? swatch.base : "transparent" },
        ]}
      >
        <View style={[styles.swatchInner, { backgroundColor: swatch.base }]}>
          {active ? <Ionicons name="checkmark" size={18} color={swatch.onBase} /> : null}
        </View>
      </View>
      <Text style={[styles.swatchLabel, { color: colors.textSecondary }]}>{swatch.label}</Text>
    </Pressable>
  );
}

function Row({
  icon,
  label,
  value,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value?: string;
  onPress: () => void;
}) {
  const { colors } = useAppTheme();
  return (
    <Pressable onPress={onPress} scaleTo={0.98}>
      <View style={styles.row}>
        <View style={styles.rowLeft}>
          <Ionicons name={icon} size={19} color={colors.textSecondary} />
          <Text style={[styles.rowLabel, { color: colors.textPrimary }]}>{label}</Text>
        </View>
        <View style={styles.rowLeft}>
          {value ? <Text style={[styles.rowValue, { color: colors.textTertiary }]}>{value}</Text> : null}
          <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} />
        </View>
      </View>
    </Pressable>
  );
}

function Divider() {
  const { colors } = useAppTheme();
  return <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: colors.border }} />;
}

const styles = StyleSheet.create({
  sectionLabel: {
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginTop: 20,
    marginBottom: 10,
  },
  segmentCard: { padding: 8 },
  segmentRow: { flexDirection: "row", gap: 8 },
  segmentPress: { flex: 1 },
  segmentItem: {
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 12,
    borderWidth: 1.5,
  },
  segmentLabel: { fontSize: 11, fontWeight: "600" },
  swatchGrid: { flexDirection: "row", flexWrap: "wrap", gap: 16 },
  swatchWrap: { alignItems: "center", width: 64, gap: 6 },
  swatchOuter: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  swatchInner: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  swatchLabel: { fontSize: 11, fontWeight: "500" },
  displayRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, padding: 8 },
  displayPill: { paddingHorizontal: 16, paddingVertical: 10 },
  displayPillText: { fontSize: 13, fontWeight: "600" },
  listCard: { overflow: "hidden" },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  rowLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  rowLabel: { fontSize: 15, fontWeight: "500" },
  rowValue: { fontSize: 13 },
  logoutRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 28,
    paddingVertical: 12,
  },
  logoutText: { fontSize: 14, fontWeight: "700" },
});
