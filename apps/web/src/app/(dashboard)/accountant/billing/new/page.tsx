'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api/client';
import {
  ChevronLeft,
  FileText,
  Search,
  CheckCircle2,
  Loader2,
  Calendar,
  Layers,
  Users,
  AlertCircle
} from 'lucide-react';

export default function BulkBillingPage() {
  const router = useRouter();
  const [years, setYears] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [feeStructures, setFeeStructures] = useState<any[]>([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    academicYearId: '',
    termId: '',
    classId: '',
    feeStructureIds: [] as string[],
    dueDate: new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString().split('T')[0],
  });

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [yearData, classData, feeData] = await Promise.all([
        apiFetch('/academic-years'),
        apiFetch('/classes'),
        apiFetch('/finance/fee-structures'),
      ]);
      setYears(yearData);
      setClasses(classData);
      setFeeStructures(feeData);

      const currentYear = yearData.find((y: any) => y.isCurrent);
      if (currentYear) {
        setFormData(prev => ({ ...prev, academicYearId: currentYear.id }));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const selectedYear = years.find(y => y.id === formData.academicYearId);
  const terms = selectedYear?.terms || [];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (formData.feeStructureIds.length === 0) {
      alert('Please select at least one fee structure');
      return;
    }
    setSaving(true);
    try {
      await apiFetch('/finance/billing/bulk', {
        method: 'POST',
        body: JSON.stringify({
          ...formData,
          dueDate: new Date(formData.dueDate),
        })
      });
      alert('Bulk billing run initialized successfully');
      router.push('/accountant/invoices');
    } catch (err) {
      alert('Failed to initialize billing run');
    } finally {
      setSaving(false);
    }
  }

  const toggleFee = (id: string) => {
    setFormData(prev => ({
      ...prev,
      feeStructureIds: prev.feeStructureIds.includes(id)
        ? prev.feeStructureIds.filter(f => f !== id)
        : [...prev.feeStructureIds, id]
    }));
  };

  if (loading) return <div className="p-20 text-center"><Loader2 className="animate-spin mx-auto text-blue-600" size={48} /></div>;

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-10">
      <div className="flex items-center gap-4">
        <button onClick={() => router.back()} className="p-2.5 bg-white border border-gray-200 rounded-2xl hover:bg-gray-50 transition-colors shadow-sm text-gray-500">
           <ChevronLeft size={20} />
        </button>
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight leading-none">Initialize Billing Run</h1>
          <p className="text-gray-500 font-bold mt-2 uppercase tracking-widest text-[10px]">Bulk generate invoices based on configured fee structures</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
           <section className="bg-white border border-gray-200 rounded-[2.5rem] p-10 shadow-sm space-y-8">
              <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4 border-b border-gray-50 pb-4">1. Select Target Audience</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                 <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 px-1">Academic Year</label>
                    <select
                      required
                      className="w-full bg-gray-50 border-none rounded-2xl px-5 py-3.5 text-sm font-bold text-gray-900 focus:ring-2 focus:ring-blue-600"
                      value={formData.academicYearId}
                      onChange={(e) => setFormData({...formData, academicYearId: e.target.value})}
                    >
                       <option value="">Select Year...</option>
                       {years.map(y => <option key={y.id} value={y.id}>{y.name}</option>)}
                    </select>
                 </div>
                 <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 px-1">Term / Period</label>
                    <select
                      required
                      className="w-full bg-gray-50 border-none rounded-2xl px-5 py-3.5 text-sm font-bold text-gray-900 focus:ring-2 focus:ring-blue-600"
                      value={formData.termId}
                      onChange={(e) => setFormData({...formData, termId: e.target.value})}
                    >
                       <option value="">Select Term...</option>
                       {terms.map((t: any) => <option key={t.id} value={t.id}>{t.name}</option>)}
                    </select>
                 </div>
                 <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 px-1">Target Class (Optional)</label>
                    <select
                      className="w-full bg-gray-50 border-none rounded-2xl px-5 py-3.5 text-sm font-bold text-gray-900 focus:ring-2 focus:ring-blue-600"
                      value={formData.classId}
                      onChange={(e) => setFormData({...formData, classId: e.target.value})}
                    >
                       <option value="">All Students (School-wide)</option>
                       {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                 </div>
                 <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 px-1">Payment Due Date</label>
                    <div className="relative">
                       <Calendar size={18} className="absolute left-4 top-3.5 text-gray-400" />
                       <input
                         type="date"
                         required
                         className="w-full bg-gray-50 border-none rounded-2xl pl-12 pr-4 py-3.5 text-sm font-bold text-gray-900 focus:ring-2 focus:ring-blue-600"
                         value={formData.dueDate}
                         onChange={(e) => setFormData({...formData, dueDate: e.target.value})}
                       />
                    </div>
                 </div>
              </div>
           </section>

           <section className="bg-white border border-gray-200 rounded-[2.5rem] p-10 shadow-sm space-y-8">
              <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4 border-b border-gray-50 pb-4">2. Select Fee Components</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 {feeStructures.map(fee => (
                   <button
                     key={fee.id}
                     type="button"
                     onClick={() => toggleFee(fee.id)}
                     className={`flex items-center justify-between p-5 rounded-3xl border-2 transition-all text-left ${
                       formData.feeStructureIds.includes(fee.id)
                         ? 'border-blue-600 bg-blue-50/50 shadow-lg shadow-blue-50'
                         : 'border-gray-50 bg-gray-50 hover:border-gray-200'
                     }`}
                   >
                      <div className="flex-1 pr-4">
                         <p className="text-sm font-black text-gray-900 leading-tight">{fee.name}</p>
                         <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tight mt-1">{fee.feeCategory.name}</p>
                      </div>
                      <div className="text-right">
                         <p className="text-sm font-black text-blue-600">{parseFloat(fee.amount).toLocaleString()}</p>
                         <div className={`mt-2 w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                           formData.feeStructureIds.includes(fee.id) ? 'bg-blue-600 border-blue-600' : 'border-gray-300'
                         }`}>
                            {formData.feeStructureIds.includes(fee.id) && <CheckCircle2 size={12} className="text-white" />}
                         </div>
                      </div>
                   </button>
                 ))}
              </div>
           </section>
        </div>

        <div className="space-y-8">
           <div className="bg-gray-900 rounded-[2.5rem] p-8 shadow-xl text-white">
              <h3 className="text-lg font-black mb-8 tracking-tight">Summary</h3>
              <div className="space-y-6">
                 <SummaryItem label="Selected Fees" value={formData.feeStructureIds.length.toString()} />
                 <SummaryItem
                   label="Combined Total"
                   value={`GH₵ ${feeStructures
                     .filter(f => formData.feeStructureIds.includes(f.id))
                     .reduce((acc, f) => acc + parseFloat(f.amount), 0)
                     .toLocaleString()}`}
                 />
                 <div className="pt-6 border-t border-white/10 mt-6">
                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest leading-relaxed">
                       This action will generate invoices for all students enrolled in the selected criteria. Existing invoices for the same period will be skipped to prevent duplication.
                    </p>
                 </div>
              </div>
           </div>

           <button
             type="submit"
             disabled={saving || formData.feeStructureIds.length === 0}
             className="w-full bg-blue-600 text-white p-6 rounded-[2.5rem] font-black text-sm uppercase tracking-widest hover:bg-blue-700 shadow-xl shadow-blue-100 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
           >
              {saving ? <Loader2 className="animate-spin" size={20} /> : <FileText size={20}/>}
              Launch Billing Run
           </button>

           <div className="bg-orange-50 border border-orange-100 rounded-3xl p-6 flex items-start gap-4">
              <AlertCircle className="text-orange-500 shrink-0" size={20} />
              <p className="text-[10px] font-bold text-orange-700 leading-relaxed uppercase tracking-tight">
                 Ensure fee structures are correct before launching. Billing runs are logged and audited.
              </p>
           </div>
        </div>
      </form>
    </div>
  );
}

function SummaryItem({ label, value }: any) {
  return (
    <div className="flex justify-between items-center">
       <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{label}</span>
       <span className="text-base font-black text-white">{value}</span>
    </div>
  );
}
