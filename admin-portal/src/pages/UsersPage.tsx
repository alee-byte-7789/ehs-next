import { useState } from "react";
import { Link } from "react-router-dom";

import { AppShell } from "../components/AppShell";
import { GlassCard } from "../components/GlassCard";
import { Select } from "../components/Select";
import { StatusBadge } from "../components/StatusBadge";
import { Button } from "../components/Button";
import { useAdminMe } from "../lib/registration-queries";
import { useUsers } from "../lib/user-queries";
import type { UserFilters } from "../lib/types";

const TYPE_OPTIONS = [
  { value: "", label: "All types" },
  { value: "owner", label: "Owners" },
  { value: "tenant", label: "Tenants" },
] as const;

const STATUS_OPTIONS = [
  { value: "", label: "All statuses" },
  { value: "approved", label: "Approved" },
  { value: "pending", label: "Pending" },
  { value: "rejected", label: "Rejected" },
] as const;

/** Renders a stored 13-digit CNIC as 12345-1234567-1 for readability. */
function formatCnic(cnic: string | null): string {
  if (!cnic) return "—";
  const d = cnic.replace(/\D/g, "");
  return d.length === 13 ? `${d.slice(0, 5)}-${d.slice(5, 12)}-${d.slice(12)}` : cnic;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}

export function UsersPage() {
  const [q, setQ] = useState("");
  const [type, setType] = useState<string>("");
  const [status, setStatus] = useState<string>("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const filters: UserFilters = {
    q: q.trim() || undefined,
    resident_type: (type || undefined) as UserFilters["resident_type"],
    verification_status: (status || undefined) as UserFilters["verification_status"],
    created_from: from || undefined,
    created_to: to || undefined,
  };

  const { data: users, isLoading, isError } = useUsers(filters);
  const { data: me } = useAdminMe(true);

  return (
    <AppShell>
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
        <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-[color:var(--color-text-primary)]">Users</h1>
            <p className="text-sm text-[color:var(--color-text-secondary)]">
              Every registered resident. Search by name, user ID, house, phone, email or CNIC.
            </p>
          </div>
          {/* Only offered to roles the server will actually allow. */}
          {(me?.role === "housing_office" || me?.role === "super_admin") && (
            <Link to="/users/new">
              <Button className="!px-4 !py-2 text-xs">+ Add User</Button>
            </Link>
          )}
        </div>

        {/* One search box rather than six: an admin looking someone up rarely
            knows which identifier they happen to have. */}
        <div className="mb-4 flex flex-col gap-3">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search name, user ID, house number, phone, email, CNIC…"
            className="w-full rounded-full border border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-4 py-2.5 text-sm text-[color:var(--color-text-primary)] outline-none focus:border-[color:var(--color-primary)]"
          />
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <Select value={type} onChange={setType} options={TYPE_OPTIONS as never} />
            <Select value={status} onChange={setStatus} options={STATUS_OPTIONS as never} />
            <input
              type="date" value={from} onChange={(e) => setFrom(e.target.value)}
              className="rounded-lg border border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-3 py-2 text-sm text-[color:var(--color-text-primary)]"
            />
            <input
              type="date" value={to} onChange={(e) => setTo(e.target.value)}
              className="rounded-lg border border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-3 py-2 text-sm text-[color:var(--color-text-primary)]"
            />
          </div>
        </div>

        {isLoading && <p className="text-sm text-[color:var(--color-text-secondary)]">Loading…</p>}
        {isError && <p className="text-sm text-[color:var(--color-danger)]">Could not load users.</p>}
        {users && users.length === 0 && (
          <p className="text-sm text-[color:var(--color-text-secondary)]">No users match these filters.</p>
        )}

        {users && users.length > 0 && (
          <>
            <p className="mb-3 text-xs text-[color:var(--color-text-tertiary)]">
              {users.length} user{users.length === 1 ? "" : "s"}
            </p>

            {/* Table on sm+ only. Below that it becomes cards — a six-column
                table on a phone either overflows the screen or squashes every
                column to unreadable width. */}
            <div className="hidden overflow-hidden rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-surface-elevated)] sm:block">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-[color:var(--color-border)] bg-[color:var(--color-surface)] text-xs uppercase text-[color:var(--color-text-secondary)]">
                  <tr>
                    <th className="px-4 py-3">Name / User ID</th>
                    <th className="px-4 py-3">House</th>
                    <th className="px-4 py-3">Type</th>
                    <th className="px-4 py-3">Contact</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Registered</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id} className="border-b border-[color:var(--color-border)] last:border-0">
                      <td className="px-4 py-3">
                        <Link to={`/users/${u.id}`} className="font-medium text-[color:var(--color-primary)]">
                          {u.full_name}
                        </Link>
                        <div className="text-xs text-[color:var(--color-text-tertiary)]">
                          {u.resident_code ?? "—"}
                        </div>
                      </td>
                      <td className="px-4 py-3 font-semibold text-[color:var(--color-text-primary)]">{u.house_code}</td>
                      <td className="px-4 py-3 capitalize text-[color:var(--color-text-secondary)]">{u.resident_type}</td>
                      <td className="px-4 py-3 text-[color:var(--color-text-secondary)]">
                        {u.phone}
                        <div className="text-xs text-[color:var(--color-text-tertiary)]">{formatCnic(u.cnic)}</div>
                      </td>
                      <td className="px-4 py-3"><StatusBadge status={u.verification_status} /></td>
                      <td className="px-4 py-3 text-[color:var(--color-text-secondary)]">{formatDate(u.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile: stacked cards, everything visible, nothing clipped. */}
            <div className="space-y-3 sm:hidden">
              {users.map((u) => (
                <Link key={u.id} to={`/users/${u.id}`} className="block">
                  <GlassCard>
                    <div className="mb-2 flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-[color:var(--color-text-primary)]">{u.full_name}</p>
                        <p className="text-xs text-[color:var(--color-text-tertiary)]">{u.resident_code ?? "—"}</p>
                      </div>
                      <StatusBadge status={u.verification_status} />
                    </div>
                    <div className="grid grid-cols-2 gap-y-1 text-xs text-[color:var(--color-text-secondary)]">
                      <span>House</span><span className="text-right font-semibold">{u.house_code}</span>
                      <span>Type</span><span className="text-right capitalize">{u.resident_type}</span>
                      <span>Phone</span><span className="text-right">{u.phone}</span>
                      <span>CNIC</span><span className="text-right">{formatCnic(u.cnic)}</span>
                      <span>Registered</span><span className="text-right">{formatDate(u.created_at)}</span>
                    </div>
                  </GlassCard>
                </Link>
              ))}
            </div>
          </>
        )}
      </div>
    </AppShell>
  );
}
