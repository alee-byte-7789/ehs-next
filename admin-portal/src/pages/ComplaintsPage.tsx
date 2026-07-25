import { useState } from "react";
import { Link } from "react-router-dom";

import { StatusBadge } from "../components/StatusBadge";
import { useComplaints } from "../lib/complaint-queries";
import type { ComplaintStatus } from "../lib/types";

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

export function ComplaintsPage() {
  const [filter, setFilter] = useState<ComplaintStatus | "all">("all");
  const { data: complaints, isLoading, isError } = useComplaints(filter);

  return (
    <div className="min-h-screen bg-[color:var(--color-surface)]">
      <header className="flex items-center justify-between border-b border-[color:var(--color-border)] bg-white px-6 py-4">
        <h1 className="text-lg font-semibold text-[color:var(--color-text-primary)]">Complaints</h1>
        <Link to="/" className="text-sm font-medium text-[color:var(--color-primary)]">
          ← Back to Dashboard
        </Link>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-8">
        <div className="mb-4 flex flex-wrap gap-2">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                filter === f.value
                  ? "bg-[color:var(--color-primary)] text-white"
                  : "border border-[color:var(--color-border)] bg-white text-[color:var(--color-text-secondary)]"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {isLoading && <p className="text-sm text-[color:var(--color-text-secondary)]">Loading...</p>}
        {isError && <p className="text-sm text-[color:var(--color-danger)]">Could not load complaints.</p>}

        {complaints && complaints.length === 0 && (
          <p className="text-sm text-[color:var(--color-text-secondary)]">No complaints in this filter.</p>
        )}

        {complaints && complaints.length > 0 && (
          <div className="overflow-hidden rounded-xl border border-[color:var(--color-border)] bg-white">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-[color:var(--color-border)] bg-[color:var(--color-surface)] text-xs uppercase text-[color:var(--color-text-secondary)]">
                <tr>
                  <th className="px-4 py-3">Code</th>
                  <th className="px-4 py-3">Title</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Created</th>
                </tr>
              </thead>
              <tbody>
                {complaints.map((c) => (
                  <tr key={c.id} className="border-b border-[color:var(--color-border)] last:border-0 hover:bg-[color:var(--color-surface)]">
                    <td className="px-4 py-3">
                      <Link to={`/complaints/${c.id}`} className="font-medium text-[color:var(--color-primary)]">
                        {c.complaint_code}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-[color:var(--color-text-primary)]">{c.subcategory}</td>
                    <td className="px-4 py-3 capitalize text-[color:var(--color-text-secondary)]">{c.category}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={c.status} />
                    </td>
                    <td className="px-4 py-3 text-[color:var(--color-text-secondary)]">
                      {new Date(c.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}
