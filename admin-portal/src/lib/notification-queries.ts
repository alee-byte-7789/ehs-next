import { useEffect, useRef } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { apiClient } from "./api-client";
import type { NotificationOut } from "./types";

export function useAdminNotifications() {
  return useQuery<NotificationOut[]>({
    queryKey: ["admin-notifications", "list"],
    queryFn: async () => (await apiClient.get<NotificationOut[]>("/notifications/admin/mine")).data,
    refetchInterval: 8_000,
  });
}

export function useAdminUnreadCount() {
  return useQuery<{ count: number }>({
    queryKey: ["admin-notifications", "unread-count"],
    queryFn: async () => (await apiClient.get<{ count: number }>("/notifications/admin/mine/unread-count")).data,
    refetchInterval: 8_000,
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

/**
 * Plays a sound and updates the browser tab title with the unread count
 * whenever that count goes UP. This is deliberately independent of push
 * notifications and needs zero special browser permission — it works
 * as long as the admin has the tab open, which is the realistic case
 * for someone actively monitoring complaints. This is the reliable
 * fallback: push notifications depend on permission grants, a working
 * service worker, and a correctly configured Firebase credential, any
 * of which can silently fail; this cannot.
 */
export function useAdminNotificationAlerts() {
  const { data: unread } = useAdminUnreadCount();
  const previousCount = useRef<number | null>(null);
  const originalTitle = useRef<string>(typeof document !== "undefined" ? document.title : "EHS Next Admin");

  useEffect(() => {
    if (unread === undefined) return;

    if (previousCount.current !== null && unread.count > previousCount.current) {
      playAlertSound();
    }
    previousCount.current = unread.count;

    if (typeof document !== "undefined") {
      document.title = unread.count > 0 ? `(${unread.count}) ${originalTitle.current}` : originalTitle.current;
    }
  }, [unread]);
}

function playAlertSound() {
  try {
    const AudioContextClass = window.AudioContext || (window as never as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new AudioContextClass();
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    oscillator.connect(gain);
    gain.connect(ctx.destination);
    oscillator.frequency.value = 880;
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
    oscillator.start();
    oscillator.stop(ctx.currentTime + 0.35);
  } catch {
    // Audio can fail for reasons outside our control (autoplay policy
    // before any user interaction, etc.) — never let this break the app.
  }
}
