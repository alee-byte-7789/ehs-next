import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import { ScreenContainer } from "../components/ScreenContainer";
import { Card } from "../components/ui/Card";
import { Pressable } from "../components/ui/Pressable";
import { EmptyState, ScreenHeader } from "../components/ui/ScreenHeader";
import { MOCK_NOTIFICATIONS, type NotificationItem } from "../lib/mock-data";
import { useAppTheme } from "../lib/theme/theme-context";

const KIND_ICON: Record<NotificationItem["kind"], keyof typeof Ionicons.glyphMap> = {
  status: "checkmark-circle-outline",
  priority: "alert-circle-outline",
  general: "megaphone-outline",
};

export default function NotificationsScreen() {
  const { colors } = useAppTheme();
  const [items, setItems] = useState(MOCK_NOTIFICATIONS);

  const unreadCount = items.filter((n) => !n.read).length;

  const markAllRead = () => setItems((prev) => prev.map((n) => ({ ...n, read: true })));
  const markRead = (id: string) =>
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));

  return (
    <ScreenContainer>
      <ScreenHeader
        title="Notifications"
        subtitle={unreadCount > 0 ? `${unreadCount} unread` : "You're all caught up"}
        right={
          unreadCount > 0 ? (
            <Pressable onPress={markAllRead} scaleTo={0.95}>
              <Text style={[styles.markAll, { color: colors.primary }]}>Mark all read</Text>
            </Pressable>
          ) : undefined
        }
      />

      {items.length === 0 ? (
        <EmptyState
          icon="notifications-off-outline"
          title="No notifications"
          body="We'll let you know here when there's an update on your complaints or society notices."
        />
      ) : (
        items.map((item) => (
          <Pressable key={item.id} onPress={() => markRead(item.id)} style={styles.pressWrap}>
            <Card
              variant="flat"
              style={[
                styles.card,
                { borderColor: item.read ? colors.border : colors.primary, backgroundColor: colors.surfaceElevated },
              ]}
            >
              <View
                style={[
                  styles.iconWrap,
                  { backgroundColor: item.read ? colors.surfaceSunken : colors.primaryTint, borderRadius: colors.radii.md },
                ]}
              >
                <Ionicons
                  name={KIND_ICON[item.kind]}
                  size={18}
                  color={item.read ? colors.textTertiary : colors.primary}
                />
              </View>
              <View style={styles.body}>
                <View style={styles.titleRow}>
                  <Text
                    style={[styles.title, { color: colors.textPrimary, fontWeight: item.read ? "600" : "700" }]}
                    numberOfLines={1}
                  >
                    {item.title}
                  </Text>
                  {!item.read ? <View style={[styles.dot, { backgroundColor: colors.primary }]} /> : null}
                </View>
                <Text style={[styles.text, { color: colors.textSecondary }]}>{item.body}</Text>
                <Text style={[styles.time, { color: colors.textTertiary }]}>{formatTimestamp(item.timestamp)}</Text>
              </View>
            </Card>
          </Pressable>
        ))
      )}
    </ScreenContainer>
  );
}

function formatTimestamp(iso: string) {
  const date = new Date(iso);
  const now = new Date();
  const sameDay = date.toDateString() === now.toDateString();
  if (sameDay) {
    return date.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
  }
  return date.toLocaleDateString(undefined, { day: "numeric", month: "short" });
}

const styles = StyleSheet.create({
  markAll: { fontSize: 13, fontWeight: "600" },
  pressWrap: { marginBottom: 10 },
  card: {
    flexDirection: "row",
    gap: 12,
    borderWidth: 1,
  },
  iconWrap: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  body: { flex: 1, gap: 3 },
  titleRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  title: { fontSize: 14, flexShrink: 1 },
  dot: { width: 7, height: 7, borderRadius: 4 },
  text: { fontSize: 13, lineHeight: 18 },
  time: { fontSize: 11, marginTop: 2 },
});
