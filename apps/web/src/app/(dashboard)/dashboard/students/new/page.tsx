'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api/client';
import { useAuth } from '@/context/auth-context';
import { collectUserRoles } from '@/lib/auth/roles';
import { Input, Select } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { showFeedback } from '@/components/layout/global-feedback';
import { ArrowLeft, GraduationCap, Loader2, Save, UserPlus, Mail, Phone, Users } from 'lucide-react';

interface Option {
  id: string;
  name: string;
  code?: string | null;
  isCurrent?: boolean;
  status?: string;
}

const today = () => new Date().toISOString().slice(0, 10);

export default function NewStudentPage() {
  const router = useRouter();
  const { user, activeSchoolId } = useAuth();
  const roles = useMemo(() => collectUserRoles(user, activeSchoolId), [user, activeSchoolId]);
  const canCreate = roles.some((role) =>
    ['SCHOOL_ADMIN', 'PRINCIPAL', 'RECEPTIONIST'].includes(role),
  );

  const [years, setYears] = useState<Option[]>([]);
  const [classes, setClasses] = useState<Option[]>([]);
  const [terms, setTerms] = useState<Option[]>([]);
  const [sections, setSections] = useState<Option[]>([]);
  const [guardians, setGuardians] = useState<{ id: string; firstName: string; lastName: string; email?: string | null; phone?: string | null }[]>([]);
  const [guardianLoading, setGuardianLoading] = useState(false);
  const [optionsLoading, setOptionsLoading] = useState(true);
  const [optionsError, setOptionsError] = useState('');

  const [form, setForm] = useState({
    firstName: '',
    middleName: '',
    lastName: '',
    gender: '',
    dateOfBirth: '',
    admissionNumber: '',
    admissionDate: today(),
    studentNumber: '',
    academicYearId: '',
    termId: '',
    classId: '',
    sectionId: '',
    // Guardian fields (optional, linked after student creation)
    guardianFirstName: '',
    guardianLastName: '',
    guardianRelationship: '',
    guardianEmail: '',
    guardianPhone: '',
    guardianIsPrimary: false,
  });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [guardianTab, setGuardianTab] = useState<'none' | 'new' | 'existing'>('none');

  useEffect(() => {
    let cancelled = false;
    async function loadOptions() {
      setOptionsLoading(true);
      setOptionsError('');
      try {
        const [yearData, classData] = await Promise.all([
          apiFetch('/academic-years'),
          apiFetch('/classes'),
        ]);
        if (cancelled) return;
        const yearList: Option[] = Array.isArray(yearData) ? yearData : [];
        const classList: Option[] = Array.isArray(classData) ? classData : [];
        setYears(yearList);
        setClasses(classList);
        const current =
          yearList.find((year) => year.isCurrent) ??
          yearList.find((year) => year.status === 'ACTIVE') ??
          yearList[0];
        if (current) {
          setForm((previous) => ({ ...previous, academicYearId: current.id }));
        }
      } catch (err: any) {
        if (!cancelled) setOptionsError(err?.message || 'Could not load academic setup.');
      } finally {
        if (!cancelled) setOptionsLoading(false);
      }
    }
    loadOptions();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    setTerms([]);
    setForm((previous) => ({ ...previous, termId: '' }));
    if (!form.academicYearId) return;
    apiFetch(`/academic-terms/by-year/${form.academicYearId}`)
      .then((data) => {
        if (cancelled) return;
        const list: Option[] = Array.isArray(data) ? data : [];
        setTerms(list);
        const active = list.find((term) => term.status === 'ACTIVE') ?? list[0];
        if (active) setForm((previous) => ({ ...previous, termId: active.id }));
      })
      .catch((err) => {
        if (!cancelled) setTerms([]);
        if (!cancelled) showFeedback('ERROR', err?.message || 'Could not load terms.');
      });
    return () => {
      cancelled = true;
    };
  }, [form.academicYearId]);

  useEffect(() => {
    let cancelled = false;
    setSections([]);
    setForm((previous) => ({ ...previous, sectionId: '' }));
    if (!form.classId) return;
    apiFetch(`/sections/by-class/${form.classId}`)
      .then((data) => {
        if (cancelled) return;
        setSections(Array.isArray(data) ? data : []);
      })
      .catch((err) => {
        if (!cancelled) setSections([]);
        if (!cancelled) showFeedback('ERROR', err?.message || 'Could not load sections.');
      });
    return () => {
      cancelled = true;
    };
  }, [form.classId]);

  // Load existing guardians for the "link existing guardian" option
  useEffect(() => {
    let cancelled = false;
    async function loadGuardians() {
      setGuardianLoading(true);
      try {
        const data = await apiFetch('/guardians');
        if (cancelled) return;
        setGuardians(Array.isArray(data) ? data : []);
      } catch {
        if (!cancelled) setGuardians([]);
      } finally {
        if (!cancelled) setGuardianLoading(false);
      }
    }
    loadGuardians();
    return () => { cancelled = true; };
  }, []);

  function validate() {
    const errors: Record<string, string> = {};
    if (!form.firstName.trim()) errors.firstName = 'First name is required.';
    if (!form.lastName.trim()) errors.lastName = 'Last name is required.';
    if (!form.dateOfBirth) errors.dateOfBirth = 'Date of birth is required.';
    else if (new Date(form.dateOfBirth) > new Date()) {
      errors.dateOfBirth = 'Date of birth cannot be in the future.';
    }
    if (!form.admissionDate) errors.admissionDate = 'Admission date is required.';
    if (!form.academicYearId) errors.academicYearId = 'Select an academic year.';
    if (!form.classId) errors.classId = 'Select a class to place the student in.';

    // Guardian validation only when creating a new guardian
    if (guardianTab === 'new') {
      if (!form.guardianFirstName.trim()) errors.guardianFirstName = 'Guardian first name is required.';
      if (!form.guardianLastName.trim()) errors.guardianLastName = 'Guardian last name is required.';
      if (!form.guardianRelationship.trim()) errors.guardianRelationship = 'Relationship is required.';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (submitting) return;
    setError('');
    if (!validate()) {
      showFeedback('WARNING', 'Please complete the required fields.');
      return;
    }

    setSubmitting(true);
    try {
      const payload: Record<string, unknown> = {
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        gender: form.gender || undefined,
        dateOfBirth: form.dateOfBirth,
        admissionDate: form.admissionDate,
        academicYearId: form.academicYearId,
        classId: form.classId,
        termId: form.termId || undefined,
        sectionId: form.sectionId || undefined,
      };
      if (form.middleName.trim()) payload.middleName = form.middleName.trim();
      if (form.admissionNumber.trim()) payload.admissionNumber = form.admissionNumber.trim();
      if (form.studentNumber.trim()) payload.studentNumber = form.studentNumber.trim();

      const created = await apiFetch('/students', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      const studentId = created?.id;

      // If a new guardian was specified, create and link them
      if (studentId && guardianTab === 'new' && form.guardianFirstName.trim() && form.guardianLastName.trim()) {
        try {
          const guardian = await apiFetch('/guardians', {
            method: 'POST',
            body: JSON.stringify({
              firstName: form.guardianFirstName.trim(),
              lastName: form.guardianLastName.trim(),
              email: form.guardianEmail.trim() || undefined,
              phone: form.guardianPhone.trim() || undefined,
            }),
          });
          await apiFetch(`/guardians/link/${studentId}`, {
            method: 'POST',
            body: JSON.stringify({
              guardianId: guardian.id,
              relation: form.guardianRelationship.trim(),
              isPrimary: form.guardianIsPrimary,
            }),
          });
        } catch (guardianErr: any) {
          // Guardian creation/link failure should not roll back the student
          showFeedback('WARNING', `Student registered, but guardian could not be linked: ${guardianErr?.message || 'unknown error'}`);
          router.push(`/dashboard/students/${studentId}`);
          return;
        }
      } else if (studentId && guardianTab === 'existing') {
        // Link to an existing guardian was not fully implemented in this flow;
        // the user can link from the student profile instead.
      }

      showFeedback('SUCCESS', 'Student registered successfully.');
      router.push(studentId ? `/dashboard/students/${studentId}` : '/dashboard/students');
    } catch (err: any) {
      const message = err?.message || 'Could not register the student.';
      setError(message);
      showFeedback('ERROR', message);
    } finally {
      setSubmitting(false);
    }
  }

  if (!canCreate) {
    return (
      <div className="mx-auto max-w-3xl space-y-4 py-12 text-center">
        <h1 className="text-xl font-bold text-charcoal-900">Not available for your role</h1>
        <p className="text-sm text-warm-500">
          Only a school administrator, principal, or receptionist can register students.
        </p>
        <Link href="/dashboard/students" className="text-sm font-semibold text-forest-700 underline">
          Back to students
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/dashboard/students"
          className="flex h-11 w-11 items-center justify-center rounded-xl border border-warm-200 bg-card text-warm-600 transition-colors hover:text-charcoal-900"
          aria-label="Back to students"
        >
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h1 className="flex items-center gap-2.5 text-2xl font-bold tracking-tight text-charcoal-900 sm:text-3xl">
            <UserPlus className="h-6 w-6 text-forest-700" />
            Register Student
          </h1>
          <p className="mt-0.5 text-xs font-medium text-warm-500 sm:text-sm">
            Create the student record, place them in a class, and optionally add a parent or guardian.
          </p>
        </div>
      </div>

      {optionsError && (
        <div role="alert" className="rounded-xl border border-danger-200 bg-danger-50 p-4 text-sm font-semibold text-danger-700">
          {optionsError} Refresh the page after fixing the academic setup.
        </div>
      )}

      {optionsLoading ? (
        <div className="flex items-center justify-center gap-2 py-16 text-sm font-medium text-warm-500">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading academic setup…
        </div>
      ) : (
        <>
          {years.length === 0 || classes.length === 0 ? (
            <div className="rounded-xl border border-warning-200 bg-warning-50 p-4 text-sm text-warning-800">
              <p className="font-semibold">Academic setup is incomplete.</p>
              <p className="mt-1">
                Create an academic year and at least one class before registering students.
              </p>
              <div className="mt-3 flex flex-wrap gap-3 text-xs font-bold">
                <Link href="/dashboard/academics/years" className="underline">
                  Manage academic years
                </Link>
                <Link href="/dashboard/academics/classes" className="underline">
                  Manage classes
                </Link>
              </div>
            </div>
          ) : null}

          {error && (
            <div role="alert" className="rounded-xl border border-danger-200 bg-danger-50 p-4 text-sm font-semibold text-danger-700">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6 rounded-2xl border border-warm-200 bg-card p-5 shadow-xs sm:p-8">
            {/* Student Details Section */}
            <section className="space-y-4">
              <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-warm-600">
                <GraduationCap size={16} /> Student details
              </h2>
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
                <Select
                  label="Gender"
                  value={form.gender}
                  onChange={(event) => setForm({ ...form, gender: event.target.value })}
                  placeholder="Not specified"
                  options={[
                    { value: '', label: 'Not specified' },
                    { value: 'Male', label: 'Male' },
                    { value: 'Female', label: 'Female' },
                  ]}
                />
                <Input
                  label="Date of birth *"
                  type="date"
                  required
                  max={today()}
                  value={form.dateOfBirth}
                  error={fieldErrors.dateOfBirth}
                  onChange={(event) => setForm({ ...form, dateOfBirth: event.target.value })}
                />
                <Input
                  label="Admission date *"
                  type="date"
                  required
                  value={form.admissionDate}
                  error={fieldErrors.admissionDate}
                  onChange={(event) => setForm({ ...form, admissionDate: event.target.value })}
                />
                <Input
                  label="Admission number"
                  placeholder="Optional, e.g. ADM-2026-014"
                  value={form.admissionNumber}
                  helperText="Leave blank if the school does not use admission numbers."
                  onChange={(event) => setForm({ ...form, admissionNumber: event.target.value })}
                />
                <Input
                  label="Student number"
                  placeholder="Optional — generated automatically"
                  value={form.studentNumber}
                  helperText="Leave blank to use the school's numbering rule."
                  onChange={(event) => setForm({ ...form, studentNumber: event.target.value })}
                />
              </div>
            </section>

            {/* Class Placement Section */}
            <section className="space-y-4 border-t border-warm-100 pt-6">
              <h2 className="text-sm font-bold uppercase tracking-wide text-warm-600">
                Class placement
              </h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Select
                  label="Academic year *"
                  required
                  value={form.academicYearId}
                  error={fieldErrors.academicYearId}
                  placeholder="Select academic year"
                  options={years.map((year) => ({
                    value: year.id,
                    label: `${year.name}${year.isCurrent ? ' (current)' : ''}`,
                  }))}
                  onChange={(event) => setForm({ ...form, academicYearId: event.target.value })}
                />
                <Select
                  label="Term"
                  value={form.termId}
                  placeholder={form.academicYearId ? 'Select term' : 'Select an academic year first'}
                  disabled={!form.academicYearId || terms.length === 0}
                  options={terms.map((term) => ({ value: term.id, label: term.name }))}
                  onChange={(event) => setForm({ ...form, termId: event.target.value })}
                />
                <Select
                  label="Class *"
                  required
                  value={form.classId}
                  error={fieldErrors.classId}
                  placeholder="Select class"
                  options={classes.map((clazz) => ({
                    value: clazz.id,
                    label: clazz.code ? `${clazz.name} (${clazz.code})` : clazz.name,
                  }))}
                  onChange={(event) => setForm({ ...form, classId: event.target.value })}
                />
                <Select
                  label="Section / stream"
                  value={form.sectionId}
                  placeholder={
                    !form.classId
                      ? 'Select a class first'
                      : sections.length === 0
                        ? 'No sections defined for this class'
                        : 'No section'
                  }
                  disabled={!form.classId || sections.length === 0}
                  options={[
                    { value: '', label: 'No section' },
                    ...sections.map((section) => ({ value: section.id, label: section.name })),
                  ]}
                  onChange={(event) => setForm({ ...form, sectionId: event.target.value })}
                />
              </div>
              <p className="text-xs text-warm-500">
                The student is enrolled immediately. You can move or re-enroll them later from
                their profile.
              </p>
            </section>

            {/* Parent / Guardian Section */}
            <section className="space-y-4 border-t border-warm-100 pt-6">
              <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-warm-600">
                <Users size={16} /> Parent &amp; Guardian
              </h2>
              <p className="text-xs text-warm-500">
                Linking a guardian creates a verified contact for SMS/Email communication and
                parent portal access. This step is optional — guardians can also be linked later
                from the student's profile.
              </p>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="flex items-center gap-2">
                  <input
                    type="radio"
                    checked={guardianTab === 'none'}
                    onChange={() => setGuardianTab('none')}
                    className="h-4 w-4 rounded text-forest-600 focus:ring-forest-500"
                  />
                  <label className="text-xs font-medium text-warm-600 cursor-pointer">No guardian now</label>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="radio"
                    checked={guardianTab === 'new'}
                    onChange={() => setGuardianTab('new')}
                    className="h-4 w-4 rounded text-forest-600 focus:ring-forest-500"
                  />
                  <label className="text-xs font-medium text-warm-600 cursor-pointer">Add new guardian</label>
                </div>
                {guardians.length > 0 && (
                  <div className="flex items-center gap-2">
                    <input
                      type="radio"
                      checked={guardianTab === 'existing'}
                      onChange={() => setGuardianTab('existing')}
                      className="h-4 w-4 rounded text-forest-600 focus:ring-forest-500"
                    />
                    <label className="text-xs font-medium text-warm-600 cursor-pointer">Link existing guardian</label>
                  </div>
                )}
              </div>

              {guardianTab === 'new' && (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <Input
                    label="Guardian first name *"
                    required
                    value={form.guardianFirstName}
                    error={fieldErrors.guardianFirstName}
                    placeholder="e.g. Grace"
                    onChange={(event) => setForm({ ...form, guardianFirstName: event.target.value })}
                  />
                  <Input
                    label="Guardian last name *"
                    required
                    value={form.guardianLastName}
                    error={fieldErrors.guardianLastName}
                    placeholder="e.g. Mensah"
                    onChange={(event) => setForm({ ...form, guardianLastName: event.target.value })}
                  />
                  <Input
                    label="Relationship *"
                    required
                    value={form.guardianRelationship}
                    error={fieldErrors.guardianRelationship}
                    placeholder="e.g. Mother"
                    onChange={(event) => setForm({ ...form, guardianRelationship: event.target.value })}
                  />
                  <Input
                    label="Email"
                    type="email"
                    value={form.guardianEmail}
                    helperText="Used for parent portal access and email messages."
                    onChange={(event) => setForm({ ...form, guardianEmail: event.target.value })}
                  />
                  <Input
                    label="Phone"
                    placeholder="+233 24 000 0000"
                    value={form.guardianPhone}
                    helperText="Used for SMS messages."
                    onChange={(event) => setForm({ ...form, guardianPhone: event.target.value })}
                  />
                  <div className="col-span-1 sm:col-span-1 lg:col-span-1 flex items-center gap-2 pt-6">
                    <input
                      type="checkbox"
                      checked={form.guardianIsPrimary}
                      onChange={(event) => setForm({ ...form, guardianIsPrimary: event.target.checked })}
                      className="h-4 w-4 rounded border-warm-300 text-forest-600 focus:ring-forest-500"
                    />
                    <label className="text-xs font-medium text-warm-700 cursor-pointer">
                      Primary guardian
                    </label>
                  </div>
                </div>
              )}

              {guardianTab === 'existing' && !guardianLoading && guardians.length === 0 && (
                <p className="text-xs text-warm-500">No existing guardians found. Add one instead.</p>
              )}
            </section>

            <div className="flex flex-col gap-3 border-t border-warm-100 pt-4 sm:flex-row sm:justify-end">
              <Link
                href="/dashboard/students"
                className="rounded-xl border border-warm-200 px-5 py-2.5 text-center text-xs font-bold text-warm-600 transition-colors hover:bg-warm-50"
              >
                Cancel
              </Link>
              <Button
                type="submit"
                size="lg"
                isLoading={submitting}
                disabled={years.length === 0 || classes.length === 0}
                leftIcon={<Save size={16} />}
              >
                Register Student
              </Button>
            </div>
          </form>
        </>
      )}
    </div>
  );
}