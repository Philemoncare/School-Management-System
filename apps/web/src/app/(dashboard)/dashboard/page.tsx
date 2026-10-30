'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { apiFetch } from '@/lib/api/client';
import { useAuth } from '@/context/auth-context';
import { useRealtime, useRealtimeEvent } from '@/hooks/use-realtime';
import {
  ArrowLeft,
  Building2,
  CalendarCheck,
  ChevronRight,
  Clock,
  CreditCard,
  GraduationCap,
  Loader2,
  Mail,
  Plus,
  RefreshCw,
  ShieldCheck,
  Smartphone,
  User,
  Users,
} from 'lucide-react';

function StatCard({ title, value, badge, icon, color }: any) {
  const colors: any = {
    forest: 'bg-forest-50 border-forest-100 text-forest-700',
    terracotta: 'bg-terracotta-50 border-terracotta-100 text-terracotta-700',
    sage: 'bg-sage-50 border-sage-100 text-forest-800',
    warm: 'bg-warm-50 border-warm-100 text-warm-700',
  };
  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className={`rounded-lg p-2.5 ${color}`}>{icon}</div>
        <span className="rounded-md border border-border px-2 py-0.5 text-[11px] font-bold text-warm-600">
          {badge}
        </span>
      </div>
      <div>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{title}</p>
        <p className="mt-1 text-2xl font-semibold tracking-tight text-foreground">{value}</p>
      </div>
    </div>
  );
}

function QuickLink({ label, href, color }: any) {
  return (
    <Link href={href} className="flex items-center gap-2.5 p-3 rounded-xl border border-border bg-card hover:border-forest-500/30 hover:bg-forest-50/30 transition-all group">
      <div className={`w-2 h-2 rounded-full ${color} shrink-0`} />
      <span className="text-xs font-semibold text-foreground/90 truncate">{label}</span>
    </Link>
  );
}

function AnnouncementsCard({ announcements }: { announcements: any[] }) {
  const current = announcements[0];
  return (
    <div className="rounded-xl border border-charcoal-800 bg-charcoal-950 p-5 text-white sm:p-6">
      <div className="space-y-3">
        <span className="inline-block rounded-md border border-forest-700 bg-forest-900 px-2.5 py-1 text-[11px] font-bold text-sage-200">
          {announcements.length > 0 ? 'Latest announcement' : 'Noticeboard'}
        </span>
        <h3 className="text-base font-semibold leading-snug sm:text-lg">
          {current ? current.title : 'No announcements published yet.'}
        </h3>
        <p className="line-clamp-2 text-xs font-medium leading-relaxed text-warm-300">
          {current ? current.content : 'Official notices and circulars will appear here once published.'}
        </p>
        <Link href="/dashboard/announcements" className="flex items-center gap-1.5 pt-2 text-xs font-semibold text-sage-300 hover:underline">
          View all notices <ChevronRight size={14}/>
        </Link>
      </div>
    </div>
  );
}

function RecentActivityCard({ activities }: { activities: any[] }) {
  return (
    <div className="bg-card border border-border rounded-2xl shadow-xs overflow-hidden">
      <div className="p-5 border-b border-border/60 flex items-center justify-between">
        <h3 className="font-semibold text-sm sm:text-base text-foreground flex items-center gap-2">
          <Clock size={16} className="text-forest-700 mr-2" />
          Recent Audit Log
        </h3>
        <Link href="/dashboard/activity" className="flex items-center gap-1 text-xs font-semibold text-forest-700 hover:underline">
          View Log <ChevronRight size={12} />
        </Link>
      </div>
      <div className="p-2 divide-y divide-border/40">
        {activities.map((item: any) => (
          <div key={item.id} className="flex gap-3 p-3 rounded-xl bg-ivory-50/50 transition-colors hover:bg-ivory-100">
            <div className="w-9 h-9 rounded-xl bg-card flex items-center justify-center shrink-0 border border-border/60">
              <Clock size={14} className="text-muted-foreground group-hover:text-foreground" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-foreground leading-snug truncate">{item.action.replace(/_/g, ' ')}</p>
              <p className="text-[11px] font-semibold text-muted-foreground mt-0.5 uppercase tracking-tight">
                {item.user?.firstName} {item.user?.lastName} &bull; {item.module}
              </p>
              <p className="text-[11px] font-medium text-muted-foreground/80 mt-0.5">
                {new Date(item.time).toLocaleTimeString()}
              </p>
            </div>
          </div>
        ))}
        {activities.length === 0 && (
          <div className="p-6 text-center text-muted-foreground text-xs font-bold uppercase tracking-wider">
            No recent system activity
          </div>
        )}
      </div>
    </div>
  );
}

