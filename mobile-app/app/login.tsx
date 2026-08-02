import { Ionicons } from "@expo/vector-icons";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, router } from "expo-router";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { StyleSheet, Text, View } from "react-native";
import { z } from "zod";

import { AppButton } from "../components/AppButton";
import { AppTextField } from "../components/AppTextField";
import { ScreenContainer } from "../components/ScreenContainer";
import { Pressable } from "../components/ui/Pressable";
import { extractApiErrorMessage } from "../lib/api-client";
import { useAuth } from "../lib/auth-context";
import { useAppTheme } from "../lib/theme/theme-context";

const schema = z.object({
  identifier: z.string().min(1, "Enter your phone or email"),
  password: z.string().min(1, "Enter your password"),
});

type FormValues = z.infer<typeof schema>;

export default function LoginScreen() {
  const { login } = useAuth();
  const { colors } = useAppTheme();
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
      <View style={styles.topRow}>
        <View style={[styles.logo, { backgroundColor: colors.primaryTint, borderRadius: colors.radii.lg }]}>
          <Ionicons name="business" size={26} color={colors.primary} />
        </View>
        <Pressable
          onPress={() => router.push("/settings")}
          scaleTo={0.9}
          accessibilityLabel="Appearance settings"
          style={[styles.themeBtn, { borderColor: colors.border, backgroundColor: colors.surfaceElevated }]}
        >
          <Ionicons name="color-palette-outline" size={19} color={colors.textPrimary} />
        </Pressable>
      </View>

      <Text style={[styles.title, { color: colors.textPrimary }]}>Welcome back</Text>
      <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
        Log in to EHS Next with your phone or email.
      </Text>

      <Controller
        control={control}
        name="identifier"
        render={({ field }) => (
          <AppTextField
            label="Phone or email"
            autoCapitalize="none"
            keyboardType="email-address"
            placeholder="e.g. 03xx-xxxxxxx or you@email.com"
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
            label="Password"
            secureTextEntry
            placeholder="••••••••"
            value={field.value}
            onChangeText={field.onChange}
            error={errors.password?.message}
          />
        )}
      />

      {serverError ? <Text style={[styles.serverError, { color: colors.danger }]}>{serverError}</Text> : null}

      <AppButton label="Log in" onPress={handleSubmit(onSubmit)} loading={submitting} />

      <Link href="/register" style={[styles.link, { color: colors.primary }]}>
        New here? Register your house
      </Link>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 28,
  },
  logo: {
    width: 52,
    height: 52,
    alignItems: "center",
    justifyContent: "center",
  },
  themeBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 15,
    marginBottom: 24,
  },
  serverError: {
    fontSize: 13,
    marginBottom: 16,
    textAlign: "center",
  },
  link: {
    marginTop: 20,
    textAlign: "center",
    fontSize: 14,
    fontWeight: "600",
  },
});
