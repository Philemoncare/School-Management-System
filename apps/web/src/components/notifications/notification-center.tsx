"use client";

import React, { useState, useEffect } from "react";
import { Bell, Check, X, Info, AlertTriangle, AlertCircle } from "lucide-react";
import { useRealtime, useRealtimeEvent } from "@/hooks/use-realtime";
import { apiFetch } from "@/lib/api/client";

export function NotificationCenter() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const { socket } = useRealtime();

  useEffect(() => {
    fetchNotifications();
  }, []);

  useRealtimeEvent(socket, "notification.created", (newNotification) => {
    setNotifications((prev) => [newNotification, ...prev]);
    setUnreadCount((prev) => prev + 1);
  });

  async function fetchNotifications() {
    try {
      const data = await apiFetch("/notifications");
      setNotifications(data.items);
      setUnreadCount(data.unreadCount);
    } catch (err) {
      console.error("Failed to fetch notifications", err);
    }
  }

  async function markAsRead(id: string) {
    try {
      await apiFetch(`/notifications/${id}/read`, { method: "POST" });
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error("Failed to mark notification as read", err);
    }
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 text-warm-500 hover:bg-warm-100 rounded-lg relative transition-colors"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 min-w-[16px] h-4 px-1 flex items-center justify-center bg-danger-600 text-white text-[11px] font-bold rounded-full border-2 border-ivory-50">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute top-full right-0 mt-2 w-80 sm:w-96 bg-card border border-warm-200 rounded-xl shadow-xs z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="px-4 py-3 bg-ivory-50/50 border-b border-warm-100 flex items-center justify-between">
              <p className="text-sm font-bold text-charcoal-900">Notifications</p>
              <button
                className="text-[11px] font-bold text-forest-700 hover:text-forest-800 uppercase tracking-wide"
                onClick={() => {
                  /* Mark all read API */
                }}
              >
                Mark all as read
              </button>
            </div>

            <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
              {notifications.length === 0 ? (
                <div className="py-12 flex flex-col items-center justify-center text-warm-400">
                  <Bell size={32} className="mb-2 opacity-20" />
                  <p className="text-sm font-medium">No notifications yet</p>
                </div>
              ) : (
                notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`px-4 py-3 border-b border-ivory-50 hover:bg-ivory-50 transition-colors relative group ${
                      !notification.read ? "bg-sage-50/30" : ""
                    }`}
                  >
                    <div className="flex gap-3">
                      <div className="shrink-0 mt-1">
                        <NotificationIcon type={notification.type} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm font-bold text-charcoal-900 leading-tight">
                            {notification.title}
                          </p>
                          <span className="text-[11px] text-warm-400 font-medium shrink-0">
                            {new Date(notification.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-xs text-warm-600 mt-1 line-clamp-2">
                          {notification.content}
                        </p>
                      </div>
                    </div>
                    {!notification.read && (
                      <button
                        onClick={() => markAsRead(notification.id)}
                        className="absolute top-3 right-3 p-1 bg-card shadow-sm border border-warm-100 rounded opacity-0 group-hover:opacity-100 transition-opacity hover:text-forest-700"
                        title="Mark as read"
                      >
                        <Check size={12} />
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>

            <div className="border-t border-warm-100 p-2 bg-ivory-50/30">
              <button
                className="w-full py-2 text-xs font-bold text-warm-500 hover:text-charcoal-900 transition-colors"
                onClick={() => setIsOpen(false)}
              >
                View all notifications
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function NotificationIcon({ type }: { type: string }) {
  switch (type) {
    case "INFO":
      return <div className="p-1.5 bg-sage-100 text-forest-700 rounded-lg"><Info size={14} /></div>;
    case "SUCCESS":
      return <div className="p-1.5 bg-success-100 text-success-600 rounded-lg"><Check size={14} /></div>;
    case "WARNING":
      return <div className="p-1.5 bg-warning-100 text-warning-600 rounded-lg"><AlertTriangle size={14} /></div>;
    case "ERROR":
      return <div className="p-1.5 bg-danger-100 text-danger-600 rounded-lg"><AlertCircle size={14} /></div>;
    default:
      return <div className="p-1.5 bg-warm-100 text-warm-600 rounded-lg"><Bell size={14} /></div>;
  }
}
