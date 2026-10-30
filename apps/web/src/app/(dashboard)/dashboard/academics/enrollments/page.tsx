'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { apiFetch } from '@/lib/api/client';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import {
  Users,
  Search,
  UserPlus,
  BookOpen,
  ExternalLink,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { Select } from '@/components/ui/input';
import Link from 'next/link';

export default function EnrollmentsPage() {
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('ALL');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');
    apiFetch('/enrollments')
      .then((data) => {
        if (!cancelled) setEnrollments(Array.isArray(data) ? data : []);
      })
      .catch((err: any) => {
        if (!cancelled) {
          setEnrollments([]);
          setError(err?.message || 'Could not load enrollments.');
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const statusOptions = useMemo(
    () => Array.from(new Set(enrollments.map((enrollment) => String(enrollment.status)))).sort(),
    [enrollments],
  );

  const visible = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return enrollments.filter((enrollment) => {
      if (status !== 'ALL' && enrollment.status !== status) return false;
      if (!needle) return true;
      return (
        `${enrollment.student?.firstName ?? ''} ${enrollment.student?.lastName ?? ''}`
          .toLowerCase()
          .includes(needle) ||
        String(enrollment.student?.studentNumber ?? '').toLowerCase().includes(needle) ||
        String(enrollment.class?.name ?? '').toLowerCase().includes(needle) ||
        String(enrollment.section?.name ?? '').toLowerCase().includes(needle)
      );
    });
  }, [enrollments, search, status]);

  const filtersActive = Boolean(search) || status !== 'ALL';

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="flex items-center gap-3 text-2xl font-semibold tracking-tight text-charcoal-900 sm:text-3xl">
            <Users className="text-forest-700" /> Enrollment Directory
          </h1>
          <p className="mt-1 text-sm font-medium text-warm-500">
            Student placements in classes and sections.
          </p>
        </div>
        <Link
          href="/dashboard/students/new"
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-forest-700 px-6 py-3 text-sm font-semibold text-white shadow-xs shadow-sage-200 transition-all hover:bg-forest-800"
        >
          <UserPlus size={18} /> Enroll New Student
        </Link>
      </div>

      {error && (
        <div
          role="alert"
          className="flex flex-col gap-3 rounded-2xl border border-danger-200 bg-danger-50 p-4 text-xs font-semibold text-danger-700 sm:flex-row sm:items-center sm:justify-between"
        >
          <span className="flex items-center gap-2">
            <AlertCircle size={16} /> {error}
          </span>
          <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
            Try again
          </Button>
        </div>
      )}

      <div className="overflow-hidden rounded-3xl border border-warm-200 bg-card shadow-sm">
        <div className="flex flex-col items-stretch gap-3 border-b border-warm-100 bg-ivory-50/50 p-4 sm:flex-row sm:items-center sm:p-6">
          <div className="flex flex-1 items-center rounded-2xl border border-warm-200 bg-card px-4 py-2.5 shadow-sm">
            <Search size={18} className="mr-3 shrink-0 text-warm-400" />
            <input
              type="search"
              aria-label="Search enrollments"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by name, student number, class or section…"
              className="w-full border-none bg-transparent text-sm font-medium placeholder:text-warm-400 focus:outline-none"
            />
          </div>
          <Select
            aria-label="Filter enrollments by status"
            value={status}
            placeholder="All statuses"
            options={statusOptions.map((option) => ({ value: option, label: option.replace(/_/g, " ") }))}
            onChange={(event) => setStatus(event.target.value)}
            className="w-auto min-w-[160px]"
          />
        </div>

        {loading ? (
          <div className="flex items-center justify-center gap-3 py-20 text-sm font-medium text-warm-500">
            <Loader2 className="h-5 w-5 animate-spin text-forest-700" /> Loading enrollments…
          </div>
        ) : enrollments.length === 0 ? (
          <div className="p-6 sm:p-8">
            <EmptyState
              icon={<BookOpen className="h-8 w-8" />}
              title="No enrollments yet"
              description="Enroll a student to place them in a class and section for the current academic year."
              actionButton={
                <Link
                  href="/dashboard/students/new"
                  className="inline-flex items-center gap-2 rounded-xl bg-forest-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-forest-800"
                >
                  <UserPlus size={16} /> Enroll a student
                </Link>
              }
            />
          </div>
        ) : visible.length === 0 ? (
          <div className="p-6 sm:p-8">
            <EmptyState
              icon={<Search className="h-8 w-8" />}
              title="No enrollments match this view"
              description="Change the search text or status filter."
              actionButton={
                filtersActive ? (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSearch('');
                      setStatus('ALL');
                    }}
                  >
                    Clear filters
                  </Button>
                ) : undefined
              }
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-warm-200">
              <thead className="bg-ivory-50">
                <tr>
                  <th className="px-5 py-4 text-left text-[11px] font-semibold uppercase tracking-wide text-warm-400 sm:px-8">
                    Student
                  </th>
                  <th className="px-5 py-4 text-left text-[11px] font-semibold uppercase tracking-wide text-warm-400 sm:px-8">
                    Class &amp; Section
                  </th>
                  <th className="px-5 py-4 text-left text-[11px] font-semibold uppercase tracking-wide text-warm-400 sm:px-8">
                    Academic Year
                  </th>
                  <th className="px-5 py-4 text-left text-[11px] font-semibold uppercase tracking-wide text-warm-400 sm:px-8">
                    Status
                  </th>
                  <th className="px-5 py-4 text-right text-[11px] font-semibold uppercase tracking-wide text-warm-400 sm:px-8">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-warm-100 bg-card">
                {visible.map((enrollment) => (
                  <tr key={enrollment.id} className="group transition-colors hover:bg-sage-50/30">
                    <td className="px-5 py-4 sm:px-8 sm:py-5">
                      <div className="flex items-center gap-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-warm-100 bg-warm-100 font-semibold text-warm-500 transition-colors group-hover:bg-card">
                          {enrollment.student?.firstName?.[0] ?? '?'}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold leading-tight text-charcoal-900">
                            {enrollment.student?.firstName} {enrollment.student?.lastName}
                          </p>
                          <p className="mt-0.5 text-[11px] font-bold uppercase text-warm-400">
                            {enrollment.student?.studentNumber}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 sm:px-8 sm:py-5">
                      <p className="text-sm font-semibold text-charcoal-800">{enrollment.class?.name ?? '—'}</p>
                      <p className="text-[11px] font-bold uppercase tracking-tight text-warm-400">
                        {enrollment.section?.name || 'Default'}
                      </p>
                    </td>
                    <td className="px-5 py-4 sm:px-8 sm:py-5">
                      <span className="rounded-lg bg-warm-100 px-2 py-0.5 text-xs font-bold text-warm-600">
                        {enrollment.academicYear?.name ?? '—'}
                      </span>
                    </td>
                    <td className="px-5 py-4 sm:px-8 sm:py-5">
                      <span
                        className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-tight ${
                          enrollment.status === 'ACTIVE'
                            ? 'bg-success-100 text-success-700'
                            : enrollment.status === 'COMPLETED'
                              ? 'bg-sage-100 text-forest-800'
                              : 'bg-warm-100 text-warm-600'
                        }`}
                      >
                        {String(enrollment.status).replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right sm:px-8 sm:py-5">
                      <Link
                        href={`/dashboard/students/${enrollment.studentId}`}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-warm-200 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-forest-700 hover:bg-ivory-50"
                      >
                        <ExternalLink size={13} /> Profile
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
