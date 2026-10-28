'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { BookOpen, AlertCircle, Bookmark, Lock, Inbox, RefreshCw } from 'lucide-react';
import { apiFetch, ApiError } from '@/lib/api/client';
import { useAuth } from '@/context/auth-context';
import { useChild } from '@/context/child-context';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';

const money = (value: unknown) =>
  `GH₵ ${Number(value || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function ParentLibrary() {
  const { activeChild, loading: childLoading } = useChild();
  const { activeSchoolId } = useAuth();
  const [libraryData, setLibraryData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [denied, setDenied] = useState(false);

  async function load() {
    if (!activeChild || !activeSchoolId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    setDenied(false);
    try {
      const data = await apiFetch(`/parent/children/${activeChild.id}/library`);
      setLibraryData(data || { loans: [], reservations: [], fines: [] });
    } catch (err) {
      setLibraryData(null);
      if (err instanceof ApiError && err.isPermissionDenied()) setDenied(true);
      else setError(err instanceof Error ? err.message : 'Could not load library records.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeChild?.id, activeSchoolId]);

  const finesTotal = useMemo(
    () => (Array.isArray(libraryData?.fines) ? libraryData.fines.reduce((sum: number, fine: any) => sum + Number(fine.balance ?? fine.amount ?? 0), 0) : 0),
    [libraryData],
  );

  if (childLoading || (loading && !!activeChild)) {
    return (
      <div className="flex items-center justify-center gap-2 py-20 text-xs font-semibold text-warm-500">
        <RefreshCw size={16} className="animate-spin" /> Loading library records…
      </div>
    );
  }

  if (!activeChild) {
    return (
      <EmptyState
        title="No child linked yet"
        description="Your school has not linked a student record to this guardian account. Contact the school office to complete the link."
        icon={<Inbox className="h-8 w-8" />}
        actionButton={<Link href="/parent/children"><Button variant="outline" size="sm">Family Overview</Button></Link>}
      />
    );
  }

  if (denied) {
    return (
      <EmptyState
        title="Library records are not available"
        description="Your account does not have permission to view this child's library records."
        icon={<Lock className="h-8 w-8" />}
      />
    );
  }

  const loans: any[] = Array.isArray(libraryData?.loans) ? libraryData.loans : [];
  const fines: any[] = Array.isArray(libraryData?.fines) ? libraryData.fines : [];
  const reservations: any[] = Array.isArray(libraryData?.reservations) ? libraryData.reservations : [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-charcoal-900 sm:text-2xl">Library Tracker</h1>
          <p className="mt-0.5 text-xs font-medium text-warm-500 sm:text-sm">
            Loans, holds, and fines for {activeChild.firstName} {activeChild.lastName}.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={load} isLoading={loading} leftIcon={<RefreshCw size={15} />}>
          Refresh
        </Button>
      </div>

      {error && (
        <div role="alert" className="flex items-start gap-3 rounded-xl border border-danger-200 bg-danger-50 px-4 py-3 text-sm font-medium text-danger-800">
          <AlertCircle size={18} className="mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="overflow-hidden rounded-2xl border border-warm-200 bg-card shadow-xs lg:col-span-2">
          <div className="flex items-center gap-2 border-b border-warm-100 p-5 sm:p-6">
            <BookOpen size={20} className="text-forest-700" />
            <h2 className="font-bold text-charcoal-900">Book Loans</h2>
          </div>
          <div className="p-5 sm:p-6">
            {loans.length === 0 ? (
              <p className="py-6 text-center text-sm text-warm-500">No current book loans.</p>
            ) : (
              <div className="space-y-4">
                {loans.map((loan: any) => (
                  <div key={loan.id} className="flex flex-col gap-3 rounded-xl border border-warm-200 bg-ivory-50 p-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <h4 className="text-sm font-bold text-charcoal-900">{loan.bookCopy?.book?.title || 'Untitled book'}</h4>
                      <p className="text-xs font-medium text-warm-400">Accession No: {loan.bookCopy?.accessionNumber || '—'}</p>
                      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] font-semibold uppercase text-warm-500">
                        <p>Borrowed: {loan.loanDate ? new Date(loan.loanDate).toLocaleDateString() : '—'}</p>
                        <p className={loan.status === 'OVERDUE' ? 'font-bold text-danger-600' : ''}>
                          Due: {loan.dueDate ? new Date(loan.dueDate).toLocaleDateString() : '—'}
                        </p>
                        {loan.returnDate && <p>Returned: {new Date(loan.returnDate).toLocaleDateString()}</p>}
                      </div>
                    </div>
                    <span className={`w-fit rounded-md border px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider ${
                      loan.status === 'ACTIVE' || loan.status === 'BORROWED'
                        ? 'border-success-100 bg-success-50 text-success-700'
                        : loan.status === 'OVERDUE'
                          ? 'border-danger-100 bg-danger-50 text-danger-700'
                          : 'border-warm-200 bg-card text-warm-500'
                    }`}>
                      {loan.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <section className="overflow-hidden rounded-2xl border border-warm-200 bg-card shadow-xs">
            <div className="flex items-center justify-between gap-2 border-b border-warm-100 p-5">
              <div className="flex items-center gap-2">
                <AlertCircle size={20} className="text-warning-600" />
                <h2 className="font-bold text-charcoal-900">Fines</h2>
              </div>
              <span className="text-sm font-semibold text-danger-600">{money(finesTotal)}</span>
            </div>
            <div className="p-5">
              {fines.length === 0 ? (
                <p className="py-4 text-center text-xs font-medium text-warm-500">No library fines accumulated.</p>
              ) : (
                <div className="space-y-3">
                  {fines.map((fine: any) => (
                    <div key={fine.id} className="flex items-center justify-between gap-3 text-sm">
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-charcoal-800">{fine.reason || 'Library fine'}</p>
                        <p className="text-[11px] font-bold uppercase text-warm-400">{fine.status}</p>
                      </div>
                      <span className="shrink-0 font-bold text-danger-600">{money(fine.balance ?? fine.amount)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>

          <section className="overflow-hidden rounded-2xl border border-warm-200 bg-card shadow-xs">
            <div className="flex items-center gap-2 border-b border-warm-100 p-5">
              <Bookmark size={20} className="text-terracotta-600" />
              <h2 className="font-bold text-charcoal-900">Reservations</h2>
            </div>
            <div className="p-5">
              {reservations.length === 0 ? (
                <p className="py-4 text-center text-xs font-medium text-warm-500">No pending holds or reservations.</p>
              ) : (
                <div className="space-y-2">
                  {reservations.map((reservation: any) => (
                    <div key={reservation.id} className="rounded-xl border border-warm-200 bg-ivory-50 p-2.5 text-xs">
                      <p className="font-bold text-charcoal-900">{reservation.book?.title || 'Untitled book'}</p>
                      <p className="mt-1 text-[11px] font-semibold uppercase text-warm-400">Status: {reservation.status}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
