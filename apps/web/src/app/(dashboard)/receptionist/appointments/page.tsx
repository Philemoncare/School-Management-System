'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { apiFetch } from '@/lib/api/client';
import { Button } from '@/components/ui/button';
import { Input, Select } from '@/components/ui/input';
import { EmptyState } from '@/components/ui/empty-state';
import { showFeedback } from '@/components/layout/global-feedback';
import {
  ArrowLeft,
  CalendarCheck,
  CalendarPlus,
  Check,
  Loader2,
  Plus,
  RefreshCw,
  Search,
  UserX,
  X,
} from 'lucide-react';

interface Appointment {
  id: string;
  visitorName: string;
  phone?: string | null;
  email?: string | null;
  hostName?: string | null;
  purpose?: string | null;
  scheduledAt: string;
  status: 'REQUESTED' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';
  location?: string | null;
  notes?: string | null;
}

type Tab = 'upcoming' | 'history' | 'all';

const STATUS_OPTIONS = [
  { value: 'REQUESTED', label: 'Requested' },
  { value: 'CONFIRMED', label: 'Confirmed' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'CANCELLED', label: 'Cancelled' },
  { value: 'NO_SHOW', label: 'No show' },
];

function statusTone(status: string) {
  switch (status) {
    case 'CONFIRMED':
      return 'bg-sage-100 text-forest-800';
    case 'COMPLETED':
      return 'bg-success-100 text-success-800';
    case 'CANCELLED':
    case 'NO_SHOW':
      return 'bg-warm-100 text-warm-600';
    default:
      return 'bg-warning-100 text-warning-800';
  }
}

