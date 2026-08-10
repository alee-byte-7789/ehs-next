import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { AppShell } from "../components/AppShell";
import { Button } from "../components/Button";
import { Select } from "../components/Select";
import { extractApiErrorMessage } from "../lib/api-client";
import { useAdminMe } from "../lib/registration-queries";
import { useManualRegister, type ManualRegisterPayload } from "../lib/user-queries";

/** Formats a CNIC as 12345-1234567-1 while typing. Only ever strips
 *  non-digits and re-inserts dashes, so it can't corrupt the input. */
function formatCnic(input: string): string {
  const d = input.replace(/\D/g, "").slice(0, 13);
  if (d.length <= 5) return d;
  if (d.length <= 12) return `${d.slice(0, 5)}-${d.slice(5)}`;
  return `${d.slice(0, 5)}-${d.slice(5, 12)}-${d.slice(12)}`;
}

function Field({
  label, value, onChange, placeholder, type = "text", hint, required,
}: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder?: string; type?: string; hint?: string; required?: boolean;
}) {
  return (
    <div>
      <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[color:var(--color-text-secondary)]">
        {label}{required && <span className="text-[color:var(--color-danger)]"> *</span>}
      </label>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-3 py-2 text-sm text-[color:var(--color-text-primary)] outline-none focus:border-[color:var(--color-primary)]"
      />
      {hint && <p className="mt-1 text-xs text-[color:var(--color-text-tertiary)]">{hint}</p>}
    </div>
  );
}

/**
 * Add a resident by hand.
 *
 * Used when someone can't or won't register themselves — walk-ins at the
 * housing office, residents without a smartphone. Because an admin has
 * already verified them in person, the resident is created APPROVED and
 * gets a resident code immediately, rather than going into the pending
 * queue for the same admin to approve seconds later.
 */
export function AddUserPage() {
  const navigate = useNavigate();
  const { data: me } = useAdminMe(true);
  const manualRegister = useManualRegister();

  const [form, setForm] = useState({
    full_name: "", house_number: "", mobile_number: "", email: "",
    password: "", cnic: "",
    owner_house_number: "", owner_name: "", owner_cnic: "", owner_mobile_number: "",
  });
  const [isTenant, setIsTenant] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = (k: keyof typeof form) => (v: string) => setForm((f) => ({ ...f, [k]: v }));
  const canManage = me?.role === "housing_office" || me?.role === "super_admin";

  const cnicDigits = form.cnic.replace(/\D/g, "").length;
  const ownerCnicDigits = form.owner_cnic.replace(/\D/g, "").length;

  const baseValid =
    form.full_name.trim().length >= 2 &&
    form.house_number.trim().length >= 1 &&
    form.mobile_number.trim().length >= 7 &&
    form.password.length >= 8 &&
    cnicDigits === 13;

  const tenantValid = !isTenant || (
    form.owner_house_number.trim() && form.owner_name.trim() &&
    ownerCnicDigits === 13 && form.owner_mobile_number.trim()
  );

  const canSubmit = baseValid && tenantValid;

  const submit = async () => {
    setError(null);
    const payload: ManualRegisterPayload = {
      full_name: form.full_name.trim(),
      house_number: form.house_number.trim(),
      mobile_number: form.mobile_number.trim(),
      email: form.email.trim() || undefined,
      password: form.password,
      cnic: form.cnic,
      is_tenant: isTenant,
      // Owner fields must be omitted entirely for an owner — the API
      // rejects them being present when is_tenant is false.
      ...(isTenant ? {
        owner_house_number: form.owner_house_number.trim(),
        owner_name: form.owner_name.trim(),
        owner_cnic: form.owner_cnic,
        owner_mobile_number: form.owner_mobile_number.trim(),
      } : {}),
    };
    try {
      const created = await manualRegister.mutateAsync(payload);
      navigate(`/users/${created.id}`);
    } catch (err) {
      setError(extractApiErrorMessage(err, "Could not create this resident."));
    }
  };

  if (me && !canManage) {
    return (
      <AppShell>
        <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
          <p className="text-sm text-[color:var(--color-text-secondary)]">
            Only Housing Office and Super Admins can add residents. You're signed in as{" "}
            <strong>{me.role}</strong>.
          </p>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-2xl px-4 py-6 sm:px-6 sm:py-8">
        <Link to="/users" className="mb-4 inline-block text-sm font-medium text-[color:var(--color-primary)]">
          ← Back to Users
        </Link>

        <h1 className="text-xl font-bold text-[color:var(--color-text-primary)]">Add Resident</h1>
        <p className="mb-6 text-sm text-[color:var(--color-text-secondary)]">
          Creates the account already approved, with a resident code assigned. Recorded in the
          audit log under your name.
        </p>

        <div className="space-y-4 rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-surface-elevated)] p-5">
          <Field label="Full name" value={form.full_name} onChange={set("full_name")} required />
          <Field label="CNIC" value={form.cnic} onChange={(v) => set("cnic")(formatCnic(v))}
                 placeholder="12345-1234567-1" required
                 hint={cnicDigits > 0 && cnicDigits !== 13 ? `${cnicDigits}/13 digits` : undefined} />
          <Field label="House number" value={form.house_number} onChange={set("house_number")} placeholder="B-26" required />
          <Field label="Mobile number" value={form.mobile_number} onChange={set("mobile_number")} placeholder="03001234567" required
                 hint="This is also how they sign in." />
          <Field label="Email (optional)" value={form.email} onChange={set("email")} type="email" />
          <Field label="Password" value={form.password} onChange={set("password")} type="password" required
                 hint="At least 8 characters. Give it to the resident directly — it is never shown again." />

          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[color:var(--color-text-secondary)]">
              Resident type
            </label>
            <Select
              value={isTenant ? "tenant" : "owner"}
              onChange={(v) => setIsTenant(v === "tenant")}
              options={[{ value: "owner", label: "Owner" }, { value: "tenant", label: "Tenant" }]}
            />
          </div>

          {isTenant && (
            <div className="space-y-4 rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--color-text-secondary)]">
                Owner details (required for tenants)
              </p>
              <Field label="Owner's house number" value={form.owner_house_number} onChange={set("owner_house_number")} required />
              <Field label="Owner's name" value={form.owner_name} onChange={set("owner_name")} required />
              <Field label="Owner's CNIC" value={form.owner_cnic} onChange={(v) => set("owner_cnic")(formatCnic(v))}
                     placeholder="12345-1234567-1" required
                     hint={ownerCnicDigits > 0 && ownerCnicDigits !== 13 ? `${ownerCnicDigits}/13 digits` : undefined} />
              <Field label="Owner's mobile" value={form.owner_mobile_number} onChange={set("owner_mobile_number")} required />
            </div>
          )}

          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-[color:var(--color-danger)]">{error}</p>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => navigate("/users")}>Cancel</Button>
            <Button onClick={submit} disabled={!canSubmit} loading={manualRegister.isPending}>
              Create Resident
            </Button>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
