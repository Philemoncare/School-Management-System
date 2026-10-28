'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
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
  ArrowLeft,
  BarChart3,
  CheckCircle2,
  ClipboardList,
  Loader2,
  PencilLine,
  Plus,
  RefreshCw,
  Send,
  UploadCloud,
} from 'lucide-react';

interface Option {
  id: string;
  name: string;
  code?: string;
  isCurrent?: boolean;
  status?: string;
  isActive?: boolean;
}

interface Assessment {
  id: string;
  name: string;
  code: string;
  status: string;
  totalMarks: number;
  weight: number;
  startDate?: string | null;
  endDate?: string | null;
  description?: string | null;
  assessmentType?: { name: string };
  class?: { name: string };
  section?: { name: string } | null;
  subject?: { name: string };
  academicYear?: { name: string };
  term?: { name: string } | null;
  _count?: { scores: number };
}

const STATUS_STYLES: Record<string, string> = {
  DRAFT: 'bg-warm-100 text-warm-700',
  SCHEDULED: 'bg-sage-100 text-forest-800',
  OPEN: 'bg-sage-100 text-forest-800',
  SUBMISSION_OPEN: 'bg-sage-100 text-forest-800',
  SUBMITTED: 'bg-warning-100 text-warning-800',
  UNDER_REVIEW: 'bg-warning-100 text-warning-800',
  APPROVED: 'bg-success-100 text-success-800',
  PUBLISHED: 'bg-success-100 text-success-800',
  LOCKED: 'bg-charcoal-100 text-charcoal-800',
  CANCELLED: 'bg-danger-100 text-danger-700',
};

const today = () => new Date().toISOString().slice(0, 10);

