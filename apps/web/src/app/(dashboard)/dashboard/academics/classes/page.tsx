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
import {
  BookOpen,
  GraduationCap,
  Layers,
  Loader2,
  PencilLine,
  Plus,
  RefreshCw,
  Trash2,
  Users,
} from 'lucide-react';

interface Section {
  id: string;
  name: string;
  code: string;
  capacity?: number | null;
  isActive: boolean;
  _count?: { enrollments?: number };
}

interface ClassRow {
  id: string;
  name: string;
  code: string;
  level: number;
  description?: string | null;
  isActive: boolean;
  _count?: { sections: number; enrollments: number };
}

interface Subject {
  id: string;
  name: string;
  code: string;
  isActive: boolean;
}

interface AssignedSubject {
  id: string;
  subjectId: string;
  sectionId?: string | null;
  subject: Subject;
}

export default function ClassesPage() {
  const { user, activeSchoolId } = useAuth();
  const roles = useMemo(() => collectUserRoles(user, activeSchoolId), [user, activeSchoolId]);
  const canManage = roles.some((role) => ['SCHOOL_ADMIN', 'PRINCIPAL'].includes(role));

  const [classes, setClasses] = useState<ClassRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [editClass, setEditClass] = useState<ClassRow | null>(null);
  const [detailClass, setDetailClass] = useState<ClassRow | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await apiFetch('/classes');
      setClasses(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setClasses([]);
      setError(err?.message || 'Could not load classes.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-charcoal-900 sm:text-3xl">Classes</h1>
          <p className="mt-0.5 text-xs font-medium text-warm-500 sm:text-sm">
            Grade levels, their streams (sections), and the subjects taught in each class.
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
              Add Class
            </Button>
          )}
        </div>
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

      {loading && classes.length === 0 ? (
        <div className="flex items-center justify-center gap-2 py-16 text-sm font-medium text-warm-500">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading classes…
        </div>
      ) : classes.length === 0 && !error ? (
        <EmptyState
          icon={<GraduationCap className="h-8 w-8" />}
          title="No classes yet"
          description="Add the grade levels this school runs, then add sections and subjects so students can be enrolled."
          actionButton={
            canManage ? (
              <Button onClick={() => setCreateOpen(true)} leftIcon={<Plus size={16} />}>
                Add Class
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {classes.map((clazz) => (
            <section
              key={clazz.id}
              className="flex flex-col justify-between rounded-2xl border border-warm-200 bg-card p-5 shadow-xs"
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-sage-100 text-forest-800">
                      <GraduationCap size={20} />
                    </span>
                    <div>
                      <h2 className="text-base font-bold text-charcoal-900">{clazz.name}</h2>
                      <p className="font-mono text-[11px] text-warm-500">
                        {clazz.code} · Level {clazz.level}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase ${
                      clazz.isActive ? 'bg-success-100 text-success-800' : 'bg-warm-100 text-warm-600'
                    }`}
                  >
                    {clazz.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>

                {clazz.description && (
                  <p className="mt-3 line-clamp-2 text-xs text-warm-500">{clazz.description}</p>
                )}

                <div className="mt-4 grid grid-cols-2 gap-2">
                  <div className="rounded-lg bg-ivory-50 px-3 py-2">
                    <p className="text-[10px] font-bold uppercase tracking-wide text-warm-500">Sections</p>
                    <p className="text-sm font-bold text-charcoal-900">{clazz._count?.sections ?? 0}</p>
                  </div>
                  <div className="rounded-lg bg-ivory-50 px-3 py-2">
                    <p className="text-[10px] font-bold uppercase tracking-wide text-warm-500">Enrollments</p>
                    <p className="text-sm font-bold text-charcoal-900">{clazz._count?.enrollments ?? 0}</p>
                  </div>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-2 border-t border-warm-100 pt-3">
                <Button
                  variant="outline"
                  size="xs"
                  onClick={() => setDetailClass(clazz)}
                  leftIcon={<Layers size={12} />}
                >
                  Sections & subjects
                </Button>
                {canManage && (
                  <Button
                    variant="ghost"
                    size="xs"
                    onClick={() => setEditClass(clazz)}
                    leftIcon={<PencilLine size={12} />}
                  >
                    Edit
                  </Button>
                )}
              </div>
            </section>
          ))}
        </div>
      )}

      {createOpen && (
        <ClassFormModal
          onClose={() => setCreateOpen(false)}
          onSaved={() => {
            setCreateOpen(false);
            load();
          }}
        />
      )}

      {editClass && (
        <ClassFormModal
          clazz={editClass}
          onClose={() => setEditClass(null)}
          onSaved={() => {
            setEditClass(null);
            load();
          }}
        />
      )}

      {detailClass && (
        <ClassDetailModal
          clazz={detailClass}
          canManage={canManage}
          onClose={() => setDetailClass(null)}
          onChanged={load}
        />
      )}
    </div>
  );
}

function ClassFormModal({
  clazz,
  onClose,
  onSaved,
}: {
  clazz?: ClassRow;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState({
    name: clazz?.name ?? '',
    code: clazz?.code ?? '',
    level: String(clazz?.level ?? ''),
    description: clazz?.description ?? '',
    isActive: clazz?.isActive ?? true,
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
      await apiFetch(clazz ? `/classes/${clazz.id}` : '/classes', {
        method: clazz ? 'PATCH' : 'POST',
        body: JSON.stringify({
          name: form.name.trim(),
          code: form.code.trim().toUpperCase(),
          level: form.level ? Number(form.level) : undefined,
          description: form.description.trim() || undefined,
          isActive: form.isActive,
        }),
      });
      showFeedback('SUCCESS', clazz ? 'Class updated.' : 'Class created.');
      onSaved();
    } catch (err: any) {
      setError(err?.message || 'Could not save the class.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      isOpen
      onClose={onClose}
      title={clazz ? 'Edit class' : 'Add class'}
      footerActions={
        <>
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" form="class-form" isLoading={saving}>
            {clazz ? 'Save changes' : 'Create class'}
          </Button>
        </>
      }
    >
      <form id="class-form" onSubmit={submit} className="space-y-4">
        {error && (
          <p role="alert" className="rounded-lg bg-danger-50 p-3 text-xs font-semibold text-danger-700">
            {error}
          </p>
        )}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            label="Class name *"
            required
            placeholder="JHS 1"
            value={form.name}
            onChange={(event) => setForm({ ...form, name: event.target.value })}
          />
          <Input
            label="Code *"
            required
            placeholder="JHS1"
            value={form.code}
            onChange={(event) => setForm({ ...form, code: event.target.value })}
          />
          <Input
            label="Level"
            type="number"
            min={0}
            placeholder="1"
            value={form.level}
            helperText="Order used when listing classes."
            onChange={(event) => setForm({ ...form, level: event.target.value })}
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
          placeholder="Optional notes about this class"
          value={form.description}
          onChange={(event) => setForm({ ...form, description: event.target.value })}
        />
      </form>
    </Modal>
  );
}

function ClassDetailModal({
  clazz,
  canManage,
  onClose,
  onChanged,
}: {
  clazz: ClassRow;
  canManage: boolean;
  onClose: () => void;
  onChanged: () => void;
}) {
  const [tab, setTab] = useState<'sections' | 'subjects'>('sections');
  const [sections, setSections] = useState<Section[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [assigned, setAssigned] = useState<AssignedSubject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState<string | null>(null);

  const [sectionForm, setSectionForm] = useState({ name: '', code: '', capacity: '' });
  const [savingSection, setSavingSection] = useState(false);
  const [sectionError, setSectionError] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [savingSubject, setSavingSubject] = useState(false);
  const [subjectError, setSubjectError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [sectionData, assignmentData, subjectData] = await Promise.all([
        apiFetch(`/sections/by-class/${clazz.id}`),
        apiFetch(`/class-subjects/by-class/${clazz.id}`),
        apiFetch('/subjects'),
      ]);
      setSections(Array.isArray(sectionData) ? sectionData : []);
      setAssigned(Array.isArray(assignmentData) ? assignmentData : []);
      setSubjects(Array.isArray(subjectData) ? subjectData : []);
    } catch (err: any) {
      setError(err?.message || 'Could not load the class setup.');
    } finally {
      setLoading(false);
    }
  }, [clazz.id]);

  useEffect(() => {
    load();
  }, [load]);

  async function addSection(event: React.FormEvent) {
    event.preventDefault();
    if (savingSection) return;
    if (!sectionForm.name.trim() || !sectionForm.code.trim()) {
      setSectionError('Section name and code are required.');
      return;
    }
    setSavingSection(true);
    setSectionError('');
    try {
      await apiFetch('/sections', {
        method: 'POST',
        body: JSON.stringify({
          classId: clazz.id,
          name: sectionForm.name.trim(),
          code: sectionForm.code.trim().toUpperCase(),
          capacity: sectionForm.capacity ? Number(sectionForm.capacity) : undefined,
        }),
      });
      showFeedback('SUCCESS', 'Section added.');
      setSectionForm({ name: '', code: '', capacity: '' });
      await load();
      onChanged();
    } catch (err: any) {
      setSectionError(err?.message || 'Could not add the section.');
    } finally {
      setSavingSection(false);
    }
  }

  async function toggleSection(section: Section) {
    if (!canManage) return;
    setBusy(section.id);
    try {
      await apiFetch(`/sections/${section.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ isActive: !section.isActive }),
      });
      showFeedback('SUCCESS', `Section ${section.isActive ? 'deactivated' : 'reactivated'}.`);
      await load();
    } catch (err: any) {
      showFeedback('ERROR', err?.message || 'Could not update the section.');
    } finally {
      setBusy(null);
    }
  }

  async function assignSubject(event: React.FormEvent) {
    event.preventDefault();
    if (savingSubject) return;
    if (!subjectId) {
      setSubjectError('Select a subject to assign.');
      return;
    }
    setSavingSubject(true);
    setSubjectError('');
    try {
      await apiFetch('/class-subjects', {
        method: 'POST',
        body: JSON.stringify({ classId: clazz.id, subjectId }),
      });
      showFeedback('SUCCESS', 'Subject assigned to this class.');
      setSubjectId('');
      await load();
    } catch (err: any) {
      setSubjectError(err?.message || 'Could not assign the subject.');
    } finally {
      setSavingSubject(false);
    }
  }

  async function removeSubject(assignment: AssignedSubject) {
    if (!canManage) return;
    if (!window.confirm(`Remove ${assignment.subject.name} from ${clazz.name}?`)) return;
    setBusy(assignment.id);
    try {
      await apiFetch(`/class-subjects/${assignment.id}`, { method: 'DELETE' });
      showFeedback('SUCCESS', 'Subject removed from the class.');
      await load();
    } catch (err: any) {
      showFeedback('ERROR', err?.message || 'Could not remove the subject.');
    } finally {
      setBusy(null);
    }
  }

  const unassigned = subjects.filter(
    (subject) => !assigned.some((item) => item.subjectId === subject.id),
  );

  return (
    <Modal isOpen onClose={onClose} title={`${clazz.name} · structure`} size="xl">
      <div className="space-y-4">
        <div role="tablist" aria-label="Class structure" className="flex gap-1 rounded-xl border border-warm-200 bg-ivory-50 p-1">
          {[
            { key: 'sections' as const, label: `Sections (${sections.length})`, icon: <Users size={14} /> },
            { key: 'subjects' as const, label: `Subjects (${assigned.length})`, icon: <BookOpen size={14} /> },
          ].map((item) => (
            <button
              key={item.key}
              type="button"
              role="tab"
              aria-selected={tab === item.key}
              onClick={() => setTab(item.key)}
              className={`inline-flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs font-bold ${
                tab === item.key ? 'bg-forest-800 text-ivory-50' : 'text-warm-600 hover:bg-card'
              }`}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </div>

        {loading ? (
          <p className="flex items-center gap-2 py-8 text-sm text-warm-500">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading class structure…
          </p>
        ) : error ? (
          <div role="alert" className="flex flex-col gap-3 rounded-lg bg-danger-50 p-3 text-xs font-semibold text-danger-700 sm:flex-row sm:items-center sm:justify-between">
            <span>{error}</span>
            <Button variant="outline" size="sm" onClick={load}>
              Try again
            </Button>
          </div>
        ) : tab === 'sections' ? (
          <div className="space-y-4">
            {sections.length === 0 ? (
              <p className="rounded-xl border border-dashed border-warm-300 p-6 text-center text-sm text-warm-500">
                No sections yet. A class can run without streams, but sections let you split large
                cohorts.
              </p>
            ) : (
              <ul className="divide-y divide-warm-100 rounded-xl border border-warm-200">
                {sections.map((section) => (
                  <li key={section.id} className="flex flex-wrap items-center justify-between gap-3 p-3">
                    <div>
                      <p className="text-sm font-semibold text-charcoal-900">
                        {section.name} <span className="font-mono text-[11px] text-warm-500">({section.code})</span>
                      </p>
                      <p className="text-xs text-warm-500">
                        {section.capacity ? `Capacity ${section.capacity}` : 'No capacity limit set'}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase ${
                          section.isActive ? 'bg-success-100 text-success-800' : 'bg-warm-100 text-warm-600'
                        }`}
                      >
                        {section.isActive ? 'Active' : 'Inactive'}
                      </span>
                      {canManage && (
                        <Button
                          variant="outline"
                          size="xs"
                          onClick={() => toggleSection(section)}
                          isLoading={busy === section.id}
                        >
                          {section.isActive ? 'Deactivate' : 'Reactivate'}
                        </Button>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}

            {canManage && (
              <form onSubmit={addSection} className="space-y-3 rounded-xl border border-warm-200 bg-ivory-50 p-4">
                <h3 className="text-xs font-bold uppercase tracking-wide text-warm-600">Add a section</h3>
                {sectionError && (
                  <p role="alert" className="rounded-lg bg-danger-50 p-3 text-xs font-semibold text-danger-700">
                    {sectionError}
                  </p>
                )}
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <Input
                    label="Name *"
                    required
                    placeholder="Section A"
                    value={sectionForm.name}
                    onChange={(event) => setSectionForm({ ...sectionForm, name: event.target.value })}
                  />
                  <Input
                    label="Code *"
                    required
                    placeholder="A"
                    value={sectionForm.code}
                    onChange={(event) => setSectionForm({ ...sectionForm, code: event.target.value })}
                  />
                  <Input
                    label="Capacity"
                    type="number"
                    min={1}
                    value={sectionForm.capacity}
                    onChange={(event) => setSectionForm({ ...sectionForm, capacity: event.target.value })}
                  />
                </div>
                <div className="flex justify-end">
                  <Button type="submit" size="sm" isLoading={savingSection} leftIcon={<Plus size={14} />}>
                    Add section
                  </Button>
                </div>
              </form>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {assigned.length === 0 ? (
              <p className="rounded-xl border border-dashed border-warm-300 p-6 text-center text-sm text-warm-500">
                No subjects assigned to this class yet.
              </p>
            ) : (
              <ul className="divide-y divide-warm-100 rounded-xl border border-warm-200">
                {assigned.map((assignment) => (
                  <li key={assignment.id} className="flex items-center justify-between gap-3 p-3">
                    <div>
                      <p className="text-sm font-semibold text-charcoal-900">{assignment.subject.name}</p>
                      <p className="font-mono text-[11px] text-warm-500">{assignment.subject.code}</p>
                    </div>
                    {canManage && (
                      <button
                        type="button"
                        onClick={() => removeSubject(assignment)}
                        disabled={busy === assignment.id}
                        className="flex h-9 w-9 items-center justify-center rounded-lg text-warm-400 hover:bg-danger-50 hover:text-danger-600 disabled:opacity-50"
                        aria-label={`Remove ${assignment.subject.name} from ${clazz.name}`}
                      >
                        {busy === assignment.id ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />}
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            )}

            {canManage && (
              <form onSubmit={assignSubject} className="space-y-3 rounded-xl border border-warm-200 bg-ivory-50 p-4">
                <h3 className="text-xs font-bold uppercase tracking-wide text-warm-600">Assign a subject</h3>
                {subjectError && (
                  <p role="alert" className="rounded-lg bg-danger-50 p-3 text-xs font-semibold text-danger-700">
                    {subjectError}
                  </p>
                )}
                {subjects.length === 0 ? (
                  <p className="text-xs text-warm-500">
                    No subjects exist yet. Create subjects first, then assign them to this class.
                  </p>
                ) : (
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                    <div className="flex-1">
                      <Select
                        label="Subject"
                        value={subjectId}
                        placeholder={unassigned.length ? 'Select subject' : 'All subjects already assigned'}
                        disabled={unassigned.length === 0}
                        options={unassigned.map((subject) => ({
                          value: subject.id,
                          label: `${subject.name} (${subject.code})`,
                        }))}
                        onChange={(event) => setSubjectId(event.target.value)}
                      />
                    </div>
                    <Button
                      type="submit"
                      size="sm"
                      isLoading={savingSubject}
                      disabled={unassigned.length === 0}
                      leftIcon={<Plus size={14} />}
                    >
                      Assign
                    </Button>
                  </div>
                )}
              </form>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
}
