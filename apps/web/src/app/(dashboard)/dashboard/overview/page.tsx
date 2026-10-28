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
  CheckCircle,
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
          <h1 className="text-3xl font-semibold text-charcoal-900 tracking-tight">Institutional Overview</h1>
          <p className="text-warm-500 font-medium mt-1">High-level operational health and metadata summary.</p>
        </div>
        <div className="flex gap-3">
           <button className="px-6 py-2.5 bg-card border border-warm-200 rounded-xl text-xs font-semibold uppercase tracking-wide hover:bg-ivory-50 transition-colors shadow-sm">Export Report</button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Identity & Status */}
        <div className="bg-card border border-warm-200 rounded-xl p-8 shadow-sm">
           <div className="w-16 h-16 rounded-2xl bg-forest-700 text-white flex items-center justify-center font-semibold text-2xl mb-6 shadow-xs shadow-sage-100">
             {data?.stats ? 'S' : '...'}
           </div>
           <h2 className="text-2xl font-semibold text-charcoal-900">Education Hub</h2>
           <p className="text-warm-400 font-bold uppercase tracking-wide text-[11px] mt-1">Managed Institution</p>

           <div className="mt-10 space-y-6">
              <DetailRow label="System Status" value="Operational" color="text-success-600" />
              <DetailRow label="Academic Year" value={data?.academicContext?.year} />
              <DetailRow label="Current Term" value={data?.academicContext?.term} />
              <DetailRow label="Localization" value="UTC (Africa/Accra)" />
           </div>
        </div>

        {/* Population Summary */}
        <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-8">
           <OverviewCard title="Student Strength" value={data?.stats?.students} sub="Active Admitted" icon={<Users className="text-forest-700"/>} link="/dashboard/students" />
           <OverviewCard title="Academic Staff" value={data?.stats?.teachers} sub="Assigned Teachers" icon={<GraduationCap className="text-terracotta-600"/>} link="/dashboard/teachers" />
           <OverviewCard title="Class Streams" value={data?.stats?.activeClasses} sub="Active Sections" icon={<Calendar className="text-success-600"/>} link="/dashboard/academics/classes" />
           <OverviewCard title="Attendance Rate" value={data?.stats?.attendanceRate} sub="Today's Roll Call" icon={<Activity className="text-terracotta-600"/>} link="/dashboard/attendance" />
        </div>
      </div>

      {/* Subscription Context */}
      <div className="bg-charcoal-900 rounded-xl p-10 shadow-xs text-white relative overflow-hidden">
         <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-10">
            <div className="max-w-md">
               <div className="flex items-center gap-3 mb-6">
                  <ShieldCheck className="text-forest-500" size={32} />
                  <span className="bg-card/10 px-3 py-1 rounded-lg text-[11px] font-semibold uppercase tracking-wide">Platform Entitlement</span>
               </div>
               <h3 className="text-3xl font-semibold mb-4">Professional Tier</h3>
               <p className="text-warm-400 font-medium leading-relaxed">
                  Your school is currently on the Professional plan. All core modules including Finance, Advanced Reporting, and SMS Alerts are active.
               </p>
            </div>
            <div className="shrink-0 flex gap-4">
               <Link href="/dashboard/billing" className="px-8 py-4 bg-card text-charcoal-900 rounded-2xl font-semibold text-xs uppercase tracking-wide hover:bg-warm-100 transition-colors">Manage Subscription</Link>
            </div>
         </div>
         <div className="absolute top-0 right-0 w-64 h-64 bg-forest-700/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
      </div>
    </div>
  );
}

function DetailRow({ label, value, color = 'text-charcoal-900' }: any) {
  return (
    <div className="flex justify-between items-center border-b border-ivory-50 pb-4 last:border-0 last:pb-0">
       <span className="text-[11px] font-semibold text-warm-400 uppercase tracking-wide">{label}</span>
       <span className={`text-sm font-semibold ${color}`}>{value || '...'}</span>
    </div>
  );
}

function OverviewCard({ title, value, sub, icon, link }: any) {
  return (
    <div className="bg-card border border-warm-200 rounded-xl p-8 shadow-sm hover:shadow-md transition-shadow group">
       <div className="flex justify-between items-start mb-6">
          <div className="p-4 bg-ivory-50 rounded-2xl group-hover:bg-card group-hover:shadow-sm transition-all">{icon}</div>
          <Link href={link} className="p-2 text-warm-300 hover:text-forest-700 transition-colors"><ArrowRight size={20}/></Link>
       </div>
       <p className="text-[11px] font-semibold text-warm-400 uppercase tracking-wide">{title}</p>
       <p className="text-3xl font-semibold text-charcoal-900 mt-1">{value || '0'}</p>
       <p className="text-[11px] font-bold text-warm-400 mt-2 flex items-center gap-1 italic">
          <Clock size={10} /> {sub}
       </p>
    </div>
  );
}

