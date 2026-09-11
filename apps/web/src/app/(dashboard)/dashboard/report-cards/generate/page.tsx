'use client';

import React, { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api/client';
import {
  FileText,
  ChevronLeft,
  Loader2,
  CheckCircle2,
  Printer,
  Download,
  Users,
  Search,
  Filter,
  ArrowRight,
  Settings2
} from 'lucide-react';
import Link from 'next/link';

export default function BatchReportCardGeneration() {
  const [classes, setClasses] = useState<any[]>([]);
  const [years, setYears] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<any>(null);

  const [form, setForm] = useState({
    academicYearId: '',
    termId: '',
    classId: ''
  });

  useEffect(() => {
    Promise.all([
      apiFetch('/academics/classes'),
      apiFetch('/academics/academic-years')
    ]).then(([classesData, yearsData]) => {
      setClasses(classesData);
      setYears(yearsData);
      if (yearsData.length > 0) {
        setForm(prev => ({ ...prev, academicYearId: yearsData.find((y: any) => y.isCurrent)?.id || yearsData[0].id }));
      }
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setSuccess(null);
    try {
      const res = await apiFetch('/results/report-cards/generate', {
        method: 'POST',
        body: JSON.stringify(form)
      });
      setSuccess(res);
    } catch (err) {
      console.error(err);
      alert('Generation failed. Ensure results are published for this class/term.');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <div className="p-20 text-center"><Loader2 className="animate-spin mx-auto text-blue-600" size={48} /></div>;

  return (
    <div className="p-8 space-y-10 max-w-4xl mx-auto">
      <div className="flex items-center gap-6">
        <Link href="/dashboard/results" className="p-3 bg-white border border-gray-200 rounded-2xl text-gray-400 hover:text-blue-600 transition-all shadow-sm">
          <ChevronLeft size={20}/>
        </Link>
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Batch Report Cards</h1>
          <p className="text-gray-500 font-bold mt-1 uppercase tracking-widest text-[10px]">Official Terminal Academic Records Generation</p>
        </div>
      </div>

      {!success ? (
         <div className="bg-white border border-gray-200 rounded-[2.5rem] shadow-sm overflow-hidden">
            <div className="bg-gray-900 p-8 text-white">
               <h3 className="text-lg font-black tracking-tight mb-2">Generation Parameters</h3>
               <p className="text-gray-400 text-xs font-medium uppercase tracking-widest">Select class and academic period to begin bulk processing.</p>
            </div>

            <form onSubmit={handleGenerate} className="p-10 space-y-10">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-2">
                     <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Academic Year</label>
                     <select
                        required
                        value={form.academicYearId}
                        onChange={e => setForm({...form, academicYearId: e.target.value})}
                        className="w-full bg-gray-50 border border-gray-100 rounded-2xl p-5 text-sm font-black focus:ring-2 focus:ring-blue-600/10 transition-all outline-none"
                     >
                        <option value="">Select Year...</option>
                        {years.map(y => <option key={y.id} value={y.id}>{y.name}</option>)}
                     </select>
                  </div>
                  <div className="space-y-2">
                     <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Term / Semester</label>
                     <select
                        required
                        value={form.termId}
                        onChange={e => setForm({...form, termId: e.target.value})}
                        className="w-full bg-gray-50 border border-gray-100 rounded-2xl p-5 text-sm font-black focus:ring-2 focus:ring-blue-600/10 transition-all outline-none"
                     >
                        <option value="">Select Term...</option>
                        {years.find(y => y.id === form.academicYearId)?.terms?.map((t: any) => (
                           <option key={t.id} value={t.id}>{t.name}</option>
                        ))}
                     </select>
                  </div>
                  <div className="space-y-2 md:col-span-2">
                     <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Select Target Class</label>
                     <select
                        required
                        value={form.classId}
                        onChange={e => setForm({...form, classId: e.target.value})}
                        className="w-full bg-gray-50 border border-gray-100 rounded-2xl p-5 text-sm font-black focus:ring-2 focus:ring-blue-600/10 transition-all outline-none"
                     >
                        <option value="">Choose Class...</option>
                        {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                     </select>
                  </div>
               </div>

               <div className="pt-8 border-t border-gray-100 flex flex-col md:flex-row gap-6 items-center justify-between">
                  <div className="flex items-center gap-3 text-amber-600">
                     <Settings2 size={20}/>
                     <p className="text-[10px] font-bold uppercase tracking-tight leading-relaxed max-w-xs">
                        Report cards will be generated based on current published result snapshots and school branding templates.
                     </p>
                  </div>
                  <button
                     type="submit"
                     disabled={submitting}
                     className="w-full md:w-auto bg-blue-600 text-white px-12 py-5 rounded-[1.5rem] font-black text-xs uppercase tracking-widest hover:bg-blue-700 transition-all shadow-xl shadow-blue-100 flex items-center justify-center gap-3 disabled:opacity-50"
                  >
                     {submitting ? <Loader2 className="animate-spin" size={20}/> : <FileText size={20}/>}
                     Initialize Batch Process
                  </button>
               </div>
            </form>
         </div>
      ) : (
         <div className="bg-white border border-gray-200 rounded-[2.5rem] p-12 text-center space-y-8 animate-fadeIn">
            <div className="w-24 h-24 bg-green-50 rounded-[2rem] flex items-center justify-center text-green-600 mx-auto shadow-inner">
               <CheckCircle2 size={48} />
            </div>
            <div>
               <h2 className="text-3xl font-black text-gray-900 tracking-tight">Generation Complete</h2>
               <p className="text-gray-500 font-medium mt-2">{success.message}</p>
            </div>
            <div className="flex flex-col md:flex-row gap-4 justify-center pt-6">
               <button className="bg-gray-900 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-black transition-all flex items-center justify-center gap-2">
                  <Download size={18} /> Download All (PDF)
               </button>
               <button onClick={() => setSuccess(null)} className="bg-white border border-gray-200 text-gray-700 px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-gray-50 transition-all">
                  Generate Another Batch
               </button>
            </div>
         </div>
      )}
    </div>
  );
}
