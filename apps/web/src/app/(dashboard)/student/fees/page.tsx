'use client';

import React, { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api/client';
import { useAuth } from '@/context/auth-context';
import { CreditCard, Loader2, DollarSign, FileText } from 'lucide-react';

export default function StudentFees() {
  const { activeSchoolId } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!activeSchoolId) return;
    apiFetch('/student/finance')
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [activeSchoolId]);

  if (loading) return <div className="p-20 text-center"><Loader2 className="animate-spin mx-auto text-forest-700" size={48} /></div>;

  const invoices = data?.invoices || [];
  const payments = data?.payments || [];
  const receipts = data?.receipts || [];

  return (
    <div className="space-y-6">
      <div className="bg-card p-6 rounded-2xl border border-warm-100 shadow-sm">
        <h1 className="text-2xl font-bold text-charcoal-900 flex items-center gap-2">
          <CreditCard className="text-forest-700" />
          Finance & Fees Statement
        </h1>
        <p className="text-warm-500 text-sm">Review your generated tuition fee invoices, recorded payment entries, and legal receipts.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Invoices */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-card rounded-2xl p-6 border border-warm-100 shadow-sm">
            <h3 className="text-lg font-bold text-charcoal-900 mb-4 flex items-center gap-2">
              <FileText size={18} className="text-forest-700" />
              Invoices ({invoices.length})
            </h3>
            <div className="space-y-3">
              {invoices.map((inv: any) => (
                <div key={inv.id} className="p-4 bg-ivory-50 rounded-xl border border-warm-100 flex justify-between items-center">
                  <div>
                    <h4 className="font-bold text-charcoal-900 text-sm">Invoice #{inv.invoiceNumber}</h4>
                    <p className="text-xs text-warm-400 font-semibold uppercase">Due Date: {new Date(inv.dueDate).toLocaleDateString()}</p>
                    <div className="mt-1 flex gap-2">
                      {inv.items?.map((item: any) => (
                        <span key={item.id} className="text-[11px] bg-card border border-warm-200 text-warm-600 px-2 py-0.5 rounded font-medium">{item.description}</span>
                      ))}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-base font-semibold text-charcoal-900">GH₵ {Number(inv.totalAmount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                    <span className={`px-2 py-0.5 font-bold text-[11px] rounded-md uppercase ${
                      inv.status === 'PAID' ? 'bg-success-50 text-success-700' : 'bg-danger-50 text-danger-700'
                    }`}>{inv.status}</span>
                  </div>
                </div>
              ))}
              {invoices.length === 0 && (
                <p className="text-xs text-warm-400 font-medium italic text-center py-6">No generated fee invoices found.</p>
              )}
            </div>
          </div>
        </div>

        {/* Payments & Receipts */}
        <div className="bg-card rounded-2xl p-6 border border-warm-100 shadow-sm space-y-4">
          <h3 className="text-lg font-bold text-charcoal-900 flex items-center gap-2">
            <DollarSign size={18} className="text-success-600" />
            Receipt Log
          </h3>
          <div className="space-y-3">
            {receipts.map((rec: any) => (
              <div key={rec.id} className="p-3 bg-success-50/40 rounded-xl border border-success-100/50 flex justify-between items-center">
                <div>
                  <p className="text-xs font-bold text-charcoal-900">Receipt #{rec.receiptNumber}</p>
                  <p className="text-[11px] text-warm-400 font-semibold">{rec.paymentMethod} • {new Date(rec.paymentDate).toLocaleDateString()}</p>
                </div>
                <p className="text-sm font-semibold text-success-600">GH₵ {Number(rec.amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
              </div>
            ))}
            {receipts.length === 0 && (
              <p className="text-xs text-warm-400 font-medium italic text-center py-6">No payment receipts issued yet.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
