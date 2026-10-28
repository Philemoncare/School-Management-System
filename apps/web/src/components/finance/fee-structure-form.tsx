'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { apiFetch } from '@/lib/api/client';
import { Button } from '@/components/ui/button';
import { Input, Select } from '@/components/ui/input';
import { showFeedback } from '@/components/layout/global-feedback';
import { Loader2, Save } from 'lucide-react';

export interface FeeCategory {
  id: string;
  name: string;
  code: string;
  isActive: boolean;
}

export interface FeeStructure {
  id: string;
  name: string;
  amount: string | number;
  currency?: string;
  dueDate: string;
  isMandatory: boolean;
  status: 'ACTIVE' | 'ARCHIVED' | 'DRAFT';
  academicYearId: string;
  termId?: string | null;
  classId?: string | null;
  feeCategoryId: string;
  feeCategory?: { id: string; name: string } | null;
  academicYear?: { id: string; name: string } | null;
  term?: { id: string; name: string } | null;
  class?: { id: string; name: string } | null;
}

interface Year {
  id: string;
  name: string;
  isCurrent?: boolean;
}

interface Term {
  id: string;
  name: string;
  isCurrent?: boolean;
}

interface SchoolClass {
  id: string;
  name: string;
}

interface Props {
  structure?: FeeStructure;
  onSaved: (structure: FeeStructure) => void;
  onCancel: () => void;
}

function toDateInput(value?: string | Date) {
  if (!value) {
    const next = new Date();
    next.setMonth(next.getMonth() + 1);
    return next.toISOString().slice(0, 10);
  }
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? '' : date.toISOString().slice(0, 10);
}

