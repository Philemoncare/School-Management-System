'use client';

import React, { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api/client';
import {
  FileText,
  Search,
  Plus,
  CheckCircle,
  Clock,
  AlertCircle,
  Loader2,
  XCircle,
  Eye
} from 'lucide-react';
import Link from 'next/link';

const STATUS_OPTIONS = [
  { value: '', label: 'All statuses' },
  { value: 'ISSUED', label: 'Issued' },
  { value: 'PARTIALLY_PAID', label: 'Partially paid' },
  { value: 'PAID', label: 'Paid' },
  { value: 'OVERDUE', label: 'Overdue' },
  { value: 'VOID', label: 'Void' },
];

export default function AccountantInvoicesPage() {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    loadInvoices();
  }, [search, status]);

  async function loadInvoices() {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.set('search', search.trim());
      if (status) params.set('status', status);
      const data = await apiFetch(`/finance/invoices?${params.toString()}`);
      setInvoices(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setInvoices([]);
      setError(err?.message || 'Could not load invoices.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-8 space-y-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-semibold text-charcoal-900 tracking-tight flex items-center gap-3">
             <FileText className="text-forest-700" /> Student Invoices
          </h1>
          <p className="text-warm-500 font-bold mt-1 uppercase tracking-wide text-[11px]">Registry of all institutional Billing and Payment Requests</p>
        </div>
        <Link href="/accountant/billing/new" className="bg-forest-700 text-white px-8 py-3 rounded-2xl font-semibold text-[11px] uppercase tracking-wide hover:bg-forest-800 shadow-xs shadow-sage-100 transition-all flex items-center gap-2">
          <Plus size={16} /> Individual Invoice
        </Link>
      </div>

      <div className="bg-card border border-warm-200 rounded-xl shadow-sm overflow-hidden">
        <div className="p-6 border-b border-warm-100 flex items-center gap-4 bg-ivory-50/50">
           <div className="flex-1 bg-card border border-warm-200 px-5 py-3 rounded-2xl flex items-center shadow-sm">
              <Search size={18} className="text-warm-400 mr-3" />
              <input
                type="text"
                placeholder="Search by invoice # or student name..."
                className="bg-transparent border-none w-full focus:ring-0 text-sm font-bold"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
           </div>
           <select
             aria-label="Filter invoices by status"
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
                 <th className="px-8 py-5 text-left text-[11px] font-semibold text-warm-400 uppercase tracking-wide">Invoice Details</th>
                 <th className="px-8 py-5 text-left text-[11px] font-semibold text-warm-400 uppercase tracking-wide">Student Information</th>
                 <th className="px-8 py-5 text-left text-[11px] font-semibold text-warm-400 uppercase tracking-wide">Amount</th>
                 <th className="px-8 py-5 text-left text-[11px] font-semibold text-warm-400 uppercase tracking-wide">Status</th>
                 <th className="px-8 py-5 text-right text-[11px] font-semibold text-warm-400 uppercase tracking-wide">Actions</th>
               </tr>
             </thead>
             <tbody className="divide-y divide-warm-100 bg-card">
               {invoices.map((inv) => (
                 <tr key={inv.id} className="hover:bg-sage-50/30 transition-colors group">
                    <td className="px-8 py-6">
                       <p className="text-sm font-semibold text-charcoal-900 leading-tight">{inv.invoiceNumber}</p>
                       <p className="text-[11px] font-bold text-warm-400 uppercase mt-0.5 tracking-tighter">Due {new Date(inv.dueDate).toLocaleDateString()}</p>
                    </td>
                    <td className="px-8 py-6">
                       <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-warm-100 flex items-center justify-center font-semibold text-warm-400 text-[11px]">
                            {inv.student.firstName[0]}
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-charcoal-900 leading-tight">{inv.student.firstName} {inv.student.lastName}</p>
                            <p className="text-[11px] font-bold text-warm-400 uppercase">{inv.student.studentNumber}</p>
                          </div>
                       </div>
                    </td>
                    <td className="px-8 py-6">
                       <p className="text-sm font-semibold text-charcoal-900">GH₵ {parseFloat(inv.totalAmount).toLocaleString()}</p>
                       <p className="text-[11px] font-bold text-danger-500 uppercase">Bal: GH₵ {parseFloat(inv.balance).toLocaleString()}</p>
                    </td>
                    <td className="px-8 py-6">
                       <StatusBadge status={inv.status} />
                    </td>
                    <td className="px-8 py-6 text-right">
                       <Link
                          href={`/accountant/invoices/${inv.id}`}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-warm-200 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-forest-700 hover:bg-ivory-50"
                        >
                          <Eye size={14} /> View
                        </Link>
                    </td>
                 </tr>
               ))}
               {invoices.length === 0 && !loading && (
                 <tr>
                    <td colSpan={5} className="px-8 py-20 text-center">
                       <FileText className="mx-auto text-warm-200 mb-4" size={64} />
                       <p className="text-warm-400 font-bold text-lg uppercase tracking-wide">No invoices found</p>
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
    PAID: { color: 'bg-success-100 text-success-700', icon: CheckCircle },
    ISSUED: { color: 'bg-sage-100 text-forest-800', icon: FileText },
    OVERDUE: { color: 'bg-danger-100 text-danger-700', icon: AlertCircle },
    PARTIALLY_PAID: { color: 'bg-terracotta-100 text-terracotta-700', icon: Clock },
    VOID: { color: 'bg-warm-100 text-warm-600', icon: XCircle },
  };
  const config = configs[status] || configs.ISSUED;
  const Icon = config.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold uppercase tracking-tighter ${config.color}`}>
       <Icon size={12} /> {status.replace('_', ' ')}
    </span>
  );
}