function statusLabel(status: string) {
  return STATUS_OPTIONS.find((option) => option.value === status)?.label ?? status;
}

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tab, setTab] = useState<Tab>('upcoming');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await apiFetch('/front-office/appointments');
      setAppointments(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setAppointments([]);
      setError(err?.message || 'Could not load appointments.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const visible = useMemo(() => {
    const needle = search.trim().toLowerCase();
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    return appointments
      .filter((appointment) => {
        const scheduled = new Date(appointment.scheduledAt);
        const isUpcoming =
          scheduled >= startOfToday &&
          !['COMPLETED', 'CANCELLED', 'NO_SHOW'].includes(appointment.status);
        if (tab === 'upcoming' && !isUpcoming) return false;
        if (tab === 'history' && isUpcoming) return false;
        if (statusFilter !== 'ALL' && appointment.status !== statusFilter) return false;
        if (!needle) return true;
        return (
          appointment.visitorName.toLowerCase().includes(needle) ||
          (appointment.hostName ?? '').toLowerCase().includes(needle) ||
          (appointment.phone ?? '').toLowerCase().includes(needle) ||
          (appointment.purpose ?? '').toLowerCase().includes(needle)
        );
      })
      .sort((a, b) => {
        const first = new Date(a.scheduledAt).getTime();
        const second = new Date(b.scheduledAt).getTime();
        return tab === 'history' ? second - first : first - second;
      });
  }, [appointments, tab, statusFilter, search]);

  async function updateStatus(appointment: Appointment, status: Appointment['status']) {
    if (updatingId) return;
    if (
      status === 'CANCELLED' &&
      !window.confirm(`Cancel the appointment for ${appointment.visitorName}?`)
    ) {
      return;
    }
    setUpdatingId(appointment.id);
    try {
      await apiFetch(`/front-office/appointments/${appointment.id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
      showFeedback('SUCCESS', `Appointment marked ${statusLabel(status).toLowerCase()}.`);
      await load();
    } catch (err: any) {
      showFeedback('ERROR', err?.message || 'Could not update the appointment.');
    } finally {
      setUpdatingId(null);
    }
  }

  const upcomingCount = appointments.filter((appointment) => {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    return (
      new Date(appointment.scheduledAt) >= start &&
      !['COMPLETED', 'CANCELLED', 'NO_SHOW'].includes(appointment.status)
    );
  }).length;

  const filtersActive = Boolean(search) || statusFilter !== 'ALL';

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Link
            href="/receptionist/dashboard"
            className="mb-2 inline-flex items-center gap-1.5 text-xs font-semibold text-warm-600 hover:text-charcoal-900"
          >
            <ArrowLeft size={14} /> Front desk
          </Link>
          <h1 className="flex items-center gap-3 text-2xl font-bold tracking-tight text-charcoal-900 sm:text-3xl">
            <CalendarCheck className="text-forest-700" size={26} /> Appointments
          </h1>
          <p className="mt-0.5 text-xs font-medium text-warm-500 sm:text-sm">
            {upcomingCount} upcoming appointment{upcomingCount === 1 ? '' : 's'}.
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
          <Link href="/receptionist/appointments/new">
            <Button size="sm" leftIcon={<Plus size={16} />}>
              New appointment
            </Button>
          </Link>
        </div>
      </div>

      <nav
        aria-label="Appointment views"
        role="tablist"
        className="flex gap-1 rounded-xl border border-warm-200 bg-card p-1 shadow-xs"
      >
        {(
          [
            { id: 'upcoming' as Tab, label: 'Upcoming', count: upcomingCount },
            { id: 'history' as Tab, label: 'History' },
            { id: 'all' as Tab, label: 'All', count: appointments.length },
          ]
        ).map((entry) => {
          const active = tab === entry.id;
          return (
            <button
              key={entry.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setTab(entry.id)}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest-600/30 ${
                active
                  ? 'bg-forest-800 text-ivory-50'
                  : 'text-warm-600 hover:bg-warm-100 hover:text-charcoal-900'
              }`}
            >
              {entry.label}
              {entry.count !== undefined && (
                <span
                  className={`rounded-full px-1.5 text-[10px] ${
                    active ? 'bg-forest-700 text-ivory-50' : 'bg-warm-100 text-warm-600'
                  }`}
                >
                  {entry.count}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Input
          type="search"
          aria-label="Search appointments"
          placeholder="Search visitor, host, phone or purpose…"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          leftIcon={<Search size={16} />}
        />
        <Select
          aria-label="Filter by status"
          value={statusFilter}
          options={[{ value: 'ALL', label: 'All statuses' }, ...STATUS_OPTIONS]}
          onChange={(event) => setStatusFilter(event.target.value)}
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

      {loading && appointments.length === 0 ? (
        <div className="flex items-center justify-center gap-2 py-16 text-sm font-medium text-warm-500">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading appointments…
        </div>
      ) : appointments.length === 0 && !error ? (
        <EmptyState
          icon={<CalendarCheck className="h-8 w-8" />}
          title="No appointments booked"
          description="Book a visit so the host is ready and the front desk can expect the visitor."
          actionButton={
            <Link href="/receptionist/appointments/new">
              <Button leftIcon={<CalendarPlus size={16} />}>Book appointment</Button>
            </Link>
          }
        />
      ) : visible.length === 0 && !error ? (
        <EmptyState
          icon={<Search className="h-8 w-8" />}
          title="No appointments match this view"
          description="Change the tab, status or search text to see other appointments."
          actionButton={
            filtersActive || tab !== 'all' ? (
              <Button
                variant="outline"
                onClick={() => {
                  setSearch('');
                  setStatusFilter('ALL');
                  setTab('all');
                }}
              >
                Show all appointments
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="space-y-3">
          {visible.map((appointment) => {
            const actionable = ['REQUESTED', 'CONFIRMED'].includes(appointment.status);
            return (
              <article
                key={appointment.id}
                className="rounded-xl border border-warm-200 bg-card p-4 shadow-xs sm:p-5"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-sm font-bold text-charcoal-900">
                        {appointment.visitorName}
                      </h2>
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase ${statusTone(
                          appointment.status,
                        )}`}
                      >
                        {statusLabel(appointment.status)}
                      </span>
                    </div>
                    <p className="mt-1 text-xs font-medium text-warm-600">
                      {new Date(appointment.scheduledAt).toLocaleString()} ·{' '}
                      {appointment.location || 'Reception'}
                    </p>
                    <p className="mt-1 text-xs text-warm-500">
                      Host: {appointment.hostName || 'Administration'}
                      {appointment.purpose ? ` · ${appointment.purpose}` : ''}
                    </p>
                    {(appointment.phone || appointment.email) && (
                      <p className="mt-0.5 text-[11px] text-warm-400">
                        {[appointment.phone, appointment.email].filter(Boolean).join(' · ')}
                      </p>
                    )}
                  </div>

                  {actionable && (
                    <div className="flex flex-wrap gap-1.5">
                      <Button
                        variant="outline"
                        size="xs"
                        onClick={() => updateStatus(appointment, 'COMPLETED')}
                        disabled={updatingId === appointment.id}
                        leftIcon={
                          updatingId === appointment.id ? (
                            <Loader2 size={12} className="animate-spin" />
                          ) : (
                            <Check size={12} />
                          )
                        }
                      >
                        Complete
                      </Button>
                      <Button
                        variant="outline"
                        size="xs"
                        onClick={() => updateStatus(appointment, 'NO_SHOW')}
                        disabled={updatingId === appointment.id}
                        leftIcon={<UserX size={12} />}
                      >
                        No show
                      </Button>
                      <Button
                        variant="ghost"
                        size="xs"
                        onClick={() => updateStatus(appointment, 'CANCELLED')}
                        disabled={updatingId === appointment.id}
                        leftIcon={<X size={12} />}
                      >
                        Cancel
                      </Button>
                    </div>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
