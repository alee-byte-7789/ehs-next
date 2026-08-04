import { useState } from "react";
import { Link } from "react-router-dom";

import { Button } from "../components/Button";
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
    <div className="min-h-screen bg-[color:var(--color-surface)]">
      <header className="flex items-center justify-between border-b border-[color:var(--color-border)] bg-[color:var(--color-surface-elevated)] px-6 py-4">
        <h1 className="text-lg font-semibold text-[color:var(--color-text-primary)]">Complaints</h1>
        <Link to="/" className="text-sm font-medium text-[color:var(--color-primary)]">
          ← Back to Dashboard
        </Link>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-8">
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search complaint ID, resident, house, phone..."
            className="w-72 rounded-lg border border-[color:var(--color-border)] px-3 py-2 text-sm"
          />
          <Select
            value={priorityFilter}
            onChange={setPriorityFilter}
            options={PRIORITY_FILTERS}
            className="w-44"
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
          <div className="mb-4 flex items-center gap-3 rounded-lg bg-amber-50 px-4 py-3">
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
          <div className="overflow-hidden rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-surface-elevated)]">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-[color:var(--color-border)] bg-[color:var(--color-surface)] text-xs uppercase text-[color:var(--color-text-secondary)]">
                <tr>
                  <th className="px-4 py-3"></th>
                  <th className="px-4 py-3">Code</th>
                  <th className="px-4 py-3">House</th>
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
                      </td>
                      <td className="px-4 py-3 font-semibold text-[color:var(--color-secondary,#1E3A5F)]">{c.house_code}</td>
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
        )}
      </main>
    </div>
  );
}
