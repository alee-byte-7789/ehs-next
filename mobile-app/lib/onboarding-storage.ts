import AsyncStorage from "@react-native-async-storage/async-storage";

const KEY = "ehs_has_opened_app_before";

/** True once the device has opened the app at least once before. */
export async function hasOpenedAppBefore(): Promise<boolean> {
  const value = await AsyncStorage.getItem(KEY);
  return value === "true";
}

/** Call once the user continues past the very-first-open appearance screen. */
export async function markAppearanceOnboardingSeen(): Promise<void> {
  await AsyncStorage.setItem(KEY, "true");
}
