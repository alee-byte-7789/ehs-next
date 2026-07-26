import { zodResolver } from "@hookform/resolvers/zod";
import { Link, router } from "expo-router";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { StyleSheet, Text } from "react-native";
import { z } from "zod";

import { AppButton } from "../components/AppButton";
import { ThemedLogo } from "../components/ThemedLogo";
import { AppTextField } from "../components/AppTextField";
import { ScreenContainer } from "../components/ScreenContainer";
import { extractApiErrorMessage } from "../lib/api-client";
import { useAuth } from "../lib/auth-context";
import { useTranslation } from "../lib/i18n";
import { spacing } from "../lib/theme";
import { useTheme } from "../lib/use-theme";

const schema = z.object({
  identifier: z.string().min(1, "Enter your phone or email"),
  password: z.string().min(1, "Enter your password"),
});

type FormValues = z.infer<typeof schema>;

export default function LoginScreen() {
  const { login } = useAuth();
  const { t } = useTranslation();
  const theme = useTheme();
  const [serverError, setServerError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { identifier: "", password: "" },
  });

  const onSubmit = async (values: FormValues) => {
    setServerError(null);
    setSubmitting(true);
    let loggedIn = false;
    try {
      await login(values);
      loggedIn = true;
    } catch (err) {
      setServerError(extractApiErrorMessage(err, "Login failed. Check your credentials."));
    } finally {
      setSubmitting(false);
    }
    if (loggedIn) {
      router.replace("/");
    }
  };

  return (
    <ScreenContainer>
      <ThemedLogo style={styles.logo} />
      <Text style={[styles.title, { color: theme.textPrimary }]}>{t("welcomeBack")}</Text>
      <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
        {t("loginSubtitle")}
      </Text>

      <Controller
        control={control}
        name="identifier"
        render={({ field }) => (
          <AppTextField
            label={t("phoneOrEmail")}
            autoCapitalize="none"
            keyboardType="email-address"
            value={field.value}
            onChangeText={field.onChange}
            error={errors.identifier?.message}
          />
        )}
      />

      <Controller
        control={control}
        name="password"
        render={({ field }) => (
          <AppTextField
            label={t("password")}
            secureTextEntry
            value={field.value}
            onChangeText={field.onChange}
            error={errors.password?.message}
          />
        )}
      />

      {serverError ? <Text style={[styles.serverError, { color: theme.danger }]}>{serverError}</Text> : null}

      <AppButton label={t("login")} onPress={handleSubmit(onSubmit)} loading={submitting} />

      <Link href="/register" style={[styles.link, { color: theme.primary }]}>
        {t("newHereRegister")}
      </Link>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  logo: {
    width: 64,
    height: 64,
    alignSelf: "center",
    marginBottom: spacing.md,
  },
  title: {
    fontSize: 28,
    fontWeight: "600",
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: 15,
    marginBottom: spacing.lg,
  },
  serverError: {
    fontSize: 13,
    marginBottom: spacing.md,
    textAlign: "center",
  },
  link: {
    marginTop: spacing.lg,
    textAlign: "center",
    fontSize: 14,
    fontWeight: "500",
  },
});
