'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { apiFetch } from '@/lib/api/client';
import {
  AlertCircle,
  BarChart4,
  Book,
  BookOpen,
  Download,
  Loader2,
  Users,
} from 'lucide-react';

type Metrics = {
  totalBooks: number;
  totalCopies: number;
  availableCopies: number;
  borrowedCopies: number;
  overdueLoans: number;
  activeMembers: number;
};

type Loan = {
  id: string;
  loanDate: string;
  dueDate: string;
  status: string;
  bookCopy: { accessionNumber: string; book: { title: string } };
  membership: { user: { firstName: string; lastName: string } };
};

export default function LibraryReportsPage() {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([apiFetch('/library/dashboard'), apiFetch('/library/loans?status=ACTIVE')])
      .then(([dashboard, activeLoans]) => {
        setMetrics(dashboard.metrics);
        setLoans(activeLoans);
      })
      .catch((err) => setError(err.message || 'Unable to load library analytics.'))
      .finally(() => setLoading(false));
  }, []);

  const overdue = useMemo(
    () => loans.filter((loan) => new Date(loan.dueDate) < new Date()),
    [loans],
  );

  function exportCsv() {
    if (!metrics) return;
    const rows = [
      ['Metric', 'Value'],
      ['Total Titles', metrics.totalBooks],
      ['Total Copies', metrics.totalCopies],
      ['Available Copies', metrics.availableCopies],
      ['Borrowed Copies', metrics.borrowedCopies],
      ['Overdue Loans', metrics.overdueLoans],
      ['Active Members', metrics.activeMembers],
      [],
      ['Book', 'Accession', 'Member', 'Loan Date', 'Due Date', 'Status'],
      ...loans.map((loan) => [
        loan.bookCopy.book.title,
        loan.bookCopy.accessionNumber,
        `${loan.membership.user.firstName} ${loan.membership.user.lastName}`,
        new Date(loan.loanDate).toLocaleDateString(),
        new Date(loan.dueDate).toLocaleDateString(),
        loan.status,
      ]),
    ];
    const csv = rows.map((row) => row.map((cell) => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(',')).join('\r\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `library-report-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  if (loading) return <div className="p-20 text-center"><Loader2 className="animate-spin mx-auto text-forest-700" size={40} /></div>;

  if (error) {
    return (
      <div className="p-8">
        <div className="flex items-start gap-3 rounded-xl border border-danger-200 bg-danger-50 p-5 text-danger-700">
          <AlertCircle size={20} className="shrink-0 mt-0.5" />
          <p className="text-sm font-semibold">{error}</p>
        </div>
      </div>
    );
  }

  if (!metrics) return null;

  const availability = metrics.totalCopies > 0 ? Math.round((metrics.availableCopies / metrics.totalCopies) * 100) : 0;

  return (
    <div className="p-8 space-y-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-semibold text-charcoal-900 tracking-tight flex items-center gap-3"><BarChart4 className="text-forest-700" /> Library Analytics</h1>
          <p className="text-warm-500 font-bold mt-1 uppercase tracking-wide text-[11px]">Collection usage, circulation and member activity</p>
        </div>
        <button onClick={exportCsv} className="bg-card border border-warm-200 text-warm-700 px-6 py-2.5 rounded-xl font-semibold text-[11px] uppercase tracking-wide hover:bg-ivory-50 transition-all shadow-sm flex items-center gap-2">
          <Download size={16} /> Export CSV
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
        <MetricCard label="Book Titles" value={metrics.totalBooks} icon={<Book size={20} />} />
        <MetricCard label="Total Copies" value={metrics.totalCopies} icon={<BookOpen size={20} />} />
        <MetricCard label="Active Members" value={metrics.activeMembers} icon={<Users size={20} />} />
        <MetricCard label="Overdue Loans" value={metrics.overdueLoans} icon={<AlertCircle size={20} />} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <section className="lg:col-span-2 bg-card border border-warm-200 rounded-xl p-8 shadow-sm">
          <h3 className="text-xl font-semibold text-charcoal-900 tracking-tight mb-6">Active Loans</h3>
          {loans.length === 0 ? (
            <p className="rounded-xl border border-dashed border-warm-200 bg-ivory-50 p-10 text-center text-sm font-medium text-warm-400">No active loans recorded.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-warm-100">
                <thead>
                  <tr>
                    <th className="py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-warm-400">Book</th>
                    <th className="py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-warm-400">Member</th>
                    <th className="py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-warm-400">Due Date</th>
                    <th className="py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-warm-400">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-warm-100">
                  {loans.slice(0, 10).map((loan) => {
                    const isOverdue = new Date(loan.dueDate) < new Date();
                    return (
                      <tr key={loan.id}>
                        <td className="py-4 text-sm font-semibold text-charcoal-900">
                          {loan.bookCopy.book.title}
                          <p className="text-[11px] font-medium text-warm-400">{loan.bookCopy.accessionNumber}</p>
                        </td>
                        <td className="py-4 text-sm font-medium text-warm-600">{loan.membership.user.firstName} {loan.membership.user.lastName}</td>
                        <td className={`py-4 text-sm font-medium ${isOverdue ? 'text-danger-600' : 'text-warm-600'}`}>{new Date(loan.dueDate).toLocaleDateString()}</td>
                        <td className="py-4">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase ${isOverdue ? 'bg-danger-50 text-danger-700' : 'bg-sage-50 text-forest-700'}`}>
                            {isOverdue ? 'OVERDUE' : 'ACTIVE'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <div className="space-y-8">
          <section className="bg-card border border-warm-200 rounded-xl p-8 shadow-sm">
            <h3 className="text-lg font-semibold text-charcoal-900 tracking-tight mb-6">Copy Availability</h3>
            <div className="flex items-end justify-between mb-2">
              <span className="text-3xl font-semibold text-forest-700">{availability}%</span>
              <span className="text-xs font-medium text-warm-400">{metrics.availableCopies} of {metrics.totalCopies} available</span>
            </div>
            <div className="h-2.5 rounded-full bg-warm-100 overflow-hidden">
              <div className="h-full bg-forest-700" style={{ width: `${availability}%` }} />
            </div>
            <div className="mt-6 space-y-3 text-sm">
              <div className="flex justify-between"><span className="text-warm-500">Borrowed copies</span><span className="font-semibold text-charcoal-900">{metrics.borrowedCopies}</span></div>
              <div className="flex justify-between"><span className="text-warm-500">Overdue loans</span><span className="font-semibold text-danger-600">{overdue.length}</span></div>
            </div>
          </section>

          <section className="bg-charcoal-900 rounded-xl p-8 shadow-xs text-white">
            <h3 className="text-lg font-semibold mb-4 tracking-tight">Circulation Health</h3>
            <p className="text-sage-100 text-sm leading-relaxed">
              {metrics.overdueLoans > 0
                ? `${metrics.overdueLoans} active loan${metrics.overdueLoans === 1 ? ' is' : 's are'} past their due date and need follow-up.`
                : 'No active loans are overdue.'}
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ label, value, icon }: { label: string; value: number; icon: React.ReactNode }) {
  return (
    <div className="bg-card border border-warm-200 rounded-xl p-6 shadow-sm">
      <div className="w-10 h-10 rounded-xl bg-sage-50 text-forest-700 flex items-center justify-center mb-4">{icon}</div>
      <p className="text-[11px] font-semibold uppercase tracking-wide text-warm-400">{label}</p>
      <p className="text-2xl font-semibold text-charcoal-900 mt-1">{value}</p>
    </div>
  );
}
