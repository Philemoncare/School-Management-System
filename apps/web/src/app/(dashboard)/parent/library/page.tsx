'use client';

import React, { useEffect, useState } from 'react';
import { useChild } from '@/context/child-context';
import { useAuth } from '@/context/auth-context';
import { BookOpen, AlertCircle, Bookmark, History } from 'lucide-react';

export default function ParentLibrary() {
  const { activeChild, loading: childLoading } = useChild();
  const { activeSchoolId } = useAuth();
  const [libraryData, setLibraryData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchLibrary() {
      if (!activeChild || !activeSchoolId) return;
      setLoading(true);
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/parent/children/${activeChild.id}/library`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'x-school-id': activeSchoolId,
          },
        });
        const data = await response.json();
        setLibraryData(data);
      } catch (error) {
        console.error('Failed to fetch library info:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchLibrary();
  }, [activeChild, activeSchoolId]);

  if (childLoading || loading) return <div>Loading active book loans and renewals...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-charcoal-900">Library Book Tracker</h1>
        <p className="text-warm-500">View active book loans, return statuses, and outstanding fines for {activeChild?.firstName}.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active Loans */}
        <div className="lg:col-span-2 bg-card rounded-2xl border border-warm-100 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-warm-100 flex items-center gap-2">
            <BookOpen size={20} className="text-forest-700" />
            <h2 className="font-bold text-charcoal-900">Active Book Loans</h2>
          </div>
          <div className="p-6">
            {libraryData?.loans?.length > 0 ? (
              <div className="space-y-4">
                {libraryData.loans.map((loan: any) => (
                  <div key={loan.id} className="p-4 bg-ivory-50 rounded-xl border border-warm-100 flex justify-between items-start">
                    <div>
                      <h4 className="font-bold text-charcoal-900 text-sm">{loan.bookCopy?.book?.title}</h4>
                      <p className="text-xs text-warm-400 font-medium">Accession No: {loan.bookCopy?.accessionNumber}</p>
                      <div className="mt-3 flex items-center gap-4 text-xs font-semibold uppercase text-warm-500">
                        <p>Borrowed: {new Date(loan.loanDate).toLocaleDateString()}</p>
                        <p className={loan.status === 'OVERDUE' ? 'text-danger-600 font-bold' : ''}>
                          Due: {new Date(loan.dueDate).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <span className={`px-2 py-0.5 rounded-md text-[11px] font-bold border uppercase tracking-wider ${
                      loan.status === 'ACTIVE' ? 'bg-success-50 text-success-700 border-success-100' : 'bg-danger-50 text-danger-700 border-danger-100'
                    }`}>
                      {loan.status}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-warm-500 text-center py-6">No current active book loans.</p>
            )}
          </div>
        </div>

        {/* Fines and Holds */}
        <div className="space-y-6">
          <section className="bg-card rounded-2xl border border-warm-100 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-warm-100 flex items-center gap-2">
              <AlertCircle size={20} className="text-warning-600" />
              <h2 className="font-bold text-charcoal-900">Library Fines</h2>
            </div>
            <div className="p-6">
              {libraryData?.fines?.length > 0 ? (
                <div className="space-y-3">
                  {libraryData.fines.map((fine: any) => (
                    <div key={fine.id} className="flex justify-between items-center text-sm">
                      <div>
                        <p className="font-semibold text-charcoal-800">{fine.reason}</p>
                        <p className="text-[11px] text-warm-400 font-bold uppercase">{fine.status}</p>
                      </div>
                      <span className="font-bold text-danger-600">${Number(fine.amount).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs font-medium text-warm-500 text-center py-4">No library fines accumulated.</p>
              )}
            </div>
          </section>

          <section className="bg-card rounded-2xl border border-warm-100 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-warm-100 flex items-center gap-2">
              <Bookmark size={20} className="text-terracotta-600" />
              <h2 className="font-bold text-charcoal-900">Active Book Reservations</h2>
            </div>
            <div className="p-6">
              {libraryData?.reservations?.length > 0 ? (
                <div className="space-y-2">
                  {libraryData.reservations.map((res: any) => (
                    <div key={res.id} className="p-2.5 bg-ivory-50 rounded-xl border border-warm-100 text-xs">
                      <p className="font-bold text-charcoal-900">{res.book?.title}</p>
                      <p className="text-[11px] text-warm-400 mt-1 uppercase font-semibold">Status: {res.status}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs font-medium text-warm-500 text-center py-4">No pending holds or reservations.</p>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
