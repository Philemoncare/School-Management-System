'use client';

import React, { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api/client';
import {
  AlertCircle,
  BarChart4,
  Download,
  FileText,
  Loader2,
  TrendingUp,
  Wallet,
} from 'lucide-react';

type Report = {
  metrics: {
    totalBilled: string | number;
    totalCollected: string | number;
    outstanding: string | number;
    overdueCount: number;
    collectionRate: string;
    unpaidInvoices: number;
    partiallyPaidInvoices: number;
    studentsWithBalance: number;
  };
  revenueByCategory: Array<{ category: { name: string; code: string } | null; amount: string | number }>;
  collectionsByMethod: Array<{ method: string; amount: string | number; count: number }>;
  recentPayments: Array<{
    id: string;
    amount: string | number;
    paymentDate: string;
    method?: string;
    paymentMethod?: string;
    student: { firstName: string; lastName: string; studentNumber: string } | null;
  }>;
};

const money = (value: string | number) => Number(value || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function AccountantReportsPage() {
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    apiFetch('/finance/reports/summary')
      .then(setReport)
      .catch((err) => setError(err.message || 'Unable to load financial reports.'))
      .finally(() => setLoading(false));
  }, []);

  function exportCsv() {
    if (!report) return;
    const rows = [
      ['Metric', 'Value'],
      ['Total Billed', money(report.metrics.totalBilled)],
      ['Total Collected', money(report.metrics.totalCollected)],
      ['Outstanding', money(report.metrics.outstanding)],
      ['Collection Rate (%)', report.metrics.collectionRate],
      ['Overdue Invoices', String(report.metrics.overdueCount)],
      ['Unpaid Invoices', String(report.metrics.unpaidInvoices)],
      ['Students With Balance', String(report.metrics.studentsWithBalance)],
      [],
      ['Revenue Category', 'Amount'],
      ...report.revenueByCategory.map((item) => [item.category?.name || 'Uncategorized', money(item.amount)]),
    ];
    const csv = rows.map((row) => row.map((cell) => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(',')).join('\r\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `financial-report-${new Date().toISOString().slice(0, 10)}.csv`;
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

  if (!report) return null;

  return (
    <div className="p-8 space-y-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-semibold text-charcoal-900 tracking-tight flex items-center gap-3">
            <BarChart4 className="text-forest-700" /> Financial Reports
          </h1>
          <p className="text-warm-500 font-bold mt-1 uppercase tracking-wide text-[11px]">Live revenue, collection and outstanding balance analysis</p>
        </div>
        <button onClick={exportCsv} className="bg-forest-700 text-white px-6 py-3 rounded-xl font-semibold text-xs uppercase tracking-wide hover:bg-forest-800 transition-all flex items-center gap-2">
          <Download size={16} /> Export Summary CSV
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        <MetricCard label="Total Billed" value={money(report.metrics.totalBilled)} icon={<FileText size={20} />} />
        <MetricCard label="Total Collected" value={money(report.metrics.totalCollected)} icon={<Wallet size={20} />} />
        <MetricCard label="Outstanding" value={money(report.metrics.outstanding)} icon={<AlertCircle size={20} />} />
        <MetricCard label="Collection Rate" value={`${report.metrics.collectionRate}%`} icon={<TrendingUp size={20} />} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <section className="bg-card border border-warm-200 rounded-xl p-8 shadow-sm">
            <h3 className="text-xl font-semibold text-charcoal-900 tracking-tight mb-6">Revenue by Fee Category</h3>
            {report.revenueByCategory.length === 0 ? (
              <EmptyState text="No billed fee categories yet." />
            ) : (
              <div className="space-y-4">
                {report.revenueByCategory.map((item, index) => {
                  const total = report.revenueByCategory.reduce((sum, entry) => sum + Number(entry.amount || 0), 0);
                  const percentage = total > 0 ? (Number(item.amount) / total) * 100 : 0;
                  return (
                    <div key={`${item.category?.code || 'uncategorized'}-${index}`} className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-semibold text-charcoal-900">{item.category?.name || 'Uncategorized'}</span>
                        <span className="font-semibold text-forest-700">{money(item.amount)}</span>
                      </div>
                      <div className="h-2 rounded-full bg-warm-100 overflow-hidden">
                        <div className="h-full bg-forest-700" style={{ width: `${percentage}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          <section className="bg-card border border-warm-200 rounded-xl p-8 shadow-sm">
            <h3 className="text-xl font-semibold text-charcoal-900 tracking-tight mb-6">Recent Successful Payments</h3>
            {report.recentPayments.length === 0 ? (
              <EmptyState text="No successful payments recorded yet." />
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-warm-100">
                  <thead>
                    <tr>
                      <th className="py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-warm-400">Student</th>
                      <th className="py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-warm-400">Method</th>
                      <th className="py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-warm-400">Date</th>
                      <th className="py-3 text-right text-[11px] font-semibold uppercase tracking-wide text-warm-400">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-warm-100">
                    {report.recentPayments.map((payment) => (
                      <tr key={payment.id}>
                        <td className="py-4 text-sm font-semibold text-charcoal-900">
                          {payment.student ? `${payment.student.firstName} ${payment.student.lastName}` : 'Unknown student'}
                          <p className="text-[11px] font-medium text-warm-400">{payment.student?.studentNumber}</p>
                        </td>
                        <td className="py-4 text-xs font-semibold uppercase text-warm-600">{payment.paymentMethod || payment.method || 'N/A'}</td>
                        <td className="py-4 text-xs font-medium text-warm-500">{new Date(payment.paymentDate).toLocaleDateString()}</td>
                        <td className="py-4 text-right text-sm font-semibold text-forest-700">{money(payment.amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>

        <div className="space-y-8">
          <section className="bg-card border border-warm-200 rounded-xl p-8 shadow-sm">
            <h3 className="text-lg font-semibold text-charcoal-900 tracking-tight mb-6">Collections by Method</h3>
            {report.collectionsByMethod.length === 0 ? (
              <EmptyState text="No payment methods recorded yet." />
            ) : (
              <div className="space-y-4">
                {report.collectionsByMethod.map((item) => (
                  <div key={item.method} className="flex items-center justify-between gap-4 rounded-xl bg-ivory-50 p-4">
                    <div>
                      <p className="text-sm font-semibold text-charcoal-900">{item.method}</p>
                      <p className="text-[11px] font-medium text-warm-400">{item.count} payments</p>
                    </div>
                    <p className="text-sm font-semibold text-forest-700">{money(item.amount)}</p>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="bg-charcoal-900 rounded-xl p-8 shadow-xs text-white">
            <h3 className="text-lg font-semibold mb-6 tracking-tight">Account Exposure</h3>
            <div className="space-y-4 text-sm">
              <SummaryRow label="Overdue invoices" value={report.metrics.overdueCount} />
              <SummaryRow label="Unpaid invoices" value={report.metrics.unpaidInvoices} />
              <SummaryRow label="Partially paid" value={report.metrics.partiallyPaidInvoices} />
              <SummaryRow label="Students with balance" value={report.metrics.studentsWithBalance} />
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <div className="bg-card border border-warm-200 rounded-xl p-6 shadow-sm">
      <div className="w-10 h-10 rounded-xl bg-sage-50 text-forest-700 flex items-center justify-center mb-4">{icon}</div>
      <p className="text-[11px] font-semibold uppercase tracking-wide text-warm-400">{label}</p>
      <p className="text-2xl font-semibold text-charcoal-900 mt-1">{value}</p>
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between border-b border-white/10 pb-3 last:border-0 last:pb-0">
      <span className="text-sage-100">{label}</span>
      <span className="font-semibold">{value}</span>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return <p className="rounded-xl border border-dashed border-warm-200 bg-ivory-50 p-8 text-center text-sm font-medium text-warm-400">{text}</p>;
}
