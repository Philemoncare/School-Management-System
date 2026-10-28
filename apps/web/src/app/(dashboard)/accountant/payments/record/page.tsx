'use client';
import { showFeedback } from '@/components/layout/global-feedback';

import { Select } from '@/components/ui/input';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api/client';
import {
  ChevronLeft,
  ArrowDownLeft,
  Loader2,
  Users,
  Search,
  DollarSign,
  CreditCard,
  Building2,
  CheckCircle
} from 'lucide-react';

export default function RecordPaymentPage() {
  const router = useRouter();
  const [students, setStudents] = useState<any[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [selectedInvoices, setSelectedInvoices] = useState<Record<string, number>>({});

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');

  const [formData, setFormData] = useState({
    amount: '',
    paymentMethod: 'CASH',
    externalReference: '',
  });

  useEffect(() => {
    loadStudents();
  }, [search]);

  async function loadStudents() {
    try {
      const data = await apiFetch(`/students?search=${search}`);
      setStudents(data.items);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSelectStudent(student: any) {
    setSelectedStudent(student);
    setLoading(true);
    try {
      const invData = await apiFetch(`/finance/invoices?studentId=${student.id}&status=ISSUED`);
      setInvoices(invData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const allocations = Object.entries(selectedInvoices).map(([invoiceId, amount]) => ({
        invoiceId,
        amount,
      }));

      await apiFetch('/finance/payments/record', {
        method: 'POST',
        body: JSON.stringify({
          studentId: selectedStudent.id,
          amount: parseFloat(formData.amount),
          paymentMethod: formData.paymentMethod,
          externalReference: formData.externalReference,
          allocations,
        })
      });

      showFeedback('SUCCESS', 'Payment recorded successfully');
      router.push('/accountant/payments');
    } catch (err) {
      showFeedback('ERROR', 'Failed to record payment');
    } finally {
      setSaving(false);
    }
  }

  if (loading && !selectedStudent) return <div className="p-20 text-center"><Loader2 className="animate-spin mx-auto text-forest-700" size={48} /></div>;

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-10">
      <div className="flex items-center gap-4">
        <button onClick={() => router.back()} className="p-2.5 bg-card border border-warm-200 rounded-2xl hover:bg-ivory-50 transition-colors shadow-sm text-warm-500">
           <ChevronLeft size={20} />
        </button>
        <div>
          <h1 className="text-3xl font-semibold text-charcoal-900 tracking-tight leading-none">Record Collection</h1>
          <p className="text-warm-500 font-bold mt-2 uppercase tracking-wide text-[11px]">Log internal cash, bank or mobile money transactions</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Step 1: Student Selection */}
        <div className="space-y-6">
           <div className="bg-card border border-warm-200 rounded-xl p-6 shadow-sm">
              <h3 className="text-sm font-semibold text-charcoal-900 uppercase tracking-wide mb-6">1. Identify Student</h3>
              <div className="relative mb-6">
                 <Search className="absolute left-4 top-3.5 text-warm-400" size={18} />
                 <input
                   type="text"
                   placeholder="Student Name or ID..."
                   className="w-full bg-ivory-50 border-none rounded-xl pl-12 pr-4 py-3 text-sm font-bold"
                   value={search}
                   onChange={(e) => setSearch(e.target.value)}
                 />
              </div>
              <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                 {students.map(s => (
                   <button
                     key={s.id}
                     onClick={() => handleSelectStudent(s)}
                     className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${
                       selectedStudent?.id === s.id ? 'bg-forest-700 text-white shadow-lg' : 'hover:bg-ivory-50 text-charcoal-800'
                     }`}
                   >
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-semibold text-[11px] ${
                        selectedStudent?.id === s.id ? 'bg-card/20' : 'bg-warm-100'
                      }`}>{s.firstName[0]}</div>
                      <div className="text-left">
                         <p className="text-xs font-semibold truncate">{s.firstName} {s.lastName}</p>
                         <p className={`text-[11px] font-bold uppercase ${selectedStudent?.id === s.id ? 'text-sage-100' : 'text-warm-400'}`}>{s.studentNumber}</p>
                      </div>
                   </button>
                 ))}
              </div>
           </div>
        </div>

        {/* Step 2: Payment Details */}
        <div className="lg:col-span-2 space-y-6">
           {selectedStudent ? (
             <form onSubmit={handleSubmit} className="space-y-8">
                <section className="bg-card border border-warm-200 rounded-xl p-10 shadow-sm space-y-10">
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div>
                         <label className="block text-[11px] font-semibold text-warm-400 uppercase tracking-wide mb-3 px-1">Total Amount Received</label>
                         <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-warm-400"><DollarSign size={18}/></div>
                            <input
                              type="number"
                              required
                              placeholder="0.00"
                              className="w-full bg-ivory-50 border-none rounded-2xl pl-11 pr-4 py-4 text-lg font-semibold text-charcoal-900 focus:ring-2 focus:ring-forest-700"
                              value={formData.amount}
                              onChange={(e) => setFormData({...formData, amount: e.target.value})}
                            />
                         </div>
                      </div>
                      <div>
                         <label className="block text-[11px] font-semibold text-warm-400 uppercase tracking-wide mb-3 px-1">Payment Channel</label>
                         <Select
                           className="w-full bg-ivory-50 border-none rounded-2xl px-5 py-4 text-sm font-semibold text-charcoal-900 focus:ring-2 focus:ring-forest-700 appearance-none"
                           value={formData.paymentMethod}
                           onChange={(e) => setFormData({...formData, paymentMethod: e.target.value})}
                         >
                            <option value="CASH">Physical Cash</option>
                            <option value="BANK_TRANSFER">Bank Transfer / Deposit</option>
                            <option value="MOBILE_MONEY">Mobile Money</option>
                            <option value="CARD">Point of Sale (POS)</option>
                         </Select>
                      </div>
                   </div>

                   <div>
                      <label className="block text-[11px] font-semibold text-warm-400 uppercase tracking-wide mb-4 px-1">2. Allocate to Invoices</label>
                      <div className="space-y-3">
                         {invoices.map(inv => (
                           <div key={inv.id} className="flex items-center justify-between p-5 bg-ivory-50 rounded-3xl border border-warm-100">
                              <div>
                                 <p className="text-sm font-semibold text-charcoal-900 leading-tight">{inv.invoiceNumber}</p>
                                 <p className="text-[11px] font-bold text-warm-400 uppercase tracking-tighter mt-1">Due {new Date(inv.dueDate).toLocaleDateString()} • Bal: GH₵ {parseFloat(inv.balance).toLocaleString()}</p>
                              </div>
                              <div className="flex items-center gap-4">
                                 <input
                                   type="number"
                                   placeholder="0.00"
                                   className="w-28 bg-card border-none rounded-xl px-4 py-2 text-right text-xs font-semibold text-forest-700 focus:ring-1 focus:ring-forest-700"
                                   onChange={(e) => setSelectedInvoices({...selectedInvoices, [inv.id]: parseFloat(e.target.value)})}
                                 />
                              </div>
                           </div>
                         ))}
                         {invoices.length === 0 && (
                           <p className="py-10 text-center text-warm-400 font-bold text-xs uppercase tracking-wide bg-ivory-50 rounded-xl border-2 border-dashed border-warm-100">
                              No outstanding invoices found for this student.
                           </p>
                         )}
                      </div>
                   </div>

                   <div>
                      <label className="block text-[11px] font-semibold text-warm-400 uppercase tracking-wide mb-3 px-1">External Reference / Receipt #</label>
                      <input
                        type="text"
                        placeholder="e.g. Bank slip number or MoMo ID..."
                        className="w-full bg-ivory-50 border-none rounded-2xl px-6 py-4 text-sm font-bold text-charcoal-900"
                        value={formData.externalReference}
                        onChange={(e) => setFormData({...formData, externalReference: e.target.value})}
                      />
                   </div>
                </section>

                <div className="flex justify-end pt-4">
                   <button
                     type="submit"
                     disabled={saving || !formData.amount}
                     className="bg-success-600 text-white px-12 py-4 rounded-2xl font-semibold text-sm uppercase tracking-wide hover:bg-success-700 shadow-xs shadow-success-100 transition-all flex items-center gap-3 disabled:opacity-50"
                   >
                      {saving ? <Loader2 className="animate-spin" size={20} /> : <CheckCircle size={20} />}
                      Verify & Finalize Collection
                   </button>
                </div>
             </form>
           ) : (
             <div className="h-full bg-card border-2 border-dashed border-warm-200 rounded-xl flex flex-col items-center justify-center p-20 text-center">
                <div className="p-6 bg-sage-50 text-forest-700 rounded-full mb-6 animate-pulse"><Users size={40}/></div>
                <h3 className="text-xl font-semibold text-charcoal-900">Student not selected</h3>
                <p className="text-warm-400 mt-2 font-medium">Please search and select a student from the sidebar to record a payment.</p>
             </div>
           )}
        </div>
      </div>
    </div>
  );
}

