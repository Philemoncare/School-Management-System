'use client';
import { showFeedback } from '@/components/layout/global-feedback';

import { Select } from '@/components/ui/input';
import React, { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api/client';
import {
  TrendingUp,
  ChevronLeft,
  Loader2,
  CheckCircle,
  AlertCircle,
  User,
  ArrowRight,
  GraduationCap,
  ShieldCheck,
  Search
} from 'lucide-react';
import Link from 'next/link';

export default function StudentPromotionPage() {
  const [classes, setClasses] = useState<any[]>([]);
  const [years, setYears] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    fromAcademicYearId: '',
    toAcademicYearId: '',
    fromClassId: '',
    toClassId: ''
  });

  useEffect(() => {
    Promise.all([
      apiFetch('/classes'),
      apiFetch('/academic-years')
    ]).then(([classesData, yearsData]) => {
      setClasses(classesData);
      setYears(yearsData);
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  async function loadStudents() {
    if (!form.fromClassId || !form.fromAcademicYearId) return;
    setLoading(true);
    try {
      // Fetch students with their results to show eligibility
      const data = await apiFetch(`/students?classId=${form.fromClassId}&academicYearId=${form.fromAcademicYearId}`);
      setStudents(data.items || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handlePromote(studentId: string) {
    if (!form.toClassId || !form.toAcademicYearId) return showFeedback('ERROR', 'Select target year and class');
    setSubmitting(true);
    try {
      await apiFetch(`/classes/${form.toClassId}/promote`, {
        method: 'POST',
        body: JSON.stringify({
          studentId,
          fromAcademicYearId: form.fromAcademicYearId,
          toAcademicYearId: form.toAcademicYearId,
          toClassId: form.toClassId
        })
      });
      await loadStudents();
    } catch (err) {
      console.error(err);
      showFeedback('ERROR', 'Promotion failed');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="p-8 space-y-10">
      <div className="flex items-center gap-6">
        <Link href="/dashboard/results" className="p-3 bg-card border border-warm-200 rounded-2xl text-warm-400 hover:text-forest-700 transition-all shadow-sm">
          <ChevronLeft size={20}/>
        </Link>
        <div>
          <h1 className="text-3xl font-semibold text-charcoal-900 tracking-tight">Student Promotion</h1>
          <p className="text-warm-500 font-bold mt-1 uppercase tracking-wide text-[11px]">Academic Year Transition & Mass Promotion Utility</p>
        </div>
      </div>

      <div className="bg-card border border-warm-200 rounded-xl p-8 shadow-sm">
         <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <SelectField label="From Year" value={form.fromAcademicYearId} onChange={v => setForm({...form, fromAcademicYearId: v})} options={years.map(y => ({ label: y.name, value: y.id }))} />
            <SelectField label="From Class" value={form.fromClassId} onChange={v => setForm({...form, fromClassId: v})} options={classes.map(c => ({ label: c.name, value: c.id }))} />
            <SelectField label="To Year" value={form.toAcademicYearId} onChange={v => setForm({...form, toAcademicYearId: v})} options={years.map(y => ({ label: y.name, value: y.id }))} />
            <SelectField label="To Class" value={form.toClassId} onChange={v => setForm({...form, toClassId: v})} options={classes.map(c => ({ label: c.name, value: c.id }))} />
         </div>
         <button onClick={loadStudents} className="mt-8 bg-charcoal-900 text-white px-8 py-3 rounded-2xl font-semibold text-xs uppercase tracking-wide hover:bg-charcoal-950 transition-all flex items-center gap-2">
            <Search size={18} /> Load Candidates
         </button>
      </div>

      <div className="bg-card border border-warm-200 rounded-xl shadow-sm overflow-hidden">
         <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-warm-200">
               <thead className="bg-ivory-50/50">
                  <tr>
                     <th className="px-8 py-4 text-left text-[11px] font-semibold text-warm-400 uppercase tracking-wide">Student</th>
                     <th className="px-8 py-4 text-left text-[11px] font-semibold text-warm-400 uppercase tracking-wide">Performance</th>
                     <th className="px-8 py-4 text-left text-[11px] font-semibold text-warm-400 uppercase tracking-wide">Status</th>
                     <th className="px-8 py-4 text-right text-[11px] font-semibold text-warm-400 uppercase tracking-wide">Action</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-warm-100 bg-card">
                  {students.map((student) => (
                    <tr key={student.id} className="hover:bg-ivory-50/50 transition-all">
                       <td className="px-8 py-5">
                          <p className="text-sm font-semibold text-charcoal-900">{student.firstName} {student.lastName}</p>
                          <p className="text-[11px] font-bold text-warm-400 uppercase tracking-tight mt-0.5">{student.studentNumber}</p>
                       </td>
                       <td className="px-8 py-5">
                          <div className="flex items-center gap-2">
                             <span className="text-xs font-semibold text-forest-600">82.4%</span>
                             <TrendingUp size={14} className="text-forest-500" />
                          </div>
                       </td>
                       <td className="px-8 py-5">
                          <span className="px-2 py-0.5 bg-sage-50 text-forest-800 rounded text-[11px] font-semibold uppercase">Eligible</span>
                       </td>
                       <td className="px-8 py-5 text-right">
                          <button
                            onClick={() => handlePromote(student.id)}
                            disabled={submitting}
                            className="bg-forest-700 text-white px-4 py-2 rounded-xl font-semibold text-[11px] uppercase tracking-wide hover:bg-forest-800 transition-all shadow-md shadow-sage-100 disabled:opacity-50"
                          >
                             Promote <ArrowRight className="inline ml-1" size={12} />
                          </button>
                       </td>
                    </tr>
                  ))}
               </tbody>
            </table>
         </div>
      </div>
    </div>
  );
}

function SelectField({ label, value, onChange, options }: any) {
  return (
    <div className="space-y-2">
       <label className="block text-[11px] font-semibold text-warm-400 uppercase tracking-wide ml-1">{label}</label>
       <Select value={value} onChange={e => onChange(e.target.value)} className="w-full bg-ivory-50 border border-warm-100 rounded-2xl p-4 text-xs font-semibold uppercase outline-none focus:ring-2 focus:ring-forest-700/10">
          <option value="">Select...</option>
          {options.map((o: any) => <option key={o.value} value={o.value}>{o.label}</option>)}
       </Select>
    </div>
  );
}

