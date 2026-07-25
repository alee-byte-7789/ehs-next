import { useQuery } from "@tanstack/react-query";

import { apiClient } from "./api-client";
import type { PrayerTimingOut, SocietyInfoOut } from "./types";

export function useSocietyInfo() {
  return useQuery<SocietyInfoOut>({
    queryKey: ["society-info"],
    queryFn: async () => (await apiClient.get<SocietyInfoOut>("/society-info")).data,
    staleTime: 5 * 60_000,
  });
}

export function usePrayerTimings() {
  return useQuery<PrayerTimingOut[]>({
    queryKey: ["prayer-timings"],
    queryFn: async () => (await apiClient.get<PrayerTimingOut[]>("/prayer-timings")).data,
    staleTime: 5 * 60_000,
  });
}
