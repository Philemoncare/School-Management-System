'use client';

import React, { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api/client';
import {
  Calendar,
  Clock,
  LayoutGrid,
  Plus,
  Search,
  Filter,
  MoreVertical,
  ChevronRight,
  Loader2,
  AlertCircle,
  CheckCircle,
  Users,
  MapPin,
  BookOpen,
  ClipboardList,
  History,
  FileText
} from 'lucide-react';
import Link from 'next/link';

export default function ExaminationsDashboard() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch('/results/exam-periods')
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-20 text-center"><Loader2 className="animate-spin mx-auto text-forest-700" size={48} /></div>;

  return (
    <div className="p-8 space-y-10">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-semibold text-charcoal-900 tracking-tight">Examinations & Sessions</h1>
          <p className="text-warm-500 mt-1 font-medium text-sm">Manage formal examination periods, schedules, and hall allocations.</p>
        </div>
        <div className="flex gap-4">
           <Link href="/dashboard/examinations/periods/new" className="bg-forest-700 text-white px-6 py-3 rounded-2xl font-semibold text-xs uppercase tracking-wide hover:bg-forest-800 transition-all shadow-xs shadow-sage-200 flex items-center gap-2">
             <Plus size={18} /> New Exam Period
           </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <KpiCard title="Active Periods" value={data.filter(p => p.status === 'ACTIVE').length} sub="Ongoing Exams" icon={<Calendar className="text-forest-700"/>} color="bg-sage-50" />
        <KpiCard title="Upcoming Sessions" value="24" sub="Next 7 Days" icon={<Clock className="text-warning-600"/>} color="bg-warning-50" />
        <KpiCard title="Completion Rate" value="85%" sub="Scores Entered" icon={<CheckCircle className="text-success-600"/>} color="bg-success-50" />
      </div>

      <div className="bg-card border border-warm-200 rounded-xl shadow-sm overflow-hidden">
        <div className="p-6 border-b border-warm-100 flex items-center justify-between bg-ivory-50/50">
           <h3 className="text-sm font-semibold uppercase tracking-wide text-charcoal-900">Examination Registry</h3>
           <div className="flex gap-3">
              <Link href="/dashboard/examinations/sessions" className="px-4 py-2 bg-card border border-warm-200 rounded-xl text-[11px] font-semibold uppercase tracking-wide text-warm-500 hover:bg-ivory-50 transition-all flex items-center gap-2 shadow-sm">
                 <ClipboardList size={14}/> View All Sessions
              </Link>
           </div>
        </div>

        <div className="p-8">
           <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {data.map((period) => (
                <div key={period.id} className="p-8 border border-warm-100 rounded-xl bg-ivory-50/50 hover:bg-card hover:shadow-xs transition-all group">
                   <div className="flex justify-between items-start mb-6">
                      <div className="p-4 bg-card rounded-2xl shadow-sm group-hover:bg-forest-700 group-hover:text-white transition-all">
                         <Calendar size={28} />
                      </div>
                      <span className={`px-3 py-1 rounded-full text-[11px] font-semibold uppercase tracking-wide ${
                         period.status === 'ACTIVE' ? 'bg-success-100 text-success-700' :
                         period.status === 'COMPLETED' ? 'bg-sage-100 text-forest-800' : 'bg-warm-200 text-warm-600'
                      }`}>{period.status}</span>
                   </div>

                   <h4 className="text-xl font-semibold text-charcoal-900">{period.name}</h4>
                   <p className="text-[11px] font-bold text-warm-400 uppercase tracking-wide mt-1 flex items-center gap-2">
                      <FileText size={12}/> {period.code} • {period.academicYear.name}
                   </p>

                   <div className="mt-8 grid grid-cols-2 gap-4">
                      <div className="p-4 bg-card rounded-2xl border border-warm-100">
                         <p className="text-[11px] font-semibold text-warm-400 uppercase tracking-wide">Start Date</p>
                         <p className="text-sm font-semibold text-charcoal-900">{new Date(period.startDate).toLocaleDateString()}</p>
                      </div>
                      <div className="p-4 bg-card rounded-2xl border border-warm-100">
                         <p className="text-[11px] font-semibold text-warm-400 uppercase tracking-wide">End Date</p>
                         <p className="text-sm font-semibold text-charcoal-900">{new Date(period.endDate).toLocaleDateString()}</p>
                      </div>
                   </div>

                   <div className="mt-8 flex justify-between items-center">
                      <div className="flex items-center gap-2">
                         <div className="flex -space-x-2">
                            {[1,2,3].map(i => <div key={i} className="w-6 h-6 rounded-full bg-warm-200 border-2 border-white" />)}
                         </div>
                         <p className="text-[11px] font-bold text-warm-400">Scores Pending Approval</p>
                      </div>
                      <Link href={`/dashboard/examinations/periods/${period.id}`} className="p-3 bg-card border border-warm-200 rounded-xl text-warm-400 hover:text-forest-700 transition-all shadow-sm group-hover:border-sage-100">
                         <ChevronRight size={18} />
                      </Link>
                   </div>
                </div>
              ))}
           </div>

           {data.length === 0 && (
             <div className="py-20 text-center border-2 border-dashed border-warm-100 rounded-xl space-y-4">
                <ClipboardList className="mx-auto text-warm-200" size={64} />
                <h3 className="text-xl font-semibold text-charcoal-900">No Examination Periods</h3>
                <p className="text-warm-500 max-w-sm mx-auto font-medium">Define formal examination windows to begin scheduling subject sessions and entering terminal scores.</p>
                <Link href="/dashboard/examinations/periods/new" className="inline-block text-[11px] font-semibold text-forest-700 uppercase tracking-wide border border-sage-200 px-6 py-3 rounded-2xl hover:bg-sage-50 transition-all">Create First Period</Link>
             </div>
           )}
        </div>
      </div>
    </div>
  );
}

function KpiCard({ title, value, sub, icon, color }: any) {
  return (
    <div className="bg-card border border-warm-200 rounded-xl p-8 shadow-sm flex flex-col gap-6 hover:shadow-md transition-shadow">
      <div className={`p-4 rounded-2xl w-fit ${color}`}>{icon}</div>
      <div>
        <p className="text-[11px] font-semibold text-warm-400 uppercase tracking-wide mb-1">{title}</p>
        <p className="text-3xl font-semibold text-charcoal-900">{value}</p>
        <p className="text-[11px] font-bold text-warm-400 mt-1 italic">{sub}</p>
      </div>
    </div>
  );
}

