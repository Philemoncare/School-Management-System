'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { apiFetch } from '@/lib/api/client';
import { useAuth } from '@/context/auth-context';
import { collectUserRoles } from '@/lib/auth/roles';
import { Button } from '@/components/ui/button';
import { Input, Select } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { EmptyState } from '@/components/ui/empty-state';
import { showFeedback } from '@/components/layout/global-feedback';
import {
  CalendarRange,
  CheckCircle2,
  Loader2,
  PencilLine,
  Plus,
  RefreshCw,
} from 'lucide-react';

interface Term {
  id: string;
  name: string;
  code: string;
  sequence: number;
  startDate: string;
  endDate: string;
  status: string;
}

interface AcademicYear {
  id: string;
  name: string;
  code: string;
  startDate: string;
  endDate: string;
  status: string;
  isCurrent: boolean;
  terms?: Term[];
  _count?: { terms: number; enrollments: number };
}

const formatDate = (value?: string | null) =>
  value ? new Date(value).toLocaleDateString(undefined, { dateStyle: 'medium' }) : '—';

const toInputDate = (value?: string | null) =>
  value ? new Date(value).toISOString().slice(0, 10) : '';

export default function AcademicYearsPage() {
  const { user, activeSchoolId } = useAuth();
  const roles = useMemo(() => collectUserRoles(user, activeSchoolId), [user, activeSchoolId]);
  const canManage = roles.some((role) => ['SCHOOL_ADMIN', 'PRINCIPAL'].includes(role));

  const [years, setYears] = useState<AcademicYear[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [editYear, setEditYear] = useState<AcademicYear | null>(null);
  const [termsYear, setTermsYear] = useState<AcademicYear | null>(null);
  const [activatingId, setActivatingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await apiFetch('/academic-years');
      setYears(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setYears([]);
      setError(err?.message || 'Could not load academic years.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function makeCurrent(year: AcademicYear) {
    if (!canManage || year.isCurrent) return;
    if (!window.confirm(`Make ${year.name} the current academic year?`)) return;
    setActivatingId(year.id);
    try {
      await apiFetch(`/academic-years/${year.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ isCurrent: true }),
      });
      showFeedback('SUCCESS', `${year.name} is now the current academic year.`);
      await load();
    } catch (err: any) {
      showFeedback('ERROR', err?.message || 'Could not update the current academic year.');
    } finally {
      setActivatingId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-charcoal-900 sm:text-3xl">
            Academic Years
          </h1>
          <p className="mt-0.5 text-xs font-medium text-warm-500 sm:text-sm">
            Configure the school calendar. Exactly one year can be current at a time.
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
              Create Academic Year
            </Button>
          )}
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

      {loading && years.length === 0 ? (
        <div className="flex items-center justify-center gap-2 py-16 text-sm font-medium text-warm-500">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading academic years…
        </div>
      ) : years.length === 0 && !error ? (
        <EmptyState
          icon={<CalendarRange className="h-8 w-8" />}
          title="No academic years yet"
          description="Create the first academic year, then add its terms so classes, attendance and results have a calendar to work with."
          actionButton={
            canManage ? (
              <Button onClick={() => setCreateOpen(true)} leftIcon={<Plus size={16} />}>
                Create Academic Year
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="overflow-hidden rounded-xl border border-warm-200 bg-card shadow-xs">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-warm-200">
              <caption className="sr-only">Academic years and their terms</caption>
              <thead className="bg-ivory-50">
                <tr>
                  {['Year', 'Code', 'Dates', 'Terms', 'Status', 'Actions'].map((heading) => (
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
                {years.map((year) => (
                  <tr key={year.id} className={year.isCurrent ? 'bg-sage-50/40' : undefined}>
                    <td className="whitespace-nowrap px-4 py-3.5 sm:px-6">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-charcoal-900">{year.name}</span>
                        {year.isCurrent && (
                          <span className="rounded-full bg-forest-800 px-2 py-0.5 text-[10px] font-bold uppercase text-ivory-50">
                            Current
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3.5 font-mono text-xs text-warm-600 sm:px-6">
                      {year.code}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3.5 text-xs text-warm-600 sm:px-6">
                      {formatDate(year.startDate)} – {formatDate(year.endDate)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3.5 text-xs text-warm-600 sm:px-6">
                      {year._count?.terms ?? year.terms?.length ?? 0}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3.5 sm:px-6">
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase ${
                          year.status === 'ACTIVE'
                            ? 'bg-success-100 text-success-800'
                            : 'bg-warm-100 text-warm-700'
                        }`}
                      >
                        {year.status}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3.5 text-right text-xs font-bold sm:px-6">
                      <div className="flex flex-wrap items-center justify-end gap-2">
                        {canManage && !year.isCurrent && (
                          <Button
                            variant="ghost"
                            size="xs"
                            onClick={() => makeCurrent(year)}
                            isLoading={activatingId === year.id}
                          >
                            Set current
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="xs"
                          onClick={() => setTermsYear(year)}
                        >
                          Terms
                        </Button>
                        {canManage && (
                          <Button
                            variant="outline"
                            size="xs"
                            onClick={() => setEditYear(year)}
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
        <YearFormModal
          onClose={() => setCreateOpen(false)}
          onSaved={() => {
            setCreateOpen(false);
            load();
          }}
        />
      )}

      {editYear && (
        <YearFormModal
          year={editYear}
          onClose={() => setEditYear(null)}
          onSaved={() => {
            setEditYear(null);
            load();
          }}
        />
      )}

      {termsYear && (
        <TermsModal
          year={termsYear}
          canManage={canManage}
          onClose={() => setTermsYear(null)}
          onChanged={load}
        />
      )}
    </div>
  );
}

function YearFormModal({
  year,
  onClose,
  onSaved,
}: {
  year?: AcademicYear;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState({
    name: year?.name ?? '',
    code: year?.code ?? '',
    startDate: toInputDate(year?.startDate),
    endDate: toInputDate(year?.endDate),
    status: year?.status ?? 'ACTIVE',
    isCurrent: year?.isCurrent ?? false,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (saving) return;
    if (!form.name.trim() || !form.code.trim()) {
      setError('Name and code are required.');
      return;
    }
    if (!form.startDate || !form.endDate) {
      setError('Start and end dates are required.');
      return;
    }
    if (new Date(form.endDate) <= new Date(form.startDate)) {
      setError('The end date must be after the start date.');
      return;
    }

    setSaving(true);
    setError('');
    try {
      const payload = {
        name: form.name.trim(),
        code: form.code.trim().toUpperCase(),
        startDate: form.startDate,
        endDate: form.endDate,
        status: form.status,
        isCurrent: form.isCurrent,
      };
      await apiFetch(year ? `/academic-years/${year.id}` : '/academic-years', {
        method: year ? 'PATCH' : 'POST',
        body: JSON.stringify(payload),
      });
      showFeedback('SUCCESS', year ? 'Academic year updated.' : 'Academic year created.');
      onSaved();
    } catch (err: any) {
      setError(err?.message || 'Could not save the academic year.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      isOpen
      onClose={onClose}
      title={year ? 'Edit academic year' : 'Create academic year'}
      footerActions={
        <>
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" form="year-form" isLoading={saving}>
            {year ? 'Save changes' : 'Create year'}
          </Button>
        </>
      }
    >
      <form id="year-form" onSubmit={submit} className="space-y-4">
        {error && (
          <p role="alert" className="rounded-lg bg-danger-50 p-3 text-xs font-semibold text-danger-700">
            {error}
          </p>
        )}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            label="Year name *"
            required
            placeholder="2026/2027"
            value={form.name}
            onChange={(event) => setForm({ ...form, name: event.target.value })}
          />
          <Input
            label="Code *"
            required
            placeholder="2026-2027"
            value={form.code}
            onChange={(event) => setForm({ ...form, code: event.target.value })}
          />
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
          <Select
            label="Status"
            value={form.status}
            options={[
              { value: 'DRAFT', label: 'Draft' },
              { value: 'UPCOMING', label: 'Upcoming' },
              { value: 'ACTIVE', label: 'Active' },
              { value: 'COMPLETED', label: 'Completed' },
              { value: 'ARCHIVED', label: 'Archived' },
            ]}
            onChange={(event) => setForm({ ...form, status: event.target.value })}
          />
          <label className="flex items-center gap-2 self-end pb-2 text-xs font-semibold text-warm-700">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-warm-300"
              checked={form.isCurrent}
              onChange={(event) => setForm({ ...form, isCurrent: event.target.checked })}
            />
            Make this the current year
          </label>
        </div>
        <p className="text-xs text-warm-500">
          Setting a year as current clears the current flag from the other years in this school.
        </p>
      </form>
    </Modal>
  );
}

function TermsModal({
  year,
  canManage,
  onClose,
  onChanged,
}: {
  year: AcademicYear;
  canManage: boolean;
  onClose: () => void;
  onChanged: () => void;
}) {
  const [terms, setTerms] = useState<Term[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    name: '',
    code: '',
    sequence: '',
    startDate: '',
    endDate: '',
    status: 'ACTIVE',
  });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await apiFetch(`/academic-terms/by-year/${year.id}`);
      const list: Term[] = Array.isArray(data) ? data : [];
      setTerms(list);
      setForm((previous) => ({
        ...previous,
        sequence: previous.sequence || String(list.length + 1),
      }));
    } catch (err: any) {
      setTerms([]);
      setError(err?.message || 'Could not load terms for this year.');
    } finally {
      setLoading(false);
    }
  }, [year.id]);

  useEffect(() => {
    load();
  }, [load]);

  async function createTerm(event: React.FormEvent) {
    event.preventDefault();
    if (saving) return;
    if (!form.name.trim() || !form.code.trim() || !form.sequence) {
      setFormError('Name, code and sequence are required.');
      return;
    }
    if (!form.startDate || !form.endDate) {
      setFormError('Start and end dates are required.');
      return;
    }
    if (new Date(form.endDate) <= new Date(form.startDate)) {
      setFormError('The end date must be after the start date.');
      return;
    }
    setSaving(true);
    setFormError('');
    try {
      await apiFetch('/academic-terms', {
        method: 'POST',
        body: JSON.stringify({
          academicYearId: year.id,
          name: form.name.trim(),
          code: form.code.trim().toUpperCase(),
          sequence: Number(form.sequence),
          startDate: form.startDate,
          endDate: form.endDate,
          status: form.status,
        }),
      });
      showFeedback('SUCCESS', 'Term added to the academic year.');
      setForm({
        name: '',
        code: '',
        sequence: String(terms.length + 2),
        startDate: '',
        endDate: '',
        status: 'ACTIVE',
      });
      await load();
      onChanged();
    } catch (err: any) {
      setFormError(err?.message || 'Could not create the term.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal isOpen onClose={onClose} title={`Terms · ${year.name}`} size="xl">
      <div className="space-y-5">
        {loading ? (
          <p className="flex items-center gap-2 py-6 text-sm text-warm-500">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading terms…
          </p>
        ) : error ? (
          <div role="alert" className="flex flex-col gap-3 rounded-lg bg-danger-50 p-3 text-xs font-semibold text-danger-700 sm:flex-row sm:items-center sm:justify-between">
            <span>{error}</span>
            <Button variant="outline" size="sm" onClick={load}>
              Try again
            </Button>
          </div>
        ) : terms.length === 0 ? (
          <p className="rounded-xl border border-dashed border-warm-300 p-6 text-center text-sm text-warm-500">
            No terms have been added to this academic year yet.
          </p>
        ) : (
          <ul className="divide-y divide-warm-100 rounded-xl border border-warm-200">
            {terms.map((term) => (
              <li key={term.id} className="flex flex-wrap items-center justify-between gap-2 p-3 text-sm">
                <div>
                  <p className="font-semibold text-charcoal-900">
                    {term.sequence}. {term.name}{' '}
                    <span className="font-mono text-[11px] text-warm-500">({term.code})</span>
                  </p>
                  <p className="text-xs text-warm-500">
                    {formatDate(term.startDate)} – {formatDate(term.endDate)}
                  </p>
                </div>
                <span className="rounded-full bg-sage-100 px-2.5 py-0.5 text-[10px] font-bold uppercase text-forest-800">
                  {term.status}
                </span>
              </li>
            ))}
          </ul>
        )}

        {canManage && (
          <form onSubmit={createTerm} className="space-y-4 rounded-xl border border-warm-200 bg-ivory-50 p-4">
            <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-warm-600">
              <CheckCircle2 size={14} /> Add a term
            </h3>
            {formError && (
              <p role="alert" className="rounded-lg bg-danger-50 p-3 text-xs font-semibold text-danger-700">
                {formError}
              </p>
            )}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <Input
                label="Term name *"
                required
                placeholder="Term 1"
                value={form.name}
                onChange={(event) => setForm({ ...form, name: event.target.value })}
              />
              <Input
                label="Code *"
                required
                placeholder="T1"
                value={form.code}
                onChange={(event) => setForm({ ...form, code: event.target.value })}
              />
              <Input
                label="Sequence *"
                type="number"
                min={1}
                required
                value={form.sequence}
                onChange={(event) => setForm({ ...form, sequence: event.target.value })}
              />
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
              <Select
                label="Status"
                value={form.status}
                options={[
                  { value: 'UPCOMING', label: 'Upcoming' },
                  { value: 'ACTIVE', label: 'Active' },
                  { value: 'COMPLETED', label: 'Completed' },
                ]}
                onChange={(event) => setForm({ ...form, status: event.target.value })}
              />
            </div>
            <div className="flex justify-end">
              <Button type="submit" size="sm" isLoading={saving} leftIcon={<Plus size={14} />}>
                Add term
              </Button>
            </div>
          </form>
        )}
      </div>
    </Modal>
  );
}
