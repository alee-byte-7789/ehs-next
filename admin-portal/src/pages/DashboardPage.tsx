import { useState } from "react";

import { AppShell } from "../components/AppShell";
import { Button } from "../components/Button";
import { GlassCard } from "../components/GlassCard";
import { StatusBadge } from "../components/StatusBadge";
import { extractApiErrorMessage } from "../lib/api-client";
import { useDashboardCounts } from "../lib/complaint-queries";
import { useAdminMe } from "../lib/registration-queries";
import { useApproveRegistration, usePendingRegistrations, useRejectRegistration } from "../lib/registration-queries";

/** Renders a stored 13-digit CNIC as 12345-1234567-1 for readability. */
function formatCnic(cnic: string): string {
  const d = cnic.replace(/\D/g, "");
  return d.length === 13 ? `${d.slice(0, 5)}-${d.slice(5, 12)}-${d.slice(12)}` : cnic;
}

export function DashboardPage() {
  const { data: admin } = useAdminMe(true);
  const { data: pending, isLoading, isError } = usePendingRegistrations();
  const { data: counts } = useDashboardCounts();
  const approve = useApproveRegistration();
  const reject = useRejectRegistration();
  const [actionError, setActionError] = useState<string | null>(null);
  const [actingOn, setActingOn] = useState<number | null>(null);

  const handleApprove = async (residentId: number) => {
    setActionError(null);
    setActingOn(residentId);
    try {
      await approve.mutateAsync(residentId);
    } catch (err) {
      setActionError(extractApiErrorMessage(err, "Could not approve this registration."));
    } finally {
      setActingOn(null);
    }
  };

  const handleReject = async (residentId: number) => {
    setActionError(null);
    setActingOn(residentId);
    try {
      await reject.mutateAsync(residentId);
    } catch (err) {
      setActionError(extractApiErrorMessage(err, "Could not reject this registration."));
    } finally {
      setActingOn(null);
    }
  };

  return (
    <AppShell>
      <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 sm:py-8">
        <div className="mb-6">
          <h1 className="text-xl font-bold text-[color:var(--color-text-primary)]">
            Good {timeOfDay()}, {admin?.full_name?.split(" ")[0] ?? "Admin"}
          </h1>
          <p className="text-sm text-[color:var(--color-text-secondary)]">Here's what's happening today.</p>
        </div>

        {counts && (
          <GlassCard className="mb-6">
            <h2 className="mb-4 text-sm font-bold text-[color:var(--color-text-primary)]">Overview</h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
              <StatTile label="Open" value={counts.open} />
              <StatTile label="Pending" value={counts.pending} color="var(--color-status-pending)" />
              <StatTile label="Resolved Today" value={counts.resolved_today} color="var(--color-status-resolved)" />
              <StatTile label="High Priority" value={counts.high_priority} color="var(--color-status-pending)" />
              <StatTile label="Critical" value={counts.critical} color="var(--color-status-reopened)" />
              {counts.assigned_to_me !== undefined && <StatTile label="Assigned to Me" value={counts.assigned_to_me} />}
            </div>
          </GlassCard>
        )}

        <h2 className="mb-4 text-base font-semibold text-[color:var(--color-text-primary)]">Pending Registrations</h2>

        {actionError && (
          <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-[color:var(--color-danger)]">{actionError}</p>
        )}

        {isLoading && <p className="text-sm text-[color:var(--color-text-secondary)]">Loading...</p>}
        {isError && (
          <p className="text-sm text-[color:var(--color-danger)]">
            Could not load pending registrations. Your session may have expired — try logging in again.
          </p>
        )}
        {pending && pending.length === 0 && (
          <p className="text-sm text-[color:var(--color-text-secondary)]">No pending registrations right now — all caught up.</p>
        )}

        {pending && pending.length > 0 && (
          <>
            {/* Table on sm+, stacked cards on mobile — per the responsive spec */}
            <div className="hidden overflow-hidden rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-surface-elevated)] sm:block">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-[color:var(--color-border)] bg-[color:var(--color-surface)] text-xs uppercase text-[color:var(--color-text-secondary)]">
                  <tr>
                    <th className="px-4 py-3">Name</th>
                    <th className="px-4 py-3">Phone</th>
                    <th className="px-4 py-3">Type</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pending.map((resident) => (
                    <tr key={resident.id} className="border-b border-[color:var(--color-border)] last:border-0">
                      <td className="px-4 py-3 font-medium text-[color:var(--color-text-primary)]">{resident.full_name}</td>
                      <td className="px-4 py-3 text-[color:var(--color-text-secondary)]">{resident.phone}</td>
                      <td className="px-4 py-3 capitalize text-[color:var(--color-text-secondary)]">
                        {resident.resident_type}
                        {resident.cnic && ` · CNIC ${formatCnic(resident.cnic)}`}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={resident.verification_status} />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <Button
                            variant="primary"
                            className="!px-3 !py-1.5 text-xs"
                            loading={actingOn === resident.id && approve.isPending}
                            disabled={actingOn !== null}
                            onClick={() => handleApprove(resident.id)}
                          >
                            Approve
                          </Button>
                          <Button
                            variant="danger"
                            className="!px-3 !py-1.5 text-xs"
                            loading={actingOn === resident.id && reject.isPending}
                            disabled={actingOn !== null}
                            onClick={() => handleReject(resident.id)}
                          >
                            Reject
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="space-y-3 sm:hidden">
              {pending.map((resident) => (
                <GlassCard key={resident.id}>
                  <div className="mb-2 flex items-start justify-between">
                    <div>
                      <p className="font-semibold text-[color:var(--color-text-primary)]">{resident.full_name}</p>
                      <p className="text-xs text-[color:var(--color-text-secondary)]">{resident.phone}</p>
                    </div>
                    <StatusBadge status={resident.verification_status} />
                  </div>
                  <p className="mb-3 text-xs capitalize text-[color:var(--color-text-secondary)]">
                    {resident.resident_type}
                    {resident.cnic && ` · CNIC ${formatCnic(resident.cnic)}`}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="primary"
                      className="flex-1 !py-1.5 text-xs"
                      loading={actingOn === resident.id && approve.isPending}
                      disabled={actingOn !== null}
                      onClick={() => handleApprove(resident.id)}
                    >
                      Approve
                    </Button>
                    <Button
                      variant="danger"
                      className="flex-1 !py-1.5 text-xs"
                      loading={actingOn === resident.id && reject.isPending}
                      disabled={actingOn !== null}
                      onClick={() => handleReject(resident.id)}
                    >
                      Reject
                    </Button>
                  </div>
                </GlassCard>
              ))}
            </div>
          </>
        )}
      </div>
    </AppShell>
  );
}

function timeOfDay(): string {
  const h = new Date().getHours();
  if (h < 12) return "Morning";
  if (h < 17) return "Afternoon";
  return "Evening";
}

function StatTile({ label, value, color }: { label: string; value: number; color?: string }) {
  return (
    <div>
      <p className="text-2xl font-bold" style={{ color: color ?? "var(--color-text-primary)" }}>
        {value}
      </p>
      <p className="text-xs text-[color:var(--color-text-secondary)]">{label}</p>
    </div>
  );
}
