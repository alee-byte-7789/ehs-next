import { router } from "expo-router";
import { useState } from "react";
import { StyleSheet, Text } from "react-native";

import { AppButton } from "../components/AppButton";
import { AppTextField } from "../components/AppTextField";
import { ScreenContainer } from "../components/ScreenContainer";
import { ScreenHeader } from "../components/ui/ScreenHeader";
import { useAdminAuth } from "../lib/admin-auth-context";
import { useLocale } from "../lib/i18n/locale-context";
import { useAppTheme } from "../lib/theme/theme-context";

export default function AdminLoginScreen() {
  const { colors } = useAppTheme();
  const { t } = useLocale();
  const { login } = useAdminAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleLogin = async () => {
    setError(null);
    setSubmitting(true);
    try {
      await login(email, password);
      router.replace("/prayer-timings");
    } catch {
      setError(t("admin_login_error"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScreenContainer scroll={false}>
      <ScreenHeader title={t("admin_login_title")} />

      <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{t("admin_login_subtitle")}</Text>

      <AppTextField
        label={t("admin_login_email")}
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />
      <AppTextField label={t("admin_login_password")} secureTextEntry value={password} onChangeText={setPassword} />

      {error && (
        <Text style={{ color: colors.danger, marginBottom: colors.spacing.md, textAlign: "center" }}>{error}</Text>
      )}

      <AppButton label={t("admin_login_button")} onPress={handleLogin} loading={submitting} />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  subtitle: { fontSize: 13, lineHeight: 18, marginBottom: 20 },
});
