import { useState } from "react";
import { Link } from "react-router-dom";

import { AppShell } from "../components/AppShell";
import { Button } from "../components/Button";
import { GlassCard } from "../components/GlassCard";
import { Select } from "../components/Select";
import { StatusBadge } from "../components/StatusBadge";
import {
  useBulkSetPriority,
  useBulkSetStatus,
  useComplaints,
} from "../lib/complaint-queries";
import type { ComplaintPriority, ComplaintStatus } from "../lib/types";

const STATUS_FILTERS: { value: ComplaintStatus | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "accepted", label: "Accepted" },
  { value: "assigned", label: "Assigned" },
  { value: "in_progress", label: "In Progress" },
  { value: "resolved", label: "Resolved" },
  { value: "reopened", label: "Reopened" },
  { value: "closed", label: "Closed" },
];

const PRIORITY_FILTERS: { value: ComplaintPriority | "all"; label: string; color: string }[] = [
  { value: "all", label: "All Priorities", color: "var(--color-text-secondary)" },
  { value: "critical", label: "Critical", color: "var(--color-status-reopened)" },
  { value: "high", label: "High", color: "var(--color-status-pending)" },
  { value: "normal", label: "Normal", color: "var(--color-text-secondary)" },
  { value: "low", label: "Low", color: "var(--color-status-resolved)" },
];

