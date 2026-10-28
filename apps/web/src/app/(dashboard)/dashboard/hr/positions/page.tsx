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
  Briefcase,
  Loader2,
  PencilLine,
  Plus,
  RefreshCw,
  Search,
  Users,
} from 'lucide-react';

interface Position {
  id: string;
  name: string;
  description?: string | null;
  departmentId?: string | null;
  department?: { id: string; name: string } | null;
  _count?: { staff: number; teachers: number };
}

interface Department {
  id: string;
  name: string;
}

export default function PositionsPage() {
  const { user, activeSchoolId } = useAuth();
  const roles = useMemo(() => collectUserRoles(user, activeSchoolId), [user, activeSchoolId]);
  const canManage = roles.some((role) => ['HR_OFFICER', 'SCHOOL_ADMIN'].includes(role));

  const [positions, setPositions] = useState<Position[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('ALL');
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<Position | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [positionData, departmentData] = await Promise.all([
        apiFetch('/hr/positions'),
        apiFetch('/hr/departments'),
      ]);
      setPositions(Array.isArray(positionData) ? positionData : []);
      setDepartments(Array.isArray(departmentData) ? departmentData : []);
    } catch (err: any) {
      setPositions([]);
      setError(err?.message || 'Could not load positions.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const visible = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return positions.filter((position) => {
      if (departmentFilter !== 'ALL' && position.departmentId !== departmentFilter) return false;
      if (!needle) return true;
      return (
        position.name.toLowerCase().includes(needle) ||
        (position.department?.name ?? '').toLowerCase().includes(needle) ||
        (position.description ?? '').toLowerCase().includes(needle)
      );
    });
  }, [positions, search, departmentFilter]);

  const filtersActive = Boolean(search) || departmentFilter !== 'ALL';

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Link
            href="/dashboard/hr"
            className="mb-2 inline-flex items-center gap-1.5 text-xs font-semibold text-warm-600 hover:text-charcoal-900"
          >
            <ArrowLeft size={14} /> Human resources
          </Link>
          <h1 className="flex items-center gap-3 text-2xl font-bold tracking-tight text-charcoal-900 sm:text-3xl">
            <Briefcase className="text-forest-700" size={26} /> Positions
          </h1>
          <p className="mt-0.5 text-xs font-medium text-warm-500 sm:text-sm">
            Job titles used when employing staff and teachers.
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
            <Button size="sm" onClick={() => setCreating(true)} leftIcon={<Plus size={16} />}>
              New position
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Input
          type="search"
          aria-label="Search positions"
          placeholder="Search positions…"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          leftIcon={<Search size={16} />}
        />
        <Select
          aria-label="Filter by department"
          value={departmentFilter}
          options={[
            { value: 'ALL', label: 'All departments' },
            ...departments.map((department) => ({
              value: department.id,
              label: department.name,
            })),
          ]}
          onChange={(event) => setDepartmentFilter(event.target.value)}
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

      {loading && positions.length === 0 ? (
        <div className="flex items-center justify-center gap-2 py-16 text-sm font-medium text-warm-500">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading positions…
        </div>
      ) : positions.length === 0 && !error ? (
        <EmptyState
          icon={<Briefcase className="h-8 w-8" />}
          title="No positions defined"
          description="Create job titles such as Teacher, Bursar or Librarian before recording employment."
          actionButton={
            canManage ? (
              <Button onClick={() => setCreating(true)} leftIcon={<Plus size={16} />}>
                Create position
              </Button>
            ) : undefined
          }
        />
      ) : visible.length === 0 && !error ? (
        <EmptyState
          icon={<Search className="h-8 w-8" />}
          title="No positions match these filters"
          description="Change the search text or department to see other positions."
          actionButton={
            filtersActive ? (
              <Button
                variant="outline"
                onClick={() => {
                  setSearch('');
                  setDepartmentFilter('ALL');
                }}
              >
                Clear filters
              </Button>
            ) : undefined
          }
        />
      ) : (
        <section className="overflow-hidden rounded-xl border border-warm-200 bg-card shadow-xs">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-warm-200">
              <caption className="sr-only">Job positions</caption>
              <thead className="bg-ivory-50">
                <tr>
                  {['Position', 'Department', 'People', 'Description', 'Actions'].map((heading) => (
                    <th
                      key={heading}
                      scope="col"
                      className={`whitespace-nowrap px-4 py-3 text-[11px] font-bold uppercase tracking-wide text-warm-500 sm:px-6 ${
                        heading === 'Actions' ? 'text-right' : 'text-left'
                      }`}
                    >
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-warm-100">
                {visible.map((position) => {
                  const people =
                    (position._count?.staff ?? 0) + (position._count?.teachers ?? 0);
                  return (
                    <tr key={position.id} className="transition-colors hover:bg-sage-50/30">
                      <td className="px-4 py-3.5 sm:px-6">
                        <p className="text-sm font-semibold text-charcoal-900">{position.name}</p>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3.5 sm:px-6">
                        {position.department ? (
                          <span className="rounded-lg bg-warm-100 px-2 py-1 text-[11px] font-bold text-warm-600">
                            {position.department.name}
                          </span>
                        ) : (
                          <span className="text-xs text-warm-400">Unassigned</span>
                        )}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3.5 sm:px-6">
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-warm-600">
                          <Users size={13} className="text-warm-400" /> {people}
                        </span>
                      </td>
                      <td className="max-w-xs px-4 py-3.5 text-xs text-warm-500 sm:px-6">
                        <span className="line-clamp-2">{position.description || '—'}</span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3.5 text-right sm:px-6">
                        {canManage ? (
                          <Button
                            variant="outline"
                            size="xs"
                            onClick={() => setEditing(position)}
                            leftIcon={<PencilLine size={12} />}
                          >
                            Edit
                          </Button>
                        ) : (
                          <span className="text-xs text-warm-400">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="border-t border-warm-100 bg-ivory-50/40 px-5 py-3 text-[11px] font-medium text-warm-500 sm:px-6">
            Showing {visible.length} of {positions.length} position
            {positions.length === 1 ? '' : 's'}.
          </div>
        </section>
      )}

      {(creating || editing) && (
        <PositionModal
          position={editing ?? undefined}
          departments={departments}
          onClose={() => {
            setCreating(false);
            setEditing(null);
          }}
          onSaved={() => {
            setCreating(false);
            setEditing(null);
            load();
          }}
        />
      )}
    </div>
  );
}

function PositionModal({
  position,
  departments,
  onClose,
  onSaved,
}: {
  position?: Position;
  departments: Department[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState({
    name: position?.name ?? '',
    departmentId: position?.departmentId ?? '',
    description: position?.description ?? '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (saving) return;
    if (!form.name.trim()) {
      setError('Enter a position name.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await apiFetch(position ? `/hr/positions/${position.id}` : '/hr/positions', {
        method: position ? 'PATCH' : 'POST',
        body: JSON.stringify({
          name: form.name.trim(),
          departmentId: form.departmentId || undefined,
          description: form.description.trim() || undefined,
        }),
      });
      showFeedback('SUCCESS', position ? 'Position updated.' : 'Position created.');
      onSaved();
    } catch (err: any) {
      setError(err?.message || 'Could not save the position.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      isOpen
      onClose={onClose}
      title={position ? 'Edit position' : 'New position'}
      footerActions={
        <>
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" form="position-form" isLoading={saving}>
            {position ? 'Save changes' : 'Create position'}
          </Button>
        </>
      }
    >
      <form id="position-form" onSubmit={submit} className="space-y-4">
        {error && (
          <p role="alert" className="rounded-lg bg-danger-50 p-3 text-xs font-semibold text-danger-700">
            {error}
          </p>
        )}
        <Input
          label="Position name *"
          required
          placeholder="Senior Science Teacher"
          value={form.name}
          onChange={(event) => setForm({ ...form, name: event.target.value })}
        />
        <Select
          label="Department"
          value={form.departmentId}
          options={[
            { value: '', label: 'No department' },
            ...departments.map((department) => ({
              value: department.id,
              label: department.name,
            })),
          ]}
          onChange={(event) => setForm({ ...form, departmentId: event.target.value })}
        />
        <div className="space-y-1.5">
          <label htmlFor="position-description" className="block text-xs font-semibold text-charcoal-800">
            Description
          </label>
          <textarea
            id="position-description"
            rows={3}
            className="w-full resize-none rounded-lg border border-warm-300 bg-card p-3 text-sm text-charcoal-900 placeholder:text-warm-400 focus:border-forest-600 focus:outline-none focus:ring-2 focus:ring-forest-600/20"
            placeholder="Responsibilities or grade notes for this role."
            value={form.description ?? ''}
            onChange={(event) => setForm({ ...form, description: event.target.value })}
          />
        </div>
      </form>
    </Modal>
  );
}
