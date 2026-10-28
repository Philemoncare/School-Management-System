'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { apiFetch } from '@/lib/api/client';
import { Button } from '@/components/ui/button';
import { Input, Select } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { EmptyState } from '@/components/ui/empty-state';
import { showFeedback } from '@/components/layout/global-feedback';
import { EnquiryForm } from '@/components/front-office/forms';
import {
  ArrowLeft,
  CheckCircle2,
  ClipboardList,
  Loader2,
  Plus,
  RefreshCw,
  Search,
} from 'lucide-react';

interface Enquiry {
  id: string;
  referenceNumber: string;
  visitorName: string;
  phone?: string | null;
  email?: string | null;
  category: string;
  subject: string;
  description?: string | null;
  status: 'NEW' | 'IN_PROGRESS' | 'RESOLVED';
  resolution?: string | null;
  resolvedAt?: string | null;
  createdAt: string;
}

const STATUS_OPTIONS = [
  { value: 'NEW', label: 'New' },
  { value: 'IN_PROGRESS', label: 'In progress' },
  { value: 'RESOLVED', label: 'Resolved' },
];

function statusTone(status: string) {
  if (status === 'RESOLVED') return 'bg-success-100 text-success-800';
  if (status === 'IN_PROGRESS') return 'bg-warning-100 text-warning-800';
  return 'bg-sage-100 text-forest-800';
}

