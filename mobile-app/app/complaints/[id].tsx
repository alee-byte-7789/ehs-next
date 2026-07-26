import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AppButton } from "../../components/AppButton";
import { AppTextField } from "../../components/AppTextField";
import { StarRating } from "../../components/StarRating";
import { StatusBadge } from "../../components/StatusBadge";
import { extractApiErrorMessage } from "../../lib/api-client";
import { useCloseComplaint, useCloseComplaintEarly, useMyComplaintDetail, useReopenComplaint } from "../../lib/complaint-queries";
import { useGiveFeedback } from "../../lib/feedback-queries";
import { useTranslation } from "../../lib/i18n";
import { radii, spacing } from "../../lib/theme";
import { useTheme } from "../../lib/use-theme";
import type { ComplaintHistoryOut } from "../../lib/types";

const PRIORITY_COLORS: Record<string, string> = {
  low: "#10B981",
  normal: "#6B7280",
  high: "#F59E0B",
  critical: "#EF4444",
};

export default function ComplaintDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const complaintId = Number(id);
  const theme = useTheme();
  const { t } = useTranslation();
  const STATUS_LABELS: Record<string, string> = {
    pending: t("pendingStatus"),
    accepted: t("acceptedStatus"),
    assigned: t("assignedStatus"),
    in_progress: t("inProgressStatus"),
    resolved: t("resolvedStatus"),
    closed: t("closedStatus"),
    reopened: t("reopenedStatus"),
  };
  const ACTOR_LABELS: Record<string, string> = {
    resident: t("you"),
    admin: t("housingOffice"),
    staff: t("maintenanceStaff"),
    system: t("system"),
  };
  const { data: complaint, isLoading, isError } = useMyComplaintDetail(complaintId);
  const closeComplaint = useCloseComplaint();
  const closeEarly = useCloseComplaintEarly();
  const reopenComplaint = useReopenComplaint();
  const giveFeedback = useGiveFeedback(complaintId);
  const [actionError, setActionError] = useState<string | null>(null);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
  const [feedbackError, setFeedbackError] = useState<string | null>(null);
  const [showEarlyClose, setShowEarlyClose] = useState(false);
  const [earlyCloseReason, setEarlyCloseReason] = useState("");

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

  const handleEarlyClose = async () => {
    setActionError(null);
    if (!earlyCloseReason.trim()) {
      setActionError("Please tell us briefly why — e.g. the issue resolved itself.");
      return;
    }
    try {
      await closeEarly.mutateAsync({ complaintId, reason: earlyCloseReason.trim() });
      setShowEarlyClose(false);
    } catch (err) {
      setActionError(extractApiErrorMessage(err, "Could not close this complaint."));
    }
  };

  const handleFeedback = async () => {
    setFeedbackError(null);
    try {
      await giveFeedback.mutateAsync({ rating, comment: comment.trim() || undefined });
      setFeedbackSubmitted(true);
    } catch (err) {
      setFeedbackError(extractApiErrorMessage(err, "Could not submit feedback."));
    }
  };

  // Resident may satisfy-close or reopen only while RESOLVED; reopen is
  // also available from CLOSED (the issue recurred) — once reopened this
  // way, only an admin can close it again (enforced server-side).
  // Resident may close a complaint early ONLY while it's still pending —
  // no admin has accepted or started work yet. The moment an admin acts,
  // this option disappears (enforced server-side too, not just hidden here).
  const canCloseEarly = complaint?.status === "pending";
  const canActOnResolved = complaint?.status === "resolved";
  const canReopenClosed = complaint?.status === "closed";

  return (
    <SafeAreaView style={[styles.flex, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()}>
          <Text style={{ color: theme.primary, fontSize: 15 }}>← {t("back")}</Text>
        </Pressable>
      </View>

      {isLoading && <Text style={{ color: theme.textSecondary, padding: spacing.lg }}>{t("loading")}</Text>}
      {isError && <Text style={{ color: theme.danger, padding: spacing.lg }}>{t("couldNotLoadComplaint")}</Text>}

      {complaint && (
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.titleRow}>
            <Text style={[styles.code, { color: theme.textSecondary }]}>{complaint.complaint_code}</Text>
            <View style={styles.badgeRow}>
              {complaint.priority !== "normal" && (
                <View style={[styles.priorityChip, { backgroundColor: PRIORITY_COLORS[complaint.priority] }]}>
                  <Text style={styles.priorityText}>{complaint.priority.toUpperCase()}</Text>
                </View>
              )}
              <StatusBadge status={complaint.status} />
            </View>
          </View>
          <Text style={[styles.subcategory, { color: theme.textPrimary }]}>{complaint.subcategory}</Text>
          <Text style={[styles.description, { color: theme.textSecondary }]}>{complaint.description}</Text>

          {actionError && <Text style={{ color: theme.danger, marginTop: spacing.md }}>{actionError}</Text>}

          {canCloseEarly && !showEarlyClose && (
            <View style={styles.actionRow}>
              <AppButton
                label={t("issueResolvedItselfClose")}
                variant="secondary"
                onPress={() => setShowEarlyClose(true)}
              />
            </View>
          )}

          {canCloseEarly && showEarlyClose && (
            <View style={[styles.feedbackCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <AppTextField
                label={t("whyClosing")}
                placeholder="e.g. Neighbor fixed it, no longer an issue"
                value={earlyCloseReason}
                onChangeText={setEarlyCloseReason}
                multiline
              />
              <View style={{ flexDirection: "row", gap: spacing.sm }}>
                <AppButton label={t("confirmClose")} onPress={handleEarlyClose} loading={closeEarly.isPending} />
                <AppButton label={t("cancel")} variant="secondary" onPress={() => setShowEarlyClose(false)} />
              </View>
            </View>
          )}

          {canActOnResolved && (
            <View style={styles.actionRow}>
              <AppButton label={t("imSatisfiedClose")} onPress={handleClose} loading={closeComplaint.isPending} />
              <AppButton
                label={t("notSatisfiedReopen")}
                variant="secondary"
                onPress={handleReopen}
                loading={reopenComplaint.isPending}
              />
            </View>
          )}

          {canReopenClosed && (
            <View style={styles.actionRow}>
              <AppButton
                label={t("issueHappenedAgain")}
                variant="secondary"
                onPress={handleReopen}
                loading={reopenComplaint.isPending}
              />
            </View>
          )}

          {(complaint.status === "resolved" || complaint.status === "closed") && !feedbackSubmitted && (
            <View style={[styles.feedbackCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <Text style={[styles.feedbackTitle, { color: theme.textPrimary }]}>{t("rateResolution")}</Text>
              <StarRating value={rating} onChange={setRating} />
              <AppTextField
                label={t("commentOptional")}
                placeholder={t("anythingElseShare")}
                value={comment}
                onChangeText={setComment}
                multiline
              />
              {feedbackError && <Text style={{ color: theme.danger, fontSize: 12, marginBottom: spacing.sm }}>{feedbackError}</Text>}
              <AppButton
                label={t("submitFeedback")}
                onPress={handleFeedback}
                loading={giveFeedback.isPending}
                disabled={rating === 0}
              />
            </View>
          )}
          {feedbackSubmitted && (
            <View style={[styles.feedbackCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <Text style={{ color: theme.primary, fontWeight: "600" }}>{t("thanksForFeedback")}</Text>
            </View>
          )}

          <Text style={[styles.timelineTitle, { color: theme.textPrimary }]}>{t("timeline")}</Text>
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
  badgeRow: { flexDirection: "row", gap: spacing.xs, alignItems: "center" },
  priorityChip: { paddingHorizontal: spacing.sm, paddingVertical: 3, borderRadius: radii.md },
  priorityText: { color: "#FFFFFF", fontSize: 11, fontWeight: "700" },
  code: { fontSize: 13, fontWeight: "600" },
  subcategory: { fontSize: 22, fontWeight: "700", marginBottom: spacing.sm },
  description: { fontSize: 15, lineHeight: 21, marginBottom: spacing.md },
  actionRow: { gap: spacing.sm, marginBottom: spacing.lg },
  feedbackCard: { borderWidth: 1, borderRadius: radii.md, padding: spacing.md, marginBottom: spacing.lg },
  feedbackTitle: { fontSize: 15, fontWeight: "700", marginBottom: spacing.sm },
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
