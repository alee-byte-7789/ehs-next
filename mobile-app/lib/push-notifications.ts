import Constants from "expo-constants";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

import { apiClient } from "./api-client";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

/**
 * Registers this device for push notifications via Expo's own push
 * service and sends the resulting token to our backend. Only meaningful
 * on the native app built via EAS — browsers (the PWA) can't get an Expo
 * push token this way; see fcm-web-push.ts for that path instead.
 *
 * Safe to call unconditionally on app start: no-ops on web and on
 * non-physical devices (simulators can't receive real pushes) rather
 * than throwing.
 */
export async function registerForPushNotifications(): Promise<void> {
  if (Platform.OS === "web") return;
  if (!Device.isDevice) return;

  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== "granted") return;

    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("default", {
        name: "default",
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#10B981",
      });
    }

    const projectId = Constants.expoConfig?.extra?.eas?.projectId;
    const tokenResponse = await Notifications.getExpoPushTokenAsync(
      projectId ? { projectId } : undefined
    );

    await apiClient.post("/residents/me/push-token", { push_token: tokenResponse.data });
  } catch {
    // Never let push registration failure break app startup.
  }
}
