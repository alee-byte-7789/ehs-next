import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Switch, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AppButton } from "../../components/AppButton";
import { AppTextField } from "../../components/AppTextField";
import { extractApiErrorMessage } from "../../lib/api-client";
import { useChangePassword } from "../../lib/account-queries";
import { useAuth } from "../../lib/auth-context";
import { useTranslation } from "../../lib/i18n";
import { useResidentMe } from "../../lib/resident-queries";
import {
  fontScaleMultiplier,
  useSettings,
  type FontScale,
  type Language,
  type ThemeMode,
} from "../../lib/settings-context";
import { radii, shadow, spacing, type ColorThemeName } from "../../lib/theme";
import { useTheme } from "../../lib/use-theme";

const COLOR_THEME_OPTIONS: { value: ColorThemeName; swatchColor: string }[] = [
  { value: "green", swatchColor: "#10B981" },
  { value: "red", swatchColor: "#DC2626" },
  { value: "yellow", swatchColor: "#D97706" },
  { value: "blue", swatchColor: "#2563EB" },
];

export default function SettingsScreen() {
  const theme = useTheme();
  const { t } = useTranslation();
  const { logout } = useAuth();
  const { data: resident } = useResidentMe(true);
  const settings = useSettings();
  const changePassword = useChangePassword();

  const [showChangePassword, setShowChangePassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pwError, setPwError] = useState<string | null>(null);
  const [pwSuccess, setPwSuccess] = useState(false);

  const scale = fontScaleMultiplier(settings.fontScale);

  const resetChangePasswordForm = () => {
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setPwError(null);
  };

  const handleChangePassword = async () => {
    setPwError(null);
    setPwSuccess(false);

    // Client-side checks first — the server would also reject a too-short
    // password, but a mismatched confirmation is only ever knowable here.
    if (newPassword.length < 8) {
      setPwError(t("passwordTooShort"));
      return;
    }
    if (newPassword !== confirmPassword) {
      setPwError(t("passwordsDontMatch"));
      return;
    }

    try {
      await changePassword.mutateAsync({ current_password: currentPassword, new_password: newPassword });
      setPwSuccess(true);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setPwError(extractApiErrorMessage(err, "Could not change password."));
    }
  };

  const handleLogout = async () => {
    await logout();
    router.replace("/login");
  };

  return (
    <SafeAreaView style={[styles.flex, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.textPrimary, fontSize: 24 * scale }]}>{t("settings")}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Language */}
        <SectionCard title={t("language")} icon="language-outline" theme={theme} scale={scale}>
          <SegmentedRow
            options={[
              { value: "en" as Language, label: t("english") },
              { value: "ur" as Language, label: t("urdu") },
            ]}
            value={settings.language}
            onChange={settings.setLanguage}
            theme={theme}
            scale={scale}
          />
        </SectionCard>

        {/* Appearance */}
        <SectionCard title={t("appearance")} icon="contrast-outline" theme={theme} scale={scale}>
          <SegmentedRow
            options={[
              { value: "system" as ThemeMode, label: t("followSystem") },
              { value: "light" as ThemeMode, label: t("light") },
              { value: "dark" as ThemeMode, label: t("dark") },
            ]}
            value={settings.themeMode}
            onChange={settings.setThemeMode}
            theme={theme}
            scale={scale}
          />

          <Text style={[styles.colorThemeLabel, { color: theme.textSecondary, fontSize: 12 * scale }]}>
            {t("colorTheme")}
          </Text>
          <View style={styles.swatchRow}>
            {COLOR_THEME_OPTIONS.map((opt) => (
              <Pressable
                key={opt.value}
                onPress={() => settings.setColorTheme(opt.value)}
                style={[
                  styles.swatch,
                  { backgroundColor: opt.swatchColor },
                  settings.colorTheme === opt.value && { borderColor: theme.textPrimary, borderWidth: 3 },
                ]}
              >
                {settings.colorTheme === opt.value && <Ionicons name="checkmark" size={18} color="#FFFFFF" />}
              </Pressable>
            ))}
          </View>
        </SectionCard>

        {/* Display */}
        <SectionCard title={t("display")} subtitle={t("fontSize")} icon="text-outline" theme={theme} scale={scale}>
          <SegmentedRow
            options={[
              { value: "small" as FontScale, label: t("small") },
              { value: "default" as FontScale, label: t("default") },
              { value: "large" as FontScale, label: t("large") },
              { value: "extra_large" as FontScale, label: t("extraLarge") },
            ]}
            value={settings.fontScale}
            onChange={settings.setFontScale}
            theme={theme}
            scale={scale}
          />
        </SectionCard>

        {/* Notifications */}
        <SectionCard title={t("notifications")} icon="notifications-outline" theme={theme} scale={scale}>
          <ToggleRow label={t("complaintUpdates")} value={settings.notifications.complaintUpdates} onChange={(v) => settings.setNotificationPref("complaintUpdates", v)} theme={theme} scale={scale} />
          <ToggleRow label={t("announcements")} value={settings.notifications.announcements} onChange={(v) => settings.setNotificationPref("announcements", v)} theme={theme} scale={scale} />
          <ToggleRow label={t("emergencyAlerts")} value={settings.notifications.emergencyAlerts} onChange={(v) => settings.setNotificationPref("emergencyAlerts", v)} theme={theme} scale={scale} />
          <ToggleRow label={t("generalNotifications")} value={settings.notifications.general} onChange={(v) => settings.setNotificationPref("general", v)} theme={theme} scale={scale} />
        </SectionCard>

        {/* Account */}
        <SectionCard title={t("account")} icon="person-circle-outline" theme={theme} scale={scale}>
          <View style={[styles.accountInfoBox, { backgroundColor: theme.secondaryTint }]}>
            <AccountInfoRow icon="person-outline" label="Name" value={resident?.full_name ?? "—"} theme={theme} scale={scale} />
            <AccountInfoRow icon="id-card-outline" label="Resident ID" value={resident?.resident_code ?? "—"} theme={theme} scale={scale} />
            <AccountInfoRow icon="call-outline" label="Phone" value={resident?.phone ?? "—"} theme={theme} scale={scale} />
            {resident?.email && <AccountInfoRow icon="mail-outline" label="Email" value={resident.email} theme={theme} scale={scale} />}
            <AccountInfoRow
              icon="home-outline"
              label="Resident Type"
              value={resident?.resident_type === "owner" ? "Owner" : "Tenant"}
              theme={theme}
              scale={scale}
            />
            <AccountInfoRow
              icon="checkmark-circle-outline"
              label="Verification"
              value={resident?.verification_status ?? "—"}
              theme={theme}
              scale={scale}
              valueColor={theme.primary}
            />
          </View>

          {!showChangePassword && (
            <Pressable onPress={() => setShowChangePassword(true)} style={styles.linkRow}>
              <Text style={{ color: theme.primary, fontSize: 15 * scale, fontWeight: "600" }}>{t("changePassword")}</Text>
            </Pressable>
          )}

          {showChangePassword && (
            <View style={{ marginTop: spacing.sm }}>
              <AppTextField label={t("currentPassword")} secureTextEntry value={currentPassword} onChangeText={setCurrentPassword} />
              <AppTextField label={t("newPassword")} secureTextEntry value={newPassword} onChangeText={setNewPassword} />
              <AppTextField label={t("confirmNewPassword")} secureTextEntry value={confirmPassword} onChangeText={setConfirmPassword} />
              {pwError && <Text style={{ color: theme.danger, fontSize: 12 * scale, marginBottom: spacing.sm }}>{pwError}</Text>}
              {pwSuccess && <Text style={{ color: theme.primary, fontSize: 12 * scale, marginBottom: spacing.sm }}>{t("passwordChanged")}</Text>}
              <View style={{ flexDirection: "row", gap: spacing.sm }}>
                <AppButton label={t("save")} onPress={handleChangePassword} loading={changePassword.isPending} />
                <AppButton
                  label={t("cancel")}
                  variant="secondary"
                  onPress={() => {
                    resetChangePasswordForm();
                    setShowChangePassword(false);
                  }}
                />
              </View>
            </View>
          )}

          <View style={{ marginTop: spacing.md }}>
            <AppButton label={t("logout")} variant="secondary" onPress={handleLogout} />
          </View>
        </SectionCard>
      </ScrollView>
    </SafeAreaView>
  );
}

