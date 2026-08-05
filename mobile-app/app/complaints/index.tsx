import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useMemo, useState } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { AppText as Text } from "../../components/ui/AppText";
import { AppTextInput as TextInput } from "../../components/ui/AppTextInput";

import { ScreenContainer } from "../../components/ScreenContainer";
import { Card } from "../../components/ui/Card";
import { Pressable } from "../../components/ui/Pressable";
import { EmptyState, ScreenHeader } from "../../components/ui/ScreenHeader";
import { PriorityChip, StatusChip } from "../../components/ui/StatusChip";
import { extractApiErrorMessage } from "../../lib/api-client";
import { useMyComplaints } from "../../lib/complaint-queries";
import { useAppTheme } from "../../lib/theme/theme-context";
import type { ComplaintStatus } from "../../lib/types";

type FilterKey = "all" | "open" | "resolved";
const FILTERS: { key: FilterKey; label: string }[] = [
  { key: "all", label: "All" },
  { key: "open", label: "Open" },
  { key: "resolved", label: "Resolved" },
];

const OPEN_STATUSES: ComplaintStatus[] = ["pending", "accepted", "assigned", "in_progress", "reopened"];

export default function ComplaintsListScreen() {
  const { colors } = useAppTheme();
  const { data: complaints, isLoading, isError, error, refetch, isRefetching } = useMyComplaints();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<FilterKey>("all");
  const [sortNewestFirst, setSortNewestFirst] = useState(true);

  const results = useMemo(() => {
    let list = [...(complaints ?? [])];
    if (filter === "open") list = list.filter((c) => OPEN_STATUSES.includes(c.status));
    if (filter === "resolved") list = list.filter((c) => c.status === "resolved" || c.status === "closed");
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      list = list.filter(
        (c) =>
          c.subcategory.toLowerCase().includes(q) ||
          c.complaint_code.toLowerCase().includes(q) ||
          c.category.toLowerCase().includes(q) ||
          c.description.toLowerCase().includes(q)
      );
    }
    list.sort((a, b) =>
      sortNewestFirst
        ? new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        : new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );
    return list;
  }, [complaints, query, filter, sortNewestFirst]);

  return (
    <ScreenContainer>
      <ScreenHeader
        title="My Complaints"
        subtitle={complaints ? `${complaints.length} total` : undefined}
        right={
          <Pressable
            onPress={() => router.push("/complaints/new")}
            scaleTo={0.9}
            style={[styles.addBtn, { backgroundColor: colors.primary, borderRadius: colors.radii.button }]}
          >
            <Ionicons name="add" size={20} color={colors.onPrimary} />
          </Pressable>
        }
      />

      <View style={[styles.searchBar, { backgroundColor: colors.surfaceSunken, borderRadius: colors.radii.md }]}>
        <Ionicons name="search" size={17} color={colors.textTertiary} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search complaints"
          placeholderTextColor={colors.textTertiary}
          style={[styles.searchInput, { color: colors.textPrimary }]}
        />
      </View>

      <View style={styles.filterRow}>
        <View style={styles.chipsRow}>
          {FILTERS.map((f) => {
            const active = filter === f.key;
            return (
              <Pressable key={f.key} onPress={() => setFilter(f.key)} scaleTo={0.94}>
                <View
                  style={[
                    styles.filterChip,
                    {
                      backgroundColor: active ? colors.primary : colors.surfaceSunken,
                      borderRadius: colors.radii.pill,
                    },
                  ]}
                >
                  <Text style={[styles.filterChipText, { color: active ? colors.onPrimary : colors.textSecondary }]}>
                    {f.label}
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </View>
        <Pressable onPress={() => setSortNewestFirst((v) => !v)} scaleTo={0.9} style={styles.sortBtn}>
          <Ionicons name="swap-vertical" size={16} color={colors.textSecondary} />
          <Text style={[styles.sortText, { color: colors.textSecondary }]}>
            {sortNewestFirst ? "Newest" : "Oldest"}
          </Text>
        </Pressable>
      </View>

      {isLoading ? (
        <View style={styles.centerState}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : isError ? (
        <View style={styles.centerState}>
          <EmptyState
            icon="cloud-offline"
            title="Couldn't load complaints"
            body={extractApiErrorMessage(error, "Check your connection and try again.")}
          />
          <Pressable onPress={() => refetch()} style={[styles.retryBtn, { backgroundColor: colors.primary, borderRadius: colors.radii.button }]}>
            <Text style={{ color: colors.onPrimary, fontWeight: "700", fontSize: 13 }}>
              {isRefetching ? "Retrying…" : "Retry"}
            </Text>
          </Pressable>
        </View>
      ) : results.length === 0 ? (
        <EmptyState
          icon="file-tray"
          title={complaints && complaints.length > 0 ? "No complaints found" : "No complaints yet"}
          body={
            complaints && complaints.length > 0
              ? "Try a different search or filter."
              : "Complaints you register will show up here."
          }
        />
      ) : (
        results.map((c) => (
          <Pressable key={c.id} onPress={() => router.push(`/complaints/${c.id}`)} style={styles.cardPress} scaleTo={0.98}>
            <Card style={styles.card}>
              <View style={styles.cardTop}>
                <Text style={[styles.code, { color: colors.textTertiary }]}>{c.complaint_code}</Text>
                <StatusChip status={c.status} />
              </View>
              <Text style={[styles.title, { color: colors.textPrimary }]} numberOfLines={2}>
                {c.subcategory}
              </Text>
              <View style={styles.cardBottom}>
                <PriorityChip priority={c.priority} />
                <Text style={[styles.meta, { color: colors.textSecondary }]}>
                  {formatCategory(c.category)} · {formatDate(c.created_at)}
                </Text>
              </View>
            </Card>
          </Pressable>
        ))
      )}
    </ScreenContainer>
  );
}

function formatCategory(cat: string) {
  return cat.charAt(0).toUpperCase() + cat.slice(1);
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { day: "numeric", month: "short" });
}

const styles = StyleSheet.create({
  addBtn: { width: 38, height: 38, alignItems: "center", justifyContent: "center" },
  searchBar: { flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 14, height: 46, marginBottom: 14 },
  searchInput: { flex: 1, fontSize: 15 },
  filterRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  chipsRow: { flexDirection: "row", gap: 8 },
  filterChip: { paddingHorizontal: 14, paddingVertical: 8 },
  filterChipText: { fontSize: 13, fontWeight: "600" },
  sortBtn: { flexDirection: "row", alignItems: "center", gap: 4 },
  sortText: { fontSize: 12, fontWeight: "600" },
  cardPress: { marginBottom: 10 },
  card: { gap: 8 },
  cardTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  code: { fontSize: 11, fontWeight: "600", letterSpacing: 0.3 },
  title: { fontSize: 15, fontWeight: "600" },
  cardBottom: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  meta: { fontSize: 12 },
  centerState: { alignItems: "center", paddingVertical: 20, gap: 14 },
  retryBtn: { paddingHorizontal: 20, paddingVertical: 10 },
});
