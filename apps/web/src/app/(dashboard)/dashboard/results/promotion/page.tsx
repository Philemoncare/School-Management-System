'use client';

import React, { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api/client';
import {
  TrendingUp,
  ChevronLeft,
  Loader2,
  CheckCircle2,
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
      apiFetch('/academics/classes'),
      apiFetch('/academics/academic-years')
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
    if (!form.toClassId || !form.toAcademicYearId) return alert('Select target year and class');
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
      alert('Promotion failed');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="p-8 space-y-10">
      <div className="flex items-center gap-6">
        <Link href="/dashboard/results" className="p-3 bg-white border border-gray-200 rounded-2xl text-gray-400 hover:text-blue-600 transition-all shadow-sm">
          <ChevronLeft size={20}/>
        </Link>
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Student Promotion</h1>
          <p className="text-gray-500 font-bold mt-1 uppercase tracking-widest text-[10px]">Academic Year Transition & Mass Promotion Utility</p>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-[2.5rem] p-8 shadow-sm">
         <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <SelectField label="From Year" value={form.fromAcademicYearId} onChange={v => setForm({...form, fromAcademicYearId: v})} options={years.map(y => ({ label: y.name, value: y.id }))} />
            <SelectField label="From Class" value={form.fromClassId} onChange={v => setForm({...form, fromClassId: v})} options={classes.map(c => ({ label: c.name, value: c.id }))} />
            <SelectField label="To Year" value={form.toAcademicYearId} onChange={v => setForm({...form, toAcademicYearId: v})} options={years.map(y => ({ label: y.name, value: y.id }))} />
            <SelectField label="To Class" value={form.toClassId} onChange={v => setForm({...form, toClassId: v})} options={classes.map(c => ({ label: c.name, value: c.id }))} />
         </div>
         <button onClick={loadStudents} className="mt-8 bg-gray-900 text-white px-8 py-3 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-black transition-all flex items-center gap-2">
            <Search size={18} /> Load Candidates
         </button>
      </div>

      <div className="bg-white border border-gray-200 rounded-[2.5rem] shadow-sm overflow-hidden">
         <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
               <thead className="bg-gray-50/50">
                  <tr>
                     <th className="px-8 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Student</th>
                     <th className="px-8 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Performance</th>
                     <th className="px-8 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Status</th>
                     <th className="px-8 py-4 text-right text-[10px] font-black text-gray-400 uppercase tracking-widest">Action</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-gray-100 bg-white">
                  {students.map((student) => (
                    <tr key={student.id} className="hover:bg-gray-50/50 transition-all">
                       <td className="px-8 py-5">
                          <p className="text-sm font-black text-gray-900">{student.firstName} {student.lastName}</p>
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tight mt-0.5">{student.studentNumber}</p>
                       </td>
                       <td className="px-8 py-5">
                          <div className="flex items-center gap-2">
                             <span className="text-xs font-black text-emerald-600">82.4%</span>
                             <TrendingUp size={14} className="text-emerald-500" />
                          </div>
                       </td>
                       <td className="px-8 py-5">
                          <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-[9px] font-black uppercase">Eligible</span>
                       </td>
                       <td className="px-8 py-5 text-right">
                          <button
                            onClick={() => handlePromote(student.id)}
                            disabled={submitting}
                            className="bg-blue-600 text-white px-4 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-700 transition-all shadow-md shadow-blue-100 disabled:opacity-50"
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
       <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">{label}</label>
       <select value={value} onChange={e => onChange(e.target.value)} className="w-full bg-gray-50 border border-gray-100 rounded-2xl p-4 text-xs font-black uppercase outline-none focus:ring-2 focus:ring-blue-600/10">
          <option value="">Select...</option>
          {options.map((o: any) => <option key={o.value} value={o.value}>{o.label}</option>)}
       </select>
    </div>
  );
}
