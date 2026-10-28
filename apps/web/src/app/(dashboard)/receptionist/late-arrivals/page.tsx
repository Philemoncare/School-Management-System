'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { apiFetch } from '@/lib/api/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { EmptyState } from '@/components/ui/empty-state';
import { showFeedback } from '@/components/layout/global-feedback';
import { LateArrivalForm } from '@/components/front-office/forms';
import {
  ArrowLeft,
  Clock,
  Loader2,
  PencilLine,
  Plus,
  RefreshCw,
  Search,
} from 'lucide-react';

interface LateArrival {
  id: string;
  studentId: string;
  arrivalTime: string;
  reason: string;
  notes?: string | null;
  student?: {
    firstName: string;
    lastName: string;
    studentNumber: string;
    className?: string | null;
    sectionName?: string | null;
  } | null;
}

export default function LateArrivalsPage() {
  const [records, setRecords] = useState<LateArrival[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<LateArrival | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await apiFetch('/front-office/students/late-arrivals');
      setRecords(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setRecords([]);
      setError(err?.message || 'Could not load late arrivals.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const visible = useMemo(() => {
    const needle = search.trim().toLowerCase();
    if (!needle) return records;
    return records.filter((record) => {
      const name = record.student
        ? `${record.student.firstName} ${record.student.lastName}`
        : '';
      return (
        name.toLowerCase().includes(needle) ||
        (record.student?.studentNumber ?? '').toLowerCase().includes(needle) ||
        record.reason.toLowerCase().includes(needle) ||
        (record.notes ?? '').toLowerCase().includes(needle)
      );
    });
  }, [records, search]);

  const todayCount = records.filter(
    (record) => new Date(record.arrivalTime).toDateString() === new Date().toDateString(),
  ).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Link
            href="/receptionist/dashboard"
            className="mb-2 inline-flex items-center gap-1.5 text-xs font-semibold text-warm-600 hover:text-charcoal-900"
          >
            <ArrowLeft size={14} /> Front desk
          </Link>
          <h1 className="flex items-center gap-3 text-2xl font-bold tracking-tight text-charcoal-900 sm:text-3xl">
            <Clock className="text-forest-700" size={26} /> Late arrivals
          </h1>
          <p className="mt-0.5 text-xs font-medium text-warm-500 sm:text-sm">
            {todayCount} student{todayCount === 1 ? '' : 's'} arrived late today.
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
          <Button size="sm" onClick={() => setCreateOpen(true)} leftIcon={<Plus size={16} />}>
            Record arrival
          </Button>
        </div>
      </div>

      <div className="w-full max-w-md">
        <Input
          type="search"
          aria-label="Search late arrivals"
          placeholder="Search student, reason or notes…"
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

      {loading && records.length === 0 ? (
        <div className="flex items-center justify-center gap-2 py-16 text-sm font-medium text-warm-500">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading late arrivals…
        </div>
      ) : records.length === 0 && !error ? (
        <EmptyState
          icon={<Clock className="h-8 w-8" />}
          title="No late arrivals recorded"
          description="Record students who arrive after the school day has started so attendance stays accurate."
          actionButton={
            <Button onClick={() => setCreateOpen(true)} leftIcon={<Plus size={16} />}>
              Record arrival
            </Button>
          }
        />
      ) : visible.length === 0 && !error ? (
        <EmptyState
          icon={<Search className="h-8 w-8" />}
          title="No late arrivals match this search"
          description="Try a different student name, number or reason."
          actionButton={
            <Button variant="outline" onClick={() => setSearch('')}>
              Clear search
            </Button>
          }
        />
      ) : (
        <section className="overflow-hidden rounded-xl border border-warm-200 bg-card shadow-xs">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-warm-200">
              <caption className="sr-only">Late arrivals</caption>
              <thead className="bg-ivory-50">
                <tr>
                  {['Student', 'Arrived', 'Reason', 'Notes', 'Actions'].map((heading) => (
                    <th
                      key={heading}
                      scope="col"
                      className={`whitespace-nowrap px-4 py-3 text-[11px] font-bold uppercase tracking-wide text-warm-500 sm:px-6 ${
                        heading === 'Actions' ? 'text-right' : 'text-left'
                      }`}
                    >
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-warm-100">
                {visible.map((record) => (
                  <tr key={record.id} className="transition-colors hover:bg-sage-50/30">
                    <td className="px-4 py-3.5 sm:px-6">
                      <p className="text-sm font-semibold text-charcoal-900">
                        {record.student
                          ? `${record.student.firstName} ${record.student.lastName}`
                          : 'Student'}
                      </p>
                      <p className="mt-0.5 text-[11px] font-medium text-warm-500">
                        {[record.student?.studentNumber, record.student?.className, record.student?.sectionName]
                          .filter(Boolean)
                          .join(' · ')}
                      </p>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3.5 text-xs font-medium text-warm-600 sm:px-6">
                      {new Date(record.arrivalTime).toLocaleString()}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3.5 sm:px-6">
                      <span className="rounded-full bg-warning-100 px-2.5 py-0.5 text-[10px] font-bold uppercase text-warning-800">
                        {record.reason}
                      </span>
                    </td>
                    <td className="max-w-xs px-4 py-3.5 text-[11px] text-warm-500 sm:px-6">
                      {record.notes || '—'}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3.5 text-right sm:px-6">
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={`Edit late arrival for ${record.student?.firstName ?? 'student'}`}
                        onClick={() => setEditing(record)}
                      >
                        <PencilLine size={15} />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="border-t border-warm-100 bg-ivory-50/40 px-5 py-3 text-[11px] font-medium text-warm-500 sm:px-6">
            Showing {visible.length} of {records.length} record
            {records.length === 1 ? '' : 's'}.
          </div>
        </section>
      )}

      {createOpen && (
        <Modal isOpen onClose={() => setCreateOpen(false)} title="Record late arrival" size="lg">
          <LateArrivalForm
            onCancel={() => setCreateOpen(false)}
            onSaved={() => {
              setCreateOpen(false);
              showFeedback('SUCCESS', 'Late arrival recorded.');
              load();
            }}
          />
        </Modal>
      )}

      {editing && (
        <EditLateArrivalModal
          record={editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            showFeedback('SUCCESS', 'Late arrival updated.');
            load();
          }}
        />
      )}
    </div>
  );
}

function EditLateArrivalModal({
  record,
  onClose,
  onSaved,
}: {
  record: LateArrival;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState({
    reason: record.reason,
    notes: record.notes ?? '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (saving) return;
    setSaving(true);
    setError('');
    try {
      await apiFetch(`/front-office/students/late-arrivals/${record.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          reason: form.reason.trim() || 'Delayed',
          notes: form.notes.trim(),
        }),
      });
      onSaved();
    } catch (err: any) {
      setError(err?.message || 'Could not update the late arrival.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      isOpen
      onClose={onClose}
      title="Edit late arrival"
      footerActions={
        <>
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" form="edit-late-arrival-form" isLoading={saving}>
            Save changes
          </Button>
        </>
      }
    >
      <form id="edit-late-arrival-form" onSubmit={submit} className="space-y-4">
        <div className="rounded-lg bg-ivory-50 p-3">
          <p className="text-sm font-bold text-charcoal-900">
            {record.student
              ? `${record.student.firstName} ${record.student.lastName}`
              : 'Student'}
          </p>
          <p className="mt-0.5 text-xs font-medium text-warm-600">
            Arrived {new Date(record.arrivalTime).toLocaleString()}
          </p>
        </div>
        {error && (
          <p role="alert" className="rounded-lg bg-danger-50 p-3 text-xs font-semibold text-danger-700">
            {error}
          </p>
        )}
        <Input
          label="Reason"
          value={form.reason}
          onChange={(event) => setForm({ ...form, reason: event.target.value })}
        />
        <div className="space-y-1.5">
          <label
            htmlFor="late-arrival-notes"
            className="block text-xs font-semibold text-charcoal-800"
          >
            Notes
          </label>
          <textarea
            id="late-arrival-notes"
            rows={3}
            value={form.notes}
            onChange={(event) => setForm({ ...form, notes: event.target.value })}
            className="w-full resize-none rounded-lg border border-warm-300 bg-card p-3 text-sm text-charcoal-900 placeholder:text-warm-400 focus:border-forest-600 focus:outline-none focus:ring-2 focus:ring-forest-600/20"
          />
        </div>
      </form>
    </Modal>
  );
}
