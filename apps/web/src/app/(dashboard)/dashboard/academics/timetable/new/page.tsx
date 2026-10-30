'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Clock, Loader2, Save } from 'lucide-react';
import { apiFetch } from '@/lib/api/client';
import { Input, Select } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { FormActions, FormError, FormGrid, FormSection } from '@/components/ui/form';
import { showFeedback } from '@/components/layout/global-feedback';

interface NamedOption {
  id: string;
  name: string;
  code?: string | null;
  isCurrent?: boolean;
  status?: string;
  isActive?: boolean;
  employeeId?: string | null;
  firstName?: string;
  lastName?: string;
}

const DAYS = [
  { value: '1', label: 'Monday' },
  { value: '2', label: 'Tuesday' },
  { value: '3', label: 'Wednesday' },
  { value: '4', label: 'Thursday' },
  { value: '5', label: 'Friday' },
  { value: '6', label: 'Saturday' },
  { value: '7', label: 'Sunday' },
];

export default function NewTimetableEntryPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const [years, setYears] = useState<NamedOption[]>([]);
  const [terms, setTerms] = useState<NamedOption[]>([]);
  const [classes, setClasses] = useState<NamedOption[]>([]);
  const [sections, setSections] = useState<NamedOption[]>([]);
  const [subjects, setSubjects] = useState<NamedOption[]>([]);
  const [classSubjectIds, setClassSubjectIds] = useState<string[] | null>(null);
  const [teachers, setTeachers] = useState<NamedOption[]>([]);
  const [rooms, setRooms] = useState<NamedOption[]>([]);

  const [loading, setLoading] = useState(true);
  const [loadingSections, setLoadingSections] = useState(false);
  const [loadingTeachers, setLoadingTeachers] = useState(true);

  const [form, setForm] = useState({
    academicYearId: '',
    termId: '',
    classId: '',
    sectionId: '',
    subjectId: '',
    teacherId: '',
    roomId: '',
    dayOfWeek: '1',
    startTime: '08:00',
    endTime: '08:45',
  });

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const [yearData, classData, subjectData, roomData] = await Promise.all([
          apiFetch('/academic-years'),
          apiFetch('/classes'),
          apiFetch('/subjects'),
          apiFetch('/timetable/rooms').catch(() => []),
        ]);
        if (cancelled) return;
        const yearList: NamedOption[] = Array.isArray(yearData) ? yearData : [];
        setYears(yearList);
        setClasses(Array.isArray(classData) ? classData : []);
        setSubjects(
          (Array.isArray(subjectData) ? subjectData : []).filter(
            (subject: NamedOption) => subject.isActive !== false,
          ),
        );
        setRooms(Array.isArray(roomData) ? roomData : []);
        const current =
          yearList.find((year) => year.isCurrent) ??
          yearList.find((year) => year.status === 'ACTIVE') ??
          yearList[0];
        if (current) setForm((previous) => ({ ...previous, academicYearId: current.id }));
      } catch (err: any) {
        if (!cancelled) setError(err?.message || 'Could not load the timetable setup.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  // Teachers are paginated; pull every page so the combobox can search them all.
  useEffect(() => {
    let cancelled = false;
    async function loadTeachers() {
      setLoadingTeachers(true);
      try {
        const collected: NamedOption[] = [];
        let page = 1;
        let totalPages = 1;
        do {
          const data = await apiFetch(`/teachers?limit=100&page=${page}`);
          const items: NamedOption[] = Array.isArray(data) ? data : data?.items ?? [];
          collected.push(...items);
          totalPages = Array.isArray(data) ? 1 : data?.meta?.totalPages ?? 1;
          page += 1;
        } while (page <= totalPages && page <= 20 && !cancelled);
        if (!cancelled) setTeachers(collected);
      } catch {
        if (!cancelled) setTeachers([]);
      } finally {
        if (!cancelled) setLoadingTeachers(false);
      }
    }
    loadTeachers();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    setTerms([]);
    setForm((previous) => ({ ...previous, termId: '' }));
    if (!form.academicYearId) return;
    let cancelled = false;
    apiFetch(`/academic-terms/by-year/${form.academicYearId}`)
      .then((data) => {
        if (cancelled) return;
        const list: NamedOption[] = Array.isArray(data) ? data : [];
        setTerms(list);
        const active = list.find((term) => term.status === 'ACTIVE') ?? list[0];
        if (active) setForm((previous) => ({ ...previous, termId: active.id }));
      })
      .catch(() => {
        if (!cancelled) setTerms([]);
      });
    return () => {
      cancelled = true;
    };
  }, [form.academicYearId]);

  useEffect(() => {
    setSections([]);
    setClassSubjectIds(null);
    setForm((previous) => ({ ...previous, sectionId: '', subjectId: '' }));
    if (!form.classId) return;
    let cancelled = false;
    setLoadingSections(true);
    Promise.all([
      apiFetch(`/sections/by-class/${form.classId}`),
      apiFetch(`/class-subjects/by-class/${form.classId}`),
    ])
      .then(([sectionData, assignmentData]) => {
        if (cancelled) return;
        setSections(
          (Array.isArray(sectionData) ? sectionData : []).filter(
            (section: NamedOption) => section.isActive !== false,
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

  const teacherOptions = useMemo(
    () =>
      teachers.map((teacher) => {
        const name = `${teacher.firstName ?? ''} ${teacher.lastName ?? ''}`.trim() || teacher.name;
        return {
          value: teacher.id,
          label: name,
          description: teacher.employeeId ?? undefined,
        };
      }),
    [teachers],
  );

  function validate() {
    const errors: Record<string, string> = {};
    if (!form.academicYearId) errors.academicYearId = 'Select an academic year.';
    if (!form.classId) errors.classId = 'Select a class.';
    if (!form.subjectId) errors.subjectId = 'Select a subject.';
    if (!form.teacherId) errors.teacherId = 'Select a teacher.';
    if (!form.startTime) errors.startTime = 'Start time is required.';
    if (!form.endTime) errors.endTime = 'End time is required.';
    if (form.startTime && form.endTime && form.endTime <= form.startTime) {
      errors.endTime = 'End time must be after the start time.';
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (saving) return;
    setError('');
    if (!validate()) {
      showFeedback('WARNING', 'Please complete the required fields.');
      return;
    }

    setSaving(true);
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
          dayOfWeek: Number(form.dayOfWeek),
          startTime: form.startTime,
          endTime: form.endTime,
        }),
      });
      showFeedback('SUCCESS', 'Timetable entry created.');
      router.push('/dashboard/academics/timetable');
    } catch (err: any) {
      const message = err?.message || 'Could not create the timetable entry.';
      setError(message);
      showFeedback('ERROR', message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/dashboard/academics/timetable"
          className="flex h-11 w-11 items-center justify-center rounded-xl border border-warm-200 bg-card text-warm-600 transition-colors hover:text-charcoal-900"
          aria-label="Back to timetable"
        >
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h1 className="flex items-center gap-2.5 text-2xl font-bold tracking-tight text-charcoal-900 sm:text-3xl">
            <Clock className="h-6 w-6 text-forest-700" />
            New Timetable Entry
          </h1>
          <p className="mt-0.5 text-xs font-medium text-warm-500 sm:text-sm">
            Schedule one class period with its subject, teacher and room.
          </p>
        </div>
      </div>

      {error && <FormError message={error} />}

      {loading ? (
        <div className="flex items-center justify-center gap-2 py-16 text-sm font-medium text-warm-500">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading timetable setup…
        </div>
      ) : (
        <form
          onSubmit={handleSubmit}
          className="space-y-6 rounded-2xl border border-warm-200 bg-card p-5 shadow-xs sm:p-8"
          noValidate
        >
          <FormSection title="Term and day">
            <FormGrid>
              <Select
                label="Academic year *"
                value={form.academicYearId}
                error={fieldErrors.academicYearId}
                placeholder="Select academic year"
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
              <Select
                label="Day of week *"
                value={form.dayOfWeek}
                options={DAYS}
                onChange={(event) => setForm({ ...form, dayOfWeek: event.target.value })}
              />
              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Start time *"
                  type="time"
                  required
                  value={form.startTime}
                  error={fieldErrors.startTime}
                  onChange={(event) => setForm({ ...form, startTime: event.target.value })}
                />
                <Input
                  label="End time *"
                  type="time"
                  required
                  value={form.endTime}
                  error={fieldErrors.endTime}
                  onChange={(event) => setForm({ ...form, endTime: event.target.value })}
                />
              </div>
            </FormGrid>
          </FormSection>

          <FormSection
            title="Class and subject"
            description="Sections and subjects are limited to what the selected class actually runs."
          >
            <FormGrid>
              <Select
                label="Class *"
                value={form.classId}
                error={fieldErrors.classId}
                placeholder="Select class"
                options={classes.map((clazz) => ({
                  value: clazz.id,
                  label: clazz.name,
                  description: clazz.code ?? undefined,
                  disabled: clazz.isActive === false,
                }))}
                onChange={(event) => setForm({ ...form, classId: event.target.value })}
              />
              <Select
                label="Section"
                value={form.sectionId}
                loading={loadingSections}
                placeholder={
                  !form.classId
                    ? 'Select a class first'
                    : sections.length
                      ? 'All sections'
                      : 'No active sections'
                }
                disabled={!form.classId || loadingSections || sections.length === 0}
                options={sections.map((section) => ({
                  value: section.id,
                  label: section.name,
                  description: section.code ?? undefined,
                }))}
                onChange={(event) => setForm({ ...form, sectionId: event.target.value })}
              />
              <Select
                label="Subject *"
                value={form.subjectId}
                error={fieldErrors.subjectId}
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
                error={fieldErrors.teacherId}
                searchable
                loading={loadingTeachers}
                placeholder="Select teacher"
                options={teacherOptions}
                emptyMessage="No teachers registered yet."
                onChange={(event) => setForm({ ...form, teacherId: event.target.value })}
              />
              <Select
                label="Room"
                value={form.roomId}
                placeholder={rooms.length ? 'No room assigned' : 'No rooms registered'}
                disabled={rooms.length === 0}
                options={[
                  { value: '', label: 'No room assigned' },
                  ...rooms.map((room) => ({
                    value: room.id,
                    label: room.name,
                    description: room.code ?? undefined,
                  })),
                ]}
                helperText="Optional. Add rooms under Timetable → Rooms."
                onChange={(event) => setForm({ ...form, roomId: event.target.value })}
              />
            </FormGrid>
          </FormSection>

          <FormActions>
            <Link
              href="/dashboard/academics/timetable"
              className="rounded-xl border border-warm-200 px-5 py-2.5 text-center text-xs font-bold text-warm-600 transition-colors hover:bg-warm-50"
            >
              Cancel
            </Link>
            <Button type="submit" size="lg" isLoading={saving} leftIcon={<Save size={16} />}>
              Save entry
            </Button>
          </FormActions>
        </form>
      )}
    </div>
  );
}
