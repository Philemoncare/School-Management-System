'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { apiFetch, ApiError } from '@/lib/api/client';
import { useAuth } from '@/context/auth-context';
import { collectUserRoles } from '@/lib/auth/roles';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert } from '@/components/ui/alert';
import { showFeedback } from '@/components/layout/global-feedback';
import {
  ArrowLeft,
  Loader2,
  Mail,
  Phone,
  MapPin,
  Edit3,
  Trash2,
  UserCircle,
  ChevronRight,
  RefreshCw,
  Save,
  Users,
  AlertTriangle,
} from 'lucide-react';

interface Guardian {
  id: string;
  firstName: string;
  lastName: string;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  students?: Array<{
    relation?: string;
    isPrimary?: boolean;
    student: {
      id: string;
      firstName: string;
      lastName: string;
      studentNumber: string;
    };
  }>;
}

interface EditForm {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
}

export default function GuardianDetailPage() {
  const params = useParams();
  const rawId = params?.id;
  const guardianId = Array.isArray(rawId) ? rawId[0] : rawId;
  const { user, activeSchoolId } = useAuth();
  const roles = useMemo(() => collectUserRoles(user, activeSchoolId), [user, activeSchoolId]);
  const canManage = roles.some((role) =>
    ['SCHOOL_ADMIN', 'PRINCIPAL', 'RECEPTIONIST'].includes(role),
  );

  const [data, setData] = useState<Guardian | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editOpen, setEditOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [editForm, setEditForm] = useState<EditForm>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
  });
  const [editErrors, setEditErrors] = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    if (!guardianId) return;
    setLoading(true);
    setError('');
    try {
      const result = await apiFetch(`/guardians/${guardianId}`);
      setData(result);
    } catch (err: any) {
      setError(err?.message || 'Could not load guardian.');
    } finally {
      setLoading(false);
    }
  }, [guardianId]);

  useEffect(() => {
    load();
  }, [load]);

  // Deep-link support: open the edit modal when navigated with ?edit=1
  useEffect(() => {
    if (typeof window === 'undefined' || !data || !canManage) return;
    if (new URLSearchParams(window.location.search).get('edit') === '1') {
      setEditOpen(true);
    }
  }, [data, canManage]);

  const fullName = data ? `${data.firstName} ${data.lastName}` : '';

  const validateEdit = useCallback(() => {
    const next: Record<string, string> = {};
    if (!editForm.firstName.trim()) next.firstName = 'First name is required.';
    if (!editForm.lastName.trim()) next.lastName = 'Last name is required.';
    if (!editForm.email.trim()) next.email = 'Email address is required.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(editForm.email.trim())) {
      next.email = 'Please enter a valid email address.';
    }
    setEditErrors(next);
    return Object.keys(next).length === 0;
  }, [editForm]);

  const submitEdit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (saving) return;
    setApiError('');
    if (!validateEdit()) {
      showFeedback('WARNING', 'Please complete the required fields.');
      return;
    }

    setSaving(true);
    try {
      await apiFetch(`/guardians/${guardianId}`, {
        method: 'PATCH',
        body: JSON.stringify({
          firstName: editForm.firstName.trim(),
          lastName: editForm.lastName.trim(),
          email: editForm.email.trim().toLowerCase() || undefined,
          phone: editForm.phone.trim() || undefined,
          address: editForm.address.trim() || undefined,
        }),
      });
      showFeedback('SUCCESS', 'Guardian updated successfully.');
      setEditOpen(false);
      load();
    } catch (error: any) {
      if (error instanceof ApiError) {
        setApiError(error.message);
      } else {
        setApiError('Could not update guardian. Please try again.');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (deleting) return;
    setDeleting(true);
    try {
      await apiFetch(`/guardians/${guardianId}`, { method: 'DELETE' });
      showFeedback('SUCCESS', 'Guardian deleted successfully.');
      setDeleteConfirm(false);
      window.location.href = '/dashboard/guardians';
    } catch (error: any) {
      if (error instanceof ApiError) {
        setApiError(error.message);
      } else {
        setApiError('Could not delete guardian. Please try again.');
      }
    } finally {
      setDeleting(false);
    }
  };

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center gap-2 py-20 text-sm font-medium text-warm-500">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading guardian…
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="mx-auto max-w-xl space-y-4 py-16 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-danger-50 text-danger-600">
          <UserCircle size={24} />
        </div>
        <h1 className="text-xl font-bold text-charcoal-900">Guardian not available</h1>
        <p className="text-sm text-warm-500">{error || 'This guardian could not be found.'}</p>
        <div className="flex flex-col justify-center gap-3 sm:flex-row">
          <Button variant="outline" onClick={load} leftIcon={<RefreshCw size={16} />}>
            Try again
          </Button>
          <Link href="/dashboard/guardians">
            <Button variant="primary">Back to guardians</Button>
          </Link>
        </div>
      </div>
    );
  }

  const linkedStudents = data.students?.map((sg) => sg.student).filter(Boolean) || [];

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Link
          href="/dashboard/guardians"
          className="inline-flex items-center gap-2 text-xs font-semibold text-warm-600 hover:text-charcoal-900"
        >
          <ArrowLeft size={16} /> Back to guardians
        </Link>
        {canManage && (
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setEditForm({
                  firstName: data.firstName,
                  lastName: data.lastName,
                  email: data.email || '',
                  phone: data.phone || '',
                  address: data.address || '',
                });
                setEditOpen(true);
                setApiError('');
              }}
              leftIcon={<Edit3 size={14} />}
            >
              Edit
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDeleteConfirm(true)}
              leftIcon={<Trash2 size={14} />}
              className="text-danger-600 border-transparent hover:bg-danger-50 hover:text-danger-800"
            >
              Delete
            </Button>
          </>
        )}
      </div>

      {apiError && (
        <Alert type="error" title="Error">
          {apiError}
        </Alert>
      )}

      <section className="rounded-2xl border border-warm-200 bg-card p-5 shadow-xs sm:p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-sage-100 text-xl font-bold text-forest-800">
              <UserCircle className="text-md" />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl font-bold tracking-tight text-charcoal-900 sm:text-2xl">
                  {fullName}
                </h1>
              </div>
              <p className="mt-1 font-mono text-xs text-warm-600">
                {data.email || 'No email on file'}
                {data.phone ? ` · ${data.phone}` : ''}
              </p>
              <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-xs text-warm-500">
                {data.address && (
                  <span className="inline-flex items-center gap-1.5">
                    <MapPin className="text-md" />
                    {data.address}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {linkedStudents.length > 0 && (
        <section className="rounded-2xl border border-warm-200 bg-card p-5 shadow-xs sm:p-6">
          <h2 className="text-sm font-bold text-charcoal-900 mb-4 flex items-center gap-2">
            <Users className="h-4 w-4 text-forest-700" />
            Linked Students ({linkedStudents.length})
          </h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
            {linkedStudents.map((student) => (
              <div key={student.id} className="p-4 rounded-lg border border-warm-100 bg-warm-50">
                <Link
                  href={`/dashboard/students/${student.id}`}
                  className="block"
                >
                  <div className="flex items-center gap-2">
                    <UserCircle className="h-5 w-5 text-forest-700" />
                    <span className="text-sm font-semibold text-charcoal-900 truncate">
                      {student.firstName} {student.lastName}
                    </span>
                  </div>
                  <p className="mt-1 text-[11px] font-mono text-warm-500">
                    {student.studentNumber}
                  </p>
                </Link>
              </div>
            ))}
          </div>
        </section>
      )}

      {canManage && (
        <EditGuardianModal
          guardian={data}
          isOpen={editOpen}
          onClose={() => setEditOpen(false)}
          onSaved={load}
        />
      )}

      {deleteConfirm && (
        <DeleteGuardianModal
          guardian={data}
          isOpen={deleteConfirm}
          onClose={() => setDeleteConfirm(false)}
          onDeleted={handleDelete}
        />
      )}
    </div>
  );
}

