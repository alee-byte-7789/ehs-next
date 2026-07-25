import { router } from "expo-router";
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AppButton } from "../../components/AppButton";
import { StatusBadge } from "../../components/StatusBadge";
import { useMyComplaints } from "../../lib/complaint-queries";
import { spacing, radii } from "../../lib/theme";
import { useTheme } from "../../lib/use-theme";
import type { ComplaintOut } from "../../lib/types";

export default function ComplaintsListScreen() {
  const theme = useTheme();
  const { data: complaints, isLoading, isError, refetch, isRefetching } = useMyComplaints();

  return (
    <SafeAreaView style={[styles.flex, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()}>
          <Text style={{ color: theme.primary, fontSize: 15 }}>← Home</Text>
        </Pressable>
        <Text style={[styles.title, { color: theme.textPrimary }]}>My Complaints</Text>
      </View>

      {isLoading && <Text style={{ color: theme.textSecondary, padding: spacing.lg }}>Loading...</Text>}
      {isError && (
        <Text style={{ color: theme.danger, padding: spacing.lg }}>
          Could not load your complaints. Pull down to try again.
        </Text>
      )}

      {complaints && complaints.length === 0 && (
        <View style={styles.emptyState}>
          <Text style={{ color: theme.textSecondary, textAlign: "center", marginBottom: spacing.md }}>
            You haven't raised any complaints yet.
          </Text>
        </View>
      )}

      <FlatList
        data={complaints ?? []}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={theme.primary} />}
        renderItem={({ item }: { item: ComplaintOut }) => (
          <Pressable
            onPress={() => router.push(`/complaints/${item.id}`)}
            style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}
          >
            <View style={styles.cardTop}>
              <Text style={[styles.code, { color: theme.textSecondary }]}>{item.complaint_code}</Text>
              <StatusBadge status={item.status} />
            </View>
            <Text style={[styles.subcategory, { color: theme.textPrimary }]}>{item.subcategory}</Text>
            <Text numberOfLines={2} style={[styles.description, { color: theme.textSecondary }]}>
              {item.description}
            </Text>
          </Pressable>
        )}
      />

      <View style={styles.footer}>
        <AppButton label="Raise a Complaint" onPress={() => router.push("/complaints/new")} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    gap: spacing.xs,
  },
  title: { fontSize: 24, fontWeight: "700" },
  listContent: { paddingHorizontal: spacing.lg, paddingBottom: spacing.lg, gap: spacing.sm },
  card: {
    borderWidth: 1,
    borderRadius: radii.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  cardTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: spacing.xs },
  code: { fontSize: 12, fontWeight: "600" },
  subcategory: { fontSize: 16, fontWeight: "700", marginBottom: 2 },
  description: { fontSize: 13, lineHeight: 18 },
  emptyState: { flex: 1, alignItems: "center", justifyContent: "center", padding: spacing.xl },
  footer: { padding: spacing.lg, paddingTop: spacing.sm },
});
