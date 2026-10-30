'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api/client';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { EmptyState } from '@/components/ui/empty-state';
import {
  Activity,
  Search,
  Loader2,
  Database,
  Info,
  AlertCircle,
} from 'lucide-react';

export default function EventsPage() {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedEvent, setSelectedEvent] = useState<any>(null);

  useEffect(() => {
    const timeout = setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => clearTimeout(timeout);
  }, [search]);

  const loadEvents = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({ limit: '100' });
      if (debouncedSearch) params.set('search', debouncedSearch);
      const data = await apiFetch(`/operations/events?${params.toString()}`);
      setEvents(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setEvents([]);
      setError(err?.message || 'Could not load domain events.');
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch]);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-charcoal-900 sm:text-3xl">
          System events
        </h1>
        <p className="mt-1 text-[11px] font-bold uppercase tracking-wide text-warm-500">
          Domain event audit trail for this school
        </p>
      </div>

      <div className="overflow-hidden rounded-xl border border-warm-200 bg-card shadow-sm">
        <div className="flex flex-col gap-3 border-b border-warm-100 bg-ivory-50/50 p-4 sm:p-6 lg:flex-row lg:items-end">
          <div className="flex flex-1 items-center rounded-2xl border border-warm-200 bg-card px-5 py-3 shadow-sm">
            <Search size={18} className="mr-3 shrink-0 text-warm-400" />
            <input
              type="search"
              aria-label="Search events"
              placeholder="Search by event type, resource or correlation ID…"
              className="w-full border-none bg-transparent text-sm font-bold text-charcoal-900 placeholder:text-warm-400 focus:ring-0"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
          <p className="text-[11px] font-bold uppercase tracking-wide text-warm-400 lg:pb-3">
            {events.length} event{events.length === 1 ? '' : 's'} shown
          </p>
        </div>

        {error && (
          <div
            role="alert"
            className="flex flex-col gap-3 border-b border-danger-100 bg-danger-50 p-4 text-xs font-semibold text-danger-700 sm:flex-row sm:items-center sm:justify-between"
          >
            <span className="flex items-center gap-2">
              <AlertCircle size={16} /> {error}
            </span>
            <Button variant="outline" size="sm" onClick={loadEvents}>
              Try again
            </Button>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center gap-3 py-24 text-sm font-medium text-warm-500">
            <Loader2 className="h-5 w-5 animate-spin text-forest-700" /> Loading events…
          </div>
        ) : events.length === 0 ? (
          <div className="p-6 sm:p-10">
            <EmptyState
              icon={<Database className="h-8 w-8" />}
              title={debouncedSearch ? 'No events match your search' : 'No domain events yet'}
              description={
                debouncedSearch
                  ? 'Try a different event type, resource ID or correlation ID.'
                  : 'Events appear here when a business action emits a domain event.'
              }
              actionButton={
                debouncedSearch ? (
                  <Button variant="outline" onClick={() => setSearch('')}>
                    Clear search
                  </Button>
                ) : undefined
              }
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-warm-200">
              <thead className="bg-ivory-50/50">
                <tr>
                  <th className="px-5 py-4 text-left text-[10px] font-semibold uppercase tracking-wide text-warm-400 sm:px-8">
                    Event type
                  </th>
                  <th className="px-5 py-4 text-left text-[10px] font-semibold uppercase tracking-wide text-warm-400 sm:px-8">
                    Resource
                  </th>
                  <th className="px-5 py-4 text-left text-[10px] font-semibold uppercase tracking-wide text-warm-400 sm:px-8">
                    Timestamp
                  </th>
                  <th className="px-5 py-4 text-right text-[10px] font-semibold uppercase tracking-wide text-warm-400 sm:px-8">
                    Details
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-warm-100 bg-card">
                {events.map((event) => (
                  <tr key={event.id} className="group transition-colors hover:bg-ivory-50/50">
                    <td className="px-5 py-5 sm:px-8">
                      <div className="flex items-center gap-3">
                        <div className="rounded-xl bg-sage-50 p-2 text-forest-700">
                          <Activity size={16} />
                        </div>
                        <p className="text-xs font-semibold text-charcoal-900">
                          {String(event.eventType).replace(/_/g, ' ')}
                        </p>
                      </div>
                    </td>
                    <td className="px-5 py-5 sm:px-8">
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-warm-400">
                        {event.resourceType}
                      </p>
                      <p className="max-w-[160px] truncate font-mono text-[11px] font-bold text-charcoal-900">
                        {event.resourceId}
                      </p>
                    </td>
                    <td className="whitespace-nowrap px-5 py-5 text-xs font-medium text-warm-500 sm:px-8">
                      {new Date(event.timestamp).toLocaleString()}
                    </td>
                    <td className="px-5 py-5 text-right sm:px-8">
                      <button
                        type="button"
                        onClick={() => setSelectedEvent(event)}
                        aria-label={`Open details for ${event.eventType}`}
                        className="rounded-xl p-2 text-warm-400 transition-all hover:bg-card hover:text-forest-700 hover:shadow-md"
                      >
                        <Info size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal
        isOpen={Boolean(selectedEvent)}
        onClose={() => setSelectedEvent(null)}
        title="Event details"
        size="lg"
      >
        {selectedEvent && (
          <div className="space-y-5 text-xs">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <DetailBlock label="Event type" value={selectedEvent.eventType} />
              <DetailBlock label="Version" value={String(selectedEvent.eventVersion ?? 1)} />
              <DetailBlock label="Resource type" value={selectedEvent.resourceType} />
              <DetailBlock label="Resource ID" value={selectedEvent.resourceId} mono />
              <DetailBlock
                label="Timestamp"
                value={new Date(selectedEvent.timestamp).toLocaleString()}
              />
              <DetailBlock label="Correlation ID" value={selectedEvent.correlationId || '—'} mono />
            </div>

            <JsonBlock label="Payload" value={selectedEvent.payload} />
            <JsonBlock label="Metadata" value={selectedEvent.metadata} />

            <div>
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-warm-400">
                Handlers
              </p>
              {Array.isArray(selectedEvent.processingRecords) &&
              selectedEvent.processingRecords.length > 0 ? (
                <div className="divide-y divide-warm-100 rounded-xl border border-warm-200">
                  {selectedEvent.processingRecords.map((record: any) => (
                    <div
                      key={record.id}
                      className="flex flex-col gap-1 p-3 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div>
                        <p className="font-semibold text-charcoal-900">{record.handlerName}</p>
                        {record.errorInfo && (
                          <p className="text-[11px] font-medium text-danger-600">{record.errorInfo}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        <span
                          className={`rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide ${
                            record.status === 'COMPLETED' || record.status === 'SUCCESS'
                              ? 'bg-success-50 text-success-700'
                              : record.status === 'FAILED'
                                ? 'bg-danger-50 text-danger-700'
                                : 'bg-warm-100 text-warm-600'
                          }`}
                        >
                          {String(record.status).replace(/_/g, ' ')}
                        </span>
                        <span className="text-[10px] font-bold uppercase tracking-wide text-warm-400">
                          {record.retryCount ?? 0} retr{(record.retryCount ?? 0) === 1 ? 'y' : 'ies'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="rounded-xl border border-warm-100 bg-ivory-50 p-3 text-[11px] font-semibold text-warm-500">
                  No handler has processed this event yet.
                </p>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

function DetailBlock({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="rounded-xl border border-warm-100 bg-ivory-50 p-3">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-warm-400">{label}</p>
      <p className={`mt-1 break-all font-semibold text-charcoal-900 ${mono ? 'font-mono' : ''}`}>
        {value}
      </p>
    </div>
  );
}

function JsonBlock({ label, value }: { label: string; value: any }) {
  return (
    <div>
      <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-warm-400">{label}</p>
      <pre className="max-h-56 overflow-auto rounded-xl border border-warm-100 bg-charcoal-900 p-4 font-mono text-[11px] leading-relaxed text-white">
        {value === null || value === undefined ? '—' : JSON.stringify(value, null, 2)}
      </pre>
    </div>
  );
}
