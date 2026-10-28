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
  CheckCircle,
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

  if (loading) return <div className="p-20 text-center"><Loader2 className="animate-spin mx-auto text-forest-700" size={48} /></div>;

  const { metrics, activeCampaigns } = data;

  return (
    <div className="p-8 space-y-10">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-semibold text-charcoal-900 tracking-tight">Admissions Intake</h1>
          <p className="text-warm-500 mt-1 font-medium">Manage student applications, screening and enrollment conversion.</p>
        </div>
        <div className="flex gap-4">
           <Link href="/dashboard/admissions/campaigns/new" className="bg-card border border-warm-200 text-warm-700 px-6 py-3 rounded-2xl font-semibold text-xs uppercase tracking-wide hover:bg-ivory-50 transition-all shadow-sm">
             New Campaign
           </Link>
           <Link href="/dashboard/admissions/applications/new" className="bg-forest-700 text-white px-6 py-3 rounded-2xl font-semibold text-xs uppercase tracking-wide hover:bg-forest-800 transition-all shadow-xs shadow-sage-200 flex items-center gap-2">
             <UserPlus size={18} /> Register Applicant
           </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        <KpiCard title="Total Applicants" value={metrics.totalApplications} sub="Cumulative Lifetime" icon={<Users className="text-forest-700"/>} color="bg-sage-50" />
        <KpiCard title="New & Unreviewed" value={metrics.newApplications} sub="Action Required" icon={<Inbox className="text-warning-600"/>} color="bg-warning-50" />
        <KpiCard title="Offers Accepted" value={metrics.offersAccepted} sub="Ready for Enrollment" icon={<CheckCircle className="text-success-600"/>} color="bg-success-50" />
        <KpiCard title="Enrolled" value={metrics.enrolled} sub="Converted Students" icon={<FileCheck className="text-terracotta-600"/>} color="bg-terracotta-50" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <section className="bg-card border border-warm-200 rounded-xl p-8 shadow-sm">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-xl font-semibold text-charcoal-900 tracking-tight">Active Admission Campaigns</h3>
              <Link href="/dashboard/admissions/campaigns" className="text-[11px] font-semibold text-forest-700 uppercase tracking-wide flex items-center gap-1">View All <ChevronRight size={14}/></Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {activeCampaigns.map((campaign: any) => (
                <div key={campaign.id} className="p-6 bg-ivory-50 rounded-xl border border-warm-100 hover:border-sage-200 transition-all group">
                   <div className="flex justify-between items-start mb-4">
                      <div className="p-3 bg-card rounded-2xl shadow-sm group-hover:bg-forest-700 group-hover:text-white transition-all"><Calendar size={24}/></div>
                      <span className="px-2 py-0.5 bg-success-100 text-success-700 rounded text-[11px] font-semibold uppercase tracking-wide">Active</span>
                   </div>
                   <h4 className="text-lg font-semibold text-charcoal-900 leading-tight">{campaign.name}</h4>
                   <p className="text-[11px] font-bold text-warm-400 uppercase mt-1">Closes {new Date(campaign.applicationCloseDate).toLocaleDateString()}</p>
                   <div className="mt-6 flex items-center justify-between border-t border-warm-100 pt-4">
                      <p className="text-xs font-semibold text-charcoal-900">{campaign._count.applications} <span className="text-warm-400 font-bold uppercase text-[11px]">Apps</span></p>
                      <Link href={`/dashboard/admissions/applications?campaignId=${campaign.id}`} className="text-forest-700"><TrendingUp size={18}/></Link>
                   </div>
                </div>
              ))}
              {activeCampaigns.length === 0 && (
                <div className="col-span-2 py-12 text-center border-2 border-dashed border-warm-100 rounded-xl">
                   <p className="text-warm-400 font-bold uppercase tracking-wide text-xs">No active campaigns</p>
                </div>
              )}
            </div>
          </section>

          <section className="bg-card border border-warm-200 rounded-xl p-8 shadow-sm">
             <h3 className="text-xl font-semibold text-charcoal-900 tracking-tight mb-8">Conversion Funnel</h3>
             <div className="h-64 flex items-end gap-4 px-4">
                <Bar label="Applications" value={metrics.totalApplications} max={metrics.totalApplications} color="bg-sage-400" />
                <Bar label="Offers" value={metrics.offersIssued + metrics.offersAccepted} max={metrics.totalApplications} color="bg-warning-400" />
                <Bar label="Accepted" value={metrics.offersAccepted} max={metrics.totalApplications} color="bg-sage-400" />
                <Bar label="Enrolled" value={metrics.enrolled} max={metrics.totalApplications} color="bg-terracotta-400" />
             </div>
          </section>
        </div>

        <div className="space-y-8">
          <div className="bg-charcoal-900 rounded-xl p-8 shadow-xs text-white">
            <h3 className="text-lg font-semibold mb-6 tracking-tight">Administrative Links</h3>
            <div className="space-y-4">
               <SidebarLink label="Application Queue" count={metrics.newApplications} href="/dashboard/admissions/applications" />
               <SidebarLink label="Interview Schedule" href="/dashboard/admissions/interviews" />
               <SidebarLink label="Document Verification" href="/dashboard/admissions/documents" />
               <SidebarLink label="Offer Management" href="/dashboard/admissions/offers" />
               <SidebarLink label="Waitlist Registry" href="/dashboard/admissions/waitlist" />
            </div>
          </div>

          <div className="bg-forest-700 rounded-xl p-8 shadow-xs text-white">
             <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                <Clock size={20}/> Deadline Watch
             </h3>
             <p className="text-sage-100 text-xs font-medium leading-relaxed opacity-80 uppercase tracking-tight">
                2 Campaigns are closing within the next 48 hours. Ensure all pending screening is completed.
             </p>
             <button className="mt-6 w-full bg-card/10 border border-white/20 py-4 rounded-2xl text-[11px] font-semibold uppercase tracking-wide hover:bg-card/20 transition-all">
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

function SidebarLink({ label, count, href }: any) {
  return (
    <Link href={href} className="flex items-center justify-between p-4 bg-card/5 rounded-2xl hover:bg-card/10 transition-all border border-white/5 group">
       <span className="text-xs font-semibold uppercase tracking-wide">{label}</span>
       <div className="flex items-center gap-3">
          {count > 0 && <span className="px-2 py-0.5 bg-forest-500 text-white rounded text-[11px] font-semibold">{count}</span>}
          <ChevronRight size={14} className="text-warm-500 group-hover:text-sage-400" />
       </div>
    </Link>
  );
}

function Bar({ label, value, max, color }: any) {
  const height = max > 0 ? (value / max) * 100 : 0;
  return (
    <div className="flex-1 flex flex-col items-center gap-4">
       <div className="flex-1 w-full bg-ivory-50 rounded-t-2xl flex flex-col justify-end overflow-hidden">
          <div className={`${color} w-full transition-all duration-1000`} style={{ height: `${height}%` }} />
       </div>
       <div className="text-center">
          <p className="text-sm font-semibold text-charcoal-900">{value}</p>
          <p className="text-[11px] font-semibold text-warm-400 uppercase tracking-wide">{label}</p>
       </div>
    </div>
  );
}