function QuickLinksCard() {
  return (
    <div className="bg-card border border-border rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
      <h3 className="font-semibold text-sm sm:text-base text-foreground">Quick Flow Actions</h3>
      <div className="grid grid-cols-2 gap-2.5">
        <QuickLink label="Admit Student" href="/dashboard/students/new" color="bg-forest-500" />
        <QuickLink label="Mark Attendance" href="/dashboard/attendance" color="bg-forest-600" />
        <QuickLink label="Issue Fee Invoice" href="/dashboard/finance/invoices/new" color="bg-terracotta-500" />
        <QuickLink label="Post Assessment" href="/dashboard/assessments/new" color="bg-warning-500" />
      </div>
    </div>
  );
}

export default function SchoolDashboard() {
  const { user } = useAuth();
  const { socket } = useRealtime();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const schoolName = user?.memberships?.[0]?.school?.name || 'Your School';

  const loadMetrics = async () => {
    try {
      const metricsData = await apiFetch('/schools/dashboard/metrics');
      setData(metricsData);
    } catch (err) {
      console.error('Failed to load dashboard metrics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMetrics();
  }, []);

  useRealtimeEvent(socket, 'STUDENT_CREATED', () => loadMetrics());
  useRealtimeEvent(socket, 'PAYMENT_RECEIVED', () => loadMetrics());
  useRealtimeEvent(socket, 'ATTENDANCE_UPDATED', () => loadMetrics());

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-ivory-50">
        <Loader2 className="h-8 w-8 animate-spin text-forest-700" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-forest-700" />
            <span className="text-[11px] font-bold text-warm-400 uppercase tracking-wider block">
              School Command Center
            </span>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-charcoal-900">
            Welcome back, {user?.firstName || 'Admin'}!
          </h1>
          <p className="text-xs text-warm-500 font-bold uppercase tracking-wider mt-1">
            School Overview &bull; {schoolName}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-card border border-warm-200 px-3.5 py-1.5 rounded-xl shadow-xs hidden sm:block">
            <span className="text-[11px] font-bold text-warm-400 uppercase tracking-wider block">
              Academic Session
            </span>
            <span className="text-xs font-bold text-foreground">{data?.academicContext?.year || '2024/2025'}</span>
          </div>
          <Link
            href="/dashboard/students/new"
            className="bg-forest-800 text-primary-foreground px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold hover:bg-forest-900 transition-all shadow-md shadow-forest-100 flex items-center gap-2 min-h-[40px]"
          >
            <Plus size={16} /> Register Student
          </Link>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <StatCard
          title="Total Students"
          value={loading ? '...' : data?.stats?.students || '0'}
          badge="Enrolled"
          icon={<GraduationCap className="text-forest-700" />}
          color="bg-forest-50 border-forest-100"
        />
        <StatCard
          title="Teachers & Staff"
          value={loading ? '...' : data?.stats?.teachers || '0'}
          badge="Active"
          icon={<Users className="text-forest-700" />}
          bgColor="bg-forest-50 border-forest-100"
        />
        <StatCard
          title="Attendance Rate"
          value={loading ? '...' : data?.stats?.attendanceRate || 'No data'}
          badge="Today"
          icon={<CalendarCheck className="text-forest-700" />}
          bgColor="bg-forest-50 border-forest-100"
        />
        <StatCard
          title="Outstanding Fees"
          value={loading ? '...' : `GH₵ ${parseFloat(data?.stats?.outstandingFees || 0).toLocaleString()}`}
          badge="Receivable"
          icon={<CreditCard className="text-forest-700" />}
          bgColor="bg-forest-50 border-forest-100"
        />
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
        <div className="lg:col-span-2 space-y-6 sm:space-y-8">
          {/* Academic Overview */}
          <div className="space-y-5 rounded-xl border border-border bg-card p-5 shadow-xs sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
                  <CalendarCheck className="text-forest-700" /> Academic Overview
                </h3>
                <p className="mt-0.5 text-xs font-medium text-muted-foreground">
                  Current session details from your school workspace
                </p>
              </div>
            </div>
            <dl className="grid gap-px overflow-hidden rounded-lg border border-border bg-card sm:grid-cols-2">
              <OverviewRow label="Academic session" value={data?.academicContext?.year || 'Not set'} />
              <OverviewRow label="Current term" value={data?.academicContext?.term || 'Not set'} />
              <OverviewRow label="Attendance rate" value={data?.stats?.attendanceRate || 'No data'} />
              <OverviewRow
                label="Outstanding fees"
                value={
                  data?.stats?.outstandingFees
                    ? `GH₵ ${parseFloat(data.stats.outstandingFees).toLocaleString()}`
                    : '—'
                }
              />
            </dl>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <QuickLinksCard />
            <AnnouncementsCard announcements={data?.announcements || []} />
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="space-y-6">
          <RecentActivityCard activities={data?.recentActivity || []} />
        </div>
      </div>
    </div>
  );
}

function OverviewRow({ label, value }: { label: string; value?: string }) {
  return (
    <div className="flex items-center justify-between gap-4 bg-card px-4 py-3.5">
      <dt className="text-xs font-bold text-muted-foreground">{label}</dt>
      <dd className="text-sm font-semibold text-foreground">{value || 'Not available'}</dd>
    </div>
  );
}