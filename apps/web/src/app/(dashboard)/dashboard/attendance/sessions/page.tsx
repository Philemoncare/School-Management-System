'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api/client';
import { useAuth } from '@/context/auth-context';
import { collectUserRoles } from '@/lib/auth/roles';
import { Button } from '@/components/ui/button';
import { Input, Select } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { EmptyState } from '@/components/ui/empty-state';
import { showFeedback } from '@/components/layout/global-feedback';
import {
  ArrowLeft,
  CalendarCheck,
  Loader2,
  Plus,
  RefreshCw,
} from 'lucide-react';

interface Option {
  id: string;
  name: string;
  code?: string;
  isCurrent?: boolean;
  status?: string;
  isActive?: boolean;
}

interface SessionRow {
  id: string;
  date: string;
  sessionType: string;
  status: string;
  class?: { name: string };
  section?: { name: string } | null;
  subject?: { name: string } | null;
  _count?: { records: number };
}

const today = () => new Date().toISOString().slice(0, 10);

export default function AttendanceSessionsPage() {
  const router = useRouter();
  const { user, activeSchoolId } = useAuth();
  const roles = useMemo(() => collectUserRoles(user, activeSchoolId), [user, activeSchoolId]);
  const canCreate = roles.some((role) => ['SCHOOL_ADMIN', 'PRINCIPAL', 'TEACHER'].includes(role));

  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [dateFilter, setDateFilter] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await apiFetch('/attendance/sessions');
      setSessions(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setSessions([]);
      setError(err?.message || 'Could not load attendance sessions.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const visible = dateFilter
    ? sessions.filter((session) => String(session.date).slice(0, 10) === dateFilter)
    : sessions;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link
            href="/dashboard/attendance"
            className="mb-2 inline-flex items-center gap-1.5 text-xs font-semibold text-warm-600 hover:text-charcoal-900"
          >
            <ArrowLeft size={14} /> Attendance
          </Link>
          <h1 className="text-2xl font-bold tracking-tight text-charcoal-900 sm:text-3xl">
            Attendance Sessions
          </h1>
          <p className="mt-0.5 text-xs font-medium text-warm-500 sm:text-sm">
            One register per class, date and period. Open a session to mark the roll.
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
          {canCreate && (
            <Button onClick={() => setCreateOpen(true)} leftIcon={<Plus size={16} />}>
              Create New Session
            </Button>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="w-full max-w-xs">
          <Input
            label="Filter by date"
            type="date"
            value={dateFilter}
            onChange={(event) => setDateFilter(event.target.value)}
          />
        </div>
        {dateFilter && (
          <Button variant="ghost" size="sm" onClick={() => setDateFilter('')} className="sm:mt-5">
            Clear filter
          </Button>
        )}
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

      {loading && sessions.length === 0 ? (
        <div className="flex items-center justify-center gap-2 py-16 text-sm font-medium text-warm-500">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading sessions…
        </div>
      ) : visible.length === 0 && !error ? (
        <EmptyState
          icon={<CalendarCheck className="h-8 w-8" />}
          title={dateFilter ? 'No sessions on this date' : 'No attendance sessions yet'}
          description={
            dateFilter
              ? 'Choose another date or clear the filter to see all sessions.'
              : 'Create a session for a class and date, then mark students present, absent or late.'
          }
          actionButton={
            canCreate && !dateFilter ? (
              <Button onClick={() => setCreateOpen(true)} leftIcon={<Plus size={16} />}>
                Create New Session
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="overflow-hidden rounded-xl border border-warm-200 bg-card shadow-xs">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-warm-200">
              <caption className="sr-only">Attendance sessions</caption>
              <thead className="bg-ivory-50">
                <tr>
                  {['Date', 'Class / Section', 'Type', 'Status', 'Marked', 'Actions'].map((heading) => (
                    <th
                      key={heading}
                      scope="col"
                      className={`px-4 py-3 text-[11px] font-bold uppercase tracking-wide text-warm-500 sm:px-6 ${
                        heading === 'Actions' ? 'text-right' : 'text-left'
                      }`}
                    >
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-warm-100">
                {visible.map((session) => (
                  <tr key={session.id} className="transition-colors hover:bg-sage-50/30">
                    <td className="whitespace-nowrap px-4 py-3.5 text-sm font-semibold text-charcoal-900 sm:px-6">
                      {new Date(session.date).toLocaleDateString()}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3.5 text-sm text-warm-600 sm:px-6">
                      {session.class?.name ?? '—'}
                      {session.section?.name ? ` · ${session.section.name}` : ''}
                      {session.subject?.name && (
                        <span className="block text-[11px] text-warm-500">{session.subject.name}</span>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3.5 font-mono text-xs text-warm-500 sm:px-6">
                      {session.sessionType}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3.5 sm:px-6">
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase ${
                          session.status === 'LOCKED'
                            ? 'bg-warm-100 text-warm-700'
                            : session.status === 'COMPLETED'
                              ? 'bg-success-100 text-success-800'
                              : 'bg-sage-100 text-forest-900'
                        }`}
                      >
                        {session.status}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3.5 text-xs text-warm-500 sm:px-6">
                      {session._count?.records ?? 0} record{(session._count?.records ?? 0) === 1 ? '' : 's'}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3.5 text-right text-xs font-bold sm:px-6">
                      <Link
                        href={`/dashboard/attendance/sessions/${session.id}`}
                        className="text-forest-700 underline-offset-4 hover:text-forest-950 hover:underline"
                      >
                        Open Sheet
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {createOpen && (
        <CreateSessionModal
          onClose={() => setCreateOpen(false)}
          onCreated={(id) => {
            setCreateOpen(false);
            router.push(`/dashboard/attendance/sessions/${id}`);
          }}
        />
      )}
    </div>
  );
}

function CreateSessionModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (id: string) => void;
}) {
  const [years, setYears] = useState<Option[]>([]);
  const [terms, setTerms] = useState<Option[]>([]);
  const [classes, setClasses] = useState<Option[]>([]);
  const [sections, setSections] = useState<Option[]>([]);
  const [subjects, setSubjects] = useState<Option[]>([]);
  const [classSubjectIds, setClassSubjectIds] = useState<string[] | null>(null);
  const [optionsLoading, setOptionsLoading] = useState(true);
  const [form, setForm] = useState({
    academicYearId: '',
    termId: '',
    date: today(),
    sessionType: 'DAILY',
    classId: '',
    sectionId: '',
    subjectId: '',
    startTime: '',
    endTime: '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setOptionsLoading(true);
      try {
        const [yearData, classData, subjectData] = await Promise.all([
          apiFetch('/academic-years'),
          apiFetch('/classes'),
          apiFetch('/subjects'),
        ]);
        if (cancelled) return;
        const yearsList: Option[] = Array.isArray(yearData) ? yearData : [];
        setYears(yearsList);
        setClasses(Array.isArray(classData) ? classData : []);
        setSubjects((Array.isArray(subjectData) ? subjectData : []).filter((subject: any) => subject.isActive !== false));
        const current = yearsList.find((year) => year.isCurrent) ?? yearsList[0];
        if (current) setForm((previous) => ({ ...previous, academicYearId: current.id }));
      } catch (err: any) {
        if (!cancelled) setError(err?.message || 'Could not load academic setup.');
      } finally {
        if (!cancelled) setOptionsLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    setTerms([]);
    setForm((previous) => ({ ...previous, termId: '' }));
    if (!form.academicYearId) return;
    apiFetch(`/academic-terms/by-year/${form.academicYearId}`)
      .then((data) => {
        const list: Option[] = Array.isArray(data) ? data : [];
        setTerms(list);
        const active = list.find((term) => term.status === 'ACTIVE') ?? list[0];
        if (active) setForm((previous) => ({ ...previous, termId: active.id }));
      })
      .catch(() => setTerms([]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.academicYearId]);

  useEffect(() => {
    setSections([]);
    setClassSubjectIds(null);
    setForm((previous) => ({ ...previous, sectionId: '', subjectId: '' }));
    if (!form.classId) return;
    let cancelled = false;
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
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.classId]);

  const availableSubjects =
    classSubjectIds && classSubjectIds.length
      ? subjects.filter((subject) => classSubjectIds.includes(subject.id))
      : subjects;

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (saving) return;
    if (!form.academicYearId || !form.classId || !form.date) {
      setError('Academic year, class and date are required.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const created = await apiFetch('/attendance/sessions', {
        method: 'POST',
        body: JSON.stringify({
          academicYearId: form.academicYearId,
          termId: form.termId || undefined,
          date: form.date,
          sessionType: form.sessionType,
          classId: form.classId,
          sectionId: form.sectionId || undefined,
          subjectId: form.subjectId || undefined,
          startTime: form.startTime || undefined,
          endTime: form.endTime || undefined,
        }),
      });
      showFeedback('SUCCESS', 'Attendance session created.');
      onCreated(created.id);
    } catch (err: any) {
      setError(err?.message || 'Could not create the attendance session.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      isOpen
      onClose={onClose}
      title="Create attendance session"
      size="lg"
      footerActions={
        <>
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" form="session-form" isLoading={saving} leftIcon={<Plus size={16} />}>
            Create session
          </Button>
        </>
      }
    >
      {optionsLoading ? (
        <p className="flex items-center gap-2 py-8 text-sm text-warm-500">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading academic setup…
        </p>
      ) : (
        <form id="session-form" onSubmit={submit} className="space-y-4">
          {error && (
            <p role="alert" className="rounded-lg bg-danger-50 p-3 text-xs font-semibold text-danger-700">
              {error}
            </p>
          )}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Select
              label="Academic year *"
              value={form.academicYearId}
              placeholder="Select year"
              options={years.map((year) => ({
                value: year.id,
                label: `${year.name}${year.isCurrent ? ' (current)' : ''}`,
              }))}
              onChange={(event) => setForm({ ...form, academicYearId: event.target.value })}
            />
            <Select
              label="Term"
              value={form.termId}
              placeholder={terms.length ? 'Select term' : 'No terms for this year'}
              disabled={!terms.length}
              options={terms.map((term) => ({ value: term.id, label: term.name }))}
              onChange={(event) => setForm({ ...form, termId: event.target.value })}
            />
            <Input
              label="Date *"
              type="date"
              required
              value={form.date}
              onChange={(event) => setForm({ ...form, date: event.target.value })}
            />
            <Select
              label="Session type"
              value={form.sessionType}
              options={['DAILY', 'MORNING', 'AFTERNOON', 'SUBJECT', 'PERIOD', 'EVENT', 'OTHER'].map((value) => ({
                value,
                label: value.charAt(0) + value.slice(1).toLowerCase(),
              }))}
              onChange={(event) => setForm({ ...form, sessionType: event.target.value })}
            />
            <Select
              label="Class *"
              value={form.classId}
              placeholder="Select class"
              options={classes.map((clazz) => ({
                value: clazz.id,
                label: clazz.name,
                description: clazz.code,
                disabled: clazz.isActive === false,
              }))}
              onChange={(event) => setForm({ ...form, classId: event.target.value })}
            />
            <Select
              label="Section"
              value={form.sectionId}
              placeholder={
                !form.classId
                  ? 'Select a class first'
                  : sections.length
                    ? 'All sections / no section'
                    : 'No active sections'
              }
              disabled={!form.classId || sections.length === 0}
              options={[{ value: '', label: 'All sections / no section' }, ...sections.map((section) => ({ value: section.id, label: section.name }))]}
              onChange={(event) => setForm({ ...form, sectionId: event.target.value })}
            />
            <Select
              label="Subject"
              value={form.subjectId}
              placeholder={
                !form.classId
                  ? 'Select a class first'
                  : availableSubjects.length
                    ? 'Not subject-specific'
                    : 'No subjects for this class'
              }
              disabled={!form.classId || availableSubjects.length === 0}
              options={[
                { value: '', label: 'Not subject-specific' },
                ...availableSubjects.map((subject) => ({
                  value: subject.id,
                  label: subject.name,
                  description: subject.code,
                })),
              ]}
              helperText={
                form.classId && classSubjectIds && classSubjectIds.length === 0
                  ? 'This class has no assigned subjects yet — showing all active subjects.'
                  : undefined
              }
              onChange={(event) => setForm({ ...form, subjectId: event.target.value })}
            />
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Start time"
                type="time"
                value={form.startTime}
                onChange={(event) => setForm({ ...form, startTime: event.target.value })}
              />
              <Input
                label="End time"
                type="time"
                value={form.endTime}
                onChange={(event) => setForm({ ...form, endTime: event.target.value })}
              />
            </div>
          </div>
          <p className="text-xs text-warm-500">
            A class, date and period can only have one session. Attendance is entered on the session
            sheet after creation.
          </p>
        </form>
      )}
    </Modal>
  );
}
