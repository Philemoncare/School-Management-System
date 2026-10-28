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
  Layers,
  Loader2,
  PencilLine,
  Plus,
  RefreshCw,
  Search,
} from 'lucide-react';

interface AssessmentType {
  id: string;
  name: string;
  code: string;
  description?: string | null;
  category: string;
  isActive: boolean;
  schoolId?: string | null;
}

export default function AssessmentTypesPage() {
  const { user, activeSchoolId } = useAuth();
  const roles = useMemo(() => collectUserRoles(user, activeSchoolId), [user, activeSchoolId]);
  const canManage = roles.some((role) => ['SCHOOL_ADMIN', 'PRINCIPAL'].includes(role));

  const [types, setTypes] = useState<AssessmentType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [editType, setEditType] = useState<AssessmentType | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await apiFetch('/assessments/types');
      setTypes(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setTypes([]);
      setError(err?.message || 'Could not load assessment types.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function toggleActive(type: AssessmentType) {
    if (!canManage || !type.schoolId) return;
    setBusyId(type.id);
    try {
      await apiFetch(`/assessments/types/${type.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ isActive: !type.isActive }),
      });
      showFeedback('SUCCESS', `Assessment type ${type.isActive ? 'deactivated' : 'reactivated'}.`);
      await load();
    } catch (err: any) {
      showFeedback('ERROR', err?.message || 'Could not update the assessment type.');
    } finally {
      setBusyId(null);
    }
  }

  const visible = types.filter((type) => {
    const needle = search.trim().toLowerCase();
    if (!needle) return true;
    return (
      type.name.toLowerCase().includes(needle) ||
      type.code.toLowerCase().includes(needle) ||
      (type.description ?? '').toLowerCase().includes(needle)
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
          <h1 className="flex items-center gap-3 text-2xl font-bold tracking-tight text-charcoal-900 sm:text-3xl">
            <Layers className="text-forest-700" size={26} /> Assessment Types
          </h1>
          <p className="mt-0.5 text-xs font-medium text-warm-500 sm:text-sm">
            Categories used when creating assessments, such as exam, quiz or assignment.
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
              New Category
            </Button>
          )}
        </div>
      </div>

      <div className="w-full max-w-md">
        <Input
          type="search"
          aria-label="Search assessment types"
          placeholder="Search by name or code…"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          leftIcon={<Search size={16} />}
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

      {loading && types.length === 0 ? (
        <div className="flex items-center justify-center gap-2 py-16 text-sm font-medium text-warm-500">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading assessment types…
        </div>
      ) : visible.length === 0 && !error ? (
        <EmptyState
          icon={<Layers className="h-8 w-8" />}
          title={search ? 'No matching categories' : 'No assessment types yet'}
          description={
            search
              ? 'Try a different name or code.'
              : 'Create categories such as Exam, Quiz or Assignment before creating assessments.'
          }
          actionButton={
            canManage && !search ? (
              <Button onClick={() => setCreateOpen(true)} leftIcon={<Plus size={16} />}>
                New Category
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="overflow-hidden rounded-xl border border-warm-200 bg-card shadow-xs">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-warm-200">
              <caption className="sr-only">Assessment types</caption>
              <thead className="bg-ivory-50">
                <tr>
                  {['Name & code', 'Category', 'Description', 'Status', 'Actions'].map((heading) => (
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
                {visible.map((type) => (
                  <tr key={type.id} className="transition-colors hover:bg-sage-50/30">
                    <td className="whitespace-nowrap px-4 py-3.5 sm:px-6">
                      <p className="text-sm font-semibold text-charcoal-900">{type.name}</p>
                      <p className="mt-0.5 font-mono text-[11px] font-semibold uppercase text-forest-700">
                        {type.code}
                      </p>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3.5 text-[11px] font-semibold uppercase tracking-wide text-warm-600 sm:px-6">
                      {type.category.replaceAll('_', ' ')}
                    </td>
                    <td className="max-w-xs px-4 py-3.5 text-xs text-warm-500 sm:px-6">
                      <span className="line-clamp-2">{type.description || 'No description'}</span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3.5 sm:px-6">
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase ${
                          type.isActive ? 'bg-success-100 text-success-800' : 'bg-warm-100 text-warm-600'
                        }`}
                      >
                        {type.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3.5 text-right sm:px-6">
                      {!type.schoolId ? (
                        <span className="text-[11px] font-medium text-warm-400">System type</span>
                      ) : canManage ? (
                        <div className="flex flex-wrap items-center justify-end gap-2">
                          <Button
                            variant="outline"
                            size="xs"
                            onClick={() => setEditType(type)}
                            leftIcon={<PencilLine size={12} />}
                          >
                            Edit
                          </Button>
                          <Button
                            variant="ghost"
                            size="xs"
                            onClick={() => toggleActive(type)}
                            isLoading={busyId === type.id}
                          >
                            {type.isActive ? 'Deactivate' : 'Reactivate'}
                          </Button>
                        </div>
                      ) : (
                        <span className="text-xs text-warm-400">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {createOpen && (
        <TypeFormModal
          onClose={() => setCreateOpen(false)}
          onSaved={() => {
            setCreateOpen(false);
            load();
          }}
        />
      )}

      {editType && (
        <TypeFormModal
          type={editType}
          onClose={() => setEditType(null)}
          onSaved={() => {
            setEditType(null);
            load();
          }}
        />
      )}
    </div>
  );
}

function TypeFormModal({
  type,
  onClose,
  onSaved,
}: {
  type?: AssessmentType;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState({
    name: type?.name ?? '',
    code: type?.code ?? '',
    description: type?.description ?? '',
    isActive: type?.isActive ?? true,
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
    setSaving(true);
    setError('');
    try {
      await apiFetch(type ? `/assessments/types/${type.id}` : '/assessments/types', {
        method: type ? 'PATCH' : 'POST',
        body: JSON.stringify({
          name: form.name.trim(),
          code: form.code.trim().toUpperCase(),
          description: form.description.trim() || undefined,
          isActive: form.isActive,
        }),
      });
      showFeedback('SUCCESS', type ? 'Assessment type updated.' : 'Assessment type created.');
      onSaved();
    } catch (err: any) {
      setError(err?.message || 'Could not save the assessment type.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      isOpen
      onClose={onClose}
      title={type ? 'Edit assessment type' : 'New assessment type'}
      footerActions={
        <>
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" form="assessment-type-form" isLoading={saving}>
            {type ? 'Save changes' : 'Create type'}
          </Button>
        </>
      }
    >
      <form id="assessment-type-form" onSubmit={submit} className="space-y-4">
        {error && (
          <p role="alert" className="rounded-lg bg-danger-50 p-3 text-xs font-semibold text-danger-700">
            {error}
          </p>
        )}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            label="Name *"
            required
            placeholder="Mid-term Examination"
            value={form.name}
            onChange={(event) => setForm({ ...form, name: event.target.value })}
          />
          <Input
            label="Code *"
            required
            placeholder="MIDTERM"
            value={form.code}
            onChange={(event) => setForm({ ...form, code: event.target.value })}
          />
          <Select
            label="Status"
            value={form.isActive ? 'ACTIVE' : 'INACTIVE'}
            options={[
              { value: 'ACTIVE', label: 'Active' },
              { value: 'INACTIVE', label: 'Inactive' },
            ]}
            onChange={(event) => setForm({ ...form, isActive: event.target.value === 'ACTIVE' })}
          />
        </div>
        <Input
          label="Description"
          placeholder="Optional description shown to staff"
          value={form.description}
          onChange={(event) => setForm({ ...form, description: event.target.value })}
        />
        <p className="text-xs text-warm-500">
          The category (continuous assessment, examination) is fixed by the school&apos;s
          assessment policy and is not editable here.
        </p>
      </form>
    </Modal>
  );
}
