import { Link } from "react-router-dom";
import { Check, Laptop, Moon, Sun } from "lucide-react";

import { ACCENT_LABELS, ACCENT_ORDER, ACCENT_SWATCH, useAdminTheme, type AccentKey, type ThemeMode } from "../lib/theme-context";

const MODE_OPTIONS: { key: ThemeMode; label: string; icon: typeof Sun }[] = [
  { key: "system", label: "Follow System", icon: Laptop },
  { key: "light", label: "Light", icon: Sun },
  { key: "dark", label: "Dark", icon: Moon },
];

export function SettingsPage() {
  const { mode, setMode, accent, setAccent, glassEffect, setGlassEffect } = useAdminTheme();

  return (
    <div className="mx-auto max-w-2xl px-6 py-10">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[color:var(--color-text-primary)]">Settings</h1>
          <p className="text-sm text-[color:var(--color-text-secondary)]">Appearance preferences for this browser</p>
        </div>
        <Link to="/" className="text-sm font-medium text-[color:var(--color-primary)] hover:underline">
          ← Back to Dashboard
        </Link>
      </div>

      <section className="mb-8">
        <h2 className="mb-3 text-xs font-bold uppercase tracking-wide text-[color:var(--color-text-secondary)]">
          Appearance
        </h2>
        <div className="flex gap-2 rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-2">
          {MODE_OPTIONS.map(({ key, label, icon: Icon }) => {
            const active = mode === key;
            return (
              <button
                key={key}
                onClick={() => setMode(key)}
                className={`flex flex-1 flex-col items-center gap-1.5 rounded-xl border py-3 text-xs font-semibold transition-colors ${
                  active
                    ? "border-[color:var(--color-primary)] bg-[color:var(--color-primary-tint)] text-[color:var(--color-primary)]"
                    : "border-transparent text-[color:var(--color-text-secondary)] hover:bg-[color:var(--color-surface-sunken)]"
                }`}
              >
                <Icon size={18} />
                {label}
              </button>
            );
          })}
        </div>
      </section>

      <section className="mb-8">
        <h2 className="mb-3 text-xs font-bold uppercase tracking-wide text-[color:var(--color-text-secondary)]">
          Theme Color
        </h2>
        <div className="flex flex-wrap gap-4 rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-5">
          {ACCENT_ORDER.map((key: AccentKey) => {
            const active = accent === key;
            return (
              <button key={key} onClick={() => setAccent(key)} className="flex flex-col items-center gap-1.5">
                <div
                  className="flex h-11 w-11 items-center justify-center rounded-full border-2 transition-colors"
                  style={{ borderColor: active ? ACCENT_SWATCH[key] : "transparent" }}
                >
                  <div
                    className="flex h-9 w-9 items-center justify-center rounded-full"
                    style={{ backgroundColor: ACCENT_SWATCH[key] }}
                  >
                    {active && <Check size={16} className="text-white" />}
                  </div>
                </div>
                <span className="text-[11px] font-medium text-[color:var(--color-text-secondary)]">
                  {ACCENT_LABELS[key]}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-xs font-bold uppercase tracking-wide text-[color:var(--color-text-secondary)]">
          Effects
        </h2>
        <div className="flex items-center justify-between rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-5 py-4">
          <div>
            <p className="text-sm font-semibold text-[color:var(--color-text-primary)]">Glass Effect</p>
            <p className="text-xs text-[color:var(--color-text-secondary)]">Frosted, translucent surfaces</p>
          </div>
          <button
            onClick={() => setGlassEffect(!glassEffect)}
            className="relative h-6 w-11 rounded-full transition-colors"
            style={{ backgroundColor: glassEffect ? "var(--color-primary)" : "var(--color-border-strong)" }}
          >
            <span
              className="absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform"
              style={{ transform: glassEffect ? "translateX(22px)" : "translateX(2px)" }}
            />
          </button>
        </div>
      </section>
    </div>
  );
}
