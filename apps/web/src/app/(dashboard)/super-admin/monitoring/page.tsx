'use client';

import React, { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api/client';
import {
  Activity,
  AlertCircle,
  CheckCircle,
  Clock,
  Cpu,
  Database,
  Globe,
  Loader2,
  Mail,
  RefreshCw,
  Server,
  ShieldCheck,
  Zap,
} from 'lucide-react';

export default function PlatformMonitoring() {
  const [health, setHealth] = useState<any>(null);
  const [queues, setQueues] = useState<any>(null);
  const [activity, setActivity] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadAll();
    const interval = setInterval(loadAll, 30000);
    return () => clearInterval(interval);
  }, []);

  async function loadAll() {
    setLoading(true);
    setError('');
    try {
      const [healthData, queueData, activityData] = await Promise.all([
        apiFetch('/super-admin/monitoring/health'),
        apiFetch('/super-admin/monitoring/queues'),
        apiFetch('/super-admin/monitoring/activity'),
      ]);
      setHealth(healthData);
      setQueues(queueData);
      setActivity(activityData);
    } catch (err: any) {
      setError(err.message || 'Unable to load monitoring data');
    } finally {
      setLoading(false);
    }
  }

  const serviceCards = [
    { key: 'api', label: 'API Gateway', icon: <Zap /> },
    { key: 'database', label: 'PostgreSQL Primary', icon: <Database /> },
    { key: 'redis', label: 'Redis Cluster', icon: <Activity /> },
    { key: 'storage', label: 'Object Storage', icon: <Globe /> },
    { key: 'email', label: 'Email Delivery', icon: <Server /> },
    { key: 'sms', label: 'SMS Provider', icon: <Activity /> },
    { key: 'payments', label: 'Payment Provider', icon: <ShieldCheck /> },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-semibold text-charcoal-900 tracking-tight">System Observability</h1>
          <p className="text-warm-500 font-medium mt-1">Real-time infrastructure, queue, and delivery monitoring.</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold text-warm-400 uppercase tracking-wide">
            Last checked: {health ? new Date(health.timestamp).toLocaleTimeString() : 'N/A'}
          </span>
          <button onClick={loadAll} disabled={loading} className="rounded-xl border border-warm-200 bg-card p-3 text-warm-500 shadow-sm transition hover:text-forest-700">
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {error && <div className="rounded-xl border border-danger-200 bg-danger-50 px-4 py-3 text-sm font-semibold text-danger-700">{error}</div>}

      {health && (
        <div className={`rounded-2xl border px-4 py-3 text-sm font-semibold ${health.status === 'ok' ? 'border-success-200 bg-success-50 text-success-800' : health.status === 'degraded' ? 'border-warning-200 bg-warning-50 text-warning-800' : 'border-danger-200 bg-danger-50 text-danger-800'}`}>
          Overall platform status: {health.status.toUpperCase()} · Database latency {health.databaseLatencyMs}ms
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {serviceCards.map((service) => (
          <HealthCard key={service.key} label={service.label} status={health?.services?.[service.key] || 'unknown'} icon={service.icon} />
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="rounded-2xl border border-warm-200 bg-card p-6 shadow-sm">
          <h3 className="mb-5 flex items-center gap-2 text-lg font-semibold text-charcoal-900"><Cpu className="text-forest-700" size={20} /> Backend Resources</h3>
          <div className="grid grid-cols-2 gap-5">
            <Metric label="Memory (RSS)" value={health ? `${Math.round(health.infrastructure.memory.rss / 1024 / 1024)} MB` : '...'} />
            <Metric label="Heap used" value={health ? `${Math.round(health.infrastructure.memory.heapUsed / 1024 / 1024)} MB` : '...'} />
            <Metric label="Uptime" value={health ? `${Math.floor(health.infrastructure.uptime / 3600)}h ${Math.floor((health.infrastructure.uptime % 3600) / 60)}m` : '...'} />
            <Metric label="Node / Env" value={health ? `${health.infrastructure.nodeVersion} · ${health.infrastructure.environment}` : '...'} />
          </div>
          <div className="mt-5 rounded-xl border border-warm-100 bg-ivory-50 p-4">
            <p className="text-[11px] font-bold uppercase tracking-wide text-warm-400">Integration readiness</p>
            <div className="mt-3 grid grid-cols-2 gap-2">
              {health?.integrations && Object.entries(health.integrations).map(([key, value]: any) => (
                <div key={key} className="flex items-center justify-between gap-2 text-[11px] font-semibold">
                  <span className="text-warm-600">{key}</span>
                  <span className={value.configured ? 'text-success-700' : 'text-warning-700'}>{value.configured ? 'Configured' : 'Not configured'}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-warm-200 bg-card p-6 shadow-sm">
          <div className="mb-5 flex items-center justify-between">
            <h3 className="flex items-center gap-2 text-lg font-semibold text-charcoal-900"><Server className="text-forest-700" size={20} /> Notification Queue</h3>
            <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase ${queues?.available ? 'bg-success-100 text-success-700' : 'bg-warning-100 text-warning-700'}`}>
              {queues?.available ? 'Live' : 'Degraded'}
            </span>
          </div>
          {queues?.reason && <p className="mb-4 rounded-lg bg-warning-50 px-3 py-2 text-xs font-semibold text-warning-700">{queues.reason}</p>}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <QueueMetric label="Waiting" value={queues?.notifications?.waiting} />
            <QueueMetric label="Active" value={queues?.notifications?.active} />
            <QueueMetric label="Delayed" value={queues?.notifications?.delayed} />
            <QueueMetric label="Completed" value={queues?.notifications?.completed} />
            <QueueMetric label="Failed" value={queues?.notifications?.failed} danger />
            <QueueMetric label="Mode" value={queues?.available ? 'Redis' : 'DB fallback'} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <ActivityPanel title="Failed Deliveries" icon={<AlertCircle size={18} />} empty="No failed notification deliveries.">
          {activity?.failedDeliveries?.map((delivery: any) => (
            <div key={delivery.id} className="rounded-xl border border-warm-100 p-3">
              <p className="text-xs font-semibold text-charcoal-900">{delivery.notification?.title || delivery.channel}</p>
              <p className="mt-1 text-[11px] text-warm-500">{delivery.notification?.school?.name || 'Platform'} · {delivery.channel}</p>
              <p className="mt-1 text-[10px] font-semibold text-danger-600">{delivery.error || 'Delivery failed'}</p>
              <p className="mt-1 text-[10px] text-warm-400">{delivery.lastAttemptAt ? new Date(delivery.lastAttemptAt).toLocaleString() : ''}</p>
            </div>
          ))}
        </ActivityPanel>

        <ActivityPanel title="Recent Security Events" icon={<ShieldCheck size={18} />} empty="No recent security events.">
          {activity?.recentSecurity?.map((event: any) => (
            <div key={event.id} className="rounded-xl border border-warm-100 p-3">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-semibold text-charcoal-900">{event.eventType}</p>
                <span className="text-[10px] font-bold uppercase text-warm-400">{event.severity}</span>
              </div>
              <p className="mt-1 text-[11px] text-warm-500">{event.user?.email || event.ipAddress || 'Unknown actor'}</p>
              <p className="mt-1 text-[10px] text-warm-400">{new Date(event.createdAt).toLocaleString()}</p>
            </div>
          ))}
        </ActivityPanel>

        <ActivityPanel title="Recent Audit Entries" icon={<Clock size={18} />} empty="No recent audit entries.">
          {activity?.recentAudit?.map((log: any) => (
            <div key={log.id} className="rounded-xl border border-warm-100 p-3">
              <p className="text-xs font-semibold text-charcoal-900">{log.action}</p>
              <p className="mt-1 text-[11px] text-warm-500">{log.module} · {log.userId || 'SYSTEM'}</p>
              <p className="mt-1 text-[10px] text-warm-400">{new Date(log.createdAt).toLocaleString()}</p>
            </div>
          ))}
        </ActivityPanel>
      </div>
    </div>
  );
}

function HealthCard({ label, status, icon }: any) {
  const isUp = status === 'operational';
  const isUnconfigured = status === 'unconfigured';
  return (
    <div className="flex items-center justify-between rounded-2xl border border-warm-200 bg-card p-5 shadow-sm">
      <div className="flex items-center gap-3">
        <div className={`rounded-xl p-3 ${isUp ? 'bg-success-50 text-success-600' : isUnconfigured ? 'bg-warm-100 text-warm-500' : 'bg-danger-50 text-danger-600'}`}>
          {React.cloneElement(icon, { size: 22 })}
        </div>
        <div>
          <p className="text-sm font-semibold text-charcoal-900">{label}</p>
          <p className="mt-0.5 text-[10px] font-bold uppercase tracking-wide text-warm-400">{isUp ? 'Operational' : isUnconfigured ? 'Optional integration' : 'Unavailable'}</p>
        </div>
      </div>
      <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase ${isUp ? 'bg-success-100 text-success-700' : isUnconfigured ? 'bg-warm-100 text-warm-600' : 'bg-danger-100 text-danger-700'}`}>
        {status}
      </span>
    </div>
  );
}

function Metric({ label, value }: any) {
  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-wide text-warm-400">{label}</p>
      <p className="mt-1 text-sm font-semibold text-charcoal-900">{value}</p>
    </div>
  );
}

function QueueMetric({ label, value, danger }: any) {
  return (
    <div className="rounded-xl border border-warm-100 bg-ivory-50 p-3">
      <p className="text-[10px] font-bold uppercase tracking-wide text-warm-400">{label}</p>
      <p className={`mt-1 text-lg font-semibold ${danger && Number(value) > 0 ? 'text-danger-600' : 'text-charcoal-900'}`}>{value ?? '-'}</p>
    </div>
  );
}

function ActivityPanel({ title, icon, empty, children }: any) {
  const items = React.Children.toArray(children).filter(Boolean);
  return (
    <div className="rounded-2xl border border-warm-200 bg-card p-5 shadow-sm">
      <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-charcoal-900">{icon} {title}</h3>
      <div className="space-y-2 max-h-[360px] overflow-y-auto">
        {items.length ? items : <div className="py-10 text-center"><CheckCircle className="mx-auto mb-2 text-success-300" size={28} /><p className="text-xs font-semibold text-warm-400">{empty}</p></div>}
      </div>
    </div>
  );
}
