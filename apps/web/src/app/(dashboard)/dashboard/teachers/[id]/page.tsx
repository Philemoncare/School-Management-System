'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { apiFetch } from '@/lib/api/client';
import { useAuth } from '@/context/auth-context';
import { collectUserRoles } from '@/lib/auth/roles';
import { Button } from '@/components/ui/button';
import { Input, Select } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { FormActions, FormError } from '@/components/ui/form';
import { showFeedback } from '@/components/layout/global-feedback';
import {
  ArrowLeft,
  Edit3,
  Loader2,
  Mail,
  Phone,
  Plus,
  RefreshCw,
  ShieldCheck,
  Save,
  User,
  Users,
} from 'lucide-react';

interface Teacher {
  id: string;
  firstName: string;
  middleName?: string | null;
  lastName: string;
  employeeId?: string | null;
  specialization?: string | null;
  status: string;
  departmentId?: string | null;
  positionId?: string | null;
  userId?: string | null;
  schoolId: string;
  department?: { id: string; name: string } | null;
  position?: { id: string; name: string } | null;
  user?: { id: string; email: string; firstName: string; lastName: string; isActive: boolean; phone?: string | null } | null;
}

interface Department {
  id: string;
  name: string;
  code?: string;
}

interface Position {
  id: string;
  name: string;
  departmentId?: string | null;
  department?: { id: string; name: string } | null;
}

const STATUS_OPTIONS = [
  { value: 'ACTIVE', label: 'Active' },
  { value: 'SUSPENDED', label: 'Suspended' },
  { value: 'INACTIVE', label: 'Inactive' },
];

const STATUS_STYLES: Record<string, string> = {
  ACTIVE: 'bg-success-100 text-success-800',
  SUSPENDED: 'bg-warning-100 text-warning-800',
  INACTIVE: 'bg-warm-100 text-warm-700',
};

