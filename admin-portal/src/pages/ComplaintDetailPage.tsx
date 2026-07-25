import { useState } from "react";
import { Link, useParams } from "react-router-dom";

import { Button } from "../components/Button";
import { StatusBadge } from "../components/StatusBadge";
import { extractApiErrorMessage } from "../lib/api-client";
import {
  useAcceptComplaint,
  useAddInternalNote,
  useAdminCloseComplaint,
  useAssignComplaint,
  useAssignDepartment,
  useComplaintDetail,
  useComplaintFeedback,
  useEscalateComplaint,
  useInternalNotes,
  useReassignComplaint,
  useRequestInfo,
  useResolveComplaint,
  useSetPriority,
  useStartProgress,
} from "../lib/complaint-queries";
import { useAdminMe } from "../lib/registration-queries";
import { useStaffList } from "../lib/staff-queries";
import type { ComplaintPriority } from "../lib/types";

const ACTOR_LABELS: Record<string, string> = {
  resident: "Resident",
  admin: "Housing Office",
  staff: "Maintenance Staff",
  system: "System",
};

const PRIORITY_OPTIONS: { value: ComplaintPriority; label: string; color: string }[] = [
  { value: "low", label: "Low", color: "var(--color-status-resolved)" },
  { value: "normal", label: "Normal", color: "var(--color-text-secondary)" },
  { value: "high", label: "High", color: "var(--color-status-pending)" },
  { value: "critical", label: "Critical", color: "var(--color-status-reopened)" },
];

