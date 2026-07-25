import { QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { AdminAuthProvider } from "../lib/admin-auth-context";
import { AuthProvider } from "../lib/auth-context";
import { queryClient } from "../lib/query-client";

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <AdminAuthProvider>
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="index" />
              <Stack.Screen name="login" />
              <Stack.Screen name="register" />
              <Stack.Screen name="pending" />
              <Stack.Screen name="home" />
              <Stack.Screen name="complaints/index" />
              <Stack.Screen name="complaints/new" />
              <Stack.Screen name="complaints/[id]" />
              <Stack.Screen name="about" />
              <Stack.Screen name="prayer-timings" />
              <Stack.Screen name="admin-login" />
            </Stack>
          </AdminAuthProvider>
        </AuthProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
