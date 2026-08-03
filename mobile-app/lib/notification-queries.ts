import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { apiClient } from "./api-client";
import type { NotificationOut } from "./types";

const MINE_KEY = ["notifications", "mine"] as const;
const UNREAD_COUNT_KEY = ["notifications", "unread-count"] as const;

/** GET /notifications/mine — the resident's real notifications, no mock data. */
export function useMyNotifications(enabled = true) {
  return useQuery<NotificationOut[]>({
    queryKey: MINE_KEY,
    queryFn: async () => {
      const { data } = await apiClient.get<NotificationOut[]>("/notifications/mine");
      return data;
    },
    enabled,
    refetchInterval: 20_000, // near-real-time badge/list updates without a manual refresh
  });
}

/** GET /notifications/mine/unread-count — powers the bell badge on Home. */
export function useUnreadNotificationCount(enabled = true) {
  return useQuery<{ count: number }>({
    queryKey: UNREAD_COUNT_KEY,
    queryFn: async () => {
      const { data } = await apiClient.get<{ count: number }>("/notifications/mine/unread-count");
      return data;
    },
    enabled,
    refetchInterval: 20_000,
  });
}

/** POST /notifications/{id}/read — mark one notification as read. */
export function useMarkNotificationRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const { data } = await apiClient.post<NotificationOut>(`/notifications/${id}/read`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MINE_KEY });
      queryClient.invalidateQueries({ queryKey: UNREAD_COUNT_KEY });
    },
  });
}

/**
 * "Mark all read" — the backend has no bulk endpoint for this, so this
 * fires one PATCH-equivalent call per unread notification. Fine at the
 * scale a single resident's notification list will realistically reach;
 * would need a real bulk endpoint if that ever changes.
 */
export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (unreadIds: number[]) => {
      await Promise.all(unreadIds.map((id) => apiClient.post(`/notifications/${id}/read`)));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MINE_KEY });
      queryClient.invalidateQueries({ queryKey: UNREAD_COUNT_KEY });
    },
  });
}
