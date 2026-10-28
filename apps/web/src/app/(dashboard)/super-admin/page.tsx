'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { apiFetch } from '@/lib/api/client';
import {
  Activity,
  Building2,
  ClipboardList,
  CreditCard,
  Server,
  ShieldCheck,
  Users,
  Zap,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

function relativeTime(value: string) {
  const diff = Date.now() - new Date(value).getTime();
  const minutes = Math.max(1, Math.floor(diff / 60000));
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export default function SuperAdminDashboard() {
  const [metrics, setMetrics] = useState<any>(null);
  const [health, setHealth] = useState<any>(null);
  const [queues, setQueues] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([
      apiFetch('/super-admin/dashboard/metrics'),
      apiFetch('/super-admin/monitoring/health'),
      apiFetch('/super-admin/monitoring/queues'),
    ])
      .then(([metricsData, healthData, queueData]) => {
        setMetrics(metricsData);
        setHealth(healthData);
        setQueues(queueData);
      })
      .catch((err) => setError(err.message || 'Unable to load platform metrics'))
      .finally(() => setLoading(false));
  }, []);

  const maxGrowth = Math.max(1, ...(metrics?.monthlyGrowth || []).map((item: any) => item.count));

  return (
    <div className="space-y-6 sm:space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-foreground">Platform Command Center</h1>
        <p className="text-xs sm:text-sm font-medium text-muted-foreground mt-0.5">Global multi-tenant control plane</p>
      </div>

      {error && (
        <div className="rounded-xl border border-danger-200 bg-danger-50 px-4 py-3 text-sm font-semibold text-danger-700">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <StatCard
          title="Active Schools"
          value={loading ? '...' : metrics?.schools?.active ?? 0}
          subValue={`${metrics?.schools?.total ?? 0} registered`}
          href="/super-admin/schools?status=ACTIVE"
          icon={<Building2 className="text-forest-700 dark:text-sage-400 w-5 h-5 sm:w-6 sm:h-6" />}
          color="bg-sage-50 dark:bg-forest-950/30"
        />
        <StatCard
          title="Total Users"
          value={loading ? '...' : metrics?.users?.total ?? 0}
          subValue={`${metrics?.users?.active ?? 0} active`}
          href="/super-admin/users"
          icon={<Users className="text-terracotta-600 dark:text-terracotta-400 w-5 h-5 sm:w-6 sm:h-6" />}
          color="bg-terracotta-50 dark:bg-terracotta-950/30"
        />
        <StatCard
          title="Pending Approvals"
          value={loading ? '...' : metrics?.schools?.pending ?? 0}
          subValue="Schools awaiting review"
          href="/super-admin/schools?status=PENDING"
          icon={<ClipboardList className="text-warning-600 dark:text-warning-400 w-5 h-5 sm:w-6 sm:h-6" />}
          color="bg-warning-50 dark:bg-warning-950/30"
        />
        <StatCard
          title="System Status"
          value={loading ? '...' : health?.status === 'ok' ? 'Healthy' : health?.status === 'degraded' ? 'Degraded' : 'Offline'}
          subValue={`DB ${health?.databaseLatencyMs ?? '-'}ms`}
          href="/super-admin/monitoring"
          icon={<Zap className="text-forest-600 dark:text-sage-400 w-5 h-5 sm:w-6 sm:h-6" />}
          color="bg-sage-50 dark:bg-forest-950/30"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
        <div className="lg:col-span-2 space-y-6 sm:space-y-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg">Platform Growth</CardTitle>
              <span className="px-2.5 py-1 bg-primary/10 text-primary rounded-lg text-xs font-bold">Last 6 months</span>
            </CardHeader>
            <CardContent>
              <div className="h-[220px] sm:h-[280px] bg-muted/40 rounded-2xl border border-border/60 relative overflow-hidden">
                <div className="absolute inset-0 flex items-end justify-around px-4 sm:px-8 pb-10">
                  {(metrics?.monthlyGrowth || []).map((item: any) => (
                    <div key={item.month} className="flex h-full flex-1 flex-col items-center justify-end gap-2">
                      <span className="text-[10px] font-bold text-muted-foreground">{item.count}</span>
                      <div
                        className="w-8 sm:w-12 bg-primary/35 rounded-t-lg transition-all hover:bg-primary/60"
                        style={{ height: `${Math.max(4, (item.count / maxGrowth) * 100)}%` }}
                      />
                      <span className="text-[10px] font-bold text-muted-foreground">{item.month}</span>
                    </div>
                  ))}
                  {!metrics?.monthlyGrowth?.length && (
                    <p className="z-10 rounded-full border border-border bg-card px-3.5 py-1.5 text-xs font-semibold text-muted-foreground">
                      No registration history yet
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <RecentSchoolsCard schools={metrics?.recentSchools || []} loading={loading} />
            <SecurityAlertsCard events={metrics?.recentSecurityEvents || []} loading={loading} />
          </div>
        </div>

        <div className="space-y-6 sm:space-y-8">
          <SystemHealthCard health={health} />
          <QueueStatusCard queues={queues} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
        <QuickLink href="/super-admin/payments" icon={<CreditCard size={20} />} label="Revenue & Billing" detail={`${metrics?.revenue?.currency || 'GHS'} ${Number(metrics?.revenue?.mrr || 0).toLocaleString()} MRR`} />
        <QuickLink href="/super-admin/plans" icon={<Zap size={20} />} label="Subscription Plans" detail={`${metrics?.subscriptions?.active ?? 0} active subscriptions`} />
        <QuickLink href="/super-admin/audit" icon={<ShieldCheck size={20} />} label="Audit Trail" detail={`${metrics?.recentAuditLogs?.length ?? 0} recent actions`} />
      </div>
    </div>
  );
}

function StatCard({ title, value, subValue, href, icon, color }: any) {
  return (
    <Link href={href} className="block">
      <Card className="hover:shadow-md transition-shadow h-full">
        <CardContent className="p-4 sm:p-6 flex items-center gap-4">
          <div className={`${color} p-3 sm:p-3.5 rounded-2xl shrink-0`}>{icon}</div>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider truncate">{title}</p>
            <p className="text-xl sm:text-2xl font-semibold text-foreground truncate">{value}</p>
            {subValue && <p className="text-[11px] font-bold text-muted-foreground mt-0.5 truncate">{subValue}</p>}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

function QuickLink({ href, icon, label, detail }: any) {
  return (
    <Link href={href} className="flex items-center gap-4 rounded-2xl border border-border bg-card p-5 hover:border-primary/40 hover:shadow-sm transition-all">
      <div className="rounded-xl bg-muted p-3 text-primary">{icon}</div>
      <div>
        <p className="text-sm font-semibold text-foreground">{label}</p>
        <p className="text-xs text-muted-foreground">{detail}</p>
      </div>
    </Link>
  );
}

function SystemHealthCard({ health }: any) {
  const services = health?.services || {};
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Server size={18} className="text-primary shrink-0" /> Infrastructure Health
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <HealthItem label="API Services" status={services.api} />
        <HealthItem label="Database Cluster" status={services.database} />
        <HealthItem label="Redis Cache Layer" status={services.redis} />
        <HealthItem label="Email Delivery" status={services.email} />
      </CardContent>
    </Card>
  );
}

function HealthItem({ label, status }: any) {
  const healthy = ['up', 'ok', 'operational'].includes(status);
  return (
    <div className="flex items-center justify-between p-3 bg-muted/50 rounded-xl border border-border/50">
      <span className="text-xs sm:text-sm font-bold text-foreground">{label}</span>
      <div className="flex items-center gap-2">
        <span className="text-[10px] font-bold uppercase text-muted-foreground">{status || 'unknown'}</span>
        <div className={`w-2.5 h-2.5 rounded-full ${healthy ? 'bg-forest-500' : 'bg-warning-500'} animate-pulse`} />
      </div>
    </div>
  );
}

function QueueStatusCard({ queues }: any) {
  const notifications = queues?.notifications || {};
  const total = (notifications.waiting || 0) + (notifications.active || 0) + (notifications.completed || 0) + (notifications.failed || 0);
  return (
    <div className="bg-charcoal-900 dark:bg-charcoal-900 border border-charcoal-800 rounded-2xl p-5 sm:p-6 shadow-xs text-white">
      <h3 className="font-bold text-base mb-4 flex items-center gap-2">
        <Activity size={18} className="text-sage-400 shrink-0" /> Notification Queue
      </h3>
      {queues?.available === false && (
        <p className="mb-4 rounded-lg bg-white/10 p-2 text-[11px] text-warm-300">{queues.reason}</p>
      )}
      <div className="space-y-4">
        <QueueRow label="Waiting" value={notifications.waiting} total={total} color="bg-forest-500" />
        <QueueRow label="Active" value={notifications.active} total={total} color="bg-terracotta-500" />
        <QueueRow label="Failed" value={notifications.failed} total={total} color="bg-danger-500" />
      </div>
      <Link href="/super-admin/monitoring" className="mt-5 block text-center text-[11px] font-bold uppercase tracking-wide text-warm-300 hover:text-white">
        Open monitoring
      </Link>
    </div>
  );
}

function QueueRow({ label, value, total, color }: any) {
  return (
    <div>
      <div className="flex justify-between items-center text-xs">
        <span className="font-medium text-warm-400">{label}</span>
        <span className="font-semibold text-warm-200">{value ?? 0}</span>
      </div>
      <div className="w-full bg-charcoal-800 rounded-full h-1.5 mt-1">
        <div className={`${color} h-1.5 rounded-full`} style={{ width: `${total ? Math.min(100, ((value || 0) / total) * 100) : 0}%` }} />
      </div>
    </div>
  );
}

function RecentSchoolsCard({ schools, loading }: any) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Recently Onboarded</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {loading && <p className="text-xs text-muted-foreground">Loading schools...</p>}
        {!loading && schools.length === 0 && <p className="text-xs text-muted-foreground">No schools registered yet.</p>}
        {schools.map((school: any) => (
          <Link key={school.id} href={`/super-admin/schools/${school.id}`} className="flex items-center gap-3 p-2.5 bg-muted/40 rounded-xl border border-border/40 hover:bg-muted/70 transition-colors">
            <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center font-bold text-xs text-primary shrink-0">
              {school.name[0]}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-foreground truncate">{school.name}</p>
              <p className="text-[11px] text-muted-foreground font-medium truncate">Provisioned {relativeTime(school.createdAt)}</p>
            </div>
            <span className="px-2 py-0.5 bg-sage-50 text-forest-700 dark:bg-forest-950 dark:text-sage-400 text-[11px] font-semibold rounded uppercase shrink-0">
              {school.status}
            </span>
          </Link>
        ))}
      </CardContent>
    </Card>
  );
}

function SecurityAlertsCard({ events, loading }: any) {
  return (
    <Card className="border-l-4 border-l-warning-500">
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <ShieldCheck size={18} className="text-warning-500 shrink-0" /> Security Events
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {loading && <p className="text-xs text-muted-foreground">Loading security events...</p>}
        {!loading && events.length === 0 && <p className="text-xs text-muted-foreground">No security events recorded.</p>}
        {events.slice(0, 4).map((event: any) => (
          <div key={event.id} className="p-3 bg-warning-50/70 dark:bg-warning-950/20 border border-warning-200/50 rounded-xl">
            <p className="text-[11px] font-semibold text-warning-800 dark:text-warning-300">{event.eventType}</p>
            <p className="text-[11px] text-warning-600 dark:text-warning-400 font-bold mt-0.5">
              {event.user?.email || 'System'} · {relativeTime(event.createdAt)}
            </p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
