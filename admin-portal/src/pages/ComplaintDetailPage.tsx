import { useState } from "react";
import { Link, useParams } from "react-router-dom";

import { Button } from "../components/Button";
import { StatusBadge } from "../components/StatusBadge";
import { extractApiErrorMessage } from "../lib/api-client";
import {
  useAcceptComplaint,
  useAdminCloseComplaint,
  useAssignComplaint,
  useComplaintDetail,
  useResolveComplaint,
  useStartProgress,
} from "../lib/complaint-queries";
import { useStaffList } from "../lib/staff-queries";

const ACTOR_LABELS: Record<string, string> = {
  resident: "Resident",
  admin: "Housing Office",
  staff: "Maintenance Staff",
  system: "System",
};

export function ComplaintDetailPage() {
  const { id } = useParams<{ id: string }>();
  const complaintId = Number(id);

  const { data: complaint, isLoading, isError } = useComplaintDetail(complaintId);
  const { data: staff } = useStaffList();

  const accept = useAcceptComplaint();
  const assign = useAssignComplaint();
  const startProgress = useStartProgress();
  const resolve = useResolveComplaint();
  const adminClose = useAdminCloseComplaint();

  const [selectedStaffId, setSelectedStaffId] = useState<string>("");
  const [actionError, setActionError] = useState<string | null>(null);

  const runAction = async (mutation: { mutateAsync: (args: { complaintId: number; body?: Record<string, unknown> }) => Promise<unknown> }, body?: Record<string, unknown>) => {
    setActionError(null);
    try {
      await mutation.mutateAsync({ complaintId, body });
    } catch (err) {
      setActionError(extractApiErrorMessage(err, "Action failed."));
    }
  };

  if (isLoading) return <div className="p-8 text-sm text-[color:var(--color-text-secondary)]">Loading...</div>;
  if (isError || !complaint) return <div className="p-8 text-sm text-[color:var(--color-danger)]">Could not load this complaint.</div>;

  return (
    <div className="min-h-screen bg-[color:var(--color-surface)]">
      <header className="flex items-center justify-between border-b border-[color:var(--color-border)] bg-white px-6 py-4">
        <h1 className="text-lg font-semibold text-[color:var(--color-text-primary)]">{complaint.complaint_code}</h1>
        <Link to="/complaints" className="text-sm font-medium text-[color:var(--color-primary)]">
          ← Back to Complaints
        </Link>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-8">
        <div className="mb-6 rounded-xl border border-[color:var(--color-border)] bg-white p-6">
          <div className="mb-2 flex items-center gap-3">
            <StatusBadge status={complaint.status} />
            <span className="text-xs capitalize text-[color:var(--color-text-secondary)]">{complaint.category}</span>
          </div>
          <h2 className="mb-2 text-xl font-semibold text-[color:var(--color-text-primary)]">{complaint.subcategory}</h2>
          <p className="text-sm text-[color:var(--color-text-secondary)]">{complaint.description}</p>

          {actionError && <p className="mt-4 text-sm text-[color:var(--color-danger)]">{actionError}</p>}

          <div className="mt-5 flex flex-wrap items-center gap-3">
            {complaint.status === "pending" && (
              <Button loading={accept.isPending} onClick={() => runAction(accept)}>
                Accept
              </Button>
            )}

            {(complaint.status === "accepted" || complaint.status === "reopened") && (
              <>
                <select
                  value={selectedStaffId}
                  onChange={(e) => setSelectedStaffId(e.target.value)}
                  className="rounded-lg border border-[color:var(--color-border)] px-3 py-2 text-sm"
                >
                  <option value="">Select staff...</option>
                  {staff?.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.full_name} ({s.category})
                    </option>
                  ))}
                </select>
                <Button
                  loading={assign.isPending}
                  disabled={!selectedStaffId}
                  onClick={() => runAction(assign, { staff_id: Number(selectedStaffId) })}
                >
                  Assign
                </Button>
              </>
            )}

            {complaint.status === "assigned" && (
              <Button loading={startProgress.isPending} onClick={() => runAction(startProgress)}>
                Start Progress
              </Button>
            )}

            {complaint.status === "in_progress" && (
              <Button loading={resolve.isPending} onClick={() => runAction(resolve)}>
                Mark Resolved
              </Button>
            )}

            {complaint.status === "resolved" && (
              <Button variant="secondary" loading={adminClose.isPending} onClick={() => runAction(adminClose)}>
                Force Close (admin)
              </Button>
            )}
          </div>
        </div>

        <div className="rounded-xl border border-[color:var(--color-border)] bg-white p-6">
          <h3 className="mb-4 text-base font-semibold text-[color:var(--color-text-primary)]">Timeline</h3>
          <div className="space-y-4">
            {complaint.history.map((entry) => (
              <div key={entry.id} className="flex gap-3">
                <div className="mt-1 h-2 w-2 flex-shrink-0 rounded-full bg-[color:var(--color-primary)]" />
                <div>
                  <p className="text-sm font-semibold capitalize text-[color:var(--color-text-primary)]">
                    {entry.to_status.replace("_", " ")}
                  </p>
                  <p className="text-xs text-[color:var(--color-text-secondary)]">
                    {ACTOR_LABELS[entry.changed_by_type] ?? entry.changed_by_type} ·{" "}
                    {new Date(entry.timestamp).toLocaleString()}
                  </p>
                  {entry.note && <p className="mt-1 text-xs italic text-[color:var(--color-text-secondary)]">{entry.note}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