function EditGuardianModal({
  guardian,
  isOpen,
  onClose,
  onSaved,
}: {
  guardian: Guardian;
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState<EditForm>({
    firstName: guardian.firstName,
    lastName: guardian.lastName,
    email: guardian.email || '',
    phone: guardian.phone || '',
    address: guardian.address || '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [apiError, setApiError] = useState('');

  const validate = useCallback(() => {
    const next: Record<string, string> = {};
    if (!form.firstName.trim()) next.firstName = 'First name is required.';
    if (!form.lastName.trim()) next.lastName = 'Last name is required.';
    if (!form.email.trim()) next.email = 'Email address is required.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      next.email = 'Please enter a valid email address.';
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  }, [form]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (saving) return;
    setApiError('');
    if (!validate()) {
      showFeedback('WARNING', 'Please complete the required fields.');
      return;
    }

    setSaving(true);
    try {
      await apiFetch(`/guardians/${guardian.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          firstName: form.firstName.trim(),
          lastName: form.lastName.trim(),
          email: form.email.trim().toLowerCase() || undefined,
          phone: form.phone.trim() || undefined,
          address: form.address.trim() || undefined,
        }),
      });
      onClose();
      onSaved();
    } catch (error: any) {
      if (error instanceof ApiError) {
        setApiError(error.message);
      } else {
        setApiError('Could not update guardian. Please try again.');
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
          <div className="relative z-10 w-full max-w-lg mx-auto p-4">
            <div className="bg-card rounded-2xl border border-warm-200 shadow-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-charcoal-900">Edit Guardian</h2>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onClose}
                  disabled={saving}
                >
                  Cancel
                </Button>
              </div>

              {apiError && (
                <Alert type="error" className="mb-4">
                  {apiError}
                </Alert>
              )}

              <form onSubmit={submit} className="space-y-4">
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
                  />
                </div>

                <div className="pt-4 flex items-center gap-3">
                  <Button variant="outline" onClick={onClose} disabled={saving}>
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    isLoading={saving}
                    leftIcon={<Save size={16} />}
                  >
                    Save Changes
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function DeleteGuardianModal({
  guardian,
  isOpen,
  onClose,
  onDeleted,
}: {
  guardian: Guardian;
  isOpen: boolean;
  onClose: () => void;
  onDeleted: () => void;
}) {
  const [deleting, setDeleting] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setDeleting(true);
    try {
      await apiFetch(`/guardians/${guardian.id}`, { method: 'DELETE' });
      onClose();
      onDeleted();
    } catch (error: any) {
      setDeleting(false);
      if (error instanceof ApiError) {
        showFeedback('ERROR', error.message);
      } else {
        showFeedback('ERROR', 'Could not delete guardian.');
      }
    }
  };

  return (
    <div>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
          <div className="relative z-10 w-full max-w-md mx-auto p-4">
            <div className="bg-card rounded-2xl border border-warm-200 shadow-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-charcoal-900">Delete Guardian</h2>
                <Button variant="outline" size="sm" onClick={onClose}>
                  Cancel
                </Button>
              </div>

              <Alert
                type="warning"
                title="Are you sure?"
                className="mb-4"
              >
                <AlertTriangle className="h-5 w-5 text-danger-600" />
                <p className="text-sm text-warm-600">
                  Deleting <strong>{`${guardian.firstName} ${guardian.lastName}`}</strong> will
                  permanently remove this guardian record. This action cannot be undone.
                </p>
              </Alert>

              <form onSubmit={submit} className="flex items-center gap-3">
                <Button variant="outline" onClick={onClose} disabled={deleting}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="destructive"
                  isLoading={deleting}
                  leftIcon={<Trash2 size={16} />}
                >
                  Delete Guardian
                </Button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