export function ComplaintDetailPage() {
  const { id } = useParams<{ id: string }>();
  const complaintId = Number(id);

  const { data: complaint, isLoading, isError } = useComplaintDetail(complaintId);
  const { data: staff } = useStaffList();
  const { data: me } = useAdminMe(true);
  const { data: notes } = useInternalNotes(complaintId);
  const { data: feedback } = useComplaintFeedback(complaintId);

  const accept = useAcceptComplaint();
  const assign = useAssignComplaint();
  const reassign = useReassignComplaint();
  const startProgress = useStartProgress();
  const resolve = useResolveComplaint();
  const adminClose = useAdminCloseComplaint();
  const escalate = useEscalateComplaint();
  const setPriority = useSetPriority();
  const requestInfo = useRequestInfo();
  const assignDepartment = useAssignDepartment();
  const addNote = useAddInternalNote();

  const [selectedStaffId, setSelectedStaffId] = useState<string>("");
  const [actionError, setActionError] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState("");
  const [showInfoBox, setShowInfoBox] = useState(false);
  const [noteText, setNoteText] = useState("");

  const runAction = async (mutation: { mutateAsync: (args: { complaintId: number; body?: Record<string, unknown> }) => Promise<unknown> }, body?: Record<string, unknown>) => {
    setActionError(null);
    try {
      await mutation.mutateAsync({ complaintId, body });
    } catch (err) {
      setActionError(extractApiErrorMessage(err, "Action failed."));
    }
  };

  const handleSetPriority = async (priority: ComplaintPriority) => {
    setActionError(null);
    try {
      await setPriority.mutateAsync({ complaintId, priority });
    } catch (err) {
      setActionError(extractApiErrorMessage(err, "Could not change priority."));
    }
  };

  const handleRequestInfo = async () => {
    if (!infoMessage.trim()) return;
    await runAction(requestInfo, { message: infoMessage });
    setInfoMessage("");
    setShowInfoBox(false);
  };

  const handleAddNote = async () => {
    if (!noteText.trim()) return;
    await addNote.mutateAsync({ complaintId, note: noteText });
    setNoteText("");
  };

  if (isLoading) return <div className="p-8 text-sm text-[color:var(--color-text-secondary)]">Loading...</div>;
  if (isError || !complaint) return <div className="p-8 text-sm text-[color:var(--color-danger)]">Could not load this complaint.</div>;

  const isSuperAdmin = me?.role === "super_admin";

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
          <p className="mb-4 text-sm text-[color:var(--color-text-secondary)]">{complaint.description}</p>

          <div className="mb-4 flex items-center gap-2">
            <span className="text-xs font-medium text-[color:var(--color-text-secondary)]">Priority:</span>
            {PRIORITY_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => handleSetPriority(opt.value)}
                disabled={setPriority.isPending}
                className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                  complaint.priority === opt.value ? "text-white" : "border border-[color:var(--color-border)] text-[color:var(--color-text-secondary)]"
                }`}
                style={complaint.priority === opt.value ? { backgroundColor: opt.color } : undefined}
              >
                {opt.label}
              </button>
            ))}
            {complaint.priority !== "critical" && (
              <Button variant="secondary" className="!px-2.5 !py-1 text-xs" loading={escalate.isPending} onClick={() => runAction(escalate)}>
                Escalate ↑
              </Button>
            )}
          </div>

          {actionError && <p className="mb-4 text-sm text-[color:var(--color-danger)]">{actionError}</p>}

          <div className="flex flex-wrap items-center gap-3">
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

            {(complaint.status === "assigned" || complaint.status === "in_progress") && (
              <>
                <select
                  value={selectedStaffId}
                  onChange={(e) => setSelectedStaffId(e.target.value)}
                  className="rounded-lg border border-[color:var(--color-border)] px-3 py-2 text-sm"
                >
                  <option value="">Reassign to...</option>
                  {staff?.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.full_name} ({s.category})
                    </option>
                  ))}
                </select>
                <Button
                  variant="secondary"
                  loading={reassign.isPending}
                  disabled={!selectedStaffId}
                  onClick={() => runAction(reassign, { staff_id: Number(selectedStaffId) })}
                >
                  Reassign
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

            <Button variant="secondary" onClick={() => setShowInfoBox((v) => !v)}>
              Request More Info
            </Button>

            {isSuperAdmin && (
              <Button variant="secondary" loading={assignDepartment.isPending} onClick={() => runAction(assignDepartment, { admin_id: me!.id })}>
                Assign to Me (Dept.)
              </Button>
            )}
          </div>

          {showInfoBox && (
            <div className="mt-4 flex gap-2">
              <input
                value={infoMessage}
                onChange={(e) => setInfoMessage(e.target.value)}
                placeholder="What do you need from the resident?"
                className="flex-1 rounded-lg border border-[color:var(--color-border)] px-3 py-2 text-sm"
              />
              <Button loading={requestInfo.isPending} onClick={handleRequestInfo}>
                Send
              </Button>
            </div>
          )}
        </div>

        {feedback && (
          <div className="mb-6 rounded-xl border border-[color:var(--color-border)] bg-white p-6">
            <h3 className="mb-2 text-base font-semibold text-[color:var(--color-text-primary)]">Resident Feedback</h3>
            <p className="text-sm text-[color:var(--color-text-primary)]">{"★".repeat(feedback.rating)}{"☆".repeat(5 - feedback.rating)}</p>
            {feedback.comment && <p className="mt-1 text-sm text-[color:var(--color-text-secondary)]">{feedback.comment}</p>}
          </div>
        )}

        <div className="mb-6 rounded-xl border border-[color:var(--color-border)] bg-white p-6">
          <h3 className="mb-4 text-base font-semibold text-[color:var(--color-text-primary)]">
            Internal Notes <span className="text-xs font-normal text-[color:var(--color-text-secondary)]">(admin-only, never visible to resident)</span>
          </h3>
          <div className="mb-4 space-y-3">
            {notes?.map((n) => (
              <div key={n.id} className="rounded-lg bg-[color:var(--color-surface)] p-3">
                <p className="text-sm text-[color:var(--color-text-primary)]">{n.note}</p>
                <p className="mt-1 text-xs text-[color:var(--color-text-secondary)]">{new Date(n.created_at).toLocaleString()}</p>
              </div>
            ))}
            {notes?.length === 0 && <p className="text-sm text-[color:var(--color-text-secondary)]">No internal notes yet.</p>}
          </div>
          <div className="flex gap-2">
            <input
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              placeholder="Add an internal note..."
              className="flex-1 rounded-lg border border-[color:var(--color-border)] px-3 py-2 text-sm"
            />
            <Button loading={addNote.isPending} onClick={handleAddNote}>
              Add
            </Button>
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
