import { StyleSheet, Text, View } from "react-native";

import { radii, spacing, statusColors } from "../lib/theme";
import type { ComplaintStatus } from "../lib/types";

const STATUS_LABELS: Record<ComplaintStatus, string> = {
  pending: "Pending",
  accepted: "Accepted",
  assigned: "Assigned",
  in_progress: "In Progress",
  resolved: "Resolved",
  closed: "Closed",
  reopened: "Reopened",
};

export function StatusBadge({ status }: { status: ComplaintStatus }) {
  const color = statusColors[status] ?? "#6B7280";

  return (
    <View style={[styles.badge, { backgroundColor: color }]}>
      <Text style={styles.label}>{STATUS_LABELS[status] ?? status}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radii.md,
    alignSelf: "flex-start",
  },
  label: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
  },
});
