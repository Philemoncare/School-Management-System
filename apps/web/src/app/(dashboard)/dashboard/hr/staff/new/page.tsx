'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Loader2, Save, Users } from 'lucide-react';
import { apiFetch } from '@/lib/api/client';
import { Input, Select } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { FormActions, FormError, FormGrid, FormNotice, FormSection } from '@/components/ui/form';
import { showFeedback } from '@/components/layout/global-feedback';

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
  { value: 'TERMINATED', label: 'Terminated' },
  { value: 'RETIRED', label: 'Retired' },
];

export default function NewStaffPage() {
  const router = useRouter();
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
    employeeId: '',
    designation: '',
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
        status: form.status,
      };
      if (form.middleName.trim()) payload.middleName = form.middleName.trim();
      if (form.employeeId.trim()) payload.employeeId = form.employeeId.trim();
      if (form.designation.trim()) payload.designation = form.designation.trim();
      if (form.departmentId) payload.departmentId = form.departmentId;
      if (form.positionId) payload.positionId = form.positionId;

      const created = await apiFetch('/staff', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      showFeedback('SUCCESS', 'Staff member registered.');
      router.push(
        created?.id
          ? `/dashboard/hr/staff/${created.id}?type=STAFF`
          : '/dashboard/hr/staff',
      );
    } catch (err: any) {
      const message = err?.message || 'Could not register the staff member.';
      setError(message);
      showFeedback('ERROR', message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/dashboard/hr/staff"
          className="flex h-11 w-11 items-center justify-center rounded-xl border border-warm-200 bg-card text-warm-600 transition-colors hover:text-charcoal-900"
          aria-label="Back to staff directory"
        >
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h1 className="flex items-center gap-2.5 text-2xl font-bold tracking-tight text-charcoal-900 sm:text-3xl">
            <Users className="h-6 w-6 text-forest-700" />
            Register Employee
          </h1>
          <p className="mt-0.5 text-xs font-medium text-warm-500 sm:text-sm">
            Add a teaching or non-teaching member to the staff directory.
          </p>
        </div>
      </div>

      {optionsError && <FormError message={optionsError} />}
      {error && <FormError message={error} />}

      <FormNotice title="Portal access is managed separately">
        This form creates the employment record. To give this employee a SchooMA login, invite
        them from <Link href="/dashboard/users" className="underline">Users → Invitations</Link>.
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
            <Select
              label="Employment status"
              value={form.status}
              options={STATUS_OPTIONS}
              onChange={(event) => setForm({ ...form, status: event.target.value })}
              helperText="Only active employees can be assigned to classes or timetables."
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
              emptyMessage="No departments yet. Add one from HR → Departments."
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
              helperText="Leave blank to use the school's staff numbering rule."
              onChange={(event) => setForm({ ...form, employeeId: event.target.value })}
            />
            <Input
              label="Designation"
              placeholder="Optional, e.g. Senior Physics Teacher"
              value={form.designation}
              helperText="Defaults to the selected position."
              onChange={(event) => setForm({ ...form, designation: event.target.value })}
            />
          </FormGrid>
          {optionsLoading && (
            <p className="flex items-center gap-2 text-xs text-warm-500">
              <Loader2 className="h-3.5 w-3.5 animate-spin" /> Loading HR options…
            </p>
          )}
        </FormSection>

        <FormActions>
          <Link
            href="/dashboard/hr/staff"
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
            Save employee
          </Button>
        </FormActions>
      </form>
    </div>
  );
}