function SectionCard({
  title,
  subtitle,
  icon,
  theme,
  scale,
  children,
}: {
  title: string;
  subtitle?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  theme: ReturnType<typeof useTheme>;
  scale: number;
  children: React.ReactNode;
}) {
  return (
    <View style={[styles.card, { backgroundColor: theme.surfaceElevated }, shadow.card]}>
      <View style={styles.cardTitleRow}>
        {icon && <Ionicons name={icon} size={18} color={theme.primary} />}
        <Text style={[styles.cardTitle, { color: theme.textPrimary, fontSize: 15 * scale }]}>{title}</Text>
      </View>
      {subtitle && <Text style={{ color: theme.textSecondary, fontSize: 12 * scale, marginBottom: spacing.sm }}>{subtitle}</Text>}
      {children}
    </View>
  );
}

function SegmentedRow<T extends string>({
  options,
  value,
  onChange,
  theme,
  scale,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
  theme: ReturnType<typeof useTheme>;
  scale: number;
}) {
  return (
    <View style={styles.segmentRow}>
      {options.map((opt) => (
        <Pressable
          key={opt.value}
          onPress={() => onChange(opt.value)}
          style={[
            styles.segment,
            { borderColor: value === opt.value ? theme.primary : theme.border, backgroundColor: value === opt.value ? theme.primary : "transparent" },
          ]}
        >
          <Text style={{ color: value === opt.value ? "#FFFFFF" : theme.textPrimary, fontSize: 13 * scale, fontWeight: "600" }}>
            {opt.label}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

function ToggleRow({
  label,
  value,
  onChange,
  theme,
  scale,
}: {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
  theme: ReturnType<typeof useTheme>;
  scale: number;
}) {
  return (
    <View style={styles.toggleRow}>
      <Text style={{ color: theme.textPrimary, fontSize: 14 * scale }}>{label}</Text>
      <Switch value={value} onValueChange={onChange} trackColor={{ true: theme.primary }} />
    </View>
  );
}

function AccountInfoRow({
  icon,
  label,
  value,
  theme,
  scale,
  valueColor,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  theme: ReturnType<typeof useTheme>;
  scale: number;
  valueColor?: string;
}) {
  return (
    <View style={styles.accountInfoRow}>
      <Ionicons name={icon} size={16} color={theme.secondary} style={{ width: 22 }} />
      <Text style={{ color: theme.textSecondary, fontSize: 13 * scale, flex: 1 }}>{label}</Text>
      <Text style={{ color: valueColor ?? theme.textPrimary, fontSize: 13 * scale, fontWeight: "600" }} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  header: { paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.sm, gap: spacing.xs },
  title: { fontWeight: "700" },
  content: { padding: spacing.lg },
  card: { borderRadius: radii.lg, padding: spacing.md, marginBottom: spacing.md },
  cardTitleRow: { flexDirection: "row", alignItems: "center", gap: spacing.xs, marginBottom: spacing.sm },
  cardTitle: { fontWeight: "700" },
  segmentRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  colorThemeLabel: { fontWeight: "600", marginTop: spacing.md, marginBottom: spacing.sm },
  swatchRow: { flexDirection: "row", gap: spacing.sm },
  swatch: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 0,
    borderColor: "transparent",
  },
  segment: { borderWidth: 1.5, borderRadius: radii.md, paddingVertical: spacing.sm, paddingHorizontal: spacing.md },
  toggleRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: spacing.xs },
  accountInfoBox: { borderRadius: radii.md, padding: spacing.sm, marginBottom: spacing.md },
  accountInfoRow: { flexDirection: "row", alignItems: "center", paddingVertical: spacing.xs, gap: spacing.xs },
  linkRow: { paddingVertical: spacing.sm },
});
