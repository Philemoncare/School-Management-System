'use client';

import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { apiFetch } from '@/lib/api/client';
import { Button } from '@/components/ui/button';
import { Input, Select } from '@/components/ui/input';
import { EmptyState } from '@/components/ui/empty-state';
import { showFeedback } from '@/components/layout/global-feedback';
import {
  AlertCircle,
  AlertTriangle,
  Bell,
  Check,
  CheckCheck,
  Info,
  Loader2,
  RefreshCw,
  Search,
} from 'lucide-react';

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

const TYPE_STYLES: Record<string, { badge: string; icon: ReactNode }> = {
  INFO: {
    badge: 'bg-sage-100 text-forest-800',
    icon: <Info size={16} />,
  },
  SUCCESS: {
    badge: 'bg-success-100 text-success-800',
    icon: <Check size={16} />,
  },
  WARNING: {
    badge: 'bg-warning-100 text-warning-800',
    icon: <AlertTriangle size={16} />,
  },
  ERROR: {
    badge: 'bg-danger-100 text-danger-700',
    icon: <AlertCircle size={16} />,
  },
};

export default function NotificationsPage() {
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'ALL' | 'UNREAD'>('ALL');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [markingAll, setMarkingAll] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await apiFetch('/notifications?limit=100');
      const list: NotificationItem[] = Array.isArray(data) ? data : data?.items ?? [];
      setItems(list);
      setUnreadCount(
        typeof data?.unreadCount === 'number'
          ? data.unreadCount
          : list.filter((item) => !item.read && !item.readAt).length,
      );
    } catch (err: any) {
      setItems([]);
      setError(err?.message || 'Could not load notifications.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function markAsRead(item: NotificationItem) {
    if (busyId) return;
    setBusyId(item.id);
    try {
      await apiFetch(`/notifications/${item.id}/read`, { method: 'PATCH' });
      setItems((previous) =>
        previous.map((entry) =>
          entry.id === item.id
            ? { ...entry, read: true, readAt: new Date().toISOString() }
            : entry,
        ),
      );
      setUnreadCount((previous) => Math.max(0, previous - 1));
    } catch (err: any) {
      showFeedback('ERROR', err?.message || 'Could not mark the notification as read.');
    } finally {
      setBusyId(null);
    }
  }

  async function markAllAsRead() {
    if (markingAll || unreadCount === 0) return;
    setMarkingAll(true);
    try {
      const result = await apiFetch('/notifications/read-all', { method: 'PATCH' });
      setItems((previous) =>
        previous.map((entry) => ({
          ...entry,
          read: true,
          readAt: entry.readAt ?? new Date().toISOString(),
        })),
      );
      setUnreadCount(0);
      showFeedback(
        'SUCCESS',
        `Marked ${result?.updated ?? 0} notification${result?.updated === 1 ? '' : 's'} as read.`,
      );
    } catch (err: any) {
      showFeedback('ERROR', err?.message || 'Could not mark all notifications as read.');
    } finally {
      setMarkingAll(false);
    }
  }

  const visible = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return items.filter((item) => {
      const unread = !item.read && !item.readAt;
      if (filter === 'UNREAD' && !unread) return false;
      if (!needle) return true;
      return (
        item.title.toLowerCase().includes(needle) ||
        item.content.toLowerCase().includes(needle)
      );
    });
  }, [items, filter, search]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-charcoal-900 sm:text-3xl">
            Notifications
          </h1>
          <p className="mt-0.5 text-xs font-medium text-warm-500 sm:text-sm">
            System notices and school updates sent to your account.
            {unreadCount > 0 ? ` ${unreadCount} unread.` : ' You are all caught up.'}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={load}
            disabled={loading}
            leftIcon={<RefreshCw size={14} className={loading ? 'animate-spin' : undefined} />}
          >
            Refresh
          </Button>
          <Button
            size="sm"
            onClick={markAllAsRead}
            isLoading={markingAll}
            disabled={unreadCount === 0}
            leftIcon={<CheckCheck size={14} />}
          >
            Mark all read
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Input
          type="search"
          aria-label="Search notifications"
          placeholder="Search notifications…"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          leftIcon={<Search size={16} />}
        />
        <Select
          aria-label="Filter notifications"
          value={filter}
          options={[
            { value: 'ALL', label: 'All notifications' },
            { value: 'UNREAD', label: 'Unread only' },
          ]}
          onChange={(event) => setFilter(event.target.value as 'ALL' | 'UNREAD')}
        />
      </div>

      {error && (
        <div
          role="alert"
          className="flex flex-col gap-3 rounded-xl border border-danger-200 bg-danger-50 p-4 text-sm font-semibold text-danger-700 sm:flex-row sm:items-center sm:justify-between"
        >
          <span>{error}</span>
          <Button variant="outline" size="sm" onClick={load}>
            Try again
          </Button>
        </div>
      )}

      {loading && items.length === 0 ? (
        <div className="flex items-center justify-center gap-2 py-16 text-sm font-medium text-warm-500">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading notifications…
        </div>
      ) : visible.length === 0 && !error ? (
        <EmptyState
          icon={<Bell className="h-8 w-8" />}
          title={search || filter === 'UNREAD' ? 'No matching notifications' : 'No notifications yet'}
          description={
            search || filter === 'UNREAD'
              ? 'Change the search or filter to see other notifications.'
              : 'Notices about enrollment, results, finance and school updates will appear here.'
          }
        />
      ) : (
        <ul className="space-y-3">
          {visible.map((item) => {
            const unread = !item.read && !item.readAt;
            const type = item.type ?? item.notificationType ?? 'INFO';
            const style = TYPE_STYLES[type] ?? TYPE_STYLES.INFO;
            return (
              <li
                key={item.id}
                className={`flex flex-col gap-3 rounded-xl border p-4 shadow-xs transition-colors sm:flex-row sm:items-start ${
                  unread ? 'border-sage-200 bg-sage-50/40' : 'border-warm-200 bg-card'
                }`}
              >
                <span className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${style.badge}`}>
                  {style.icon}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <p className="text-sm font-bold text-charcoal-900">{item.title}</p>
                    <time
                      dateTime={item.createdAt}
                      className="text-[11px] font-medium text-warm-400"
                    >
                      {new Date(item.createdAt).toLocaleString()}
                    </time>
                  </div>
                  <p className="mt-1 whitespace-pre-line text-xs leading-relaxed text-warm-600">
                    {item.content}
                  </p>
                  <div className="mt-3 flex items-center gap-3">
                    {unread ? (
                      <Button
                        variant="outline"
                        size="xs"
                        onClick={() => markAsRead(item)}
                        isLoading={busyId === item.id}
                        leftIcon={<Check size={12} />}
                      >
                        Mark as read
                      </Button>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wide text-warm-400">
                        <CheckCheck size={12} /> Read
                      </span>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
