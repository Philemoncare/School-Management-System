'use client';

import { Select } from '@/components/ui/input';
import React, { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api/client';
import {
  FileText,
  ChevronLeft,
  Loader2,
  CheckCircle,
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

  if (loading) return <div className="p-20 text-center"><Loader2 className="animate-spin mx-auto text-forest-700" size={48} /></div>;

  return (
    <div className="p-8 space-y-10 max-w-4xl mx-auto">
      <div className="flex items-center gap-6">
        <Link href="/dashboard/results" className="p-3 bg-card border border-warm-200 rounded-2xl text-warm-400 hover:text-forest-700 transition-all shadow-sm">
          <ChevronLeft size={20}/>
        </Link>
        <div>
          <h1 className="text-3xl font-semibold text-charcoal-900 tracking-tight">Batch Report Cards</h1>
          <p className="text-warm-500 font-bold mt-1 uppercase tracking-wide text-[11px]">Official Terminal Academic Records Generation</p>
        </div>
      </div>

      {!success ? (
         <div className="bg-card border border-warm-200 rounded-xl shadow-sm overflow-hidden">
            <div className="bg-charcoal-900 p-8 text-white">
               <h3 className="text-lg font-semibold tracking-tight mb-2">Generation Parameters</h3>
               <p className="text-warm-400 text-xs font-medium uppercase tracking-wide">Select class and academic period to begin bulk processing.</p>
            </div>

            <form onSubmit={handleGenerate} className="p-10 space-y-10">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-2">
                     <label className="block text-[11px] font-semibold text-warm-400 uppercase tracking-wide ml-1">Academic Year</label>
                     <Select
                        required
                        value={form.academicYearId}
                        onChange={e => setForm({...form, academicYearId: e.target.value})}
                        className="w-full bg-ivory-50 border border-warm-100 rounded-2xl p-5 text-sm font-semibold focus:ring-2 focus:ring-forest-700/10 transition-all outline-none"
                     >
                        <option value="">Select Year...</option>
                        {years.map(y => <option key={y.id} value={y.id}>{y.name}</option>)}
                     </Select>
                  </div>
                  <div className="space-y-2">
                     <label className="block text-[11px] font-semibold text-warm-400 uppercase tracking-wide ml-1">Term / Semester</label>
                     <Select
                        required
                        value={form.termId}
                        onChange={e => setForm({...form, termId: e.target.value})}
                        className="w-full bg-ivory-50 border border-warm-100 rounded-2xl p-5 text-sm font-semibold focus:ring-2 focus:ring-forest-700/10 transition-all outline-none"
                     >
                        <option value="">Select Term...</option>
                        {years.find(y => y.id === form.academicYearId)?.terms?.map((t: any) => (
                           <option key={t.id} value={t.id}>{t.name}</option>
                        ))}
                     </Select>
                  </div>
                  <div className="space-y-2 md:col-span-2">
                     <label className="block text-[11px] font-semibold text-warm-400 uppercase tracking-wide ml-1">Select Target Class</label>
                     <Select
                        required
                        value={form.classId}
                        onChange={e => setForm({...form, classId: e.target.value})}
                        className="w-full bg-ivory-50 border border-warm-100 rounded-2xl p-5 text-sm font-semibold focus:ring-2 focus:ring-forest-700/10 transition-all outline-none"
                     >
                        <option value="">Choose Class...</option>
                        {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                     </Select>
                  </div>
               </div>

               <div className="pt-8 border-t border-warm-100 flex flex-col md:flex-row gap-6 items-center justify-between">
                  <div className="flex items-center gap-3 text-warning-600">
                     <Settings2 size={20}/>
                     <p className="text-[11px] font-bold uppercase tracking-tight leading-relaxed max-w-xs">
                        Report cards will be generated based on current published result snapshots and school branding templates.
                     </p>
                  </div>
                  <button
                     type="submit"
                     disabled={submitting}
                     className="w-full md:w-auto bg-forest-700 text-white px-12 py-5 rounded-xl font-semibold text-xs uppercase tracking-wide hover:bg-forest-800 transition-all shadow-xs shadow-sage-100 flex items-center justify-center gap-3 disabled:opacity-50"
                  >
                     {submitting ? <Loader2 className="animate-spin" size={20}/> : <FileText size={20}/>}
                     Initialize Batch Process
                  </button>
               </div>
            </form>
         </div>
      ) : (
         <div className="bg-card border border-warm-200 rounded-xl p-12 text-center space-y-8 animate-fadeIn">
            <div className="w-24 h-24 bg-success-50 rounded-xl flex items-center justify-center text-success-600 mx-auto shadow-inner">
               <CheckCircle size={48} />
            </div>
            <div>
               <h2 className="text-3xl font-semibold text-charcoal-900 tracking-tight">Generation Complete</h2>
               <p className="text-warm-500 font-medium mt-2">{success.message}</p>
            </div>
            <div className="flex flex-col md:flex-row gap-4 justify-center pt-6">
               <button className="bg-charcoal-900 text-white px-8 py-4 rounded-2xl font-semibold text-xs uppercase tracking-wide hover:bg-charcoal-950 transition-all flex items-center justify-center gap-2">
                  <Download size={18} /> Download All (PDF)
               </button>
               <button onClick={() => setSuccess(null)} className="bg-card border border-warm-200 text-warm-700 px-8 py-4 rounded-2xl font-semibold text-xs uppercase tracking-wide hover:bg-ivory-50 transition-all">
                  Generate Another Batch
               </button>
            </div>
         </div>
      )}
    </div>
  );
}

