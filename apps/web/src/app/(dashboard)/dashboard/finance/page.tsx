'use client';

import React, { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api/client';
import {
  AlertCircle,
  BadgeDollarSign,
  ChevronRight,
  CreditCard,
  FileText,
  Loader2,
  Settings,
  TrendingUp,
} from 'lucide-react';
import Link from 'next/link';

type Metrics = {
  totalBilled: string | number;
  totalCollected: string | number;
  outstanding: string | number;
  collectionRate: string;
  overdueCount: number;
};

type Payment = {
  id: string;
  paymentReference: string;
  amount: string | number;
  currency: string;
  paymentMethod: string;
  status: string;
  paymentDate: string;
  student: { firstName: string; lastName: string; studentNumber: string };
};

export default function FinanceDashboard() {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([apiFetch('/finance/dashboard'), apiFetch('/finance/payments')])
      .then(([dashboard, paymentData]) => {
        setMetrics(dashboard.metrics);
        setPayments(paymentData.slice(0, 6));
      })
      .catch((err) => setError(err.message || 'Unable to load finance data.'))
      .finally(() => setLoading(false));
  }, []);

  const stats = metrics ? [
    { name: 'Total Invoiced', value: `${Number(metrics.totalBilled).toLocaleString()}`, icon: FileText, color: 'text-forest-700', bg: 'bg-sage-50' },
    { name: 'Total Collected', value: `${Number(metrics.totalCollected).toLocaleString()}`, icon: BadgeDollarSign, color: 'text-success-600', bg: 'bg-success-50' },
    { name: 'Outstanding Balance', value: `${Number(metrics.outstanding).toLocaleString()}`, icon: AlertCircle, color: 'text-danger-600', bg: 'bg-danger-50' },
  ] : [];

  const modules = [
    { name: 'Invoices', description: 'Generate and manage student bills', href: '/accountant/invoices', icon: FileText, color: 'bg-forest-500' },
    { name: 'Payments', description: 'Record and track fee collections', href: '/accountant/payments', icon: CreditCard, color: 'bg-success-500' },
    { name: 'Fee Structures', description: 'Configure school fee items', href: '/accountant/fees', icon: Settings, color: 'bg-terracotta-500' },
    { name: 'Financial Reports', description: 'Statements and collection summaries', href: '/accountant/reports', icon: TrendingUp, color: 'bg-terracotta-500' },
  ];

  if (loading) return <div className="p-20 text-center"><Loader2 className="animate-spin mx-auto text-forest-700" size={40} /></div>;

  return (
    <div className="p-8 space-y-10">
      <div>
        <h1 className="text-3xl font-semibold text-charcoal-900 tracking-tight">Financial Command Center</h1>
        <p className="text-warm-500 mt-1">Institutional revenue tracking and fee management.</p>
      </div>

      {error && (
        <div className="flex items-start gap-3 rounded-xl border border-danger-200 bg-danger-50 p-4 text-danger-700">
          <AlertCircle size={18} className="shrink-0 mt-0.5" />
          <p className="text-sm font-semibold">{error}</p>
        </div>
      )}

      {metrics && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {stats.map((stat) => (
              <div key={stat.name} className="bg-card p-8 rounded-xl border border-warm-200 shadow-sm flex flex-col gap-6">
                <div className={`p-4 rounded-xl w-fit ${stat.bg}`}><stat.icon className={stat.color} size={24} /></div>
                <div>
                  <p className="text-xs font-semibold text-warm-400 uppercase tracking-wide mb-1">{stat.name}</p>
                  <p className="text-3xl font-semibold text-charcoal-900">{stat.value}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <div className="rounded-xl border border-warm-200 bg-card p-5"><p className="text-[11px] font-semibold uppercase text-warm-400">Collection Rate</p><p className="text-xl font-semibold text-forest-700 mt-1">{metrics.collectionRate}%</p></div>
            <div className="rounded-xl border border-warm-200 bg-card p-5"><p className="text-[11px] font-semibold uppercase text-warm-400">Overdue Invoices</p><p className="text-xl font-semibold text-danger-600 mt-1">{metrics.overdueCount}</p></div>
            <div className="rounded-xl border border-warm-200 bg-card p-5"><p className="text-[11px] font-semibold uppercase text-warm-400">Payments Recorded</p><p className="text-xl font-semibold text-charcoal-900 mt-1">{payments.length}</p></div>
          </div>
        </>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {modules.map((module) => (
          <Link key={module.name} href={module.href} className="group block bg-card border border-warm-200 rounded-xl p-8 hover:border-sage-200 transition-all">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-6">
                <div className={`${module.color} p-5 rounded-xl text-white`}><module.icon size={28} /></div>
                <div>
                  <h3 className="text-xl font-semibold text-charcoal-900 group-hover:text-forest-700 transition-colors">{module.name}</h3>
                  <p className="text-warm-500 mt-1 font-medium">{module.description}</p>
                </div>
              </div>
              <div className="w-12 h-12 rounded-full bg-ivory-50 flex items-center justify-center text-warm-400 group-hover:bg-sage-50 group-hover:text-forest-700 transition-all"><ChevronRight size={24} /></div>
            </div>
          </Link>
        ))}
      </div>

      <div className="bg-card border border-warm-200 rounded-xl overflow-hidden shadow-sm">
        <div className="p-8 border-b border-warm-100 flex justify-between items-center bg-ivory-50/50">
          <h3 className="text-lg font-semibold text-charcoal-900">Recent Transactions</h3>
          <Link href="/accountant/payments" className="text-xs font-semibold text-forest-700 uppercase tracking-wide hover:underline">View All</Link>
        </div>
        {payments.length === 0 ? (
          <div className="p-12 text-center text-warm-400 font-medium text-sm">No payments recorded yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-warm-100">
              <tbody className="divide-y divide-warm-100">
                {payments.map((payment) => (
                  <tr key={payment.id} className="hover:bg-ivory-50 transition-colors">
                    <td className="px-8 py-4">
                      <p className="text-sm font-semibold text-charcoal-900">{payment.student.firstName} {payment.student.lastName}</p>
                      <p className="text-[11px] font-medium text-warm-400">{payment.paymentReference}</p>
                    </td>
                    <td className="px-8 py-4 text-sm font-medium text-warm-600">{payment.paymentMethod.replace(/_/g, ' ')}</td>
                    <td className="px-8 py-4 text-sm font-medium text-warm-500">{new Date(payment.paymentDate).toLocaleDateString()}</td>
                    <td className="px-8 py-4 text-right text-sm font-semibold text-forest-700">{payment.currency} {Number(payment.amount).toFixed(2)}</td>
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
