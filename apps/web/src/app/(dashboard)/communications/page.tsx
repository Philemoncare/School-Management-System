'use client';

import React, { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api/client';
import {
  Send,
  MessageSquare,
  Mail,
  Smartphone,
  AlertCircle,
  TrendingUp,
  Plus,
  ArrowRight,
  XCircle,
  Clock,
  Settings,
  AlertTriangle,
  CheckCircle2
} from 'lucide-react';
import { CommunicationComposer } from '@/components/communications/communication-composer';
import { useFeatureStatus } from '@/hooks/use-feature-status';
import { UnsupportedFeatureBanner } from '@/components/common/unsupported-feature-banner';

export default function CommunicationsDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showComposer, setShowComposer] = useState(false);
  const [recentComms, setRecentComms] = useState<any[]>([]);

  const { allStatuses, loading: checkingIntegrations, refresh: refreshIntegrations } = useFeatureStatus();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [statsData, commsData] = await Promise.all([
        apiFetch('/communications/dashboard').catch(() => ({
          sentToday: 0,
          failedToday: 0,
          scheduledCount: 0,
          activeAnnouncements: 0,
          usage: []
        })),
        apiFetch('/communications?limit=5').catch(() => ({ items: [] }))
      ]);
      setStats(statsData);
      setRecentComms(commsData.items || []);
    } catch (error) {
      console.error('Failed to fetch communication data', error);
    } finally {
      setLoading(false);
    }
  };

  const smsStatus = allStatuses?.SMS;
  const emailStatus = allStatuses?.EMAIL;

  if (loading) return <div className="p-12 text-center text-warm-400 font-bold animate-pulse">Initializing Communication Center...</div>;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold text-charcoal-900 tracking-tight">Communication <span className="text-forest-700">Ops Center</span></h1>
          <p className="text-warm-500 font-medium">Control tower for all school-wide broadcasts and targeted messaging.</p>
        </div>
        <div className="flex items-center gap-3">
           <button
             onClick={() => setShowComposer(true)}
             className="bg-forest-700 text-white px-6 py-3 rounded-2xl font-semibold text-xs uppercase tracking-wide hover:bg-forest-800 shadow-xs shadow-sage-100 transition-all flex items-center gap-2"
           >
             <Plus size={18} /> New Broadcast
           </button>
           <button
             onClick={refreshIntegrations}
             className="p-3 bg-card border border-warm-100 rounded-2xl text-warm-400 hover:text-warm-600 transition-colors"
             title="Refresh Integration Status"
           >
              <Settings size={20} />
           </button>
        </div>
      </div>

      {/* Unconfigured warnings if SMS or Email is not configured */}
      {smsStatus && !smsStatus.configured && (
        <UnsupportedFeatureBanner
          reason="SERVICE_UNCONFIGURED"
          serviceName="SMS Gateway"
          message="SMS gateway is currently unconfigured. SMS broadcasts will fail until API keys are set up by the administrator."
          compact
        />
      )}

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Sent Today" value={stats?.sentToday ?? 0} icon={Send} color="blue" />
        <StatCard label="Failed Today" value={stats?.failedToday ?? 0} icon={XCircle} color="red" />
        <StatCard label="Scheduled" value={stats?.scheduledCount ?? 0} icon={Clock} color="amber" />
        <StatCard label="Active Notices" value={stats?.activeAnnouncements ?? 0} icon={Bell} color="purple" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Feed: Recent Communications */}
        <div className="lg:col-span-2 space-y-6">
           <div className="bg-card rounded-3xl border border-warm-100 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-warm-100 flex justify-between items-center bg-ivory-50/50">
                 <h2 className="text-lg font-semibold text-charcoal-900 flex items-center gap-2">
                   <TrendingUp size={20} className="text-forest-700" /> Recent Activity
                 </h2>
                 <button className="text-[11px] font-semibold text-forest-700 uppercase tracking-wide hover:underline flex items-center gap-1">View Full Logs <ArrowRight size={14}/></button>
              </div>
              <div className="divide-y divide-ivory-50">
                 {recentComms.map((comm) => (
                   <div key={comm.id} className="p-6 hover:bg-ivory-50/50 transition-colors group">
                      <div className="flex justify-between items-start mb-4">
                         <div className="flex items-center gap-3">
                            <span className={`px-2 py-0.5 rounded-lg text-[11px] font-semibold uppercase tracking-wider ${
                              comm.status === 'SENT' ? 'bg-sage-50 text-forest-600' : 'bg-warning-50 text-warning-600'
                            }`}>{comm.status}</span>
                            <div className="flex gap-1">
                               {comm.channels?.map((c: string) => (
                                 <ChannelIcon key={c} channel={c} />
                               ))}
                            </div>
                         </div>
                         <p className="text-[11px] font-bold text-warm-400 uppercase">{new Date(comm.createdAt).toLocaleString()}</p>
                      </div>
                      <h3 className="text-base font-semibold text-charcoal-900 group-hover:text-forest-700 transition-colors">{comm.title}</h3>
                      <p className="text-xs text-warm-500 mt-1 line-clamp-1 font-medium">{comm.content}</p>
                   </div>
                 ))}
                 {recentComms.length === 0 && (
                   <div className="p-12 text-center text-warm-400 italic">No recent broadcasts recorded.</div>
                 )}
              </div>
           </div>

           {/* Campaigns / Strategies */}
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <QuickActionCard
                title="Automated Rules"
                description="Manage triggers like absence alerts & fee reminders."
                icon={Settings}
                color="indigo"
              />
              <QuickActionCard
                title="Templates"
                description="Edit reusable message designs and variables."
                icon={FileText}
                color="teal"
              />
           </div>
        </div>

        {/* Sidebar: Real Provider Health & Channel Usage */}
        <div className="space-y-8">
           <section className="bg-card rounded-3xl border border-warm-100 shadow-sm p-8">
              <h3 className="text-lg font-semibold text-charcoal-900 mb-6 flex items-center gap-2">
                <Smartphone size={20} className="text-forest-700" /> Channel Usage
              </h3>
              <div className="space-y-6">
                 <UsageBar label="SMS Balance" current={stats?.usage?.find((u:any) => u.channel === 'SMS')?.successfulCount || 0} limit={5000} color="blue" />
                 <UsageBar label="Email Credits" current={stats?.usage?.find((u:any) => u.channel === 'EMAIL')?.successfulCount || 0} limit={100000} color="emerald" />
              </div>
           </section>

           <section className="bg-charcoal-900 rounded-xl p-8 shadow-xs text-white relative overflow-hidden">
              <div className="relative z-10">
                <h3 className="font-semibold text-lg mb-6">Real Provider Status</h3>
                <div className="space-y-4">
                   <RealHealthStatus
                     label="SMS Gateway"
                     configured={smsStatus?.configured}
                     provider={smsStatus?.provider || 'SMS Service'}
                     loading={checkingIntegrations}
                   />
                   <RealHealthStatus
                     label="Email Relay"
                     configured={emailStatus?.configured}
                     provider={emailStatus?.provider || 'SMTP Email'}
                     loading={checkingIntegrations}
                   />
                   <RealHealthStatus
                     label="Realtime Socket"
                     configured={true}
                     provider="Socket.io Service"
                     loading={false}
                   />
                </div>
              </div>
              <TrendingUp size={160} className="absolute -bottom-10 -right-10 text-white/5 -rotate-12" />
           </section>
        </div>
      </div>

      {/* Composer Overlay */}
      {showComposer && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8 animate-in fade-in duration-300">
           <div className="absolute inset-0 bg-charcoal-900/60" onClick={() => setShowComposer(false)} />
           <div className="relative w-full">
             <CommunicationComposer onCancel={() => setShowComposer(false)} onSuccess={() => { setShowComposer(false); fetchData(); }} />
           </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, icon: Icon, color }: any) {
  const colors: any = {
    blue: 'bg-sage-50 text-forest-700 border-sage-100',
    red: 'bg-danger-50 text-danger-600 border-danger-100',
    amber: 'bg-warning-50 text-warning-600 border-warning-100',
    purple: 'bg-terracotta-50 text-terracotta-600 border-terracotta-100',
  };
  return (
    <div className={`p-6 rounded-3xl border shadow-sm transition-all hover:shadow-md ${colors[color]}`}>
       <div className="flex justify-between items-start mb-4">
          <div className="bg-card p-2.5 rounded-xl shadow-sm border border-inherit">
             <Icon size={22} />
          </div>
       </div>
       <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide opacity-70 mb-1">{label}</p>
          <h3 className="text-3xl font-semibold text-charcoal-900">{value}</h3>
       </div>
    </div>
  );
}