export default function TeacherProfilePage() {
  const params = useParams();
  const rawId = params?.id;
  const teacherId = Array.isArray(rawId) ? rawId[0] : rawId;
  const { user, activeSchoolId } = useAuth();
  const roles = useMemo(() => collectUserRoles(user, activeSchoolId), [user, activeSchoolId]);
  const canManage = roles.some((role) =>
    ['SCHOOL_ADMIN', 'PRINCIPAL', 'HR_OFFICER', 'RECEPTIONIST'].includes(role),
  );

  const [data, setData] = useState<Teacher | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [editOpen, setEditOpen] = useState(false);

  const load = useCallback(async () => {
    if (!teacherId) return;
    setLoading(true);
    setError('');
    try {
      const result = await apiFetch(`/teachers/${teacherId}`);
      setData(result);
    } catch (err: any) {
      setData(null);
      setError(err?.message || 'Could not load this teacher.');
    } finally {
      setLoading(false);
    }
  }, [teacherId]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center gap-2 py-20 text-sm font-medium text-warm-500">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading teacher profile…
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="mx-auto max-w-xl space-y-4 py-16 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-danger-50 text-danger-600">
          <User size={24} />
        </div>
        <h1 className="text-xl font-bold text-charcoal-900">Teacher not available</h1>
        <p className="text-sm text-warm-500">{error || 'This teacher could not be found in your school.'}</p>
        <div className="flex flex-col justify-center gap-3 sm:flex-row">
          <Button variant="outline" onClick={load} leftIcon={<RefreshCw size={16} />}>
            Try again
          </Button>
          <Link href="/dashboard/teachers">
            <Button variant="primary">Back to teachers</Button>
          </Link>
        </div>
      </div>
    );
  }

  const { firstName, middleName, lastName, employeeId, specialization, status, department, position, user: teacherUser } = data;
  const fullName = `${firstName} ${middleName ? middleName + ' ' : ''}${lastName}`;

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Link
          href="/dashboard/teachers"
          className="inline-flex items-center gap-2 text-xs font-semibold text-warm-600 hover:text-charcoal-900"
        >
          <ArrowLeft size={16} /> Back to teachers
        </Link>
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
          <Button
            variant="outline"
            size="sm"
            onClick={() => setEditOpen(true)}
            leftIcon={<Edit3 size={14} />}
          >
            Edit
          </Button>
        )}
      </div>

      <section className="rounded-2xl border border-warm-200 bg-card p-5 shadow-xs sm:p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-sage-100 text-xl font-bold text-forest-800">
              <Users className="text-md" />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl font-bold tracking-tight text-charcoal-900 sm:text-2xl">
                  {fullName}
                </h1>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase ${STATUS_STYLES[status] ?? 'bg-warm-100 text-warm-700'}`}
                >
                  {status}
                </span>
              </div>
              <p className="mt-1 font-mono text-xs text-warm-600">
                {employeeId}
                {department?.name ? ` · ${department.name}` : ''}
                {position?.name ? ` · ${position.name}` : ''}
              </p>
              <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-xs text-warm-500">
                <span className="inline-flex items-center gap-1.5">
                  <Mail className="text-md" />
                  {teacherUser?.email || 'No email on file'}
                </span>
                {teacherUser?.phone && (
                  <span className="inline-flex items-center gap-1.5">
                    <Phone className="text-md" />
                    {teacherUser.phone}
                  </span>
                )}
              </div>
            </div>
          </div>

          {canManage && (
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setEditOpen(true)}
                leftIcon={<Edit3 size={14} />}
              >
                Edit
              </Button>
            </div>
          )}
        </div>
      </section>

      <section className="rounded-2xl border border-warm-200 bg-card p-5 shadow-xs sm:p-6">
        <h2 className="text-sm font-bold text-charcoal-900 mb-4">Employment Details</h2>
        <dl className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2 lg:grid-cols-4">
          <dt className="text-[10px] font-bold uppercase tracking-wide text-warm-500">
            Employee ID
          </dt>
          <dd className="mt-1 text-sm font-semibold text-charcoal-900 font-mono">
            {employeeId}
          </dd>
          <dt className="text-[10px] font-bold uppercase tracking-wide text-warm-500">
            Specialization
          </dt>
          <dd className="mt-1 text-sm font-semibold text-charcoal-900">
            {specialization || '—'}
          </dd>
          <dt className="text-[10px] font-bold uppercase tracking-wide text-warm-500">
            Department
          </dt>
          <dd className="mt-1 text-sm font-semibold text-charcoal-900">
            {department?.name || '—'}
          </dd>
          <dt className="text-[10px] font-bold uppercase tracking-wide text-warm-500">
            Position
          </dt>
          <dd className="mt-1 text-sm font-semibold text-charcoal-900">
            {position?.name || '—'}
          </dd>
          <dt className="text-[10px] font-bold uppercase tracking-wide text-warm-500">
            Account Status
          </dt>
          <dd className="mt-1 text-sm font-semibold text-charcoal-900">
            {teacherUser?.isActive ? 'Active' : 'Inactive'}
          </dd>
          <dt className="text-[10px] font-bold uppercase tracking-wide text-warm-500">
            School
          </dt>
          <dd className="mt-1 text-sm font-semibold text-charcoal-900">
            {activeSchoolId}
          </dd>
        </dl>
      </section>
    </div>
  );
}

function EditTeacherModal({
  teacher,
  onClose,
  onSaved,
}: {
  teacher: Teacher;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState({
    firstName: teacher.firstName ?? '',
    middleName: teacher.middleName ?? '',
    lastName: teacher.lastName ?? '',
    email: teacher.user?.email ?? '',
    phone: teacher.user?.phone ?? '',
    employeeId: teacher.employeeId ?? '',
    specialization: teacher.specialization ?? '',
    departmentId: teacher.departmentId ?? '',
    positionId: teacher.positionId ?? '',
    status: teacher.status,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const [departments, setDepartments] = useState<Department[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [optionsLoading, setOptionsLoading] = useState(true);
  const [optionsError, setOptionsError] = useState('');

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setOptionsLoading(true);
      setOptionsError('');
      try {
        const [departmentData, positionData] = await Promise.all([
          apiFetch('/hr/departments'),
          apiFetch('/hr/positions'),
        ]);
        if (cancelled) return;
        setDepartments(Array.isArray(departmentData) ? departmentData : []);
        setPositions(Array.isArray(positionData) ? positionData : []);
      } catch (err: any) {
        if (!cancelled) {
          setOptionsError(err?.message || 'Could not load departments and positions.');
        }
      } finally {
        if (!cancelled) setOptionsLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const departmentPositions = useMemo(() => {
    if (!form.departmentId) return positions;
    return positions.filter(
      (position) => !position.departmentId || position.departmentId === form.departmentId,
    );
  }, [positions, form.departmentId]);

  function changeDepartment(nextDepartmentId: string) {
    setForm((previous) => {
      const currentPosition = positions.find((position) => position.id === previous.positionId);
      const positionStillValid =
        !currentPosition ||
        !nextDepartmentId ||
        !currentPosition.departmentId ||
        currentPosition.departmentId === nextDepartmentId;
      return {
        ...previous,
        departmentId: nextDepartmentId,
        positionId: positionStillValid ? previous.positionId : '',
      };
    });
  }

  function validate() {
    const errors: Record<string, string> = {};
    if (!form.firstName.trim()) errors.firstName = 'First name is required.';
    if (!form.lastName.trim()) errors.lastName = 'Last name is required.';
    if (!form.email.trim()) errors.email = 'Email address is required.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      errors.email = 'Please enter a valid email address.';
    }
    if (form.phone.trim() && !/^\+?[\d\s\-()]{7,}$/.test(form.phone.trim())) {
      errors.phone = 'Please enter a valid phone number.';
    }
    setFieldErrors(errors);
    setError('');
    return Object.keys(errors).length === 0;
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (saving) return;
    if (!validate()) {
      showFeedback('WARNING', 'Please complete the required fields.');
      return;
    }

    setSaving(true);
    setError('');
    try {
      await apiFetch(`/teachers/${teacher.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          firstName: form.firstName.trim(),
          lastName: form.lastName.trim(),
          middleName: form.middleName.trim() || undefined,
          email: form.email.trim(),
          phone: form.phone.trim() || undefined,
          employeeId: form.employeeId.trim() || undefined,
          specialization: form.specialization.trim() || undefined,
          departmentId: form.departmentId || undefined,
          positionId: form.positionId || undefined,
          status: form.status,
        }),
      });
      showFeedback('SUCCESS', 'Teacher updated successfully.');
      onSaved();
    } catch (err: any) {
      const message = err?.message || 'Could not update the teacher.';
      setError(message);
      showFeedback('ERROR', message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      isOpen
      onClose={onClose}
      title="Edit Teacher"
      size="lg"
      footerActions={
        <>
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button
            type="submit"
            form="edit-teacher-form"
            isLoading={saving}
            leftIcon={<Save size={16} />}
          >
            Save Changes
          </Button>
        </>
      }
    >
      <form id="edit-teacher-form" onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <p role="alert" className="rounded-lg bg-danger-50 p-3 text-xs font-semibold text-danger-700">
            {error}
          </p>
        )}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            label="First name *"
            required
            value={form.firstName}
            error={fieldErrors.firstName}
            onChange={(event) => setForm({ ...form, firstName: event.target.value })}
          />
          <Input
            label="Last name *"
            required
            value={form.lastName}
            error={fieldErrors.lastName}
            onChange={(event) => setForm({ ...form, lastName: event.target.value })}
          />
          <Input
            label="Middle name"
            value={form.middleName}
            onChange={(event) => setForm({ ...form, middleName: event.target.value })}
          />
          <Input
            label="Email address *"
            type="email"
            required
            value={form.email}
            error={fieldErrors.email}
            onChange={(event) => setForm({ ...form, email: event.target.value })}
            leftIcon={<Mail className="h-4 w-4" />}
            helperText="Used for teacher portal login and communications."
          />
          <Input
            label="Phone number"
            value={form.phone}
            error={fieldErrors.phone}
            onChange={(event) => setForm({ ...form, phone: event.target.value })}
            leftIcon={<Phone className="h-4 w-4" />}
            helperText="Optional contact number."
          />
          <Input
            label="Employee ID"
            value={form.employeeId}
            error={fieldErrors.employeeId}
            onChange={(event) => setForm({ ...form, employeeId: event.target.value })}
            helperText="Unique employee identifier."
          />
          <Input
            label="Specialization"
            value={form.specialization}
            onChange={(event) => setForm({ ...form, specialization: event.target.value })}
            helperText="Subject area this teacher specializes in."
          />
          <Select
            label="Department"
            value={form.departmentId}
            placeholder="No department"
            options={[
              { value: '', label: 'No department' },
              ...departments.map((department) => ({
                value: department.id,
                label: department.name,
                description: department.code,
              })),
            ]}
            loading={optionsLoading}
            emptyMessage="No departments yet."
            onChange={(event) => changeDepartment(event.target.value)}
          />
          <Select
            label="Position"
            value={form.positionId}
            placeholder={
              !form.departmentId
                ? 'Select a position'
                : departmentPositions.length
                  ? 'Select a position'
                  : 'No positions for this department'
            }
            options={[
              { value: '', label: 'No position' },
              ...departmentPositions.map((position) => ({
                value: position.id,
                label: position.name,
                description: position.department?.name,
              })),
            ]}
            loading={optionsLoading}
            disabled={optionsLoading || (Boolean(form.departmentId) && departmentPositions.length === 0)}
            emptyMessage="No positions defined for this department."
            onChange={(event) => setForm({ ...form, positionId: event.target.value })}
          />
          <Select
            label="Employment status"
            value={form.status}
            options={STATUS_OPTIONS}
            onChange={(event) => setForm({ ...form, status: event.target.value })}
          />
        </div>

        <FormActions>
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button
            type="submit"
            form="edit-teacher-form"
            isLoading={saving}
            leftIcon={<Save size={16} />}
          >
            Save Changes
          </Button>
        </FormActions>
      </form>
    </Modal>
  );
}