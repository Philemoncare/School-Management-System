'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { apiFetch } from '@/lib/api/client';
import { useAuth } from '@/context/auth-context';
import { collectUserRoles } from '@/lib/auth/roles';
import { Button } from '@/components/ui/button';
import { Input, Select } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { EmptyState } from '@/components/ui/empty-state';
import { showFeedback } from '@/components/layout/global-feedback';
import { BookOpen, Loader2, PencilLine, Plus, RefreshCw, Search } from 'lucide-react';

interface Subject {
  id: string;
  name: string;
  code: string;
  shortName?: string | null;
  description?: string | null;
  subjectType: string;
  isActive: boolean;
}

const TYPE_STYLES: Record<string, string> = {
  CORE: 'bg-sage-100 text-forest-800',
  ELECTIVE: 'bg-warning-100 text-warning-800',
  PRACTICAL: 'bg-terracotta-100 text-terracotta-800',
};

export default function SubjectsPage() {
  const { user, activeSchoolId } = useAuth();
  const roles = useMemo(() => collectUserRoles(user, activeSchoolId), [user, activeSchoolId]);
  const canManage = roles.some((role) => ['SCHOOL_ADMIN', 'PRINCIPAL'].includes(role));

  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [editSubject, setEditSubject] = useState<Subject | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await apiFetch('/subjects');
      setSubjects(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setSubjects([]);
      setError(err?.message || 'Could not load subjects.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = subjects.filter((subject) => {
    const needle = search.trim().toLowerCase();
    if (!needle) return true;
    return (
      subject.name.toLowerCase().includes(needle) ||
      subject.code.toLowerCase().includes(needle) ||
      (subject.shortName ?? '').toLowerCase().includes(needle)
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-charcoal-900 sm:text-3xl">Subjects</h1>
          <p className="mt-0.5 text-xs font-medium text-warm-500 sm:text-sm">
            The curriculum catalogue used by classes, assessments and results.
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
            <Button onClick={() => setCreateOpen(true)} leftIcon={<Plus size={16} />}>
              Add Subject
            </Button>
          )}
        </div>
      </div>

      <div className="w-full max-w-md">
        <Input
          type="search"
          aria-label="Search subjects"
          placeholder="Search by subject name or code…"
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

      {loading && subjects.length === 0 ? (
        <div className="flex items-center justify-center gap-2 py-16 text-sm font-medium text-warm-500">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading subjects…
        </div>
      ) : filtered.length === 0 && !error ? (
        <EmptyState
          icon={<BookOpen className="h-8 w-8" />}
          title={search ? 'No matching subjects' : 'No subjects yet'}
          description={
            search
              ? 'Try a different subject name or code.'
              : 'Add the subjects taught in this school, then assign them to classes from the Classes page.'
          }
          actionButton={
            canManage && !search ? (
              <Button onClick={() => setCreateOpen(true)} leftIcon={<Plus size={16} />}>
                Add Subject
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="overflow-hidden rounded-xl border border-warm-200 bg-card shadow-xs">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-warm-200">
              <caption className="sr-only">Subjects taught in this school</caption>
              <thead className="bg-ivory-50">
                <tr>
                  {['Subject', 'Code', 'Type', 'Status', 'Actions'].map((heading) => (
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
                {filtered.map((subject) => (
                  <tr key={subject.id} className="hover:bg-sage-50/30">
                    <td className="px-4 py-3.5 sm:px-6">
                      <p className="text-sm font-semibold text-charcoal-900">{subject.name}</p>
                      {subject.description && (
                        <p className="line-clamp-1 text-xs text-warm-500">{subject.description}</p>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3.5 font-mono text-xs text-warm-600 sm:px-6">
                      {subject.code}
                      {subject.shortName ? ` · ${subject.shortName}` : ''}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3.5 sm:px-6">
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase ${
                          TYPE_STYLES[subject.subjectType] ?? 'bg-warm-100 text-warm-700'
                        }`}
                      >
                        {subject.subjectType}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3.5 sm:px-6">
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase ${
                          subject.isActive ? 'bg-success-100 text-success-800' : 'bg-warm-100 text-warm-600'
                        }`}
                      >
                        {subject.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3.5 text-right sm:px-6">
                      {canManage ? (
                        <Button
                          variant="outline"
                          size="xs"
                          onClick={() => setEditSubject(subject)}
                          leftIcon={<PencilLine size={12} />}
                        >
                          Edit
                        </Button>
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
        <SubjectFormModal
          onClose={() => setCreateOpen(false)}
          onSaved={() => {
            setCreateOpen(false);
            load();
          }}
        />
      )}

      {editSubject && (
        <SubjectFormModal
          subject={editSubject}
          onClose={() => setEditSubject(null)}
          onSaved={() => {
            setEditSubject(null);
            load();
          }}
        />
      )}
    </div>
  );
}

function SubjectFormModal({
  subject,
  onClose,
  onSaved,
}: {
  subject?: Subject;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState({
    name: subject?.name ?? '',
    code: subject?.code ?? '',
    shortName: subject?.shortName ?? '',
    description: subject?.description ?? '',
    subjectType: subject?.subjectType ?? 'CORE',
    isActive: subject?.isActive ?? true,
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
      await apiFetch(subject ? `/subjects/${subject.id}` : '/subjects', {
        method: subject ? 'PATCH' : 'POST',
        body: JSON.stringify({
          name: form.name.trim(),
          code: form.code.trim().toUpperCase(),
          shortName: form.shortName.trim() || undefined,
          description: form.description.trim() || undefined,
          subjectType: form.subjectType,
          isActive: form.isActive,
        }),
      });
      showFeedback('SUCCESS', subject ? 'Subject updated.' : 'Subject created.');
      onSaved();
    } catch (err: any) {
      setError(err?.message || 'Could not save the subject.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      isOpen
      onClose={onClose}
      title={subject ? 'Edit subject' : 'Add subject'}
      footerActions={
        <>
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" form="subject-form" isLoading={saving}>
            {subject ? 'Save changes' : 'Create subject'}
          </Button>
        </>
      }
    >
      <form id="subject-form" onSubmit={submit} className="space-y-4">
        {error && (
          <p role="alert" className="rounded-lg bg-danger-50 p-3 text-xs font-semibold text-danger-700">
            {error}
          </p>
        )}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            label="Subject name *"
            required
            placeholder="Integrated Science"
            value={form.name}
            onChange={(event) => setForm({ ...form, name: event.target.value })}
          />
          <Input
            label="Code *"
            required
            placeholder="SCI"
            value={form.code}
            onChange={(event) => setForm({ ...form, code: event.target.value })}
          />
          <Input
            label="Short name"
            placeholder="Science"
            value={form.shortName}
            onChange={(event) => setForm({ ...form, shortName: event.target.value })}
          />
          <Select
            label="Type"
            value={form.subjectType}
            options={[
              { value: 'CORE', label: 'Core' },
              { value: 'ELECTIVE', label: 'Elective' },
              { value: 'PRACTICAL', label: 'Practical' },
            ]}
            onChange={(event) => setForm({ ...form, subjectType: event.target.value })}
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
          placeholder="Optional description"
          value={form.description}
          onChange={(event) => setForm({ ...form, description: event.target.value })}
        />
      </form>
    </Modal>
  );
}
