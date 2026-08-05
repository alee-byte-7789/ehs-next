import { QueryClientProvider } from "@tanstack/react-query";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { AdminAuthProvider } from "../lib/admin-auth-context";
import { AuthGuard } from "../lib/auth-guard";
import { AuthProvider } from "../lib/auth-context";
import { LocaleProvider } from "../lib/i18n/locale-context";
import { queryClient } from "../lib/query-client";
import { ThemeProvider } from "../lib/theme/theme-context";

export default function RootLayout() {
  // Barlow Semi Condensed — SIL Open Font License, free for commercial use
  // (see assets/fonts/OFL-Barlow.txt). Four separate weight files rather
  // than one: React Native does not synthesise faux-bold reliably for
  // custom fonts, so each weight has to be a real file and AppText maps
  // fontWeight onto the right one.
  const [fontsLoaded] = useFonts({
    "Barlow-Regular": require("../assets/fonts/BarlowSemiCondensed-Regular.ttf"),
    "Barlow-Medium": require("../assets/fonts/BarlowSemiCondensed-Medium.ttf"),
    "Barlow-SemiBold": require("../assets/fonts/BarlowSemiCondensed-SemiBold.ttf"),
    "Barlow-Bold": require("../assets/fonts/BarlowSemiCondensed-Bold.ttf"),
  });

  // Render nothing until the fonts are in memory. Without this the first
  // frame paints in the system font and then visibly reflows once Barlow
  // arrives — the splash screen covers this gap instead.
  if (!fontsLoaded) return null;

  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <LocaleProvider>
          <QueryClientProvider client={queryClient}>
            <AuthProvider>
              <AdminAuthProvider>
                <AuthGuard>
                  <Stack screenOptions={{ headerShown: false, animation: "fade_from_bottom" }}>
                    <Stack.Screen name="index" />
                    <Stack.Screen name="appearance-onboarding" />
                    <Stack.Screen name="login" />
                    <Stack.Screen name="register" />
                    <Stack.Screen name="pending" />
                    <Stack.Screen name="home" />
                    <Stack.Screen name="settings" />
                    <Stack.Screen name="notifications" />
                    <Stack.Screen name="profile" />
                    <Stack.Screen name="emergency" />
                    <Stack.Screen name="prayer-timings" />
                    <Stack.Screen name="admin-login" />
                    <Stack.Screen name="complaints/index" />
                    <Stack.Screen name="complaints/new" />
                    <Stack.Screen name="complaints/[id]" />
                  </Stack>
                </AuthGuard>
              </AdminAuthProvider>
            </AuthProvider>
          </QueryClientProvider>
        </LocaleProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
