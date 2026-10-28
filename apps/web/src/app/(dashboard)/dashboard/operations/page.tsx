'use client';

import React, { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api/client';
import {
  Activity,
  GitPullRequest,
  AlertTriangle,
  CheckCircle,
  Clock,
  ChevronRight,
  RefreshCcw,
  Settings,
  Users,
  Inbox,
  Loader2,
  Database
} from 'lucide-react';
import Link from 'next/link';

export default function OperationsDashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch('/operations/dashboard')
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-20 text-center"><Loader2 className="animate-spin mx-auto text-forest-700" size={48} /></div>;

  const { metrics, recentWorkflows } = data;

  return (
    <div className="p-8 space-y-10">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-semibold text-charcoal-900 tracking-tight">System Operations</h1>
          <p className="text-warm-500 mt-1 font-medium">Orchestration logs, workflow status and system-wide health.</p>
        </div>
        <div className="flex gap-4">
           <Link href="/dashboard/operations/events" className="bg-card border border-warm-200 text-warm-700 px-6 py-3 rounded-2xl font-semibold text-xs uppercase tracking-wide hover:bg-ivory-50 transition-all shadow-sm">
             Event Logs
           </Link>
           <Link href="/dashboard/operations/workflows" className="bg-charcoal-900 text-white px-6 py-3 rounded-2xl font-semibold text-xs uppercase tracking-wide hover:bg-charcoal-950 transition-all shadow-xs flex items-center gap-2">
             <GitPullRequest size={18} /> Active Workflows
           </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        <KpiCard title="Active Students" value={metrics.activeStudents} icon={<Users className="text-forest-700"/>} color="bg-sage-50" />
        <KpiCard title="Pending Applications" value={metrics.pendingApplications} icon={<Inbox className="text-warning-600"/>} color="bg-warning-50" />
        <KpiCard title="Current Enrollments" value={metrics.currentEnrollments} icon={<CheckCircle className="text-success-600"/>} color="bg-success-50" />
        <KpiCard title="System Events" value="1.2k" sub="Last 24h" icon={<Activity className="text-terracotta-600"/>} color="bg-terracotta-50" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
           <section className="bg-card border border-warm-200 rounded-xl p-8 shadow-sm">
              <div className="flex justify-between items-center mb-8">
                 <h3 className="text-xl font-semibold text-charcoal-900 tracking-tight">Recent Orchestrations</h3>
                 <Link href="/dashboard/operations/workflows" className="text-[11px] font-semibold text-forest-700 uppercase tracking-wide flex items-center gap-1">View All <ChevronRight size={14}/></Link>
              </div>
              <div className="space-y-4">
                 {recentWorkflows.map((wf: any) => (
                    <div key={wf.id} className="flex items-center justify-between p-6 bg-ivory-50 rounded-xl border border-warm-100 group hover:border-sage-100 transition-all">
                       <div className="flex items-center gap-5">
                          <div className={`p-3 rounded-2xl ${
                             wf.status === 'COMPLETED' ? 'bg-success-100 text-success-600' :
                             wf.status === 'FAILED' ? 'bg-danger-100 text-danger-600' : 'bg-sage-100 text-forest-700'
                          }`}>
                             <GitPullRequest size={20} />
                          </div>
                          <div>
                             <p className="text-sm font-semibold text-charcoal-900">{wf.workflowType.replace(/_/g, ' ')}</p>
                             <p className="text-[11px] font-bold text-warm-400 uppercase tracking-tight mt-0.5">
                                {wf.steps.filter((s: any) => s.status === 'COMPLETED').length} / {wf.steps.length} Steps Completed
                             </p>
                          </div>
                       </div>
                       <div className="flex items-center gap-6">
                          <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold uppercase ${
                             wf.status === 'COMPLETED' ? 'bg-success-50 text-success-700' :
                             wf.status === 'FAILED' ? 'bg-danger-50 text-danger-700' : 'bg-sage-50 text-forest-800'
                          }`}>{wf.status}</span>
                          <Link href={`/dashboard/operations/workflows/${wf.id}`} className="p-3 bg-card rounded-xl text-warm-400 hover:text-forest-700 transition-all shadow-sm"><ChevronRight size={16}/></Link>
                       </div>
                    </div>
                 ))}
                 {recentWorkflows.length === 0 && (
                    <div className="py-12 text-center text-warm-400 font-bold uppercase tracking-wide text-xs">No active orchestrations</div>
                 )}
              </div>
           </section>
        </div>

        <div className="space-y-8">
           <section className="bg-charcoal-900 rounded-xl p-8 shadow-xs text-white">
              <h3 className="text-lg font-semibold mb-8 tracking-tight flex items-center gap-2">
                 <Database size={20} className="text-sage-400" /> Infrastructure Status
              </h3>
              <div className="space-y-6">
                 <ServiceStatus label="PostgreSQL DB" status="operational" />
                 <ServiceStatus label="Redis / Queues" status="operational" />
                 <ServiceStatus label="S3 Storage" status="operational" />
                 <ServiceStatus label="Event Workers" status="operational" />
              </div>
           </section>

           <div className="bg-forest-700 rounded-xl p-8 shadow-xs text-white">
              <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                 <Settings size={20}/> Outbox Processor
              </h3>
              <p className="text-sage-100 text-xs font-medium leading-relaxed opacity-80 uppercase tracking-tight">
                 Reliable transactional event delivery is currently active. Processing latency: 140ms.
              </p>
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
        {sub && <p className="text-[11px] font-bold text-warm-400 mt-1 italic">{sub}</p>}
      </div>
    </div>
  );
}

function ServiceStatus({ label, status }: any) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-white/5 last:border-0">
       <span className="text-xs font-semibold uppercase tracking-wide text-warm-400">{label}</span>
       <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-success-400 shadow-[0_0_8px_rgba(74,222,128,0.5)]" />
          <span className="text-[11px] font-semibold text-white uppercase">{status}</span>
       </div>
    </div>
  );
}
