'use client';

import React, { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api/client';
import { useAuth } from '@/context/auth-context';
import {
  Book,
  BookOpen,
  Clock,
  Bookmark,
  Loader2,
  AlertCircle
} from 'lucide-react';

export default function StudentLibraryDashboard() {
  const { activeSchoolId } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!activeSchoolId) return;
    apiFetch('/student/library')
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [activeSchoolId]);

  if (loading) return <div className="p-20 text-center"><Loader2 className="animate-spin mx-auto text-forest-700" size={48} /></div>;

  const loans = data?.loans || [];
  const reservations = data?.reservations || [];
  const fines = data?.fines || [];

  return (
    <div className="space-y-6">
      <div className="bg-card p-6 rounded-2xl border border-warm-100 shadow-sm">
        <h1 className="text-2xl font-bold text-charcoal-900 flex items-center gap-2">
          <Book className="text-forest-700" />
          My Library Desk
        </h1>
        <p className="text-warm-500 text-sm">Track your borrowed library books, active reservations, and overdue fines.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Active Loans */}
          <div className="bg-card rounded-2xl p-6 border border-warm-100 shadow-sm">
            <h3 className="text-lg font-bold text-charcoal-900 mb-4 flex items-center gap-2">
              <BookOpen size={18} className="text-forest-700" />
              Active Loans ({loans.length})
            </h3>
            <div className="space-y-3">
              {loans.map((loan: any) => (
                <div key={loan.id} className="p-4 bg-ivory-50 rounded-xl border border-warm-100 flex justify-between items-center">
                  <div>
                    <h4 className="font-bold text-charcoal-900 text-sm">{loan.bookCopy?.book?.title}</h4>
                    <p className="text-xs text-warm-500 font-medium">Accession Number: {loan.bookCopy?.accessionNumber}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-terracotta-600 font-bold flex items-center gap-1">
                      <Clock size={12} /> Due: {new Date(loan.dueDate).toLocaleDateString()}
                    </p>
                    <p className="text-[11px] text-warm-400 font-bold uppercase tracking-wider mt-0.5">Status: {loan.status}</p>
                  </div>
                </div>
              ))}
              {loans.length === 0 && (
                <p className="text-xs text-warm-400 font-medium italic text-center py-6">No active library books checked out.</p>
              )}
            </div>
          </div>

          {/* Reservations */}
          <div className="bg-card rounded-2xl p-6 border border-warm-100 shadow-sm">
            <h3 className="text-lg font-bold text-charcoal-900 mb-4 flex items-center gap-2">
              <Bookmark size={18} className="text-terracotta-600" />
              My Book Reservations ({reservations.length})
            </h3>
            <div className="space-y-3">
              {reservations.map((res: any) => (
                <div key={res.id} className="p-4 bg-ivory-50 rounded-xl border border-warm-100 flex justify-between items-center">
                  <div>
                    <h4 className="font-bold text-charcoal-900 text-sm">{res.book?.title}</h4>
                    <p className="text-xs text-warm-500 font-medium">Requested Date: {new Date(res.requestDate).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <span className="px-2 py-0.5 bg-sage-50 text-forest-800 text-xs font-bold rounded-md uppercase">{res.status}</span>
                  </div>
                </div>
              ))}
              {reservations.length === 0 && (
                <p className="text-xs text-warm-400 font-medium italic text-center py-6">No pending reservations.</p>
              )}
            </div>
          </div>
        </div>

        {/* Fines Sidebar */}
        <div className="bg-card rounded-2xl p-6 border border-warm-100 shadow-sm space-y-4">
          <h3 className="text-lg font-bold text-charcoal-900 flex items-center gap-2">
            <AlertCircle size={18} className="text-warning-600" />
            Library Fines
          </h3>
          <div className="space-y-3">
            {fines.map((fine: any) => (
              <div key={fine.id} className="p-3 bg-danger-50/40 rounded-xl border border-danger-100/50 flex justify-between items-center">
                <div>
                  <p className="text-xs font-bold text-charcoal-900">{fine.reason}</p>
                  <p className="text-[11px] text-warm-400 font-semibold uppercase">{fine.status}</p>
                </div>
                <p className="text-sm font-semibold text-danger-600">GH₵ {Number(fine.amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
              </div>
            ))}
            {fines.length === 0 && (
              <p className="text-xs text-success-600 font-bold bg-success-50 p-4 rounded-xl text-center">
                Clean record! No library fines outstanding.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
