'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { apiFetch } from '@/lib/api/client';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/input';
import { EmptyState } from '@/components/ui/empty-state';
import {
  History,
  Search,
  ArrowLeft,
  CheckCircle,
  XCircle,
  Clock,
  Mail,
  Smartphone,
  MessageSquare,
  Send,
  Loader2,
  AlertCircle,
  RefreshCcw,
  type LucideIcon,
} from 'lucide-react';

const STATUS_OPTIONS = [
  { value: '', label: 'All statuses' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'SENT', label: 'Sent' },
  { value: 'DELIVERED', label: 'Delivered' },
  { value: 'FAILED', label: 'Failed' },
  { value: 'BOUNCED', label: 'Bounced' },
];

export default function DeliveryLogsPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [status, setStatus] = useState('');
  const [retryingId, setRetryingId] = useState('');
  const [notice, setNotice] = useState('');

  useEffect(() => {
    const timeout = setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => clearTimeout(timeout);
  }, [search]);

  const loadLogs = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({ limit: '100' });
      if (status) params.set('status', status);
      if (debouncedSearch) params.set('search', debouncedSearch);
      const data = await apiFetch(`/communications/delivery-logs?${params.toString()}`);
      setLogs(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setLogs([]);
      setError(err?.message || 'Could not load delivery logs.');
    } finally {
      setLoading(false);
    }
  }, [status, debouncedSearch]);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  async function retry(logId: string) {
    if (retryingId) return;
    setRetryingId(logId);
    setError('');
    setNotice('');
    try {
      await apiFetch(`/communications/delivery-logs/${logId}/retry`, { method: 'POST' });
      setNotice('Delivery re-queued. The provider will retry this message.');
      await loadLogs();
    } catch (err: any) {
      setError(err?.message || 'Could not retry this delivery.');
    } finally {
      setRetryingId('');
    }
  }

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      <div className="flex items-center gap-4">
        <Link
          href="/communications"
          aria-label="Back to communications"
          className="rounded-2xl p-2 text-warm-400 transition-colors hover:bg-warm-100"
        >
          <ArrowLeft size={24} />
        </Link>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-charcoal-900 sm:text-3xl">
            Delivery <span className="text-forest-700">logs</span>
          </h1>
          <p className="text-sm font-medium text-warm-500">
            Trace of every message sent through the platform.
          </p>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-warm-100 bg-card shadow-sm">
        <div className="flex flex-col gap-3 border-b border-warm-100 bg-ivory-50/50 p-4 sm:p-6 lg:flex-row lg:items-end">
          <div className="flex flex-1 items-center rounded-xl border border-warm-200 bg-card px-4 py-2.5">
            <Search size={16} className="mr-3 shrink-0 text-warm-400" />
            <input
              type="search"
              aria-label="Filter delivery logs by recipient or subject"
              placeholder="Filter by recipient, email or subject…"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="w-full border-none bg-transparent text-sm font-bold text-charcoal-900 placeholder:text-warm-400 focus:outline-none"
            />
          </div>
          <div className="w-full lg:w-56">
            <Select
              label="Status"
              value={status}
              onChange={(event) => setStatus(event.target.value)}
              options={STATUS_OPTIONS}
            />
          </div>
        </div>

        {notice && (
          <p role="status" className="border-b border-success-100 bg-success-50 p-3 text-xs font-semibold text-success-700">
            {notice}
          </p>
        )}
        {error && (
          <div
            role="alert"
            className="flex flex-col gap-3 border-b border-danger-100 bg-danger-50 p-4 text-xs font-semibold text-danger-700 sm:flex-row sm:items-center sm:justify-between"
          >
            <span className="flex items-center gap-2">
              <AlertCircle size={16} /> {error}
            </span>
            <Button variant="outline" size="sm" onClick={loadLogs}>
              Try again
            </Button>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center gap-3 py-24 text-sm font-medium text-warm-500">
            <Loader2 className="h-5 w-5 animate-spin text-forest-700" /> Loading delivery data…
          </div>
        ) : logs.length === 0 ? (
          <div className="p-6 sm:p-10">
            <EmptyState
              icon={<History className="h-8 w-8" />}
              title={status || debouncedSearch ? 'No deliveries match your filters' : 'No delivery records yet'}
              description={
                status || debouncedSearch
                  ? 'Clear the filters to see all delivery attempts.'
                  : 'Delivery attempts appear here once a message is sent.'
              }
              actionButton={
                status || debouncedSearch ? (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setStatus('');
                      setSearch('');
                    }}
                  >
                    Clear filters
                  </Button>
                ) : undefined
              }
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-warm-100 bg-ivory-50/30 text-[11px] font-semibold uppercase tracking-wide text-warm-400">
                  <th className="px-5 py-4">Status</th>
                  <th className="px-5 py-4">Channel</th>
                  <th className="px-5 py-4">Message</th>
                  <th className="px-5 py-4">Recipient</th>
                  <th className="px-5 py-4">Time</th>
                  <th className="px-5 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ivory-50">
                {logs.map((log) => {
                  const recipient = log.notification?.user;
                  const recipientName = recipient
                    ? `${recipient.firstName ?? ''} ${recipient.lastName ?? ''}`.trim() ||
                      recipient.email ||
                      log.notification?.userId
                    : log.notification?.userId;
                  return (
                    <tr key={log.id} className="transition-colors hover:bg-ivory-50/50">
                      <td className="px-5 py-5">
                        <StatusCell status={log.status} />
                      </td>
                      <td className="px-5 py-5">
                        <ChannelIcon channel={log.channel} />
                      </td>
                      <td className="max-w-[240px] px-5 py-5">
                        <p className="truncate text-sm font-semibold text-charcoal-900">
                          {log.notification?.title ?? 'Notification'}
                        </p>
                        {log.errorMessage && (
                          <p className="truncate text-[11px] font-medium text-danger-600">{log.errorMessage}</p>
                        )}
                      </td>
                      <td className="px-5 py-5">
                        <p className="text-xs font-bold text-warm-600">{recipientName}</p>
                        {recipient?.email && (
                          <p className="text-[11px] font-medium text-warm-400">{recipient.email}</p>
                        )}
                      </td>
                      <td className="whitespace-nowrap px-5 py-5 text-xs font-bold text-warm-400">
                        {log.createdAt ? new Date(log.createdAt).toLocaleString() : '—'}
                      </td>
                      <td className="px-5 py-5 text-right">
                        {['FAILED', 'BOUNCED'].includes(String(log.status)) ? (
                          <Button
                            variant="outline"
                            size="sm"
                            isLoading={retryingId === log.id}
                            disabled={Boolean(retryingId)}
                            onClick={() => retry(log.id)}
                            leftIcon={<RefreshCcw size={13} />}
                          >
                            Retry
                          </Button>
                        ) : (
                          <span className="font-mono text-[11px] text-warm-400">
                            {log.providerRef || '—'}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function StatusCell({ status }: { status: string }) {
  if (status === 'DELIVERED') {
    return (
      <span className="flex items-center gap-2 text-[11px] font-semibold uppercase text-forest-600">
        <CheckCircle size={14} /> Delivered
      </span>
    );
  }
  if (status === 'FAILED' || status === 'BOUNCED') {
    return (
      <span className="flex items-center gap-2 text-[11px] font-semibold uppercase text-danger-600">
        <XCircle size={14} /> {String(status).toLowerCase()}
      </span>
    );
  }
  return (
    <span className="flex items-center gap-2 text-[11px] font-semibold uppercase text-warning-600">
      <Clock size={14} /> {String(status ?? 'pending').toLowerCase()}
    </span>
  );
}

function ChannelIcon({ channel }: { channel: string }) {
  const icons: Record<string, LucideIcon> = {
    IN_APP: MessageSquare,
    EMAIL: Mail,
    SMS: Smartphone,
    WEBSOCKET: Send,
  };
  const Icon = icons[channel] || History;
  return (
    <div className="flex items-center gap-2 text-xs font-bold text-warm-600">
      <Icon size={16} className="text-warm-400" />
      <span className="text-[11px] uppercase tracking-wide">{channel}</span>
    </div>
  );
}
