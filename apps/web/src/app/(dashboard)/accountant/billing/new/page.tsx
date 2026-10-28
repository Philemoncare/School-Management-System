'use client';

import { Select } from '@/components/ui/input';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api/client';
import { toast } from 'sonner';
import {
  ChevronLeft,
  FileText,
  CheckCircle,
  Loader2,
  Calendar,
  AlertCircle,
} from 'lucide-react';

export default function BulkBillingPage() {
  const router = useRouter();
  const [years, setYears] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [feeStructures, setFeeStructures] = useState<any[]>([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

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
    setLoading(true);
    setError('');
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
    } catch (err: any) {
      setError(err.message || 'Unable to load billing options.');
    } finally {
      setLoading(false);
    }
  }

  const selectedYear = years.find(y => y.id === formData.academicYearId);
  const terms = selectedYear?.terms || [];
  const selectedTotal = feeStructures
    .filter(f => formData.feeStructureIds.includes(f.id))
    .reduce((acc, f) => acc + parseFloat(f.amount), 0);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (!formData.academicYearId || !formData.termId) {
      setError('Select an academic year and term before launching the billing run.');
      return;
    }

    if (formData.feeStructureIds.length === 0) {
      setError('Select at least one fee structure.');
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
      toast.success('Billing run started.');
      router.push('/accountant/billing');
    } catch (err: any) {
      setError(err.message || 'Unable to start the billing run.');
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

  if (loading) return <div className="p-20 text-center"><Loader2 className="animate-spin mx-auto text-forest-700" size={48} /></div>;

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-10">
      <div className="flex items-center gap-4">
        <button onClick={() => router.back()} className="p-2.5 bg-card border border-warm-200 rounded-2xl hover:bg-ivory-50 transition-colors shadow-sm text-warm-500">
           <ChevronLeft size={20} />
        </button>
        <div>
          <h1 className="text-3xl font-semibold text-charcoal-900 tracking-tight leading-none">Initialize Billing Run</h1>
          <p className="text-warm-500 font-bold mt-2 uppercase tracking-wide text-[11px]">Bulk generate invoices based on configured fee structures</p>
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-3 rounded-xl border border-danger-200 bg-danger-50 p-4 text-danger-700">
          <AlertCircle size={18} className="shrink-0 mt-0.5" />
          <p className="text-sm font-semibold">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
           <section className="bg-card border border-warm-200 rounded-xl p-10 shadow-sm space-y-8">
              <h3 className="text-[11px] font-semibold text-warm-400 uppercase tracking-wide mb-4 border-b border-ivory-50 pb-4">1. Select Target Audience</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                 <div>
                    <label className="block text-[11px] font-semibold text-warm-400 uppercase tracking-wide mb-3 px-1">Academic Year</label>
                    <Select
                      required
                      className="w-full bg-ivory-50 border-none rounded-2xl px-5 py-3.5 text-sm font-bold text-charcoal-900 focus:ring-2 focus:ring-forest-700"
                      value={formData.academicYearId}
                      onChange={(e) => setFormData({...formData, academicYearId: e.target.value, termId: ''})}
                    >
                       <option value="">Select Year...</option>
                       {years.map(y => <option key={y.id} value={y.id}>{y.name}</option>)}
                    </Select>
                 </div>
                 <div>
                    <label className="block text-[11px] font-semibold text-warm-400 uppercase tracking-wide mb-3 px-1">Term / Period</label>
                    <Select
                      required
                      className="w-full bg-ivory-50 border-none rounded-2xl px-5 py-3.5 text-sm font-bold text-charcoal-900 focus:ring-2 focus:ring-forest-700"
                      value={formData.termId}
                      onChange={(e) => setFormData({...formData, termId: e.target.value})}
                    >
                       <option value="">Select Term...</option>
                       {terms.map((t: any) => <option key={t.id} value={t.id}>{t.name}</option>)}
                    </Select>
                 </div>
                 <div>
                    <label className="block text-[11px] font-semibold text-warm-400 uppercase tracking-wide mb-3 px-1">Target Class (Optional)</label>
                    <Select
                      className="w-full bg-ivory-50 border-none rounded-2xl px-5 py-3.5 text-sm font-bold text-charcoal-900 focus:ring-2 focus:ring-forest-700"
                      value={formData.classId}
                      onChange={(e) => setFormData({...formData, classId: e.target.value})}
                    >
                       <option value="">All Students (School-wide)</option>
                       {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </Select>
                 </div>
                 <div>
                    <label className="block text-[11px] font-semibold text-warm-400 uppercase tracking-wide mb-3 px-1">Payment Due Date</label>
                    <div className="relative">
                       <Calendar size={18} className="absolute left-4 top-3.5 text-warm-400" />
                       <input
                         type="date"
                         required
                         className="w-full bg-ivory-50 border-none rounded-2xl pl-12 pr-4 py-3.5 text-sm font-bold text-charcoal-900 focus:ring-2 focus:ring-forest-700"
                         value={formData.dueDate}
                         onChange={(e) => setFormData({...formData, dueDate: e.target.value})}
                       />
                    </div>
                 </div>
              </div>
           </section>

           <section className="bg-card border border-warm-200 rounded-xl p-10 shadow-sm space-y-8">
              <h3 className="text-[11px] font-semibold text-warm-400 uppercase tracking-wide mb-4 border-b border-ivory-50 pb-4">2. Select Fee Components</h3>

              {feeStructures.length === 0 ? (
                <div className="rounded-xl border border-warm-200 bg-ivory-50 p-8 text-center">
                  <p className="text-sm font-semibold text-charcoal-900">No fee structures available.</p>
                  <p className="mt-1 text-sm text-warm-500">Create a fee structure before starting a billing run.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   {feeStructures.map(fee => (
                     <button
                       key={fee.id}
                       type="button"
                       onClick={() => toggleFee(fee.id)}
                       className={`flex items-center justify-between p-5 rounded-3xl border-2 transition-all text-left ${
                         formData.feeStructureIds.includes(fee.id)
                           ? 'border-forest-700 bg-sage-50/50 shadow-lg shadow-sage-50'
                           : 'border-ivory-50 bg-ivory-50 hover:border-warm-200'
                       }`}
                     >
                        <div className="flex-1 pr-4">
                           <p className="text-sm font-semibold text-charcoal-900 leading-tight">{fee.name}</p>
                           <p className="text-[11px] font-bold text-warm-400 uppercase tracking-tight mt-1">{fee.feeCategory?.name || 'Fee'}</p>
                        </div>
                        <div className="text-right">
                           <p className="text-sm font-semibold text-forest-700">{formatCurrency(fee.amount)}</p>
                           <div className={`mt-2 w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                             formData.feeStructureIds.includes(fee.id) ? 'bg-forest-700 border-forest-700' : 'border-warm-300'
                           }`}>
                              {formData.feeStructureIds.includes(fee.id) && <CheckCircle size={12} className="text-white" />}
                           </div>
                        </div>
                     </button>
                   ))}
                </div>
              )}
           </section>
        </div>

        <div className="space-y-8">
           <div className="bg-charcoal-900 rounded-xl p-8 shadow-xs text-white">
              <h3 className="text-lg font-semibold mb-8 tracking-tight">Summary</h3>
              <div className="space-y-6">
                 <SummaryItem label="Selected Fees" value={formData.feeStructureIds.length.toString()} />
                 <SummaryItem label="Combined Total" value={formatCurrency(selectedTotal)} />
                 <div className="pt-6 border-t border-white/10 mt-6">
                    <p className="text-[11px] font-bold text-warm-400 uppercase tracking-wide leading-relaxed">
                       This action will generate invoices for all students enrolled in the selected criteria. Existing invoices for the same period will be skipped to prevent duplication.
                    </p>
                 </div>
              </div>
           </div>

           <button
             type="submit"
             disabled={saving || formData.feeStructureIds.length === 0}
             className="w-full bg-forest-700 text-white p-6 rounded-xl font-semibold text-sm uppercase tracking-wide hover:bg-forest-800 shadow-xs shadow-sage-100 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
           >
              {saving ? <Loader2 className="animate-spin" size={20} /> : <FileText size={20}/>}
              Launch Billing Run
           </button>

           <div className="bg-terracotta-50 border border-terracotta-100 rounded-3xl p-6 flex items-start gap-4">
              <AlertCircle className="text-terracotta-500 shrink-0" size={20} />
              <p className="text-[11px] font-bold text-terracotta-700 leading-relaxed uppercase tracking-tight">
                 Ensure fee structures are correct before launching. Billing runs are logged and audited.
              </p>
           </div>
        </div>
      </form>
    </div>
  );
}

function formatCurrency(amount: number | string) {
  return `GH\u20b5 ${Number(amount || 0).toLocaleString('en-GH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function SummaryItem({ label, value }: any) {
  return (
    <div className="flex justify-between items-center">
       <span className="text-[11px] font-semibold text-warm-400 uppercase tracking-wide">{label}</span>
       <span className="text-base font-semibold text-white">{value}</span>
    </div>
  );
}
