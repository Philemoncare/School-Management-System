'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { apiFetch } from '@/lib/api/client';
import { useAuth } from '@/context/auth-context';
import { collectUserRoles } from '@/lib/auth/roles';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { EmptyState } from '@/components/ui/empty-state';
import { showFeedback } from '@/components/layout/global-feedback';
import {
  ChevronLeft,
  ChevronRight,
  GraduationCap,
  Loader2,
  Plus,
  RefreshCw,
  Search,
  Users,
} from 'lucide-react';

const PAGE_SIZE = 20;

interface TeacherRow {
  id: string;
  firstName: string;
  middleName?: string | null;
  lastName: string;
  employeeId: string;
  email?: string | null;
  phone?: string | null;
  specialization?: string | null;
  status: string;
  department?: { name: string } | null;
  position?: { name: string } | null;
  user?: { email: string; isActive: boolean } | null;
}

const STATUS_STYLES: Record<string, string> = {
  ACTIVE: 'bg-success-100 text-success-800',
  SUSPENDED: 'bg-warning-100 text-warning-800',
  INACTIVE: 'bg-warm-100 text-warm-700',
};

export default function TeachersListPage() {
  const { user, activeSchoolId } = useAuth();
  const roles = useMemo(() => collectUserRoles(user, activeSchoolId), [user, activeSchoolId]);
  const canManage = roles.some((role) =>
    ['SCHOOL_ADMIN', 'PRINCIPAL', 'HR_OFFICER', 'RECEPTIONIST'].includes(role),
  );

  const [items, setItems] = useState<TeacherRow[]>([]);
  const [meta, setMeta] = useState({ total: 0, page: 1, limit: PAGE_SIZE, totalPages: 1 });
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      setSearch(searchInput.trim());
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const loadTeachers = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(PAGE_SIZE),
      });
      if (search) params.set('search', search);
      const result = await apiFetch(`/teachers?${params.toString()}`);
      setItems(Array.isArray(result?.items) ? result.items : []);
      setMeta(result?.meta ?? { total: 0, page: 1, limit: PAGE_SIZE, totalPages: 1 });
    } catch (err: any) {
      setItems([]);
      setError(err?.message || 'Could not load teachers.');
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    loadTeachers();
  }, [loadTeachers]);

  const rangeStart = meta.total === 0 ? 0 : (meta.page - 1) * meta.limit + 1;
  const rangeEnd = Math.min(meta.page * meta.limit, meta.total);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-charcoal-900 sm:text-3xl">
            <Users className="mr-2 h-5 w-5 text-forest-700" />
            Teachers & Staff
          </h1>
          <p className="mt-0.5 text-xs font-medium text-warm-500 sm:text-sm">
            Manage teaching and non-teaching staff members.
          </p>
        </div>
        {canManage && (
          <Link
            href="/dashboard/teachers/new"
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-forest-800 px-4 py-2.5 text-sm font-semibold text-ivory-50 shadow-xs transition-colors hover:bg-forest-900 sm:w-auto"
          >
            <Plus size={16} />
            Register Teacher
          </Link>
        )}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="w-full max-w-md">
          <Input
            type="search"
            aria-label="Search teachers"
            placeholder="Search by name or employee ID…"
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            leftIcon={<Search size={16} />}
          />
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={loadTeachers}
          disabled={loading}
          leftIcon={<RefreshCw size={14} className={loading ? 'animate-spin' : undefined} />}
        >
          Refresh
        </Button>
      </div>

      {error && (
        <div
          role="alert"
          className="flex flex-col gap-3 rounded-xl border border-danger-200 bg-danger-50 p-4 text-xs font-semibold text-danger-700 sm:flex-row sm:items-center sm:justify-between sm:text-sm"
        >
          <span>{error}</span>
          <Button variant="outline" size="sm" onClick={loadTeachers}>
            Try again
          </Button>
        </div>
      )}

      {loading && items.length === 0 ? (
        <div className="flex items-center justify-center gap-2 py-16 text-sm font-medium text-warm-500">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading teachers…
        </div>
      ) : items.length === 0 && !error ? (
        <EmptyState
          icon={<Users className="h-8 w-8" />}
          title={search ? 'No matching teachers' : 'No teachers yet'}
          description={
            search
              ? `No teacher matches "${search}". Try a different name or employee ID.`
              : 'No teachers have been registered yet. Register your first teacher to get started.'
          }
          actionButton={
            canManage && !search ? (
              <Link
                href="/dashboard/teachers/new"
                className="inline-flex items-center gap-2 rounded-lg bg-forest-800 px-4 py-2.5 text-sm font-semibold text-ivory-50 hover:bg-forest-900"
              >
                <Plus size={16} />
                Register Teacher
              </Link>
            ) : undefined
          }
        />
      ) : (
        <div className="overflow-hidden rounded-xl border border-warm-200 bg-card shadow-xs">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-warm-200">
              <caption className="sr-only">Teachers and staff members</caption>
              <thead className="bg-ivory-50">
                <tr>
                  {[
                    'Teacher',
                    'Employee ID',
                    'Department / Position',
                    'Status',
                    'Actions',
                  ].map((heading) => (
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
              <tbody className="divide-y divide-warm-100 bg-card">
                {items.map((teacher) => {
                  const fullName = `${teacher.firstName} ${teacher.middleName ? teacher.middleName + ' ' : ''}${teacher.lastName}`;
                  return (
                    <tr key={teacher.id} className="transition-colors hover:bg-sage-50/40">
                      <td className="whitespace-nowrap px-4 py-3.5 sm:px-6">
                        <div className="flex items-center gap-3">
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-sage-100 text-forest-800">
                            <Users className="text-md" />
                          </span>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-charcoal-900">
                              {fullName}
                            </p>
                            <p className="text-xs text-warm-500">
                              {teacher.user?.email || 'No email on file'}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3.5 font-mono text-xs text-warm-600 sm:px-6">
                        {teacher.employeeId}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3.5 text-xs sm:px-6">
                        <div className="flex flex-col">
                          <span className={teacher.department ? 'font-semibold text-charcoal-800' : 'text-warm-400'}>
                            {teacher.department?.name || 'No department'}
                          </span>
                          {teacher.position && (
                            <span className="text-[11px] text-warm-500 mt-0.5">
                              {teacher.position.name}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3.5 sm:px-6">
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase ${
                            STATUS_STYLES[teacher.status] ?? 'bg-warm-100 text-warm-700'
                          }`}
                        >
                          {teacher.status}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3.5 text-right text-xs font-bold sm:px-6">
                        <Link
                          href={`/dashboard/teachers/${teacher.id}`}
                          className="text-forest-700 underline-offset-4 hover:text-forest-950 hover:underline"
                        >
                          View Profile
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col items-center justify-between gap-3 border-t border-warm-100 bg-ivory-50/60 px-4 py-3 sm:flex-row sm:px-6">
            <p className="text-xs font-medium text-warm-500">
              Showing {rangeStart}&ndash;{rangeEnd} of {meta.total} teacher{meta.total === 1 ? '' : 's'}
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((current) => Math.max(1, current - 1))}
                disabled={loading || meta.page <= 1}
                leftIcon={<ChevronLeft size={14} />}
              >
                Previous
              </Button>
              <span className="text-xs font-semibold text-warm-600">
                Page {meta.page} of {meta.totalPages || 1}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((current) => Math.min(meta.totalPages || 1, current + 1))}
                disabled={loading || meta.page >= (meta.totalPages || 1)}
                rightIcon={<ChevronRight size={14} />}
              >
                Next
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}