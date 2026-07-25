import { History, LogOut, MessageSquareWarning, ShieldCheck, Users } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";

import { Button } from "../components/Button";
import { StatusBadge } from "../components/StatusBadge";
import { useAuth } from "../lib/auth-context";
import { useDashboardCounts } from "../lib/complaint-queries";
import { useAdminMe } from "../lib/registration-queries";
import {
  useApproveRegistration,
  usePendingRegistrations,
  useRejectRegistration,
} from "../lib/registration-queries";
import { extractApiErrorMessage } from "../lib/api-client";

export function DashboardPage() {
  const { logout } = useAuth();
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
    <div className="min-h-screen bg-[color:var(--color-surface)]">
      <header className="flex items-center justify-between border-b border-[color:var(--color-border)] bg-white px-6 py-4">
        <div>
          <h1 className="text-lg font-semibold text-[color:var(--color-text-primary)]">EHS Next Admin</h1>
          {admin && (
            <p className="text-xs text-[color:var(--color-text-secondary)]">
              {admin.full_name} · {admin.role.replace("_", " ")}
            </p>
          )}
        </div>
        <div className="flex items-center gap-3">
          <Link to="/complaints" className="flex items-center gap-1.5 text-sm font-medium text-[color:var(--color-primary)]">
            <MessageSquareWarning size={16} /> Complaints
          </Link>
          <Link to="/staff" className="flex items-center gap-1.5 text-sm font-medium text-[color:var(--color-primary)]">
            <Users size={16} /> Staff
          </Link>
          {admin?.role === "super_admin" && (
            <Link to="/admins" className="flex items-center gap-1.5 text-sm font-medium text-[color:var(--color-primary)]">
              <ShieldCheck size={16} /> Manage Admins
            </Link>
          )}
          {admin?.role === "super_admin" && (
            <Link to="/audit-logs" className="flex items-center gap-1.5 text-sm font-medium text-[color:var(--color-primary)]">
              <History size={16} /> Audit Logs
            </Link>
          )}
          <Button variant="secondary" onClick={logout}>
            <span className="flex items-center gap-1.5">
              <LogOut size={16} /> Log out
            </span>
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-6 py-8">
        {counts && (
          <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            <WidgetCard label="Open" value={counts.open} />
            <WidgetCard label="Pending" value={counts.pending} />
            <WidgetCard label="Resolved Today" value={counts.resolved_today} />
            <WidgetCard label="High Priority" value={counts.high_priority} color="var(--color-status-pending)" />
            <WidgetCard label="Critical" value={counts.critical} color="var(--color-status-reopened)" />
            {counts.assigned_to_me !== undefined && <WidgetCard label="Assigned to Me" value={counts.assigned_to_me} />}
          </div>
        )}

        <h2 className="mb-4 text-base font-semibold text-[color:var(--color-text-primary)]">
          Pending Registrations
        </h2>

        {actionError && (
          <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-[color:var(--color-danger)]">
            {actionError}
          </p>
        )}

        {isLoading && <p className="text-sm text-[color:var(--color-text-secondary)]">Loading...</p>}
        {isError && (
          <p className="text-sm text-[color:var(--color-danger)]">
            Could not load pending registrations. Your session may have expired — try logging in again.
          </p>
        )}

        {pending && pending.length === 0 && (
          <p className="text-sm text-[color:var(--color-text-secondary)]">
            No pending registrations right now — all caught up.
          </p>
        )}

        {pending && pending.length > 0 && (
          <div className="overflow-hidden rounded-xl border border-[color:var(--color-border)] bg-white">
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
                    <td className="px-4 py-3 font-medium text-[color:var(--color-text-primary)]">
                      {resident.full_name}
                    </td>
                    <td className="px-4 py-3 text-[color:var(--color-text-secondary)]">{resident.phone}</td>
                    <td className="px-4 py-3 text-[color:var(--color-text-secondary)] capitalize">
                      {resident.resident_type}
                      {resident.is_employee && " · Employee"}
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
        )}
      </main>
    </div>
  );
}

function WidgetCard({ label, value, color }: { label: string; value: number; color?: string }) {
  return (
    <div className="rounded-xl border border-[color:var(--color-border)] bg-white p-4">
      <p className="text-2xl font-bold" style={{ color: color ?? "var(--color-text-primary)" }}>
        {value}
      </p>
      <p className="text-xs text-[color:var(--color-text-secondary)]">{label}</p>
    </div>
  );
}
