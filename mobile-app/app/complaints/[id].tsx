import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AppButton } from "../../components/AppButton";
import { StatusBadge } from "../../components/StatusBadge";
import { extractApiErrorMessage } from "../../lib/api-client";
import { useCloseComplaint, useMyComplaintDetail, useReopenComplaint } from "../../lib/complaint-queries";
import { radii, spacing } from "../../lib/theme";
import { useTheme } from "../../lib/use-theme";
import type { ComplaintHistoryOut } from "../../lib/types";

const STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  accepted: "Accepted",
  assigned: "Assigned",
  in_progress: "In Progress",
  resolved: "Resolved",
  closed: "Closed",
  reopened: "Reopened",
};

const ACTOR_LABELS: Record<string, string> = {
  resident: "You",
  admin: "Housing Office",
  staff: "Maintenance Staff",
  system: "System",
};

export default function ComplaintDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const complaintId = Number(id);
  const theme = useTheme();
  const { data: complaint, isLoading, isError } = useMyComplaintDetail(complaintId);
  const closeComplaint = useCloseComplaint();
  const reopenComplaint = useReopenComplaint();
  const [actionError, setActionError] = useState<string | null>(null);

  const handleClose = async () => {
    setActionError(null);
    try {
      await closeComplaint.mutateAsync(complaintId);
    } catch (err) {
      setActionError(extractApiErrorMessage(err, "Could not close this complaint."));
    }
  };

  const handleReopen = async () => {
    setActionError(null);
    try {
      await reopenComplaint.mutateAsync(complaintId);
    } catch (err) {
      setActionError(extractApiErrorMessage(err, "Could not reopen this complaint."));
    }
  };

  return (
    <SafeAreaView style={[styles.flex, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()}>
          <Text style={{ color: theme.primary, fontSize: 15 }}>← Back</Text>
        </Pressable>
      </View>

      {isLoading && <Text style={{ color: theme.textSecondary, padding: spacing.lg }}>Loading...</Text>}
      {isError && <Text style={{ color: theme.danger, padding: spacing.lg }}>Could not load this complaint.</Text>}

      {complaint && (
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.titleRow}>
            <Text style={[styles.code, { color: theme.textSecondary }]}>{complaint.complaint_code}</Text>
            <StatusBadge status={complaint.status} />
          </View>
          <Text style={[styles.subcategory, { color: theme.textPrimary }]}>{complaint.subcategory}</Text>
          <Text style={[styles.description, { color: theme.textSecondary }]}>{complaint.description}</Text>

          {actionError && <Text style={{ color: theme.danger, marginTop: spacing.md }}>{actionError}</Text>}

          {complaint.status === "resolved" && (
            <View style={styles.actionRow}>
              <AppButton label="I'm satisfied — Close" onPress={handleClose} loading={closeComplaint.isPending} />
              <AppButton
                label="Not satisfied — Reopen"
                variant="secondary"
                onPress={handleReopen}
                loading={reopenComplaint.isPending}
              />
            </View>
          )}

          <Text style={[styles.timelineTitle, { color: theme.textPrimary }]}>Timeline</Text>
          <View style={[styles.timeline, { borderColor: theme.border }]}>
            {complaint.history.map((entry: ComplaintHistoryOut, index: number) => (
              <View key={entry.id} style={styles.timelineRow}>
                <View style={styles.timelineDotColumn}>
                  <View style={[styles.timelineDot, { backgroundColor: theme.primary }]} />
                  {index < complaint.history.length - 1 && (
                    <View style={[styles.timelineLine, { backgroundColor: theme.border }]} />
                  )}
                </View>
                <View style={styles.timelineTextColumn}>
                  <Text style={[styles.timelineStatus, { color: theme.textPrimary }]}>
                    {STATUS_LABELS[entry.to_status] ?? entry.to_status}
                  </Text>
                  <Text style={[styles.timelineMeta, { color: theme.textSecondary }]}>
                    {ACTOR_LABELS[entry.changed_by_type] ?? entry.changed_by_type} ·{" "}
                    {new Date(entry.timestamp).toLocaleString()}
                  </Text>
                  {entry.note && <Text style={[styles.timelineNote, { color: theme.textSecondary }]}>{entry.note}</Text>}
                </View>
              </View>
            ))}
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  header: { paddingHorizontal: spacing.lg, paddingTop: spacing.md },
  content: { padding: spacing.lg },
  titleRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: spacing.xs },
  code: { fontSize: 13, fontWeight: "600" },
  subcategory: { fontSize: 22, fontWeight: "700", marginBottom: spacing.sm },
  description: { fontSize: 15, lineHeight: 21, marginBottom: spacing.md },
  actionRow: { gap: spacing.sm, marginBottom: spacing.lg },
  timelineTitle: { fontSize: 16, fontWeight: "700", marginTop: spacing.md, marginBottom: spacing.md },
  timeline: { gap: 0 },
  timelineRow: { flexDirection: "row" },
  timelineDotColumn: { alignItems: "center", width: 24 },
  timelineDot: { width: 10, height: 10, borderRadius: 5, marginTop: 4 },
  timelineLine: { width: 2, flex: 1, marginTop: 2, marginBottom: 2 },
  timelineTextColumn: { flex: 1, paddingBottom: spacing.md, paddingLeft: spacing.sm },
  timelineStatus: { fontSize: 15, fontWeight: "700" },
  timelineMeta: { fontSize: 12, marginTop: 2 },
  timelineNote: { fontSize: 13, marginTop: 4, fontStyle: "italic" },
});
