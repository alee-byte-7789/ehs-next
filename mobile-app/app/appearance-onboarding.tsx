import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { StyleSheet, View } from "react-native";
import { AppText as Text } from "../components/ui/AppText";

import { ScreenContainer } from "../components/ScreenContainer";
import { Card } from "../components/ui/Card";
import { GlassSegmentedControl } from "../components/ui/GlassSegmentedControl";
import { Pressable } from "../components/ui/Pressable";
import { markAppearanceOnboardingSeen } from "../lib/onboarding-storage";
import { ACCENTS, ACCENT_ORDER, type AccentKey, type DisplaySize } from "../lib/theme/palette";
import { useAppTheme, type ThemeMode } from "../lib/theme/theme-context";

const MODE_OPTIONS: { key: ThemeMode; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { key: "system", label: "System", icon: "phone-portrait" },
  { key: "light", label: "Light", icon: "sunny" },
  { key: "dark", label: "Dark", icon: "moon" },
];

const DISPLAY_OPTIONS: { key: DisplaySize; label: string }[] = [
  { key: "small", label: "Small" },
  { key: "default", label: "Default" },
  { key: "large", label: "Large" },
  { key: "xlarge", label: "Extra Large" },
];

/**
 * Shown at two points, per the spec: (1) the very first time the app is
 * ever opened on a device — before registration/login even happens, and
 * (2) after every successful login, first-time or not. Both entry points
 * pass a `next` query param for where to continue afterward, so this
 * screen doesn't need to know or care which flow it's part of.
 */
export default function AppearanceOnboardingScreen() {
  const { colors, mode, setMode, accent, setAccent, displaySize, setDisplaySize } =
    useAppTheme();
  const { next } = useLocalSearchParams<{ next?: string }>();

  const handleContinue = async () => {
    await markAppearanceOnboardingSeen();
    router.replace((next as string) || "/login");
  };

  return (
    <ScreenContainer>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>Make it yours</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Pick how EHS Next looks — you can always change this later in Settings.
        </Text>
      </View>

      <SectionLabel text="Appearance" />
      <GlassSegmentedControl
        options={MODE_OPTIONS.map((opt) => ({ key: opt.key, label: opt.label, icon: opt.icon }))}
        value={mode}
        onChange={setMode}
      />

      <SectionLabel text="Theme Color" />
      <Card>
        <View style={styles.swatchGrid}>
          {ACCENT_ORDER.map((key) => (
            <AccentSwatch key={key} accentKey={key} active={accent === key} onPress={() => setAccent(key)} />
          ))}
        </View>
      </Card>

      <SectionLabel text="Display Size" />
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
                  <Text style={[styles.displayPillText, { color: active ? colors.onPrimary : colors.textSecondary }]}>
                    {opt.label}
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </View>
      </Card>

      <Pressable onPress={handleContinue} style={styles.continueWrap} scaleTo={0.97}>
        <View style={[styles.continueBtn, { backgroundColor: colors.primary, borderRadius: colors.radii.button }]}>
          <Text style={[styles.continueText, { color: colors.onPrimary }]}>Continue</Text>
        </View>
      </Pressable>
    </ScreenContainer>
  );
}

function SectionLabel({ text }: { text: string }) {
  const { colors } = useAppTheme();
  return <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>{text}</Text>;
}

function AccentSwatch({ accentKey, active, onPress }: { accentKey: AccentKey; active: boolean; onPress: () => void }) {
  const { colors } = useAppTheme();
  const swatch = ACCENTS[accentKey];
  return (
    <Pressable onPress={onPress} scaleTo={0.9} style={styles.swatchWrap}>
      <View style={[styles.swatchOuter, { borderColor: active ? swatch.base : "transparent" }]}>
        <View style={[styles.swatchInner, { backgroundColor: swatch.base }]}>
          {active ? <Ionicons name="checkmark" size={18} color={swatch.onBase} /> : null}
        </View>
      </View>
      <Text style={[styles.swatchLabel, { color: colors.textSecondary }]}>{swatch.label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  header: { marginBottom: 8 },
  title: { fontSize: 26, fontWeight: "800", marginBottom: 6 },
  subtitle: { fontSize: 14, lineHeight: 20 },
  sectionLabel: { fontSize: 12, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.5, marginTop: 20, marginBottom: 10 },
  segmentCard: { padding: 8, marginBottom: 4 },
  listCard: { marginBottom: 4 },
  switchRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 14 },
  switchLeft: { flexDirection: "row", alignItems: "center", gap: 12, flex: 1 },
  rowLabel: { fontSize: 14, fontWeight: "600" },
  switchDesc: { fontSize: 12, marginTop: 2 },
  swatchGrid: { flexDirection: "row", flexWrap: "wrap", gap: 16 },
  swatchWrap: { alignItems: "center", width: 64, gap: 6 },
  swatchOuter: { width: 52, height: 52, borderRadius: 26, borderWidth: 2, alignItems: "center", justifyContent: "center" },
  swatchInner: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  swatchLabel: { fontSize: 11, fontWeight: "500" },
  displayRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, padding: 8 },
  displayPill: { paddingHorizontal: 16, paddingVertical: 10 },
  displayPillText: { fontSize: 13, fontWeight: "600" },
  continueWrap: { marginTop: 28, marginBottom: 12 },
  continueBtn: { paddingVertical: 16, alignItems: "center" },
  continueText: { fontSize: 16, fontWeight: "700" },
});
