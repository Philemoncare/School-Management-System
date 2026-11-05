'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { apiFetch, ApiError } from '@/lib/api/client';
import { useAuth } from '@/context/auth-context';
import { collectUserRoles } from '@/lib/auth/roles';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert } from '@/components/ui/alert';
import { showFeedback } from '@/components/layout/global-feedback';
import { ArrowLeft, Loader2, Mail, Phone, MapPin, Save, UserCircle } from 'lucide-react';

interface GuardianForm {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
}

export default function AddGuardianPage() {
  const { user, activeSchoolId } = useAuth();
  const roles = useMemo(() => collectUserRoles(user, activeSchoolId), [user, activeSchoolId]);
  const canManage = roles.some((role) =>
    ['SCHOOL_ADMIN', 'PRINCIPAL', 'RECEPTIONIST'].includes(role),
  );

  if (!canManage) {
    return (
      <div className="mx-auto max-w-3xl space-y-4 py-12 text-center">
        <h1 className="text-xl font-bold text-charcoal-900">Not available for your role</h1>
        <p className="text-sm text-warm-500">
          Only a school administrator, principal, or receptionist can add guardians.
        </p>
        <Link href="/dashboard/guardians" className="text-sm font-semibold text-forest-700 underline">
          <ArrowLeft size={16} /> Back to guardians
        </Link>
      </div>
    );
  }

  const [form, setForm] = useState<GuardianForm>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const validate = useCallback(() => {
    const next: Record<string, string> = {};
    if (!form.firstName.trim()) next.firstName = 'First name is required.';
    if (!form.lastName.trim()) next.lastName = 'Last name is required.';
    if (!form.email.trim()) next.email = 'Email address is required.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      next.email = 'Please enter a valid email address.';
    }
    if (form.phone.trim() && !/^\+?[\d\s\-()]{7,}$/.test(form.phone.trim())) {
      next.phone = 'Please enter a valid phone number.';
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  }, [form]);

  const showApiError = (message: string) => {
    setApiError(message);
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (submitting) return;
    setApiError('');
    if (!validate()) {
      showFeedback('WARNING', 'Please complete the required fields.');
      return;
    }

    setSubmitting(true);
    try {
      await apiFetch('/guardians', {
        method: 'POST',
        body: JSON.stringify({
          firstName: form.firstName.trim(),
          lastName: form.lastName.trim(),
          email: form.email.trim().toLowerCase() || undefined,
          phone: form.phone.trim() || undefined,
          address: form.address.trim() || undefined,
        }),
      });
      showFeedback('SUCCESS', 'Guardian added successfully.');
      // Auto-progress: redirect to guardians list after successful creation
      window.location.href = '/dashboard/guardians';
    } catch (error: any) {
      if (error instanceof ApiError) {
        showApiError(error.message);
      } else {
        showApiError('Could not add guardian. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/dashboard/guardians"
          className="flex h-11 w-11 items-center justify-center rounded-xl border border-warm-200 bg-card text-warm-600 transition-colors hover:text-charcoal-900"
          aria-label="Back to guardians"
        >
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h1 className="flex items-center gap-2.5 text-2xl font-bold tracking-tight text-charcoal-900 sm:text-3xl">
            <UserCircle className="h-6 w-6 text-forest-700" />
            Add Guardian
          </h1>
          <p className="mt-0.5 text-xs font-medium text-warm-500 sm:text-sm">
            Register a new parent or guardian and link them to students.
          </p>
        </div>
      </div>

      {apiError && (
        <Alert type="error" title="Could not add guardian">
          {apiError}
        </Alert>
      )}

      <form onSubmit={submit} className="space-y-5 rounded-2xl border border-warm-200 bg-card p-5 shadow-xs sm:p-8">
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase tracking-wide text-warm-500">
                First name <span className="text-danger-500">*</span>
              </label>
              <Input
                required
                value={form.firstName}
                error={errors.firstName}
                onChange={(event) => setForm({ ...form, firstName: event.target.value })}
                placeholder="e.g. Sarah"
              />
              {errors.firstName && (
                <p className="text-[10px] text-danger-600">{errors.firstName}</p>
              )}
            </div>
            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase tracking-wide text-warm-500">
                Last name <span className="text-danger-500">*</span>
              </label>
              <Input
                required
                value={form.lastName}
                error={errors.lastName}
                onChange={(event) => setForm({ ...form, lastName: event.target.value })}
                placeholder="e.g. Johnson"
              />
              {errors.lastName && (
                <p className="text-[10px] text-danger-600">{errors.lastName}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wide text-warm-500">
              Email address <span className="text-danger-500">*</span>
            </label>
            <Input
              type="email"
              required
              value={form.email}
              error={errors.email}
              onChange={(event) => setForm({ ...form, email: event.target.value })}
              leftIcon={<Mail className="h-4 w-4" />}
              placeholder="e.g. sarah.johnson@email.com"
              helperText="Used for parent portal login and communications."
            />
            {errors.email && (
              <p className="text-[10px] text-danger-600">{errors.email}</p>
            )}
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wide text-warm-500">
              Phone number
            </label>
            <Input
              type="tel"
              value={form.phone}
              error={errors.phone}
              onChange={(event) => setForm({ ...form, phone: event.target.value })}
              leftIcon={<Phone className="h-4 w-4" />}
              placeholder="+233 20 000 0000"
              helperText="Optional contact number for the guardian."
            />
            {errors.phone && (
              <p className="text-[10px] text-danger-600">{errors.phone}</p>
            )}
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wide text-warm-500">
              Address
            </label>
            <Input
              value={form.address}
              onChange={(event) => setForm({ ...form, address: event.target.value })}
              leftIcon={<MapPin className="h-4 w-4" />}
              placeholder="Residential address"
              helperText="Optional residential address."
            />
          </div>
        </div>

        <div className="pt-4 flex items-center gap-3">
          <Link
            href="/dashboard/guardians"
            className="inline-flex items-center gap-2 rounded-lg border border-warm-200 px-4 py-2.5 text-xs font-semibold text-warm-600 transition-colors hover:bg-warm-50"
          >
            Cancel
          </Link>
          <Button
            type="submit"
            size="lg"
            isLoading={submitting}
            leftIcon={<Save size={16} />}
            disabled={Object.keys(errors).length > 0}
          >
            Save Guardian
          </Button>
        </div>
      </form>
    </div>
  );
}
