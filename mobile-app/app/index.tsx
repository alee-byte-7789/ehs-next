import { Redirect } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { AppText as Text } from "../components/ui/AppText";

import { useAuth } from "../lib/auth-context";
import { hasOpenedAppBefore } from "../lib/onboarding-storage";
import { useResidentMe } from "../lib/resident-queries";
import { spacing } from "../lib/theme";
import { useTheme } from "../lib/use-theme";

export default function SplashGate() {
  const { status, logout } = useAuth();
  const theme = useTheme();

  const residentQuery = useResidentMe(status === "signed-in");

  const [checkedFirstOpen, setCheckedFirstOpen] = useState(false);
  const [isFirstOpenEver, setIsFirstOpenEver] = useState(false);

  useEffect(() => {
    hasOpenedAppBefore().then((seenBefore) => {
      setIsFirstOpenEver(!seenBefore);
      setCheckedFirstOpen(true);
    });
  }, []);

  const isLoading =
    !checkedFirstOpen || status === "checking" || (status === "signed-in" && residentQuery.isPending);

  if (isLoading) {
    return (
      <View style={[styles.center, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.primary} />
        <Text style={[styles.brand, { color: theme.textPrimary }]}>EHS Next</Text>
      </View>
    );
  }

  if (status === "signed-out") {
    // Very first time this device has ever opened the app, before any
    // registration/login has happened — show the appearance picker first.
    if (isFirstOpenEver) {
      return <Redirect href="/appearance-onboarding?next=/login" />;
    }
    return <Redirect href="/login" />;
  }

  // Signed in, but the stored token no longer resolves to a valid account
  // (e.g. rejected after login, or revoked) — the request interceptor's
  // refresh attempt already failed by this point, so treat it as signed out.
  if (residentQuery.isError) {
    logout();
    return <Redirect href="/login" />;
  }

  if (residentQuery.data?.verification_status === "pending") {
    return <Redirect href="/pending" />;
  }

  return <Redirect href="/home" />;
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.md,
  },
  brand: {
    fontSize: 20,
    fontWeight: "600",
  },
});
