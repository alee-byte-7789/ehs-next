import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams } from "expo-router";
import { StyleSheet, Text, View } from "react-native";

import { ScreenContainer } from "../../components/ScreenContainer";
import { Card } from "../../components/ui/Card";
import { EmptyState, ScreenHeader } from "../../components/ui/ScreenHeader";
import { PriorityChip, StatusChip } from "../../components/ui/StatusChip";
import { MOCK_COMPLAINTS, type ComplaintStatus } from "../../lib/mock-data";
import { useAppTheme } from "../../lib/theme/theme-context";

const STATUS_ORDER: ComplaintStatus[] = ["pending", "accepted", "assigned", "in_progress", "resolved"];

const STEP_LABEL: Record<ComplaintStatus, string> = {
  pending: "Submitted",
  accepted: "Accepted by Housing Office",
  assigned: "Assigned to department",
  in_progress: "Work in progress",
  resolved: "Resolved",
  reopened: "Reopened by resident",
  closed: "Closed",
};

export default function ComplaintDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useAppTheme();
  const complaint = MOCK_COMPLAINTS.find((c) => c.id === id);

  if (!complaint) {
    return (
      <ScreenContainer>
        <ScreenHeader title="Complaint" />
        <EmptyState
          icon="alert-circle-outline"
          title="Complaint not found"
          body="This complaint may have been removed, or the link is out of date."
        />
      </ScreenContainer>
    );
  }

  const isClosedTrack = complaint.status === "reopened" || complaint.status === "closed";
  const currentIndex = isClosedTrack
    ? STATUS_ORDER.length - 1
    : STATUS_ORDER.indexOf(complaint.status);

  return (
    <ScreenContainer>
      <ScreenHeader title={complaint.code} subtitle={complaint.category} />

      <Card style={styles.summaryCard}>
        <View style={styles.summaryTop}>
          <StatusChip status={complaint.status} />
          <PriorityChip priority={complaint.priority} />
        </View>
        <Text style={[styles.title, { color: colors.textPrimary }]}>{complaint.title}</Text>
        {complaint.description ? (
          <Text style={[styles.description, { color: colors.textSecondary }]}>{complaint.description}</Text>
        ) : null}

        <View style={styles.metaGrid}>
          <MetaItem icon="calendar-outline" label="Submitted" value={formatDate(complaint.submittedAt)} />
          <MetaItem icon="business-outline" label="Department" value={complaint.department ?? "Unassigned"} />
        </View>
      </Card>

      <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Status timeline</Text>
      <Card style={styles.timelineCard}>
        {STATUS_ORDER.map((status, index) => {
          const done = index <= currentIndex;
          const isLast = index === STATUS_ORDER.length - 1;
          return (
            <View key={status} style={styles.timelineRow}>
              <View style={styles.timelineTrack}>
                <View
                  style={[
                    styles.timelineDot,
                    {
                      backgroundColor: done ? colors.primary : colors.surfaceSunken,
                      borderColor: done ? colors.primary : colors.border,
                    },
                  ]}
                >
                  {done ? <Ionicons name="checkmark" size={11} color={colors.onPrimary} /> : null}
                </View>
                {!isLast ? (
                  <View
                    style={[
                      styles.timelineLine,
                      { backgroundColor: index < currentIndex ? colors.primary : colors.border },
                    ]}
                  />
                ) : null}
              </View>
              <Text
                style={[
                  styles.timelineLabel,
                  { color: done ? colors.textPrimary : colors.textTertiary, fontWeight: done ? "600" : "500" },
                ]}
              >
                {STEP_LABEL[status]}
              </Text>
            </View>
          );
        })}

        {isClosedTrack ? (
          <View style={styles.timelineRow}>
            <View style={styles.timelineTrack}>
              <View
                style={[
                  styles.timelineDot,
                  {
                    backgroundColor: complaint.status === "reopened" ? colors.danger : colors.textTertiary,
                    borderColor: complaint.status === "reopened" ? colors.danger : colors.textTertiary,
                  },
                ]}
              >
                <Ionicons name="checkmark" size={11} color="#FFFFFF" />
              </View>
            </View>
            <Text style={[styles.timelineLabel, { color: colors.textPrimary, fontWeight: "600" }]}>
              {STEP_LABEL[complaint.status]}
            </Text>
          </View>
        ) : null}
      </Card>
    </ScreenContainer>
  );
}

function MetaItem({ icon, label, value }: { icon: keyof typeof Ionicons.glyphMap; label: string; value: string }) {
  const { colors } = useAppTheme();
  return (
    <View style={styles.metaItem}>
      <Ionicons name={icon} size={14} color={colors.textTertiary} />
      <View>
        <Text style={[styles.metaLabel, { color: colors.textTertiary }]}>{label}</Text>
        <Text style={[styles.metaValue, { color: colors.textPrimary }]}>{value}</Text>
      </View>
    </View>
  );
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}

const styles = StyleSheet.create({
  summaryCard: { gap: 12, marginBottom: 20 },
  summaryTop: { flexDirection: "row", gap: 8 },
  title: { fontSize: 18, fontWeight: "700" },
  description: { fontSize: 13, lineHeight: 20 },
  metaGrid: { flexDirection: "row", gap: 20, marginTop: 4 },
  metaItem: { flexDirection: "row", alignItems: "center", gap: 8 },
  metaLabel: { fontSize: 11 },
  metaValue: { fontSize: 12, fontWeight: "600" },
  sectionTitle: { fontSize: 16, fontWeight: "700", marginBottom: 12 },
  timelineCard: { gap: 0 },
  timelineRow: { flexDirection: "row", gap: 12 },
  timelineTrack: { alignItems: "center", width: 20 },
  timelineDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  timelineLine: { width: 2, flex: 1, minHeight: 22 },
  timelineLabel: { fontSize: 13, paddingBottom: 18, paddingTop: 2, flex: 1 },
});
