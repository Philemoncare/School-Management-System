'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api/client';
import { Button } from '@/components/ui/button';
import {
  Users,
  GraduationCap,
  Calendar,
  Activity,
  ArrowRight,
  ShieldCheck,
  Clock,
  AlertCircle,
  Loader2,
  Download,
} from 'lucide-react';
import Link from 'next/link';

export default function SchoolOverviewPage() {
  const [data, setData] = useState<any>(null);
  const [school, setSchool] = useState<any>(null);
  const [subscription, setSubscription] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notices, setNotices] = useState<string[]>([]);

  const loadOverview = useCallback(async () => {
    setLoading(true);
    setError('');
    const [metricsResult, schoolResult, subscriptionResult] = await Promise.allSettled([
      apiFetch('/schools/dashboard/metrics'),
      apiFetch('/schools/me'),
      apiFetch('/subscriptions/my-subscription'),
    ]);

    const messages: string[] = [];

    if (metricsResult.status === 'fulfilled') {
      setData(metricsResult.value);
    } else {
      setData(null);
      messages.push(
        metricsResult.reason?.message || 'Institutional metrics could not be loaded.',
      );
    }

    if (schoolResult.status === 'fulfilled') {
      setSchool(schoolResult.value);
    } else {
      setSchool(null);
    }

    if (subscriptionResult.status === 'fulfilled') {
      setSubscription(subscriptionResult.value);
    } else {
      setSubscription(null);
    }

    setNotices(messages);
    setError(messages[0] ?? '');
    setLoading(false);
  }, []);

  useEffect(() => {
    loadOverview();
  }, [loadOverview]);

  function exportReport() {
    if (!data) return;
    const rows: string[][] = [
      ['Section', 'Metric', 'Value'],
      ['Institution', 'Name', school?.name ?? '—'],
      ['Institution', 'Timezone', school?.timezone ?? '—'],
      ['Institution', 'Currency', school?.currency ?? '—'],
      ['Academic', 'Academic year', data?.academicContext?.year ?? '—'],
      ['Academic', 'Current term', data?.academicContext?.term ?? '—'],
      ['Population', 'Active students', String(data?.stats?.students ?? 0)],
      ['Population', 'Active teachers', String(data?.stats?.teachers ?? 0)],
      ['Population', 'Active staff', String(data?.stats?.staff ?? 0)],
      ['Population', 'Active classes', String(data?.stats?.activeClasses ?? 0)],
      ['Attendance', "Today's attendance rate", String(data?.stats?.attendanceRate ?? '0%')],
      ['Finance', 'Total invoiced', String(data?.stats?.totalInvoiced ?? 0)],
      ['Finance', 'Outstanding fees', String(data?.stats?.outstandingFees ?? 0)],
      ['Subscription', 'Plan', subscription?.plan?.name ?? 'No active plan'],
      ['Subscription', 'Status', subscription?.status ?? '—'],
      ['Subscription', 'Renews', subscription?.currentPeriodEnd ?? '—'],
    ];

    const csv = rows
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\r\n');
    const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `institution-overview-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-3 p-20 text-sm font-medium text-warm-500">
        <Loader2 className="h-5 w-5 animate-spin text-forest-700" /> Loading institutional overview…
      </div>
    );
  }

  return (
    <div className="space-y-8 p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-charcoal-900 sm:text-3xl">
            Institutional overview
          </h1>
          <p className="mt-1 text-sm font-medium text-warm-500">
            High-level operational health and metadata summary.
          </p>
        </div>
        <Button
          variant="outline"
          onClick={exportReport}
          disabled={!data}
          leftIcon={<Download size={16} />}
        >
          Export report (CSV)
        </Button>
      </div>

      {error && (
        <div
          role="alert"
          className="flex flex-col gap-3 rounded-2xl border border-danger-200 bg-danger-50 p-4 text-xs font-semibold text-danger-700 sm:flex-row sm:items-center sm:justify-between"
        >
          <span className="flex items-center gap-2">
            <AlertCircle size={16} /> {notices.join(' ')}
          </span>
          <Button variant="outline" size="sm" onClick={loadOverview}>
            Try again
          </Button>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="rounded-xl border border-warm-200 bg-card p-6 shadow-sm sm:p-8">
          <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-forest-700 text-2xl font-semibold text-white shadow-sm">
            {(school?.name ?? 'S').slice(0, 1).toUpperCase()}
          </div>
          <h2 className="text-xl font-semibold text-charcoal-900">
            {school?.name ?? 'School profile unavailable'}
          </h2>
          <p className="mt-1 text-[11px] font-bold uppercase tracking-wide text-warm-400">
            Managed institution
          </p>

          <div className="mt-8 space-y-5">
            <DetailRow
              label="System status"
              value={error ? 'Metrics unavailable' : 'Operational'}
              color={error ? 'text-danger-600' : 'text-success-600'}
            />
            <DetailRow label="Academic year" value={data?.academicContext?.year ?? 'Not set'} />
            <DetailRow label="Current term" value={data?.academicContext?.term ?? 'Not set'} />
            <DetailRow
              label="Timezone"
              value={school?.timezone ?? 'Not configured'}
            />
            <DetailRow label="Currency" value={school?.currency ?? 'Not configured'} />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:col-span-2">
          <OverviewCard
            title="Student strength"
            value={data?.stats?.students}
            sub="Active admitted"
            icon={<Users className="text-forest-700" />}
            link="/dashboard/students"
          />
          <OverviewCard
            title="Academic staff"
            value={data?.stats?.teachers}
            sub="Active teachers"
            icon={<GraduationCap className="text-terracotta-600" />}
            link="/dashboard/teachers"
          />
          <OverviewCard
            title="Class streams"
            value={data?.stats?.activeClasses}
            sub="Active classes"
            icon={<Calendar className="text-success-600" />}
            link="/dashboard/academics/classes"
          />
          <OverviewCard
            title="Attendance rate"
            value={data?.stats?.attendanceRate}
            sub="Today's roll call"
            icon={<Activity className="text-terracotta-600" />}
            link="/dashboard/attendance"
          />
        </div>
      </div>

      <div className="relative overflow-hidden rounded-xl bg-charcoal-900 p-6 text-white shadow-sm sm:p-10">
        <div className="relative z-10 flex flex-col justify-between gap-8 md:flex-row md:items-center">
          <div className="max-w-md">
            <div className="mb-5 flex items-center gap-3">
              <ShieldCheck className="text-forest-500" size={32} />
              <span className="rounded-lg bg-card/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide">
                Platform entitlement
              </span>
            </div>
            <h3 className="mb-3 text-2xl font-semibold sm:text-3xl">
              {subscription?.plan?.name ?? 'No active plan'}
            </h3>
            <p className="text-sm font-medium leading-relaxed text-warm-400">
              {subscription
                ? `Status: ${String(subscription.status).replace(/_/g, ' ').toLowerCase()}${
                    subscription.currentPeriodEnd
                      ? ` • Current period ends ${new Date(
                          subscription.currentPeriodEnd,
                        ).toLocaleDateString()}`
                      : ''
                  }`
                : 'This school does not have a subscription on record. Visit billing to choose a plan.'}
            </p>
          </div>
          <div className="flex shrink-0 gap-4">
            <Link
              href="/dashboard/billing"
              className="rounded-2xl bg-card px-6 py-3.5 text-xs font-semibold uppercase tracking-wide text-charcoal-900 transition-colors hover:bg-warm-100"
            >
              Manage subscription
            </Link>
          </div>
        </div>
        <div className="absolute right-0 top-0 h-64 w-64 -translate-y-1/2 translate-x-1/2 rounded-full bg-forest-700/10 blur-3xl" />
      </div>
    </div>
  );
}

function DetailRow({ label, value, color = 'text-charcoal-900' }: any) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-ivory-50 pb-4 last:border-0 last:pb-0">
      <span className="text-[11px] font-semibold uppercase tracking-wide text-warm-400">
        {label}
      </span>
      <span className={`truncate text-sm font-semibold ${color}`}>{value || '—'}</span>
    </div>
  );
}

function OverviewCard({ title, value, sub, icon, link }: any) {
  return (
    <div className="group rounded-xl border border-warm-200 bg-card p-6 shadow-sm transition-shadow hover:shadow-md sm:p-8">
      <div className="mb-5 flex items-start justify-between">
        <div className="rounded-2xl bg-ivory-50 p-3.5 transition-all group-hover:bg-card group-hover:shadow-sm">
          {icon}
        </div>
        <Link
          href={link}
          aria-label={`Open ${title}`}
          className="p-2 text-warm-300 transition-colors hover:text-forest-700"
        >
          <ArrowRight size={20} />
        </Link>
      </div>
      <p className="text-[11px] font-semibold uppercase tracking-wide text-warm-400">{title}</p>
      <p className="mt-1 text-3xl font-semibold text-charcoal-900">{value ?? '0'}</p>
      <p className="mt-2 flex items-center gap-1 text-[11px] font-bold italic text-warm-400">
        <Clock size={10} /> {sub}
      </p>
    </div>
  );
}
