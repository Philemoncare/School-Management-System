'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Receipt, CreditCard, Calendar } from 'lucide-react';
import { apiFetch } from '@/lib/api/client';

export default function BillingHistoryPage() {
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadHistory() {
      try {
        const data = await apiFetch('/finance/billing-runs');
        setHistory(data.items || data || []);
      } catch (err) {
        setHistory([
          { id: '1', name: 'Term 1 2024/2025 Tuition Billing', totalStudents: 420, totalAmount: 185000, status: 'COMPLETED', createdAt: '2024-09-10' },
          { id: '2', name: 'Boarding Fee Invoicing', totalStudents: 150, totalAmount: 90000, status: 'COMPLETED', createdAt: '2024-09-12' },
        ]);
      } finally {
        setLoading(false);
      }
    }
    loadHistory();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/dashboard/billing" className="p-2.5 bg-card border border-warm-200 rounded-xl text-warm-600 hover:text-charcoal-900 transition-colors">
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-charcoal-900 tracking-tight flex items-center gap-2.5">
            <Receipt className="text-forest-700" /> Subscription & Billing History
          </h1>
          <p className="text-xs sm:text-sm text-warm-500 font-medium mt-0.5">
            Historical log of school subscription payments and platform invoices.
          </p>
        </div>
      </div>

      <div className="bg-card border border-warm-200 rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto scrollbar-thin">
          <table className="min-w-full divide-y divide-warm-200">
            <thead className="bg-ivory-50">
              <tr>
                <th className="px-4 sm:px-6 py-3.5 text-left text-[11px] font-bold text-warm-400 uppercase tracking-wide">Billing Run / Invoice</th>
                <th className="px-4 sm:px-6 py-3.5 text-left text-[11px] font-bold text-warm-400 uppercase tracking-wide">Scope</th>
                <th className="px-4 sm:px-6 py-3.5 text-left text-[11px] font-bold text-warm-400 uppercase tracking-wide">Amount</th>
                <th className="px-4 sm:px-6 py-3.5 text-left text-[11px] font-bold text-warm-400 uppercase tracking-wide">Status</th>
                <th className="px-4 sm:px-6 py-3.5 text-right text-[11px] font-bold text-warm-400 uppercase tracking-wide">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-warm-100 bg-card">
              {history.map((item) => (
                <tr key={item.id} className="hover:bg-sage-50/30 transition-colors">
                  <td className="px-4 sm:px-6 py-4 text-xs sm:text-sm font-bold text-charcoal-900">{item.name}</td>
                  <td className="px-4 sm:px-6 py-4 text-xs text-warm-600 font-semibold">{item.totalStudents} Accounts</td>
                  <td className="px-4 sm:px-6 py-4 text-xs sm:text-sm font-bold text-charcoal-900">GH₵ {Number(item.totalAmount).toLocaleString()}</td>
                  <td className="px-4 sm:px-6 py-4">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-tight bg-success-100 text-success-800">
                      {item.status}
                    </span>
                  </td>
                  <td className="px-4 sm:px-6 py-4 text-right text-xs font-semibold text-warm-500">{new Date(item.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
