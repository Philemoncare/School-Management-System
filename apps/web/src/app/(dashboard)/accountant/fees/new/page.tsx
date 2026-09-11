'use client';

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
  CheckCircle2
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

  if (loading) return <div className="p-20 text-center"><Loader2 className="animate-spin mx-auto text-blue-600" size={48} /></div>;

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-10">
      <div className="flex items-center gap-4">
        <button onClick={() => router.back()} className="p-2.5 bg-white border border-gray-200 rounded-2xl hover:bg-gray-50 transition-colors shadow-sm text-gray-500">
           <ChevronLeft size={20} />
        </button>
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">New Fee Item</h1>
          <p className="text-gray-500 font-bold mt-1 uppercase tracking-widest text-[10px]">Configure structure and amount for student billing</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        <section className="bg-white border border-gray-200 rounded-[2.5rem] p-10 shadow-sm space-y-8">
           <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <InputGroup label="Internal Name" value={formData.name} onChange={(v) => setFormData({...formData, name: v})} placeholder="e.g. 2026 Term 1 Tuition" icon={<Layers size={16}/>} />

              <div>
                 <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 px-1">Fee Category</label>
                 <select
                   required
                   className="w-full bg-gray-50 border-none rounded-2xl px-5 py-3.5 text-sm font-bold text-gray-900 focus:ring-2 focus:ring-blue-600"
                   value={formData.feeCategoryId}
                   onChange={(e) => setFormData({...formData, feeCategoryId: e.target.value})}
                 >
                    <option value="">Select Category...</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                 </select>
              </div>

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
                 <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 px-1">Target Class (Optional)</label>
                 <select
                   className="w-full bg-gray-50 border-none rounded-2xl px-5 py-3.5 text-sm font-bold text-gray-900 focus:ring-2 focus:ring-blue-600"
                   value={formData.classId}
                   onChange={(e) => setFormData({...formData, classId: e.target.value})}
                 >
                    <option value="">All Classes</option>
                    {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                 </select>
              </div>

              <InputGroup label="Total Amount" value={formData.amount} onChange={(v) => setFormData({...formData, amount: v})} placeholder="0.00" type="number" icon={<DollarSign size={16}/>} />

              <div>
                 <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 px-1">Payment Deadline</label>
                 <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400"><Calendar size={16}/></div>
                    <input
                      type="date"
                      required
                      className="w-full bg-gray-50 border-none rounded-2xl pl-11 pr-4 py-3.5 text-sm font-bold text-gray-900 focus:ring-2 focus:ring-blue-600"
                      value={formData.dueDate}
                      onChange={(e) => setFormData({...formData, dueDate: e.target.value})}
                    />
                 </div>
              </div>
           </div>

           <div className="pt-6 border-t border-gray-50 flex items-center gap-3">
              <input
                type="checkbox"
                id="isMandatory"
                className="w-5 h-5 rounded-lg border-gray-200 text-blue-600 focus:ring-blue-500"
                checked={formData.isMandatory}
                onChange={(e) => setFormData({...formData, isMandatory: e.target.checked})}
              />
              <label htmlFor="isMandatory" className="text-sm font-bold text-gray-700">This fee is mandatory for all students in scope</label>
           </div>
        </section>

        <div className="flex justify-end gap-4">
           <button
             type="button"
             onClick={() => router.back()}
             className="px-10 py-4 rounded-2xl font-black text-xs uppercase tracking-widest text-gray-500 hover:bg-gray-100 transition-all"
           >
              Cancel
           </button>
           <button
             type="submit"
             disabled={saving}
             className="bg-blue-600 text-white px-10 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-blue-700 shadow-xl shadow-blue-100 transition-all flex items-center gap-3 disabled:opacity-50"
           >
              {saving ? <Loader2 className="animate-spin" size={18} /> : <CheckCircle2 size={18} />}
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
      <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 px-1">{label}</label>
      <div className="relative">
         <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">{icon}</div>
         <input
           type={type}
           required
           placeholder={placeholder}
           className="w-full bg-gray-50 border-none rounded-2xl pl-11 pr-4 py-3.5 text-sm font-bold text-gray-900 focus:ring-2 focus:ring-blue-600 transition-all"
           value={value}
           onChange={(e) => onChange(e.target.value)}
         />
      </div>
    </div>
  );
}
