import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { AppText as Text } from "../../components/ui/AppText";

import { AppButton } from "../../components/AppButton";
import { ScreenContainer } from "../../components/ScreenContainer";
import { Card } from "../../components/ui/Card";
import { EmptyState, ScreenHeader } from "../../components/ui/ScreenHeader";
import { PriorityChip, StatusChip } from "../../components/ui/StatusChip";
import { extractApiErrorMessage } from "../../lib/api-client";
import {
  useCloseComplaint,
  useCloseComplaintEarly,
  useMyComplaint,
  useReopenComplaint,
} from "../../lib/complaint-queries";
import { useAppTheme } from "../../lib/theme/theme-context";
import type { ComplaintStatus } from "../../lib/types";

const TIMELINE_STEPS: ComplaintStatus[] = ["pending", "accepted", "assigned", "in_progress", "resolved"];

const STATUS_LABEL: Record<ComplaintStatus, string> = {
  pending: "Submitted",
  accepted: "Accepted",
  assigned: "Assigned",
  in_progress: "In Progress",
  resolved: "Resolved",
  reopened: "Reopened",
  closed: "Closed",
};

export default function ComplaintDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const complaintId = Number(id);
  const { colors } = useAppTheme();
  const { data: complaint, isLoading, isError, error } = useMyComplaint(complaintId);
  const closeMutation = useCloseComplaint();
  const closeEarlyMutation = useCloseComplaintEarly();
  const reopenMutation = useReopenComplaint();
  const [actionError, setActionError] = useState<string | null>(null);

  if (isLoading) {
    return (
      <ScreenContainer>
        <ScreenHeader title="Complaint" />
        <View style={styles.centerState}>
          <ActivityIndicator color={colors.primary} />
        </View>
      </ScreenContainer>
    );
  }

  if (isError || !complaint) {
    return (
      <ScreenContainer>
        <ScreenHeader title="Complaint" />
        <EmptyState
          icon="alert-circle-outline"
          title="Couldn't load this complaint"
          body={extractApiErrorMessage(error, "It may not exist, or you may not have access to it.")}
        />
      </ScreenContainer>
    );
  }

  const currentStepIndex = TIMELINE_STEPS.indexOf(complaint.status);
  const canCloseEarly = complaint.status === "pending";
  const canCloseResolved = complaint.status === "resolved";
  const canReopen = complaint.status === "resolved" || complaint.status === "closed";
  const anyMutationLoading =
    closeMutation.isPending || closeEarlyMutation.isPending || reopenMutation.isPending;

  const runAction = async (fn: () => Promise<unknown>) => {
    setActionError(null);
    try {
      await fn();
    } catch (err) {
      setActionError(extractApiErrorMessage(err));
    }
  };

  return (
    <ScreenContainer>
      <ScreenHeader title={complaint.complaint_code} subtitle={formatCategory(complaint.category)} />

      <Card style={styles.headerCard}>
        <View style={styles.headerTop}>
          <StatusChip status={complaint.status} />
          <PriorityChip priority={complaint.priority} />
        </View>
        <Text style={[styles.title, { color: colors.textPrimary }]}>{complaint.subcategory}</Text>
        <Text style={[styles.meta, { color: colors.textSecondary }]}>
          Submitted {formatDate(complaint.created_at)} · House {complaint.house_code}
        </Text>
      </Card>

      <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Status timeline</Text>
      <Card style={styles.timelineCard}>
        {complaint.status === "reopened" || complaint.status === "closed" ? (
          complaint.history.map((h, index) => (
            <View key={h.id} style={styles.timelineRow}>
              <View style={styles.timelineIconCol}>
                <View style={[styles.timelineDot, { backgroundColor: colors.primary, borderColor: colors.primary }]}>
                  <Ionicons name="checkmark" size={12} color={colors.onPrimary} />
                </View>
                {index < complaint.history.length - 1 ? (
                  <View style={[styles.timelineLine, { backgroundColor: colors.primary }]} />
                ) : null}
              </View>
              <View style={styles.timelineTextCol}>
                <Text style={[styles.timelineLabel, { color: colors.textPrimary, fontWeight: "600" }]}>
                  {STATUS_LABEL[h.to_status]}
                </Text>
                <Text style={[styles.timelineDate, { color: colors.textTertiary }]}>{formatDate(h.timestamp)}</Text>
              </View>
            </View>
          ))
        ) : (
          TIMELINE_STEPS.map((step, index) => {
            const reached = index <= currentStepIndex;
            const isLast = index === TIMELINE_STEPS.length - 1;
            return (
              <View key={step} style={styles.timelineRow}>
                <View style={styles.timelineIconCol}>
                  <View
                    style={[
                      styles.timelineDot,
                      {
                        backgroundColor: reached ? colors.primary : colors.surfaceSunken,
                        borderColor: reached ? colors.primary : colors.border,
                      },
                    ]}
                  >
                    {reached ? <Ionicons name="checkmark" size={12} color={colors.onPrimary} /> : null}
                  </View>
                  {!isLast ? (
                    <View
                      style={[
                        styles.timelineLine,
                        { backgroundColor: index < currentStepIndex ? colors.primary : colors.border },
                      ]}
                    />
                  ) : null}
                </View>
                <Text
                  style={[
                    styles.timelineLabel,
                    { color: reached ? colors.textPrimary : colors.textTertiary, fontWeight: reached ? "600" : "400" },
                  ]}
                >
                  {STATUS_LABEL[step]}
                </Text>
              </View>
            );
          })
        )}
      </Card>

      <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Description</Text>
      <Card style={styles.descCard}>
        <Text style={[styles.descText, { color: colors.textSecondary }]}>{complaint.description}</Text>
      </Card>

      {actionError ? <Text style={[styles.actionError, { color: colors.danger }]}>{actionError}</Text> : null}

      <View style={styles.actions}>
        {canCloseEarly ? (
          <AppButton
            label="Close Complaint"
            variant="secondary"
            loading={closeEarlyMutation.isPending}
            disabled={anyMutationLoading}
            onPress={() => runAction(() => closeEarlyMutation.mutateAsync({ id: complaint.id, reason: "Resolved on my own / no longer an issue" }))}
          />
        ) : null}
        {canCloseResolved ? (
          <AppButton
            label="Confirm & Close"
            loading={closeMutation.isPending}
            disabled={anyMutationLoading}
            onPress={() => runAction(() => closeMutation.mutateAsync(complaint.id))}
          />
        ) : null}
        {canReopen ? (
          <AppButton
            label="Reopen Complaint"
            variant="secondary"
            loading={reopenMutation.isPending}
            disabled={anyMutationLoading}
            onPress={() => runAction(() => reopenMutation.mutateAsync(complaint.id))}
          />
        ) : null}
      </View>
    </ScreenContainer>
  );
}

