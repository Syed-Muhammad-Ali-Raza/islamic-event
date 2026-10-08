"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Bell, Check, CheckCheck } from "lucide-react";
import { useUnreadCount, useNotifications, useMarkNotificationRead, useMarkAllNotificationsRead } from "@/hooks/useNotifications";
import { useAuthStore } from "@/stores/auth.store";

const TYPE_ICONS: Record<string, string> = {
  EVENT_APPROVED: "✅",
  EVENT_REJECTED: "❌",
  EVENT_CANCELLED: "⚠️",
  NEW_EVENT: "🆕",
  SYSTEM: "🔔",
};

function timeAgo(date: string): string {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(date).toLocaleDateString();
}

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const { isAuthenticated } = useAuthStore();
  const containerRef = useRef<HTMLDivElement>(null);

  const { data: unreadCount = 0 } = useUnreadCount();
  const { data: listData } = useNotifications(1, 12, open);
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();

  useEffect(() => {
    if (!open) return;
    const onClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [open]);

  if (!isAuthenticated) return null;

  const notifications = listData?.data ?? [];

  const handleOpenNotification = (id: string, link: string | null) => {
    if (!markRead.isPending) markRead.mutate(id);
    setOpen(false);
    if (link) {
      window.location.href = link;
    }
  };

  return (
    <div className="relative" ref={containerRef}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="btn-ghost p-2 relative"
        aria-label="Notifications"
        aria-haspopup="true"
        aria-expanded={open}
        id="notification-bell-button"
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-11 w-80 card-glass shadow-2xl animate-scale-in z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200">
            <p className="text-sm font-semibold text-slate-900">Notifications</p>
            {notifications.some((n) => !n.readAt) && (
              <button
                onClick={() => markAllRead.mutate()}
                className="flex items-center gap-1 text-xs text-brand-700 hover:text-brand-800 transition-colors"
                id="notifications-mark-all"
              >
                <CheckCheck size={13} /> Mark all read
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="px-4 py-10 text-center text-slate-500 text-sm">
                <Bell size={24} className="mx-auto mb-2 opacity-40" />
                No notifications yet
              </div>
            ) : (
              notifications.map((n) => (
                <button
                  key={n.id}
                  onClick={() => handleOpenNotification(n.id, n.link)}
                  className={`flex items-start gap-3 w-full px-4 py-3 text-left transition-colors hover:bg-slate-100 ${
                    n.readAt ? "opacity-60" : ""
                  }`}
                  id={`notification-${n.id}`}
                >
                  <span className="text-base leading-none mt-0.5">
                    {TYPE_ICONS[n.type] ?? "🔔"}
                  </span>
                  <span className="flex-1 min-w-0">
                    <span className={`block text-sm truncate ${n.readAt ? "text-slate-600" : "text-slate-900 font-medium"}`}>
                      {n.title}
                    </span>
                    {n.body && (
                      <span className="block text-xs text-slate-500 truncate">{n.body}</span>
                    )}
                    <span className="block text-[10px] text-slate-400 mt-0.5">{timeAgo(n.createdAt)}</span>
                  </span>
                  {!n.readAt && <span className="w-2 h-2 rounded-full bg-brand-400 shrink-0 mt-1.5" />}
                </button>
              ))
            )}
          </div>

          <div className="border-t border-slate-200 px-4 py-2.5 flex justify-center">
            <Link
              href="/profile"
              onClick={() => setOpen(false)}
              className="text-xs text-slate-500 hover:text-slate-900 transition-colors"
            >
              View profile
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