export default function EnquiriesPage() {
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [createOpen, setCreateOpen] = useState(false);
  const [resolving, setResolving] = useState<Enquiry | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await apiFetch('/front-office/enquiries');
      setEnquiries(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setEnquiries([]);
      setError(err?.message || 'Could not load enquiries.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const visible = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return enquiries.filter((enquiry) => {
      if (statusFilter !== 'ALL' && enquiry.status !== statusFilter) return false;
      if (!needle) return true;
      return (
        enquiry.visitorName.toLowerCase().includes(needle) ||
        enquiry.subject.toLowerCase().includes(needle) ||
        enquiry.referenceNumber.toLowerCase().includes(needle) ||
        (enquiry.description ?? '').toLowerCase().includes(needle)
      );
    });
  }, [enquiries, search, statusFilter]);

  const openCount = enquiries.filter((enquiry) => enquiry.status !== 'RESOLVED').length;
  const filtersActive = Boolean(search) || statusFilter !== 'ALL';

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
            <ClipboardList className="text-forest-700" size={26} /> Enquiries log
          </h1>
          <p className="mt-0.5 text-xs font-medium text-warm-500 sm:text-sm">
            {openCount} open enquir{openCount === 1 ? 'y' : 'ies'} awaiting a response.
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
            Log enquiry
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Input
          type="search"
          aria-label="Search enquiries"
          placeholder="Search reference, visitor or subject…"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          leftIcon={<Search size={16} />}
        />
        <Select
          aria-label="Filter by status"
          value={statusFilter}
          options={[{ value: 'ALL', label: 'All statuses' }, ...STATUS_OPTIONS]}
          onChange={(event) => setStatusFilter(event.target.value)}
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

      {loading && enquiries.length === 0 ? (
        <div className="flex items-center justify-center gap-2 py-16 text-sm font-medium text-warm-500">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading enquiries…
        </div>
      ) : enquiries.length === 0 && !error ? (
        <EmptyState
          icon={<ClipboardList className="h-8 w-8" />}
          title="No enquiries logged"
          description="Record walk-in and phone enquiries so nothing is lost between staff."
          actionButton={
            <Button onClick={() => setCreateOpen(true)} leftIcon={<Plus size={16} />}>
              Log first enquiry
            </Button>
          }
        />
      ) : visible.length === 0 && !error ? (
        <EmptyState
          icon={<Search className="h-8 w-8" />}
          title="No enquiries match this view"
          description="Change the status filter or search text."
          actionButton={
            filtersActive ? (
              <Button
                variant="outline"
                onClick={() => {
                  setSearch('');
                  setStatusFilter('ALL');
                }}
              >
                Clear filters
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="space-y-3">
          {visible.map((enquiry) => (
            <article
              key={enquiry.id}
              className="rounded-xl border border-warm-200 bg-card p-4 shadow-xs sm:p-5"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-[10px] font-bold uppercase tracking-wide text-forest-700">
                      {enquiry.referenceNumber}
                    </span>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase ${statusTone(
                        enquiry.status,
                      )}`}
                    >
                      {enquiry.status.replace('_', ' ')}
                    </span>
                    <span className="rounded-full bg-warm-100 px-2 py-0.5 text-[10px] font-bold uppercase text-warm-600">
                      {enquiry.category}
                    </span>
                  </div>
                  <h2 className="mt-2 text-sm font-bold text-charcoal-900">{enquiry.subject}</h2>
                  <p className="mt-0.5 text-xs font-medium text-warm-600">
                    {enquiry.visitorName}
                    {enquiry.phone ? ` · ${enquiry.phone}` : ''}
                    {enquiry.email ? ` · ${enquiry.email}` : ''}
                  </p>
                  {enquiry.description && (
                    <p className="mt-1.5 text-xs leading-relaxed text-warm-500">
                      {enquiry.description}
                    </p>
                  )}
                  {enquiry.status === 'RESOLVED' && enquiry.resolution && (
                    <p className="mt-2 rounded-lg bg-sage-50 p-2.5 text-[11px] font-medium text-forest-800">
                      Resolution: {enquiry.resolution}
                    </p>
                  )}
                  <p className="mt-1.5 text-[11px] text-warm-400">
                    Logged {new Date(enquiry.createdAt).toLocaleString()}
                    {enquiry.resolvedAt
                      ? ` · resolved ${new Date(enquiry.resolvedAt).toLocaleString()}`
                      : ''}
                  </p>
                </div>

                {enquiry.status !== 'RESOLVED' && (
                  <Button
                    variant="outline"
                    size="xs"
                    onClick={() => setResolving(enquiry)}
                    leftIcon={<CheckCircle2 size={12} />}
                  >
                    Resolve
                  </Button>
                )}
              </div>
            </article>
          ))}
        </div>
      )}

      {createOpen && (
        <Modal isOpen onClose={() => setCreateOpen(false)} title="Log enquiry" size="lg">
          <EnquiryForm
            onCancel={() => setCreateOpen(false)}
            onSaved={(enquiry) => {
              setCreateOpen(false);
              showFeedback('SUCCESS', `${enquiry.referenceNumber} logged.`);
              load();
            }}
          />
        </Modal>
      )}

      {resolving && (
        <ResolveEnquiryModal
          enquiry={resolving}
          onClose={() => setResolving(null)}
          onSaved={() => {
            setResolving(null);
            showFeedback('SUCCESS', 'Enquiry resolved.');
            load();
          }}
        />
      )}
    </div>
  );
}

function ResolveEnquiryModal({
  enquiry,
  onClose,
  onSaved,
}: {
  enquiry: Enquiry;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [resolution, setResolution] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (saving) return;
    if (!resolution.trim()) {
      setError('Enter what was done to resolve this enquiry.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await apiFetch(`/front-office/enquiries/${enquiry.id}/resolve`, {
        method: 'PATCH',
        body: JSON.stringify({ resolution: resolution.trim() }),
      });
      onSaved();
    } catch (err: any) {
      setError(err?.message || 'Could not resolve the enquiry.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      isOpen
      onClose={onClose}
      title={`Resolve ${enquiry.referenceNumber}`}
      footerActions={
        <>
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" form="resolve-enquiry-form" isLoading={saving}>
            Mark resolved
          </Button>
        </>
      }
    >
      <form id="resolve-enquiry-form" onSubmit={submit} className="space-y-4">
        <div className="rounded-lg bg-ivory-50 p-3">
          <p className="text-sm font-bold text-charcoal-900">{enquiry.subject}</p>
          <p className="mt-0.5 text-xs font-medium text-warm-600">{enquiry.visitorName}</p>
        </div>
        {error && (
          <p role="alert" className="rounded-lg bg-danger-50 p-3 text-xs font-semibold text-danger-700">
            {error}
          </p>
        )}
        <div className="space-y-1.5">
          <label
            htmlFor="enquiry-resolution"
            className="block text-xs font-semibold text-charcoal-800"
          >
            Resolution *
          </label>
          <textarea
            id="enquiry-resolution"
            rows={4}
            required
            value={resolution}
            onChange={(event) => setResolution(event.target.value)}
            placeholder="What was done, who handled it and what the visitor was told."
            className="w-full resize-none rounded-lg border border-warm-300 bg-card p-3 text-sm text-charcoal-900 placeholder:text-warm-400 focus:border-forest-600 focus:outline-none focus:ring-2 focus:ring-forest-600/20"
          />
        </div>
      </form>
    </Modal>
  );
}
