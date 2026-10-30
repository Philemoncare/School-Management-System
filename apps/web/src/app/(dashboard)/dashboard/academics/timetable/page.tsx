'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { apiFetch } from '@/lib/api/client';
import { useAuth } from '@/context/auth-context';
import { collectUserRoles } from '@/lib/auth/roles';
import { Button } from '@/components/ui/button';
import { Input, Select } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { EmptyState } from '@/components/ui/empty-state';
import { showFeedback } from '@/components/layout/global-feedback';
import {
  Calendar,
  Clock,
  LayoutGrid,
  Plus,
  Loader2,
  AlertCircle,
  MapPin,
  BookOpen,
  ArrowLeftRight,
  Trash2,
  Bell,
  User,
  CheckCircle,
  ExternalLink,
} from 'lucide-react';

type TabId = 'weekly' | 'bells' | 'substitutions';

const TABS: Array<{ id: TabId; label: string }> = [
  { id: 'weekly', label: 'Weekly timetable' },
  { id: 'bells', label: 'Bell schedules' },
  { id: 'substitutions', label: 'Substitutions' },
];

const DAY_NAMES: Record<number, string> = {
  1: 'Monday',
  2: 'Tuesday',
  3: 'Wednesday',
  4: 'Thursday',
  5: 'Friday',
  6: 'Saturday',
  7: 'Sunday',
};

const DAY_OPTIONS = [1, 2, 3, 4, 5, 6, 7].map((day) => ({
  value: String(day),
  label: DAY_NAMES[day],
}));

function teacherName(teacher: any) {
  if (!teacher) return 'Unassigned';
  return `${teacher.firstName ?? ''} ${teacher.lastName ?? ''}`.trim() || 'Unassigned';
}

function teacherInitials(teacher: any) {
  return `${teacher?.firstName?.[0] ?? ''}${teacher?.lastName?.[0] ?? ''}`.toUpperCase() || '?';
}

function formatTimeRange(start?: string | null, end?: string | null) {
  if (!start && !end) return '—';
  return `${start ?? '—'}–${end ?? '—'}`;
}

function formatDate(value: unknown) {
  if (!value) return '—';
  const date = new Date(value as string);
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleDateString();
}

function statusTone(status: string) {
  switch (status) {
    case 'APPROVED':
    case 'PUBLISHED':
      return 'bg-success-50 text-success-700';
    case 'PENDING':
    case 'SCHEDULED':
      return 'bg-warning-50 text-warning-700';
    case 'CANCELLED':
    case 'REJECTED':
      return 'bg-danger-50 text-danger-700';
    case 'COMPLETED':
      return 'bg-sage-100 text-forest-800';
    default:
      return 'bg-ivory-50 text-warm-500';
  }
}

interface PeriodDraft {
  periodNumber: string;
  name: string;
  startTime: string;
  endTime: string;
  isBreak: boolean;
}

