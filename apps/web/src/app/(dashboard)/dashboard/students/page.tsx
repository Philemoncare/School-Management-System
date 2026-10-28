'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
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

const STATUS_STYLES: Record<string, string> = {
  ACTIVE: 'bg-success-100 text-success-800',
  WITHDRAWN: 'bg-danger-100 text-danger-700',
  GRADUATED: 'bg-sage-100 text-forest-800',
  TRANSFERRED: 'bg-warning-100 text-warning-800',
  SUSPENDED: 'bg-warning-100 text-warning-800',
  INACTIVE: 'bg-warm-100 text-warm-700',
};

interface StudentRow {
  id: string;
  firstName: string;
  middleName?: string | null;
  lastName: string;
  studentNumber: string;
  admissionNumber?: string | null;
  status: string;
  gender?: string | null;
  currentEnrollment?: {
    class?: { name: string } | null;
    section?: { name: string } | null;
    academicYear?: { name: string } | null;
  } | null;
}

export default function StudentsListPage() {
  const { user, activeSchoolId } = useAuth();
  const roles = useMemo(() => collectUserRoles(user, activeSchoolId), [user, activeSchoolId]);
  const canCreate = roles.some((role) =>
    ['SCHOOL_ADMIN', 'PRINCIPAL', 'RECEPTIONIST'].includes(role),
  );

  const [items, setItems] = useState<StudentRow[]>([]);
  const [meta, setMeta] = useState({ total: 0, page: 1, limit: PAGE_SIZE, totalPages: 1 });
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Debounce typing so each keystroke does not issue a request.
  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      setSearch(searchInput.trim());
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const loadStudents = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(PAGE_SIZE),
      });
      if (search) params.set('search', search);
      const result = await apiFetch(`/students?${params.toString()}`);
      setItems(result?.items ?? []);
      setMeta(result?.meta ?? { total: 0, page, limit: PAGE_SIZE, totalPages: 1 });
    } catch (err: any) {
      setItems([]);
      setError(err?.message || 'Could not load students.');
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    loadStudents();
  }, [loadStudents]);

  const rangeStart = meta.total === 0 ? 0 : (meta.page - 1) * meta.limit + 1;
  const rangeEnd = Math.min(meta.page * meta.limit, meta.total);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-charcoal-900 sm:text-3xl">
            Students
          </h1>
          <p className="mt-0.5 text-xs font-medium text-warm-500 sm:text-sm">
            Registered students, their current class, and enrollment status.
          </p>
        </div>
        {canCreate && (
          <Link
            href="/dashboard/students/new"
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-forest-800 px-4 py-2.5 text-sm font-semibold text-ivory-50 shadow-xs transition-colors hover:bg-forest-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest-600/30 sm:w-auto"
          >
            <Plus size={16} />
            Add Student
          </Link>
        )}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="w-full max-w-md">
          <Input
            type="search"
            aria-label="Search students"
            placeholder="Search by name, student number, admission number..."
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            leftIcon={<Search size={16} />}
          />
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={loadStudents}
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
          <Button variant="outline" size="sm" onClick={loadStudents}>
            Try again
          </Button>
        </div>
      )}

      {loading && items.length === 0 ? (
        <div className="flex items-center justify-center gap-2 py-16 text-sm font-medium text-warm-500">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading students…
        </div>
      ) : items.length === 0 && !error ? (
        <EmptyState
          icon={<Users className="h-8 w-8" />}
          title={search ? 'No matching students' : 'No students yet'}
          description={
            search
              ? `No student matches “${search}”. Try a different name or number.`
              : 'Register the first student to start building class lists, attendance and billing.'
          }
          actionButton={
            canCreate && !search ? (
              <Link
                href="/dashboard/students/new"
                className="inline-flex items-center gap-2 rounded-lg bg-forest-800 px-4 py-2.5 text-sm font-semibold text-ivory-50 hover:bg-forest-900"
              >
                <Plus size={16} />
                Add Student
              </Link>
            ) : undefined
          }
        />
      ) : (
        <div className="overflow-hidden rounded-xl border border-warm-200 bg-card shadow-xs">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-warm-200">
              <caption className="sr-only">Students with current class placement</caption>
              <thead className="bg-ivory-50">
                <tr>
                  {['Student', 'ID', 'Class', 'Status', 'Actions'].map((heading) => (
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
                {items.map((student) => {
                  const enrollment = student.currentEnrollment;
                  const classLabel = enrollment?.class
                    ? `${enrollment.class.name}${enrollment.section ? ` · ${enrollment.section.name}` : ''}`
                    : 'Not enrolled';
                  return (
                    <tr key={student.id} className="transition-colors hover:bg-sage-50/40">
                      <td className="whitespace-nowrap px-4 py-3.5 sm:px-6">
                        <div className="flex items-center gap-3">
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-sage-100 text-forest-800">
                            <GraduationCap size={16} />
                          </span>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-charcoal-900">
                              {student.lastName}, {student.firstName}
                              {student.middleName ? ` ${student.middleName}` : ''}
                            </p>
                            <p className="text-xs text-warm-500">
                              {student.gender ? student.gender : 'Gender not recorded'}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3.5 font-mono text-xs text-warm-600 sm:px-6">
                        {student.studentNumber}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3.5 text-xs sm:px-6">
                        <span
                          className={
                            enrollment?.class ? 'font-semibold text-charcoal-800' : 'text-warm-400'
                          }
                        >
                          {classLabel}
                        </span>
                        {enrollment?.academicYear?.name && (
                          <span className="block text-[11px] text-warm-500">
                            {enrollment.academicYear.name}
                          </span>
                        )}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3.5 sm:px-6">
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase ${
                            STATUS_STYLES[student.status] ?? 'bg-warm-100 text-warm-700'
                          }`}
                        >
                          {student.status}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3.5 text-right text-xs font-bold sm:px-6">
                        <Link
                          href={`/dashboard/students/${student.id}`}
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
              Showing {rangeStart}–{rangeEnd} of {meta.total} student{meta.total === 1 ? '' : 's'}
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
