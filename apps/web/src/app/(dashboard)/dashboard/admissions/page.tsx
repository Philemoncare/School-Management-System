'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { apiFetch } from '@/lib/api/client';
import { Button } from '@/components/ui/button';
import {
  Users,
  UserPlus,
  FileCheck,
  Calendar,
  ChevronRight,
  Loader2,
  TrendingUp,
  Inbox,
  AlertCircle,
  CheckCircle,
  Clock,
  CalendarClock,
} from 'lucide-react';

export default function AdmissionsDashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await apiFetch('/admissions/dashboard');
      setData(response);
    } catch (err: any) {
      setData(null);
      setError(err?.message || 'Could not load the admissions dashboard.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const closingSoon = useMemo(() => {
    const campaigns = Array.isArray(data?.activeCampaigns) ? data.activeCampaigns : [];
    const threshold = Date.now() + 48 * 60 * 60 * 1000;
    return campaigns.filter((campaign: any) => {
      if (!campaign.applicationCloseDate) return false;
      const closes = new Date(campaign.applicationCloseDate).getTime();
      return closes >= Date.now() && closes <= threshold;
    });
  }, [data]);

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-3 p-20 text-sm font-medium text-warm-500">
        <Loader2 className="h-5 w-5 animate-spin text-forest-700" /> Loading admissions data…
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="mx-auto max-w-2xl space-y-4 p-6 sm:p-10">
        <div
          role="alert"
          className="flex flex-col gap-3 rounded-2xl border border-danger-200 bg-danger-50 p-4 text-xs font-semibold text-danger-700 sm:flex-row sm:items-center sm:justify-between"
        >
          <span className="flex items-center gap-2">
            <AlertCircle size={16} /> {error || 'Admissions data is unavailable.'}
          </span>
          <Button variant="outline" size="sm" onClick={loadDashboard}>
            Try again
          </Button>
        </div>
      </div>
    );
  }

  const metrics = data.metrics ?? {};
  const activeCampaigns = Array.isArray(data.activeCampaigns) ? data.activeCampaigns : [];

  return (
    <div className="space-y-8 p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-charcoal-900 sm:text-3xl">
            Admissions intake
          </h1>
          <p className="mt-1 text-sm font-medium text-warm-500">
            Manage student applications, screening and enrolment conversion.
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Link
            href="/dashboard/admissions/campaigns/new"
            className="inline-flex items-center justify-center rounded-2xl border border-warm-200 bg-card px-6 py-3 text-xs font-semibold uppercase tracking-wide text-warm-700 shadow-sm transition-all hover:bg-ivory-50"
          >
            New campaign
          </Link>
          <Link
            href="/dashboard/admissions/applications/new"
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-forest-700 px-6 py-3 text-xs font-semibold uppercase tracking-wide text-white shadow-sm transition-all hover:bg-forest-800"
          >
            <UserPlus size={18} /> Register applicant
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          title="Total applicants"
          value={metrics.totalApplications ?? 0}
          sub="Cumulative lifetime"
          icon={<Users className="text-forest-700" />}
          color="bg-sage-50"
        />
        <KpiCard
          title="New & unreviewed"
          value={metrics.newApplications ?? 0}
          sub={`${metrics.underReview ?? 0} under review`}
          icon={<Inbox className="text-warning-600" />}
          color="bg-warning-50"
        />
        <KpiCard
          title="Offers accepted"
          value={metrics.offersAccepted ?? 0}
          sub={`${metrics.offersIssued ?? 0} offers issued`}
          icon={<CheckCircle className="text-success-600" />}
          color="bg-success-50"
        />
        <KpiCard
          title="Enrolled"
          value={metrics.enrolled ?? 0}
          sub="Converted students"
          icon={<FileCheck className="text-terracotta-600" />}
          color="bg-terracotta-50"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <section className="rounded-xl border border-warm-200 bg-card p-5 shadow-sm sm:p-8">
            <div className="mb-6 flex items-center justify-between gap-3">
              <h2 className="text-xl font-semibold tracking-tight text-charcoal-900">
                Active admission campaigns
              </h2>
              <Link
                href="/dashboard/admissions/campaigns"
                className="flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wide text-forest-700 hover:underline"
              >
                View all <ChevronRight size={14} />
              </Link>
            </div>
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              {activeCampaigns.map((campaign: any) => (
                <div
                  key={campaign.id}
                  className="group rounded-xl border border-warm-100 bg-ivory-50 p-5 transition-all hover:border-sage-200"
                >
                  <div className="mb-4 flex items-start justify-between">
                    <div className="rounded-2xl bg-card p-3 shadow-sm transition-all group-hover:bg-forest-700 group-hover:text-white">
                      <Calendar size={22} />
                    </div>
                    <span className="rounded bg-success-100 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-success-700">
                      Open
                    </span>
                  </div>
                  <h3 className="text-lg font-semibold leading-tight text-charcoal-900">
                    {campaign.name}
                  </h3>
                  <p className="mt-1 text-[11px] font-bold uppercase text-warm-400">
                    {campaign.applicationCloseDate
                      ? `Closes ${new Date(campaign.applicationCloseDate).toLocaleDateString()}`
                      : 'No closing date set'}
                  </p>
                  <div className="mt-5 flex items-center justify-between border-t border-warm-100 pt-4">
                    <p className="text-xs font-semibold text-charcoal-900">
                      {campaign._count?.applications ?? 0}{' '}
                      <span className="text-[11px] font-bold uppercase text-warm-400">apps</span>
                    </p>
                    <Link
                      href={`/dashboard/admissions/applications?campaignId=${campaign.id}`}
                      aria-label={`View applications for ${campaign.name}`}
                      className="text-forest-700"
                    >
                      <TrendingUp size={18} />
                    </Link>
                  </div>
                </div>
              ))}
              {activeCampaigns.length === 0 && (
                <div className="col-span-full rounded-xl border-2 border-dashed border-warm-100 py-12 text-center">
                  <p className="text-xs font-bold uppercase tracking-wide text-warm-400">
                    No open campaigns
                  </p>
                  <Link
                    href="/dashboard/admissions/campaigns/new"
                    className="mt-3 inline-flex text-[11px] font-semibold uppercase tracking-wide text-forest-700 hover:underline"
                  >
                    Create a campaign
                  </Link>
                </div>
              )}
            </div>
          </section>

          <section className="rounded-xl border border-warm-200 bg-card p-5 shadow-sm sm:p-8">
            <h2 className="mb-6 text-xl font-semibold tracking-tight text-charcoal-900">
              Conversion funnel
            </h2>
            <div className="flex h-56 items-end gap-4 px-2 sm:px-4">
              <Bar
                label="Applications"
                value={metrics.totalApplications ?? 0}
                max={metrics.totalApplications ?? 0}
                color="bg-sage-400"
              />
              <Bar
                label="Offers"
                value={(metrics.offersIssued ?? 0) + (metrics.offersAccepted ?? 0)}
                max={metrics.totalApplications ?? 0}
                color="bg-warning-400"
              />
              <Bar
                label="Accepted"
                value={metrics.offersAccepted ?? 0}
                max={metrics.totalApplications ?? 0}
                color="bg-sage-400"
              />
              <Bar
                label="Enrolled"
                value={metrics.enrolled ?? 0}
                max={metrics.totalApplications ?? 0}
                color="bg-terracotta-400"
              />
            </div>
            {(metrics.totalApplications ?? 0) === 0 && (
              <p className="mt-4 text-center text-[11px] font-semibold uppercase tracking-wide text-warm-400">
                The funnel will populate as applications arrive.
              </p>
            )}
          </section>
        </div>

        <div className="space-y-6">
          <div className="rounded-xl bg-charcoal-900 p-5 text-white shadow-sm sm:p-8">
            <h2 className="mb-5 text-lg font-semibold tracking-tight">Administrative links</h2>
            <div className="space-y-3">
              <SidebarLink
                label="Application queue"
                count={metrics.newApplications}
                href="/dashboard/admissions/applications"
              />
              <SidebarLink label="Interview schedule" href="/dashboard/admissions/interviews" />
              <SidebarLink label="Document verification" href="/dashboard/admissions/documents" />
              <SidebarLink label="Offer management" href="/dashboard/admissions/offers" />
              <SidebarLink label="Waitlist registry" href="/dashboard/admissions/waitlist" />
            </div>
          </div>

          <div className="rounded-xl bg-forest-700 p-5 text-white shadow-sm sm:p-8">
            <h2 className="mb-2 flex items-center gap-2 text-lg font-semibold">
              <Clock size={20} /> Deadline watch
            </h2>
            {closingSoon.length > 0 ? (
              <>
                <p className="text-[11px] font-medium uppercase leading-relaxed tracking-tight text-sage-100 opacity-80">
                  {closingSoon.length} campaign{closingSoon.length === 1 ? '' : 's'} closing within
                  the next 48 hours. Finish pending screening.
                </p>
                <ul className="mt-3 space-y-1 text-[11px] font-semibold text-sage-100">
                  {closingSoon.slice(0, 3).map((campaign: any) => (
                    <li key={campaign.id} className="flex items-center gap-2">
                      <CalendarClock size={12} />
                      <span className="truncate">{campaign.name}</span>
                    </li>
                  ))}
                </ul>
              </>
            ) : (
              <p className="text-[11px] font-medium uppercase leading-relaxed tracking-tight text-sage-100 opacity-80">
                No campaign closes within the next 48 hours.
              </p>
            )}
            <Link
              href="/dashboard/admissions/applications"
              className="mt-5 block w-full rounded-2xl border border-white/20 bg-card/10 py-3.5 text-center text-[11px] font-semibold uppercase tracking-wide transition-all hover:bg-card/20"
            >
              Review applications
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function KpiCard({ title, value, sub, icon, color }: any) {
  return (
    <div className="flex flex-col gap-5 rounded-xl border border-warm-200 bg-card p-5 shadow-sm transition-shadow hover:shadow-md sm:p-6">
      <div className={`w-fit rounded-2xl p-3.5 ${color}`}>{icon}</div>
      <div>
        <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-warm-400">
          {title}
        </p>
        <p className="text-3xl font-semibold text-charcoal-900">{value}</p>
        <p className="mt-1 text-[11px] font-bold italic text-warm-400">{sub}</p>
      </div>
    </div>
  );
}

function SidebarLink({ label, count, href }: any) {
  return (
    <Link
      href={href}
      className="group flex items-center justify-between rounded-2xl border border-white/5 bg-card/5 p-3.5 transition-all hover:bg-card/10"
    >
      <span className="text-[11px] font-semibold uppercase tracking-wide">{label}</span>
      <div className="flex items-center gap-3">
        {count > 0 && (
          <span className="rounded bg-forest-500 px-2 py-0.5 text-[11px] font-semibold">{count}</span>
        )}
        <ChevronRight size={14} className="text-warm-500 group-hover:text-sage-400" />
      </div>
    </Link>
  );
}

function Bar({ label, value, max, color }: any) {
  const height = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  return (
    <div className="flex flex-1 flex-col items-center gap-3">
      <div className="flex w-full flex-1 flex-col justify-end overflow-hidden rounded-t-2xl bg-ivory-50">
        <div
          className={`${color} w-full transition-all duration-700`}
          style={{ height: `${height}%` }}
        />
      </div>
      <div className="text-center">
        <p className="text-sm font-semibold text-charcoal-900">{value}</p>
        <p className="text-[10px] font-semibold uppercase tracking-wide text-warm-400">{label}</p>
      </div>
    </div>
  );
}
