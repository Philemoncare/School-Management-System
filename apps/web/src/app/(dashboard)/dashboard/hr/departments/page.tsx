'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { apiFetch } from '@/lib/api/client';
import { useAuth } from '@/context/auth-context';
import { collectUserRoles } from '@/lib/auth/roles';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { EmptyState } from '@/components/ui/empty-state';
import { showFeedback } from '@/components/layout/global-feedback';
import {
  ArrowLeft,
  Building2,
  Briefcase,
  Loader2,
  PencilLine,
  Plus,
  RefreshCw,
  Search,
  User,
  Users,
} from 'lucide-react';

interface Department {
  id: string;
  name: string;
  code: string;
  description?: string | null;
  headStaffId?: string | null;
  headTeacherId?: string | null;
  headStaff?: { id: string; firstName: string; lastName: string } | null;
  headTeacher?: { id: string; firstName: string; lastName: string } | null;
  _count?: { staff: number; teachers: number; positions: number };
}

interface DirectoryEntry {
  id: string;
  firstName: string;
  lastName: string;
  type: 'STAFF' | 'TEACHER';
}

export default function DepartmentsPage() {
  const { user, activeSchoolId } = useAuth();
  const roles = useMemo(() => collectUserRoles(user, activeSchoolId), [user, activeSchoolId]);
  const canManage = roles.some((role) => ['HR_OFFICER', 'SCHOOL_ADMIN'].includes(role));

  const [departments, setDepartments] = useState<Department[]>([]);
  const [people, setPeople] = useState<DirectoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<Department | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [departmentData, directoryData] = await Promise.all([
        apiFetch('/hr/departments'),
        apiFetch('/hr/staff'),
      ]);
      setDepartments(Array.isArray(departmentData) ? departmentData : []);
      setPeople(Array.isArray(directoryData) ? directoryData : []);
    } catch (err: any) {
      setDepartments([]);
      setError(err?.message || 'Could not load departments.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const visible = useMemo(() => {
    const needle = search.trim().toLowerCase();
    if (!needle) return departments;
    return departments.filter(
      (department) =>
        department.name.toLowerCase().includes(needle) ||
        department.code.toLowerCase().includes(needle) ||
        (department.description ?? '').toLowerCase().includes(needle),
    );
  }, [departments, search]);

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
            <Building2 className="text-forest-700" size={26} /> Departments
          </h1>
          <p className="mt-0.5 text-xs font-medium text-warm-500 sm:text-sm">
            Organisational units, their heads and the staff attached to each.
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
              New department
            </Button>
          )}
        </div>
      </div>

      <div className="w-full max-w-md">
        <Input
          type="search"
          aria-label="Search departments"
          placeholder="Search by name, code or description…"
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

      {loading && departments.length === 0 ? (
        <div className="flex items-center justify-center gap-2 py-16 text-sm font-medium text-warm-500">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading departments…
        </div>
      ) : departments.length === 0 && !error ? (
        <EmptyState
          icon={<Building2 className="h-8 w-8" />}
          title="No departments yet"
          description="Create departments so staff, positions and assets can be grouped."
          actionButton={
            canManage ? (
              <Button onClick={() => setCreating(true)} leftIcon={<Plus size={16} />}>
                Create department
              </Button>
            ) : undefined
          }
        />
      ) : visible.length === 0 && !error ? (
        <EmptyState
          icon={<Search className="h-8 w-8" />}
          title="No matching departments"
          description="Try a different name or code."
          actionButton={
            <Button variant="outline" onClick={() => setSearch('')}>
              Clear search
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((department) => {
            const head =
              department.headStaff ?? department.headTeacher ?? null;
            const staffCount =
              (department._count?.staff ?? 0) + (department._count?.teachers ?? 0);
            return (
              <section
                key={department.id}
                className="flex flex-col rounded-xl border border-warm-200 bg-card p-5 shadow-xs transition-shadow hover:shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-sage-50 text-forest-700">
                    <Building2 size={20} />
                  </span>
                  <span className="rounded-lg bg-warm-100 px-2 py-1 font-mono text-[10px] font-bold uppercase tracking-wide text-warm-600">
                    {department.code}
                  </span>
                </div>

                <h2 className="mt-4 text-base font-bold text-charcoal-900">{department.name}</h2>
                <p className="mt-1 line-clamp-2 min-h-[2rem] text-xs text-warm-500">
                  {department.description || 'No description recorded.'}
                </p>

                <dl className="mt-4 space-y-2 border-t border-ivory-100 pt-4 text-xs">
                  <div className="flex items-center gap-2 text-warm-600">
                    <User size={14} className="text-warm-400" />
                    <dt className="sr-only">Head of department</dt>
                    <dd>
                      {head ? `${head.firstName} ${head.lastName}` : 'No head assigned'}
                    </dd>
                  </div>
                  <div className="flex items-center gap-2 text-warm-600">
                    <Users size={14} className="text-warm-400" />
                    <dt className="sr-only">Staff</dt>
                    <dd>
                      {staffCount} staff member{staffCount === 1 ? '' : 's'}
                    </dd>
                  </div>
                  <div className="flex items-center gap-2 text-warm-600">
                    <Briefcase size={14} className="text-warm-400" />
                    <dt className="sr-only">Positions</dt>
                    <dd>{department._count?.positions ?? 0} position(s)</dd>
                  </div>
                </dl>

                {canManage && (
                  <div className="mt-4 border-t border-ivory-100 pt-4">
                    <Button
                      variant="outline"
                      size="xs"
                      onClick={() => setEditing(department)}
                      leftIcon={<PencilLine size={12} />}
                    >
                      Edit department
                    </Button>
                  </div>
                )}
              </section>
            );
          })}
        </div>
      )}

      {(creating || editing) && (
        <DepartmentModal
          department={editing ?? undefined}
          people={people}
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

function DepartmentModal({
  department,
  people,
  onClose,
  onSaved,
}: {
  department?: Department;
  people: DirectoryEntry[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const currentHead = department?.headStaffId
    ? `staff:${department.headStaffId}`
    : department?.headTeacherId
      ? `teacher:${department.headTeacherId}`
      : '';

  const [form, setForm] = useState({
    name: department?.name ?? '',
    code: department?.code ?? '',
    description: department?.description ?? '',
    head: currentHead,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const headOptions = [
    { value: '', label: 'No head assigned' },
    ...people.map((person) => ({
      value: `${person.type === 'STAFF' ? 'staff' : 'teacher'}:${person.id}`,
      label: `${person.firstName} ${person.lastName} (${person.type === 'STAFF' ? 'Staff' : 'Teacher'})`,
    })),
  ];

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (saving) return;
    if (!form.name.trim() || !form.code.trim()) {
      setError('Department name and code are required.');
      return;
    }

    const [headType, headId] = form.head ? form.head.split(':') : ['', ''];
    setSaving(true);
    setError('');
    try {
      await apiFetch(
        department ? `/hr/departments/${department.id}` : '/hr/departments',
        {
          method: department ? 'PATCH' : 'POST',
          body: JSON.stringify({
            name: form.name.trim(),
            code: form.code.trim().toUpperCase(),
            description: form.description.trim() || undefined,
            headStaffId: headType === 'staff' ? headId : undefined,
            headTeacherId: headType === 'teacher' ? headId : undefined,
          }),
        },
      );
      showFeedback('SUCCESS', department ? 'Department updated.' : 'Department created.');
      onSaved();
    } catch (err: any) {
      setError(err?.message || 'Could not save the department.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      isOpen
      onClose={onClose}
      title={department ? 'Edit department' : 'New department'}
      footerActions={
        <>
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" form="department-form" isLoading={saving}>
            {department ? 'Save changes' : 'Create department'}
          </Button>
        </>
      }
    >
      <form id="department-form" onSubmit={submit} className="space-y-4">
        {error && (
          <p role="alert" className="rounded-lg bg-danger-50 p-3 text-xs font-semibold text-danger-700">
            {error}
          </p>
        )}
        <Input
          label="Department name *"
          required
          placeholder="Academics & Science"
          value={form.name}
          onChange={(event) => setForm({ ...form, name: event.target.value })}
        />
        <Input
          label="Code *"
          required
          placeholder="SCI"
          helperText="Short unique code used in reports, 2–12 characters."
          value={form.code}
          onChange={(event) => setForm({ ...form, code: event.target.value })}
        />
        <div className="space-y-1.5">
          <label htmlFor="department-head" className="block text-xs font-semibold text-charcoal-800">
            Head of department
          </label>
          <select
            id="department-head"
            className="w-full rounded-lg border border-warm-300 bg-card p-2.5 text-sm text-charcoal-900 focus:border-forest-600 focus:outline-none focus:ring-2 focus:ring-forest-600/20"
            value={form.head}
            onChange={(event) => setForm({ ...form, head: event.target.value })}
          >
            {headOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5">
          <label
            htmlFor="department-description"
            className="block text-xs font-semibold text-charcoal-800"
          >
            Description
          </label>
          <textarea
            id="department-description"
            rows={3}
            className="w-full resize-none rounded-lg border border-warm-300 bg-card p-3 text-sm text-charcoal-900 placeholder:text-warm-400 focus:border-forest-600 focus:outline-none focus:ring-2 focus:ring-forest-600/20"
            placeholder="What this department is responsible for."
            value={form.description ?? ''}
            onChange={(event) => setForm({ ...form, description: event.target.value })}
          />
        </div>
      </form>
    </Modal>
  );
}
