import { QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { AuthProvider } from "../lib/auth-context";
import { queryClient } from "../lib/query-client";
import { ThemeProvider } from "../lib/theme/theme-context";

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <Stack screenOptions={{ headerShown: false, animation: "fade_from_bottom" }}>
              <Stack.Screen name="index" />
              <Stack.Screen name="login" />
              <Stack.Screen name="register" />
              <Stack.Screen name="pending" />
              <Stack.Screen name="home" />
              <Stack.Screen name="settings" />
              {/* TODO (next batch): notifications, profile, maintenance, emergency,
                  complaints/index, complaints/new, complaints/[id] — register each
                  Stack.Screen here as its file is added under app/. */}
            </Stack>
          </AuthProvider>
        </QueryClientProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
