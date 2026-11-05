'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Loader2, Save, Users, Mail, Briefcase, Phone } from 'lucide-react';
import { apiFetch } from '@/lib/api/client';
import { Input, Select } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
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
  { value: 'PROBATION', label: 'Probation' },
  { value: 'ON_LEAVE', label: 'On leave' },
  { value: 'SUSPENDED', label: 'Suspended' },
  { value: 'TERMINATED', label: 'Terminated' },
  { value: 'RESIGNED', label: 'Resigned' },
  { value: 'RETIRED', label: 'Retired' },
  { value: 'INACTIVE', label: 'Inactive' },
];

const GENDER_OPTIONS = [
  { value: '', label: 'Prefer not to say' },
  { value: 'MALE', label: 'Male' },
  { value: 'FEMALE', label: 'Female' },
  { value: 'OTHER', label: 'Other' },
  { value: 'UNSPECIFIED', label: 'Unspecified' },
];

const EMPLOYMENT_TYPE_OPTIONS = [
  { value: '', label: 'Not specified' },
  { value: 'FULL_TIME', label: 'Full-time' },
  { value: 'PART_TIME', label: 'Part-time' },
  { value: 'CONTRACT', label: 'Contract' },
  { value: 'CASUAL', label: 'Casual' },
  { value: 'INTERN', label: 'Intern' },
  { value: 'VOLUNTEER', label: 'Volunteer' },
];

const EMPTY_FORM = {
  firstName: '',
  middleName: '',
  lastName: '',
  employeeId: '',
  designation: '',
  departmentId: '',
  positionId: '',
  status: 'ACTIVE',
  // Contact & personal
  email: '',
  phone: '',
  altPhone: '',
  address: '',
  gender: '',
  dateOfBirth: '',
  photoUrl: '',
  // Employment
  employmentType: '',
  appointmentDate: '',
  commencementDate: '',
  contractEndDate: '',
  responsibilities: '',
  // Emergency contact
  emergencyContactName: '',
  emergencyContactPhone: '',
  emergencyContactRelationship: '',
};

