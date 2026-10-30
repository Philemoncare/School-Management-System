'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { apiFetch } from '@/lib/api/client';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/input';
import { EmptyState } from '@/components/ui/empty-state';
import {
  Search,
  ChevronRight,
  Loader2,
  Inbox,
  AlertCircle,
} from 'lucide-react';
import Link from 'next/link';

const STATUS_OPTIONS = [
  { value: '', label: 'All statuses' },
  { value: 'SUBMITTED', label: 'Submitted' },
  { value: 'UNDER_REVIEW', label: 'Under review' },
  { value: 'DOCUMENTS_REQUIRED', label: 'Documents required' },
  { value: 'SCREENING', label: 'Screening' },
  { value: 'INTERVIEW_SCHEDULED', label: 'Interview scheduled' },
  { value: 'ASSESSMENT_PENDING', label: 'Assessment pending' },
  { value: 'ASSESSMENT_COMPLETED', label: 'Assessment completed' },
  { value: 'DECISION_PENDING', label: 'Decision pending' },
  { value: 'OFFERED', label: 'Offered' },
  { value: 'ACCEPTED', label: 'Accepted' },
  { value: 'ADMITTED', label: 'Admitted' },
  { value: 'ENROLLED', label: 'Enrolled' },
  { value: 'WAITLISTED', label: 'Waitlisted' },
  { value: 'REJECTED', label: 'Rejected' },
  { value: 'WITHDRAWN', label: 'Withdrawn' },
  { value: 'EXPIRED', label: 'Expired' },
];