export default function TimetableDashboardPage() {
  const { user, activeSchoolId } = useAuth();
  const roles = useMemo(() => collectUserRoles(user, activeSchoolId), [user, activeSchoolId]);
  const canManage = roles.some((role) => ['SCHOOL_ADMIN', 'TIMETABLE_OFFICER'].includes(role));
  const canSubstitute = canManage || roles.includes('ACADEMIC_COORDINATOR');

  const [activeTab, setActiveTab] = useState<TabId>('weekly');

  const [metrics, setMetrics] = useState<any>(null);
  const [years, setYears] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [sections, setSections] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [rooms, setRooms] = useState<any[]>([]);
  const [bellSchedules, setBellSchedules] = useState<any[]>([]);
  const [entries, setEntries] = useState<any[]>([]);
  const [substitutions, setSubstitutions] = useState<any[]>([]);

  const [yearId, setYearId] = useState('');
  const [classId, setClassId] = useState('');
  const [sectionId, setSectionId] = useState('');
  const [teacherFilter, setTeacherFilter] = useState('');

  const [loading, setLoading] = useState(true);
  const [entriesLoading, setEntriesLoading] = useState(false);
  const [error, setError] = useState('');
  const [entriesError, setEntriesError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);

  const [lessonOpen, setLessonOpen] = useState(false);
  const [bellOpen, setBellOpen] = useState(false);
  const [substitutionOpen, setSubstitutionOpen] = useState(false);

  const reload = useCallback(() => setReloadKey((key) => key + 1), []);

  useEffect(() => {
    let cancelled = false;

    async function loadAllTeachers() {
      const first = await apiFetch('/teachers?limit=100&page=1');
      const items = Array.isArray(first?.items) ? [...first.items] : [];
      const totalPages = Number(first?.meta?.totalPages ?? 1);
      for (let page = 2; page <= totalPages; page += 1) {
        const next = await apiFetch(`/teachers?limit=100&page=${page}`);
        if (Array.isArray(next?.items)) items.push(...next.items);
      }
      return { items };
    }

    async function loadReference() {
      setLoading(true);
      setError('');
      const results = await Promise.allSettled([
        apiFetch('/timetable/dashboard'),
        apiFetch('/academic-years'),
        apiFetch('/classes'),
        apiFetch('/subjects'),
        loadAllTeachers(),
        apiFetch('/timetable/rooms'),
        apiFetch('/timetable/bell-schedules'),
        apiFetch('/timetable/substitutions'),
      ]);
      if (cancelled) return;

      const extract = (result: PromiseSettledResult<any>, fallback: any) =>
        result.status === 'fulfilled' ? result.value : fallback;

      const dashboard = extract(results[0], null);
      const yearList = extract(results[1], []);
      const classList = extract(results[2], []);
      const subjectList = extract(results[3], []);
      const teacherPayload = extract(results[4], { items: [] });
      const roomList = extract(results[5], []);
      const bellList = extract(results[6], []);
      const substitutionList = extract(results[7], []);

      setMetrics(dashboard?.metrics ?? null);
      setYears(Array.isArray(yearList) ? yearList : []);
      setClasses(Array.isArray(classList) ? classList : []);
      setSubjects(Array.isArray(subjectList) ? subjectList : []);
      setTeachers(Array.isArray(teacherPayload?.items) ? teacherPayload.items : []);
      setRooms(Array.isArray(roomList) ? roomList : []);
      setBellSchedules(Array.isArray(bellList) ? bellList : []);
      setSubstitutions(Array.isArray(substitutionList) ? substitutionList : []);

      const failed = results.find((result) => result.status === 'rejected') as
        | PromiseRejectedResult
        | undefined;
      if (failed) {
        setError(failed.reason?.message || 'Some timetable data could not be loaded.');
      }

      setYearId((current) => {
        if (current) return current;
        const list = Array.isArray(yearList) ? yearList : [];
        const preferred =
          list.find((year: any) => year.isCurrent) ??
          list.find((year: any) => year.status === 'ACTIVE') ??
          list[0];
        return preferred?.id ?? '';
      });

      setLoading(false);
    }

    loadReference();
    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  useEffect(() => {
    let cancelled = false;
    setSectionId('');
    if (!classId) {
      setSections([]);
      return () => {
        cancelled = true;
      };
    }
    apiFetch(`/sections/by-class/${classId}`)
      .then((data) => {
        if (!cancelled) setSections(Array.isArray(data) ? data : []);
      })
      .catch(() => {
        if (!cancelled) setSections([]);
      });
    return () => {
      cancelled = true;
    };
  }, [classId]);

  useEffect(() => {
    let cancelled = false;

    async function loadEntries() {
      if (!yearId) {
        setEntries([]);
        return;
      }
      setEntriesLoading(true);
      setEntriesError('');
      try {
        const params = new URLSearchParams({ academicYearId: yearId });
        if (classId) params.set('classId', classId);
        if (sectionId) params.set('sectionId', sectionId);
        const data = await apiFetch(`/timetable/entries?${params.toString()}`);
        if (!cancelled) setEntries(Array.isArray(data) ? data : []);
      } catch (err: any) {
        if (!cancelled) {
          setEntries([]);
          setEntriesError(err?.message || 'Could not load timetable entries.');
        }
      } finally {
        if (!cancelled) setEntriesLoading(false);
      }
    }

    loadEntries();
    return () => {
      cancelled = true;
    };
  }, [yearId, classId, sectionId, reloadKey]);

  const activeYear = years.find((year) => year.id === yearId);
  const activeBellSchedule = useMemo(
    () =>
      bellSchedules.find(
        (schedule) => schedule.academicYearId === yearId && schedule.isActive !== false,
      ) ?? bellSchedules.find((schedule) => schedule.academicYearId === yearId),
    [bellSchedules, yearId],
  );

  const slots = useMemo(() => {
    const list: Array<{ key: string; label: string; startTime: string; endTime: string; periodId?: string; isBreak?: boolean }> = [];
    const seen = new Set<string>();

    if (activeBellSchedule?.periods?.length) {
      for (const period of activeBellSchedule.periods) {
        const key = period.id;
        seen.add(`${period.startTime}-${period.endTime}`);
        list.push({
          key,
          label: period.name,
          startTime: period.startTime,
          endTime: period.endTime,
          periodId: period.id,
          isBreak: Boolean(period.isBreak),
        });
      }
    }

    for (const entry of entries) {
      const timeKey = `${entry.startTime}-${entry.endTime}`;
      if (seen.has(timeKey)) continue;
      seen.add(timeKey);
      list.push({
        key: timeKey,
        label: '',
        startTime: entry.startTime,
        endTime: entry.endTime,
      });
    }

    return list.sort((a, b) => a.startTime.localeCompare(b.startTime));
  }, [activeBellSchedule, entries]);

  const visibleDays = useMemo(() => {
    const present = new Set(entries.map((entry) => Number(entry.dayOfWeek)));
    const base = [1, 2, 3, 4, 5];
    for (const day of [6, 7]) {
      if (present.has(day)) base.push(day);
    }
    return base;
  }, [entries]);

  const filteredEntries = useMemo(() => {
    if (!teacherFilter) return entries;
    return entries.filter((entry) => entry.teacherId === teacherFilter);
  }, [entries, teacherFilter]);

  function entriesFor(day: number, slot: { startTime: string; endTime: string; periodId?: string }) {
    return filteredEntries.filter((entry) => {
      if (Number(entry.dayOfWeek) !== day) return false;
      if (slot.periodId && entry.periodId) return entry.periodId === slot.periodId;
      return entry.startTime === slot.startTime && entry.endTime === slot.endTime;
    });
  }

  const canAddLesson = canManage && Boolean(yearId);

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col gap-4 border-b border-warm-200 pb-6 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="flex items-center gap-3 text-2xl font-semibold tracking-tight text-charcoal-900 sm:text-3xl">
            <LayoutGrid size={30} className="text-forest-700" />
            Academic Scheduling
          </h1>
          <p className="mt-1 text-sm font-medium text-warm-500">
            Build the weekly master timetable, publish periods and arrange teacher cover.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/dashboard/academics/calendar"
            className="inline-flex items-center gap-2 rounded-xl border border-warm-200 bg-card px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-warm-600 transition-all hover:bg-ivory-50"
          >
            <Calendar size={14} /> Academic calendar
          </Link>
          <Link
            href="/dashboard/academics/rooms"
            className="inline-flex items-center gap-2 rounded-xl border border-warm-200 bg-card px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-warm-600 transition-all hover:bg-ivory-50"
          >
            <MapPin size={14} /> Room registry
          </Link>
          {canAddLesson && activeTab === 'weekly' && (
            <Button onClick={() => setLessonOpen(true)} leftIcon={<Plus size={16} />}>
              Add lesson
            </Button>
          )}
          {canManage && activeTab === 'bells' && (
            <Button onClick={() => setBellOpen(true)} leftIcon={<Bell size={16} />}>
              New bell schedule
            </Button>
          )}
          {canSubstitute && activeTab === 'substitutions' && (
            <Button onClick={() => setSubstitutionOpen(true)} leftIcon={<ArrowLeftRight size={16} />}>
              Record substitution
            </Button>
          )}
        </div>
      </div>

      {error && (
        <div
          role="alert"
          className="flex flex-col gap-3 rounded-2xl border border-danger-200 bg-danger-50 p-4 text-xs font-semibold text-danger-700 sm:flex-row sm:items-center sm:justify-between"
        >
          <span className="flex items-center gap-2">
            <AlertCircle size={16} /> {error}
          </span>
          <Button variant="outline" size="sm" onClick={reload}>
            Try again
          </Button>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard title="Published lessons" value={metrics?.totalEntries ?? 0} icon={<BookOpen size={18} />} tone="bg-sage-50 text-forest-700" />
        <KpiCard title="Classrooms" value={metrics?.totalRooms ?? 0} icon={<MapPin size={18} />} tone="bg-ivory-100 text-warm-600" />
        <KpiCard title="Pending cover" value={metrics?.activeSubstitutions ?? 0} icon={<ArrowLeftRight size={18} />} tone="bg-warning-50 text-warning-700" />
        <KpiCard title="Events today" value={metrics?.currentCalendarEvents ?? 0} icon={<Calendar size={18} />} tone="bg-terracotta-50 text-terracotta-600" />
      </div>

      <div role="tablist" aria-label="Timetable sections" className="flex flex-wrap gap-2">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={activeTab === tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`whitespace-nowrap rounded-xl px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wide transition-all ${
              activeTab === tab.id
                ? 'bg-charcoal-900 text-white shadow-md'
                : 'border border-warm-200 bg-card text-warm-600 hover:bg-ivory-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center gap-3 py-24 text-sm font-medium text-warm-500">
          <Loader2 className="h-5 w-5 animate-spin text-forest-700" /> Loading timetable…
        </div>
      ) : (
        <>
          {activeTab === 'weekly' && (
            <section className="space-y-5">
              <div className="grid grid-cols-1 gap-3 rounded-2xl border border-warm-200 bg-card p-4 shadow-sm sm:grid-cols-2 lg:grid-cols-4">
                <Select
                  label="Academic year"
                  value={yearId}
                  options={[
                    { value: '', label: years.length ? 'Select year' : 'No academic years' },
                    ...years.map((year) => ({ value: year.id, label: year.name })),
                  ]}
                  onChange={(event) => setYearId(event.target.value)}
                />
                <Select
                  label="Class"
                  value={classId}
                  options={[
                    { value: '', label: 'All classes' },
                    ...classes.map((clazz) => ({ value: clazz.id, label: clazz.name })),
                  ]}
                  onChange={(event) => setClassId(event.target.value)}
                />
                <Select
                  label="Section"
                  value={sectionId}
                  disabled={!classId || sections.length === 0}
                  options={[
                    { value: '', label: classId ? 'All sections' : 'Select a class first' },
                    ...sections.map((section) => ({ value: section.id, label: section.name })),
                  ]}
                  onChange={(event) => setSectionId(event.target.value)}
                />
                <Select
                  label="Teacher"
                  value={teacherFilter}
                  options={[
                    { value: '', label: 'All teachers' },
                    ...teachers.map((teacher) => ({
                      value: teacher.id,
                      label: teacherName(teacher),
                    })),
                  ]}
                  onChange={(event) => setTeacherFilter(event.target.value)}
                />
              </div>

              {entriesError && (
                <div role="alert" className="flex items-center justify-between gap-3 rounded-xl bg-danger-50 p-4 text-xs font-semibold text-danger-700">
                  <span className="flex items-center gap-2">
                    <AlertCircle size={16} /> {entriesError}
                  </span>
                  <Button variant="outline" size="sm" onClick={reload}>
                    Retry
                  </Button>
                </div>
              )}

              {!yearId ? (
                <EmptyState
                  icon={<Calendar className="h-8 w-8" />}
                  title="No academic year selected"
                  description="Create or activate an academic year before building a timetable."
                  actionButton={
                    <Link
                      href="/dashboard/academics/years"
                      className="inline-flex items-center gap-2 rounded-xl bg-forest-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-forest-800"
                    >
                      Manage academic years <ExternalLink size={14} />
                    </Link>
                  }
                />
              ) : entriesLoading ? (
                <div className="flex items-center justify-center gap-3 py-20 text-sm font-medium text-warm-500">
                  <Loader2 className="h-5 w-5 animate-spin text-forest-700" /> Loading lessons…
                </div>
              ) : entries.length === 0 ? (
                <EmptyState
                  icon={<LayoutGrid className="h-8 w-8" />}
                  title="No lessons scheduled"
                  description={
                    activeBellSchedule
                      ? 'Add the first lesson to this academic year using the bell schedule periods.'
                      : 'Create a bell schedule first, then add lessons for each class.'
                  }
                  actionButton={
                    canManage ? (
                      <div className="flex flex-wrap justify-center gap-2">
                        {!activeBellSchedule && (
                          <Button variant="outline" onClick={() => { setActiveTab('bells'); setBellOpen(true); }}>
                            Create bell schedule
                          </Button>
                        )}
                        <Button onClick={() => setLessonOpen(true)} leftIcon={<Plus size={16} />}>
                          Add lesson
                        </Button>
                      </div>
                    ) : undefined
                  }
                />
              ) : (
                <div className="overflow-hidden rounded-2xl border border-warm-200 bg-card shadow-sm">
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-warm-100 bg-ivory-50/60 px-4 py-3">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-warm-500">
                      {activeYear?.name ?? 'Academic year'}
                      {activeBellSchedule ? ` • ${activeBellSchedule.name}` : ''}
                    </p>
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-warm-400">
                      {filteredEntries.length} lesson{filteredEntries.length === 1 ? '' : 's'}
                    </p>
                  </div>
                  <div className="overflow-x-auto">
                    <div
                      className="grid min-w-[860px]"
                      style={{ gridTemplateColumns: `140px repeat(${visibleDays.length}, minmax(150px, 1fr))` }}
                    >
                      <div className="border-b border-r border-warm-100 bg-ivory-50/60 p-3 text-[10px] font-semibold uppercase tracking-wide text-warm-400">
                        Period
                      </div>
                      {visibleDays.map((day) => (
                        <div
                          key={day}
                          className="border-b border-warm-100 bg-ivory-50/60 p-3 text-[10px] font-semibold uppercase tracking-wide text-warm-500"
                        >
                          {DAY_NAMES[day]}
                        </div>
                      ))}

                      {slots.map((slot) => (
                        <React.Fragment key={slot.key}>
                          <div className="border-b border-r border-warm-100 p-3">
                            <p className="text-xs font-semibold text-charcoal-900">
                              {slot.label || formatTimeRange(slot.startTime, slot.endTime)}
                            </p>
                            <p className="mt-0.5 flex items-center gap-1 text-[10px] font-medium text-warm-400">
                              <Clock size={10} /> {formatTimeRange(slot.startTime, slot.endTime)}
                            </p>
                            {slot.isBreak && (
                              <span className="mt-1 inline-block rounded bg-warm-100 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-warm-500">
                                Break
                              </span>
                            )}
                          </div>
                          {visibleDays.map((day) => {
                            const cellEntries = slot.isBreak ? [] : entriesFor(day, slot);
                            return (
                              <div
                                key={`${slot.key}-${day}`}
                                className="min-h-[70px] border-b border-r border-warm-100 p-2 last:border-r-0"
                              >
                                {cellEntries.length === 0 ? (
                                  <span className="text-[10px] font-medium text-warm-300">—</span>
                                ) : (
                                  <div className="space-y-1.5">
                                    {cellEntries.map((entry) => (
                                      <div
                                        key={entry.id}
                                        className="rounded-lg border border-warm-100 bg-sage-50/60 p-2"
                                      >
                                        <p className="truncate text-[11px] font-semibold text-charcoal-900">
                                          {entry.subject?.name ?? 'Lesson'}
                                        </p>
                                        <p className="truncate text-[10px] font-medium text-warm-500">
                                          {entry.class?.name}
                                          {entry.section?.name ? ` • ${entry.section.name}` : ''}
                                        </p>
                                        <div className="mt-1 flex flex-wrap items-center gap-1.5">
                                          <span className="inline-flex items-center gap-1 rounded bg-card px-1.5 py-0.5 text-[9px] font-semibold text-forest-700">
                                            <User size={9} /> {teacherInitials(entry.teacher)}
                                          </span>
                                          {entry.room?.code && (
                                            <span className="inline-flex items-center gap-1 rounded bg-card px-1.5 py-0.5 text-[9px] font-semibold text-warm-500">
                                              <MapPin size={9} /> {entry.room.code}
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </React.Fragment>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </section>
          )}

          {activeTab === 'bells' && (
            <section className="space-y-4">
              {bellSchedules.length === 0 ? (
                <EmptyState
                  icon={<Bell className="h-8 w-8" />}
                  title="No bell schedules yet"
                  description="A bell schedule defines the periods used by every lesson in the timetable."
                  actionButton={
                    canManage ? (
                      <Button onClick={() => setBellOpen(true)} leftIcon={<Plus size={16} />}>
                        Create the first bell schedule
                      </Button>
                    ) : undefined
                  }
                />
              ) : (
                bellSchedules.map((schedule) => {
                  const year = years.find((item) => item.id === schedule.academicYearId);
                  return (
                    <div key={schedule.id} className="rounded-2xl border border-warm-200 bg-card shadow-sm">
                      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-warm-100 bg-ivory-50/60 px-5 py-4">
                        <div>
                          <h3 className="text-sm font-semibold text-charcoal-900">{schedule.name}</h3>
                          <p className="mt-0.5 text-[11px] font-semibold uppercase tracking-wide text-warm-400">
                            {year?.name ?? 'Academic year'} • {schedule.periods?.length ?? 0} periods
                          </p>
                        </div>
                        <span
                          className={`rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide ${
                            schedule.isActive ? 'bg-success-50 text-success-700' : 'bg-warm-100 text-warm-500'
                          }`}
                        >
                          {schedule.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="min-w-full text-left text-xs">
                          <thead>
                            <tr className="border-b border-warm-100 text-[10px] font-semibold uppercase tracking-wide text-warm-400">
                              <th className="px-5 py-3">#</th>
                              <th className="px-5 py-3">Period</th>
                              <th className="px-5 py-3">Start</th>
                              <th className="px-5 py-3">End</th>
                              <th className="px-5 py-3">Type</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-warm-100 font-medium text-warm-700">
                            {(schedule.periods ?? []).map((period: any) => (
                              <tr key={period.id}>
                                <td className="px-5 py-3 font-semibold text-charcoal-900">{period.periodNumber}</td>
                                <td className="px-5 py-3">{period.name}</td>
                                <td className="px-5 py-3">{period.startTime}</td>
                                <td className="px-5 py-3">{period.endTime}</td>
                                <td className="px-5 py-3">
                                  {period.isBreak ? (
                                    <span className="rounded bg-warm-100 px-2 py-0.5 text-[10px] font-semibold uppercase text-warm-500">
                                      Break
                                    </span>
                                  ) : (
                                    <span className="rounded bg-sage-50 px-2 py-0.5 text-[10px] font-semibold uppercase text-forest-700">
                                      Lesson
                                    </span>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  );
                })
              )}
            </section>
          )}

          {activeTab === 'substitutions' && (
            <section className="overflow-hidden rounded-2xl border border-warm-200 bg-card shadow-sm">
              {substitutions.length === 0 ? (
                <div className="p-6 sm:p-8">
                  <EmptyState
                    icon={<ArrowLeftRight className="h-8 w-8" />}
                    title="No substitutions recorded"
                    description="When a teacher is absent, record cover so the class still has a named teacher."
                    actionButton={
                      canSubstitute ? (
                        <Button onClick={() => setSubstitutionOpen(true)} leftIcon={<Plus size={16} />}>
                          Record a substitution
                        </Button>
                      ) : undefined
                    }
                  />
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-warm-100 bg-ivory-50/60 text-[10px] font-semibold uppercase tracking-wide text-warm-400">
                        <th className="px-5 py-4">Date</th>
                        <th className="px-5 py-4">Lesson</th>
                        <th className="px-5 py-4">Time</th>
                        <th className="px-5 py-4">Original teacher</th>
                        <th className="px-5 py-4">Substitute</th>
                        <th className="px-5 py-4">Reason</th>
                        <th className="px-5 py-4">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-warm-100 font-medium text-warm-700">
                      {substitutions.map((substitution) => (
                        <tr key={substitution.id} className="hover:bg-ivory-50/40">
                          <td className="whitespace-nowrap px-5 py-4 font-semibold text-charcoal-900">
                            {formatDate(substitution.date)}
                          </td>
                          <td className="px-5 py-4">
                            <p className="font-semibold text-charcoal-900">
                              {substitution.timetableEntry?.subject?.name ?? 'Lesson'}
                            </p>
                            <p className="text-[11px] font-bold uppercase tracking-tight text-warm-400">
                              {substitution.timetableEntry?.class?.name ?? 'Class'}
                              {substitution.timetableEntry?.section?.name
                                ? ` • ${substitution.timetableEntry.section.name}`
                                : ''}
                              {' • '}
                              {DAY_NAMES[substitution.timetableEntry?.dayOfWeek] ?? ''}
                            </p>
                          </td>
                          <td className="whitespace-nowrap px-5 py-4">
                            {formatTimeRange(
                              substitution.timetableEntry?.startTime,
                              substitution.timetableEntry?.endTime,
                            )}
                          </td>
                          <td className="px-5 py-4">{teacherName(substitution.originalTeacher)}</td>
                          <td className="px-5 py-4 font-semibold text-forest-700">
                            {teacherName(substitution.substituteTeacher)}
                          </td>
                          <td className="max-w-[180px] px-5 py-4 text-warm-500">
                            {substitution.reason || '—'}
                          </td>
                          <td className="px-5 py-4">
                            <span
                              className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${statusTone(
                                substitution.status,
                              )}`}
                            >
                              {String(substitution.status).replace(/_/g, ' ')}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          )}
        </>
      )}

      {lessonOpen && (
        <LessonModal
          years={years}
          subjects={subjects}
          classes={classes}
          teachers={teachers}
          rooms={rooms}
          bellSchedules={bellSchedules}
          defaultYearId={yearId}
          defaultClassId={classId}
          defaultSectionId={sectionId}
          onClose={() => setLessonOpen(false)}
          onSaved={() => {
            setLessonOpen(false);
            showFeedback('SUCCESS', 'Lesson added to the timetable.');
            reload();
          }}
        />
      )}

      {bellOpen && (
        <BellScheduleModal
          years={years}
          defaultYearId={yearId}
          onClose={() => setBellOpen(false)}
          onSaved={() => {
            setBellOpen(false);
            showFeedback('SUCCESS', 'Bell schedule created.');
            reload();
          }}
        />
      )}

      {substitutionOpen && (
        <SubstitutionModal
          entries={entries}
          teachers={teachers}
          onClose={() => setSubstitutionOpen(false)}
          onSaved={() => {
            setSubstitutionOpen(false);
            showFeedback('SUCCESS', 'Substitution recorded.');
            reload();
          }}
        />
      )}
    </div>
  );
}

