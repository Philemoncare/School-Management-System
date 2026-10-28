'use client';

import React, { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api/client';
import {
  PieChart,
  TrendingUp,
  FileText,
  Calculator,
  UploadCloud,
  Loader2,
  ChevronRight,
  Search,
  Filter,
  CheckCircle,
  AlertCircle,
  Users,
  GraduationCap,
  History,
  Lock,
  Unlock
} from 'lucide-react';
import Link from 'next/link';
import { Select } from '@/components/ui/input';

export default function ResultsCommandCenter() {
  const [classes, setClasses] = useState<any[]>([]);
  const [years, setYears] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);

  // Form states for bulk calculation
  const [config, setConfig] = useState({
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
        setConfig(prev => ({ ...prev, academicYearId: yearsData.find((y: any) => y.isCurrent)?.id || yearsData[0].id }));
      }
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  async function handleCalculate() {
    if (!config.classId || !config.academicYearId) return alert('Please select a class and year');
    setProcessing('calculating');
    try {
      await apiFetch('/results/calculate', {
        method: 'POST',
        body: JSON.stringify(config)
      });
      alert('Results calculated and ranked successfully');
    } catch (err) {
      console.error(err);
      alert('Calculation failed');
    } finally {
      setProcessing(null);
    }
  }

  async function handlePublish() {
    if (!config.classId || !config.academicYearId) return alert('Please select a class and year');
    if (!confirm('This will make results visible to students and parents. Proceed?')) return;
    setProcessing('publishing');
    try {
      await apiFetch('/results/publish', {
        method: 'POST',
        body: JSON.stringify(config)
      });
      alert('Results published successfully');
    } catch (err) {
      console.error(err);
      alert('Publication failed');
    } finally {
      setProcessing(null);
    }
  }

  if (loading) return <div className="p-20 text-center"><Loader2 className="animate-spin mx-auto text-forest-700" size={48} /></div>;

  return (
    <div className="p-8 space-y-10">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-semibold text-charcoal-900 tracking-tight">Academic Results</h1>
          <p className="text-warm-500 mt-1 font-medium text-sm">Calculate scores, verify grades, and publish report cards.</p>
        </div>
        <div className="flex gap-4">
           <Link href="/dashboard/results/corrections" className="bg-card border border-warm-200 text-warm-700 px-6 py-3 rounded-2xl font-semibold text-xs uppercase tracking-wide hover:bg-ivory-50 transition-all shadow-sm flex items-center gap-2">
             <History size={18} /> Correction Logs
           </Link>
           <Link href="/dashboard/report-cards/generate" className="bg-charcoal-900 text-white px-6 py-3 rounded-2xl font-semibold text-xs uppercase tracking-wide hover:bg-charcoal-950 transition-all shadow-xs flex items-center gap-2">
             <FileText size={18} /> Batch Report Cards
           </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
           <section className="bg-card border border-warm-200 rounded-xl p-8 shadow-sm">
              <h3 className="text-xl font-semibold text-charcoal-900 tracking-tight mb-8 flex items-center gap-3">
                 <Calculator className="text-forest-700" /> Result Processing Engine
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                 <SelectField
                    label="Academic Year"
                    value={config.academicYearId}
                    onChange={v => setConfig({...config, academicYearId: v})}
                    options={years.map(y => ({ label: y.name, value: y.id }))}
                 />
                 <SelectField
                    label="Term / Semester"
                    value={config.termId}
                    onChange={v => setConfig({...config, termId: v})}
                    options={years.find(y => y.id === config.academicYearId)?.terms?.map((t: any) => ({ label: t.name, value: t.id })) || []}
                 />
                 <SelectField
                    label="Target Class"
                    value={config.classId}
                    onChange={v => setConfig({...config, classId: v})}
                    options={classes.map(c => ({ label: c.name, value: c.id }))}
                 />
              </div>

              <div className="flex flex-col md:flex-row gap-4 pt-8 border-t border-warm-100">
                 <button
                    onClick={handleCalculate}
                    disabled={!!processing}
                    className="flex-1 bg-sage-50 text-forest-700 py-6 rounded-xl font-semibold text-xs uppercase tracking-wide hover:bg-sage-100 transition-all flex flex-col items-center gap-3 border-2 border-transparent hover:border-sage-200"
                 >
                    {processing === 'calculating' ? <Loader2 className="animate-spin" size={24} /> : <Calculator size={24} />}
                    Calculate Subject Totals & Ranks
                 </button>
                 <button
                    onClick={handlePublish}
                    disabled={!!processing}
                    className="flex-1 bg-success-50 text-success-700 py-6 rounded-xl font-semibold text-xs uppercase tracking-wide hover:bg-success-100 transition-all flex flex-col items-center gap-3 border-2 border-transparent hover:border-success-200"
                 >
                    {processing === 'publishing' ? <Loader2 className="animate-spin" size={24} /> : <UploadCloud size={24} />}
                    Publish Official Results to Portal
                 </button>
              </div>
           </section>

           <section className="bg-card border border-warm-200 rounded-xl p-8 shadow-sm">
              <div className="flex justify-between items-center mb-8">
                 <h3 className="text-xl font-semibold text-charcoal-900 tracking-tight">Recent Publications</h3>
                 <Link href="/dashboard/results/history" className="text-[11px] font-semibold text-forest-700 uppercase tracking-wide flex items-center gap-1">Full History <ChevronRight size={14}/></Link>
              </div>
              <div className="space-y-4">
                 <PublicationItem label="Grade 10 - Science" time="2 hours ago" status="PUBLISHED" count={42} />
                 <PublicationItem label="Grade 12 - Mathematics" time="Yesterday" status="LOCKED" count={128} />
                 <PublicationItem label="JHS 3 - Final Mock" time="3 days ago" status="PUBLISHED" count={95} />
              </div>
           </section>
        </div>

        <div className="space-y-8">
           <section className="bg-charcoal-900 rounded-xl p-8 shadow-xs text-white">
              <h3 className="text-lg font-semibold mb-8 tracking-tight flex items-center gap-2">
                 <TrendingUp className="text-sage-400" /> Academic Analytics
              </h3>
              <div className="space-y-6">
                 <div className="p-5 bg-card/5 rounded-2xl border border-white/5">
                    <p className="text-[11px] font-semibold text-warm-400 uppercase tracking-wide mb-1">Overall Pass Rate</p>
                    <p className="text-3xl font-semibold">94.2%</p>
                    <div className="mt-3 h-1.5 bg-card/10 rounded-full overflow-hidden">
                       <div className="h-full bg-forest-500 w-[94.2%]" />
                    </div>
                 </div>
                 <div className="p-5 bg-card/5 rounded-2xl border border-white/5">
                    <p className="text-[11px] font-semibold text-warm-400 uppercase tracking-wide mb-1">Top Subject</p>
                    <p className="text-xl font-semibold">English Literature</p>
                    <p className="text-[11px] font-bold text-warm-500 uppercase mt-1">Average: 82.4%</p>
                 </div>
              </div>
           </section>

           <div className="bg-forest-700 rounded-xl p-8 shadow-xs text-white relative overflow-hidden group">
              <div className="relative z-10">
                 <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                    <Lock size={20}/> Result Integrity
                 </h3>
                 <p className="text-sage-100 text-xs font-medium leading-relaxed opacity-80 uppercase tracking-tight">
                    Published results are cryptographically timestamped and locked. Any changes require formal administrative override.
                 </p>
              </div>
              <Lock size={120} className="absolute -bottom-10 -right-10 text-white/5 -rotate-12 group-hover:rotate-0 transition-transform duration-700" />
           </div>
        </div>
      </div>
    </div>
  );
}

function SelectField({ label, value, onChange, options }: any) {
  return (
    <Select
      label={label}
      value={value}
      onChange={(e: any) => onChange(e.target.value)}
      options={[{ label: 'Select...', value: '' }, ...options]}
    />
  );
}

function PublicationItem({ label, time, status, count }: any) {
  return (
    <div className="flex items-center justify-between p-6 bg-ivory-50 rounded-xl border border-warm-100 hover:border-sage-200 transition-all">
       <div className="flex items-center gap-5">
          <div className="p-3 bg-card rounded-2xl text-warm-400">
             {status === 'LOCKED' ? <Lock size={20}/> : <UploadCloud size={20}/>}
          </div>
          <div>
             <p className="text-sm font-semibold text-charcoal-900">{label}</p>
             <p className="text-[11px] font-bold text-warm-400 uppercase tracking-tight">{count} Students • {time}</p>
          </div>
       </div>
       <span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold uppercase ${
          status === 'LOCKED' ? 'bg-warning-50 text-warning-700' : 'bg-success-50 text-success-700'
       }`}>{status}</span>
    </div>
  );
}

