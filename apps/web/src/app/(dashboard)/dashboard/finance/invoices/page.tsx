'use client';

import React, { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api/client';
import {
  FileText,
  Search,
  Plus,
  Filter,
  MoreHorizontal,
  Download,
  AlertCircle,
  CheckCircle2,
  Clock
} from 'lucide-react';
import Link from 'next/link';

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Note: This endpoint might not exist yet based on previous prompts.
    // In production, we'd fetch all invoices for the school.
    setLoading(false);
  }, []);

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Fee Invoices</h1>
          <p className="text-gray-500 mt-1">Generate and manage student fee bills.</p>
        </div>
        <button className="bg-blue-600 text-white px-6 py-2.5 rounded-xl font-bold hover:bg-blue-700 flex items-center gap-2 shadow-lg shadow-blue-200">
          <Plus size={20} /> Create New Invoice
        </button>
      </div>

      <div className="bg-white border border-gray-200 rounded-3xl shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex items-center gap-4 bg-gray-50/50">
           <div className="flex-1 bg-white border border-gray-200 px-4 py-2.5 rounded-2xl flex items-center">
              <Search size={18} className="text-gray-400 mr-3" />
              <input type="text" placeholder="Search by invoice number or student name..." className="bg-transparent border-none w-full focus:ring-0 text-sm font-bold" />
           </div>
           <button className="p-2.5 bg-white border border-gray-200 rounded-2xl text-gray-500 hover:bg-gray-50 transition-colors"><Filter size={18}/></button>
        </div>

        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-8 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Invoice Details</th>
              <th className="px-8 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Student</th>
              <th className="px-8 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Amount</th>
              <th className="px-8 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Status</th>
              <th className="px-8 py-4 text-right text-[10px] font-black text-gray-400 uppercase tracking-widest">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white">
            {invoices.length === 0 && (
              <tr>
                <td colSpan={5} className="px-8 py-20 text-center">
                   <FileText className="mx-auto text-gray-200 mb-4" size={64} />
                   <p className="text-gray-400 font-bold text-lg">No invoices found</p>
                   <p className="text-gray-400 text-sm mt-1">Invoices will appear here once students are billed.</p>
                </td>
              </tr>
            )}
            {invoices.map((invoice) => (
              <tr key={invoice.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-8 py-5">
                   <p className="text-sm font-black text-gray-900 leading-tight">{invoice.invoiceNumber}</p>
                   <p className="text-[10px] font-bold text-gray-400 uppercase mt-0.5 tracking-tight">Due: {new Date(invoice.dueDate).toLocaleDateString()}</p>
                </td>
                <td className="px-8 py-5">
                   <p className="text-sm font-bold text-gray-700">{invoice.student.firstName} {invoice.student.lastName}</p>
                </td>
                <td className="px-8 py-5">
                   <p className="text-sm font-black text-gray-900">{invoice.currency} {parseFloat(invoice.totalAmount).toFixed(2)}</p>
                </td>
                <td className="px-8 py-5">
                   <StatusBadge status={invoice.status} />
                </td>
                <td className="px-8 py-5 text-right">
                   <div className="flex items-center justify-end gap-2">
                      <button className="p-2 text-gray-400 hover:text-blue-600 transition-colors"><Download size={18}/></button>
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

function StatusBadge({ status }: { status: string }) {
  const configs: any = {
    PAID: { color: 'bg-green-100 text-green-700', icon: CheckCircle2 },
    ISSUED: { color: 'bg-blue-100 text-blue-700', icon: Clock },
    PARTIALLY_PAID: { color: 'bg-orange-100 text-orange-700', icon: Clock },
    OVERDUE: { color: 'bg-red-100 text-red-700', icon: AlertCircle },
    VOID: { color: 'bg-gray-100 text-gray-700', icon: XCircle },
  };

  const config = configs[status] || configs.ISSUED;
  const Icon = config.icon;

  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter ${config.color}`}>
      <Icon size={12} />
      {status}
    </span>
  );
}

import { XCircle } from 'lucide-react';
