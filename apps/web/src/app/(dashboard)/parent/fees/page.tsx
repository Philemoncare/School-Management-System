'use client';

import React, { useEffect, useState } from 'react';
import { useChild } from '@/context/child-context';
import { useAuth } from '@/context/auth-context';
import { Wallet, CreditCard, Receipt, FileText, CheckCircle, AlertTriangle } from 'lucide-react';

export default function ParentFees() {
  const { activeChild, loading: childLoading } = useChild();
  const { activeSchoolId } = useAuth();
  const [finance, setFinance] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchFinance() {
      if (!activeChild || !activeSchoolId) return;
      setLoading(true);
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/parent/children/${activeChild.id}/finance`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'x-school-id': activeSchoolId,
          },
        });
        const data = await response.json();
        setFinance(data);
      } catch (error) {
        console.error('Failed to fetch finance records:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchFinance();
  }, [activeChild, activeSchoolId]);

  if (childLoading || loading) return <div>Loading account balances and invoice sheets...</div>;

  const totalOutstanding = finance?.invoices?.reduce((sum: number, inv: any) => sum + Number(inv.balance), 0) || 0;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-charcoal-900">Finance Workspace & Fees</h1>
          <p className="text-warm-500">View balances, invoice statements, and payment slips for {activeChild?.firstName}.</p>
        </div>
        <div className="bg-card px-6 py-3 rounded-2xl border border-warm-100 shadow-sm flex items-center gap-4">
          <div>
            <p className="text-[11px] font-bold text-warm-400 uppercase tracking-wider leading-none mb-1">Total Due</p>
            <p className={`text-xl font-semibold ${totalOutstanding > 0 ? 'text-danger-600' : 'text-success-600'}`}>
              ${totalOutstanding.toFixed(2)}
            </p>
          </div>
          {totalOutstanding > 0 && (
            <button className="flex items-center gap-2 px-4 py-2 bg-forest-700 text-white rounded-xl text-xs font-bold hover:bg-forest-800 transition-all shadow-lg shadow-sage-200">
              <CreditCard size={14} />
              Pay Balance
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Invoices List */}
        <section className="bg-card rounded-2xl border border-warm-100 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-warm-100 flex items-center gap-2">
            <FileText size={20} className="text-forest-700" />
            <h2 className="font-bold text-charcoal-900">Invoice Sheets</h2>
          </div>
          <div className="divide-y divide-ivory-50 max-h-[500px] overflow-y-auto custom-scrollbar">
            {finance?.invoices?.length > 0 ? (
              finance.invoices.map((invoice: any) => (
                <div key={invoice.id} className="p-4 flex justify-between items-center hover:bg-ivory-50/50 transition-colors">
                  <div>
                    <p className="text-sm font-bold text-charcoal-900">{invoice.invoiceNumber}</p>
                    <p className="text-[11px] text-warm-400 font-semibold uppercase mt-0.5">Due on {new Date(invoice.dueDate).toLocaleDateString()}</p>
                    <div className="mt-2 space-y-1">
                      {invoice.items?.map((item: any, i: number) => (
                        <p key={i} className="text-xs text-warm-500 font-medium">• {item.description}</p>
                      ))}
                    </div>
                  </div>
                  <div className="text-right flex flex-col items-end gap-1.5">
                    <p className="text-sm font-semibold text-charcoal-900">${Number(invoice.totalAmount).toFixed(2)}</p>
                    <span className={`px-2 py-0.5 rounded-md text-[11px] font-bold uppercase tracking-wider border ${
                      invoice.status === 'PAID' ? 'bg-success-50 text-success-700 border-success-100' : 'bg-warning-50 text-warning-700 border-warning-100'
                    }`}>
                      {invoice.status}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p className="p-6 text-sm text-warm-500 text-center">No invoice history available.</p>
            )}
          </div>
        </section>

        {/* Payments & Receipts */}
        <section className="bg-card rounded-2xl border border-warm-100 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-warm-100 flex items-center gap-2">
            <Receipt size={20} className="text-success-600" />
            <h2 className="font-bold text-charcoal-900">Verified Payments & Slips</h2>
          </div>
          <div className="divide-y divide-ivory-50 max-h-[500px] overflow-y-auto custom-scrollbar">
            {finance?.payments?.length > 0 ? (
              finance.payments.map((payment: any) => (
                <div key={payment.id} className="p-4 flex justify-between items-center hover:bg-ivory-50/50 transition-colors">
                  <div>
                    <p className="text-sm font-bold text-charcoal-900">{payment.paymentReference}</p>
                    <p className="text-[11px] text-warm-400 font-semibold uppercase mt-0.5">Paid on {new Date(payment.paymentDate).toLocaleDateString()} via {payment.paymentMethod}</p>
                  </div>
                  <div className="text-right flex flex-col items-end gap-1.5">
                    <p className="text-sm font-semibold text-success-600">${Number(payment.amount).toFixed(2)}</p>
                    <span className="flex items-center gap-1 text-[11px] font-bold text-success-700 bg-success-50 border border-success-100 px-2 py-0.5 rounded-md">
                      <CheckCircle size={10} />
                      {payment.status}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p className="p-6 text-sm text-warm-500 text-center">No payment transactions found.</p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