export default function AssessmentsListPage() {
  const { user, activeSchoolId } = useAuth();
  const roles = useMemo(() => collectUserRoles(user, activeSchoolId), [user, activeSchoolId]);
  const canManage = roles.some((role) => ['SCHOOL_ADMIN', 'PRINCIPAL', 'TEACHER'].includes(role));

  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [editAssessment, setEditAssessment] = useState<Assessment | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await apiFetch('/assessments');
      setAssessments(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setAssessments([]);
      setError(err?.message || 'Could not load assessments.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function changeStatus(assessment: Assessment, action: 'submit' | 'publish') {
    const label = action === 'submit' ? 'submit for review' : 'publish';
    if (!window.confirm(`Are you sure you want to ${label} “${assessment.name}”?`)) return;
    setBusyId(assessment.id);
    try {
      await apiFetch(`/assessments/${assessment.id}/${action}`, { method: 'POST' });
      showFeedback('SUCCESS', action === 'submit' ? 'Assessment submitted.' : 'Assessment published.');
      await load();
    } catch (err: any) {
      showFeedback('ERROR', err?.message || `Could not ${label} the assessment.`);
    } finally {
      setBusyId(null);
    }
  }

  const visible = assessments.filter((assessment) => {
    if (statusFilter && assessment.status !== statusFilter) return false;
    const needle = search.trim().toLowerCase();
    if (!needle) return true;
    return (
      assessment.name.toLowerCase().includes(needle) ||
      assessment.code.toLowerCase().includes(needle) ||
      (assessment.subject?.name ?? '').toLowerCase().includes(needle) ||
      (assessment.class?.name ?? '').toLowerCase().includes(needle)
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link
            href="/dashboard/assessments"
            className="mb-2 inline-flex items-center gap-1.5 text-xs font-semibold text-warm-600 hover:text-charcoal-900"
          >
            <ArrowLeft size={14} /> Examination Hub
          </Link>
          <h1 className="text-2xl font-bold tracking-tight text-charcoal-900 sm:text-3xl">Assessments</h1>
          <p className="mt-0.5 text-xs font-medium text-warm-500 sm:text-sm">
            Create assessments, enter scores, then submit and publish results.
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
          {canManage && (
            <Button onClick={() => setCreateOpen(true)} leftIcon={<Plus size={16} />}>
              New Assessment
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Input
          type="search"
          aria-label="Search assessments"
          placeholder="Search name, code, subject or class…"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
        <Select
          aria-label="Filter by status"
          value={statusFilter}
          placeholder="All statuses"
          options={[
            { value: '', label: 'All statuses' },
            ...Object.keys(STATUS_STYLES).map((status) => ({ value: status, label: status.replaceAll('_', ' ') })),
          ]}
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

      {loading && assessments.length === 0 ? (
        <div className="flex items-center justify-center gap-2 py-16 text-sm font-medium text-warm-500">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading assessments…
        </div>
      ) : visible.length === 0 && !error ? (
        <EmptyState
          icon={<ClipboardList className="h-8 w-8" />}
          title={search || statusFilter ? 'No matching assessments' : 'No assessments yet'}
          description={
            search || statusFilter
              ? 'Clear the filters or try a different search.'
              : 'Create an assessment for a class and subject, then enter scores and publish the results.'
          }
          actionButton={
            canManage && !search && !statusFilter ? (
              <Button onClick={() => setCreateOpen(true)} leftIcon={<Plus size={16} />}>
                New Assessment
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="overflow-hidden rounded-xl border border-warm-200 bg-card shadow-xs">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-warm-200">
              <caption className="sr-only">Assessments</caption>
              <thead className="bg-ivory-50">
                <tr>
                  {['Assessment', 'Class', 'Subject', 'Marks', 'Scores', 'Status', 'Actions'].map((heading) => (
                    <th
                      key={heading}
                      scope="col"
                      className={`px-4 py-3 text-[11px] font-bold uppercase tracking-wide text-warm-500 sm:px-5 ${
                        heading === 'Actions' ? 'text-right' : 'text-left'
                      }`}
                    >
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-warm-100">
                {visible.map((assessment) => (
                  <tr key={assessment.id} className="transition-colors hover:bg-sage-50/30">
                    <td className="px-4 py-3.5 sm:px-5">
                      <p className="text-sm font-semibold text-charcoal-900">{assessment.name}</p>
                      <p className="text-[11px] text-warm-500">
                        {assessment.assessmentType?.name ?? 'Assessment'} ·{' '}
                        <span className="font-mono">{assessment.code}</span>
                      </p>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3.5 text-xs text-warm-600 sm:px-5">
                      {assessment.class?.name ?? '—'}
                      {assessment.section?.name ? ` · ${assessment.section.name}` : ''}
                      {assessment.term?.name && (
                        <span className="block text-[10px] text-warm-400">{assessment.term.name}</span>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3.5 text-xs text-warm-600 sm:px-5">
                      {assessment.subject?.name ?? '—'}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3.5 text-xs text-warm-600 sm:px-5">
                      {Number(assessment.totalMarks)}
                      <span className="block text-[10px] text-warm-400">
                        weight {Number(assessment.weight ?? 1).toFixed(2)}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3.5 text-xs text-warm-600 sm:px-5">
                      {assessment._count?.scores ?? 0} entered
                    </td>
                    <td className="whitespace-nowrap px-4 py-3.5 sm:px-5">
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase ${
                          STATUS_STYLES[assessment.status] ?? 'bg-warm-100 text-warm-700'
                        }`}
                      >
                        {assessment.status.replaceAll('_', ' ')}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3.5 text-right sm:px-5">
                      <div className="flex flex-wrap items-center justify-end gap-1.5">
                        <Link
                          href={`/dashboard/assessments/${assessment.id}/scores`}
                          className="inline-flex items-center gap-1 rounded-lg border border-warm-200 px-2.5 py-1.5 text-[11px] font-bold text-forest-800 hover:bg-sage-50"
                        >
                          <BarChart3 size={12} /> Scores
                        </Link>
                        {canManage && assessment.status === 'DRAFT' && (
                          <Button
                            variant="ghost"
                            size="xs"
                            onClick={() => changeStatus(assessment, 'submit')}
                            isLoading={busyId === assessment.id}
                            leftIcon={<Send size={12} />}
                          >
                            Submit
                          </Button>
                        )}
                        {canManage && ['SUBMITTED', 'APPROVED', 'UNDER_REVIEW'].includes(assessment.status) && (
                          <Button
                            variant="ghost"
                            size="xs"
                            onClick={() => changeStatus(assessment, 'publish')}
                            isLoading={busyId === assessment.id}
                            leftIcon={<UploadCloud size={12} />}
                          >
                            Publish
                          </Button>
                        )}
                        {canManage && !['LOCKED', 'PUBLISHED', 'CANCELLED'].includes(assessment.status) && (
                          <Button
                            variant="outline"
                            size="xs"
                            onClick={() => setEditAssessment(assessment)}
                            leftIcon={<PencilLine size={12} />}
                          >
                            Edit
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {createOpen && (
        <AssessmentFormModal
          onClose={() => setCreateOpen(false)}
          onSaved={() => {
            setCreateOpen(false);
            load();
          }}
        />
      )}

      {editAssessment && (
        <AssessmentFormModal
          assessment={editAssessment}
          onClose={() => setEditAssessment(null)}
          onSaved={() => {
            setEditAssessment(null);
            load();
          }}
        />
      )}
    </div>
  );
}

function AssessmentFormModal({
  assessment,
  onClose,
  onSaved,
}: {
  assessment?: Assessment;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [years, setYears] = useState<Option[]>([]);
  const [terms, setTerms] = useState<Option[]>([]);
  const [types, setTypes] = useState<Option[]>([]);
  const [classes, setClasses] = useState<Option[]>([]);
  const [sections, setSections] = useState<Option[]>([]);
  const [subjects, setSubjects] = useState<Option[]>([]);
  const [optionsLoading, setOptionsLoading] = useState(!assessment);

  const [form, setForm] = useState({
    academicYearId: '',
    termId: '',
    assessmentTypeId: '',
    name: assessment?.name ?? '',
    code: assessment?.code ?? '',
    classId: '',
    sectionId: '',
    subjectId: '',
    totalMarks: assessment ? String(assessment.totalMarks) : '100',
    weight: assessment ? String(assessment.weight ?? 1) : '1',
    startDate: assessment?.startDate ? String(assessment.startDate).slice(0, 10) : today(),
    endDate: assessment?.endDate ? String(assessment.endDate).slice(0, 10) : '',
    description: assessment?.description ?? '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (assessment) return;
    let cancelled = false;
    async function load() {
      setOptionsLoading(true);
      try {
        const [yearData, typeData, classData, subjectData] = await Promise.all([
          apiFetch('/academic-years'),
          apiFetch('/assessments/types'),
          apiFetch('/classes'),
          apiFetch('/subjects'),
        ]);
        if (cancelled) return;
        const yearList: Option[] = Array.isArray(yearData) ? yearData : [];
        const typeList: Option[] = Array.isArray(typeData) ? typeData : [];
        setYears(yearList);
        setTypes(typeList);
        setClasses(Array.isArray(classData) ? classData : []);
        setSubjects(
          (Array.isArray(subjectData) ? subjectData : []).filter((subject: any) => subject.isActive !== false),
        );
        const current = yearList.find((year) => year.isCurrent) ?? yearList[0];
        setForm((previous) => ({
          ...previous,
          academicYearId: current?.id ?? '',
          assessmentTypeId: typeList[0]?.id ?? '',
        }));
      } catch (err: any) {
        if (!cancelled) setError(err?.message || 'Could not load assessment setup.');
      } finally {
        if (!cancelled) setOptionsLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [assessment]);

  useEffect(() => {
    if (assessment) return;
    setTerms([]);
    setForm((previous) => ({ ...previous, termId: '' }));
    if (!form.academicYearId) return;
    apiFetch(`/academic-terms/by-year/${form.academicYearId}`)
      .then((data) => {
        const list: Option[] = Array.isArray(data) ? data : [];
        setTerms(list);
        const active = list.find((term) => term.status === 'ACTIVE');
        if (active) setForm((previous) => ({ ...previous, termId: active.id }));
      })
      .catch(() => setTerms([]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.academicYearId]);

  useEffect(() => {
    if (assessment) return;
    setSections([]);
    setForm((previous) => ({ ...previous, sectionId: '' }));
    if (!form.classId) return;
    apiFetch(`/sections/by-class/${form.classId}`)
      .then((data) => {
        setSections((Array.isArray(data) ? data : []).filter((section: any) => section.isActive !== false));
      })
      .catch(() => setSections([]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.classId]);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (saving) return;
    setError('');
    if (assessment) {
      if (!form.name.trim() || !form.code.trim()) {
        setError('Name and code are required.');
        return;
      }
    } else if (
      !form.academicYearId ||
      !form.assessmentTypeId ||
      !form.classId ||
      !form.subjectId ||
      !form.name.trim() ||
      !form.code.trim() ||
      !form.totalMarks
    ) {
      setError('Academic year, type, class, subject, name, code and total marks are required.');
      return;
    }

    setSaving(true);
    try {
      if (assessment) {
        await apiFetch(`/assessments/${assessment.id}`, {
          method: 'PATCH',
          body: JSON.stringify({
            name: form.name.trim(),
            code: form.code.trim().toUpperCase(),
            description: form.description.trim() || undefined,
            totalMarks: Number(form.totalMarks),
            weight: Number(form.weight || 1),
          }),
        });
        showFeedback('SUCCESS', 'Assessment updated.');
      } else {
        await apiFetch('/assessments', {
          method: 'POST',
          body: JSON.stringify({
            academicYearId: form.academicYearId,
            termId: form.termId || undefined,
            assessmentTypeId: form.assessmentTypeId,
            name: form.name.trim(),
            code: form.code.trim().toUpperCase(),
            classId: form.classId,
            sectionId: form.sectionId || undefined,
            subjectId: form.subjectId,
            totalMarks: Number(form.totalMarks),
            weight: Number(form.weight || 1),
            startDate: form.startDate || undefined,
            endDate: form.endDate || undefined,
            description: form.description.trim() || undefined,
          }),
        });
        showFeedback('SUCCESS', 'Assessment created.');
      }
      onSaved();
    } catch (err: any) {
      setError(err?.message || 'Could not save the assessment.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      isOpen
      onClose={onClose}
      title={assessment ? 'Edit assessment' : 'New assessment'}
      size="lg"
      footerActions={
        <>
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" form="assessment-form" isLoading={saving} leftIcon={<CheckCircle2 size={16} />}>
            {assessment ? 'Save changes' : 'Create assessment'}
          </Button>
        </>
      }
    >
      {optionsLoading ? (
        <p className="flex items-center gap-2 py-8 text-sm text-warm-500">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading assessment setup…
        </p>
      ) : (
        <form id="assessment-form" onSubmit={submit} className="space-y-4">
          {error && (
            <p role="alert" className="rounded-lg bg-danger-50 p-3 text-xs font-semibold text-danger-700">
              {error}
            </p>
          )}

          {!assessment && types.length === 0 && (
            <p className="rounded-lg bg-warning-50 p-3 text-xs font-medium text-warning-800">
              No assessment types exist yet. Create an evaluation type first.
            </p>
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {!assessment && (
              <>
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
                <Select
                  label="Assessment type *"
                  value={form.assessmentTypeId}
                  placeholder={types.length ? 'Select type' : 'Create a type first'}
                  disabled={types.length === 0}
                  options={types.map((type) => ({ value: type.id, label: type.name }))}
                  onChange={(event) => setForm({ ...form, assessmentTypeId: event.target.value })}
                />
                <Select
                  label="Class *"
                  value={form.classId}
                  placeholder="Select class"
                  options={classes.map((clazz) => ({ value: clazz.id, label: clazz.name }))}
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
                  label="Subject *"
                  value={form.subjectId}
                  placeholder="Select subject"
                  options={subjects.map((subject) => ({ value: subject.id, label: `${subject.name} (${subject.code})` }))}
                  onChange={(event) => setForm({ ...form, subjectId: event.target.value })}
                />
              </>
            )}
            <Input
              label="Assessment name *"
              required
              placeholder="Mid-term Test"
              value={form.name}
              onChange={(event) => setForm({ ...form, name: event.target.value })}
            />
            <Input
              label="Code *"
              required
              placeholder="MID-T1"
              value={form.code}
              onChange={(event) => setForm({ ...form, code: event.target.value })}
            />
            <Input
              label="Total marks *"
              type="number"
              min={1}
              required
              value={form.totalMarks}
              onChange={(event) => setForm({ ...form, totalMarks: event.target.value })}
            />
            <Input
              label="Weight"
              type="number"
              min={0}
              max={1}
              step="0.01"
              value={form.weight}
              helperText="0.4 means 40% of the term score."
              onChange={(event) => setForm({ ...form, weight: event.target.value })}
            />
            {!assessment && (
              <>
                <Input
                  label="Start date"
                  type="date"
                  value={form.startDate}
                  onChange={(event) => setForm({ ...form, startDate: event.target.value })}
                />
                <Input
                  label="End date"
                  type="date"
                  value={form.endDate}
                  onChange={(event) => setForm({ ...form, endDate: event.target.value })}
                />
              </>
            )}
          </div>
          <Input
            label="Description"
            placeholder="Optional description shown to teachers"
            value={form.description}
            onChange={(event) => setForm({ ...form, description: event.target.value })}
          />
        </form>
      )}
    </Modal>
  );
}
