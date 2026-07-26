import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { apiClient } from "./api-client";
import type { NotificationOut } from "./types";

export function useAdminNotifications() {
  return useQuery<NotificationOut[]>({
    queryKey: ["admin-notifications", "list"],
    queryFn: async () => (await apiClient.get<NotificationOut[]>("/notifications/admin/mine")).data,
    refetchInterval: 20_000,
  });
}

export function useAdminUnreadCount() {
  return useQuery<{ count: number }>({
    queryKey: ["admin-notifications", "unread-count"],
    queryFn: async () => (await apiClient.get<{ count: number }>("/notifications/admin/mine/unread-count")).data,
    refetchInterval: 20_000,
  });
}

export function useMarkAdminNotificationRead() {
  const queryClient = useQueryClient();
  return useMutation<NotificationOut, unknown, number>({
    mutationFn: async (notificationId) =>
      (await apiClient.post<NotificationOut>(`/notifications/admin/${notificationId}/read`)).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-notifications"] });
    },
  });
}
