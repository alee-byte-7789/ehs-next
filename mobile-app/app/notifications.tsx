import { Ionicons } from "@expo/vector-icons";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { AppText as Text } from "../components/ui/AppText";

import { ScreenContainer } from "../components/ScreenContainer";
import { Card } from "../components/ui/Card";
import { EmptyState, ScreenHeader } from "../components/ui/ScreenHeader";
import { Pressable } from "../components/ui/Pressable";
import { extractApiErrorMessage } from "../lib/api-client";
import {
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useMyNotifications,
} from "../lib/notification-queries";
import { useAppTheme } from "../lib/theme/theme-context";
import type { NotificationOut } from "../lib/types";

/**
 * The backend's `type` field is a specific event name (e.g.
 * "complaint_status", "complaint_priority", "registration_approved") —
 * this maps each real type to one of the three icon "kinds" the existing
 * UI already knows how to render, rather than changing the UI itself.
 */
const TYPE_TO_KIND: Record<string, "status" | "priority" | "general"> = {
  complaint_status: "status",
  complaint_assigned: "status",
  complaint_reassigned: "status",
  complaint_new: "status",
  complaint_reopened: "status",
  complaint_info_requested: "status",
  complaint_priority: "priority",
  complaint_department_assigned: "general",
  registration_approved: "general",
};

const KIND_ICON: Record<"status" | "priority" | "general", keyof typeof Ionicons.glyphMap> = {
  status: "swap-horizontal-outline",
  priority: "flag-outline",
  general: "megaphone-outline",
};

function kindFor(type: string): "status" | "priority" | "general" {
  return TYPE_TO_KIND[type] ?? "general";
}

export default function NotificationsScreen() {
  const { colors } = useAppTheme();
  const { data: notifications, isLoading, isError, error, refetch, isRefetching } = useMyNotifications();
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();

  const items = notifications ?? [];
  const unreadCount = items.filter((n) => !n.is_read).length;
  const grouped = groupByDay(items);

  const handleMarkAllRead = () => {
    const unreadIds = items.filter((n) => !n.is_read).map((n) => n.id);
    if (unreadIds.length > 0) markAllRead.mutate(unreadIds);
  };

  return (
    <ScreenContainer>
      <ScreenHeader
        title="Notifications"
        subtitle={`${unreadCount} unread`}
        right={
          <Pressable onPress={handleMarkAllRead}>
            <Text style={{ color: colors.primary, fontSize: 13, fontWeight: "600" }}>Mark all read</Text>
          </Pressable>
        }
      />

      {isLoading ? (
        <View style={styles.centerState}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : isError ? (
        <View style={styles.centerState}>
          <EmptyState
            icon="cloud-offline-outline"
            title="Couldn't load notifications"
            body={extractApiErrorMessage(error, "Check your connection and try again.")}
          />
          <Pressable
            onPress={() => refetch()}
            style={[styles.retryBtn, { backgroundColor: colors.primary, borderRadius: colors.radii.md }]}
          >
            <Text style={{ color: colors.onPrimary, fontWeight: "700", fontSize: 13 }}>
              {isRefetching ? "Retrying…" : "Retry"}
            </Text>
          </Pressable>
        </View>
      ) : items.length === 0 ? (
        <EmptyState
          icon="notifications-off-outline"
          title="No notifications yet"
          body="Updates about your complaints and society notices will show up here."
        />
      ) : (
        Object.entries(grouped).map(([day, entries]) => (
          <View key={day} style={styles.group}>
            <Text style={[styles.groupLabel, { color: colors.textTertiary }]}>{day}</Text>
            {entries.map((n) => {
              const kind = kindFor(n.type);
              return (
                <Pressable
                  key={n.id}
                  onPress={() => !n.is_read && markRead.mutate(n.id)}
                  style={styles.itemPress}
                  scaleTo={0.98}
                >
                  <Card variant="flat" style={styles.item}>
                    <View
                      style={[
                        styles.iconWrap,
                        { backgroundColor: n.is_read ? colors.surfaceSunken : colors.primaryTint },
                      ]}
                    >
                      <Ionicons
                        name={KIND_ICON[kind]}
                        size={18}
                        color={n.is_read ? colors.textTertiary : colors.primary}
                      />
                    </View>
                    <View style={styles.itemBody}>
                      <Text
                        style={[
                          styles.itemTitle,
                          { color: colors.textPrimary, fontWeight: n.is_read ? "500" : "700" },
                        ]}
                      >
                        {n.title}
                      </Text>
                      <Text style={[styles.itemText, { color: colors.textSecondary }]} numberOfLines={2}>
                        {n.body}
                      </Text>
                      <Text style={[styles.itemTime, { color: colors.textTertiary }]}>
                        {formatTime(n.created_at)}
                      </Text>
                    </View>
                    {!n.is_read ? <View style={[styles.unreadDot, { backgroundColor: colors.primary }]} /> : null}
                  </Card>
                </Pressable>
              );
            })}
          </View>
        ))
      )}
    </ScreenContainer>
  );
}

function groupByDay(items: NotificationOut[]) {
  const groups: Record<string, NotificationOut[]> = {};
  const now = new Date();
  for (const item of items) {
    const d = new Date(item.created_at);
    const isToday = d.toDateString() === now.toDateString();
    const isYesterday = d.toDateString() === new Date(now.getTime() - 86400000).toDateString();
    const key = isToday ? "Today" : isYesterday ? "Yesterday" : d.toLocaleDateString(undefined, { day: "numeric", month: "long" });
    groups[key] = groups[key] ? [...groups[key], item] : [item];
  }
  return groups;
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}

const styles = StyleSheet.create({
  group: { marginBottom: 20 },
  groupLabel: { fontSize: 12, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 10 },
  itemPress: { marginBottom: 8 },
  item: { flexDirection: "row", gap: 12, alignItems: "flex-start" },
  iconWrap: { width: 36, height: 36, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  itemBody: { flex: 1, gap: 3 },
  itemTitle: { fontSize: 14 },
  itemText: { fontSize: 13, lineHeight: 18 },
  itemTime: { fontSize: 11, marginTop: 2 },
  unreadDot: { width: 8, height: 8, borderRadius: 4, marginTop: 6 },
  centerState: { flex: 1, alignItems: "center", justifyContent: "center", paddingVertical: 40, gap: 16 },
  retryBtn: { paddingHorizontal: 20, paddingVertical: 10 },
});
