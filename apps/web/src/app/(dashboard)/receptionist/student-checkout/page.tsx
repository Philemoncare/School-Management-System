'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { apiFetch } from '@/lib/api/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { EmptyState } from '@/components/ui/empty-state';
import {
  ArrowLeft,
  GraduationCap,
  Loader2,
  Plus,
  RefreshCw,
  Search,
} from 'lucide-react';

interface Checkout {
  id: string;
  studentId: string;
  guardianName: string;
  relationship?: string | null;
  reason: string;
  checkedOutAt: string;
  notes?: string | null;
  student?: {
    firstName: string;
    lastName: string;
    studentNumber: string;
    className?: string | null;
    sectionName?: string | null;
  } | null;
}

export default function StudentCheckoutPage() {
  const [checkouts, setCheckouts] = useState<Checkout[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await apiFetch('/front-office/students/checkouts');
      setCheckouts(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setCheckouts([]);
      setError(err?.message || 'Could not load student checkouts.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const visible = useMemo(() => {
    const needle = search.trim().toLowerCase();
    if (!needle) return checkouts;
    return checkouts.filter((checkout) => {
      const name = checkout.student
        ? `${checkout.student.firstName} ${checkout.student.lastName}`
        : '';
      return (
        name.toLowerCase().includes(needle) ||
        (checkout.student?.studentNumber ?? '').toLowerCase().includes(needle) ||
        checkout.guardianName.toLowerCase().includes(needle) ||
        checkout.reason.toLowerCase().includes(needle)
      );
    });
  }, [checkouts, search]);

  const todayCount = checkouts.filter(
    (checkout) =>
      new Date(checkout.checkedOutAt).toDateString() === new Date().toDateString(),
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
            <GraduationCap className="text-forest-700" size={26} /> Student checkout
          </h1>
          <p className="mt-0.5 text-xs font-medium text-warm-500 sm:text-sm">
            {todayCount} early departure{todayCount === 1 ? '' : 's'} recorded today.
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
          <Link href="/receptionist/student-checkout/new">
            <Button size="sm" leftIcon={<Plus size={16} />}>
              Check out student
            </Button>
          </Link>
        </div>
      </div>

      <div className="w-full max-w-md">
        <Input
          type="search"
          aria-label="Search checkouts"
          placeholder="Search student, guardian or reason…"
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

      {loading && checkouts.length === 0 ? (
        <div className="flex items-center justify-center gap-2 py-16 text-sm font-medium text-warm-500">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading checkouts…
        </div>
      ) : checkouts.length === 0 && !error ? (
        <EmptyState
          icon={<GraduationCap className="h-8 w-8" />}
          title="No early departures recorded"
          description="When a guardian collects a student during the school day, record it here for safeguarding."
          actionButton={
            <Link href="/receptionist/student-checkout/new">
              <Button leftIcon={<Plus size={16} />}>Check out student</Button>
            </Link>
          }
        />
      ) : visible.length === 0 && !error ? (
        <EmptyState
          icon={<Search className="h-8 w-8" />}
          title="No checkouts match this search"
          description="Try a different student, guardian or reason."
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
              <caption className="sr-only">Student early departures</caption>
              <thead className="bg-ivory-50">
                <tr>
                  {['Student', 'Collected by', 'Reason', 'Time', 'Notes'].map((heading) => (
                    <th
                      key={heading}
                      scope="col"
                      className="whitespace-nowrap px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wide text-warm-500 sm:px-6"
                    >
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-warm-100">
                {visible.map((checkout) => (
                  <tr key={checkout.id} className="transition-colors hover:bg-sage-50/30">
                    <td className="px-4 py-3.5 sm:px-6">
                      <p className="text-sm font-semibold text-charcoal-900">
                        {checkout.student
                          ? `${checkout.student.firstName} ${checkout.student.lastName}`
                          : 'Student'}
                      </p>
                      <p className="mt-0.5 text-[11px] font-medium text-warm-500">
                        {[checkout.student?.studentNumber, checkout.student?.className, checkout.student?.sectionName]
                          .filter(Boolean)
                          .join(' · ')}
                      </p>
                    </td>
                    <td className="px-4 py-3.5 sm:px-6">
                      <p className="text-xs font-semibold text-charcoal-800">
                        {checkout.guardianName}
                      </p>
                      <p className="text-[11px] font-medium text-warm-500">
                        {checkout.relationship || 'Relationship not recorded'}
                      </p>
                    </td>
                    <td className="max-w-xs px-4 py-3.5 text-xs text-warm-600 sm:px-6">
                      {checkout.reason}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3.5 text-xs font-medium text-warm-600 sm:px-6">
                      {new Date(checkout.checkedOutAt).toLocaleString()}
                    </td>
                    <td className="max-w-xs px-4 py-3.5 text-[11px] text-warm-500 sm:px-6">
                      {checkout.notes || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="border-t border-warm-100 bg-ivory-50/40 px-5 py-3 text-[11px] font-medium text-warm-500 sm:px-6">
            Showing {visible.length} of {checkouts.length} record
            {checkouts.length === 1 ? '' : 's'}.
          </div>
        </section>
      )}
    </div>
  );
}
