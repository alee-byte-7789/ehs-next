import type { HTMLAttributes, ReactNode } from "react";

interface GlassCardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

/**
 * Web equivalent of mobile-app's Card.tsx "elevated" glass variant —
 * same visual language (blurred accent-tinted pane, diagonal sheen,
 * two-tone rim), same toggle mechanism: automatically respects the
 * user's glass-effect preference via the [data-glass] attribute set by
 * ThemeProvider, no per-usage conditional needed.
 */
export function GlassCard({ children, className = "", ...rest }: GlassCardProps) {
  return (
    <div className={`glass-card p-5 ${className}`} {...rest}>
      <div className="relative z-10">{children}</div>
    </div>
  );
}
