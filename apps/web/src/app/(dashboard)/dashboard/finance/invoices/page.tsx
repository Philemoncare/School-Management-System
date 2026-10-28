'use client';

import React, { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api/client';
import {
  AlertCircle,
  CheckCircle,
  ChevronRight,
  Clock,
  FileText,
  Loader2,
  Plus,
  Search,
  XCircle,
} from 'lucide-react';
import Link from 'next/link';

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    const timeout = setTimeout(() => {
      setLoading(true);
      setError('');
      apiFetch(`/finance/invoices?search=${encodeURIComponent(search.trim())}`)
        .then(setInvoices)
        .catch((err) => setError(err.message || 'Unable to load invoices.'))
        .finally(() => setLoading(false));
    }, 300);
    return () => clearTimeout(timeout);
  }, [search]);

  return (
    <div className="p-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
        <div>
          <h1 className="text-3xl font-semibold text-charcoal-900 tracking-tight">Fee Invoices</h1>
          <p className="text-warm-500 mt-1">Generate and manage student fee bills.</p>
        </div>
        <Link href="/accountant/billing/new" className="bg-forest-700 text-white px-6 py-2.5 rounded-xl font-semibold hover:bg-forest-800 flex items-center gap-2">
          <Plus size={18} /> Create New Invoice
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
          <div className="flex-1 bg-card border border-warm-200 px-4 py-2.5 rounded-xl flex items-center">
            <Search size={18} className="text-warm-400 mr-3" />
            <input value={search} onChange={(event) => setSearch(event.target.value)} type="text" placeholder="Search by invoice number or student name..." className="bg-transparent border-none w-full focus:ring-0 text-sm font-medium outline-none" />
          </div>
        </div>

        <div className="relative overflow-x-auto min-h-[300px]">
          {loading && <div className="absolute inset-0 bg-card/60 z-10 flex items-center justify-center"><Loader2 className="animate-spin text-forest-700" size={32} /></div>}
          <table className="min-w-full divide-y divide-warm-200">
            <thead className="bg-ivory-50">
              <tr>
                <th className="px-8 py-4 text-left text-[11px] font-semibold text-warm-400 uppercase tracking-wide">Invoice Details</th>
                <th className="px-8 py-4 text-left text-[11px] font-semibold text-warm-400 uppercase tracking-wide">Student</th>
                <th className="px-8 py-4 text-left text-[11px] font-semibold text-warm-400 uppercase tracking-wide">Amount</th>
                <th className="px-8 py-4 text-left text-[11px] font-semibold text-warm-400 uppercase tracking-wide">Status</th>
                <th className="px-8 py-4 text-right text-[11px] font-semibold text-warm-400 uppercase tracking-wide">Open</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-warm-100 bg-card">
              {invoices.map((invoice) => (
                <tr key={invoice.id} className="hover:bg-ivory-50 transition-colors">
                  <td className="px-8 py-5">
                    <p className="text-sm font-semibold text-charcoal-900 leading-tight">{invoice.invoiceNumber}</p>
                    <p className="text-[11px] font-bold text-warm-400 uppercase mt-0.5 tracking-tight">Due: {new Date(invoice.dueDate).toLocaleDateString()}</p>
                  </td>
                  <td className="px-8 py-5">
                    <p className="text-sm font-semibold text-warm-700">{invoice.student.firstName} {invoice.student.lastName}</p>
                    <p className="text-[11px] font-medium text-warm-400">{invoice.student.studentNumber}</p>
                  </td>
                  <td className="px-8 py-5">
                    <p className="text-sm font-semibold text-charcoal-900">{invoice.currency} {parseFloat(invoice.totalAmount).toFixed(2)}</p>
                    <p className="text-[11px] font-medium text-danger-500">Balance: {invoice.currency} {parseFloat(invoice.balance).toFixed(2)}</p>
                  </td>
                  <td className="px-8 py-5"><StatusBadge status={invoice.status} /></td>
                  <td className="px-8 py-5 text-right">
                    <Link href={`/accountant/invoices/${invoice.id}`} className="inline-flex p-2 text-warm-400 hover:text-forest-700 transition-colors" aria-label={`Open ${invoice.invoiceNumber}`}><ChevronRight size={18} /></Link>
                  </td>
                </tr>
              ))}
              {invoices.length === 0 && !loading && (
                <tr>
                  <td colSpan={5} className="px-8 py-20 text-center">
                    <FileText className="mx-auto text-warm-200 mb-4" size={64} />
                    <p className="text-warm-400 font-bold text-lg">No invoices found</p>
                    <p className="text-warm-400 text-sm mt-1">Invoices will appear here once students are billed.</p>
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

function StatusBadge({ status }: { status: string }) {
  const configs: Record<string, { color: string; icon: any }> = {
    PAID: { color: 'bg-success-100 text-success-700', icon: CheckCircle },
    ISSUED: { color: 'bg-sage-100 text-forest-800', icon: Clock },
    PARTIALLY_PAID: { color: 'bg-terracotta-100 text-terracotta-700', icon: Clock },
    OVERDUE: { color: 'bg-danger-100 text-danger-700', icon: AlertCircle },
    VOID: { color: 'bg-warm-100 text-warm-700', icon: XCircle },
  };
  const config = configs[status] || configs.ISSUED;
  const Icon = config.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold uppercase tracking-tight ${config.color}`}>
      <Icon size={12} /> {status.replace(/_/g, ' ')}
    </span>
  );
}
