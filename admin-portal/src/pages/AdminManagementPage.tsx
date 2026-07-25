import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { Link } from "react-router-dom";
import { z } from "zod";

import { Button } from "../components/Button";
import { extractApiErrorMessage } from "../lib/api-client";
import { useAdminsList, useCreateAdmin } from "../lib/admin-management-queries";
import { useAdminMe } from "../lib/registration-queries";
import type { AdminRole } from "../lib/types";

const ROLE_OPTIONS: { value: AdminRole; label: string }[] = [
  { value: "housing_office", label: "Housing Office Admin" },
  { value: "it_admin", label: "IT Admin" },
  { value: "super_admin", label: "Super Admin" },
];

const schema = z.object({
  full_name: z.string().min(2, "Enter a name"),
  email: z.string().email("Enter a valid email"),
  password: z.string().min(8, "At least 8 characters"),
  role: z.enum(["housing_office", "it_admin", "super_admin"]),
});

type FormValues = z.infer<typeof schema>;

export function AdminManagementPage() {
  const { data: me } = useAdminMe(true);
  const isSuperAdmin = me?.role === "super_admin";

  const { data: admins, isLoading, isError } = useAdminsList(isSuperAdmin);
  const createAdmin = useCreateAdmin();
  const [serverError, setServerError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { full_name: "", email: "", password: "", role: "housing_office" },
  });

  const onSubmit = async (values: FormValues) => {
    setServerError(null);
    setSuccessMessage(null);
    try {
      const created = await createAdmin.mutateAsync(values);
      setSuccessMessage(`Created ${created.full_name} (${created.role}).`);
      reset();
    } catch (err) {
      setServerError(extractApiErrorMessage(err, "Could not create admin."));
    }
  };

  return (
    <div className="min-h-screen bg-[color:var(--color-surface)]">
      <header className="flex items-center justify-between border-b border-[color:var(--color-border)] bg-white px-6 py-4">
        <h1 className="text-lg font-semibold text-[color:var(--color-text-primary)]">Manage Admins</h1>
        <Link to="/" className="text-sm font-medium text-[color:var(--color-primary)]">
          ← Back to Dashboard
        </Link>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-8">
        {!isSuperAdmin && (
          <p className="rounded-lg bg-amber-50 px-4 py-3 text-sm text-[color:var(--color-text-primary)]">
            Only Super Admins can manage other admin accounts. You're signed in as{" "}
            <strong>{me?.role ?? "..."}</strong>.
          </p>
        )}

        {isSuperAdmin && (
          <>
            <div className="mb-8 rounded-xl border border-[color:var(--color-border)] bg-white p-6">
              <h2 className="mb-4 text-base font-semibold text-[color:var(--color-text-primary)]">
                Create a new admin
              </h2>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-[color:var(--color-text-secondary)]">
                    Full name
                  </label>
                  <Controller
                    control={control}
                    name="full_name"
                    render={({ field }) => (
                      <input
                        {...field}
                        className="w-full rounded-lg border border-[color:var(--color-border)] px-3 py-2 text-sm outline-none focus:border-[color:var(--color-primary)]"
                      />
                    )}
                  />
                  {errors.full_name && <p className="mt-1 text-xs text-[color:var(--color-danger)]">{errors.full_name.message}</p>}
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-[color:var(--color-text-secondary)]">
                    Email
                  </label>
                  <Controller
                    control={control}
                    name="email"
                    render={({ field }) => (
                      <input
                        {...field}
                        type="email"
                        className="w-full rounded-lg border border-[color:var(--color-border)] px-3 py-2 text-sm outline-none focus:border-[color:var(--color-primary)]"
                      />
                    )}
                  />
                  {errors.email && <p className="mt-1 text-xs text-[color:var(--color-danger)]">{errors.email.message}</p>}
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-[color:var(--color-text-secondary)]">
                    Temporary password
                  </label>
                  <Controller
                    control={control}
                    name="password"
                    render={({ field }) => (
                      <input
                        {...field}
                        type="text"
                        className="w-full rounded-lg border border-[color:var(--color-border)] px-3 py-2 text-sm outline-none focus:border-[color:var(--color-primary)]"
                      />
                    )}
                  />
                  {errors.password && <p className="mt-1 text-xs text-[color:var(--color-danger)]">{errors.password.message}</p>}
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-[color:var(--color-text-secondary)]">
                    Role
                  </label>
                  <Controller
                    control={control}
                    name="role"
                    render={({ field }) => (
                      <select
                        {...field}
                        className="w-full rounded-lg border border-[color:var(--color-border)] px-3 py-2 text-sm outline-none focus:border-[color:var(--color-primary)]"
                      >
                        {ROLE_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    )}
                  />
                </div>
              </div>

              {serverError && <p className="mt-4 text-sm text-[color:var(--color-danger)]">{serverError}</p>}
              {successMessage && <p className="mt-4 text-sm text-[color:var(--color-primary)]">{successMessage}</p>}

              <Button className="mt-4" loading={createAdmin.isPending} onClick={handleSubmit(onSubmit)}>
                Create admin
              </Button>
            </div>

            <div className="rounded-xl border border-[color:var(--color-border)] bg-white">
              <h2 className="border-b border-[color:var(--color-border)] px-6 py-4 text-base font-semibold text-[color:var(--color-text-primary)]">
                Existing admins
              </h2>
              {isLoading && <p className="px-6 py-4 text-sm text-[color:var(--color-text-secondary)]">Loading...</p>}
              {isError && <p className="px-6 py-4 text-sm text-[color:var(--color-danger)]">Could not load admins.</p>}
              {admins && (
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-[color:var(--color-border)] text-xs uppercase text-[color:var(--color-text-secondary)]">
                    <tr>
                      <th className="px-6 py-3">Name</th>
                      <th className="px-6 py-3">Email</th>
                      <th className="px-6 py-3">Role</th>
                    </tr>
                  </thead>
                  <tbody>
                    {admins.map((a) => (
                      <tr key={a.id} className="border-b border-[color:var(--color-border)] last:border-0">
                        <td className="px-6 py-3 font-medium text-[color:var(--color-text-primary)]">{a.full_name}</td>
                        <td className="px-6 py-3 text-[color:var(--color-text-secondary)]">{a.email}</td>
                        <td className="px-6 py-3 capitalize text-[color:var(--color-text-secondary)]">
                          {a.role.replace("_", " ")}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