export default function NewStaffPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const [departments, setDepartments] = useState<Department[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [optionsLoading, setOptionsLoading] = useState(true);
  const [optionsError, setOptionsError] = useState('');

  const [form, setForm] = useState({ ...EMPTY_FORM });

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

  function set<K extends keyof typeof EMPTY_FORM>(key: K, value: string) {
    setForm((previous) => ({ ...previous, [key]: value }));
  }

  function validate() {
    const errors: Record<string, string> = {};
    if (!form.firstName.trim()) errors.firstName = 'First name is required.';
    if (!form.lastName.trim()) errors.lastName = 'Last name is required.';
    if (form.employeeId.trim() && !/^[A-Za-z0-9._-]{2,40}$/.test(form.employeeId.trim())) {
      errors.employeeId = 'Use 2–40 letters, numbers, dots, hyphens or underscores.';
    }
    if (form.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      errors.email = 'Enter a valid email address.';
    }
    if (
      form.phone.trim() &&
      !/^[+()\d\s-]{6,20}$/.test(form.phone.trim())
    ) {
      errors.phone = 'Enter a valid phone number.';
    }
    if (
      form.contractEndDate &&
      form.commencementDate &&
      form.contractEndDate < form.commencementDate
    ) {
      errors.contractEndDate = 'Contract end date must be on or after the commencement date.';
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (saving) return;
    setError('');
    if (!validate()) {
      showFeedback('WARNING', 'Please complete the required fields correctly.');
      return;
    }

    setSaving(true);
    try {
      // Only send non-empty optional values. The backend normalises and stores
      // every field on the staff record itself, so the profile shows exactly
      // what was collected here.
      const payload: Record<string, unknown> = {
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        status: form.status,
      };
      const optionalStringKeys = [
        'middleName',
        'employeeId',
        'designation',
        'departmentId',
        'positionId',
        'email',
        'phone',
        'altPhone',
        'address',
        'gender',
        'photoUrl',
        'employmentType',
        'emergencyContactName',
        'emergencyContactPhone',
        'emergencyContactRelationship',
      ] as const;
      for (const key of optionalStringKeys) {
        const value = form[key].trim();
        if (value) payload[key] = value;
      }
      for (const key of ['dateOfBirth', 'appointmentDate', 'commencementDate', 'contractEndDate'] as const) {
        if (form[key]) payload[key] = new Date(`${form[key]}T00:00:00`).toISOString();
      }
      if (form.responsibilities.trim()) payload.responsibilities = form.responsibilities.trim();

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

      <FormNotice title="Employment record — not a login account">
        This form creates the employment record and stores the contact details
        directly on it, so the staff profile always reflects what you enter here. Portal
        access is managed separately from <Link href="/dashboard/users" className="underline">Users → Invitations</Link>.
      </FormNotice>

      <form
        onSubmit={handleSubmit}
        className="space-y-6 rounded-2xl border border-warm-200 bg-card p-5 shadow-xs sm:p-8"
        noValidate
      >
        <FormSection title="Personal details" icon={<Users size={16} />}>
          <FormGrid>
            <Input
              label="First name *"
              required
              placeholder="e.g. Kwame"
              value={form.firstName}
              error={fieldErrors.firstName}
              onChange={(event) => set('firstName', event.target.value)}
            />
            <Input
              label="Last name *"
              required
              placeholder="e.g. Appiah"
              value={form.lastName}
              error={fieldErrors.lastName}
              onChange={(event) => set('lastName', event.target.value)}
            />
            <Input
              label="Middle name"
              placeholder="Optional"
              value={form.middleName}
              onChange={(event) => set('middleName', event.target.value)}
            />
            <Select
              label="Gender"
              value={form.gender}
              options={GENDER_OPTIONS}
              onChange={(event) => set('gender', event.target.value)}
            />
            <Input
              label="Date of birth"
              type="date"
              value={form.dateOfBirth}
              onChange={(event) => set('dateOfBirth', event.target.value)}
            />
            <Input
              label="Profile photo URL"
              type="url"
              placeholder="https://… (optional)"
              value={form.photoUrl}
              helperText="Paste a link to a stored photo, or add one later from the profile."
              onChange={(event) => set('photoUrl', event.target.value)}
            />
          </FormGrid>
        </FormSection>

        <FormSection title="Contact details" icon={<Mail size={16} />}>
          <FormGrid>
            <Input
              label="Email address"
              type="email"
              placeholder="name@school.edu"
              value={form.email}
              error={fieldErrors.email}
              helperText="Stored on the staff record, independent of any login account."
              onChange={(event) => set('email', event.target.value)}
            />
            <Input
              label="Primary phone"
              type="tel"
              placeholder="+233 …"
              value={form.phone}
              error={fieldErrors.phone}
              onChange={(event) => set('phone', event.target.value)}
            />
            <Input
              label="Alternative phone"
              type="tel"
              placeholder="Optional"
              value={form.altPhone}
              onChange={(event) => set('altPhone', event.target.value)}
            />
            <Input
              label="Residential address"
              placeholder="Optional"
              value={form.address}
              onChange={(event) => set('address', event.target.value)}
            />
          </FormGrid>
        </FormSection>

        <FormSection
          title="Employment"
          description="Departments and positions come from HR setup. Pick a department first to narrow the positions."
          icon={<Briefcase size={16} />}
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
              onChange={(event) => set('positionId', event.target.value)}
            />
            <Input
              label="Employee ID"
              placeholder="Optional"
              value={form.employeeId}
              error={fieldErrors.employeeId}
              helperText="Leave blank to use the school's staff numbering rule."
              onChange={(event) => set('employeeId', event.target.value)}
            />
            <Input
              label="Designation"
              placeholder="Optional, e.g. Senior Physics Teacher"
              value={form.designation}
              helperText="Defaults to the selected position."
              onChange={(event) => set('designation', event.target.value)}
            />
            <Select
              label="Employment type"
              value={form.employmentType}
              options={EMPLOYMENT_TYPE_OPTIONS}
              onChange={(event) => set('employmentType', event.target.value)}
            />
            <Select
              label="Employment status"
              value={form.status}
              options={STATUS_OPTIONS}
              helperText="Independent from the login-account status."
              onChange={(event) => set('status', event.target.value)}
            />
            <Input
              label="Appointment date"
              type="date"
              value={form.appointmentDate}
              onChange={(event) => set('appointmentDate', event.target.value)}
            />
            <Input
              label="Commencement date"
              type="date"
              value={form.commencementDate}
              onChange={(event) => set('commencementDate', event.target.value)}
            />
            <Input
              label="Contract end date"
              type="date"
              value={form.contractEndDate}
              error={fieldErrors.contractEndDate}
              onChange={(event) => set('contractEndDate', event.target.value)}
            />
          </FormGrid>
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold text-warm-500 uppercase tracking-wide">
              Job responsibilities
            </label>
            <Textarea
              rows={3}
              placeholder="Optional"
              value={form.responsibilities}
              onChange={(event) => set('responsibilities', event.target.value)}
            />
          </div>
          {optionsLoading && (
            <p className="flex items-center gap-2 text-xs text-warm-500">
              <Loader2 className="h-3.5 w-3.5 animate-spin" /> Loading HR options…
            </p>
          )}
        </FormSection>

        <FormSection
          title="Emergency contact"
          description="Who we call if this staff member needs urgent assistance."
          icon={<Phone size={16} />}
        >
          <FormGrid columns={3}>
            <Input
              label="Contact name"
              placeholder="Optional"
              value={form.emergencyContactName}
              onChange={(event) => set('emergencyContactName', event.target.value)}
            />
            <Input
              label="Contact phone"
              type="tel"
              placeholder="Optional"
              value={form.emergencyContactPhone}
              onChange={(event) => set('emergencyContactPhone', event.target.value)}
            />
            <Input
              label="Relationship"
              placeholder="e.g. Spouse"
              value={form.emergencyContactRelationship}
              onChange={(event) => set('emergencyContactRelationship', event.target.value)}
            />
          </FormGrid>
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
