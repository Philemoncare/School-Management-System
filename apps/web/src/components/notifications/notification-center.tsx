"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Bell, Check, Info, AlertTriangle, AlertCircle } from "lucide-react";
import { useRealtime, useRealtimeEvent } from "@/hooks/use-realtime";
import { apiFetch } from "@/lib/api/client";

interface NotificationItem {
  id: string;
  title: string;
  content: string;
  type?: string;
  notificationType?: string;
  read?: boolean;
  readAt?: string | null;
  createdAt: string;
}

export function NotificationCenter() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [markingAll, setMarkingAll] = useState(false);
  const { socket } = useRealtime();

  const fetchNotifications = useCallback(async () => {
    try {
      setError("");
      const data = await apiFetch("/notifications");
      const items: NotificationItem[] = Array.isArray(data) ? data : data?.items ?? [];
      setNotifications(items);
      setUnreadCount(
        typeof data?.unreadCount === "number"
          ? data.unreadCount
          : items.filter((item) => !item.read && !item.readAt).length,
      );
    } catch (err: any) {
      setError(err?.message || "Could not load notifications.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  useRealtimeEvent(socket, "notification.created", (newNotification: NotificationItem) => {
    setNotifications((prev) => [newNotification, ...prev]);
    setUnreadCount((prev) => prev + 1);
  });

  async function markAsRead(id: string) {
    try {
      await apiFetch(`/notifications/${id}/read`, { method: "PATCH" });
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === id ? { ...n, read: true, readAt: new Date().toISOString() } : n,
        ),
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err: any) {
      setError(err?.message || "Could not mark the notification as read.");
    }
  }

  async function markAllAsRead() {
    if (markingAll || unreadCount === 0) return;
    setMarkingAll(true);
    try {
      await apiFetch("/notifications/read-all", { method: "PATCH" });
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, read: true, readAt: n.readAt ?? new Date().toISOString() })),
      );
      setUnreadCount(0);
    } catch (err: any) {
      setError(err?.message || "Could not mark all notifications as read.");
    } finally {
      setMarkingAll(false);
    }
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ""}`}
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        className="relative rounded-lg p-2 text-warm-500 transition-colors hover:bg-warm-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest-600/40"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute right-1.5 top-1.5 flex h-4 min-w-[16px] items-center justify-center rounded-full border-2 border-ivory-50 bg-danger-600 px-1 text-[11px] font-bold text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} aria-hidden="true" />
          <div
            role="dialog"
            aria-label="Notifications"
            className="absolute right-0 top-full z-50 mt-2 w-80 max-w-[calc(100vw-24px)] overflow-hidden rounded-xl border border-warm-200 bg-card shadow-xs animate-in fade-in slide-in-from-top-2 duration-200 sm:w-96"
          >
            <div className="flex items-center justify-between border-b border-warm-100 bg-ivory-50/50 px-4 py-3">
              <p className="text-sm font-bold text-charcoal-900">Notifications</p>
              <button
                type="button"
                className="text-[11px] font-bold uppercase tracking-wide text-forest-700 hover:text-forest-800 disabled:opacity-50"
                onClick={markAllAsRead}
                disabled={markingAll || unreadCount === 0}
              >
                {markingAll ? "Marking…" : "Mark all as read"}
              </button>
            </div>

            {error && (
              <p role="alert" className="border-b border-danger-100 bg-danger-50 px-4 py-2 text-[11px] font-semibold text-danger-700">
                {error}
              </p>
            )}

            <div className="custom-scrollbar max-h-[400px] overflow-y-auto">
              {loading ? (
                <div className="py-12 text-center text-xs font-medium text-warm-500">
                  Loading notifications…
                </div>
              ) : notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-warm-400">
                  <Bell size={32} className="mb-2 opacity-20" />
                  <p className="text-sm font-medium">No notifications yet</p>
                </div>
              ) : (
                notifications.map((notification) => {
                  const unread = !notification.read && !notification.readAt;
                  return (
                    <div
                      key={notification.id}
                      className={`group relative border-b border-ivory-50 px-4 py-3 transition-colors hover:bg-ivory-50 ${
                        unread ? "bg-sage-50/30" : ""
                      }`}
                    >
                      <div className="flex gap-3">
                        <div className="mt-1 shrink-0">
                          <NotificationIcon
                            type={notification.type ?? notification.notificationType ?? "INFO"}
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-sm font-bold leading-tight text-charcoal-900">
                              {notification.title}
                            </p>
                            <span className="shrink-0 text-[11px] font-medium text-warm-400">
                              {new Date(notification.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="mt-1 line-clamp-2 text-xs text-warm-600">
                            {notification.content}
                          </p>
                        </div>
                      </div>
                      {unread && (
                        <button
                          type="button"
                          onClick={() => markAsRead(notification.id)}
                          className="absolute right-3 top-3 rounded border border-warm-100 bg-card p-1 opacity-0 shadow-sm transition-opacity hover:text-forest-700 focus-visible:opacity-100 group-hover:opacity-100"
                          title="Mark as read"
                          aria-label={`Mark ${notification.title} as read`}
                        >
                          <Check size={12} />
                        </button>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            <div className="border-t border-warm-100 bg-ivory-50/30 p-2">
              <Link
                href="/dashboard/notifications"
                onClick={() => setIsOpen(false)}
                className="block w-full rounded-lg py-2 text-center text-xs font-bold text-warm-500 transition-colors hover:text-charcoal-900"
              >
                View all notifications
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function NotificationIcon({ type }: { type: string }) {
  switch (type) {
    case "SUCCESS":
      return (
        <div className="rounded-lg bg-success-100 p-1.5 text-success-600">
          <Check size={14} />
        </div>
      );
    case "WARNING":
      return (
        <div className="rounded-lg bg-warning-100 p-1.5 text-warning-600">
          <AlertTriangle size={14} />
        </div>
      );
    case "ERROR":
      return (
        <div className="rounded-lg bg-danger-100 p-1.5 text-danger-600">
          <AlertCircle size={14} />
        </div>
      );
    case "INFO":
    default:
      return (
        <div className="rounded-lg bg-sage-100 p-1.5 text-forest-700">
          <Info size={14} />
        </div>
      );
  }
}
