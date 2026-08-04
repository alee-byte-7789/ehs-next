import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { Link } from "react-router-dom";
import { z } from "zod";

import { Button } from "../components/Button";
import { Select } from "../components/Select";
import { extractApiErrorMessage } from "../lib/api-client";
import { useCreateStaff, useStaffList } from "../lib/staff-queries";
import type { StaffCategory } from "../lib/types";

const CATEGORY_OPTIONS: { value: StaffCategory; label: string }[] = [
  { value: "electrician", label: "Electrician" },
  { value: "plumber", label: "Plumber" },
  { value: "mason", label: "Mason" },
  { value: "security", label: "Security" },
  { value: "sanitation", label: "Sanitation" },
  { value: "other", label: "Other" },
];

const schema = z.object({
  full_name: z.string().min(2, "Enter a name"),
  phone: z.string().min(7, "Enter a valid phone number"),
  category: z.enum(["electrician", "plumber", "mason", "security", "sanitation", "other"]),
});

type FormValues = z.infer<typeof schema>;

export function StaffPage() {
  const { data: staff, isLoading } = useStaffList();
  const createStaff = useCreateStaff();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { full_name: "", phone: "", category: "electrician" },
  });

  const onSubmit = async (values: FormValues) => {
    setServerError(null);
    try {
      await createStaff.mutateAsync(values);
      reset();
    } catch (err) {
      setServerError(extractApiErrorMessage(err, "Could not add staff member."));
    }
  };

  return (
    <div className="min-h-screen bg-[color:var(--color-surface)]">
      <header className="flex items-center justify-between border-b border-[color:var(--color-border)] bg-[color:var(--color-surface-elevated)] px-6 py-4">
        <h1 className="text-lg font-semibold text-[color:var(--color-text-primary)]">Maintenance Staff</h1>
        <Link to="/" className="text-sm font-medium text-[color:var(--color-primary)]">
          ← Back to Dashboard
        </Link>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-8">
        <div className="mb-8 rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-surface-elevated)] p-6">
          <h2 className="mb-4 text-base font-semibold text-[color:var(--color-text-primary)]">Add staff member</h2>
          <div className="grid gap-4 sm:grid-cols-3">
            <Controller
              control={control}
              name="full_name"
              render={({ field }) => (
                <input {...field} placeholder="Full name" className="rounded-lg border border-[color:var(--color-border)] px-3 py-2 text-sm" />
              )}
            />
            <Controller
              control={control}
              name="phone"
              render={({ field }) => (
                <input {...field} placeholder="Phone" className="rounded-lg border border-[color:var(--color-border)] px-3 py-2 text-sm" />
              )}
            />
            <Controller
              control={control}
              name="category"
              render={({ field }) => (
                <Select value={field.value} onChange={field.onChange} options={CATEGORY_OPTIONS} />
              )}
            />
          </div>
          {(errors.full_name || errors.phone) && (
            <p className="mt-2 text-xs text-[color:var(--color-danger)]">
              {errors.full_name?.message || errors.phone?.message}
            </p>
          )}
          {serverError && <p className="mt-2 text-sm text-[color:var(--color-danger)]">{serverError}</p>}
          <Button className="mt-4" loading={createStaff.isPending} onClick={handleSubmit(onSubmit)}>
            Add Staff
          </Button>
        </div>

        <div className="rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-surface-elevated)]">
          <h2 className="border-b border-[color:var(--color-border)] px-6 py-4 text-base font-semibold text-[color:var(--color-text-primary)]">
            Current staff
          </h2>
          {isLoading && <p className="px-6 py-4 text-sm text-[color:var(--color-text-secondary)]">Loading...</p>}
          {staff && (
            <table className="w-full text-left text-sm">
              <thead className="border-b border-[color:var(--color-border)] text-xs uppercase text-[color:var(--color-text-secondary)]">
                <tr>
                  <th className="px-6 py-3">Name</th>
                  <th className="px-6 py-3">Phone</th>
                  <th className="px-6 py-3">Category</th>
                </tr>
              </thead>
              <tbody>
                {staff.map((s) => (
                  <tr key={s.id} className="border-b border-[color:var(--color-border)] last:border-0">
                    <td className="px-6 py-3 font-medium text-[color:var(--color-text-primary)]">{s.full_name}</td>
                    <td className="px-6 py-3 text-[color:var(--color-text-secondary)]">{s.phone}</td>
                    <td className="px-6 py-3 capitalize text-[color:var(--color-text-secondary)]">{s.category}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </main>
    </div>
  );
}
