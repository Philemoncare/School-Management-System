'use client';

import React, { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api/client';
import {
  AlertCircle,
  Search,
  Filter,
  ArrowRight,
  Loader2,
  Calendar,
  MessageSquare,
  Mail,
  Phone,
  Clock,
  Download,
  ChevronRight
} from 'lucide-react';
import Link from 'next/link';

export default function OutstandingBalancesPage() {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadOutstanding();
  }, []);

  async function loadOutstanding() {
    setLoading(true);
    try {
      const data = await apiFetch('/finance/outstanding');
      setInvoices(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const totalOutstanding = invoices.reduce((acc, inv) => acc + parseFloat(inv.balance), 0);

  return (
    <div className="p-8 space-y-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight flex items-center gap-3">
             <AlertCircle className="text-red-600" /> Outstanding Balances
          </h1>
          <p className="text-gray-500 font-bold mt-1 uppercase tracking-widest text-[10px]">Real-time tracking of unpaid and overdue student accounts</p>
        </div>
        <div className="flex items-center gap-3">
           <div className="bg-red-50 border border-red-100 px-6 py-2.5 rounded-2xl text-right">
              <p className="text-[9px] font-black text-red-400 uppercase tracking-widest leading-none mb-1">Total Outstanding</p>
              <p className="text-xl font-black text-red-600 leading-none">GH₵ {totalOutstanding.toLocaleString()}</p>
           </div>
           <button className="bg-blue-600 text-white px-8 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-700 shadow-xl shadow-blue-100 transition-all flex items-center gap-2">
             <MessageSquare size={16} /> Bulk Reminders
           </button>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-[2.5rem] shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex items-center gap-4 bg-gray-50/50">
           <div className="flex-1 bg-white border border-gray-200 px-5 py-3 rounded-2xl flex items-center shadow-sm">
              <Search size={18} className="text-gray-400 mr-3" />
              <input
                type="text"
                placeholder="Search by student or invoice #..."
                className="bg-transparent border-none w-full focus:ring-0 text-sm font-bold"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
           </div>
           <button className="p-3 bg-white border border-gray-200 rounded-2xl text-gray-500 shadow-sm flex items-center gap-2 font-bold text-xs uppercase tracking-widest px-6">
              <Clock size={18} className="text-orange-500"/> Overdue Only
           </button>
        </div>

        <div className="relative min-h-[500px]">
           {loading && (
             <div className="absolute inset-0 bg-white/60 z-10 flex items-center justify-center">
                <Loader2 className="animate-spin text-blue-600" size={32} />
             </div>
           )}

           <table className="min-w-full divide-y divide-gray-200">
             <thead className="bg-gray-50/50">
               <tr>
                 <th className="px-8 py-5 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Student</th>
                 <th className="px-8 py-5 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Academic Info</th>
                 <th className="px-8 py-5 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Invoice / Due</th>
                 <th className="px-8 py-5 text-right text-[10px] font-black text-gray-400 uppercase tracking-widest">Total Amount</th>
                 <th className="px-8 py-5 text-right text-[10px] font-black text-gray-400 uppercase tracking-widest">Balance</th>
                 <th className="px-8 py-5 text-right text-[10px] font-black text-gray-400 uppercase tracking-widest">Action</th>
               </tr>
             </thead>
             <tbody className="divide-y divide-gray-100 bg-white">
               {invoices.map((inv) => {
                 const isOverdue = new Date(inv.dueDate) < new Date();
                 const daysOverdue = Math.floor((new Date().getTime() - new Date(inv.dueDate).getTime()) / (1000 * 3600 * 24));

                 return (
                   <tr key={inv.id} className="hover:bg-red-50/20 transition-colors group">
                      <td className="px-8 py-6">
                         <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-2xl bg-gray-100 flex items-center justify-center font-black text-gray-400 text-sm">
                               {inv.student.firstName[0]}
                            </div>
                            <div>
                               <p className="text-sm font-black text-gray-900 leading-tight">{inv.student.firstName} {inv.student.lastName}</p>
                               <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter mt-1">{inv.student.studentNumber}</p>
                            </div>
                         </div>
                      </td>
                      <td className="px-8 py-6">
                         <p className="text-xs font-black text-gray-800 leading-tight">{inv.academicYear.name}</p>
                         <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">{inv.term?.name || 'Full Year'}</p>
                      </td>
                      <td className="px-8 py-6">
                         <p className="text-xs font-black text-gray-900 leading-tight">{inv.invoiceNumber}</p>
                         <div className="flex items-center gap-1.5 mt-1">
                            <Calendar size={10} className={isOverdue ? 'text-red-500' : 'text-gray-400'} />
                            <span className={`text-[9px] font-black uppercase ${isOverdue ? 'text-red-500' : 'text-gray-400'}`}>
                               {new Date(inv.dueDate).toLocaleDateString()} {isOverdue && `(${daysOverdue}d overdue)`}
                            </span>
                         </div>
                      </td>
                      <td className="px-8 py-6 text-right">
                         <p className="text-sm font-bold text-gray-500">GH₵ {parseFloat(inv.totalAmount).toLocaleString()}</p>
                      </td>
                      <td className="px-8 py-6 text-right">
                         <p className="text-base font-black text-red-600 underline decoration-red-200 underline-offset-4 font-mono">GH₵ {parseFloat(inv.balance).toLocaleString()}</p>
                      </td>
                      <td className="px-8 py-6 text-right">
                         <div className="flex items-center justify-end gap-2">
                            <Link href={`/accountant/invoices/${inv.id}`} className="p-2.5 bg-gray-50 text-gray-400 hover:text-blue-600 rounded-xl transition-all"><ArrowRight size={18}/></Link>
                         </div>
                      </td>
                   </tr>
                 );
               })}
               {invoices.length === 0 && !loading && (
                 <tr>
                    <td colSpan={6} className="px-8 py-20 text-center">
                       <CheckCircle2 className="mx-auto text-green-100 mb-4" size={64} />
                       <p className="text-gray-400 font-bold text-lg uppercase tracking-widest">All accounts are settled!</p>
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