export function FeeStructureForm({ structure, onSaved, onCancel }: Props) {
  const [categories, setCategories] = useState<FeeCategory[]>([]);
  const [years, setYears] = useState<Year[]>([]);
  const [terms, setTerms] = useState<Term[]>([]);
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [loadingTerms, setLoadingTerms] = useState(false);
  const [optionsError, setOptionsError] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    name: structure?.name ?? '',
    academicYearId: structure?.academicYearId ?? '',
    termId: structure?.termId ?? '',
    classId: structure?.classId ?? '',
    feeCategoryId: structure?.feeCategoryId ?? '',
    amount: structure ? String(structure.amount) : '',
    dueDate: toDateInput(structure?.dueDate),
    isMandatory: structure?.isMandatory ?? true,
    status: structure?.status ?? 'ACTIVE',
  });

  const loadOptions = useCallback(async () => {
    setLoadingOptions(true);
    setOptionsError('');
    try {
      const [categoryData, yearData, classData] = await Promise.all([
        apiFetch('/finance/fee-categories'),
        apiFetch('/academic-years'),
        apiFetch('/classes'),
      ]);
      setCategories(Array.isArray(categoryData) ? categoryData : []);
      setYears(Array.isArray(yearData) ? yearData : []);
      setClasses(Array.isArray(classData) ? classData : []);

      setForm((previous) => {
        if (previous.academicYearId) return previous;
        const current =
          (yearData as Year[]).find((year) => year.isCurrent) ?? (yearData as Year[])[0];
        return current ? { ...previous, academicYearId: current.id } : previous;
      });
    } catch (err: any) {
      setOptionsError(err?.message || 'Could not load fee categories, years or classes.');
    } finally {
      setLoadingOptions(false);
    }
  }, []);

  useEffect(() => {
    loadOptions();
  }, [loadOptions]);

  const loadTerms = useCallback(async (academicYearId: string) => {
    if (!academicYearId) {
      setTerms([]);
      return;
    }
    setLoadingTerms(true);
    try {
      const data = await apiFetch(`/academic-terms/by-year/${academicYearId}`);
      setTerms(Array.isArray(data) ? data : []);
    } catch {
      setTerms([]);
    } finally {
      setLoadingTerms(false);
    }
  }, []);

  useEffect(() => {
    loadTerms(form.academicYearId);
  }, [form.academicYearId, loadTerms]);

  const activeCategories = useMemo(
    () => categories.filter((category) => category.isActive || category.id === structure?.feeCategoryId),
    [categories, structure?.feeCategoryId],
  );

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (saving) return;

    if (!form.name.trim()) {
      setError('Enter a name for this fee item.');
      return;
    }
    if (!form.academicYearId) {
      setError('Select an academic year.');
      return;
    }
    if (!form.feeCategoryId) {
      setError('Select a fee category.');
      return;
    }
    const amount = Number(form.amount);
    if (!Number.isFinite(amount) || amount <= 0) {
      setError('Enter an amount greater than zero.');
      return;
    }
    if (!form.dueDate || Number.isNaN(new Date(form.dueDate).getTime())) {
      setError('Select a valid due date.');
      return;
    }

    setSaving(true);
    setError('');
    try {
      const payload = {
        name: form.name.trim(),
        academicYearId: form.academicYearId,
        termId: form.termId || null,
        classId: form.classId || null,
        feeCategoryId: form.feeCategoryId,
        amount,
        dueDate: form.dueDate,
        isMandatory: form.isMandatory,
        ...(structure ? { status: form.status } : {}),
      };
      const saved = await apiFetch(
        structure ? `/finance/fee-structures/${structure.id}` : '/finance/fee-structures',
        {
          method: structure ? 'PATCH' : 'POST',
          body: JSON.stringify(payload),
        },
      );
      showFeedback('SUCCESS', structure ? 'Fee item updated.' : 'Fee item created.');
      onSaved(saved);
    } catch (err: any) {
      setError(err?.message || 'Could not save the fee item.');
    } finally {
      setSaving(false);
    }
  }

  if (loadingOptions) {
    return (
      <div className="flex items-center justify-center gap-2 py-12 text-sm font-medium text-warm-500">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading fee categories, years and classes…
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      {optionsError && (
        <div
          role="alert"
          className="flex flex-col gap-2 rounded-lg border border-danger-200 bg-danger-50 p-3 text-xs font-semibold text-danger-700 sm:flex-row sm:items-center sm:justify-between"
        >
          <span>{optionsError}</span>
          <Button variant="outline" size="xs" onClick={loadOptions}>
            Retry
          </Button>
        </div>
      )}

      {error && (
        <p role="alert" className="rounded-lg border border-danger-200 bg-danger-50 p-3 text-xs font-semibold text-danger-700">
          {error}
        </p>
      )}

      <Input
        label="Fee item name *"
        required
        placeholder="e.g. Term 1 Tuition — JHS 1"
        value={form.name}
        onChange={(event) => setForm({ ...form, name: event.target.value })}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Select
          label="Fee category *"
          required
          value={form.feeCategoryId}
          placeholder="Select a category"
          options={[
            { value: '', label: 'Select a category' },
            ...activeCategories.map((category) => ({
              value: category.id,
              label: `${category.name} (${category.code})`,
            })),
          ]}
          onChange={(event) => setForm({ ...form, feeCategoryId: event.target.value })}
        />

        <Select
          label="Academic year *"
          required
          value={form.academicYearId}
          options={[
            { value: '', label: 'Select a year' },
            ...years.map((year) => ({
              value: year.id,
              label: year.isCurrent ? `${year.name} (current)` : year.name,
            })),
          ]}
          onChange={(event) =>
            setForm({ ...form, academicYearId: event.target.value, termId: '' })
          }
        />

        <Select
          label="Term"
          value={form.termId}
          helperText={
            loadingTerms
              ? 'Loading terms…'
              : form.academicYearId && terms.length === 0
                ? 'No terms defined for this year — the fee applies to the full year.'
                : 'Leave blank to bill across the full year.'
          }
          options={[
            { value: '', label: 'Full year' },
            ...terms.map((term) => ({ value: term.id, label: term.name })),
          ]}
          onChange={(event) => setForm({ ...form, termId: event.target.value })}
          disabled={loadingTerms || !form.academicYearId}
        />

        <Select
          label="Target class"
          value={form.classId}
          helperText="Leave blank to apply to every class."
          options={[
            { value: '', label: 'All classes' },
            ...classes.map((klass) => ({ value: klass.id, label: klass.name })),
          ]}
          onChange={(event) => setForm({ ...form, classId: event.target.value })}
        />

        <Input
          label="Amount *"
          required
          type="number"
          min={0.01}
          step="0.01"
          placeholder="0.00"
          value={form.amount}
          onChange={(event) => setForm({ ...form, amount: event.target.value })}
        />

        <Input
          label="Due date *"
          required
          type="date"
          value={form.dueDate}
          onChange={(event) => setForm({ ...form, dueDate: event.target.value })}
        />
      </div>

      {structure && (
        <Select
          label="Status"
          value={form.status}
          helperText="Archived items stay on record but are not offered for new invoices."
          options={[
            { value: 'ACTIVE', label: 'Active' },
            { value: 'DRAFT', label: 'Draft' },
            { value: 'ARCHIVED', label: 'Archived' },
          ]}
          onChange={(event) =>
            setForm({ ...form, status: event.target.value as FeeStructure['status'] })
          }
        />
      )}

      <label className="flex items-start gap-2.5 rounded-lg bg-ivory-50 p-3">
        <input
          type="checkbox"
          className="mt-0.5 h-4 w-4 rounded border-warm-300 text-forest-700 focus:ring-forest-600"
          checked={form.isMandatory}
          onChange={(event) => setForm({ ...form, isMandatory: event.target.checked })}
        />
        <span className="text-xs font-medium text-warm-600">
          Mandatory fee — this item is expected from every student in scope.
        </span>
      </label>

      <div className="flex flex-wrap items-center justify-end gap-2 border-t border-warm-100 pt-4">
        <Button variant="outline" onClick={onCancel} disabled={saving}>
          Cancel
        </Button>
        <Button type="submit" isLoading={saving} leftIcon={<Save size={16} />}>
          {structure ? 'Save changes' : 'Create fee item'}
        </Button>
      </div>
    </form>
  );
}
