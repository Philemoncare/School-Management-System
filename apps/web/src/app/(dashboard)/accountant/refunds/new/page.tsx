'use client';
import { showFeedback } from '@/components/layout/global-feedback';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api/client';
import {
  ChevronLeft,
  RefreshCcw,
  Search,
  DollarSign,
  AlertCircle,
  Loader2,
  CheckCircle,
  ArrowRight
} from 'lucide-react';

export default function NewRefundPage() {
  const router = useRouter();
  const [payments, setPayments] = useState<any[]>([]);
  const [selectedPayment, setSelectedPayment] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');

  const [formData, setFormData] = useState({
    amount: '',
    reason: '',
  });

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedPayment) return;
    setSaving(true);
    try {
      await apiFetch('/finance/refunds', {
        method: 'POST',
        body: JSON.stringify({
          paymentId: selectedPayment.id,
          amount: parseFloat(formData.amount),
          reason: formData.reason,
        })
      });
      showFeedback('SUCCESS', 'Refund processed successfully');
      router.push('/accountant/dashboard');
    } catch (err) {
      showFeedback('ERROR', 'Failed to process refund. Check if amount exceeds refundable balance.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-10">
      <div className="flex items-center gap-4">
        <button onClick={() => router.back()} className="p-2.5 bg-card border border-warm-200 rounded-2xl hover:bg-ivory-50 transition-colors shadow-sm text-warm-500">
           <ChevronLeft size={20} />
        </button>
        <div>
          <h1 className="text-3xl font-semibold text-charcoal-900 tracking-tight leading-none text-danger-600">Reverse Transaction</h1>
          <p className="text-warm-500 font-bold mt-2 uppercase tracking-wide text-[11px]">Process refunds and financial reversals for confirmed payments</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="space-y-6">
           <div className="bg-card border border-warm-200 rounded-xl p-6 shadow-sm">
              <h3 className="text-sm font-semibold text-charcoal-900 uppercase tracking-wide mb-6">1. Locate Payment</h3>
              <form onSubmit={handleSearch} className="relative mb-6">
                 <Search className="absolute left-4 top-3.5 text-warm-400" size={18} />
                 <input
                   type="text"
                   placeholder="Payment Ref or Student..."
                   className="w-full bg-ivory-50 border-none rounded-xl pl-12 pr-4 py-3 text-sm font-bold"
                   value={search}
                   onChange={(e) => setSearch(e.target.value)}
                 />
              </form>
              <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                 {loading && <div className="text-center py-10"><Loader2 className="animate-spin mx-auto text-forest-700" /></div>}
                 {payments.map(p => (
                   <button
                     key={p.id}
                     onClick={() => {
                        setSelectedPayment(p);
                        setFormData({...formData, amount: p.amount});
                     }}
                     className={`w-full flex items-center justify-between p-4 rounded-xl transition-all ${
                       selectedPayment?.id === p.id ? 'bg-danger-600 text-white shadow-lg' : 'hover:bg-ivory-50 text-charcoal-800'
                     }`}
                   >
                      <div className="text-left">
                         <p className="text-xs font-semibold truncate">{p.paymentReference}</p>
                         <p className={`text-[11px] font-bold uppercase ${selectedPayment?.id === p.id ? 'text-danger-100' : 'text-warm-400'}`}>{p.student.firstName} {p.student.lastName}</p>
                      </div>
                      <div className="text-right">
                         <p className="text-xs font-semibold">{parseFloat(p.amount).toLocaleString()}</p>
                      </div>
                   </button>
                 ))}
                 {payments.length === 0 && !loading && (
                    <p className="text-center py-10 text-warm-400 font-bold text-[11px] uppercase">Search for a payment reference</p>
                 )}
              </div>
           </div>
        </div>

        <div className="lg:col-span-2">
           {selectedPayment ? (
             <form onSubmit={handleSubmit} className="space-y-8">
                <section className="bg-card border border-warm-200 rounded-xl p-10 shadow-sm space-y-10">
                   <div className="flex items-center gap-6 p-6 bg-danger-50 rounded-xl border border-danger-100">
                      <div className="p-4 bg-card rounded-2xl shadow-sm text-danger-600"><AlertCircle size={24}/></div>
                      <div>
                         <p className="text-[11px] font-semibold text-danger-400 uppercase tracking-wide leading-none mb-1">Original Transaction</p>
                         <h3 className="text-lg font-semibold text-charcoal-900 leading-tight">{selectedPayment.paymentReference}</h3>
                         <p className="text-xs font-bold text-warm-500 mt-1">Confirmed on {new Date(selectedPayment.paymentDate).toLocaleDateString()}</p>
                      </div>
                   </div>

                   <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div>
                         <label className="block text-[11px] font-semibold text-warm-400 uppercase tracking-wide mb-3 px-1">Refund Amount</label>
                         <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-warm-400"><DollarSign size={18}/></div>
                            <input
                              type="number"
                              required
                              max={selectedPayment.amount}
                              className="w-full bg-ivory-50 border-none rounded-2xl pl-11 pr-4 py-4 text-lg font-semibold text-charcoal-900 focus:ring-2 focus:ring-danger-600"
                              value={formData.amount}
                              onChange={(e) => setFormData({...formData, amount: e.target.value})}
                            />
                         </div>
                         <p className="mt-2 px-1 text-[11px] font-bold text-warm-400 uppercase">Maximum refundable: {parseFloat(selectedPayment.amount).toLocaleString()}</p>
                      </div>
                      <div>
                         <label className="block text-[11px] font-semibold text-warm-400 uppercase tracking-wide mb-3 px-1">Refund Method</label>
                         <div className="w-full bg-warm-100 rounded-2xl px-6 py-4 text-sm font-semibold text-warm-400">
                            Same as Original ({selectedPayment.paymentMethod})
                         </div>
                      </div>
                   </div>

                   <div>
                      <label className="block text-[11px] font-semibold text-warm-400 uppercase tracking-wide mb-3 px-1">Reason for Reversal</label>
                      <textarea
                        required
                        rows={3}
                        placeholder="Detail the reason for this refund..."
                        className="w-full bg-ivory-50 border-none rounded-2xl px-6 py-4 text-sm font-bold text-charcoal-900 focus:ring-2 focus:ring-danger-600"
                        value={formData.reason}
                        onChange={(e) => setFormData({...formData, reason: e.target.value})}
                      />
                   </div>
                </section>

                <div className="flex justify-end pt-4">
                   <button
                     type="submit"
                     disabled={saving}
                     className="bg-danger-600 text-white px-12 py-4 rounded-2xl font-semibold text-sm uppercase tracking-wide hover:bg-danger-700 shadow-xs shadow-danger-100 transition-all flex items-center gap-3 disabled:opacity-50"
                   >
                      {saving ? <Loader2 className="animate-spin" size={20} /> : <RefreshCcw size={20} />}
                      Authorize Refund
                   </button>
                </div>
             </form>
           ) : (
             <div className="h-full bg-card border-2 border-dashed border-warm-200 rounded-xl flex flex-col items-center justify-center p-20 text-center">
                <div className="p-6 bg-danger-50 text-danger-600 rounded-full mb-6 animate-pulse"><RefreshCcw size={40}/></div>
                <h3 className="text-xl font-semibold text-charcoal-900">No payment selected</h3>
                <p className="text-warm-400 mt-2 font-medium leading-relaxed">Please search and select a confirmed transaction from the list to initiate a reversal.</p>
             </div>
           )}
        </div>
      </div>
    </div>
  );
}

