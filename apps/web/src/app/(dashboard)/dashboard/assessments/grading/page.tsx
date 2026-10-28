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
  Loader2,
  PencilLine,
  Plus,
  RefreshCw,
  Trash2,
  Trophy,
} from 'lucide-react';

interface GradeBand {
  id?: string;
  grade: string;
  minimumPercentage: number | string;
  maximumPercentage: number | string;
  gradePoint: number | string | null;
  remark?: string | null;
  sequence?: number;
}

interface GradingScale {
  id: string;
  name: string;
  code: string;
  description?: string | null;
  status: boolean;
  gradeBands: GradeBand[];
}

const emptyBand = (sequence: number): GradeBand => ({
  grade: '',
  minimumPercentage: '',
  maximumPercentage: '',
  gradePoint: '',
  remark: '',
  sequence,
});

export default function GradingScalesPage() {
  const { user, activeSchoolId } = useAuth();
  const roles = useMemo(() => collectUserRoles(user, activeSchoolId), [user, activeSchoolId]);
  const canManage = roles.some((role) => ['SCHOOL_ADMIN', 'PRINCIPAL'].includes(role));

  const [scales, setScales] = useState<GradingScale[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [editScale, setEditScale] = useState<GradingScale | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await apiFetch('/grading/scales');
      setScales(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setScales([]);
      setError(err?.message || 'Could not load grading scales.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function toggleStatus(scale: GradingScale) {
    if (!canManage) return;
    setBusyId(scale.id);
    try {
      await apiFetch(`/grading/scales/${scale.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: !scale.status }),
      });
      showFeedback('SUCCESS', `Grading scale ${scale.status ? 'deactivated' : 'activated'}.`);
      await load();
    } catch (err: any) {
      showFeedback('ERROR', err?.message || 'Could not update the grading scale.');
    } finally {
      setBusyId(null);
    }
  }

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
          <h1 className="flex items-center gap-3 text-2xl font-bold tracking-tight text-charcoal-900 sm:text-3xl">
            <Trophy className="text-forest-700" size={26} /> Grading Scales
          </h1>
          <p className="mt-0.5 text-xs font-medium text-warm-500 sm:text-sm">
            Grade bands convert subject percentages into letter grades and points. Only active scales
            are used when results are calculated.
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
            <Button size="sm" onClick={() => setCreateOpen(true)} leftIcon={<Plus size={16} />}>
              Create New Scale
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

      {loading && scales.length === 0 ? (
        <div className="flex items-center justify-center gap-2 py-16 text-sm font-medium text-warm-500">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading grading scales…
        </div>
      ) : scales.length === 0 && !error ? (
        <EmptyState
          icon={<Trophy className="h-8 w-8" />}
          title="No grading scales yet"
          description="Define the grade bands (A, B, C…) that turn percentages into results. Results cannot be calculated without an active scale."
          actionButton={
            canManage ? (
              <Button onClick={() => setCreateOpen(true)} leftIcon={<Plus size={16} />}>
                Create New Scale
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="space-y-5">
          {scales.map((scale) => (
            <section
              key={scale.id}
              className="overflow-hidden rounded-xl border border-warm-200 bg-card shadow-xs"
            >
              <div className="flex flex-wrap items-start justify-between gap-3 border-b border-warm-100 bg-ivory-50/50 px-5 py-4 sm:px-6">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-base font-bold text-charcoal-900">{scale.name}</h2>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase ${
                        scale.status
                          ? 'bg-success-100 text-success-800'
                          : 'bg-warm-100 text-warm-600'
                      }`}
                    >
                      {scale.status ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <p className="mt-0.5 font-mono text-[11px] font-semibold uppercase text-forest-700">
                    {scale.code}
                  </p>
                  {scale.description && (
                    <p className="mt-1 max-w-2xl text-xs text-warm-500">{scale.description}</p>
                  )}
                </div>
                {canManage && (
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      size="xs"
                      onClick={() => setEditScale(scale)}
                      leftIcon={<PencilLine size={12} />}
                    >
                      Edit Bands
                    </Button>
                    <Button
                      variant="ghost"
                      size="xs"
                      onClick={() => toggleStatus(scale)}
                      isLoading={busyId === scale.id}
                    >
                      {scale.status ? 'Deactivate' : 'Activate'}
                    </Button>
                  </div>
                )}
              </div>

              {scale.gradeBands.length === 0 ? (
                <p className="p-5 text-sm text-warm-500 sm:p-6">
                  This scale has no grade bands. Add bands so results can be graded.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-warm-100">
                    <caption className="sr-only">Grade bands for {scale.name}</caption>
                    <thead className="bg-card">
                      <tr>
                        {['Grade', 'Percentage range', 'Points', 'Remark'].map((heading) => (
                          <th
                            key={heading}
                            scope="col"
                            className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wide text-warm-400 sm:px-6"
                          >
                            {heading}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-ivory-50">
                      {scale.gradeBands.map((band) => (
                        <tr key={band.id ?? band.grade} className="transition-colors hover:bg-ivory-50">
                          <td className="px-4 py-3 sm:px-6">
                            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-sage-50 text-sm font-bold text-forest-800">
                              {band.grade}
                            </span>
                          </td>
                          <td className="whitespace-nowrap px-4 py-3 text-sm font-bold text-warm-700 sm:px-6">
                            {Number(band.minimumPercentage)}% — {Number(band.maximumPercentage)}%
                          </td>
                          <td className="whitespace-nowrap px-4 py-3 text-sm font-semibold text-charcoal-900 sm:px-6">
                            {band.gradePoint == null ? '—' : Number(band.gradePoint).toFixed(2)}
                          </td>
                          <td className="px-4 py-3 text-xs font-medium text-warm-500 sm:px-6">
                            {band.remark || '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          ))}
        </div>
      )}

      {createOpen && (
        <ScaleFormModal
          onClose={() => setCreateOpen(false)}
          onSaved={() => {
            setCreateOpen(false);
            load();
          }}
        />
      )}

      {editScale && (
        <ScaleFormModal
          scale={editScale}
          onClose={() => setEditScale(null)}
          onSaved={() => {
            setEditScale(null);
            load();
          }}
        />
      )}
    </div>
  );
}

function ScaleFormModal({
  scale,
  onClose,
  onSaved,
}: {
  scale?: GradingScale;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState({
    name: scale?.name ?? '',
    code: scale?.code ?? '',
    description: scale?.description ?? '',
    status: scale?.status ?? true,
  });
  const [bands, setBands] = useState<GradeBand[]>(
    scale?.gradeBands?.length
      ? scale.gradeBands.map((band, index) => ({
          grade: band.grade,
          minimumPercentage: Number(band.minimumPercentage),
          maximumPercentage: Number(band.maximumPercentage),
          gradePoint: band.gradePoint == null ? '' : Number(band.gradePoint),
          remark: band.remark ?? '',
          sequence: band.sequence ?? index,
        }))
      : [emptyBand(0)],
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  function updateBand(index: number, patch: Partial<GradeBand>) {
    setBands((previous) =>
      previous.map((band, bandIndex) => (bandIndex === index ? { ...band, ...patch } : band)),
    );
  }

  function addBand() {
    setBands((previous) => [...previous, emptyBand(previous.length)]);
  }

  function removeBand(index: number) {
    setBands((previous) =>
      previous.filter((_, bandIndex) => bandIndex !== index).map((band, bandIndex) => ({
        ...band,
        sequence: bandIndex,
      })),
    );
  }

  function validate(): string | null {
    if (!form.name.trim() || !form.code.trim()) return 'Name and code are required.';
    if (bands.length === 0) return 'Add at least one grade band.';
    const labels = new Set<string>();
    const parsed = bands.map((band) => ({
      ...band,
      minimum: Number(band.minimumPercentage),
      maximum: Number(band.maximumPercentage),
    }));
    for (const band of parsed) {
      if (!band.grade.trim()) return 'Every band needs a grade label.';
      if (labels.has(band.grade.trim().toUpperCase())) {
        return `Grade ${band.grade} appears more than once.`;
      }
      labels.add(band.grade.trim().toUpperCase());
      if (
        band.minimumPercentage === '' ||
        band.maximumPercentage === '' ||
        Number.isNaN(band.minimum) ||
        Number.isNaN(band.maximum)
      ) {
        return `Enter both percentages for grade ${band.grade}.`;
      }
      if (band.minimum < 0 || band.maximum > 100) {
        return 'Percentages must be between 0 and 100.';
      }
      if (band.minimum > band.maximum) {
        return `Grade ${band.grade} has a minimum above its maximum.`;
      }
    }
    const sorted = [...parsed].sort((a, b) => a.minimum - b.minimum);
    for (let index = 1; index < sorted.length; index += 1) {
      if (sorted[index].minimum <= sorted[index - 1].maximum) {
        return `Grades ${sorted[index - 1].grade} and ${sorted[index].grade} overlap.`;
      }
    }
    return null;
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (saving) return;
    const problem = validate();
    if (problem) {
      setError(problem);
      return;
    }
    setSaving(true);
    setError('');
    try {
      const payload = {
        name: form.name.trim(),
        code: form.code.trim().toUpperCase(),
        description: form.description.trim() || undefined,
        status: form.status,
        gradeBands: bands.map((band, index) => ({
          grade: band.grade.trim().toUpperCase(),
          minimumPercentage: Number(band.minimumPercentage),
          maximumPercentage: Number(band.maximumPercentage),
          gradePoint: band.gradePoint === '' ? undefined : Number(band.gradePoint),
          remark: band.remark?.toString().trim() || undefined,
          sequence: index,
        })),
      };
      await apiFetch(scale ? `/grading/scales/${scale.id}` : '/grading/scales', {
        method: scale ? 'PATCH' : 'POST',
        body: JSON.stringify(payload),
      });
      showFeedback('SUCCESS', scale ? 'Grading scale updated.' : 'Grading scale created.');
      onSaved();
    } catch (err: any) {
      setError(err?.message || 'Could not save the grading scale.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      isOpen
      onClose={onClose}
      title={scale ? 'Edit grading scale' : 'Create grading scale'}
      size="xl"
      footerActions={
        <>
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" form="grading-scale-form" isLoading={saving}>
            {scale ? 'Save changes' : 'Create scale'}
          </Button>
        </>
      }
    >
      <form id="grading-scale-form" onSubmit={submit} className="space-y-5">
        {error && (
          <p role="alert" className="rounded-lg bg-danger-50 p-3 text-xs font-semibold text-danger-700">
            {error}
          </p>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            label="Scale name *"
            required
            placeholder="Senior Secondary Grading"
            value={form.name}
            onChange={(event) => setForm({ ...form, name: event.target.value })}
          />
          <Input
            label="Code *"
            required
            placeholder="SS-GRADE"
            value={form.code}
            onChange={(event) => setForm({ ...form, code: event.target.value })}
          />
          <Select
            label="Status"
            value={form.status ? 'ACTIVE' : 'INACTIVE'}
            options={[
              { value: 'ACTIVE', label: 'Active (used for results)' },
              { value: 'INACTIVE', label: 'Inactive' },
            ]}
            onChange={(event) => setForm({ ...form, status: event.target.value === 'ACTIVE' })}
          />
        </div>

        <Input
          label="Description"
          placeholder="Optional notes about this scale"
          value={form.description}
          onChange={(event) => setForm({ ...form, description: event.target.value })}
        />

        <div className="space-y-3 rounded-xl border border-warm-200 bg-ivory-50 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wide text-warm-600">Grade bands</h3>
              <p className="text-[11px] text-warm-500">
                Ranges must not overlap. Example: A 80–100, B 70–79.99, C 60–69.99.
              </p>
            </div>
            <Button type="button" variant="outline" size="xs" onClick={addBand} leftIcon={<Plus size={12} />}>
              Add band
            </Button>
          </div>

          {bands.length === 0 ? (
            <p className="rounded-lg border border-dashed border-warm-300 p-4 text-center text-xs text-warm-500">
              No grade bands yet. Add at least one.
            </p>
          ) : (
            <div className="space-y-3">
              {bands.map((band, index) => (
                <div
                  key={index}
                  className="grid grid-cols-2 gap-3 rounded-lg border border-warm-200 bg-card p-3 sm:grid-cols-[90px_1fr_1fr_90px_1fr_auto] sm:items-end"
                >
                  <Input
                    label="Grade *"
                    required
                    placeholder="A"
                    maxLength={5}
                    value={band.grade}
                    onChange={(event) => updateBand(index, { grade: event.target.value })}
                  />
                  <Input
                    label="Min % *"
                    type="number"
                    min={0}
                    max={100}
                    step="0.01"
                    required
                    value={band.minimumPercentage}
                    onChange={(event) =>
                      updateBand(index, { minimumPercentage: event.target.value })
                    }
                  />
                  <Input
                    label="Max % *"
                    type="number"
                    min={0}
                    max={100}
                    step="0.01"
                    required
                    value={band.maximumPercentage}
                    onChange={(event) =>
                      updateBand(index, { maximumPercentage: event.target.value })
                    }
                  />
                  <Input
                    label="Points"
                    type="number"
                    min={0}
                    step="0.01"
                    value={band.gradePoint ?? ''}
                    onChange={(event) => updateBand(index, { gradePoint: event.target.value })}
                  />
                  <Input
                    label="Remark"
                    placeholder="Excellent"
                    value={band.remark ?? ''}
                    onChange={(event) => updateBand(index, { remark: event.target.value })}
                  />
                  <button
                    type="button"
                    onClick={() => removeBand(index)}
                    className="mb-0.5 flex h-9 w-9 items-center justify-center justify-self-end rounded-lg text-warm-400 transition-colors hover:bg-danger-50 hover:text-danger-600"
                    aria-label={`Remove grade ${band.grade || index + 1}`}
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </form>
    </Modal>
  );
}
