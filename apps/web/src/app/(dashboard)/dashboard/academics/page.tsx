'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { apiFetch } from '@/lib/api/client';
import { useAuth } from '@/context/auth-context';
import { collectUserRoles } from '@/lib/auth/roles';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { showFeedback } from '@/components/layout/global-feedback';
import {
  ArrowRight,
  BookOpen,
  Calendar,
  ChevronRight,
  Clock,
  GraduationCap,
  LayoutGrid,
  Loader2,
  RefreshCw,
  Users,
} from 'lucide-react';

interface ClassRow {
  id: string;
  name: string;
  code: string;
  isActive: boolean;
  _count?: { sections: number; enrollments: number };
}

interface YearOption {
  id: string;
  name: string;
  isCurrent: boolean;
}

interface EnrollmentRow {
  id: string;
  status: string;
  studentId: string;
  academicYearId: string;
  academicYear?: { name: string };
  class?: { id: string; name: string };
  section?: { id: string; name: string } | null;
  student: { id: string; firstName: string; lastName: string; studentNumber: string };
}

interface Option {
  id: string;
  name: string;
}

export default function AcademicsDashboard() {
  const { user, activeSchoolId } = useAuth();
  const roles = useMemo(() => collectUserRoles(user, activeSchoolId), [user, activeSchoolId]);
  const canPromote = roles.some((role) => ['SCHOOL_ADMIN', 'PRINCIPAL'].includes(role));

  const [years, setYears] = useState<YearOption[]>([]);
  const [classes, setClasses] = useState<ClassRow[]>([]);
  const [subjectCount, setSubjectCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [promoteOpen, setPromoteOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [yearData, classData, subjectData] = await Promise.all([
        apiFetch('/academic-years'),
        apiFetch('/classes'),
        apiFetch('/subjects'),
      ]);
      setYears(Array.isArray(yearData) ? yearData : []);
      setClasses(Array.isArray(classData) ? classData : []);
      setSubjectCount(Array.isArray(subjectData) ? subjectData.length : 0);
    } catch (err: any) {
      setError(err?.message || 'Could not load academic operations.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const currentYear = years.find((year) => year.isCurrent);
  const totalEnrollments = classes.reduce(
    (sum, clazz) => sum + (clazz._count?.enrollments ?? 0),
    0,
  );
  const maxEnrollment = Math.max(1, ...classes.map((clazz) => clazz._count?.enrollments ?? 0));

  const modules = [
    { name: 'Academic Years', description: 'Years, terms and the current session', href: '/dashboard/academics/years', icon: Calendar, color: 'bg-forest-600' },
    { name: 'Classes', description: 'Grade levels, streams and curriculum', href: '/dashboard/academics/classes', icon: GraduationCap, color: 'bg-success-600' },
    { name: 'Subjects', description: 'The subject catalogue for results', href: '/dashboard/academics/subjects', icon: BookOpen, color: 'bg-terracotta-500' },
    { name: 'Student Enrollments', description: 'Placements and active status', href: '/dashboard/academics/enrollments', icon: Users, color: 'bg-forest-600' },
    { name: 'Timetable', description: 'Schedules and lesson periods', href: '/dashboard/academics/timetable', icon: Clock, color: 'bg-warning-600' },
    { name: 'Rooms & Spaces', description: 'Classrooms and facility capacity', href: '/dashboard/academics/rooms', icon: LayoutGrid, color: 'bg-success-600' },
    { name: 'Academic Calendar', description: 'Term dates and key milestones', href: '/dashboard/academics/calendar', icon: Calendar, color: 'bg-terracotta-500' },
  ];

  return (
    <div className="space-y-6 sm:space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-charcoal-900 sm:text-3xl">
            Academic Operations
          </h1>
          <p className="mt-1 text-xs font-medium text-warm-500 sm:text-sm">
            The institutional structure behind enrollment, attendance and results.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-xl border border-sage-200 bg-sage-50 px-3 py-2 text-[11px] font-bold uppercase tracking-wide text-forest-800">
            Active year: {currentYear?.name ?? 'None set'}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={load}
            disabled={loading}
            leftIcon={<RefreshCw size={14} className={loading ? 'animate-spin' : undefined} />}
          >
            Refresh
          </Button>
        </div>
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

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Metric label="Academic years" value={years.length} />
        <Metric label="Classes" value={classes.length} />
        <Metric label="Subjects" value={subjectCount} />
        <Metric label="Enrollments" value={totalEnrollments} />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {modules.map((module) => (
          <Link
            key={module.name}
            href={module.href}
            className="group block rounded-2xl border border-warm-200 bg-card p-5 shadow-xs transition-all hover:border-sage-300 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest-600/30"
          >
            <div className="mb-4 flex items-start justify-between">
              <div className={`${module.color} rounded-xl p-3 text-ivory-50 transition-transform group-hover:scale-105`}>
                <module.icon size={20} />
              </div>
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-ivory-50 text-warm-400 transition-colors group-hover:bg-sage-50 group-hover:text-forest-700">
                <ChevronRight size={18} />
              </div>
            </div>
            <h2 className="text-base font-bold text-charcoal-900 transition-colors group-hover:text-forest-800">
              {module.name}
            </h2>
            <p className="mt-1 text-xs font-medium leading-relaxed text-warm-500">{module.description}</p>
            <div className="mt-4 flex items-center gap-2 text-[10px] font-bold uppercase tracking-wide text-forest-700 transition-all group-hover:gap-3">
              Open module <ArrowRight size={12} />
            </div>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <section className="rounded-2xl border border-warm-200 bg-card p-5 shadow-xs lg:col-span-2 sm:p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-charcoal-900">Class strength</h2>
            <Link
              href="/dashboard/academics/classes"
              className="text-[11px] font-bold uppercase tracking-wide text-forest-700 hover:underline"
            >
              Manage classes
            </Link>
          </div>

          {loading ? (
            <p className="flex items-center gap-2 py-8 text-sm text-warm-500">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading class strength…
            </p>
          ) : classes.length === 0 ? (
            <div className="mt-4 rounded-xl border border-dashed border-warm-300 p-6 text-center">
              <p className="text-sm font-semibold text-charcoal-900">No classes configured</p>
              <p className="mt-1 text-xs text-warm-500">
                Create a class before registering or enrolling students.
              </p>
              <Link
                href="/dashboard/academics/classes"
                className="mt-3 inline-flex items-center gap-2 rounded-lg bg-forest-800 px-3.5 py-2 text-xs font-bold text-ivory-50 hover:bg-forest-900"
              >
                Add a class <ArrowRight size={12} />
              </Link>
            </div>
          ) : (
            <ul className="mt-4 space-y-3">
              {classes.map((clazz) => {
                const count = clazz._count?.enrollments ?? 0;
                return (
                  <li key={clazz.id}>
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span className="text-charcoal-800">
                        {clazz.name}{' '}
                        <span className="font-normal text-warm-500">
                          · {clazz._count?.sections ?? 0} section
                          {(clazz._count?.sections ?? 0) === 1 ? '' : 's'}
                        </span>
                      </span>
                      <span className="text-warm-600">{count} enrolled</span>
                    </div>
                    <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-warm-100">
                      <div
                        className="h-full rounded-full bg-forest-600"
                        style={{ width: `${Math.max(2, (count / maxEnrollment) * 100)}%` }}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <section className="flex flex-col rounded-2xl bg-charcoal-900 p-5 text-ivory-50 shadow-xs sm:p-6">
          <GraduationCap className="mb-4 text-forest-400" size={32} />
          <h2 className="text-lg font-bold">Promotion Center</h2>
          <p className="mt-1 flex-1 text-xs leading-relaxed text-warm-300">
            Move an active student into the next academic year and class. The current enrollment is
            closed as promoted and a new active enrollment is created.
          </p>
          <Button
            variant="secondary"
            className="mt-5 w-full"
            disabled={!canPromote || years.length === 0 || classes.length === 0}
            onClick={() => setPromoteOpen(true)}
            rightIcon={<ArrowRight size={14} />}
          >
            Start promotion
          </Button>
          {!canPromote && (
            <p className="mt-2 text-[10px] font-semibold uppercase tracking-wide text-warm-400">
              Available to school administrators and principals.
            </p>
          )}
        </section>
      </div>

      {promoteOpen && (
        <PromotionModal
          years={years}
          classes={classes}
          onClose={() => setPromoteOpen(false)}
          onPromoted={() => {
            setPromoteOpen(false);
            load();
          }}
        />
      )}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-warm-200 bg-card px-4 py-3 shadow-xs">
      <p className="text-[10px] font-bold uppercase tracking-wide text-warm-500">{label}</p>
      <p className="mt-0.5 text-xl font-bold text-charcoal-900">{value}</p>
    </div>
  );
}

function PromotionModal({
  years,
  classes,
  onClose,
  onPromoted,
}: {
  years: YearOption[];
  classes: ClassRow[];
  onClose: () => void;
  onPromoted: () => void;
}) {
  const [fromYearId, setFromYearId] = useState(
    years.find((year) => year.isCurrent)?.id ?? years[0]?.id ?? '',
  );
  const [toYearId, setToYearId] = useState(years.find((year) => !year.isCurrent)?.id ?? '');
  const [toClassId, setToClassId] = useState('');
  const [toSectionId, setToSectionId] = useState('');
  const [sections, setSections] = useState<Option[]>([]);
  const [enrollments, setEnrollments] = useState<EnrollmentRow[]>([]);
  const [studentId, setStudentId] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const loadStudents = useCallback(async () => {
    if (!fromYearId) return;
    setLoading(true);
    setError('');
    setStudentId('');
    try {
      const data = await apiFetch('/enrollments');
      const list: EnrollmentRow[] = Array.isArray(data) ? data : [];
      setEnrollments(
        list.filter(
          (enrollment) => enrollment.status === 'ACTIVE' && enrollment.academicYearId === fromYearId,
        ),
      );
    } catch (err: any) {
      setEnrollments([]);
      setError(err?.message || 'Could not load eligible students.');
    } finally {
      setLoading(false);
    }
  }, [fromYearId]);

  useEffect(() => {
    loadStudents();
  }, [loadStudents]);

  useEffect(() => {
    setSections([]);
    setToSectionId('');
    if (!toClassId) return;
    apiFetch(`/sections/by-class/${toClassId}`)
      .then((data) => {
        const list = Array.isArray(data) ? data : [];
        setSections(list.filter((section: any) => section.isActive !== false));
      })
      .catch(() => setSections([]));
  }, [toClassId]);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (saving) return;
    if (!studentId || !fromYearId || !toYearId || !toClassId) {
      setError('Select the student, both academic years and the destination class.');
      return;
    }
    if (fromYearId === toYearId) {
      setError('The destination year must be different from the current year.');
      return;
    }
    const selected = enrollments.find((enrollment) => enrollment.studentId === studentId);
    if (!selected) {
      setError('Select an actively enrolled student.');
      return;
    }
    if (!window.confirm(`Promote ${selected.student.firstName} ${selected.student.lastName}?`)) return;

    setSaving(true);
    setError('');
    try {
      await apiFetch(`/classes/${selected.class?.id ?? toClassId}/promote`, {
        method: 'POST',
        body: JSON.stringify({
          studentId,
          fromAcademicYearId: fromYearId,
          toAcademicYearId: toYearId,
          toClassId,
          ...(toSectionId ? { toSectionId } : {}),
        }),
      });
      showFeedback('SUCCESS', 'Student promoted to the new academic year.');
      onPromoted();
    } catch (err: any) {
      setError(err?.message || 'Could not promote the student.');
    } finally {
      setSaving(false);
    }
  }

  const selected = enrollments.find((enrollment) => enrollment.studentId === studentId);

  return (
    <Modal
      isOpen
      onClose={onClose}
      title="Promote a student"
      size="lg"
      footerActions={
        <>
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" form="promotion-form" isLoading={saving}>
            Promote student
          </Button>
        </>
      }
    >
      <form id="promotion-form" onSubmit={submit} className="space-y-4">
        {error && (
          <p role="alert" className="rounded-lg bg-danger-50 p-3 text-xs font-semibold text-danger-700">
            {error}
          </p>
        )}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Select
            label="From academic year *"
            value={fromYearId}
            placeholder="Select year"
            options={years.map((year) => ({ value: year.id, label: year.name }))}
            onChange={(event) => setFromYearId(event.target.value)}
          />
          <Select
            label="To academic year *"
            value={toYearId}
            placeholder="Select destination year"
            options={years
              .filter((year) => year.id !== fromYearId)
              .map((year) => ({ value: year.id, label: year.name }))}
            onChange={(event) => setToYearId(event.target.value)}
          />
        </div>

        {loading ? (
          <p className="flex items-center gap-2 py-4 text-sm text-warm-500">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading enrolled students…
          </p>
        ) : enrollments.length === 0 ? (
          <p className="rounded-lg bg-warning-50 p-3 text-xs font-medium text-warning-800">
            No active enrollments in the selected year. Enroll students first from the Enrollments
            page.
          </p>
        ) : (
          <Select
            label="Student *"
            value={studentId}
            placeholder="Select an active student"
            options={enrollments.map((enrollment) => ({
              value: enrollment.studentId,
              label: `${enrollment.student.firstName} ${enrollment.student.lastName} — ${enrollment.student.studentNumber} (${enrollment.class?.name ?? 'No class'})`,
            }))}
            onChange={(event) => setStudentId(event.target.value)}
          />
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Select
            label="Destination class *"
            value={toClassId}
            placeholder="Select class"
            options={classes
              .filter((clazz) => clazz.isActive)
              .map((clazz) => ({ value: clazz.id, label: clazz.name }))}
            onChange={(event) => setToClassId(event.target.value)}
          />
          <Select
            label="Destination section"
            value={toSectionId}
            placeholder={
              !toClassId ? 'Select a class first' : sections.length ? 'No section' : 'No active sections'
            }
            disabled={!toClassId || sections.length === 0}
            options={[{ value: '', label: 'No section' }, ...sections.map((section) => ({ value: section.id, label: section.name }))]}
            onChange={(event) => setToSectionId(event.target.value)}
          />
        </div>

        {selected && (
          <p className="rounded-lg bg-ivory-50 p-3 text-xs text-warm-600">
            Currently in <strong>{selected.class?.name ?? '—'}</strong>
            {selected.section ? ` · ${selected.section.name}` : ''} for{' '}
            <strong>{selected.academicYear?.name ?? 'this year'}</strong>. This enrollment will be
            marked as promoted.
          </p>
        )}
      </form>
    </Modal>
  );
}
