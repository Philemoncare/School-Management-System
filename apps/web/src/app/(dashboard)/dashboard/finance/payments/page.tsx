'use client';

import React, { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api/client';
import {
  CreditCard,
  Search,
  Plus,
  Filter,
  MoreHorizontal,
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowDownLeft
} from 'lucide-react';

export default function PaymentsPage() {
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // In production: apiFetch('/finance/payments').then(setPayments).finally(() => setLoading(false))
    setLoading(false);
  }, []);

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Payment History</h1>
          <p className="text-gray-500 mt-1">Track and reconcile student fee collections.</p>
        </div>
        <button className="bg-green-600 text-white px-6 py-2.5 rounded-xl font-bold hover:bg-green-700 flex items-center gap-2 shadow-lg shadow-green-200">
          <ArrowDownLeft size={20} /> Record Payment
        </button>
      </div>

      <div className="bg-white border border-gray-200 rounded-3xl shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex items-center gap-4 bg-gray-50/50">
           <div className="flex-1 bg-white border border-gray-200 px-4 py-2.5 rounded-2xl flex items-center shadow-sm">
              <Search size={18} className="text-gray-400 mr-3" />
              <input type="text" placeholder="Search by reference, student or method..." className="bg-transparent border-none w-full focus:ring-0 text-sm font-bold" />
           </div>
           <button className="p-2.5 bg-white border border-gray-200 rounded-2xl text-gray-500 hover:bg-gray-50 shadow-sm"><Filter size={18}/></button>
        </div>

        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-8 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Payment Reference</th>
              <th className="px-8 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Student</th>
              <th className="px-8 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Amount</th>
              <th className="px-8 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Method</th>
              <th className="px-8 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Status</th>
              <th className="px-8 py-4 text-right text-[10px] font-black text-gray-400 uppercase tracking-widest">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white">
            {payments.length === 0 && (
              <tr>
                <td colSpan={6} className="px-8 py-20 text-center">
                   <CreditCard className="mx-auto text-gray-200 mb-4" size={64} />
                   <p className="text-gray-400 font-bold text-lg">No payments recorded</p>
                   <p className="text-gray-400 text-sm mt-1">Collections will appear here once students pay.</p>
                </td>
              </tr>
            )}
            {payments.map((payment) => (
              <tr key={payment.id} className="hover:bg-gray-50 transition-colors group">
                <td className="px-8 py-5">
                   <p className="text-sm font-black text-gray-900 leading-tight font-mono uppercase">{payment.paymentReference}</p>
                   <p className="text-[10px] font-bold text-gray-400 uppercase mt-0.5 tracking-tight">{new Date(payment.paymentDate).toLocaleDateString()}</p>
                </td>
                <td className="px-8 py-5">
                   <p className="text-sm font-bold text-gray-700">{payment.student.firstName} {payment.student.lastName}</p>
                </td>
                <td className="px-8 py-5">
                   <p className="text-sm font-black text-gray-900">{payment.currency} {parseFloat(payment.amount).toFixed(2)}</p>
                </td>
                <td className="px-8 py-5">
                   <span className="text-[10px] font-black text-gray-500 bg-gray-100 px-2 py-0.5 rounded-lg uppercase tracking-wider">{payment.paymentMethod}</span>
                </td>
                <td className="px-8 py-5">
                   <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter ${
                     payment.status === 'SUCCESS' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                   }`}>
                     {payment.status === 'SUCCESS' ? <CheckCircle2 size={12}/> : <Clock size={12}/>}
                     {payment.status}
                   </span>
                </td>
                <td className="px-8 py-5 text-right">
                   <div className="flex items-center justify-end gap-2">
                      <button className="p-2 text-gray-400 hover:text-gray-900 transition-colors"><MoreHorizontal size={18}/></button>
                   </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
