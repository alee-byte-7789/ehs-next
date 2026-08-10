import { useEffect, useState, type ReactNode } from "react";

import { Button } from "./Button";

interface ActionDialogProps {
  open: boolean;
  title: string;
  description?: ReactNode;
  /** Shown when the action is destructive — amber/red framing and wording. */
  danger?: boolean;
  confirmLabel: string;
  /** Field the admin must fill before confirming (new password, or a reason). */
  input?: {
    label: string;
    placeholder?: string;
    type?: "text" | "password";
    /** Minimum length before Confirm enables — mirrors the server's rule so
     *  the admin isn't bounced by a 422 after submitting. */
    minLength?: number;
    hint?: string;
  };
  loading?: boolean;
  error?: string | null;
  onConfirm: (value: string) => void;
  onCancel: () => void;
}

/**
 * Single dialog used by every privileged admin action.
 *
 * These operations are irreversible or security-sensitive, so none of them
 * fire straight from a button click — each one routes through here so the
 * admin sees exactly who is affected and, for deletions, has to type a
 * reason that ends up in the audit log.
 */
export function ActionDialog({
  open, title, description, danger, confirmLabel, input,
  loading, error, onConfirm, onCancel,
}: ActionDialogProps) {
  const [value, setValue] = useState("");

  // Clear on open so a previous password or reason can't leak into the next
  // dialog — easy to miss, and unpleasant if it happens with a password.
  useEffect(() => { if (open) setValue(""); }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onCancel(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onCancel]);

  if (!open) return null;

  const min = input?.minLength ?? 1;
  const canConfirm = !input || value.trim().length >= min;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" onClick={onCancel} />
      <div className="relative w-full max-w-md rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-surface-elevated)] p-6 shadow-2xl">
        <h3 className="text-lg font-bold text-[color:var(--color-text-primary)]">{title}</h3>

        {description && (
          <div className="mt-2 text-sm leading-relaxed text-[color:var(--color-text-secondary)]">
            {description}
          </div>
        )}

        {input && (
          <div className="mt-4">
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[color:var(--color-text-secondary)]">
              {input.label}
            </label>
            <input
              autoFocus
              type={input.type ?? "text"}
              value={value}
              placeholder={input.placeholder}
              onChange={(e) => setValue(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && canConfirm && !loading) onConfirm(value.trim()); }}
              className="w-full rounded-lg border border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-3 py-2 text-sm text-[color:var(--color-text-primary)] outline-none focus:border-[color:var(--color-primary)]"
            />
            {input.hint && (
              <p className="mt-1 text-xs text-[color:var(--color-text-tertiary)]">{input.hint}</p>
            )}
          </div>
        )}

        {error && (
          <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-[color:var(--color-danger)]">
            {error}
          </p>
        )}

        <div className="mt-6 flex justify-end gap-2">
          <Button variant="secondary" onClick={onCancel} disabled={loading}>Cancel</Button>
          <Button
            variant={danger ? "danger" : "primary"}
            onClick={() => onConfirm(value.trim())}
            disabled={!canConfirm}
            loading={loading}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
