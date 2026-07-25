import axios from "axios";

import { adminTokenStorage } from "./admin-token-storage";

const BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL ?? "http://localhost:8000/api/v1";

/**
 * A separate instance from `apiClient` (lib/api-client.ts) is deliberate:
 * that client's request interceptor always attaches the RESIDENT token if
 * one exists in storage, which would silently clobber an admin token set
 * on the same request. Keeping this fully separate avoids that entirely,
 * at the cost of not sharing the refresh-on-401 logic — acceptable here
 * since this only supports one occasional admin action (see
 * admin-token-storage.ts for why).
 */
export const adminApiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
});

adminApiClient.interceptors.request.use(async (config) => {
  const token = await adminTokenStorage.getAccessToken();
  if (token) {
    config.headers.set("Authorization", `Bearer ${token}`);
  }
  return config;
});
