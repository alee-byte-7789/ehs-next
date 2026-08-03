import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import { ScreenContainer } from "../components/ScreenContainer";
import { Card } from "../components/ui/Card";
import { EmptyState, ScreenHeader } from "../components/ui/ScreenHeader";
import { Pressable } from "../components/ui/Pressable";
import { MOCK_NOTIFICATIONS, type NotificationItem } from "../lib/mock-data";
import { useAppTheme } from "../lib/theme/theme-context";

const KIND_ICON: Record<NotificationItem["kind"], keyof typeof Ionicons.glyphMap> = {
  status: "swap-horizontal-outline",
  priority: "flag-outline",
  general: "megaphone-outline",
};

export default function NotificationsScreen() {
  const { colors } = useAppTheme();
  const [items, setItems] = useState(MOCK_NOTIFICATIONS);

  const markRead = (id: string) => {
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  };

  const grouped = groupByDay(items);

  return (
    <ScreenContainer>
      <ScreenHeader
        title="Notifications"
        subtitle={`${items.filter((n) => !n.read).length} unread`}
        right={
          <Pressable onPress={() => setItems((prev) => prev.map((n) => ({ ...n, read: true })))}>
            <Text style={{ color: colors.primary, fontSize: 13, fontWeight: "600" }}>Mark all read</Text>
          </Pressable>
        }
      />

      {items.length === 0 ? (
        <EmptyState
          icon="notifications-off-outline"
          title="No notifications yet"
          body="Updates about your complaints and society notices will show up here."
        />
      ) : (
        Object.entries(grouped).map(([day, entries]) => (
          <View key={day} style={styles.group}>
            <Text style={[styles.groupLabel, { color: colors.textTertiary }]}>{day}</Text>
            {entries.map((n) => (
              <Pressable key={n.id} onPress={() => markRead(n.id)} style={styles.itemPress} scaleTo={0.98}>
                <Card variant="flat" style={styles.item}>
                  <View
                    style={[
                      styles.iconWrap,
                      { backgroundColor: n.read ? colors.surfaceSunken : colors.primaryTint },
                    ]}
                  >
                    <Ionicons
                      name={KIND_ICON[n.kind]}
                      size={18}
                      color={n.read ? colors.textTertiary : colors.primary}
                    />
                  </View>
                  <View style={styles.itemBody}>
                    <Text
                      style={[
                        styles.itemTitle,
                        { color: colors.textPrimary, fontWeight: n.read ? "500" : "700" },
                      ]}
                    >
                      {n.title}
                    </Text>
                    <Text style={[styles.itemText, { color: colors.textSecondary }]} numberOfLines={2}>
                      {n.body}
                    </Text>
                    <Text style={[styles.itemTime, { color: colors.textTertiary }]}>{formatTime(n.timestamp)}</Text>
                  </View>
                  {!n.read ? <View style={[styles.unreadDot, { backgroundColor: colors.primary }]} /> : null}
                </Card>
              </Pressable>
            ))}
          </View>
        ))
      )}
    </ScreenContainer>
  );
}

function groupByDay(items: NotificationItem[]) {
  const groups: Record<string, NotificationItem[]> = {};
  const now = new Date();
  for (const item of items) {
    const d = new Date(item.timestamp);
    const isToday = d.toDateString() === now.toDateString();
    const isYesterday =
      d.toDateString() === new Date(now.getTime() - 86400000).toDateString();
    const key = isToday
      ? "Today"
      : isYesterday
      ? "Yesterday"
      : d.toLocaleDateString(undefined, { day: "numeric", month: "long" });
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
});
