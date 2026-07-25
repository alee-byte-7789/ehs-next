import { useMutation, useQueryClient } from "@tanstack/react-query";

import { adminApiClient } from "./admin-api-client";
import type { MosqueName, PrayerTimingOut, PrayerTimingUpdateRequest } from "./types";

export function useUpdatePrayerTiming() {
  const queryClient = useQueryClient();
  return useMutation<PrayerTimingOut, unknown, { mosqueName: MosqueName; payload: PrayerTimingUpdateRequest }>({
    mutationFn: async ({ mosqueName, payload }) =>
      (await adminApiClient.put<PrayerTimingOut>(`/prayer-timings/${mosqueName}`, payload)).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["prayer-timings"] });
    },
  });
}
