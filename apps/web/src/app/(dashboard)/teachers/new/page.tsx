'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api/client';
import { useAuth } from '@/context/auth-context';
import { collectUserRoles } from '@/lib/auth/roles';
import { Input, Select } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { FormActions, FormError, FormGrid, FormNotice, FormSection } from '@/components/ui/form';
import { showFeedback } from '@/components/layout/global-feedback';
import { ArrowLeft, Loader2, Save, Users, Mail, Phone } from 'lucide-react';

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

export default function NewTeacherPage() {
  const router = useRouter();
  const { user, activeSchoolId } = useAuth();
  const roles = useMemo(() => collectUserRoles(user, activeSchoolId), [user, activeSchoolId]);
  const canCreate = roles.some((role) =>
    ['SCHOOL_ADMIN', 'PRINCIPAL', 'HR_OFFICER', 'RECEPTIONIST'].includes(role),
  );

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const [departments, setDepartments] = useState<Department[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [optionsLoading, setOptionsLoading] = useState(true);
  const [optionsError, setOptionsError] = useState('');

  const [form, setForm] = useState({
    firstName: '',
    middleName: '',
    lastName: '',
    email: '',
    phone: '',
    employeeId: '',
    specialization: '',
    departmentId: '',
    positionId: '',
    status: 'ACTIVE',
  });

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
    if (form.employeeId.trim() && !/^[A-Za-z0-9._-]{2,40}$/.test(form.employeeId.trim())) {
      errors.employeeId = 'Use 2–40 letters, numbers, dots, hyphens or underscores.';
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (saving) return;
    setError('');
    if (!validate()) {
      showFeedback('WARNING', 'Please complete the required fields.');
      return;
    }

    setSaving(true);
    try {
      const payload: Record<string, unknown> = {
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        email: form.email.trim(),
        status: form.status,
      };
      if (form.middleName.trim()) payload.middleName = form.middleName.trim();
      if (form.phone.trim()) payload.phone = form.phone.trim();
      if (form.employeeId.trim()) payload.employeeId = form.employeeId.trim();
      if (form.specialization.trim()) payload.specialization = form.specialization.trim();
      if (form.departmentId) payload.departmentId = form.departmentId;
      if (form.positionId) payload.positionId = form.positionId;

      const created = await apiFetch('/teachers', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      showFeedback('SUCCESS', 'Teacher registered successfully. The teacher can log in with their email address. They can use "Forgot Password" to set their own password.');
      router.push('/dashboard/teachers');
    } catch (err: any) {
      const message = err?.message || 'Could not register the teacher.';
      setError(message);
      showFeedback('ERROR', message);
    } finally {
      setSaving(false);
    }
  }

  if (!canCreate) {
    return (
      <div className="mx-auto max-w-3xl space-y-4 py-12 text-center">
        <h1 className="text-xl font-bold text-charcoal-900">Not available for your role</h1>
        <p className="text-sm text-warm-500">
          Only a school administrator, principal, HR officer, or receptionist can register teachers.
        </p>
        <Link href="/dashboard/teachers" className="text-sm font-semibold text-forest-700 underline">
          Back to teachers
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/dashboard/teachers"
          className="flex h-11 w-11 items-center justify-center rounded-xl border border-warm-200 bg-card text-warm-600 transition-colors hover:text-charcoal-900"
          aria-label="Back to teachers"
        >
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h1 className="flex items-center gap-2.5 text-2xl font-bold tracking-tight text-charcoal-900 sm:text-3xl">
            <Users className="h-6 w-6 text-forest-700" />
            Register Teacher
          </h1>
          <p className="mt-0.5 text-xs font-medium text-warm-500 sm:text-sm">
            Add a teaching staff member. An email address is required to create a portal login for the teacher.
          </p>
        </div>
      </div>

      {optionsError && <FormError message={optionsError} />}
      {error && <FormError message={error} />}

      <FormNotice title="Portal access">
        A user account is created automatically with the provided email address. The teacher will
        receive an invitation to set their password and log in to the SchooMA portal.
      </FormNotice>

      <form
        onSubmit={handleSubmit}
        className="space-y-6 rounded-2xl border border-warm-200 bg-card p-5 shadow-xs sm:p-8"
        noValidate
      >
        <FormSection title="Personal details">
          <FormGrid>
            <Input
              label="First name *"
              required
              placeholder="e.g. Kwame"
              value={form.firstName}
              error={fieldErrors.firstName}
              onChange={(event) => setForm({ ...form, firstName: event.target.value })}
            />
            <Input
              label="Last name *"
              required
              placeholder="e.g. Appiah"
              value={form.lastName}
              error={fieldErrors.lastName}
              onChange={(event) => setForm({ ...form, lastName: event.target.value })}
            />
            <Input
              label="Middle name"
              placeholder="Optional"
              value={form.middleName}
              onChange={(event) => setForm({ ...form, middleName: event.target.value })}
            />
            <Input
              label="Email address *"
              type="email"
              required
              placeholder="e.g. kwame.appiah@school.edu"
              value={form.email}
              error={fieldErrors.email}
              onChange={(event) => setForm({ ...form, email: event.target.value })}
              leftIcon={<Mail className="h-4 w-4" />}
              helperText="Used for teacher portal login and communications."
            />
            <Input
              label="Phone number"
              placeholder="+233 20 000 0000"
              value={form.phone}
              error={fieldErrors.phone}
              onChange={(event) => setForm({ ...form, phone: event.target.value })}
              leftIcon={<Phone className="h-4 w-4" />}
              helperText="Optional contact number for the teacher."
            />
            <Select
              label="Employment status"
              value={form.status}
              options={STATUS_OPTIONS}
              onChange={(event) => setForm({ ...form, status: event.target.value })}
              helperText="Only active teachers can be assigned to classes or timetables."
            />
          </FormGrid>
        </FormSection>

        <FormSection
          title="Employment"
          description="Departments and positions come from HR setup. Pick a department first to narrow the positions."
        >
          <FormGrid>
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
              emptyMessage="No departments yet. Add one from HR &rarr; Departments."
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
            <Input
              label="Employee ID"
              placeholder="Optional"
              value={form.employeeId}
              error={fieldErrors.employeeId}
              helperText="Leave blank to use the school&rsquo;s staff numbering rule."
              onChange={(event) => setForm({ ...form, employeeId: event.target.value })}
            />
            <Input
              label="Specialization"
              placeholder="Optional, e.g. Mathematics, Physics, English"
              value={form.specialization}
              helperText="The subject area this teacher specializes in."
              onChange={(event) => setForm({ ...form, specialization: event.target.value })}
            />
          </FormGrid>
          {optionsLoading && (
            <p className="flex items-center gap-2 text-xs text-warm-500">
              <Loader2 className="h-3.5 w-3.5 animate-spin" /> Loading HR options&hellip;
            </p>
          )}
        </FormSection>

        <FormActions>
          <Link
            href="/dashboard/teachers"
            className="rounded-xl border border-warm-200 px-5 py-2.5 text-center text-xs font-bold text-warm-600 transition-colors hover:bg-warm-50"
          >
            Cancel
          </Link>
          <Button
            type="submit"
            size="lg"
            isLoading={saving}
            leftIcon={<Save size={16} />}
            disabled={optionsLoading}
          >
            Register Teacher
          </Button>
        </FormActions>
      </form>
    </div>
  );
}