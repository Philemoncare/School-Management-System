'use client';

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
  CheckCircle2,
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
      alert('Refund processed successfully');
      router.push('/accountant/dashboard');
    } catch (err) {
      alert('Failed to process refund. Check if amount exceeds refundable balance.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-10">
      <div className="flex items-center gap-4">
        <button onClick={() => router.back()} className="p-2.5 bg-white border border-gray-200 rounded-2xl hover:bg-gray-50 transition-colors shadow-sm text-gray-500">
           <ChevronLeft size={20} />
        </button>
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight leading-none text-red-600">Reverse Transaction</h1>
          <p className="text-gray-500 font-bold mt-2 uppercase tracking-widest text-[10px]">Process refunds and financial reversals for confirmed payments</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="space-y-6">
           <div className="bg-white border border-gray-200 rounded-[2rem] p-6 shadow-sm">
              <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest mb-6">1. Locate Payment</h3>
              <form onSubmit={handleSearch} className="relative mb-6">
                 <Search className="absolute left-4 top-3.5 text-gray-400" size={18} />
                 <input
                   type="text"
                   placeholder="Payment Ref or Student..."
                   className="w-full bg-gray-50 border-none rounded-xl pl-12 pr-4 py-3 text-sm font-bold"
                   value={search}
                   onChange={(e) => setSearch(e.target.value)}
                 />
              </form>
              <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                 {loading && <div className="text-center py-10"><Loader2 className="animate-spin mx-auto text-blue-600" /></div>}
                 {payments.map(p => (
                   <button
                     key={p.id}
                     onClick={() => {
                        setSelectedPayment(p);
                        setFormData({...formData, amount: p.amount});
                     }}
                     className={`w-full flex items-center justify-between p-4 rounded-xl transition-all ${
                       selectedPayment?.id === p.id ? 'bg-red-600 text-white shadow-lg' : 'hover:bg-gray-50 text-gray-800'
                     }`}
                   >
                      <div className="text-left">
                         <p className="text-xs font-black truncate">{p.paymentReference}</p>
                         <p className={`text-[9px] font-bold uppercase ${selectedPayment?.id === p.id ? 'text-red-100' : 'text-gray-400'}`}>{p.student.firstName} {p.student.lastName}</p>
                      </div>
                      <div className="text-right">
                         <p className="text-xs font-black">{parseFloat(p.amount).toLocaleString()}</p>
                      </div>
                   </button>
                 ))}
                 {payments.length === 0 && !loading && (
                    <p className="text-center py-10 text-gray-400 font-bold text-[10px] uppercase">Search for a payment reference</p>
                 )}
              </div>
           </div>
        </div>

        <div className="lg:col-span-2">
           {selectedPayment ? (
             <form onSubmit={handleSubmit} className="space-y-8">
                <section className="bg-white border border-gray-200 rounded-[2.5rem] p-10 shadow-sm space-y-10">
                   <div className="flex items-center gap-6 p-6 bg-red-50 rounded-[2rem] border border-red-100">
                      <div className="p-4 bg-white rounded-2xl shadow-sm text-red-600"><AlertCircle size={24}/></div>
                      <div>
                         <p className="text-[10px] font-black text-red-400 uppercase tracking-widest leading-none mb-1">Original Transaction</p>
                         <h3 className="text-lg font-black text-gray-900 leading-tight">{selectedPayment.paymentReference}</h3>
                         <p className="text-xs font-bold text-gray-500 mt-1">Confirmed on {new Date(selectedPayment.paymentDate).toLocaleDateString()}</p>
                      </div>
                   </div>

                   <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div>
                         <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 px-1">Refund Amount</label>
                         <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400"><DollarSign size={18}/></div>
                            <input
                              type="number"
                              required
                              max={selectedPayment.amount}
                              className="w-full bg-gray-50 border-none rounded-2xl pl-11 pr-4 py-4 text-lg font-black text-gray-900 focus:ring-2 focus:ring-red-600"
                              value={formData.amount}
                              onChange={(e) => setFormData({...formData, amount: e.target.value})}
                            />
                         </div>
                         <p className="mt-2 px-1 text-[9px] font-bold text-gray-400 uppercase">Maximum refundable: {parseFloat(selectedPayment.amount).toLocaleString()}</p>
                      </div>
                      <div>
                         <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 px-1">Refund Method</label>
                         <div className="w-full bg-gray-100 rounded-2xl px-6 py-4 text-sm font-black text-gray-400">
                            Same as Original ({selectedPayment.paymentMethod})
                         </div>
                      </div>
                   </div>

                   <div>
                      <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 px-1">Reason for Reversal</label>
                      <textarea
                        required
                        rows={3}
                        placeholder="Detail the reason for this refund..."
                        className="w-full bg-gray-50 border-none rounded-2xl px-6 py-4 text-sm font-bold text-gray-900 focus:ring-2 focus:ring-red-600"
                        value={formData.reason}
                        onChange={(e) => setFormData({...formData, reason: e.target.value})}
                      />
                   </div>
                </section>

                <div className="flex justify-end pt-4">
                   <button
                     type="submit"
                     disabled={saving}
                     className="bg-red-600 text-white px-12 py-4 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-red-700 shadow-xl shadow-red-100 transition-all flex items-center gap-3 disabled:opacity-50"
                   >
                      {saving ? <Loader2 className="animate-spin" size={20} /> : <RefreshCcw size={20} />}
                      Authorize Refund
                   </button>
                </div>
             </form>
           ) : (
             <div className="h-full bg-white border-2 border-dashed border-gray-200 rounded-[2.5rem] flex flex-col items-center justify-center p-20 text-center">
                <div className="p-6 bg-red-50 text-red-600 rounded-full mb-6 animate-pulse"><RefreshCcw size={40}/></div>
                <h3 className="text-xl font-black text-gray-900">No payment selected</h3>
                <p className="text-gray-400 mt-2 font-medium leading-relaxed">Please search and select a confirmed transaction from the list to initiate a reversal.</p>
             </div>
           )}
        </div>
      </div>
    </div>
  );
}
