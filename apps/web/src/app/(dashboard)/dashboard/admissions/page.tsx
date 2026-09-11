'use client';

import React, { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api/client';
import {
  Users,
  UserPlus,
  FileCheck,
  ClipboardList,
  Calendar,
  ChevronRight,
  Loader2,
  TrendingUp,
  PieChart,
  Inbox,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Clock,
  LayoutGrid
} from 'lucide-react';
import Link from 'next/link';

export default function AdmissionsDashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch('/admissions/dashboard')
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-20 text-center"><Loader2 className="animate-spin mx-auto text-blue-600" size={48} /></div>;

  const { metrics, activeCampaigns } = data;

  return (
    <div className="p-8 space-y-10">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Admissions Intake</h1>
          <p className="text-gray-500 mt-1 font-medium">Manage student applications, screening and enrollment conversion.</p>
        </div>
        <div className="flex gap-4">
           <Link href="/dashboard/admissions/campaigns/new" className="bg-white border border-gray-200 text-gray-700 px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-gray-50 transition-all shadow-sm">
             New Campaign
           </Link>
           <Link href="/dashboard/admissions/applications/new" className="bg-blue-600 text-white px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-blue-700 transition-all shadow-xl shadow-blue-200 flex items-center gap-2">
             <UserPlus size={18} /> Register Applicant
           </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        <KpiCard title="Total Applicants" value={metrics.totalApplications} sub="Cumulative Lifetime" icon={<Users className="text-blue-600"/>} color="bg-blue-50" />
        <KpiCard title="New & Unreviewed" value={metrics.newApplications} sub="Action Required" icon={<Inbox className="text-amber-600"/>} color="bg-amber-50" />
        <KpiCard title="Offers Accepted" value={metrics.offersAccepted} sub="Ready for Enrollment" icon={<CheckCircle2 className="text-green-600"/>} color="bg-green-50" />
        <KpiCard title="Enrolled" value={metrics.enrolled} sub="Converted Students" icon={<FileCheck className="text-purple-600"/>} color="bg-purple-50" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <section className="bg-white border border-gray-200 rounded-[2.5rem] p-8 shadow-sm">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-xl font-black text-gray-900 tracking-tight">Active Admission Campaigns</h3>
              <Link href="/dashboard/admissions/campaigns" className="text-[10px] font-black text-blue-600 uppercase tracking-widest flex items-center gap-1">View All <ChevronRight size={14}/></Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {activeCampaigns.map((campaign: any) => (
                <div key={campaign.id} className="p-6 bg-gray-50 rounded-[2rem] border border-gray-100 hover:border-blue-200 transition-all group">
                   <div className="flex justify-between items-start mb-4">
                      <div className="p-3 bg-white rounded-2xl shadow-sm group-hover:bg-blue-600 group-hover:text-white transition-all"><Calendar size={24}/></div>
                      <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded text-[8px] font-black uppercase tracking-widest">Active</span>
                   </div>
                   <h4 className="text-lg font-black text-gray-900 leading-tight">{campaign.name}</h4>
                   <p className="text-[10px] font-bold text-gray-400 uppercase mt-1">Closes {new Date(campaign.applicationCloseDate).toLocaleDateString()}</p>
                   <div className="mt-6 flex items-center justify-between border-t border-gray-100 pt-4">
                      <p className="text-xs font-black text-gray-900">{campaign._count.applications} <span className="text-gray-400 font-bold uppercase text-[9px]">Apps</span></p>
                      <Link href={`/dashboard/admissions/applications?campaignId=${campaign.id}`} className="text-blue-600"><TrendingUp size={18}/></Link>
                   </div>
                </div>
              ))}
              {activeCampaigns.length === 0 && (
                <div className="col-span-2 py-12 text-center border-2 border-dashed border-gray-100 rounded-[2rem]">
                   <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">No active campaigns</p>
                </div>
              )}
            </div>
          </section>

          <section className="bg-white border border-gray-200 rounded-[2.5rem] p-8 shadow-sm">
             <h3 className="text-xl font-black text-gray-900 tracking-tight mb-8">Conversion Funnel</h3>
             <div className="h-64 flex items-end gap-4 px-4">
                <Bar label="Applications" value={metrics.totalApplications} max={metrics.totalApplications} color="bg-blue-400" />
                <Bar label="Offers" value={metrics.offersIssued + metrics.offersAccepted} max={metrics.totalApplications} color="bg-amber-400" />
                <Bar label="Accepted" value={metrics.offersAccepted} max={metrics.totalApplications} color="bg-emerald-400" />
                <Bar label="Enrolled" value={metrics.enrolled} max={metrics.totalApplications} color="bg-purple-400" />
             </div>
          </section>
        </div>

        <div className="space-y-8">
          <div className="bg-gray-900 rounded-[2.5rem] p-8 shadow-xl text-white">
            <h3 className="text-lg font-black mb-6 tracking-tight">Administrative Links</h3>
            <div className="space-y-4">
               <SidebarLink label="Application Queue" count={metrics.newApplications} href="/dashboard/admissions/applications" />
               <SidebarLink label="Interview Schedule" href="/dashboard/admissions/interviews" />
               <SidebarLink label="Document Verification" href="/dashboard/admissions/documents" />
               <SidebarLink label="Offer Management" href="/dashboard/admissions/offers" />
               <SidebarLink label="Waitlist Registry" href="/dashboard/admissions/waitlist" />
            </div>
          </div>

          <div className="bg-blue-600 rounded-[2.5rem] p-8 shadow-xl text-white">
             <h3 className="text-lg font-black mb-2 flex items-center gap-2">
                <Clock size={20}/> Deadline Watch
             </h3>
             <p className="text-blue-100 text-xs font-medium leading-relaxed opacity-80 uppercase tracking-tight">
                2 Campaigns are closing within the next 48 hours. Ensure all pending screening is completed.
             </p>
             <button className="mt-6 w-full bg-white/10 border border-white/20 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-white/20 transition-all">
                Review Status
             </button>
          </div>
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

function SidebarLink({ label, count, href }: any) {
  return (
    <Link href={href} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl hover:bg-white/10 transition-all border border-white/5 group">
       <span className="text-xs font-black uppercase tracking-widest">{label}</span>
       <div className="flex items-center gap-3">
          {count > 0 && <span className="px-2 py-0.5 bg-blue-500 text-white rounded text-[8px] font-black">{count}</span>}
          <ChevronRight size={14} className="text-gray-500 group-hover:text-blue-400" />
       </div>
    </Link>
  );
}

function Bar({ label, value, max, color }: any) {
  const height = max > 0 ? (value / max) * 100 : 0;
  return (
    <div className="flex-1 flex flex-col items-center gap-4">
       <div className="flex-1 w-full bg-gray-50 rounded-t-2xl flex flex-col justify-end overflow-hidden">
          <div className={`${color} w-full transition-all duration-1000`} style={{ height: `${height}%` }} />
       </div>
       <div className="text-center">
          <p className="text-sm font-black text-gray-900">{value}</p>
          <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">{label}</p>
       </div>
    </div>
  );
}
