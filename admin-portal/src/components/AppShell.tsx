import {
  History,
  LayoutGrid,
  LogOut,
  Menu,
  MessageSquareWarning,
  Moon,
  Search,
  Settings,
  ShieldCheck,
  Sun,
  Users,
  X,
} from "lucide-react";
import { type ReactNode, useState } from "react";
import { Link, useLocation } from "react-router-dom";

import { useAuth } from "../lib/auth-context";
import { useAdminMe } from "../lib/registration-queries";
import { useAdminTheme } from "../lib/theme-context";
import { NotificationBell } from "./NotificationBell";

interface NavItem {
  to: string;
  label: string;
  icon: typeof LayoutGrid;
  superAdminOnly?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { to: "/", label: "Dashboard", icon: LayoutGrid },
  { to: "/complaints", label: "Complaints", icon: MessageSquareWarning },
  { to: "/staff", label: "Staff", icon: Users },
  { to: "/admins", label: "Manage Admins", icon: ShieldCheck, superAdminOnly: true },
  { to: "/audit-logs", label: "Audit Logs", icon: History, superAdminOnly: true },
];

export function AppShell({ children }: { children: ReactNode }) {
  const { data: admin } = useAdminMe(true);
  const { isDark, mode, setMode } = useAdminTheme();
  const location = useLocation();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const visibleNav = NAV_ITEMS.filter((item) => !item.superAdminOnly || admin?.role === "super_admin");

  const toggleTheme = () => setMode(mode === "dark" ? "light" : mode === "light" ? "system" : "dark");

  return (
    <div className="flex min-h-screen bg-[color:var(--color-background)]">
      {/* --- Desktop permanent sidebar (lg and up) --- */}
      <aside className="hidden w-64 shrink-0 border-r border-[color:var(--color-border)] bg-[color:var(--color-surface-elevated)] lg:flex lg:flex-col">
        <SidebarContent visibleNav={visibleNav} currentPath={location.pathname} />
      </aside>

      {/* --- Mobile drawer (below lg) --- */}
      {drawerOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setDrawerOpen(false)} />
          <aside className="absolute left-0 top-0 h-full w-72 bg-[color:var(--color-surface-elevated)] shadow-xl">
            <div className="flex items-center justify-between border-b border-[color:var(--color-border)] px-4 py-4">
              <span className="text-sm font-bold text-[color:var(--color-text-primary)]">Menu</span>
              <button onClick={() => setDrawerOpen(false)} className="rounded-lg p-1.5 hover:bg-[color:var(--color-surface-sunken)]">
                <X size={18} className="text-[color:var(--color-text-secondary)]" />
              </button>
            </div>
            <SidebarContent visibleNav={visibleNav} currentPath={location.pathname} onNavigate={() => setDrawerOpen(false)} />
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        {/* --- Top bar --- */}
        <header className="flex items-center gap-3 border-b border-[color:var(--color-border)] bg-[color:var(--color-surface-elevated)] px-4 py-3 sm:px-6">
          <button
            onClick={() => setDrawerOpen(true)}
            className="rounded-lg p-2 hover:bg-[color:var(--color-surface-sunken)] lg:hidden"
            aria-label="Open menu"
          >
            <Menu size={20} className="text-[color:var(--color-text-primary)]" />
          </button>

          <div className="hidden flex-1 items-center gap-2 rounded-full border border-[color:var(--color-border)] bg-[color:var(--color-surface-sunken)] px-4 py-2 sm:flex sm:max-w-sm">
            <Search size={16} className="text-[color:var(--color-text-tertiary)]" />
            <input
              placeholder="Search complaints, residents…"
              className="w-full bg-transparent text-sm text-[color:var(--color-text-primary)] placeholder:text-[color:var(--color-text-tertiary)] focus:outline-none"
            />
          </div>

          <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
            <button
              onClick={toggleTheme}
              className="rounded-lg p-2 hover:bg-[color:var(--color-surface-sunken)]"
              aria-label="Toggle theme"
              title={`Theme: ${mode}`}
            >
              {isDark ? <Moon size={18} className="text-[color:var(--color-text-secondary)]" /> : <Sun size={18} className="text-[color:var(--color-text-secondary)]" />}
            </button>
            <NotificationBell />
            <Link to="/settings" className="rounded-lg p-2 hover:bg-[color:var(--color-surface-sunken)]" aria-label="Settings">
              <Settings size={18} className="text-[color:var(--color-text-secondary)]" />
            </Link>
            <div
              className="flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold text-[color:var(--color-on-primary)]"
              style={{ backgroundColor: "var(--color-primary)" }}
              title={admin?.full_name}
            >
              {admin?.full_name?.[0]?.toUpperCase() ?? "A"}
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}

function SidebarContent({
  visibleNav,
  currentPath,
  onNavigate,
}: {
  visibleNav: NavItem[];
  currentPath: string;
  onNavigate?: () => void;
}) {
  const { logout } = useAuth();

  return (
    <>
      <div className="flex items-center gap-2.5 border-b border-[color:var(--color-border)] px-5 py-5">
        <img src="/logo-full.png" alt="EHS Next" className="h-8 w-auto" />
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4">
        {visibleNav.map((item) => {
          const active = currentPath === item.to;
          const Icon = item.icon;
          return (
            <Link
              key={item.to}
              to={item.to}
              onClick={onNavigate}
              className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors"
              style={
                active
                  ? { backgroundColor: "var(--color-primary-tint)", color: "var(--color-primary)" }
                  : { color: "var(--color-text-secondary)" }
              }
            >
              <Icon size={18} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-[color:var(--color-border)] p-3">
        <button
          onClick={logout}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-[color:var(--color-danger)] transition-colors hover:bg-[color:var(--color-surface-sunken)]"
        >
          <LogOut size={18} />
          Log out
        </button>
      </div>
    </>
  );
}
