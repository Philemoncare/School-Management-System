'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { apiFetch } from '@/lib/api/client';
import { Button } from '@/components/ui/button';
import { Input, Select } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { showFeedback } from '@/components/layout/global-feedback';
import {
  Calendar as CalendarIcon,
  Plus,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Clock,
  Tag,
  AlertCircle,
} from 'lucide-react';

interface CalendarEvent {
  id: string;
  title: string;
  description?: string | null;
  startDate: string;
  endDate: string;
  type: string;
  status: string;
  academicYearId: string;
}

interface AcademicYear {
  id: string;
  name: string;
  isCurrent?: boolean;
}

const EVENT_TYPES = [
  { value: 'TEACHING_DAY', label: 'Teaching day' },
  { value: 'HOLIDAY', label: 'Holiday' },
  { value: 'BREAK', label: 'Break' },
  { value: 'EXAMINATION', label: 'Examination' },
  { value: 'ORIENTATION', label: 'Orientation' },
  { value: 'ADMISSION_EVENT', label: 'Admission event' },
  { value: 'GRADUATION', label: 'Graduation' },
  { value: 'STAFF_DEVELOPMENT', label: 'Staff development' },
  { value: 'SPECIAL_EVENT', label: 'Special event' },
  { value: 'OTHER', label: 'Other' },
];

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function dateKey(value: Date | string) {
  const date = new Date(value);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(
    date.getDate(),
  ).padStart(2, '0')}`;
}

function eventTone(type: string) {
  switch (type) {
    case 'HOLIDAY':
    case 'BREAK':
      return 'bg-danger-50 text-danger-700 border-danger-100';
    case 'EXAMINATION':
      return 'bg-terracotta-50 text-terracotta-700 border-terracotta-100';
    case 'TEACHING_DAY':
      return 'bg-sage-50 text-forest-800 border-sage-200';
    default:
      return 'bg-forest-700 text-white border-forest-700';
  }
}

export default function AcademicCalendarPage() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [years, setYears] = useState<AcademicYear[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [createOpen, setCreateOpen] = useState(false);
  const [draftDate, setDraftDate] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadCalendar = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [yearData, eventData] = await Promise.all([
        apiFetch('/academic-years'),
        apiFetch('/timetable/calendar'),
      ]);
      setYears(Array.isArray(yearData) ? yearData : []);
      setEvents(Array.isArray(eventData) ? eventData : []);
    } catch (err: any) {
      setEvents([]);
      setError(err?.message || 'Could not load the academic calendar.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCalendar();
  }, [loadCalendar]);

  const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  const monthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
  const leadingBlanks = monthStart.getDay();
  const daysInMonth = monthEnd.getDate();

  const eventsByDay = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    for (const event of events) {
      const start = new Date(event.startDate);
      const end = new Date(event.endDate);
      const cursor = new Date(start.getFullYear(), start.getMonth(), start.getDate());
      const last = new Date(end.getFullYear(), end.getMonth(), end.getDate());
      // Guard against malformed ranges and cap multi-day expansion.
      let guard = 0;
      while (cursor <= last && guard < 90) {
        const key = dateKey(cursor);
        map.set(key, [...(map.get(key) ?? []), event]);
        cursor.setDate(cursor.getDate() + 1);
        guard += 1;
      }
    }
    return map;
  }, [events]);

  const monthEvents = useMemo(
    () =>
      events
        .filter((event) => {
          const start = new Date(event.startDate);
          const end = new Date(event.endDate);
          return start <= monthEnd && end >= monthStart;
        })
        .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime()),
    [events, monthStart, monthEnd],
  );

  const upcoming = useMemo(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    return events
      .filter((event) => new Date(event.endDate) >= now)
      .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
      .slice(0, 8);
  }, [events]);

  function changeMonth(offset: number) {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + offset, 1));
  }

  function openFor(date?: Date) {
    setDraftDate(date ? dateKey(date) : null);
    setCreateOpen(true);
  }

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-charcoal-900 sm:text-3xl">
            Academic Calendar
          </h1>
          <p className="mt-1 text-sm font-medium text-warm-500">
            Schedule teaching days, holidays, examinations and school-wide events.
          </p>
        </div>
        <Button onClick={() => openFor()} leftIcon={<Plus size={18} />}>
          Schedule Event
        </Button>
      </div>

      {error && (
        <div
          role="alert"
          className="flex flex-col gap-3 rounded-xl border border-danger-200 bg-danger-50 p-4 text-sm font-semibold text-danger-700 sm:flex-row sm:items-center sm:justify-between"
        >
          <span>{error}</span>
          <Button variant="outline" size="sm" onClick={loadCalendar}>
            Try again
          </Button>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 lg:gap-8">
        <div className="rounded-xl border border-warm-200 bg-card p-4 shadow-sm sm:p-6 lg:col-span-2 lg:p-8">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <h3 className="text-lg font-semibold tracking-tight text-charcoal-900 sm:text-xl">
                {MONTHS[currentDate.getMonth()]} {currentDate.getFullYear()}
              </h3>
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => changeMonth(-1)}
                  aria-label="Previous month"
                  className="rounded-xl p-2 text-warm-500 transition-colors hover:bg-ivory-50 hover:text-charcoal-900"
                >
                  <ChevronLeft size={18} />
                </button>
                <button
                  type="button"
                  onClick={() => changeMonth(1)}
                  aria-label="Next month"
                  className="rounded-xl p-2 text-warm-500 transition-colors hover:bg-ivory-50 hover:text-charcoal-900"
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setCurrentDate(new Date())}
              className="rounded-xl bg-sage-50 px-4 py-2 text-[11px] font-semibold uppercase tracking-wide text-forest-700 hover:bg-sage-100"
            >
              Today
            </button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center gap-2 py-24 text-sm font-medium text-warm-500">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading calendar…
            </div>
          ) : (
            <div className="grid grid-cols-7 gap-px overflow-hidden rounded-2xl border border-warm-100 bg-warm-100">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                <div key={day} className="bg-ivory-50 p-2 text-center sm:p-3">
                  <span className="text-[10px] font-semibold uppercase tracking-wide text-warm-400 sm:text-[11px]">
                    {day}
                  </span>
                </div>
              ))}
              {Array.from({ length: leadingBlanks }).map((_, index) => (
                <div key={`blank-${index}`} className="min-h-[88px] bg-ivory-50/50 sm:min-h-[110px]" />
              ))}
              {Array.from({ length: daysInMonth }).map((_, index) => {
                const dayNumber = index + 1;
                const cellDate = new Date(
                  currentDate.getFullYear(),
                  currentDate.getMonth(),
                  dayNumber,
                );
                const dayEvents = eventsByDay.get(dateKey(cellDate)) ?? [];
                const isToday = dateKey(cellDate) === dateKey(new Date());
                return (
                  <button
                    key={dayNumber}
                    type="button"
                    onClick={() => openFor(cellDate)}
                    title={`Add event on ${dayNumber} ${MONTHS[currentDate.getMonth()]}`}
                    className="min-h-[88px] bg-card p-1.5 text-left transition-colors hover:bg-sage-50/40 focus-visible:bg-sage-50/40 focus-visible:outline-none sm:min-h-[110px] sm:p-2"
                  >
                    <span
                      className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-bold ${
                        isToday ? 'bg-forest-700 text-white' : 'text-warm-400'
                      }`}
                    >
                      {dayNumber}
                    </span>
                    <div className="mt-1 space-y-1">
                      {dayEvents.slice(0, 2).map((event) => (
                        <span
                          key={`${event.id}-${dayNumber}`}
                          className={`block truncate rounded-md border px-1.5 py-0.5 text-[9px] font-semibold leading-tight sm:text-[10px] ${eventTone(event.type)}`}
                        >
                          {event.title}
                        </span>
                      ))}
                      {dayEvents.length > 2 && (
                        <span className="block px-1 text-[9px] font-bold text-warm-400">
                          +{dayEvents.length - 2} more
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="space-y-6">
          <section className="rounded-xl bg-charcoal-900 p-5 text-white shadow-xs sm:p-6">
            <h3 className="mb-5 text-lg font-semibold tracking-tight">Upcoming Dates</h3>
            {upcoming.length === 0 ? (
              <div className="rounded-xl border border-white/5 py-10 text-center">
                <CalendarIcon className="mx-auto mb-3 text-white/10" size={40} />
                <p className="text-[11px] font-bold uppercase tracking-wide text-warm-500">
                  No scheduled events
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {upcoming.map((event) => (
                  <div key={event.id} className="group flex gap-4">
                    <div className="min-w-[40px] text-center">
                      <p className="text-xl font-semibold leading-none text-sage-400">
                        {new Date(event.startDate).getDate()}
                      </p>
                      <p className="mt-1 text-[11px] font-semibold uppercase text-warm-500">
                        {new Date(event.startDate).toLocaleString('default', { month: 'short' })}
                      </p>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold transition-colors group-hover:text-sage-400">
                        {event.title}
                      </p>
                      <div className="mt-1 flex flex-wrap items-center gap-2 opacity-60">
                        <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-tight">
                          <Tag size={10} /> {event.type.replace(/_/g, ' ')}
                        </span>
                        <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-tight">
                          <Clock size={10} />{' '}
                          {new Date(event.startDate).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                      {event.description && (
                        <p className="mt-1 line-clamp-2 text-[11px] text-warm-400">
                          {event.description}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <div className="rounded-xl bg-forest-700 p-5 text-white shadow-xs sm:p-6">
            <h3 className="mb-2 flex items-center gap-2 text-lg font-semibold">
              <AlertCircle size={20} /> This Month
            </h3>
            <p className="text-xs font-medium uppercase leading-relaxed tracking-tight text-sage-100 opacity-90">
              {monthEvents.length} scheduled event{monthEvents.length === 1 ? '' : 's'} in{' '}
              {MONTHS[currentDate.getMonth()]} {currentDate.getFullYear()}.
            </p>
            {monthEvents.length > 0 && (
              <p className="mt-2 text-xs text-sage-100/80">
                Next: {monthEvents[0].title} on{' '}
                {new Date(monthEvents[0].startDate).toLocaleDateString()}.
              </p>
            )}
          </div>
        </div>
      </div>

      {createOpen && (
        <CreateEventModal
          years={years}
          initialDate={draftDate}
          onClose={() => setCreateOpen(false)}
          onSaved={() => {
            setCreateOpen(false);
            showFeedback('SUCCESS', 'Calendar event scheduled.');
            loadCalendar();
          }}
        />
      )}
    </div>
  );
}

function CreateEventModal({
  years,
  initialDate,
  onClose,
  onSaved,
}: {
  years: AcademicYear[];
  initialDate: string | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const currentYear = years.find((year) => year.isCurrent) ?? years[0];
  const [form, setForm] = useState({
    academicYearId: currentYear?.id ?? '',
    title: '',
    type: 'SPECIAL_EVENT',
    startDate: initialDate ?? dateKey(new Date()),
    endDate: initialDate ?? dateKey(new Date()),
    description: '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (saving) return;
    if (!form.academicYearId) {
      setError('Select the academic year this event belongs to.');
      return;
    }
    if (!form.title.trim()) {
      setError('Enter an event title.');
      return;
    }
    if (new Date(form.endDate) < new Date(form.startDate)) {
      setError('The end date cannot be before the start date.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await apiFetch('/timetable/calendar', {
        method: 'POST',
        body: JSON.stringify({
          academicYearId: form.academicYearId,
          title: form.title.trim(),
          type: form.type,
          startDate: new Date(`${form.startDate}T08:00:00`).toISOString(),
          endDate: new Date(`${form.endDate}T17:00:00`).toISOString(),
          description: form.description.trim() || undefined,
        }),
      });
      onSaved();
    } catch (err: any) {
      setError(err?.message || 'Could not schedule the event.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      isOpen
      onClose={onClose}
      title="Schedule calendar event"
      size="lg"
      footerActions={
        <>
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" form="calendar-event-form" isLoading={saving}>
            Schedule event
          </Button>
        </>
      }
    >
      <form id="calendar-event-form" onSubmit={submit} className="space-y-4">
        {error && (
          <p role="alert" className="rounded-lg bg-danger-50 p-3 text-xs font-semibold text-danger-700">
            {error}
          </p>
        )}
        {years.length === 0 && (
          <p className="rounded-lg bg-warning-50 p-3 text-xs font-semibold text-warning-800">
            Create an academic year before scheduling calendar events.
          </p>
        )}
        <Select
          label="Academic year *"
          value={form.academicYearId}
          options={[
            { value: '', label: 'Select academic year' },
            ...years.map((year) => ({ value: year.id, label: year.name })),
          ]}
          onChange={(event) => setForm({ ...form, academicYearId: event.target.value })}
        />
        <Input
          label="Title *"
          required
          placeholder="e.g. Mid-term examinations"
          value={form.title}
          onChange={(event) => setForm({ ...form, title: event.target.value })}
        />
        <Select
          label="Event type"
          value={form.type}
          options={EVENT_TYPES}
          onChange={(event) => setForm({ ...form, type: event.target.value })}
        />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            label="Start date *"
            type="date"
            required
            value={form.startDate}
            onChange={(event) => setForm({ ...form, startDate: event.target.value })}
          />
          <Input
            label="End date *"
            type="date"
            required
            value={form.endDate}
            onChange={(event) => setForm({ ...form, endDate: event.target.value })}
          />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="calendar-description" className="block text-xs font-semibold text-charcoal-800">
            Description
          </label>
          <textarea
            id="calendar-description"
            rows={3}
            value={form.description}
            onChange={(event) => setForm({ ...form, description: event.target.value })}
            className="w-full resize-none rounded-lg border border-warm-300 bg-card p-3 text-sm text-charcoal-900 placeholder:text-warm-400 focus:border-forest-600 focus:outline-none focus:ring-2 focus:ring-forest-600/20"
          />
        </div>
      </form>
    </Modal>
  );
}
