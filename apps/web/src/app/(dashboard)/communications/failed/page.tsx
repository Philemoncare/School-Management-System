'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { apiFetch } from '@/lib/api/client';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { showFeedback } from '@/components/layout/global-feedback';
import {
  AlertCircle,
  RefreshCcw,
  ArrowLeft,
  XCircle,
  Clock,
  Loader2,
} from 'lucide-react';

export default function FailedDeliveriesPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [retryingId, setRetryingId] = useState('');

  const fetchFailed = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await apiFetch('/communications/delivery-logs?status=FAILED&limit=100');
      const list = Array.isArray(response) ? response : [];
      setLogs(list.filter((log: any) => log.status === 'FAILED'));
    } catch (err: any) {
      setLogs([]);
      setError(err?.message || 'Could not load failed deliveries.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFailed();
  }, [fetchFailed]);

  async function handleRetry(id: string) {
    if (retryingId) return;
    setRetryingId(id);
    setError('');
    try {
      await apiFetch(`/communications/delivery-logs/${id}/retry`, { method: 'POST' });
      showFeedback('SUCCESS', 'Retry queued for this delivery.');
      await fetchFailed();
    } catch (err: any) {
      const message = err?.message || 'Retry failed.';
      setError(message);
      showFeedback('ERROR', message);
    } finally {
      setRetryingId('');
    }
  }

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
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
              Failed <span className="text-danger-600">deliveries</span>
            </h1>
            <p className="text-sm font-medium text-warm-500">
              Messages that could not reach their destination.
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          onClick={fetchFailed}
          isLoading={loading}
          leftIcon={<RefreshCcw size={16} />}
        >
          Refresh
        </Button>
      </div>

      <div className="overflow-hidden rounded-xl border border-danger-100 bg-card shadow-sm">
        <div className="flex items-center justify-between gap-3 border-b border-danger-50 bg-danger-50/10 p-4 sm:p-6">
          <div className="flex items-center gap-2 text-danger-600">
            {loading ? <Loader2 size={18} className="animate-spin" /> : <AlertCircle size={20} />}
            <span className="text-sm font-semibold uppercase tracking-wide">
              {logs.length} message{logs.length === 1 ? '' : 's'} require attention
            </span>
          </div>
        </div>

        {error && (
          <div
            role="alert"
            className="flex flex-col gap-3 border-b border-danger-100 bg-danger-50 p-4 text-xs font-semibold text-danger-700 sm:flex-row sm:items-center sm:justify-between"
          >
            <span className="flex items-center gap-2">
              <AlertCircle size={16} /> {error}
            </span>
            <Button variant="outline" size="sm" onClick={fetchFailed}>
              Try again
            </Button>
          </div>
        )}

        <div className="divide-y divide-ivory-50">
          {loading ? (
            <div className="flex items-center justify-center gap-3 p-16 text-sm font-medium text-warm-500">
              <Loader2 className="h-5 w-5 animate-spin text-forest-700" /> Scanning failure logs…
            </div>
          ) : logs.length === 0 ? (
            <div className="p-6 sm:p-10">
              <EmptyState
                icon={<XCircle className="h-8 w-8" />}
                title="No active failures"
                description="Every recent message was accepted by its delivery provider."
                actionButton={
                  <Link
                    href="/communications/delivery"
                    className="inline-flex items-center gap-2 rounded-xl bg-forest-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-forest-800"
                  >
                    View delivery logs
                  </Link>
                }
              />
            </div>
          ) : (
            logs.map((log) => {
              const recipient = log.notification?.user;
              const recipientLabel = recipient
                ? `${recipient.firstName ?? ''} ${recipient.lastName ?? ''}`.trim() ||
                  recipient.email ||
                  log.notification?.userId
                : log.notification?.userId;
              return (
                <div
                  key={log.id}
                  className="flex flex-col gap-4 p-5 transition-all hover:bg-danger-50/5 sm:flex-row sm:items-center sm:justify-between sm:p-6"
                >
                  <div className="flex items-start gap-5">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-danger-50 text-danger-500">
                      <XCircle size={22} />
                    </div>
                    <div className="min-w-0">
                      <div className="mb-1 flex flex-wrap items-center gap-3">
                        <h3 className="text-base font-semibold text-charcoal-900">
                          {log.notification?.title ?? 'Notification'}
                        </h3>
                        <span className="rounded bg-warm-100 px-2 py-0.5 text-[10px] font-semibold uppercase text-warm-500">
                          {log.channel}
                        </span>
                      </div>
                      <p className="mb-2 flex items-center gap-1 text-xs font-bold text-danger-600">
                        <AlertCircle size={12} /> {log.errorMessage || 'Provider rejected message'}
                      </p>
                      <div className="flex flex-wrap items-center gap-4 text-[11px] font-bold uppercase text-warm-400">
                        <span className="flex items-center gap-1">
                          <Clock size={12} />{' '}
                          {log.createdAt ? new Date(log.createdAt).toLocaleString() : '—'}
                        </span>
                        <span>Recipient: {recipientLabel}</span>
                        <span>Attempts: {log.attemptCount ?? 0}</span>
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    isLoading={retryingId === log.id}
                    disabled={Boolean(retryingId)}
                    onClick={() => handleRetry(log.id)}
                    leftIcon={<RefreshCcw size={14} />}
                    className="shrink-0 self-start sm:self-auto"
                  >
                    Retry
                  </Button>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
