import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import { ActionDialog } from "../components/ActionDialog";
import { AppShell } from "../components/AppShell";
import { Button } from "../components/Button";
import { GlassCard } from "../components/GlassCard";
import { StatusBadge } from "../components/StatusBadge";
import { extractApiErrorMessage } from "../lib/api-client";
import { useAdminMe } from "../lib/registration-queries";
import { useDeleteRegistration, useResetResidentPassword, useUserDetail } from "../lib/user-queries";

function formatCnic(cnic: string | null): string {
  if (!cnic) return "—";
  const d = cnic.replace(/\D/g, "");
  return d.length === 13 ? `${d.slice(0, 5)}-${d.slice(5, 12)}-${d.slice(12)}` : cnic;
}

function formatDateTime(iso: string): string {
  const d = new Date(iso);
  return (
    d.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" }) +
    ", " + d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })
  );
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-[color:var(--color-border)] py-2.5 last:border-0">
      <span className="text-xs uppercase tracking-wide text-[color:var(--color-text-tertiary)]">{label}</span>
      <span className="text-right text-sm font-medium text-[color:var(--color-text-primary)]">{value}</span>
    </div>
  );
}

export function UserDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const residentId = id ? Number(id) : null;
  const { data, isLoading, isError } = useUserDetail(residentId);
  const { data: me } = useAdminMe(true);

  const resetPassword = useResetResidentPassword();
  const deleteRegistration = useDeleteRegistration();

  const [dialog, setDialog] = useState<"reset" | "delete" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  // Mirrors the server's RBAC so the buttons aren't offered to admins who
  // would just get a 403 — the server remains the actual gate.
  const canManage = me?.role === "housing_office" || me?.role === "super_admin";
  const canDelete = me?.role === "super_admin";

  const handleReset = async (newPassword: string) => {
    if (!residentId) return;
    setError(null);
    try {
      await resetPassword.mutateAsync({ residentId, newPassword });
      setDialog(null);
      setNotice("Password reset. Give the new password to the resident directly.");
    } catch (err) {
      setError(extractApiErrorMessage(err, "Could not reset the password."));
    }
  };

  // The resident's most recent APPROVED decision — who let them in, and when.
  const approval = data?.approval_history?.find((a) => a.decision === "approved")
    ?? data?.approval_history?.[0];

  // Removing someone who has real history destroys it, so the confirmation
  // has to say so and the admin has to opt in explicitly.
  const activityCount = (data?.complaint_count ?? 0) + (data?.feedback_count ?? 0);

  const handleDelete = async (reason: string) => {
    if (!residentId) return;
    setError(null);
    try {
      await deleteRegistration.mutateAsync({ residentId, reason, force: activityCount > 0 });
      navigate("/users");
    } catch (err) {
      setError(extractApiErrorMessage(err, "Could not remove this user."));
    }
  };

  return (
    <AppShell>
      <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 sm:py-8">
        <Link to="/users" className="mb-4 inline-block text-sm font-medium text-[color:var(--color-primary)]">
          ← Back to Users
        </Link>

        {isLoading && <p className="text-sm text-[color:var(--color-text-secondary)]">Loading…</p>}
        {isError && <p className="text-sm text-[color:var(--color-danger)]">Could not load this user.</p>}

        {data && (
          <>
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h1 className="text-xl font-bold text-[color:var(--color-text-primary)]">{data.resident.full_name}</h1>
                <p className="text-sm text-[color:var(--color-text-secondary)]">
                  {data.resident.resident_code ?? "No resident code yet"} · House {data.resident.house_code}
                </p>
                {approval && (
                  <p className="mt-1 text-sm text-[color:var(--color-text-secondary)]">
                    <span className="capitalize">{approval.decision}</span> by{" "}
                    <strong className="text-[color:var(--color-text-primary)]">
                      {approval.decided_by_admin_name}
                    </strong>{" "}
                    on {formatDateTime(approval.decided_at)}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <StatusBadge status={data.resident.verification_status} />
                {canManage && (
                  <Button variant="secondary" className="!px-4 !py-2 text-xs" onClick={() => { setError(null); setDialog("reset"); }}>
                    Reset Password
                  </Button>
                )}
                {canDelete && (
                  <Button variant="danger" className="!px-4 !py-2 text-xs" onClick={() => { setError(null); setDialog("delete"); }}>
                    Remove User
                  </Button>
                )}
              </div>
            </div>

            {notice && (
              <p className="mb-4 rounded-lg border border-[color:var(--color-border)] bg-[color:var(--color-primary-tint)] px-3 py-2 text-sm text-[color:var(--color-primary)]">
                {notice}
              </p>
            )}

            <div className="grid gap-4 sm:grid-cols-3">
              <GlassCard><p className="text-2xl font-bold text-[color:var(--color-text-primary)]">{data.complaint_count}</p><p className="text-xs text-[color:var(--color-text-secondary)]">Complaints</p></GlassCard>
              <GlassCard><p className="text-2xl font-bold text-[color:var(--color-text-primary)]">{data.feedback_count}</p><p className="text-xs text-[color:var(--color-text-secondary)]">Feedback given</p></GlassCard>
              <GlassCard><p className="text-2xl font-bold text-[color:var(--color-text-primary)]">{data.approval_history.length}</p><p className="text-xs text-[color:var(--color-text-secondary)]">Approval records</p></GlassCard>
            </div>

            <h2 className="mb-2 mt-8 text-sm font-bold uppercase tracking-wide text-[color:var(--color-text-secondary)]">
              Registration Details
            </h2>
            <div className="rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-surface-elevated)] px-4">
              <Field label="Full name" value={data.resident.full_name} />
              <Field label="User ID" value={data.resident.resident_code ?? "—"} />
              <Field label="House" value={data.resident.house_code} />
              <Field label="Type" value={<span className="capitalize">{data.resident.resident_type}</span>} />
              <Field label="CNIC" value={formatCnic(data.resident.cnic)} />
              <Field label="Phone" value={data.resident.phone} />
              <Field label="Email" value={data.resident.email ?? "—"} />
              <Field label="Registered" value={formatDateTime(data.resident.created_at)} />
            </div>

            <h2 className="mb-2 mt-8 text-sm font-bold uppercase tracking-wide text-[color:var(--color-text-secondary)]">
              Approval History
            </h2>
            {/* Answers "who approved this registration?". Read-only — there is
                deliberately no endpoint to edit or delete these records. */}
            {data.approval_history.length === 0 ? (
              <p className="text-sm text-[color:var(--color-text-secondary)]">No approval decisions recorded yet.</p>
            ) : (
              <div className="space-y-2">
                {data.approval_history.map((a) => (
                  <GlassCard key={a.id}>
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <p className="text-sm font-semibold capitalize text-[color:var(--color-text-primary)]">
                          {a.decision} by {a.decided_by_admin_name}
                        </p>
                        <p className="text-xs text-[color:var(--color-text-secondary)]">
                          {formatDateTime(a.decided_at)}
                        </p>
                      </div>
                      <div className="text-right text-xs text-[color:var(--color-text-tertiary)]">
                        <div>{a.house_code} · <span className="capitalize">{a.resident_type}</span></div>
                        <div>{a.resident_code ?? "—"}</div>
                      </div>
                    </div>
                    {a.reason && (
                      <p className="mt-2 text-xs italic text-[color:var(--color-text-secondary)]">{a.reason}</p>
                    )}
                  </GlassCard>
                ))}
              </div>
            )}

            <h2 className="mb-2 mt-8 text-sm font-bold uppercase tracking-wide text-[color:var(--color-text-secondary)]">
              Complaint History
            </h2>
            {data.complaints.length === 0 ? (
              <p className="text-sm text-[color:var(--color-text-secondary)]">No complaints filed.</p>
            ) : (
              <div className="space-y-2">
                {data.complaints.map((c) => (
                  <Link key={c.id} to={`/complaints/${c.id}`} className="block">
                    <GlassCard>
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-xs text-[color:var(--color-text-tertiary)]">{c.complaint_code}</p>
                          <p className="truncate font-semibold text-[color:var(--color-text-primary)]">{c.subcategory}</p>
                          <p className="text-xs text-[color:var(--color-text-secondary)]">
                            {c.category} · {formatDateTime(c.created_at)}
                          </p>
                        </div>
                        <StatusBadge status={c.status} />
                      </div>
                    </GlassCard>
                  </Link>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      <ActionDialog
        open={dialog === "reset"}
        title="Reset resident password"
        description={
          <>
            Sets a new password for <strong>{data?.resident.full_name}</strong>. Their old password
            is not needed. They stay signed in on any device they are already using.
          </>
        }
        confirmLabel="Reset Password"
        input={{ label: "New password", type: "password", minLength: 8, hint: "At least 8 characters. Recorded in the audit log as a reset — the password itself is never stored or logged." }}
        loading={resetPassword.isPending}
        error={dialog === "reset" ? error : null}
        onConfirm={handleReset}
        onCancel={() => setDialog(null)}
      />

      <ActionDialog
        open={dialog === "delete"}
        danger
        title="Remove this user?"
        description={
          <>
            <strong>{data?.resident.full_name}</strong> ({data?.resident.phone}) will be permanently
            removed. This cannot be undone.
            {activityCount > 0 && (
              <span className="mt-2 block font-semibold text-[color:var(--color-danger)]">
                This will also delete {data?.complaint_count} complaint(s) and{" "}
                {data?.feedback_count} feedback entry(s), including their full history.
              </span>
            )}
          </>
        }
        confirmLabel={activityCount > 0 ? "Remove and Delete History" : "Remove Permanently"}
        input={{ label: "Reason", placeholder: "e.g. duplicate entry", minLength: 3, hint: "Stored in the audit log alongside your name and the time." }}
        loading={deleteRegistration.isPending}
        error={dialog === "delete" ? error : null}
        onConfirm={handleDelete}
        onCancel={() => setDialog(null)}
      />
    </AppShell>
  );
}
