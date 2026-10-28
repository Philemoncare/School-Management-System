'use client';

import React, { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api/client';
import {
  CreditCard,
  Search,
  CheckCircle,
  Clock,
  AlertCircle,
  Loader2,
  XCircle,
  ArrowDownLeft,
  Eye
} from 'lucide-react';
import Link from 'next/link';

const STATUS_OPTIONS = [
  { value: '', label: 'All statuses' },
  { value: 'SUCCESS', label: 'Success' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'FAILED', label: 'Failed' },
  { value: 'REVERSED', label: 'Reversed' },
];

export default function AccountantPaymentsPage() {
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    loadPayments();
  }, [search, status]);

  async function loadPayments() {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.set('search', search.trim());
      if (status) params.set('status', status);
      const data = await apiFetch(`/finance/payments?${params.toString()}`);
      setPayments(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setPayments([]);
      setError(err?.message || 'Could not load payments.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-8 space-y-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-semibold text-charcoal-900 tracking-tight flex items-center gap-3">
             <CreditCard className="text-forest-700" /> Collection Registry
          </h1>
          <p className="text-warm-500 font-bold mt-1 uppercase tracking-wide text-[11px]">Track and reconcile all student fee payments</p>
        </div>
        <Link href="/accountant/payments/record" className="bg-success-600 text-white px-8 py-3 rounded-2xl font-semibold text-[11px] uppercase tracking-wide hover:bg-success-700 shadow-xs shadow-success-100 transition-all flex items-center gap-2">
          <ArrowDownLeft size={16} /> Record Cash/Bank
        </Link>
      </div>

      <div className="bg-card border border-warm-200 rounded-xl shadow-sm overflow-hidden">
        <div className="p-6 border-b border-warm-100 flex items-center gap-4 bg-ivory-50/50">
           <div className="flex-1 bg-card border border-warm-200 px-5 py-3 rounded-2xl flex items-center shadow-sm">
              <Search size={18} className="text-warm-400 mr-3" />
              <input
                type="text"
                placeholder="Search by reference # or student name..."
                className="bg-transparent border-none w-full focus:ring-0 text-sm font-bold"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
           </div>
           <select
             aria-label="Filter payments by status"
             value={status}
             onChange={(e) => setStatus(e.target.value)}
             className="p-3 bg-card border border-warm-200 rounded-2xl text-[11px] font-semibold uppercase tracking-wide text-warm-600 shadow-sm focus:border-forest-600 focus:outline-none"
           >
             {STATUS_OPTIONS.map((option) => (
               <option key={option.value} value={option.value}>{option.label}</option>
             ))}
           </select>
        </div>

        {error && (
          <div role="alert" className="border-b border-danger-200 bg-danger-50 px-6 py-3 text-xs font-semibold text-danger-700">
            {error}
          </div>
        )}

        <div className="relative min-h-[400px]">
           {loading && (
             <div className="absolute inset-0 bg-card/60 z-10 flex items-center justify-center">
                <Loader2 className="animate-spin text-forest-700" size={32} />
             </div>
           )}

           <table className="min-w-full divide-y divide-warm-200">
             <thead className="bg-ivory-50/50">
               <tr>
                 <th className="px-8 py-5 text-left text-[11px] font-semibold text-warm-400 uppercase tracking-wide">Transaction Ref</th>
                 <th className="px-8 py-5 text-left text-[11px] font-semibold text-warm-400 uppercase tracking-wide">Student Information</th>
                 <th className="px-8 py-5 text-left text-[11px] font-semibold text-warm-400 uppercase tracking-wide">Amount</th>
                 <th className="px-8 py-5 text-left text-[11px] font-semibold text-warm-400 uppercase tracking-wide">Method</th>
                 <th className="px-8 py-5 text-left text-[11px] font-semibold text-warm-400 uppercase tracking-wide">Status</th>
                 <th className="px-8 py-5 text-right text-[11px] font-semibold text-warm-400 uppercase tracking-wide">Actions</th>
               </tr>
             </thead>
             <tbody className="divide-y divide-warm-100 bg-card">
               {payments.map((pay) => (
                 <tr key={pay.id} className="hover:bg-sage-50/30 transition-colors group">
                    <td className="px-8 py-6">
                       <p className="text-sm font-semibold text-charcoal-900 leading-tight uppercase font-mono">{pay.paymentReference}</p>
                       <p className="text-[11px] font-bold text-warm-400 uppercase mt-0.5 tracking-tighter">{new Date(pay.paymentDate).toLocaleString()}</p>
                    </td>
                    <td className="px-8 py-6">
                       <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-warm-100 flex items-center justify-center font-semibold text-warm-400 text-[11px]">
                            {pay.student.firstName[0]}
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-charcoal-900 leading-tight">{pay.student.firstName} {pay.student.lastName}</p>
                            <p className="text-[11px] font-bold text-warm-400 uppercase">{pay.student.studentNumber}</p>
                          </div>
                       </div>
                    </td>
                    <td className="px-8 py-6">
                       <p className="text-sm font-semibold text-charcoal-900">{pay.currency} {parseFloat(pay.amount).toLocaleString()}</p>
                       <p className="text-[11px] font-bold text-warm-400 uppercase">Allocated: {pay.allocations.length} Invoices</p>
                    </td>
                    <td className="px-8 py-6">
                       <span className="px-3 py-1 bg-warm-100 text-warm-600 rounded-full text-[11px] font-semibold uppercase tracking-tighter">
                          {pay.paymentMethod.replace('_', ' ')}
                       </span>
                    </td>
                    <td className="px-8 py-6">
                       <StatusBadge status={pay.status} />
                    </td>
                    <td className="px-8 py-6 text-right">
                       <div className="flex items-center justify-end">
                          {pay.allocations?.[0]?.invoice?.id ? (
                            <Link
                              href={`/accountant/invoices/${pay.allocations[0].invoice.id}`}
                              className="inline-flex items-center gap-1.5 rounded-lg border border-warm-200 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-forest-700 hover:bg-ivory-50"
                            >
                              <Eye size={14} /> Invoice
                            </Link>
                          ) : (
                            <span className="text-xs text-warm-400">—</span>
                          )}
                       </div>
                    </td>
                 </tr>
               ))}
               {payments.length === 0 && !loading && (
                 <tr>
                    <td colSpan={6} className="px-8 py-20 text-center">
                       <CreditCard className="mx-auto text-warm-200 mb-4" size={64} />
                       <p className="text-warm-400 font-bold text-lg uppercase tracking-wide">No payments recorded</p>
                    </td>
                 </tr>
               )}
             </tbody>
           </table>
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: any) {
  const configs: any = {
    SUCCESS: { color: 'bg-success-100 text-success-700', icon: CheckCircle },
    PENDING: { color: 'bg-sage-100 text-forest-800', icon: Clock },
    FAILED: { color: 'bg-danger-100 text-danger-700', icon: XCircle },
    REVERSED: { color: 'bg-warm-100 text-warm-600', icon: AlertCircle },
  };
  const config = configs[status] || configs.PENDING;
  const Icon = config.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold uppercase tracking-tighter ${config.color}`}>
       <Icon size={12} /> {status}
    </span>
  );
}

