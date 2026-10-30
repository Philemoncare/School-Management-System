'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { apiFetch } from '@/lib/api/client';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import {
  Activity,
  AlertCircle,
  AlertTriangle,
  Bell,
  Clock,
  Loader2,
  Phone,
  RefreshCw,
  Search,
  ShieldCheck,
  Users,
  Wallet,
} from 'lucide-react';

interface PlatformAlert {
  id: string;
  type: string;
  severity: string;
  title: string;
  description: string;
  user?: string;
  school?: string;
  time: string;
}

interface ActivityItem {
  id: string;
  action: string;
  module: string;
  user: string;
  school: string;
  time: string;
}

interface OperationsData {
  alerts: PlatformAlert[];
  alertCount: number;
  criticalCount: number;
  highCount: number;
  mediumCount: number;
  lowCount: number;
  recentActivity: ActivityItem[];
  pendingApprovals: number;
  expiringTrials: number;
  lowSmsCreditSchools: Array<{ id: string; name: string; code: string; smsCreditBalance: number }>;
  generatedAt: string;
}

const SEVERITY_STYLES: Record<string, { bg: string; text: string; border: string }> = {
  critical: { bg: 'bg-danger-50', text: 'text-danger-700', border: 'border-danger-100' },
  high: { bg: 'bg-danger-50', text: 'text-danger-700', border: 'border-danger-100' },
  medium: { bg: 'bg-warning-50', text: 'text-warning-700', border: 'border-warning-100' },
  low: { bg: 'bg-sage-50', text: 'text-forest-700', border: 'border-sage-100' },
};

