import { Link } from "react-router-dom";

import { useAuditLogs } from "../lib/complaint-queries";

export function AuditLogPage() {
  const { data: logs, isLoading, isError } = useAuditLogs();

  return (
    <div className="min-h-screen bg-[color:var(--color-surface)]">
      <header className="flex items-center justify-between border-b border-[color:var(--color-border)] bg-[color:var(--color-surface-elevated)] px-6 py-4">
        <h1 className="text-lg font-semibold text-[color:var(--color-text-primary)]">Audit Logs</h1>
        <Link to="/" className="text-sm font-medium text-[color:var(--color-primary)]">
          ← Back to Dashboard
        </Link>
      </header>

      <main className="mx-auto max-w-4xl px-6 py-8">
        {isLoading && <p className="text-sm text-[color:var(--color-text-secondary)]">Loading...</p>}
        {isError && (
          <p className="text-sm text-[color:var(--color-danger)]">
            Could not load audit logs — this page is restricted to Super Admins.
          </p>
        )}

        {logs && (
          <div className="overflow-hidden rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-surface-elevated)]">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-[color:var(--color-border)] bg-[color:var(--color-surface)] text-xs uppercase text-[color:var(--color-text-secondary)]">
                <tr>
                  <th className="px-4 py-3">Action</th>
                  <th className="px-4 py-3">Entity</th>
                  <th className="px-4 py-3">Admin</th>
                  <th className="px-4 py-3">Details</th>
                  <th className="px-4 py-3">When</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id} className="border-b border-[color:var(--color-border)] last:border-0">
                    <td className="px-4 py-3 font-medium text-[color:var(--color-text-primary)]">{log.action}</td>
                    <td className="px-4 py-3 text-[color:var(--color-text-secondary)]">
                      {log.entity_type} #{log.entity_id}
                    </td>
                    <td className="px-4 py-3 text-[color:var(--color-text-secondary)]">
                      {log.actor_admin_id ? `#${log.actor_admin_id}` : "—"}
                    </td>
                    <td className="px-4 py-3 text-[color:var(--color-text-secondary)]">{log.details ?? "—"}</td>
                    <td className="px-4 py-3 text-[color:var(--color-text-secondary)]">
                      {new Date(log.created_at).toLocaleString()}
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
