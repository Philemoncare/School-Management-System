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
  CheckCircle2,
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

  if (loading) return <div className="p-20 text-center"><Loader2 className="animate-spin mx-auto text-blue-600" size={48} /></div>;

  return (
    <div className="p-8 space-y-10">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Examinations & Sessions</h1>
          <p className="text-gray-500 mt-1 font-medium text-sm">Manage formal examination periods, schedules, and hall allocations.</p>
        </div>
        <div className="flex gap-4">
           <Link href="/dashboard/examinations/periods/new" className="bg-blue-600 text-white px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-blue-700 transition-all shadow-xl shadow-blue-200 flex items-center gap-2">
             <Plus size={18} /> New Exam Period
           </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <KpiCard title="Active Periods" value={data.filter(p => p.status === 'ACTIVE').length} sub="Ongoing Exams" icon={<Calendar className="text-blue-600"/>} color="bg-blue-50" />
        <KpiCard title="Upcoming Sessions" value="24" sub="Next 7 Days" icon={<Clock className="text-amber-600"/>} color="bg-amber-50" />
        <KpiCard title="Completion Rate" value="85%" sub="Scores Entered" icon={<CheckCircle2 className="text-green-600"/>} color="bg-green-50" />
      </div>

      <div className="bg-white border border-gray-200 rounded-[2.5rem] shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
           <h3 className="text-sm font-black uppercase tracking-widest text-gray-900">Examination Registry</h3>
           <div className="flex gap-3">
              <Link href="/dashboard/examinations/sessions" className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-[10px] font-black uppercase tracking-widest text-gray-500 hover:bg-gray-50 transition-all flex items-center gap-2 shadow-sm">
                 <ClipboardList size={14}/> View All Sessions
              </Link>
           </div>
        </div>

        <div className="p-8">
           <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {data.map((period) => (
                <div key={period.id} className="p-8 border border-gray-100 rounded-[2.5rem] bg-gray-50/50 hover:bg-white hover:shadow-xl transition-all group">
                   <div className="flex justify-between items-start mb-6">
                      <div className="p-4 bg-white rounded-2xl shadow-sm group-hover:bg-blue-600 group-hover:text-white transition-all">
                         <Calendar size={28} />
                      </div>
                      <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                         period.status === 'ACTIVE' ? 'bg-green-100 text-green-700' :
                         period.status === 'COMPLETED' ? 'bg-blue-100 text-blue-700' : 'bg-gray-200 text-gray-600'
                      }`}>{period.status}</span>
                   </div>

                   <h4 className="text-xl font-black text-gray-900">{period.name}</h4>
                   <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1 flex items-center gap-2">
                      <FileText size={12}/> {period.code} • {period.academicYear.name}
                   </p>

                   <div className="mt-8 grid grid-cols-2 gap-4">
                      <div className="p-4 bg-white rounded-2xl border border-gray-100">
                         <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Start Date</p>
                         <p className="text-sm font-black text-gray-900">{new Date(period.startDate).toLocaleDateString()}</p>
                      </div>
                      <div className="p-4 bg-white rounded-2xl border border-gray-100">
                         <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">End Date</p>
                         <p className="text-sm font-black text-gray-900">{new Date(period.endDate).toLocaleDateString()}</p>
                      </div>
                   </div>

                   <div className="mt-8 flex justify-between items-center">
                      <div className="flex items-center gap-2">
                         <div className="flex -space-x-2">
                            {[1,2,3].map(i => <div key={i} className="w-6 h-6 rounded-full bg-gray-200 border-2 border-white" />)}
                         </div>
                         <p className="text-[10px] font-bold text-gray-400">Scores Pending Approval</p>
                      </div>
                      <Link href={`/dashboard/examinations/periods/${period.id}`} className="p-3 bg-white border border-gray-200 rounded-xl text-gray-400 hover:text-blue-600 transition-all shadow-sm group-hover:border-blue-100">
                         <ChevronRight size={18} />
                      </Link>
                   </div>
                </div>
              ))}
           </div>

           {data.length === 0 && (
             <div className="py-20 text-center border-2 border-dashed border-gray-100 rounded-[2rem] space-y-4">
                <ClipboardList className="mx-auto text-gray-200" size={64} />
                <h3 className="text-xl font-black text-gray-900">No Examination Periods</h3>
                <p className="text-gray-500 max-w-sm mx-auto font-medium">Define formal examination windows to begin scheduling subject sessions and entering terminal scores.</p>
                <Link href="/dashboard/examinations/periods/new" className="inline-block text-[10px] font-black text-blue-600 uppercase tracking-widest border border-blue-200 px-6 py-3 rounded-2xl hover:bg-blue-50 transition-all">Create First Period</Link>
             </div>
           )}
        </div>
      </div>
    </div>
  );
}

function KpiCard({ title, value, sub, icon, color }: any) {
  return (
    <div className="bg-white border border-gray-200 rounded-[2rem] p-8 shadow-sm flex flex-col gap-6 hover:shadow-md transition-shadow">
      <div className={`p-4 rounded-2xl w-fit ${color}`}>{icon}</div>
      <div>
        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{title}</p>
        <p className="text-3xl font-black text-gray-900">{value}</p>
        <p className="text-[10px] font-bold text-gray-400 mt-1 italic">{sub}</p>
      </div>
    </div>
  );
}
