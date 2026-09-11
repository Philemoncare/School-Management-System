'use client';

import React, { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api/client';
import {
  CreditCard,
  Search,
  Plus,
  Filter,
  CheckCircle2,
  Clock,
  AlertCircle,
  MoreHorizontal,
  Download,
  Loader2,
  ChevronRight,
  XCircle,
  ArrowDownLeft
} from 'lucide-react';
import Link from 'next/link';

export default function AccountantPaymentsPage() {
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadPayments();
  }, [search]);

  async function loadPayments() {
    setLoading(true);
    try {
      const data = await apiFetch(`/finance/payments?search=${search}`);
      setPayments(data);
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
          <h1 className="text-3xl font-black text-gray-900 tracking-tight flex items-center gap-3">
             <CreditCard className="text-blue-600" /> Collection Registry
          </h1>
          <p className="text-gray-500 font-bold mt-1 uppercase tracking-widest text-[10px]">Track and reconcile all student fee payments</p>
        </div>
        <Link href="/accountant/payments/record" className="bg-green-600 text-white px-8 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-green-700 shadow-xl shadow-green-100 transition-all flex items-center gap-2">
          <ArrowDownLeft size={16} /> Record Cash/Bank
        </Link>
      </div>

      <div className="bg-white border border-gray-200 rounded-[2.5rem] shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex items-center gap-4 bg-gray-50/50">
           <div className="flex-1 bg-white border border-gray-200 px-5 py-3 rounded-2xl flex items-center shadow-sm">
              <Search size={18} className="text-gray-400 mr-3" />
              <input
                type="text"
                placeholder="Search by reference # or student name..."
                className="bg-transparent border-none w-full focus:ring-0 text-sm font-bold"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
           </div>
           <button className="p-3 bg-white border border-gray-200 rounded-2xl text-gray-500 shadow-sm"><Filter size={18}/></button>
        </div>

        <div className="relative min-h-[400px]">
           {loading && (
             <div className="absolute inset-0 bg-white/60 z-10 flex items-center justify-center">
                <Loader2 className="animate-spin text-blue-600" size={32} />
             </div>
           )}

           <table className="min-w-full divide-y divide-gray-200">
             <thead className="bg-gray-50/50">
               <tr>
                 <th className="px-8 py-5 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Transaction Ref</th>
                 <th className="px-8 py-5 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Student Information</th>
                 <th className="px-8 py-5 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Amount</th>
                 <th className="px-8 py-5 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Method</th>
                 <th className="px-8 py-5 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Status</th>
                 <th className="px-8 py-5 text-right text-[10px] font-black text-gray-400 uppercase tracking-widest">Actions</th>
               </tr>
             </thead>
             <tbody className="divide-y divide-gray-100 bg-white">
               {payments.map((pay) => (
                 <tr key={pay.id} className="hover:bg-blue-50/30 transition-colors group">
                    <td className="px-8 py-6">
                       <p className="text-sm font-black text-gray-900 leading-tight uppercase font-mono">{pay.paymentReference}</p>
                       <p className="text-[10px] font-bold text-gray-400 uppercase mt-0.5 tracking-tighter">{new Date(pay.paymentDate).toLocaleString()}</p>
                    </td>
                    <td className="px-8 py-6">
                       <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center font-black text-gray-400 text-[10px]">
                            {pay.student.firstName[0]}
                          </div>
                          <div>
                            <p className="text-xs font-black text-gray-900 leading-tight">{pay.student.firstName} {pay.student.lastName}</p>
                            <p className="text-[9px] font-bold text-gray-400 uppercase">{pay.student.studentNumber}</p>
                          </div>
                       </div>
                    </td>
                    <td className="px-8 py-6">
                       <p className="text-sm font-black text-gray-900">{pay.currency} {parseFloat(pay.amount).toLocaleString()}</p>
                       <p className="text-[9px] font-bold text-gray-400 uppercase">Allocated: {pay.allocations.length} Invoices</p>
                    </td>
                    <td className="px-8 py-6">
                       <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-[10px] font-black uppercase tracking-tighter">
                          {pay.paymentMethod.replace('_', ' ')}
                       </span>
                    </td>
                    <td className="px-8 py-6">
                       <StatusBadge status={pay.status} />
                    </td>
                    <td className="px-8 py-6 text-right">
                       <div className="flex items-center justify-end gap-2">
                          <button className="p-2 text-gray-400 hover:text-blue-600 transition-colors"><ChevronRight size={18}/></button>
                          <button className="p-2 text-gray-400 hover:text-gray-900 transition-colors"><MoreHorizontal size={18}/></button>
                       </div>
                    </td>
                 </tr>
               ))}
               {payments.length === 0 && !loading && (
                 <tr>
                    <td colSpan={6} className="px-8 py-20 text-center">
                       <CreditCard className="mx-auto text-gray-200 mb-4" size={64} />
                       <p className="text-gray-400 font-bold text-lg uppercase tracking-widest">No payments recorded</p>
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
    SUCCESS: { color: 'bg-green-100 text-green-700', icon: CheckCircle2 },
    PENDING: { color: 'bg-blue-100 text-blue-700', icon: Clock },
    FAILED: { color: 'bg-red-100 text-red-700', icon: XCircle },
    REVERSED: { color: 'bg-gray-100 text-gray-600', icon: AlertCircle },
  };
  const config = configs[status] || configs.PENDING;
  const Icon = config.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter ${config.color}`}>
       <Icon size={12} /> {status}
    </span>
  );
}
