const STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  approved: "Approved",
  rejected: "Rejected",
  accepted: "Accepted",
  assigned: "Assigned",
  in_progress: "In Progress",
  resolved: "Resolved",
  closed: "Closed",
  reopened: "Reopened",
};

const STATUS_COLORS: Record<string, string> = {
  pending: "var(--color-status-pending)",
  approved: "var(--color-status-resolved)",
  rejected: "var(--color-danger)",
  accepted: "var(--color-status-accepted)",
  assigned: "var(--color-status-assigned)",
  in_progress: "var(--color-status-in-progress)",
  resolved: "var(--color-status-resolved)",
  closed: "var(--color-status-closed)",
  reopened: "var(--color-status-reopened)",
};

export function StatusBadge({ status }: { status: string }) {
  const color = STATUS_COLORS[status] ?? "var(--color-text-secondary)";
  const label = STATUS_LABELS[status] ?? status;

  return (
    <span
      className="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold text-white"
      style={{ backgroundColor: color }}
    >
      {label}
    </span>
  );
}
