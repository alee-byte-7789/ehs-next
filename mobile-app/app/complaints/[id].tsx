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
          icon="alert-circle"
          title="Couldn't load this complaint"
          body={extractApiErrorMessage(error, "It may not exist, or you may not have access to it.")}
        />
      </ScreenContainer>
    );
  }

  const currentStepIndex = TIMELINE_STEPS.indexOf(complaint.status);

  // Steps not yet reached. Suppressed entirely once a complaint is closed
  // or reopened, because the tidy pending -> resolved path no longer
  // describes what is going to happen.
  const isTerminal = complaint.status === "closed" || complaint.status === "reopened";
  const reachedStatuses = new Set(complaint.history.map((h) => h.to_status));
  const upcomingSteps = isTerminal
    ? []
    : TIMELINE_STEPS.filter((step, i) => i > currentStepIndex && !reachedStatuses.has(step));
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
        {/*
          Real history first, with real timestamps.

          Previously the normal (non-reopened) path rendered an idealised
          list of steps with NO dates at all, so a resident could see that
          their complaint was "In Progress" but not when anything actually
          happened. Dates only appeared once a complaint was reopened or
          closed, which is backwards — the live case is exactly when people
          want to know how long something has been sitting.

          Entries that have genuinely occurred show date, time, how long ago,
          who did it and any note. Steps still ahead are listed after, greyed
          and undated, so the expected path is still visible.
        */}
        {complaint.history.map((h, index) => {
          const isLastOverall = index === complaint.history.length - 1 && upcomingSteps.length === 0;
          return (
            <View key={h.id} style={styles.timelineRow}>
              <View style={styles.timelineIconCol}>
                <View style={[styles.timelineDot, { backgroundColor: colors.primary, borderColor: colors.primary }]}>
                  <Ionicons name="checkmark" size={12} color={colors.onPrimary} />
                </View>
                {!isLastOverall ? (
                  <View style={[styles.timelineLine, { backgroundColor: colors.primary }]} />
                ) : null}
              </View>
              <View style={styles.timelineTextCol}>
                <Text style={[styles.timelineLabel, { color: colors.textPrimary, fontWeight: "700" }]}>
                  {STATUS_LABEL[h.to_status]}
                </Text>
                <Text style={[styles.timelineDate, { color: colors.textSecondary }]}>
                  {formatDateTime(h.timestamp)}
                </Text>
                <Text style={[styles.timelineMeta, { color: colors.textTertiary }]}>
                  {relativeTime(h.timestamp)} · {ACTOR_LABEL[h.changed_by_type]}
                </Text>
                {h.note ? (
                  <Text style={[styles.timelineNote, { color: colors.textSecondary }]}>{h.note}</Text>
                ) : null}
              </View>
            </View>
          );
        })}

        {upcomingSteps.map((step, index) => (
          <View key={step} style={styles.timelineRow}>
            <View style={styles.timelineIconCol}>
              <View
                style={[
                  styles.timelineDot,
                  { backgroundColor: colors.surfaceSunken, borderColor: colors.border },
                ]}
              />
              {index < upcomingSteps.length - 1 ? (
                <View style={[styles.timelineLine, { backgroundColor: colors.border }]} />
              ) : null}
            </View>
            <View style={styles.timelineTextCol}>
              <Text style={[styles.timelineLabel, { color: colors.textTertiary }]}>
                {STATUS_LABEL[step]}
              </Text>
            </View>
          </View>
        ))}
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

/** e.g. "4 Aug 2026, 11:20 AM" — the date alone wasn't enough to tell two
 *  updates on the same day apart. */
function formatDateTime(iso: string) {
  const d = new Date(iso);
  return (
    d.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" }) +
    ", " +
    d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })
  );
}

/** "just now" / "3 hours ago" / "2 days ago". An absolute date answers
 *  "when", but this answers "how long has this been sitting", which is the
 *  question a waiting resident is actually asking. */
function relativeTime(iso: string) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} minute${mins === 1 ? "" : "s"} ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} day${days === 1 ? "" : "s"} ago`;
  const months = Math.floor(days / 30);
  return `${months} month${months === 1 ? "" : "s"} ago`;
}

const ACTOR_LABEL: Record<"resident" | "admin" | "system", string> = {
  resident: "by you",
  admin: "by Housing Office",
  system: "automatic",
};

const styles = StyleSheet.create({
  centerState: { paddingVertical: 40, alignItems: "center" },
  headerCard: { gap: 10, marginBottom: 20 },
  headerTop: { flexDirection: "row", gap: 8 },
  title: { fontSize: 18, fontWeight: "700" },
  meta: { fontSize: 12 },
  sectionTitle: { fontSize: 15, fontWeight: "700", marginBottom: 10 },
  timelineMeta: { fontSize: 11, marginTop: 1 },
  timelineNote: { fontSize: 12, marginTop: 4, fontStyle: "italic" },
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