export default function PlatformOperationsPage() {
  const [data, setData] = useState<OperationsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'ALL' | 'SECURITY' | 'DELIVERY' | 'APPROVAL' | 'BILLING'>('ALL');
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const result = await apiFetch('/super-admin/dashboard/operations');
      setData(result as OperationsData);
    } catch (err: any) {
      setError(err?.message || 'Could not load platform alerts and activity.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const alerts = useMemo(() => {
    if (!data) return [];
    let list = data.alerts;
    if (filter !== 'ALL') {
      list = list.filter((a) => a.type === filter);
    }
    const needle = search.trim().toLowerCase();
    if (needle) {
      list = list.filter(
        (a) =>
          a.title.toLowerCase().includes(needle) ||
          a.description.toLowerCase().includes(needle) ||
          (a.school || '').toLowerCase().includes(needle) ||
          (a.user || '').toLowerCase().includes(needle),
      );
    }
    return list;
  }, [data, filter, search]);

  const activity = useMemo(() => {
    if (!data) return [];
    const needle = search.trim().toLowerCase();
    if (!needle) return data.recentActivity;
    return data.recentActivity.filter(
      (a) =>
        a.action.toLowerCase().includes(needle) ||
        a.module.toLowerCase().includes(needle) ||
        a.user.toLowerCase().includes(needle) ||
        a.school.toLowerCase().includes(needle),
    );
  }, [data, search]);

  const counts = useMemo(() => {
    if (!data) return { critical: 0, high: 0, medium: 0, low: 0 };
    return {
      critical: data.criticalCount,
      high: data.highCount,
      medium: data.mediumCount,
      low: data.lowCount,
    };
  }, [data]);

  return (
    <div className="space-y-6 sm:space-y-8 p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-charcoal-900">
            Platform Alerts & Activity
          </h1>
          <p className="mt-1 text-[11px] font-bold uppercase tracking-wide text-warm-500">
            Platform-wide alerts and audit activity across all schools
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold text-warm-400 uppercase tracking-wide">
            Generated {data ? new Date(data.generatedAt).toLocaleString() : '—'}
          </span>
          <button
            onClick={load}
            disabled={loading || refreshing}
            className="rounded-xl border border-warm-200 bg-card p-3 text-warm-500 shadow-sm transition hover:text-forest-700"
          >
            <RefreshCw size={18} className={(loading || refreshing) && 'animate-spin'} />
          </button>
        </div>
      </div>

      {error && (
        <div
          role="alert"
          className="flex flex-col gap-3 rounded-xl border border-danger-200 bg-danger-50 p-4 text-sm font-semibold text-danger-700 sm:flex-row sm:items-center sm:justify-between"
        >
          <span>{error}</span>
          <Button variant="outline" size="sm" onClick={load} disabled={loading || refreshing}>
            Try again
          </Button>
        </div>
      )}

      {/* Alert summary cards */}
      {data && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <StatCard
            label="All Alerts"
            value={data.alertCount}
            subtitle="Platform-wide"
            icon={<Bell size={20} />}
            color="bg-warm-50 text-warm-700 border-warm-100"
          />
          <StatCard
            label="Critical"
            value={counts.critical}
            subtitle="Immediate attention"
            icon={<AlertCircle size={20} />}
            color="bg-danger-50 text-danger-700 border-danger-100"
          />
          <StatCard
            label="High"
            value={counts.high}
            subtitle="Needs action soon"
            icon={<AlertTriangle size={20} />}
            color="bg-danger-50 text-danger-700 border-danger-100"
          />
          <StatCard
            label="Medium"
            value={counts.medium}
            subtitle="Review required"
            icon={<Activity size={20} />}
            color="bg-warning-50 text-warning-700 border-warning-100"
          />
          <StatCard
            label="Low"
            value={counts.low}
            subtitle="Informational"
            icon={<Bell size={20} />}
            color="bg-sage-50 text-forest-700 border-sage-100"
          />
          <StatCard
            label="Low SMS Credits"
            value={data?.lowSmsCreditSchools?.length ?? 0}
            subtitle="Schools below 10 credits"
            icon={<Phone size={20} />}
            color={data?.lowSmsCreditSchools?.length ? 'bg-danger-50 text-danger-700 border-danger-100' : 'bg-sage-50 text-forest-700 border-sage-100'}
          />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Alerts panel */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex flex-col gap-3 border-b border-warm-100 bg-ivory-50/50 p-4 sm:p-6 sm:flex-row sm:items-end">
            <div className="flex flex-1 items-center rounded-2xl border border-warm-200 bg-card px-5 py-3 shadow-sm">
              <Search size={18} className="mr-3 shrink-0 text-warm-400" />
              <input
                type="search"
                aria-label="Search alerts"
                placeholder="Search by title, school, or actor…"
                className="w-full border-none bg-transparent text-sm font-bold text-charcoal-900 placeholder:text-warm-400 focus:ring-0"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </div>
            <div className="w-full lg:w-64 sm:mt-0 mt-3">
              <select
                value={filter}
                onChange={(event) => setFilter(event.target.value as any)}
                className="w-full rounded-xl border border-warm-200 bg-card px-4 py-2.5 text-xs font-bold uppercase tracking-wide text-warm-600 focus:border-forest-500 focus:ring-1 focus:ring-forest-500"
              >
                <option value="ALL">All alert types</option>
                <option value="SECURITY">Security events</option>
                <option value="DELIVERY">Failed deliveries</option>
                <option value="APPROVAL">Pending approvals</option>
                <option value="BILLING">Billing issues</option>
              </select>
            </div>
          </div>

          {loading && alerts.length === 0 ? (
            <div className="flex items-center justify-center gap-2 py-16 text-sm font-medium text-warm-500">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading alerts…
            </div>
          ) : alerts.length === 0 ? (
            <EmptyState
              icon={<Bell className="h-8 w-8" />}
              title={search || filter !== 'ALL' ? 'No matching alerts' : 'No platform alerts'}
              description={
                search || filter !== 'ALL'
                  ? 'Adjust the search or filter to see other alerts.'
                  : 'Platform alerts appear here for school registrations, delivery failures, security events, and billing issues.'
              }
            />
          ) : (
            <div className="rounded-xl border border-warm-200 bg-card shadow-sm overflow-hidden">
              <table className="min-w-full divide-y divide-warm-200">
                <thead className="bg-ivory-50/50">
                  <tr>
                    <th className="px-5 py-4 text-left text-[10px] font-semibold uppercase tracking-wide text-warm-400 sm:px-8">
                      Alert
                    </th>
                    <th className="px-5 py-4 text-left text-[10px] font-semibold uppercase tracking-wide text-warm-400 sm:px-8">
                      Severity
                    </th>
                    <th className="px-5 py-4 text-left text-[10px] font-semibold uppercase tracking-wide text-warm-400 sm:px-8">
                      School
                    </th>
                    <th className="px-5 py-4 text-left text-[10px] font-semibold uppercase tracking-wide text-warm-400 sm:px-8">
                      Actor
                    </th>
                    <th className="px-5 py-4 text-left text-[10px] font-semibold uppercase tracking-wide text-warm-400 sm:px-8">
                      Time
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-warm-100 bg-card">
                  {alerts.map((alert) => {
                    const style = SEVERITY_STYLES[alert.severity] || SEVERITY_STYLES.medium;
                    return (
                      <tr key={alert.id} className="transition-colors hover:bg-ivory-50/30">
                        <td className="px-5 py-5 sm:px-8">
                          <div className="flex items-center gap-3">
                            <div className="rounded-xl p-2 text-forest-700">
                              <AlertCircle size={16} />
                            </div>
                            <div>
                              <p className="text-xs font-semibold leading-tight text-charcoal-900">
                                {alert.title}
                              </p>
                              <p className="mt-0.5 text-[11px] font-bold uppercase tracking-wide text-warm-400">
                                {String(alert.type).replace(/_/g, ' ')}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-5 sm:px-8">
                          <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${style.bg} ${style.text}`}>
                            {alert.severity}
                          </span>
                        </td>
                        <td className="px-5 py-5 sm:px-8">
                          <p className="text-[11px] font-semibold text-charcoal-900">
                            {alert.school || 'Platform'}
                          </p>
                        </td>
                        <td className="px-5 py-5 sm:px-8">
                          <p className="text-[11px] font-semibold text-charcoal-900">
                            {alert.user || 'System'}
                          </p>
                        </td>
                        <td className="px-5 py-5 sm:px-8">
                          <p className="text-[11px] font-bold text-warm-500">
                            {new Date(alert.time).toLocaleString()}
                          </p>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Activity panel */}
        <div className="space-y-4">
          <div className="rounded-xl border border-warm-200 bg-card p-5 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <Clock size={18} className="text-forest-700" />
              <h3 className="text-sm font-semibold text-charcoal-900">Recent Platform Activity</h3>
            </div>
            {loading && activity.length === 0 ? (
              <div className="py-8 text-center text-xs font-medium text-warm-500">
                <Loader2 className="h-4 w-4 animate-spin mr-2" /> Loading activity…
              </div>
            ) : activity.length === 0 ? (
              <div className="py-8 text-center">
                <EmptyState
                  icon={<Activity className="h-6 w-6" />}
                  title="No platform activity yet"
                  description="Audit entries appear here as platform administrators perform actions."
                />
              </div>
            ) : (
              <div className="space-y-3">
                {activity.map((item) => (
                  <div key={item.id} className="flex items-start gap-3 p-3 rounded-xl border border-warm-100 hover:bg-ivory-50/30 transition-colors">
                    <div className="mt-1 shrink-0 rounded-lg bg-sage-50 p-1 text-forest-700">
                      <Activity size={14} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold leading-tight text-charcoal-900">
                        {String(item.action).replace(/_/g, ' ')}
                      </p>
                      <p className="mt-0.5 text-[11px] font-bold uppercase tracking-wide text-warm-400">
                        {item.module}
                      </p>
                      <p className="mt-1 text-[11px] text-warm-500">
                        {item.user} · {item.school}
                      </p>
                      <p className="mt-1 text-[10px] font-bold text-warm-400">
                        {new Date(item.time).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Platform status quick links */}
          <div className="rounded-xl border border-warm-200 bg-card p-5 shadow-sm">
            <h3 className="mb-4 text-sm font-semibold text-charcoal-900">Platform Actions</h3>
            <div className="space-y-2">
              <a
                href="/super-admin/schools?status=PENDING"
                className="flex items-center gap-3 p-3 rounded-xl border border-warm-200 hover:bg-warm-50 transition-colors"
              >
                <Users size={16} className="text-warm-500" />
                <div>
                  <p className="text-xs font-semibold text-charcoal-900">Pending School Registrations</p>
                  {data && data.pendingApprovals > 0 ? (
                    <p className="mt-0.5 text-[11px] font-bold text-terracotta-600">
                      {data.pendingApprovals} awaiting review
                    </p>
                  ) : (
                    <p className="mt-0.5 text-[11px] font-bold text-warm-400">None pending</p>
                  )}
                </div>
              </a>
              <a
                href="/super-admin/subscriptions"
                className="flex items-center gap-3 p-3 rounded-xl border border-warm-200 hover:bg-warm-50 transition-colors"
              >
                <Wallet size={16} className="text-warm-500" />
                <div>
                  <p className="text-xs font-semibold text-charcoal-900">Expiring Trials</p>
                  {data && data.expiringTrials > 0 ? (
                    <p className="mt-0.5 text-[11px] font-bold text-terracotta-600">
                      {data.expiringTrials} trial(s) expiring
                    </p>
                  ) : (
                    <p className="mt-0.5 text-[11px] font-bold text-warm-400">None expiring</p>
                  )}
                </div>
              </a>
              <a
                href="/super-admin/audit"
                className="flex items-center gap-3 p-3 rounded-xl border border-warm-200 hover:bg-warm-50 transition-colors"
              >
                <ShieldCheck size={16} className="text-warm-500" />
                <div>
                  <p className="text-xs font-semibold text-charcoal-900">Full Audit Trail</p>
                  <p className="mt-0.5 text-[11px] font-bold text-warm-400">Cross-platform activity log</p>
                </div>
              </a>
            </div>
          </div>

          {/* Low SMS credit schools */}
          {data && data.lowSmsCreditSchools.length > 0 && (
            <div className="rounded-xl border border-danger-100 bg-danger-50 p-5 shadow-sm">
              <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-danger-800">
                <AlertTriangle size={16} /> Low SMS Credit Schools
              </h3>
              <div className="space-y-2">
                {data.lowSmsCreditSchools.map((school) => (
                  <div key={school.id} className="flex items-center justify-between p-2.5 rounded-xl bg-white/40 border border-danger-50/50">
                    <div>
                      <p className="text-xs font-semibold text-danger-800">{school.name}</p>
                      <p className="mt-0.5 text-[10px] font-bold uppercase text-danger-600">
                        {school.code}
                      </p>
                    </div>
                    <p className="text-sm font-bold text-danger-700">
                      {school.smsCreditBalance.toLocaleString()} credits
                    </p>
                  </div>
                ))}
                <a
                  href="/super-admin/sms-credits"
                  className="block w-full text-center py-2 text-[11px] font-bold uppercase text-danger-700 hover:text-danger-900"
                >
                  Manage SMS Credits
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  subtitle,
  icon,
  color,
}: {
  label: string;
  value: number;
  subtitle: string;
  icon: React.ReactNode;
  color: string;
}) {
  return (
    <div className={`rounded-xl border p-4 shadow-sm ${color}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wide text-warm-500">{label}</p>
          <p className="mt-1 text-xl font-semibold text-charcoal-900">{value}</p>
          <p className="mt-0.5 text-[10px] font-bold text-warm-400">{subtitle}</p>
        </div>
        <div className="rounded-lg p-2 text-forest-700">{icon}</div>
      </div>
    </div>
  );
}
