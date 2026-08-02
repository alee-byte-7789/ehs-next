import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useMemo, useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import { ScreenContainer } from "../../components/ScreenContainer";
import { Card } from "../../components/ui/Card";
import { Pressable } from "../../components/ui/Pressable";
import { EmptyState, ScreenHeader } from "../../components/ui/ScreenHeader";
import { PriorityChip, StatusChip } from "../../components/ui/StatusChip";
import { MOCK_COMPLAINTS, type ComplaintStatus } from "../../lib/mock-data";
import { useAppTheme } from "../../lib/theme/theme-context";

type FilterKey = "all" | "open" | "resolved";

export default function ComplaintsScreen() {
  const { colors } = useAppTheme();
  const [filter, setFilter] = useState<FilterKey>("all");

  const filtered = useMemo(() => {
    if (filter === "open") {
      return MOCK_COMPLAINTS.filter((c) => !CLOSED_STATUSES.includes(c.status));
    }
    if (filter === "resolved") {
      return MOCK_COMPLAINTS.filter((c) => CLOSED_STATUSES.includes(c.status));
    }
    return MOCK_COMPLAINTS;
  }, [filter]);

  return (
    <ScreenContainer>
      <ScreenHeader
        title="My Complaints"
        subtitle={`${MOCK_COMPLAINTS.length} total`}
        right={
          <Pressable
            onPress={() => router.push("/complaints/new")}
            scaleTo={0.92}
            style={[styles.addButton, { backgroundColor: colors.primary }]}
          >
            <Ionicons name="add" size={20} color={colors.onPrimary} />
          </Pressable>
        }
      />

      <View style={styles.filterRow}>
        {FILTERS.map((f) => {
          const active = filter === f.key;
          return (
            <Pressable
              key={f.key}
              onPress={() => setFilter(f.key)}
              scaleTo={0.96}
              style={[
                styles.filterPill,
                {
                  backgroundColor: active ? colors.primaryTint : colors.surfaceElevated,
                  borderColor: active ? colors.primary : colors.border,
                },
              ]}
            >
              <Text style={[styles.filterLabel, { color: active ? colors.primary : colors.textSecondary }]}>
                {f.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {filtered.length === 0 ? (
        <EmptyState
          icon="document-text-outline"
          title="No complaints here"
          body="Nothing matches this filter yet. Try a different tab or register a new complaint."
        />
      ) : (
        filtered.map((c) => (
          <Pressable key={c.id} onPress={() => router.push(`/complaints/${c.id}`)} style={styles.pressWrap}>
            <Card style={styles.card}>
              <View style={styles.topRow}>
                <Text style={[styles.code, { color: colors.textTertiary }]}>{c.code}</Text>
                <StatusChip status={c.status} />
              </View>
              <Text style={[styles.title, { color: colors.textPrimary }]} numberOfLines={2}>
                {c.title}
              </Text>
              <View style={styles.bottomRow}>
                <Text style={[styles.meta, { color: colors.textSecondary }]}>
                  {c.category} · {formatDate(c.submittedAt)}
                </Text>
                <PriorityChip priority={c.priority} />
              </View>
            </Card>
          </Pressable>
        ))
      )}
    </ScreenContainer>
  );
}

const CLOSED_STATUSES: ComplaintStatus[] = ["resolved", "closed"];

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: "all", label: "All" },
  { key: "open", label: "Open" },
  { key: "resolved", label: "Resolved" },
];

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { day: "numeric", month: "short" });
}

const styles = StyleSheet.create({
  addButton: { width: 38, height: 38, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  filterRow: { flexDirection: "row", gap: 8, marginBottom: 16 },
  filterPill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 1,
  },
  filterLabel: { fontSize: 13, fontWeight: "600" },
  pressWrap: { marginBottom: 10 },
  card: { gap: 8 },
  topRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  code: { fontSize: 11, fontWeight: "600", letterSpacing: 0.3 },
  title: { fontSize: 15, fontWeight: "600" },
  bottomRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  meta: { fontSize: 12, flexShrink: 1 },
});
