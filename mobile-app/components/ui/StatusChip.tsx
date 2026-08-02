import { StyleSheet, Text, View } from "react-native";

import { useAppTheme } from "../../lib/theme/theme-context";
import type { ComplaintStatus, Priority } from "../../lib/mock-data";

const STATUS_LABEL: Record<ComplaintStatus, string> = {
  pending: "Pending",
  accepted: "Accepted",
  assigned: "Assigned",
  in_progress: "In Progress",
  resolved: "Resolved",
  reopened: "Reopened",
  closed: "Closed",
};

export function StatusChip({ status }: { status: ComplaintStatus }) {
  const { colors } = useAppTheme();
  const base = colors.status[status];
  const tint = colors.isDark ? withAlpha(base, 0.18) : withAlpha(base, 0.12);

  return (
    <View style={[styles.chip, { backgroundColor: tint }]}>
      <View style={[styles.dot, { backgroundColor: base }]} />
      <Text style={[styles.label, { color: base }]}>{STATUS_LABEL[status]}</Text>
    </View>
  );
}

const PRIORITY_COLOR: Record<Priority, "danger" | "warning" | "info"> = {
  high: "danger",
  medium: "warning",
  low: "info",
};

const PRIORITY_LABEL: Record<Priority, string> = {
  high: "High priority",
  medium: "Medium priority",
  low: "Low priority",
};

export function PriorityChip({ priority }: { priority: Priority }) {
  const { colors } = useAppTheme();
  const key = PRIORITY_COLOR[priority];
  const base = colors[key] as string;
  const tint = colors[`${key}Tint` as "dangerTint" | "warningTint" | "infoTint"];

  return (
    <View style={[styles.chip, { backgroundColor: tint }]}>
      <Text style={[styles.label, { color: base }]}>{PRIORITY_LABEL[priority]}</Text>
    </View>
  );
}

function withAlpha(hex: string, alpha: number) {
  const clean = hex.replace("#", "");
  const r = parseInt(clean.substring(0, 2), 16);
  const g = parseInt(clean.substring(2, 4), 16);
  const b = parseInt(clean.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  label: {
    fontSize: 12,
    fontWeight: "600",
  },
});
