'use client';

import { Select } from '@/components/ui/input';
import React, { useEffect, useMemo, useState } from 'react';
import { apiFetch } from '@/lib/api/client';
import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  ClipboardList,
  Clock,
  Loader2,
  Plus,
  Search,
  X,
} from 'lucide-react';

type TeachingAssignment = {
  id: string;
  subject: { name: string };
  section: { name: string; class: { name: string } };
};

type ClassAssignment = {
  id: string;
  title: string;
  description: string;
  dueDate: string;
  status: string;
  createdAt: string;
  class: { name: string };
  subject: { name: string };
  _count?: { submissions: number };
};

export default function TeacherAssignmentsPage() {
  const [assignments, setAssignments] = useState<ClassAssignment[]>([]);
  const [teachingAssignments, setTeachingAssignments] = useState<TeachingAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [form, setForm] = useState({
    teacherAssignmentId: '',
    title: '',
    description: '',
    dueDate: '',
  });

  useEffect(() => {
    Promise.all([
      apiFetch('/teacher-portal/class-assignments'),
      apiFetch('/teacher-portal/assignments'),
    ])
      .then(([classAssignments, teaching]) => {
        setAssignments(classAssignments);
        setTeachingAssignments(teaching);
        if (teaching.length > 0) {
          setForm((current) => ({ ...current, teacherAssignmentId: teaching[0].id }));
        }
      })
      .catch((err) => setError(err.message || 'Unable to load class assignments.'))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(
    () => assignments.filter((item) =>
      `${item.title} ${item.description} ${item.class?.name} ${item.subject?.name}`.toLowerCase().includes(search.toLowerCase()),
    ),
    [assignments, search],
  );

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setFormError('');
    if (!form.teacherAssignmentId) {
      setFormError('Select one of your teaching assignments.');
      return;
    }
    if (!form.title.trim() || !form.description.trim() || !form.dueDate) {
      setFormError('Title, instructions and due date are required.');
      return;
    }

    setSubmitting(true);
    try {
      const created = await apiFetch('/teacher-portal/class-assignments', {
        method: 'POST',
        body: JSON.stringify(form),
      });
      setAssignments((current) => [created, ...current]);
      setShowForm(false);
      setForm((current) => ({ ...current, title: '', description: '', dueDate: '' }));
    } catch (err: any) {
      setFormError(err.message || 'The assignment could not be created.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="p-8 space-y-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-3xl font-semibold text-charcoal-900 tracking-tight flex items-center gap-3">
            <ClipboardList className="text-forest-700" /> Class Assignments
          </h1>
          <p className="text-warm-500 font-bold mt-1 uppercase tracking-wide text-[11px]">Student work, homework and project submissions</p>
        </div>
        <button onClick={() => setShowForm(true)} disabled={teachingAssignments.length === 0} className="bg-forest-700 text-white px-8 py-3 rounded-xl font-semibold text-sm hover:bg-forest-800 transition-all flex items-center gap-2 disabled:opacity-50">
          <Plus size={18} /> Create Assignment
        </button>
      </div>

      {error && (
        <div className="flex items-start gap-3 rounded-xl border border-danger-200 bg-danger-50 p-4 text-danger-700">
          <AlertCircle size={18} className="shrink-0 mt-0.5" />
          <p className="text-sm font-semibold">{error}</p>
        </div>
      )}

      {teachingAssignments.length === 0 && !loading && (
        <div className="rounded-xl border border-warning-200 bg-warning-50 p-5 text-warning-700 text-sm font-medium">
          You need at least one teaching assignment before you can publish class work.
        </div>
      )}

      <div className="bg-card border border-warm-200 rounded-xl shadow-sm overflow-hidden">
        <div className="p-6 border-b border-warm-100 flex items-center gap-4 bg-ivory-50/50">
          <div className="flex-1 bg-card border border-warm-200 px-5 py-3 rounded-xl flex items-center shadow-sm">
            <Search size={18} className="text-warm-400 mr-3" />
            <input value={search} onChange={(event) => setSearch(event.target.value)} type="text" placeholder="Search assignments..." className="bg-transparent border-none w-full focus:ring-0 text-sm font-medium outline-none" />
          </div>
        </div>

        <div className="relative min-h-[300px] overflow-x-auto">
          {loading && (
            <div className="absolute inset-0 bg-card/60 z-10 flex items-center justify-center">
              <Loader2 className="animate-spin text-forest-700" size={32} />
            </div>
          )}
          <table className="min-w-full divide-y divide-warm-200">
            <thead className="bg-card">
              <tr>
                <th className="px-6 py-4 text-left text-[11px] font-semibold text-warm-400 uppercase tracking-wide">Assignment</th>
                <th className="px-6 py-4 text-left text-[11px] font-semibold text-warm-400 uppercase tracking-wide">Class</th>
                <th className="px-6 py-4 text-left text-[11px] font-semibold text-warm-400 uppercase tracking-wide">Due</th>
                <th className="px-6 py-4 text-left text-[11px] font-semibold text-warm-400 uppercase tracking-wide">Submissions</th>
                <th className="px-6 py-4 text-left text-[11px] font-semibold text-warm-400 uppercase tracking-wide">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-warm-100">
              {filtered.map((assignment) => {
                const overdue = new Date(assignment.dueDate) < new Date();
                return (
                  <tr key={assignment.id} className="hover:bg-ivory-50 transition-colors">
                    <td className="px-6 py-5">
                      <p className="text-sm font-semibold text-charcoal-900">{assignment.title}</p>
                      <p className="text-xs font-medium text-warm-400 line-clamp-1 max-w-md">{assignment.description}</p>
                    </td>
                    <td className="px-6 py-5 text-sm font-medium text-warm-600">{assignment.class?.name} / {assignment.subject?.name}</td>
                    <td className="px-6 py-5">
                      <span className={`inline-flex items-center gap-1.5 text-xs font-semibold ${overdue ? 'text-danger-600' : 'text-warm-600'}`}>
                        {overdue ? <Clock size={14} /> : <Calendar size={14} />} {new Date(assignment.dueDate).toLocaleDateString()}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-sm font-semibold text-charcoal-900">{assignment._count?.submissions ?? 0}</td>
                    <td className="px-6 py-5">
                      <span className="inline-flex px-2.5 py-1 rounded-full bg-sage-50 text-forest-700 text-[11px] font-semibold uppercase">{assignment.status}</span>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && !loading && (
                <tr>
                  <td colSpan={5} className="px-6 py-20 text-center">
                    <ClipboardList className="mx-auto text-warm-200 mb-4" size={56} />
                    <p className="text-warm-400 font-semibold">No class assignments found.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-charcoal-950/50 p-4">
          <div className="w-full max-w-lg rounded-xl bg-card p-6 shadow-xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-charcoal-900">Create Assignment</h2>
              <button type="button" onClick={() => { setShowForm(false); setFormError(''); }} className="p-2 rounded-lg text-warm-400 hover:bg-ivory-50"><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-5">
              {formError && (
                <div className="flex items-start gap-2 rounded-lg border border-danger-200 bg-danger-50 p-3 text-danger-700">
                  <AlertCircle size={16} className="shrink-0 mt-0.5" />
                  <p className="text-xs font-semibold">{formError}</p>
                </div>
              )}
              <div>
                <label className="block text-[11px] font-semibold text-warm-500 uppercase tracking-wide mb-2">Teaching assignment</label>
                <Select value={form.teacherAssignmentId} onChange={(event) => setForm({ ...form, teacherAssignmentId: event.target.value })} className="w-full rounded-lg border border-warm-200 bg-ivory-50 p-3 text-sm font-medium">
                  {teachingAssignments.map((item) => (
                    <option key={item.id} value={item.id}>{item.section.class.name} / {item.section.name} / {item.subject.name}</option>
                  ))}
                </Select>
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-warm-500 uppercase tracking-wide mb-2">Title</label>
                <input value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} className="w-full rounded-lg border border-warm-200 bg-ivory-50 p-3 text-sm font-medium outline-none" placeholder="e.g. Chapter 4 problem set" />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-warm-500 uppercase tracking-wide mb-2">Instructions</label>
                <textarea value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} rows={4} className="w-full rounded-lg border border-warm-200 bg-ivory-50 p-3 text-sm font-medium outline-none resize-none" placeholder="Explain what students should do" />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-warm-500 uppercase tracking-wide mb-2">Due date</label>
                <input type="date" value={form.dueDate} onChange={(event) => setForm({ ...form, dueDate: event.target.value })} className="w-full rounded-lg border border-warm-200 bg-ivory-50 p-3 text-sm font-medium outline-none" />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="px-5 py-2.5 rounded-lg text-sm font-semibold text-warm-600 hover:bg-ivory-50">Cancel</button>
                <button type="submit" disabled={submitting} className="px-5 py-2.5 rounded-lg bg-forest-700 text-white text-sm font-semibold hover:bg-forest-800 disabled:opacity-60 flex items-center gap-2">
                  {submitting ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />} Publish assignment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
