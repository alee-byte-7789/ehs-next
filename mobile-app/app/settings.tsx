import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useState } from "react";
import { StyleSheet, Switch, Text, View } from "react-native";

import { ScreenContainer } from "../components/ScreenContainer";
import { Card } from "../components/ui/Card";
import { Pressable } from "../components/ui/Pressable";
import { ScreenHeader } from "../components/ui/ScreenHeader";
import { useAuth } from "../lib/auth-context";
import { LOCALE_LABEL, useLocale, type Locale } from "../lib/i18n/locale-context";
import { ACCENTS, ACCENT_ORDER, type AccentKey } from "../lib/theme/palette";
import { useAppTheme, type ThemeMode } from "../lib/theme/theme-context";
import type { DisplaySize } from "../lib/theme/palette";

const MODE_OPTIONS: { key: ThemeMode; labelKey: "settings_follow_system" | "settings_light" | "settings_dark"; icon: keyof typeof Ionicons.glyphMap }[] = [
  { key: "system", labelKey: "settings_follow_system", icon: "phone-portrait-outline" },
  { key: "light", labelKey: "settings_light", icon: "sunny-outline" },
  { key: "dark", labelKey: "settings_dark", icon: "moon-outline" },
];

const DISPLAY_OPTIONS: { key: DisplaySize; labelKey: "settings_display_small" | "settings_display_default" | "settings_display_large" | "settings_display_xlarge" }[] = [
  { key: "small", labelKey: "settings_display_small" },
  { key: "default", labelKey: "settings_display_default" },
  { key: "large", labelKey: "settings_display_large" },
  { key: "xlarge", labelKey: "settings_display_xlarge" },
];

const LOCALE_OPTIONS: Locale[] = ["en", "ur"];

export default function SettingsScreen() {
  const { colors, mode, setMode, accent, setAccent, displaySize, setDisplaySize, glassEffect, setGlassEffect } =
    useAppTheme();
  const { locale, setLocale, t } = useLocale();
  const { logout } = useAuth();
  const [languageOpen, setLanguageOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    router.replace("/login");
  };

  return (
    <ScreenContainer>
      <ScreenHeader title={t("settings_title")} subtitle={t("settings_subtitle")} />

      <SectionLabel text={t("settings_appearance")} />
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
                  <Text style={[styles.segmentLabel, { color: active ? colors.primary : colors.textSecondary }]}>
                    {t(opt.labelKey)}
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </View>
      </Card>

      <Card padding={0} style={styles.listCard}>
        <View style={styles.switchRow}>
          <View style={styles.switchLeft}>
            <Ionicons name="water-outline" size={18} color={colors.textSecondary} />
            <View>
              <Text style={[styles.rowLabel, { color: colors.textPrimary }]}>{t("settings_glass_effect")}</Text>
              <Text style={[styles.switchDesc, { color: colors.textTertiary }]}>{t("settings_glass_effect_desc")}</Text>
            </View>
          </View>
          <Switch
            value={glassEffect}
            onValueChange={setGlassEffect}
            trackColor={{ true: colors.primary, false: colors.border }}
            thumbColor="#FFFFFF"
          />
        </View>
      </Card>

      <SectionLabel text={t("settings_theme_color")} />
      <Card>
        <View style={styles.swatchGrid}>
          {ACCENT_ORDER.map((key) => (
            <AccentSwatch key={key} accentKey={key} active={accent === key} onPress={() => setAccent(key)} />
          ))}
        </View>
      </Card>

      <SectionLabel text={t("settings_display")} />
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
                    {t(opt.labelKey)}
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </View>
      </Card>

      <SectionLabel text={t("settings_general")} />
      <Card padding={0} style={styles.listCard}>
        <Row
          icon="language-outline"
          label={t("settings_language")}
          value={LOCALE_LABEL[locale]}
          expanded={languageOpen}
          onPress={() => setLanguageOpen((v) => !v)}
        />
        {languageOpen ? (
          <View style={[styles.languagePanel, { borderTopColor: colors.border }]}>
            {LOCALE_OPTIONS.map((loc) => {
              const active = locale === loc;
              return (
                <Pressable
                  key={loc}
                  onPress={() => {
                    setLocale(loc);
                    setLanguageOpen(false);
                  }}
                  scaleTo={0.98}
                >
                  <View style={styles.languageOption}>
                    <Text style={[styles.languageOptionText, { color: active ? colors.primary : colors.textPrimary }]}>
                      {LOCALE_LABEL[loc]}
                    </Text>
                    {active ? <Ionicons name="checkmark" size={18} color={colors.primary} /> : null}
                  </View>
                </Pressable>
              );
            })}
          </View>
        ) : null}
        <Divider />
        <Row icon="notifications-outline" label={t("settings_notifications")} onPress={() => router.push("/notifications")} />
        <Divider />
        <Row icon="lock-closed-outline" label={t("settings_privacy")} onPress={() => {}} />
        <Divider />
        <Row icon="information-circle-outline" label={t("settings_about")} onPress={() => {}} />
      </Card>

      <Pressable onPress={handleLogout} style={styles.logoutRow}>
        <Ionicons name="log-out-outline" size={18} color={colors.danger} />
        <Text style={[styles.logoutText, { color: colors.danger }]}>{t("log_out")}</Text>
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

function Row({
  icon,
  label,
  value,
  onPress,
  expanded,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value?: string;
  onPress: () => void;
  expanded?: boolean;
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
          <Ionicons name={expanded ? "chevron-up" : "chevron-forward"} size={16} color={colors.textTertiary} />
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
  segmentCard: { padding: 8, marginBottom: 4 },
  segmentRow: { flexDirection: "row", gap: 8 },
  segmentPress: { flex: 1 },
  segmentItem: { alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 12, borderWidth: 1.5 },
  segmentLabel: { fontSize: 11, fontWeight: "600" },
  switchRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 16, paddingVertical: 14, marginTop: 12 },
  switchLeft: { flexDirection: "row", alignItems: "center", gap: 12, flexShrink: 1 },
  switchDesc: { fontSize: 11, marginTop: 2, maxWidth: 220 },
  swatchGrid: { flexDirection: "row", flexWrap: "wrap", gap: 16 },
  swatchWrap: { alignItems: "center", width: 64, gap: 6 },
  swatchOuter: { width: 52, height: 52, borderRadius: 26, borderWidth: 2, alignItems: "center", justifyContent: "center" },
  swatchInner: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  swatchLabel: { fontSize: 11, fontWeight: "500" },
  displayRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, padding: 8 },
  displayPill: { paddingHorizontal: 16, paddingVertical: 10 },
  displayPillText: { fontSize: 13, fontWeight: "600" },
  listCard: { overflow: "hidden", marginBottom: 16 },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 16, paddingVertical: 14 },
  rowLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  rowLabel: { fontSize: 15, fontWeight: "500" },
  rowValue: { fontSize: 13 },
  languagePanel: { borderTopWidth: StyleSheet.hairlineWidth, paddingVertical: 4 },
  languageOption: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 24, paddingVertical: 12 },
  languageOptionText: { fontSize: 14, fontWeight: "600" },
  logoutRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 28, paddingVertical: 12 },
  logoutText: { fontSize: 14, fontWeight: "700" },
});
