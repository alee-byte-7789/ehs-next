import AsyncStorage from "@react-native-async-storage/async-storage";

const ADMIN_ACCESS_TOKEN_KEY = "ehs_mobile_admin_access_token";

/**
 * Deliberately minimal — this exists only to support the one admin action
 * available inside the resident-facing mobile app (editing prayer
 * timings), not a full parallel admin experience. No refresh token stored;
 * the admin just logs in again if this expires (30 min access token,
 * per Module 3's settings) since this is an occasional, short task.
 */
export const adminTokenStorage = {
  async getAccessToken(): Promise<string | null> {
    return AsyncStorage.getItem(ADMIN_ACCESS_TOKEN_KEY);
  },
  async setAccessToken(token: string): Promise<void> {
    await AsyncStorage.setItem(ADMIN_ACCESS_TOKEN_KEY, token);
  },
  async clear(): Promise<void> {
    await AsyncStorage.removeItem(ADMIN_ACCESS_TOKEN_KEY);
  },
};
