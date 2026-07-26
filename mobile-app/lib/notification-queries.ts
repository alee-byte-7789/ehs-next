import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { apiClient } from "./api-client";
import type { NotificationOut } from "./types";

export function useMyNotifications() {
  return useQuery<NotificationOut[]>({
    queryKey: ["notifications", "mine"],
    queryFn: async () => (await apiClient.get<NotificationOut[]>("/notifications/mine")).data,
    refetchInterval: 20_000,
  });
}

export function useUnreadNotificationCount() {
  return useQuery<{ count: number }>({
    queryKey: ["notifications", "unread-count"],
    queryFn: async () => (await apiClient.get<{ count: number }>("/notifications/mine/unread-count")).data,
    refetchInterval: 20_000,
  });
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();
  return useMutation<NotificationOut, unknown, number>({
    mutationFn: async (notificationId) =>
      (await apiClient.post<NotificationOut>(`/notifications/${notificationId}/read`)).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}
