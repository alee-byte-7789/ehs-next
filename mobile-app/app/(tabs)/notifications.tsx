import { Ionicons } from "@expo/vector-icons";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useTranslation } from "../../lib/i18n";
import { useMarkNotificationRead, useMyNotifications } from "../../lib/notification-queries";
import { radii, shadow, spacing } from "../../lib/theme";
import { useTheme } from "../../lib/use-theme";
import type { NotificationOut } from "../../lib/types";

function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function NotificationsScreen() {
  const theme = useTheme();
  const { t } = useTranslation();
  const { data: notifications, isLoading, isError } = useMyNotifications();
  const markRead = useMarkNotificationRead();

  const handlePress = (item: NotificationOut) => {
    if (!item.is_read) markRead.mutate(item.id);
  };

  return (
    <SafeAreaView style={[styles.flex, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.textPrimary }]}>{t("notifications_title")}</Text>
      </View>

      {isLoading && <Text style={{ color: theme.textSecondary, padding: spacing.lg }}>{t("loading")}</Text>}
      {isError && (
        <Text style={{ color: theme.danger, padding: spacing.lg }}>Could not load notifications.</Text>
      )}

      {notifications && notifications.length === 0 && (
        <View style={styles.emptyState}>
          <Ionicons name="checkmark-circle-outline" size={48} color={theme.textSecondary} />
          <Text style={{ color: theme.textSecondary, textAlign: "center", marginTop: spacing.md }}>
            {t("noNotificationsYet")}
          </Text>
        </View>
      )}

      <FlatList
        data={notifications ?? []}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => handlePress(item)}
            style={[
              styles.card,
              { backgroundColor: item.is_read ? theme.surface : theme.primaryTint },
              shadow.card,
            ]}
          >
            <View style={styles.cardRow}>
              {!item.is_read && <View style={[styles.unreadDot, { backgroundColor: theme.primary }]} />}
              <View style={{ flex: 1 }}>
                <Text style={[styles.cardTitle, { color: theme.textPrimary }]}>{item.title}</Text>
                <Text style={[styles.cardBody, { color: theme.textSecondary }]}>{item.body}</Text>
                <Text style={[styles.cardTime, { color: theme.textSecondary }]}>{timeAgo(item.created_at)}</Text>
              </View>
            </View>
          </Pressable>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  header: { paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.sm, gap: spacing.xs },
  backRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  title: { fontSize: 24, fontWeight: "700" },
  listContent: { paddingHorizontal: spacing.lg, paddingBottom: spacing.lg, gap: spacing.sm },
  card: { borderRadius: radii.lg, padding: spacing.md, marginBottom: spacing.sm },
  cardRow: { flexDirection: "row", gap: spacing.sm },
  unreadDot: { width: 8, height: 8, borderRadius: 4, marginTop: 6 },
  cardTitle: { fontSize: 15, fontWeight: "700", marginBottom: 2 },
  cardBody: { fontSize: 13, lineHeight: 18, marginBottom: 4 },
  cardTime: { fontSize: 11 },
  emptyState: { flex: 1, alignItems: "center", justifyContent: "center", padding: spacing.xl },
});
