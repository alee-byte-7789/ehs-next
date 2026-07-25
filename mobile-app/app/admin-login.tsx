import { router } from "expo-router";
import { useState } from "react";
import { Pressable, StyleSheet, Text } from "react-native";

import { AppButton } from "../components/AppButton";
import { AppTextField } from "../components/AppTextField";
import { ScreenContainer } from "../components/ScreenContainer";
import { useAdminAuth } from "../lib/admin-auth-context";
import { spacing } from "../lib/theme";
import { useTheme } from "../lib/use-theme";

export default function AdminLoginScreen() {
  const theme = useTheme();
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
      setError("Invalid admin credentials.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScreenContainer scroll={false}>
      <Pressable onPress={() => router.back()} style={{ marginBottom: spacing.lg }}>
        <Text style={{ color: theme.primary, fontSize: 15 }}>← Back</Text>
      </Pressable>

      <Text style={[styles.title, { color: theme.textPrimary }]}>Admin Login</Text>
      <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
        For Housing Office admins only — used to edit prayer timings directly
        from the app instead of the Admin Portal website.
      </Text>

      <AppTextField label="Email" autoCapitalize="none" keyboardType="email-address" value={email} onChangeText={setEmail} />
      <AppTextField label="Password" secureTextEntry value={password} onChangeText={setPassword} />

      {error && <Text style={{ color: theme.danger, marginBottom: spacing.md, textAlign: "center" }}>{error}</Text>}

      <AppButton label="Log in as Admin" onPress={handleLogin} loading={submitting} />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 24, fontWeight: "700", marginBottom: spacing.xs },
  subtitle: { fontSize: 13, lineHeight: 18, marginBottom: spacing.lg },
});
