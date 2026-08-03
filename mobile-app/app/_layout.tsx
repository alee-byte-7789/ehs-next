import { QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { AdminAuthProvider } from "../lib/admin-auth-context";
import { AuthProvider } from "../lib/auth-context";
import { LocaleProvider } from "../lib/i18n/locale-context";
import { queryClient } from "../lib/query-client";
import { ThemeProvider } from "../lib/theme/theme-context";

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <LocaleProvider>
          <QueryClientProvider client={queryClient}>
            <AuthProvider>
              <AdminAuthProvider>
                <Stack screenOptions={{ headerShown: false, animation: "fade_from_bottom" }}>
                  <Stack.Screen name="index" />
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
              </AdminAuthProvider>
            </AuthProvider>
          </QueryClientProvider>
        </LocaleProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
