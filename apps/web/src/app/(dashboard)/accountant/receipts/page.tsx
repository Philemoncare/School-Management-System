'use client';

import React, { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api/client';
import {
  FileText,
  Search,
  Filter,
  CheckCircle,
  Download,
  Printer,
  Loader2,
  ArrowUpRight,
  ShieldCheck,
  CreditCard
} from 'lucide-react';
import Link from 'next/link';

export default function AccountantReceiptsPage() {
  const [receipts, setReceipts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadReceipts();
  }, [search]);

  async function loadReceipts() {
    setLoading(true);
    try {
      const data = await apiFetch(`/finance/receipts?search=${search}`);
      setReceipts(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-8 space-y-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-semibold text-charcoal-900 tracking-tight flex items-center gap-3">
             <ShieldCheck className="text-success-600" /> Confirmed Receipts
          </h1>
          <p className="text-warm-500 font-bold mt-1 uppercase tracking-wide text-[11px]">Registry of official financial acknowledgments and proof of payment</p>
        </div>
        <div className="flex items-center gap-3">
           <button className="bg-card border border-warm-200 text-warm-700 px-6 py-2.5 rounded-2xl font-semibold text-[11px] uppercase tracking-wide hover:bg-ivory-50 transition-all shadow-sm flex items-center gap-2">
             <Download size={16} /> Batch Export
           </button>
        </div>
      </div>

      <div className="bg-card border border-warm-200 rounded-xl shadow-sm overflow-hidden">
        <div className="p-6 border-b border-warm-100 flex items-center gap-4 bg-ivory-50/50">
           <div className="flex-1 bg-card border border-warm-200 px-5 py-3 rounded-2xl flex items-center shadow-sm">
              <Search size={18} className="text-warm-400 mr-3" />
              <input
                type="text"
                placeholder="Search by receipt # or student..."
                className="bg-transparent border-none w-full focus:ring-0 text-sm font-bold"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
           </div>
           <button className="p-3 bg-card border border-warm-200 rounded-2xl text-warm-500 shadow-sm"><Filter size={18}/></button>
        </div>

        <div className="relative min-h-[400px]">
           {loading && (
             <div className="absolute inset-0 bg-card/60 z-10 flex items-center justify-center">
                <Loader2 className="animate-spin text-forest-700" size={32} />
             </div>
           )}

           <table className="min-w-full divide-y divide-warm-200">
             <thead className="bg-ivory-50/50">
               <tr>
                 <th className="px-8 py-5 text-left text-[11px] font-semibold text-warm-400 uppercase tracking-wide">Receipt Details</th>
                 <th className="px-8 py-5 text-left text-[11px] font-semibold text-warm-400 uppercase tracking-wide">Student</th>
                 <th className="px-8 py-5 text-left text-[11px] font-semibold text-warm-400 uppercase tracking-wide">Method</th>
                 <th className="px-8 py-5 text-right text-[11px] font-semibold text-warm-400 uppercase tracking-wide">Amount</th>
                 <th className="px-8 py-5 text-right text-[11px] font-semibold text-warm-400 uppercase tracking-wide">Date</th>
                 <th className="px-8 py-5 text-right text-[11px] font-semibold text-warm-400 uppercase tracking-wide">Actions</th>
               </tr>
             </thead>
             <tbody className="divide-y divide-warm-100 bg-card">
               {receipts.map((rcp) => (
                 <tr key={rcp.id} className="hover:bg-sage-50/30 transition-colors group">
                    <td className="px-8 py-6">
                       <p className="text-sm font-semibold text-charcoal-900 leading-tight">{rcp.receiptNumber}</p>
                       <p className="text-[11px] font-bold text-forest-700 uppercase mt-0.5 tracking-wide">Verified Transaction</p>
                    </td>
                    <td className="px-8 py-6">
                       <div>
                          <p className="text-xs font-semibold text-charcoal-900 leading-tight">{rcp.student.firstName} {rcp.student.lastName}</p>
                          <p className="text-[11px] font-bold text-warm-400 uppercase tracking-wide">{rcp.student.studentNumber}</p>
                       </div>
                    </td>
                    <td className="px-8 py-6">
                       <div className="flex items-center gap-2">
                          <CreditCard size={14} className="text-warm-400" />
                          <span className="text-[11px] font-semibold text-warm-600 uppercase tracking-wide">{rcp.paymentMethod}</span>
                       </div>
                    </td>
                    <td className="px-8 py-6 text-right">
                       <p className="text-sm font-semibold text-charcoal-900">{rcp.currency} {parseFloat(rcp.amount).toLocaleString()}</p>
                    </td>
                    <td className="px-8 py-6 text-right">
                       <p className="text-xs font-semibold text-charcoal-900">{new Date(rcp.paymentDate).toLocaleDateString()}</p>
                    </td>
                    <td className="px-8 py-6 text-right">
                       <div className="flex items-center justify-end gap-2">
                          <button className="p-2 text-warm-400 hover:text-forest-700 transition-colors"><Printer size={18}/></button>
                          <button className="p-2 text-warm-400 hover:text-forest-700 transition-colors"><Download size={18}/></button>
                       </div>
                    </td>
                 </tr>
               ))}
               {receipts.length === 0 && !loading && (
                 <tr>
                    <td colSpan={6} className="px-8 py-20 text-center">
                       <ShieldCheck className="mx-auto text-warm-200 mb-4" size={64} />
                       <p className="text-warm-400 font-bold text-lg uppercase tracking-wide">No receipts found</p>
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