function ChannelIcon({ channel }: { channel: string }) {
  const icons: any = {
    IN_APP: MessageSquare,
    EMAIL: Mail,
    SMS: Smartphone,
    WEBSOCKET: Send,
  };
  const Icon = icons[channel] || AlertCircle;
  return <div className="p-1 bg-card border border-warm-200 rounded-md text-warm-400" title={channel}><Icon size={10} /></div>;
}

function QuickActionCard({ title, description, icon: Icon, color }: any) {
  const bgColors: any = {
    indigo: 'bg-terracotta-600',
    teal: 'bg-terracotta-600',
  };
  return (
    <div className="bg-card rounded-3xl border border-warm-100 p-8 shadow-sm hover:shadow-md transition-all cursor-pointer group">
       <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-6 text-white shadow-lg group-hover:scale-110 transition-transform ${bgColors[color]}`}>
          <Icon size={24} />
       </div>
       <h4 className="text-lg font-semibold text-charcoal-900 mb-2">{title}</h4>
       <p className="text-xs text-warm-500 font-medium leading-relaxed">{description}</p>
    </div>
  );
}

function UsageBar({ label, current, limit, color }: any) {
  const percent = Math.min(100, (current / limit) * 100);
  const barColors: any = {
    blue: 'bg-forest-500',
    emerald: 'bg-forest-500',
  };
  return (
    <div className="space-y-2">
       <div className="flex justify-between items-end">
          <p className="text-[11px] font-semibold text-warm-400 uppercase tracking-wide">{label}</p>
          <p className="text-xs font-semibold text-charcoal-900">{current.toLocaleString()} / {limit.toLocaleString()}</p>
       </div>
       <div className="h-1.5 w-full bg-warm-100 rounded-full overflow-hidden">
          <div className={`h-full rounded-full ${barColors[color]}`} style={{ width: `${percent}%` }} />
       </div>
    </div>
  );
}

function RealHealthStatus({ label, configured, provider, loading }: { label: string; configured?: boolean; provider?: string; loading?: boolean }) {
  if (loading) {
    return (
      <div className="flex justify-between items-center py-3 border-b border-white/5 last:border-0">
        <span className="text-[11px] font-bold text-warm-400 uppercase tracking-wider">{label}</span>
        <span className="text-xs text-gray-400 animate-pulse">Checking...</span>
      </div>
    );
  }

  const isOperational = Boolean(configured);

  return (
    <div className="flex justify-between items-center py-3 border-b border-white/5 last:border-0">
       <div>
         <span className="text-[11px] font-bold text-warm-400 uppercase tracking-wider block">{label}</span>
         {provider && <span className="text-[10px] text-gray-400 block">{provider}</span>}
       </div>
       <div className="flex items-center gap-1.5">
          {isOperational ? (
            <>
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-xs font-semibold text-emerald-300">Active</span>
            </>
          ) : (
            <>
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-xs font-semibold text-amber-300">Unconfigured</span>
            </>
          )}
       </div>
    </div>
  );
}

function FileText(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <line x1="10" y1="9" x2="8" y2="9" />
    </svg>
  );
}

function Bell(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
      <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
    </svg>
  );
}
