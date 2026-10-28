'use client';

import { Select } from '@/components/ui/input';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api/client';
import {
  ChevronLeft,
  Save,
  Loader2,
  Layers,
  Calendar,
  DollarSign,
  Building2,
  CheckCircle
} from 'lucide-react';

export default function NewFeeStructurePage() {
  const router = useRouter();
  const [categories, setCategories] = useState<any[]>([]);
  const [years, setYears] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    academicYearId: '',
    termId: '',
    classId: '',
    feeCategoryId: '',
    amount: '',
    isMandatory: true,
    dueDate: new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString().split('T')[0],
  });

  useEffect(() => {
    loadOptions();
  }, []);

  async function loadOptions() {
    try {
      const [catData, yearData, classData] = await Promise.all([
        apiFetch('/finance/fee-categories'),
        apiFetch('/academic-years'),
        apiFetch('/classes'),
      ]);
      setCategories(catData);
      setYears(yearData);
      setClasses(classData);

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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await apiFetch('/finance/fee-structures', {
        method: 'POST',
        body: JSON.stringify({
          ...formData,
          amount: parseFloat(formData.amount),
          dueDate: new Date(formData.dueDate),
        })
      });
      router.push('/accountant/fees');
    } catch (err) {
      alert('Failed to create fee structure');
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="p-20 text-center"><Loader2 className="animate-spin mx-auto text-forest-700" size={48} /></div>;

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-10">
      <div className="flex items-center gap-4">
        <button onClick={() => router.back()} className="p-2.5 bg-card border border-warm-200 rounded-2xl hover:bg-ivory-50 transition-colors shadow-sm text-warm-500">
           <ChevronLeft size={20} />
        </button>
        <div>
          <h1 className="text-3xl font-semibold text-charcoal-900 tracking-tight">New Fee Item</h1>
          <p className="text-warm-500 font-bold mt-1 uppercase tracking-wide text-[11px]">Configure structure and amount for student billing</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        <section className="bg-card border border-warm-200 rounded-xl p-10 shadow-sm space-y-8">
           <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <InputGroup label="Internal Name" value={formData.name} onChange={(v) => setFormData({...formData, name: v})} placeholder="e.g. 2026 Term 1 Tuition" icon={<Layers size={16}/>} />

              <div>
                 <label className="block text-[11px] font-semibold text-warm-400 uppercase tracking-wide mb-3 px-1">Fee Category</label>
                 <Select
                   required
                   className="w-full bg-ivory-50 border-none rounded-2xl px-5 py-3.5 text-sm font-bold text-charcoal-900 focus:ring-2 focus:ring-forest-700"
                   value={formData.feeCategoryId}
                   onChange={(e) => setFormData({...formData, feeCategoryId: e.target.value})}
                 >
                    <option value="">Select Category...</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                 </Select>
              </div>

              <div>
                 <label className="block text-[11px] font-semibold text-warm-400 uppercase tracking-wide mb-3 px-1">Academic Year</label>
                 <Select
                   required
                   className="w-full bg-ivory-50 border-none rounded-2xl px-5 py-3.5 text-sm font-bold text-charcoal-900 focus:ring-2 focus:ring-forest-700"
                   value={formData.academicYearId}
                   onChange={(e) => setFormData({...formData, academicYearId: e.target.value})}
                 >
                    <option value="">Select Year...</option>
                    {years.map(y => <option key={y.id} value={y.id}>{y.name}</option>)}
                 </Select>
              </div>

              <div>
                 <label className="block text-[11px] font-semibold text-warm-400 uppercase tracking-wide mb-3 px-1">Target Class (Optional)</label>
                 <Select
                   className="w-full bg-ivory-50 border-none rounded-2xl px-5 py-3.5 text-sm font-bold text-charcoal-900 focus:ring-2 focus:ring-forest-700"
                   value={formData.classId}
                   onChange={(e) => setFormData({...formData, classId: e.target.value})}
                 >
                    <option value="">All Classes</option>
                    {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                 </Select>
              </div>

              <InputGroup label="Total Amount" value={formData.amount} onChange={(v) => setFormData({...formData, amount: v})} placeholder="0.00" type="number" icon={<DollarSign size={16}/>} />

              <div>
                 <label className="block text-[11px] font-semibold text-warm-400 uppercase tracking-wide mb-3 px-1">Payment Deadline</label>
                 <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-warm-400"><Calendar size={16}/></div>
                    <input
                      type="date"
                      required
                      className="w-full bg-ivory-50 border-none rounded-2xl pl-11 pr-4 py-3.5 text-sm font-bold text-charcoal-900 focus:ring-2 focus:ring-forest-700"
                      value={formData.dueDate}
                      onChange={(e) => setFormData({...formData, dueDate: e.target.value})}
                    />
                 </div>
              </div>
           </div>

           <div className="pt-6 border-t border-ivory-50 flex items-center gap-3">
              <input
                type="checkbox"
                id="isMandatory"
                className="w-5 h-5 rounded-lg border-warm-200 text-forest-700 focus:ring-forest-500"
                checked={formData.isMandatory}
                onChange={(e) => setFormData({...formData, isMandatory: e.target.checked})}
              />
              <label htmlFor="isMandatory" className="text-sm font-bold text-warm-700">This fee is mandatory for all students in scope</label>
           </div>
        </section>

        <div className="flex justify-end gap-4">
           <button
             type="button"
             onClick={() => router.back()}
             className="px-10 py-4 rounded-2xl font-semibold text-xs uppercase tracking-wide text-warm-500 hover:bg-warm-100 transition-all"
           >
              Cancel
           </button>
           <button
             type="submit"
             disabled={saving}
             className="bg-forest-700 text-white px-10 py-4 rounded-2xl font-semibold text-xs uppercase tracking-wide hover:bg-forest-800 shadow-xs shadow-sage-100 transition-all flex items-center gap-3 disabled:opacity-50"
           >
              {saving ? <Loader2 className="animate-spin" size={18} /> : <CheckCircle size={18} />}
              Initialize Structure
           </button>
        </div>
      </form>
    </div>
  );
}

function InputGroup({ label, value, onChange, placeholder, icon, type = "text" }: any) {
  return (
    <div>
      <label className="block text-[11px] font-semibold text-warm-400 uppercase tracking-wide mb-3 px-1">{label}</label>
      <div className="relative">
         <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-warm-400">{icon}</div>
         <input
           type={type}
           required
           placeholder={placeholder}
           className="w-full bg-ivory-50 border-none rounded-2xl pl-11 pr-4 py-3.5 text-sm font-bold text-charcoal-900 focus:ring-2 focus:ring-forest-700 transition-all"
           value={value}
           onChange={(e) => onChange(e.target.value)}
         />
      </div>
    </div>
  );
}