export function ComplaintsPage() {
  const [statusFilter, setStatusFilter] = useState<ComplaintStatus | "all">("all");
  const [priorityFilter, setPriorityFilter] = useState<ComplaintPriority | "all">("all");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Set<number>>(new Set());

  const { data: complaints, isLoading, isError } = useComplaints({
    status_filter: statusFilter,
    priority_filter: priorityFilter,
    search: search || undefined,
  });
  const bulkPriority = useBulkSetPriority();
  const bulkStatus = useBulkSetStatus();

  const toggleSelect = (id: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleBulkPriority = async (priority: ComplaintPriority) => {
    await bulkPriority.mutateAsync({ complaint_ids: Array.from(selected), priority });
    setSelected(new Set());
  };

  const handleBulkAccept = async () => {
    await bulkStatus.mutateAsync({ complaint_ids: Array.from(selected), status: "accepted" });
    setSelected(new Set());
  };

  return (
    <AppShell>
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
        <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
          <h1 className="text-xl font-bold text-[color:var(--color-text-primary)]">Complaints</h1>
        </div>

        <div className="mb-4 flex flex-wrap items-center gap-3">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search complaint ID, resident, house, phone..."
            className="w-full rounded-lg border border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-3 py-2 text-sm text-[color:var(--color-text-primary)] outline-none focus:border-[color:var(--color-primary)] sm:w-72"
          />
          <Select
            value={priorityFilter}
            onChange={setPriorityFilter}
            options={PRIORITY_FILTERS}
            className="w-full sm:w-44"
          />
        </div>

        <div className="mb-4 flex flex-wrap gap-2">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setStatusFilter(f.value)}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                statusFilter === f.value
                  ? "bg-[color:var(--color-primary)] text-white"
                  : "border border-[color:var(--color-border)] bg-[color:var(--color-surface-elevated)] text-[color:var(--color-text-secondary)]"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {selected.size > 0 && (
          <div className="mb-4 flex flex-wrap items-center gap-3 rounded-lg bg-amber-50 px-4 py-3">
            <span className="text-sm font-medium text-[color:var(--color-text-primary)]">
              {selected.size} selected
            </span>
            <Button className="!px-3 !py-1.5 text-xs" onClick={handleBulkAccept} loading={bulkStatus.isPending}>
              Bulk Accept
            </Button>
            <Button
              variant="secondary"
              className="!px-3 !py-1.5 text-xs"
              onClick={() => handleBulkPriority("high")}
              loading={bulkPriority.isPending}
            >
              Set High Priority
            </Button>
            <Button
              variant="secondary"
              className="!px-3 !py-1.5 text-xs"
              onClick={() => handleBulkPriority("critical")}
              loading={bulkPriority.isPending}
            >
              Set Critical
            </Button>
            <button onClick={() => setSelected(new Set())} className="text-xs text-[color:var(--color-text-secondary)]">
              Clear
            </button>
          </div>
        )}

        {isLoading && <p className="text-sm text-[color:var(--color-text-secondary)]">Loading...</p>}
        {isError && <p className="text-sm text-[color:var(--color-danger)]">Could not load complaints.</p>}
        {complaints && complaints.length === 0 && (
          <p className="text-sm text-[color:var(--color-text-secondary)]">No complaints match these filters.</p>
        )}

        {complaints && complaints.length > 0 && (
          <>
            {/* Card list — small screens. A wide table with 6 columns has no
                room on a phone; forcing it to fit just truncates the status
                column, which is what was happening before. */}
            <div className="space-y-2 sm:hidden">
              {complaints.map((c) => {
                const priorityMeta = PRIORITY_FILTERS.find((p) => p.value === c.priority);
                return (
                  <GlassCard key={c.id} className="!p-4">
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        checked={selected.has(c.id)}
                        onChange={() => toggleSelect(c.id)}
                        className="mt-1 shrink-0"
                      />
                      <Link to={`/complaints/${c.id}`} className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="font-semibold text-[color:var(--color-primary)]">{c.complaint_code}</p>
                            <p className="text-xs font-semibold text-[color:var(--color-text-secondary)]">{c.house_code}</p>
                          </div>
                          <StatusBadge status={c.status} />
                        </div>
                        <p className="mt-2 truncate text-sm text-[color:var(--color-text-primary)]">{c.subcategory}</p>
                        <div className="mt-2 flex items-center justify-between">
                          {c.priority !== "normal" ? (
                            <span className="text-xs font-bold" style={{ color: priorityMeta?.color }}>
                              {c.priority.toUpperCase()}
                            </span>
                          ) : <span />}
                          <span className="text-xs text-[color:var(--color-text-tertiary)]">
                            {new Date(c.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </Link>
                    </div>
                  </GlassCard>
                );
              })}
            </div>

            {/* Table — sm and up. overflow-x-auto is a safety net for narrow
                sm/md widths so columns scroll instead of clipping. */}
            <div className="hidden overflow-x-auto rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-surface-elevated)] sm:block">
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead className="border-b border-[color:var(--color-border)] bg-[color:var(--color-surface)] text-xs uppercase text-[color:var(--color-text-secondary)]">
                  <tr>
                    <th className="px-4 py-3"></th>
                    <th className="px-4 py-3">Complaint / House</th>
                    <th className="px-4 py-3">Title</th>
                    <th className="px-4 py-3">Priority</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Created</th>
                  </tr>
                </thead>
                <tbody>
                  {complaints.map((c) => {
                    const priorityMeta = PRIORITY_FILTERS.find((p) => p.value === c.priority);
                    return (
                      <tr key={c.id} className="border-b border-[color:var(--color-border)] last:border-0 hover:bg-[color:var(--color-surface)]">
                        <td className="px-4 py-3">
                          <input type="checkbox" checked={selected.has(c.id)} onChange={() => toggleSelect(c.id)} />
                        </td>
                        <td className="px-4 py-3">
                          <Link to={`/complaints/${c.id}`} className="font-medium text-[color:var(--color-primary)]">
                            {c.complaint_code}
                          </Link>
                          <div className="text-xs font-semibold text-[color:var(--color-text-secondary)]">
                            {c.house_code}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-[color:var(--color-text-primary)]">{c.subcategory}</td>
                        <td className="px-4 py-3">
                          {c.priority !== "normal" && (
                            <span className="text-xs font-bold" style={{ color: priorityMeta?.color }}>
                              {c.priority.toUpperCase()}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <StatusBadge status={c.status} />
                        </td>
                        <td className="px-4 py-3 text-[color:var(--color-text-secondary)]">
                          {new Date(c.created_at).toLocaleDateString()}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </AppShell>
  );
}