function formatCategory(cat: string) {
  return cat.charAt(0).toUpperCase() + cat.slice(1);
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { day: "numeric", month: "long", year: "numeric" });
}

const styles = StyleSheet.create({
  centerState: { paddingVertical: 40, alignItems: "center" },
  headerCard: { gap: 10, marginBottom: 20 },
  headerTop: { flexDirection: "row", gap: 8 },
  title: { fontSize: 18, fontWeight: "700" },
  meta: { fontSize: 12 },
  sectionTitle: { fontSize: 15, fontWeight: "700", marginBottom: 10 },
  timelineCard: { marginBottom: 20, gap: 0 },
  timelineRow: { flexDirection: "row", alignItems: "flex-start", gap: 12, minHeight: 36 },
  timelineIconCol: { alignItems: "center", width: 20 },
  timelineDot: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, alignItems: "center", justifyContent: "center" },
  timelineLine: { width: 2, flex: 1, minHeight: 16 },
  timelineTextCol: { paddingBottom: 12 },
  timelineLabel: { fontSize: 14, paddingTop: 1 },
  timelineDate: { fontSize: 11, marginTop: 2 },
  descCard: { marginBottom: 20 },
  descText: { fontSize: 13, lineHeight: 20 },
  actionError: { fontSize: 13, marginBottom: 12, textAlign: "center" },
  actions: { gap: 10, marginBottom: 20 },
});
