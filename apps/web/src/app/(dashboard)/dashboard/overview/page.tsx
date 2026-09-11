'use client';

import React, { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api/client';
import {
  Building2,
  Users,
  GraduationCap,
  Calendar,
  Activity,
  CreditCard,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Clock
} from 'lucide-react';
import Link from 'next/link';

export default function SchoolOverviewPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch('/schools/dashboard/metrics')
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="p-8 space-y-10">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Institutional Overview</h1>
          <p className="text-gray-500 font-medium mt-1">High-level operational health and metadata summary.</p>
        </div>
        <div className="flex gap-3">
           <button className="px-6 py-2.5 bg-white border border-gray-200 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-gray-50 transition-colors shadow-sm">Export Report</button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Identity & Status */}
        <div className="bg-white border border-gray-200 rounded-[2.5rem] p-8 shadow-sm">
           <div className="w-16 h-16 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-black text-2xl mb-6 shadow-xl shadow-blue-100">
             {data?.stats ? 'S' : '...'}
           </div>
           <h2 className="text-2xl font-black text-gray-900">Education Hub</h2>
           <p className="text-gray-400 font-bold uppercase tracking-widest text-[10px] mt-1">Managed Institution</p>

           <div className="mt-10 space-y-6">
              <DetailRow label="System Status" value="Operational" color="text-green-600" />
              <DetailRow label="Academic Year" value={data?.academicContext?.year} />
              <DetailRow label="Current Term" value={data?.academicContext?.term} />
              <DetailRow label="Localization" value="UTC (Africa/Accra)" />
           </div>
        </div>

        {/* Population Summary */}
        <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-8">
           <OverviewCard title="Student Strength" value={data?.stats?.students} sub="Active Admitted" icon={<Users className="text-blue-600"/>} link="/dashboard/students" />
           <OverviewCard title="Academic Staff" value={data?.stats?.teachers} sub="Assigned Teachers" icon={<GraduationCap className="text-indigo-600"/>} link="/dashboard/teachers" />
           <OverviewCard title="Class Streams" value={data?.stats?.activeClasses} sub="Active Sections" icon={<Calendar className="text-green-600"/>} link="/dashboard/academics/classes" />
           <OverviewCard title="Attendance Rate" value={data?.stats?.attendanceRate} sub="Today's Roll Call" icon={<Activity className="text-orange-600"/>} link="/dashboard/attendance" />
        </div>
      </div>

      {/* Subscription Context */}
      <div className="bg-gray-900 rounded-[2.5rem] p-10 shadow-xl text-white relative overflow-hidden">
         <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-10">
            <div className="max-w-md">
               <div className="flex items-center gap-3 mb-6">
                  <ShieldCheck className="text-blue-500" size={32} />
                  <span className="bg-white/10 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-[0.2em]">Platform Entitlement</span>
               </div>
               <h3 className="text-3xl font-black mb-4">Professional Tier</h3>
               <p className="text-gray-400 font-medium leading-relaxed">
                  Your school is currently on the Professional plan. All core modules including Finance, Advanced Reporting, and SMS Alerts are active.
               </p>
            </div>
            <div className="shrink-0 flex gap-4">
               <Link href="/dashboard/billing" className="px-8 py-4 bg-white text-gray-900 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-gray-100 transition-colors">Manage Subscription</Link>
            </div>
         </div>
         <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
      </div>
    </div>
  );
}

function DetailRow({ label, value, color = 'text-gray-900' }: any) {
  return (
    <div className="flex justify-between items-center border-b border-gray-50 pb-4 last:border-0 last:pb-0">
       <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{label}</span>
       <span className={`text-sm font-black ${color}`}>{value || '...'}</span>
    </div>
  );
}

function OverviewCard({ title, value, sub, icon, link }: any) {
  return (
    <div className="bg-white border border-gray-200 rounded-[2rem] p-8 shadow-sm hover:shadow-md transition-shadow group">
       <div className="flex justify-between items-start mb-6">
          <div className="p-4 bg-gray-50 rounded-2xl group-hover:bg-white group-hover:shadow-sm transition-all">{icon}</div>
          <Link href={link} className="p-2 text-gray-300 hover:text-blue-600 transition-colors"><ArrowRight size={20}/></Link>
       </div>
       <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{title}</p>
       <p className="text-3xl font-black text-gray-900 mt-1">{value || '0'}</p>
       <p className="text-[10px] font-bold text-gray-400 mt-2 flex items-center gap-1 italic">
          <Clock size={10} /> {sub}
       </p>
    </div>
  );
}