function KpiCard({
  title,
  value,
  icon,
  tone,
}: {
  title: string;
  value: number;
  icon: React.ReactNode;
  tone: string;
}) {
  return (
    <div className="rounded-xl border border-warm-200 bg-card p-4 shadow-sm sm:p-5">
      <div className={`mb-3 flex h-9 w-9 items-center justify-center rounded-xl ${tone}`}>{icon}</div>
      <p className="text-[10px] font-semibold uppercase tracking-wide text-warm-400">{title}</p>
      <p className="mt-1 text-2xl font-semibold text-charcoal-900">{value}</p>
    </div>
  );
}

function ModalError({ message }: { message: string }) {
  if (!message) return null;
  return (
    <p role="alert" className="rounded-lg bg-danger-50 p-3 text-xs font-semibold text-danger-700">
      {message}
    </p>
  );
}

function LessonModal({
  years,
  subjects,
  classes,
  teachers,
  rooms,
  bellSchedules,
  defaultYearId,
  defaultClassId,
  defaultSectionId,
  onClose,
  onSaved,
}: {
  years: any[];
  subjects: any[];
  classes: any[];
  teachers: any[];
  rooms: any[];
  bellSchedules: any[];
  defaultYearId: string;
  defaultClassId: string;
  defaultSectionId: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState({
    academicYearId: defaultYearId,
    termId: '',
    classId: defaultClassId,
    sectionId: defaultSectionId,
    subjectId: '',
    teacherId: '',
    roomId: '',
    dayOfWeek: '1',
    periodId: '',
    startTime: '08:00',
    endTime: '08:45',
  });
  const [terms, setTerms] = useState<any[]>([]);
  const [sections, setSections] = useState<any[]>([]);
  const [classSubjectIds, setClassSubjectIds] = useState<string[] | null>(null);
  const [loadingSections, setLoadingSections] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const yearBells = bellSchedules.filter(
    (schedule) => schedule.academicYearId === form.academicYearId && schedule.isActive !== false,
  );
  const periods = useMemo(
    () =>
      yearBells
        .flatMap((schedule) => schedule.periods ?? [])
        .filter((period: any) => !period.isBreak)
        .sort((a: any, b: any) => a.startTime.localeCompare(b.startTime)),
    [yearBells],
  );

  useEffect(() => {
    let cancelled = false;
    if (!form.academicYearId) {
      setTerms([]);
      return () => {
        cancelled = true;
      };
    }
    apiFetch(`/academic-terms/by-year/${form.academicYearId}`)
      .then((data) => {
        if (!cancelled) setTerms(Array.isArray(data) ? data : []);
      })
      .catch(() => {
        if (!cancelled) setTerms([]);
      });
    return () => {
      cancelled = true;
    };
  }, [form.academicYearId]);

  useEffect(() => {
    let cancelled = false;
    setSections([]);
    setClassSubjectIds(null);
    if (!form.classId) {
      setLoadingSections(false);
      return () => {
        cancelled = true;
      };
    }
    setLoadingSections(true);
    Promise.all([
      apiFetch(`/sections/by-class/${form.classId}`),
      apiFetch(`/class-subjects/by-class/${form.classId}`),
    ])
      .then(([sectionData, assignmentData]) => {
        if (cancelled) return;
        setSections(
          (Array.isArray(sectionData) ? sectionData : []).filter(
            (section: any) => section.isActive !== false,
          ),
        );
        const assignments: any[] = Array.isArray(assignmentData) ? assignmentData : [];
        setClassSubjectIds(assignments.map((assignment) => assignment.subjectId));
      })
      .catch(() => {
        if (cancelled) return;
        setSections([]);
        setClassSubjectIds(null);
      })
      .finally(() => {
        if (!cancelled) setLoadingSections(false);
      });
    return () => {
      cancelled = true;
    };
  }, [form.classId]);

  const availableSubjects = useMemo(() => {
    if (classSubjectIds && classSubjectIds.length) {
      return subjects.filter((subject) => classSubjectIds.includes(subject.id));
    }
    return subjects;
  }, [subjects, classSubjectIds]);

  function pickPeriod(periodId: string) {
    const period = periods.find((item: any) => item.id === periodId);
    setForm((current) => ({
      ...current,
      periodId,
      ...(period ? { startTime: period.startTime, endTime: period.endTime } : {}),
    }));
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (saving) return;
    if (!form.academicYearId || !form.classId || !form.subjectId || !form.teacherId) {
      setError('Academic year, class, subject and teacher are required.');
      return;
    }
    if (!form.startTime || !form.endTime || form.startTime >= form.endTime) {
      setError('The lesson must end after it starts.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await apiFetch('/timetable/entries', {
        method: 'POST',
        body: JSON.stringify({
          academicYearId: form.academicYearId,
          termId: form.termId || undefined,
          classId: form.classId,
          sectionId: form.sectionId || undefined,
          subjectId: form.subjectId,
          teacherId: form.teacherId,
          roomId: form.roomId || undefined,
          periodId: form.periodId || undefined,
          dayOfWeek: Number(form.dayOfWeek),
          startTime: form.startTime,
          endTime: form.endTime,
        }),
      });
      onSaved();
    } catch (err: any) {
      setError(err?.message || 'Could not add the lesson.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      isOpen
      onClose={onClose}
      title="Add lesson"
      size="lg"
      footerActions={
        <>
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" form="lesson-form" isLoading={saving}>
            Add lesson
          </Button>
        </>
      }
    >
      <form id="lesson-form" onSubmit={submit} className="space-y-4">
        <ModalError message={error} />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Select
            label="Academic year *"
            value={form.academicYearId}
            placeholder="Select academic year"
            options={years.map((year) => ({
              value: year.id,
              label: `${year.name}${year.isCurrent ? ' (current)' : ''}`,
            }))}
            onChange={(event) => setForm({ ...form, academicYearId: event.target.value, termId: '', periodId: '' })}
          />
          <Select
            label="Term"
            value={form.termId}
            placeholder={terms.length ? 'Whole year' : 'No terms for this year'}
            options={[
              { value: '', label: 'Whole year' },
              ...terms.map((term) => ({ value: term.id, label: term.name })),
            ]}
            onChange={(event) => setForm({ ...form, termId: event.target.value })}
          />
          <Select
            label="Class *"
            value={form.classId}
            placeholder="Select class"
            options={classes.map((clazz) => ({
              value: clazz.id,
              label: clazz.name,
              description: clazz.code ?? undefined,
              disabled: clazz.isActive === false,
            }))}
            onChange={(event) =>
              setForm({ ...form, classId: event.target.value, sectionId: '', subjectId: '' })
            }
          />
          <Select
            label="Section"
            value={form.sectionId}
            loading={loadingSections}
            placeholder={
              !form.classId
                ? 'Select a class first'
                : sections.length
                  ? 'Whole class'
                  : 'No sections'
            }
            disabled={!form.classId || loadingSections || sections.length === 0}
            options={[
              { value: '', label: 'Whole class' },
              ...sections.map((section) => ({
                value: section.id,
                label: section.name,
                description: section.code ?? undefined,
              })),
            ]}
            onChange={(event) => setForm({ ...form, sectionId: event.target.value })}
          />
          <Select
            label="Subject *"
            value={form.subjectId}
            searchable={availableSubjects.length > 10}
            placeholder={
              !form.classId
                ? 'Select a class first'
                : availableSubjects.length
                  ? 'Select subject'
                  : 'No subjects for this class'
            }
            disabled={!form.classId || availableSubjects.length === 0}
            options={availableSubjects.map((subject) => ({
              value: subject.id,
              label: subject.name,
              description: subject.code ?? undefined,
            }))}
            helperText={
              form.classId && classSubjectIds && classSubjectIds.length === 0
                ? 'This class has no assigned subjects yet — showing all active subjects.'
                : undefined
            }
            onChange={(event) => setForm({ ...form, subjectId: event.target.value })}
          />
          <Select
            label="Teacher *"
            value={form.teacherId}
            searchable
            placeholder="Select teacher"
            options={teachers.map((teacher) => ({
              value: teacher.id,
              label: teacherName(teacher),
              description: teacher.employeeId ?? undefined,
            }))}
            emptyMessage="No teachers registered yet."
            onChange={(event) => setForm({ ...form, teacherId: event.target.value })}
          />
          <Select
            label="Room"
            value={form.roomId}
            placeholder={rooms.length ? 'No room' : 'No rooms registered'}
            disabled={rooms.length === 0}
            options={[
              { value: '', label: 'No room' },
              ...rooms.map((room) => ({
                value: room.id,
                label: room.name,
                description: room.code ?? undefined,
              })),
            ]}
            onChange={(event) => setForm({ ...form, roomId: event.target.value })}
          />
          <Select
            label="Day *"
            value={form.dayOfWeek}
            options={DAY_OPTIONS}
            onChange={(event) => setForm({ ...form, dayOfWeek: event.target.value })}
          />
          <Select
            label="Bell period"
            value={form.periodId}
            options={[
              { value: '', label: periods.length ? 'Custom time' : 'No bell schedule' },
              ...periods.map((period: any) => ({
                value: period.id,
                label: `${period.name} (${period.startTime}–${period.endTime})`,
              })),
            ]}
            onChange={(event) => pickPeriod(event.target.value)}
          />
          <Input
            label="Start time *"
            type="time"
            required
            value={form.startTime}
            onChange={(event) => setForm({ ...form, startTime: event.target.value })}
          />
          <Input
            label="End time *"
            type="time"
            required
            value={form.endTime}
            onChange={(event) => setForm({ ...form, endTime: event.target.value })}
          />
        </div>
        <p className="rounded-lg bg-ivory-50 p-3 text-[11px] font-medium text-warm-500">
          The server rejects teacher, class and room double-booking automatically.
        </p>
      </form>
    </Modal>
  );
}

function BellScheduleModal({
  years,
  defaultYearId,
  onClose,
  onSaved,
}: {
  years: any[];
  defaultYearId: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [academicYearId, setAcademicYearId] = useState(defaultYearId);
  const [termId, setTermId] = useState('');
  const [name, setName] = useState('Standard school day');
  const [terms, setTerms] = useState<any[]>([]);
  const [periods, setPeriods] = useState<PeriodDraft[]>([
    { periodNumber: '1', name: 'Period 1', startTime: '08:00', endTime: '08:45', isBreak: false },
    { periodNumber: '2', name: 'Period 2', startTime: '08:45', endTime: '09:30', isBreak: false },
    { periodNumber: '3', name: 'Break', startTime: '09:30', endTime: '10:00', isBreak: true },
  ]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    if (!academicYearId) {
      setTerms([]);
      return () => {
        cancelled = true;
      };
    }
    apiFetch(`/academic-terms/by-year/${academicYearId}`)
      .then((data) => {
        if (!cancelled) setTerms(Array.isArray(data) ? data : []);
      })
      .catch(() => {
        if (!cancelled) setTerms([]);
      });
    return () => {
      cancelled = true;
    };
  }, [academicYearId]);

  function updatePeriod(index: number, patch: Partial<PeriodDraft>) {
    setPeriods((current) =>
      current.map((period, position) => (position === index ? { ...period, ...patch } : period)),
    );
  }

  function addPeriod() {
    setPeriods((current) => {
      const last = current[current.length - 1];
      const nextNumber = current.reduce(
        (max, period) => Math.max(max, Number(period.periodNumber) || 0),
        0,
      ) + 1;
      return [
        ...current,
        {
          periodNumber: String(nextNumber),
          name: `Period ${nextNumber}`,
          startTime: last?.endTime || '08:00',
          endTime: last?.endTime || '08:45',
          isBreak: false,
        },
      ];
    });
  }

  function removePeriod(index: number) {
    setPeriods((current) => current.filter((_, position) => position !== index));
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (saving) return;
    if (!academicYearId) {
      setError('Select an academic year.');
      return;
    }
    if (!name.trim()) {
      setError('Enter a name for the bell schedule.');
      return;
    }
    if (periods.length === 0) {
      setError('Add at least one period.');
      return;
    }
    const cleaned = periods.map((period) => ({
      periodNumber: Number(period.periodNumber),
      name: period.name.trim(),
      startTime: period.startTime,
      endTime: period.endTime,
      isBreak: period.isBreak,
      duration: 1,
    }));
    if (cleaned.some((period) => !period.name || !Number.isInteger(period.periodNumber) || period.periodNumber < 1)) {
      setError('Every period needs a name and a positive number.');
      return;
    }
    if (cleaned.some((period) => !period.startTime || !period.endTime || period.startTime >= period.endTime)) {
      setError('Every period must end after it starts.');
      return;
    }
    const numbers = new Set(cleaned.map((period) => period.periodNumber));
    if (numbers.size !== cleaned.length) {
      setError('Period numbers must be unique.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await apiFetch('/timetable/bell-schedules', {
        method: 'POST',
        body: JSON.stringify({
          academicYearId,
          termId: termId || undefined,
          name: name.trim(),
          periods: cleaned,
        }),
      });
      onSaved();
    } catch (err: any) {
      setError(err?.message || 'Could not create the bell schedule.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      isOpen
      onClose={onClose}
      title="New bell schedule"
      size="lg"
      footerActions={
        <>
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" form="bell-form" isLoading={saving}>
            Create bell schedule
          </Button>
        </>
      }
    >
      <form id="bell-form" onSubmit={submit} className="space-y-4">
        <ModalError message={error} />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Select
            label="Academic year *"
            value={academicYearId}
            options={[
              { value: '', label: 'Select year' },
              ...years.map((year) => ({ value: year.id, label: year.name })),
            ]}
            onChange={(event) => setAcademicYearId(event.target.value)}
          />
          <Select
            label="Term"
            value={termId}
            options={[
              { value: '', label: 'Whole year' },
              ...terms.map((term) => ({ value: term.id, label: term.name })),
            ]}
            onChange={(event) => setTermId(event.target.value)}
          />
          <Input
            label="Name *"
            required
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
        </div>

        <div className="space-y-2 rounded-xl border border-warm-200 p-3">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-warm-500">Periods</p>
            <Button type="button" variant="outline" size="sm" onClick={addPeriod} leftIcon={<Plus size={13} />}>
              Add period
            </Button>
          </div>
          {periods.map((period, index) => (
            <div key={index} className="grid grid-cols-1 gap-2 rounded-lg bg-ivory-50 p-3 sm:grid-cols-12">
              <div className="sm:col-span-1">
                <Input
                  label="#"
                  type="number"
                  min={1}
                  value={period.periodNumber}
                  onChange={(event) => updatePeriod(index, { periodNumber: event.target.value })}
                />
              </div>
              <div className="sm:col-span-3">
                <Input
                  label="Name"
                  value={period.name}
                  onChange={(event) => updatePeriod(index, { name: event.target.value })}
                />
              </div>
              <div className="sm:col-span-2">
                <Input
                  label="Start"
                  type="time"
                  value={period.startTime}
                  onChange={(event) => updatePeriod(index, { startTime: event.target.value })}
                />
              </div>
              <div className="sm:col-span-2">
                <Input
                  label="End"
                  type="time"
                  value={period.endTime}
                  onChange={(event) => updatePeriod(index, { endTime: event.target.value })}
                />
              </div>
              <div className="flex items-end gap-2 sm:col-span-4">
                <label className="flex items-center gap-2 pb-2 text-[11px] font-semibold text-warm-600">
                  <input
                    type="checkbox"
                    checked={period.isBreak}
                    onChange={(event) => updatePeriod(index, { isBreak: event.target.checked })}
                    className="h-4 w-4 rounded border-warm-300 text-forest-700 focus:ring-forest-600"
                  />
                  Break
                </label>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label={`Remove period ${period.periodNumber}`}
                  onClick={() => removePeriod(index)}
                  disabled={periods.length === 1}
                >
                  <Trash2 size={16} />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </form>
    </Modal>
  );
}

function SubstitutionModal({
  entries,
  teachers,
  onClose,
  onSaved,
}: {
  entries: any[];
  teachers: any[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [timetableEntryId, setTimetableEntryId] = useState('');
  const [substituteTeacherId, setSubstituteTeacherId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const selectedEntry = entries.find((entry) => entry.id === timetableEntryId);
  const originalTeacherId = selectedEntry?.teacherId ?? '';
  const availableTeachers = teachers.filter((teacher) => teacher.id !== originalTeacherId);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (saving) return;
    if (!selectedEntry) {
      setError('Select the lesson that needs cover.');
      return;
    }
    if (!substituteTeacherId) {
      setError('Select the substitute teacher.');
      return;
    }
    if (!date) {
      setError('Choose the date of the substitution.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await apiFetch('/timetable/substitutions', {
        method: 'POST',
        body: JSON.stringify({
          timetableEntryId: selectedEntry.id,
          originalTeacherId,
          substituteTeacherId,
          date: new Date(`${date}T00:00:00`).toISOString(),
          reason: reason.trim() || undefined,
        }),
      });
      onSaved();
    } catch (err: any) {
      setError(err?.message || 'Could not record the substitution.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      isOpen
      onClose={onClose}
      title="Record teacher substitution"
      size="lg"
      footerActions={
        <>
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" form="substitution-form" isLoading={saving}>
            Record substitution
          </Button>
        </>
      }
    >
      <form id="substitution-form" onSubmit={submit} className="space-y-4">
        <ModalError message={error} />
        {entries.length === 0 ? (
          <p className="rounded-lg bg-warning-50 p-3 text-xs font-semibold text-warning-800">
            Add timetable lessons for the selected filters before recording a substitution.
          </p>
        ) : (
          <>
            <Select
              label="Lesson *"
              value={timetableEntryId}
              options={[
                { value: '', label: 'Select lesson' },
                ...entries.map((entry) => ({
                  value: entry.id,
                  label: `${entry.class?.name ?? 'Class'}${
                    entry.section?.name ? ` ${entry.section.name}` : ''
                  } • ${entry.subject?.name ?? 'Subject'} • ${DAY_NAMES[entry.dayOfWeek] ?? ''} ${
                    entry.startTime
                  }–${entry.endTime}`,
                })),
              ]}
              onChange={(event) => {
                setTimetableEntryId(event.target.value);
                setSubstituteTeacherId('');
              }}
            />

            {selectedEntry && (
              <div className="rounded-xl bg-ivory-50 p-3 text-xs font-semibold text-warm-600">
                <span className="flex items-center gap-2">
                  <User size={14} /> Original teacher: {teacherName(selectedEntry.teacher)}
                </span>
                <span className="mt-1 flex items-center gap-2 text-[11px] font-medium text-warm-400">
                  <Clock size={12} /> {DAY_NAMES[selectedEntry.dayOfWeek]} •{' '}
                  {formatTimeRange(selectedEntry.startTime, selectedEntry.endTime)}
                  {selectedEntry.room?.name ? ` • ${selectedEntry.room.name}` : ''}
                </span>
              </div>
            )}

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Select
                label="Substitute teacher *"
                value={substituteTeacherId}
                options={[
                  { value: '', label: 'Select substitute' },
                  ...availableTeachers.map((teacher) => ({
                    value: teacher.id,
                    label: teacherName(teacher),
                  })),
                ]}
                onChange={(event) => setSubstituteTeacherId(event.target.value)}
              />
              <Input
                label="Date *"
                type="date"
                required
                value={date}
                onChange={(event) => setDate(event.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="substitution-reason" className="block text-xs font-semibold text-charcoal-800">
                Reason
              </label>
              <textarea
                id="substitution-reason"
                rows={3}
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                placeholder="e.g. Sick leave"
                className="w-full resize-none rounded-lg border border-warm-300 bg-card p-3 text-sm text-charcoal-900 focus:border-forest-600 focus:outline-none focus:ring-2 focus:ring-forest-600/20"
              />
            </div>
            <p className="flex items-center gap-2 text-[11px] font-medium text-warm-400">
              <CheckCircle size={13} /> The substitute is checked for clashes before the cover is saved.
            </p>
          </>
        )}
      </form>
    </Modal>
  );
}
