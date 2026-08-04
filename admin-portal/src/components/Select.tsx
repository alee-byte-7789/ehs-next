import { Check, ChevronDown } from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface SelectOption<T extends string> {
  value: T;
  label: string;
}

interface SelectProps<T extends string> {
  value: T;
  onChange: (value: T) => void;
  options: SelectOption<T>[];
  className?: string;
}

/**
 * Fully custom dropdown — no native <select>/<option> involved. The
 * browser's native select popup is largely outside CSS's control (a
 * well-documented cross-browser limitation), which is exactly why a
 * page styled for dark mode can still show a jarring, washed-out,
 * light-background popup with low-contrast unselected options. This
 * component is just styled divs, so it looks identical (and correct)
 * in both light and dark mode, matching the rest of the design system.
 */
export function Select<T extends string>({ value, onChange, options, className = "" }: SelectProps<T>) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const selected = options.find((opt) => opt.value === value);

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between rounded-lg border border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-3 py-2 text-left text-sm text-[color:var(--color-text-primary)] outline-none focus:border-[color:var(--color-primary)]"
      >
        <span>{selected?.label ?? "Select…"}</span>
        <ChevronDown size={16} className="text-[color:var(--color-text-tertiary)]" />
      </button>

      {open && (
        <div className="absolute z-20 mt-1 w-full overflow-hidden rounded-lg border border-[color:var(--color-border)] bg-[color:var(--color-surface-elevated)] shadow-lg">
          {options.map((opt) => {
            const isSelected = opt.value === value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  onChange(opt.value);
                  setOpen(false);
                }}
                className={`flex w-full items-center justify-between px-3 py-2 text-left text-sm transition-colors ${
                  isSelected
                    ? "bg-[color:var(--color-primary-tint)] text-[color:var(--color-primary)]"
                    : "text-[color:var(--color-text-primary)] hover:bg-[color:var(--color-surface-sunken)]"
                }`}
              >
                {opt.label}
                {isSelected && <Check size={15} />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
