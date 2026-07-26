import { Bell } from "lucide-react";
import { useState } from "react";

import { useAdminNotifications, useAdminUnreadCount, useMarkAdminNotificationRead } from "../lib/notification-queries";

function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const { data: unread } = useAdminUnreadCount();
  const { data: notifications } = useAdminNotifications();
  const markRead = useMarkAdminNotificationRead();

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative flex items-center justify-center rounded-full p-2 hover:bg-[color:var(--color-surface)]"
      >
        <Bell size={20} className="text-[color:var(--color-text-primary)]" />
        {!!unread?.count && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[color:var(--color-danger)] px-1 text-[10px] font-bold text-white">
            {unread.count > 9 ? "9+" : unread.count}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-20 mt-2 w-80 rounded-xl border border-[color:var(--color-border)] bg-white shadow-lg">
            <div className="border-b border-[color:var(--color-border)] px-4 py-3">
              <h3 className="text-sm font-semibold text-[color:var(--color-text-primary)]">Notifications</h3>
            </div>
            <div className="max-h-96 overflow-y-auto">
              {(!notifications || notifications.length === 0) && (
                <p className="px-4 py-6 text-center text-sm text-[color:var(--color-text-secondary)]">
                  No notifications yet.
                </p>
              )}
              {notifications?.map((n) => (
                <button
                  key={n.id}
                  onClick={() => !n.is_read && markRead.mutate(n.id)}
                  className={`block w-full border-b border-[color:var(--color-border)] px-4 py-3 text-left last:border-0 hover:bg-[color:var(--color-surface)] ${
                    n.is_read ? "" : "bg-[color:var(--color-primary-tint,#ECFDF5)]"
                  }`}
                >
                  <p className="text-sm font-semibold text-[color:var(--color-text-primary)]">{n.title}</p>
                  <p className="text-xs text-[color:var(--color-text-secondary)]">{n.body}</p>
                  <p className="mt-1 text-[10px] text-[color:var(--color-text-secondary)]">{timeAgo(n.created_at)}</p>
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
