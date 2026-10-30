'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { apiFetch } from '@/lib/api/client';
import { Button } from '@/components/ui/button';
import { Input, Select } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { EmptyState } from '@/components/ui/empty-state';
import { showFeedback } from '@/components/layout/global-feedback';
import {
  FileText,
  Search,
  Plus,
  ChevronRight,
  Loader2,
  Trophy,
  AlertCircle,
} from 'lucide-react';

export default function TeacherAssessmentsPage() {
  const [assessments, setAssessments] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [years, setYears] = useState<any[]>([]);
  const [types, setTypes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [classFilter, setClassFilter] = useState('');
  const [createOpen, setCreateOpen] = useState(false);

  const loadAssessments = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      if (classFilter) params.set('classId', classFilter);
      const data = await apiFetch(`/assessments${params.toString() ? `?${params.toString()}` : ''}`);
      setAssessments(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setAssessments([]);
      setError(err?.message || 'Could not load your assessments.');
    } finally {
      setLoading(false);
    }
  }, [classFilter]);

  useEffect(() => {
    loadAssessments();
  }, [loadAssessments]);

  useEffect(() => {
    Promise.allSettled([
      apiFetch('/classes'),
      apiFetch('/subjects'),
      apiFetch('/academic-years'),
      apiFetch('/assessments/types'),
    ]).then(([classesResult, subjectsResult, yearsResult, typesResult]) => {
      const unwrap = (result: PromiseSettledResult<any>) =>
        result.status === 'fulfilled' && Array.isArray(result.value) ? result.value : [];
      setClasses(unwrap(classesResult));
      setSubjects(unwrap(subjectsResult));
      setYears(unwrap(yearsResult));
      setTypes(unwrap(typesResult));
    });
  }, []);

  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase();
    if (!needle) return assessments;
    return assessments.filter((assessment) => {
      const haystack = [
        assessment.name,
        assessment.code,
        assessment.subject?.name,
        assessment.class?.name,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return haystack.includes(needle);
    });
  }, [assessments, search]);

  const hasFilters = Boolean(search.trim() || classFilter);

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col justify-between gap-5 md:flex-row md:items-center">
        <div>
          <h1 className="flex items-center gap-3 text-2xl font-semibold tracking-tight text-charcoal-900 sm:text-3xl">
            <Trophy className="text-forest-700" /> My assessments
          </h1>
          <p className="mt-1 text-[11px] font-bold uppercase tracking-wide text-warm-500">
            Create evaluations and record student performance
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)} leftIcon={<Plus size={18} />}>
          Create assessment
        </Button>
      </div>

      <div className="overflow-hidden rounded-xl border border-warm-200 bg-card shadow-sm">
        <div className="flex flex-col gap-3 border-b border-warm-100 bg-ivory-50/50 p-4 sm:p-6 lg:flex-row lg:items-end">
          <div className="flex flex-1 items-center rounded-2xl border border-warm-200 bg-card px-5 py-3 shadow-sm">
            <Search size={18} className="mr-3 shrink-0 text-warm-400" />
            <input
              type="search"
              aria-label="Search assessments"
              placeholder="Search by name, subject or class…"
              className="w-full border-none bg-transparent text-sm font-bold text-charcoal-900 placeholder:text-warm-400 focus:ring-0"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
          <div className="w-full lg:w-64">
            <Select
              label="Class"
              value={classFilter}
              onChange={(event) => setClassFilter(event.target.value)}
              options={[
                { value: '', label: 'All classes' },
                ...classes.map((clazz) => ({ value: clazz.id, label: clazz.name })),
              ]}
            />
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
            <Button variant="outline" size="sm" onClick={loadAssessments}>
              Try again
            </Button>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center gap-3 py-24 text-sm font-medium text-warm-500">
            <Loader2 className="h-5 w-5 animate-spin text-forest-700" /> Loading assessments…
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-6 sm:p-10">
            <EmptyState
              icon={<FileText className="h-8 w-8" />}
              title={hasFilters ? 'No assessments match your filters' : 'No assessments yet'}
              description={
                hasFilters
                  ? 'Clear the search or class filter to see all assessments.'
                  : 'Create your first assessment, then enter scores for the class.'
              }
              actionButton={
                hasFilters ? (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSearch('');
                      setClassFilter('');
                    }}
                  >
                    Clear filters
                  </Button>
                ) : (
                  <Button onClick={() => setCreateOpen(true)} leftIcon={<Plus size={16} />}>
                    Create assessment
                  </Button>
                )
              }
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-warm-200">
              <thead className="bg-ivory-50/50">
                <tr>
                  <th className="px-5 py-4 text-left text-[10px] font-semibold uppercase tracking-wide text-warm-400">
                    Assessment
                  </th>
                  <th className="px-5 py-4 text-left text-[10px] font-semibold uppercase tracking-wide text-warm-400">
                    Class & subject
                  </th>
                  <th className="px-5 py-4 text-left text-[10px] font-semibold uppercase tracking-wide text-warm-400">
                    Scores
                  </th>
                  <th className="px-5 py-4 text-left text-[10px] font-semibold uppercase tracking-wide text-warm-400">
                    Status
                  </th>
                  <th className="px-5 py-4 text-right text-[10px] font-semibold uppercase tracking-wide text-warm-400">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-warm-100 bg-card">
                {filtered.map((assessment) => (
                  <tr key={assessment.id} className="group transition-colors hover:bg-sage-50/30">
                    <td className="px-5 py-5">
                      <p className="text-sm font-semibold leading-tight text-charcoal-900">{assessment.name}</p>
                      <p className="mt-0.5 text-[11px] font-bold uppercase text-warm-400">
                        {assessment.code ? `${assessment.code} • ` : ''}
                        {assessment.assessmentType?.name ?? 'Assessment'} • Max {assessment.totalMarks}
                      </p>
                    </td>
                    <td className="px-5 py-5">
                      <p className="text-sm font-semibold text-charcoal-800">{assessment.subject?.name ?? '—'}</p>
                      <p className="text-[11px] font-bold uppercase text-warm-400">
                        {assessment.class?.name ?? '—'}
                        {assessment.section?.name ? ` • ${assessment.section.name}` : ''}
                      </p>
                    </td>
                    <td className="px-5 py-5 text-sm font-semibold text-charcoal-900">
                      {assessment._count?.scores ?? 0}
                    </td>
                    <td className="px-5 py-5">
                      <span
                        className={`rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-wide ${
                          assessment.status === 'PUBLISHED'
                            ? 'bg-success-100 text-success-700'
                            : assessment.status === 'DRAFT'
                              ? 'bg-warm-100 text-warm-600'
                              : 'bg-sage-100 text-forest-800'
                        }`}
                      >
                        {String(assessment.status).replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-5 py-5 text-right">
                      <Link
                        href={`/teacher/assessments/${assessment.id}/scores`}
                        className="inline-flex items-center gap-2 rounded-xl border border-warm-200 bg-card px-4 py-2 text-[11px] font-semibold uppercase tracking-wide text-forest-700 shadow-sm transition-all hover:border-forest-700 hover:bg-forest-700 hover:text-white"
                      >
                        Enter scores <ChevronRight size={14} />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {createOpen && (
        <CreateAssessmentModal
          classes={classes}
          subjects={subjects}
          years={years}
          types={types}
          onClose={() => setCreateOpen(false)}
          onSaved={() => {
            setCreateOpen(false);
            showFeedback('SUCCESS', 'Assessment created.');
            loadAssessments();
          }}
        />
      )}
    </div>
  );
}

function CreateAssessmentModal({
  classes,
  subjects,
  years,
  types,
  onClose,
  onSaved,
}: {
  classes: any[];
  subjects: any[];
  years: any[];
  types: any[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const defaultYear =
    years.find((year) => year.isCurrent) ?? years.find((year) => year.status === 'ACTIVE') ?? years[0];

  const [form, setForm] = useState({
    academicYearId: defaultYear?.id ?? '',
    termId: '',
    assessmentTypeId: '',
    name: '',
    code: '',
    classId: '',
    sectionId: '',
    subjectId: '',
    totalMarks: '100',
    weight: '1',
    startDate: '',
    endDate: '',
    description: '',
  });
  const [terms, setTerms] = useState<any[]>([]);
  const [sections, setSections] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!form.academicYearId) {
      setTerms([]);
      return;
    }
    apiFetch(`/academic-terms/by-year/${form.academicYearId}`)
      .then((data) => setTerms(Array.isArray(data) ? data : []))
      .catch(() => setTerms([]));
  }, [form.academicYearId]);

  useEffect(() => {
    if (!form.classId) {
      setSections([]);
      return;
    }
    apiFetch(`/sections/by-class/${form.classId}`)
      .then((data) => setSections(Array.isArray(data) ? data : []))
      .catch(() => setSections([]));
  }, [form.classId]);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (saving) return;
    if (!form.academicYearId || !form.assessmentTypeId || !form.classId || !form.subjectId) {
      setError('Academic year, assessment type, class and subject are required.');
      return;
    }
    if (!form.name.trim() || !form.code.trim()) {
      setError('Assessment name and code are required.');
      return;
    }
    const totalMarks = Number(form.totalMarks);
    if (!Number.isFinite(totalMarks) || totalMarks <= 0) {
      setError('Total marks must be greater than zero.');
      return;
    }
    const weight = form.weight ? Number(form.weight) : undefined;
    if (weight !== undefined && (!Number.isFinite(weight) || weight < 0 || weight > 1)) {
      setError('Weight must be between 0 and 1.');
      return;
    }
    if (form.startDate && form.endDate && form.startDate > form.endDate) {
      setError('The end date must be after the start date.');
      return;
    }

    setSaving(true);
    setError('');
    try {
      await apiFetch('/assessments', {
        method: 'POST',
        body: JSON.stringify({
          academicYearId: form.academicYearId,
          termId: form.termId || undefined,
          assessmentTypeId: form.assessmentTypeId,
          name: form.name.trim(),
          code: form.code.trim(),
          classId: form.classId,
          sectionId: form.sectionId || undefined,
          subjectId: form.subjectId,
          totalMarks,
          weight,
          startDate: form.startDate ? new Date(`${form.startDate}T00:00:00`).toISOString() : undefined,
          endDate: form.endDate ? new Date(`${form.endDate}T23:59:59`).toISOString() : undefined,
          description: form.description.trim() || undefined,
        }),
      });
      onSaved();
    } catch (err: any) {
      setError(err?.message || 'Could not create the assessment.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      isOpen
      onClose={onClose}
      title="Create assessment"
      size="lg"
      footerActions={
        <>
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" form="create-assessment-form" isLoading={saving}>
            Create assessment
          </Button>
        </>
      }
    >
      <form id="create-assessment-form" onSubmit={submit} className="space-y-4">
        {error && (
          <p role="alert" className="rounded-lg bg-danger-50 p-3 text-xs font-semibold text-danger-700">
            {error}
          </p>
        )}
        {types.length === 0 && (
          <p className="rounded-lg bg-warning-50 p-3 text-xs font-semibold text-warning-800">
            No assessment types are configured. Ask an administrator to add one before creating assessments.
          </p>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Select
            label="Academic year *"
            value={form.academicYearId}
            onChange={(event) => setForm({ ...form, academicYearId: event.target.value, termId: '' })}
            options={[
              { value: '', label: 'Select year' },
              ...years.map((year) => ({ value: year.id, label: year.name })),
            ]}
          />
          <Select
            label="Term"
            value={form.termId}
            onChange={(event) => setForm({ ...form, termId: event.target.value })}
            options={[
              { value: '', label: 'Whole year' },
              ...terms.map((term) => ({ value: term.id, label: term.name })),
            ]}
          />
          <Select
            label="Assessment type *"
            value={form.assessmentTypeId}
            onChange={(event) => setForm({ ...form, assessmentTypeId: event.target.value })}
            options={[
              { value: '', label: types.length ? 'Select type' : 'No types configured' },
              ...types.map((type) => ({ value: type.id, label: type.name })),
            ]}
          />
          <Input
            label="Total marks *"
            type="number"
            min={1}
            value={form.totalMarks}
            onChange={(event) => setForm({ ...form, totalMarks: event.target.value })}
          />
          <Input
            label="Name *"
            value={form.name}
            onChange={(event) => setForm({ ...form, name: event.target.value })}
            placeholder="e.g. Mid-term test"
          />
          <Input
            label="Code *"
            value={form.code}
            onChange={(event) => setForm({ ...form, code: event.target.value })}
            placeholder="e.g. JHS1-MATH-MID"
          />
          <Select
            label="Class *"
            value={form.classId}
            onChange={(event) => setForm({ ...form, classId: event.target.value, sectionId: '' })}
            options={[
              { value: '', label: 'Select class' },
              ...classes.map((clazz) => ({ value: clazz.id, label: clazz.name })),
            ]}
          />
          <Select
            label="Section"
            value={form.sectionId}
            disabled={!form.classId || sections.length === 0}
            onChange={(event) => setForm({ ...form, sectionId: event.target.value })}
            options={[
              { value: '', label: sections.length ? 'Whole class' : 'No sections' },
              ...sections.map((section) => ({ value: section.id, label: section.name })),
            ]}
          />
          <Select
            label="Subject *"
            value={form.subjectId}
            onChange={(event) => setForm({ ...form, subjectId: event.target.value })}
            options={[
              { value: '', label: 'Select subject' },
              ...subjects.map((subject) => ({ value: subject.id, label: subject.name })),
            ]}
          />
          <Input
            label="Weight (0–1)"
            type="number"
            step="0.05"
            min={0}
            max={1}
            value={form.weight}
            onChange={(event) => setForm({ ...form, weight: event.target.value })}
          />
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
        </div>

        <div className="space-y-1.5">
          <label htmlFor="assessment-description" className="block text-xs font-semibold text-charcoal-800">
            Description
          </label>
          <textarea
            id="assessment-description"
            rows={3}
            value={form.description}
            onChange={(event) => setForm({ ...form, description: event.target.value })}
            className="w-full resize-none rounded-lg border border-warm-300 bg-card p-3 text-sm text-charcoal-900 focus:border-forest-600 focus:outline-none focus:ring-2 focus:ring-forest-600/20"
          />
        </div>
      </form>
    </Modal>
  );
}