export default function ApplicationsList() {
  const searchParams = useSearchParams();
  const campaignId = searchParams.get('campaignId');

  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [status, setStatus] = useState('');

  useEffect(() => {
    const timeout = setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => clearTimeout(timeout);
  }, [search]);

  const loadApplications = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const query = new URLSearchParams();
      if (debouncedSearch) query.append('search', debouncedSearch);
      if (campaignId) query.append('campaignId', campaignId);
      if (status) query.append('status', status);

      const data = await apiFetch(
        `/admissions/applications${query.toString() ? `?${query.toString()}` : ''}`,
      );
      setApplications(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setApplications([]);
      setError(err?.message || 'Could not load the application queue.');
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, campaignId, status]);

  useEffect(() => {
    loadApplications();
  }, [loadApplications]);

  const hasFilters = Boolean(debouncedSearch || status || campaignId);

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-charcoal-900 sm:text-3xl">
          Application queue
        </h1>
        <p className="mt-1 text-[11px] font-bold uppercase tracking-wide text-warm-500">
          Review and process student admission requests
        </p>
      </div>

      <div className="overflow-hidden rounded-xl border border-warm-200 bg-card shadow-sm">
        <div className="flex flex-col gap-3 border-b border-warm-100 bg-ivory-50/50 p-4 sm:p-6 lg:flex-row lg:items-end">
          <div className="flex flex-1 items-center rounded-2xl border border-warm-200 bg-card px-5 py-3 shadow-sm transition-all focus-within:ring-2 focus-within:ring-forest-700/10">
            <Search size={18} className="mr-3 shrink-0 text-warm-400" />
            <input
              type="search"
              aria-label="Search applications"
              placeholder="Search by name, reference or guardian…"
              className="w-full border-none bg-transparent text-sm font-bold text-charcoal-900 placeholder:text-warm-400 focus:ring-0"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
          <div className="w-full lg:w-60">
            <Select
              label="Status"
              value={status}
              onChange={(event) => setStatus(event.target.value)}
              options={STATUS_OPTIONS}
            />
          </div>
        </div>

        {campaignId && (
          <p className="border-b border-warm-100 bg-sage-50/50 px-4 py-2 text-[11px] font-semibold uppercase tracking-wide text-forest-800 sm:px-6">
            Filtered to one admission campaign
          </p>
        )}

        {error && (
          <div
            role="alert"
            className="flex flex-col gap-3 border-b border-danger-100 bg-danger-50 p-4 text-xs font-semibold text-danger-700 sm:flex-row sm:items-center sm:justify-between"
          >
            <span className="flex items-center gap-2">
              <AlertCircle size={16} /> {error}
            </span>
            <Button variant="outline" size="sm" onClick={loadApplications}>
              Try again
            </Button>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center gap-3 py-24 text-sm font-medium text-warm-500">
            <Loader2 className="h-5 w-5 animate-spin text-forest-700" /> Loading applications…
          </div>
        ) : applications.length === 0 ? (
          <div className="p-6 sm:p-10">
            <EmptyState
              icon={<Inbox className="h-8 w-8" />}
              title={hasFilters ? 'No applications match your filters' : 'No applications yet'}
              description={
                hasFilters
                  ? 'Clear the search or status filter to see the full queue.'
                  : 'Applications submitted through an admission campaign appear here.'
              }
              actionButton={
                hasFilters ? (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSearch('');
                      setStatus('');
                    }}
                  >
                    Clear filters
                  </Button>
                ) : (
                  <Link
                    href="/dashboard/admissions"
                    className="inline-flex items-center gap-2 rounded-xl bg-forest-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-forest-800"
                  >
                    Admissions overview
                  </Link>
                )
              }
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-warm-200">
              <thead className="bg-ivory-50/50">
                <tr>
                  {['Applicant', 'Target class', 'Reference', 'Status', 'Actions'].map((heading) => (
                    <th
                      key={heading}
                      className={`px-5 py-4 text-[10px] font-semibold uppercase tracking-wide text-warm-400 sm:px-8 ${
                        heading === 'Actions' ? 'text-right' : 'text-left'
                      }`}
                    >
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-warm-100 bg-card">
                {applications.map((app) => (
                  <tr key={app.id} className="group transition-colors hover:bg-ivory-50/50">
                    <td className="px-5 py-5 sm:px-8">
                      <div className="flex items-center gap-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-warm-100 text-xs font-semibold text-warm-400">
                          {app.firstName?.[0] ?? ''}
                          {app.lastName?.[0] ?? ''}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold leading-tight text-charcoal-900">
                            {app.firstName} {app.lastName}
                          </p>
                          <p className="mt-0.5 text-[11px] font-bold uppercase tracking-tight text-warm-400">
                            {app.campaign?.name ?? 'No campaign'}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-5 sm:px-8">
                      <p className="text-xs font-bold text-warm-700">{app.class?.name ?? '—'}</p>
                      <p className="mt-1 text-[11px] font-semibold uppercase tracking-wide text-warm-400">
                        {app.academicYear?.name ?? '—'}
                      </p>
                    </td>
                    <td className="px-5 py-5 font-mono text-[11px] font-semibold text-forest-700 sm:px-8">
                      {app.reference}
                    </td>
                    <td className="px-5 py-5 sm:px-8">
                      <StatusBadge status={app.status} />
                    </td>
                    <td className="px-5 py-5 text-right sm:px-8">
                      <Link
                        href={`/dashboard/admissions/applications/${app.id}`}
                        aria-label={`Review application ${app.reference}`}
                        className="inline-flex rounded-xl border border-transparent p-2 text-warm-400 transition-all hover:border-warm-100 hover:bg-card hover:text-forest-700 hover:shadow-md"
                      >
                        <ChevronRight size={18} />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    SUBMITTED: 'bg-sage-50 text-forest-800',
    UNDER_REVIEW: 'bg-warning-50 text-warning-700',
    DOCUMENTS_REQUIRED: 'bg-danger-50 text-danger-700',
    SCREENING: 'bg-warning-50 text-warning-700',
    INTERVIEW_SCHEDULED: 'bg-warning-50 text-warning-700',
    ASSESSMENT_PENDING: 'bg-warning-50 text-warning-700',
    ASSESSMENT_COMPLETED: 'bg-sage-50 text-forest-800',
    DECISION_PENDING: 'bg-warning-50 text-warning-700',
    OFFERED: 'bg-terracotta-50 text-terracotta-700',
    ACCEPTED: 'bg-sage-50 text-forest-700',
    ADMITTED: 'bg-sage-50 text-forest-700',
    ENROLLED: 'bg-success-600 text-white shadow-md shadow-success-100',
    WAITLISTED: 'bg-warm-100 text-warm-600',
    REJECTED: 'bg-warm-100 text-warm-500',
    WITHDRAWN: 'bg-warm-100 text-warm-500',
    EXPIRED: 'bg-warm-100 text-warm-500',
  };

  return (
    <span
      className={`rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-tight ${
        styles[status] || 'bg-ivory-50 text-warm-500'
      }`}
    >
      {String(status).replace(/_/g, ' ')}
    </span>
  );
}
