'use client';

import React, { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api/client';
import {
  AlertCircle,
  ArrowDownLeft,
  CheckCircle,
  Clock,
  CreditCard,
  Loader2,
  Search,
  XCircle,
} from 'lucide-react';
import Link from 'next/link';

export default function PaymentsPage() {
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    const timeout = setTimeout(() => {
      setLoading(true);
      setError('');
      apiFetch(`/finance/payments?search=${encodeURIComponent(search.trim())}`)
        .then(setPayments)
        .catch((err) => setError(err.message || 'Unable to load payments.'))
        .finally(() => setLoading(false));
    }, 300);
    return () => clearTimeout(timeout);
  }, [search]);

  return (
    <div className="p-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
        <div>
          <h1 className="text-3xl font-semibold text-charcoal-900 tracking-tight">Payment History</h1>
          <p className="text-warm-500 mt-1">Track and reconcile student fee collections.</p>
        </div>
        <Link href="/accountant/payments/record" className="bg-success-600 text-white px-6 py-2.5 rounded-xl font-semibold hover:bg-success-700 flex items-center gap-2">
          <ArrowDownLeft size={18} /> Record Payment
        </Link>
      </div>

      {error && (
        <div className="mb-6 flex items-start gap-3 rounded-xl border border-danger-200 bg-danger-50 p-4 text-danger-700">
          <AlertCircle size={18} className="shrink-0 mt-0.5" />
          <p className="text-sm font-semibold">{error}</p>
        </div>
      )}

      <div className="bg-card border border-warm-200 rounded-xl shadow-sm overflow-hidden">
        <div className="p-6 border-b border-warm-100 flex items-center gap-4 bg-ivory-50/50">
          <div className="flex-1 bg-card border border-warm-200 px-4 py-2.5 rounded-xl flex items-center shadow-sm">
            <Search size={18} className="text-warm-400 mr-3" />
            <input value={search} onChange={(event) => setSearch(event.target.value)} type="text" placeholder="Search by reference, student or method..." className="bg-transparent border-none w-full focus:ring-0 text-sm font-medium outline-none" />
          </div>
        </div>

        <div className="relative overflow-x-auto min-h-[300px]">
          {loading && <div className="absolute inset-0 bg-card/60 z-10 flex items-center justify-center"><Loader2 className="animate-spin text-forest-700" size={32} /></div>}
          <table className="min-w-full divide-y divide-warm-200">
            <thead className="bg-ivory-50">
              <tr>
                <th className="px-8 py-4 text-left text-[11px] font-semibold text-warm-400 uppercase tracking-wide">Payment Reference</th>
                <th className="px-8 py-4 text-left text-[11px] font-semibold text-warm-400 uppercase tracking-wide">Student</th>
                <th className="px-8 py-4 text-left text-[11px] font-semibold text-warm-400 uppercase tracking-wide">Amount</th>
                <th className="px-8 py-4 text-left text-[11px] font-semibold text-warm-400 uppercase tracking-wide">Method</th>
                <th className="px-8 py-4 text-left text-[11px] font-semibold text-warm-400 uppercase tracking-wide">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-warm-100 bg-card">
              {payments.map((payment) => (
                <tr key={payment.id} className="hover:bg-ivory-50 transition-colors">
                  <td className="px-8 py-5">
                    <p className="text-sm font-semibold text-charcoal-900 leading-tight font-mono uppercase">{payment.paymentReference}</p>
                    <p className="text-[11px] font-bold text-warm-400 uppercase mt-0.5 tracking-tight">{new Date(payment.paymentDate).toLocaleDateString()}</p>
                  </td>
                  <td className="px-8 py-5">
                    <p className="text-sm font-semibold text-warm-700">{payment.student.firstName} {payment.student.lastName}</p>
                    <p className="text-[11px] font-medium text-warm-400">{payment.student.studentNumber}</p>
                  </td>
                  <td className="px-8 py-5">
                    <p className="text-sm font-semibold text-charcoal-900">{payment.currency} {parseFloat(payment.amount).toFixed(2)}</p>
                    <p className="text-[11px] font-medium text-warm-400">{payment.allocations?.length || 0} allocations</p>
                  </td>
                  <td className="px-8 py-5">
                    <span className="text-[11px] font-semibold text-warm-500 bg-warm-100 px-2 py-0.5 rounded-lg uppercase tracking-wider">{payment.paymentMethod.replace(/_/g, ' ')}</span>
                  </td>
                  <td className="px-8 py-5">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold uppercase tracking-tight ${
                      payment.status === 'SUCCESS' ? 'bg-success-100 text-success-700' : payment.status === 'FAILED' ? 'bg-danger-100 text-danger-700' : 'bg-terracotta-100 text-terracotta-700'
                    }`}>
                      {payment.status === 'SUCCESS' ? <CheckCircle size={12} /> : payment.status === 'FAILED' ? <XCircle size={12} /> : <Clock size={12} />}
                      {payment.status}
                    </span>
                  </td>
                </tr>
              ))}
              {payments.length === 0 && !loading && (
                <tr>
                  <td colSpan={5} className="px-8 py-20 text-center">
                    <CreditCard className="mx-auto text-warm-200 mb-4" size={64} />
                    <p className="text-warm-400 font-bold text-lg">No payments recorded</p>
                    <p className="text-warm-400 text-sm mt-1">Collections will appear here once students pay.</p>
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
