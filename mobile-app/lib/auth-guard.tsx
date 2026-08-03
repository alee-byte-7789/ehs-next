import { router, usePathname } from "expo-router";
import { useEffect, type ReactNode } from "react";

import { useAuth } from "./auth-context";

/**
 * Routes reachable without being signed in. Everything else is
 * protected — this is a deliberate allowlist, not a denylist, so a new
 * screen added later is protected by default unless explicitly opted
 * out here, rather than accidentally exposed by default.
 */
const PUBLIC_ROUTES = ["/", "/login", "/register", "/pending", "/appearance-onboarding", "/admin-login"];

/**
 * THE actual fix for "users can access protected pages without logging
 * in." The previous state of this app only ever checked auth status
 * once, on the splash screen (`/`) — Expo Router happily renders any
 * other route directly (typed URL, refresh, restored history, deep
 * link) without ever passing through that check. This component runs
 * on every single navigation instead, via `usePathname()`, so there's
 * no path that skips it.
 */
export function AuthGuard({ children }: { children: ReactNode }) {
  const { status } = useAuth();
  const pathname = usePathname();

  useEffect(() => {
    if (status === "checking") return; // still resolving the stored token — don't redirect yet

    const isPublic = PUBLIC_ROUTES.includes(pathname);

    if (status === "signed-out" && !isPublic) {
      router.replace("/login");
    }
  }, [status, pathname]);

  return <>{children}</>;
}
