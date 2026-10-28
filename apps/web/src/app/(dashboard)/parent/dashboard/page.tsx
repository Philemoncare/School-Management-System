'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Calendar,
  BookOpen,
  Clock,
  Wallet,
  Bell,
  MessageSquare,
  UserCheck,
  TrendingUp,
  AlertCircle,
  Users,
  RefreshCw,
} from 'lucide-react';
import { apiFetch } from '@/lib/api/client';
import { useAuth } from '@/context/auth-context';
import { useChild } from '@/context/child-context';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';

export default function ParentDashboard() {
  const { activeSchoolId } = useAuth();
  const { setActiveChild } = useChild();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    if (!activeSchoolId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const dashboardData = await apiFetch('/parent/dashboard');
      setData(dashboardData);
    } catch (err) {
      setData(null);
      setError(err instanceof Error ? err.message : 'Could not load the family dashboard.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [activeSchoolId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 py-20 text-xs font-semibold text-warm-500">
        <RefreshCw size={16} className="animate-spin" /> Loading family dashboard…
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-2xl space-y-4 py-6">
        <div role="alert" className="flex items-start gap-3 rounded-xl border border-danger-200 bg-danger-50 px-4 py-3 text-sm font-medium text-danger-800">
          <AlertCircle size={18} className="mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
        <Button variant="outline" size="sm" onClick={load} leftIcon={<RefreshCw size={15} />}>
          Try Again
        </Button>
      </div>
    );
  }

  const students: any[] = Array.isArray(data?.students) ? data.students : [];
  const announcements: any[] = Array.isArray(data?.announcements) ? data.announcements : [];
  const notifications: any[] = Array.isArray(data?.notifications) ? data.notifications : [];
  const summary = data?.summary || {};
  const attendance = summary.attendance || {};
  const timetable: any[] = Array.isArray(summary.timetable) ? summary.timetable : [];
  const recentResults: any[] = Array.isArray(summary.recentResults) ? summary.recentResults : [];
  const upcomingAssessments: any[] = Array.isArray(summary.upcomingAssessments) ? summary.upcomingAssessments : [];
  const activeStudentId = data?.activeStudentId ?? students[0]?.id ?? null;

  if (students.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-bold text-charcoal-900 sm:text-2xl">Family Dashboard</h1>
          <p className="mt-0.5 text-xs font-medium text-warm-500 sm:text-sm">
            Attendance, results and fee information for your children.
          </p>
        </div>
        <EmptyState
          title="No children linked to this account"
          description="Your school administrator has not linked any student records to your guardian account yet. Contact the school office to complete the link."
          icon={<Users className="h-8 w-8" />}
          actionButton={
            <Link href="/dashboard/messages">
              <Button variant="outline" size="sm">Message the School</Button>
            </Link>
          }
        />
      </div>
    );
  }

  const attendanceTotal = Object.values(attendance as Record<string, unknown>).reduce<number>(
    (total, value) => total + (Number(value) || 0),
    0,
  );
  const attendanceRate = attendanceTotal > 0
    ? ((Number((attendance as any).PRESENT) || 0) / attendanceTotal) * 100
    : 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 rounded-2xl border border-warm-200 bg-card p-4 shadow-xs sm:flex-row sm:items-center sm:p-6">
        <div>
          <h1 className="text-xl font-bold text-charcoal-900 sm:text-2xl">
            Welcome{data?.guardian?.firstName ? `, ${data.guardian.firstName}` : ''}
          </h1>
          <p className="mt-0.5 text-xs font-medium text-warm-500 sm:text-sm">
            An overview of your children&apos;s activities today.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {students.map((student: any) => (
            <Link
              key={student.id}
              href="/parent/results"
              onClick={() => setActiveChild(student)}
              className={`flex items-center gap-2 rounded-xl border px-3 py-1.5 text-xs font-bold transition-all ${
                student.id === activeStudentId
                  ? 'border-forest-700 bg-forest-700 text-white shadow-xs'
                  : 'border-warm-200 bg-card text-warm-600 hover:border-forest-700'
              }`}
            >
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-warm-200 text-[10px] font-bold text-warm-600">
                {student.firstName?.[0] || '?'}
              </span>
              <span className="max-w-[110px] truncate">{student.firstName}</span>
            </Link>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Attendance"
          value={`${attendanceRate.toFixed(1)}%`}
          icon={<UserCheck className="text-success-600" size={20} />}
          trend="Recorded average"
          color="green"
        />
        <MetricCard
          title="Latest Grade"
          value={recentResults[0]?.grade || '—'}
          icon={<TrendingUp className="text-forest-700" size={20} />}
          trend={recentResults[0]?.subject?.name || 'No published result yet'}
          color="blue"
        />
        <MetricCard
          title="Outstanding Fees"
          value={`GH₵ ${Number(summary.outstandingFees || 0).toLocaleString()}`}
          icon={<Wallet className="text-warning-600" size={20} />}
          trend="Current balance"
          color="amber"
          warning={Number(summary.outstandingFees || 0) > 0}
        />
        <MetricCard
          title="Notifications"
          value={String(notifications.length)}
          icon={<Bell className="text-terracotta-600" size={20} />}
          trend="Recent alerts"
          color="purple"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <section className="overflow-hidden rounded-2xl border border-warm-200 bg-card shadow-sm">
            <div className="flex items-center justify-between border-b border-warm-100 p-5 sm:p-6">
              <h2 className="flex items-center gap-2 text-lg font-bold text-charcoal-900">
                <Clock size={20} className="text-forest-700" /> Today&apos;s Timetable
              </h2>
              {activeStudentId && (
                <Link href="/parent/timetable" className="text-xs font-bold text-forest-700 hover:underline">
                  View Weekly
                </Link>
              )}
            </div>
            <div className="p-5 sm:p-6">
              {timetable.length === 0 ? (
                <p className="py-10 text-center text-sm font-medium text-warm-500">No classes scheduled for today.</p>
              ) : (
                <div className="space-y-3">
                  {timetable.map((entry: any) => (
                    <div key={entry.id} className="flex flex-col items-start gap-2 rounded-xl border border-warm-100 bg-ivory-50 p-3.5 sm:flex-row sm:items-center sm:gap-4 sm:p-4">
                      <p className="shrink-0 text-xs font-semibold text-charcoal-900 sm:w-24">
                        {entry.startTime} - {entry.endTime}
                      </p>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-bold text-charcoal-900 sm:text-sm">{entry.subject?.name || 'Subject'}</p>
                        <p className="truncate text-[11px] font-medium text-warm-500">
                          {entry.room?.name ? `Room ${entry.room.name}` : 'Room TBA'}
                          {entry.teacher ? ` · ${entry.teacher.firstName} ${entry.teacher.lastName}` : ''}
                        </p>
                      </div>
                      {entry.period?.periodNumber && (
                        <span className="shrink-0 rounded-lg border border-warm-200 bg-card px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-forest-700">
                          Period {entry.period.periodNumber}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <section className="rounded-2xl border border-warm-200 bg-card shadow-sm">
              <div className="border-b border-warm-100 p-5 sm:p-6">
                <h2 className="flex items-center gap-2 text-lg font-bold text-charcoal-900">
                  <BookOpen size={20} className="text-success-600" /> Recent Results
                </h2>
              </div>
              <div className="space-y-4 p-5 sm:p-6">
                {recentResults.length === 0 ? (
                  <p className="py-4 text-center text-sm text-warm-500">No published results yet.</p>
                ) : (
                  recentResults.slice(0, 4).map((result: any) => (
                    <div key={result.id} className="flex items-center justify-between">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold text-charcoal-900">{result.subject?.name || 'Subject'}</p>
                        <p className="text-[11px] font-medium uppercase text-warm-500">
                          {result.publishedAt ? new Date(result.publishedAt).toLocaleDateString() : '—'}
                        </p>
                      </div>
                      <span className="ml-2 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-sage-100 text-sm font-bold text-forest-800">
                        {result.grade || '—'}
                      </span>
                    </div>
                  ))
                )}
                {activeStudentId && (
                  <Link href="/parent/results" className="block pt-2 text-center text-xs font-bold text-warm-600 hover:text-forest-700">
                    View All Results
                  </Link>
                )}
              </div>
            </section>

            <section className="rounded-2xl border border-warm-200 bg-card shadow-sm">
              <div className="border-b border-warm-100 p-5 sm:p-6">
                <h2 className="flex items-center gap-2 text-lg font-bold text-charcoal-900">
                  <Calendar size={20} className="text-warning-600" /> Upcoming Assessments
                </h2>
              </div>
              <div className="space-y-4 p-5 sm:p-6">
                {upcomingAssessments.length === 0 ? (
                  <p className="py-4 text-center text-sm text-warm-500">No upcoming assessments.</p>
                ) : (
                  upcomingAssessments.slice(0, 4).map((assessment: any) => {
                    const start = assessment.startDate ? new Date(assessment.startDate) : null;
                    return (
                      <div key={assessment.id} className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 flex-col items-center justify-center rounded-xl border border-warning-100 bg-warning-50">
                          <span className="text-[11px] font-bold uppercase text-warning-600">
                            {start ? start.toLocaleString('default', { month: 'short' }) : '—'}
                          </span>
                          <span className="text-xs font-bold leading-none text-warning-700">
                            {start ? start.getDate() : '—'}
                          </span>
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-bold text-charcoal-900">{assessment.name}</p>
                          <p className="truncate text-[11px] font-medium uppercase text-warm-500">
                            {assessment.subject?.name || 'Subject'}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </section>
          </div>
        </div>

        <div className="space-y-6">
          <section className="rounded-2xl border border-warm-200 bg-card shadow-sm">
            <div className="border-b border-warm-100 p-5 sm:p-6">
              <h2 className="flex items-center gap-2 text-lg font-bold text-charcoal-900">
                <Bell size={20} className="text-forest-700" /> School Notices
              </h2>
            </div>
            <div className="space-y-4 p-5 sm:p-6">
              {announcements.length === 0 ? (
                <p className="py-4 text-center text-sm text-warm-500">No recent announcements.</p>
              ) : (
                announcements.map((announcement: any) => (
                  <div key={announcement.id}>
                    <p className="mb-1 text-[11px] font-bold text-forest-700">
                      {announcement.createdAt ? new Date(announcement.createdAt).toLocaleDateString() : ''}
                    </p>
                    <h3 className="line-clamp-2 text-sm font-bold text-charcoal-900">{announcement.title}</h3>
                    <p className="mt-1 line-clamp-2 text-xs text-warm-500">
                      {String(announcement.content || '').replace(/<[^>]*>?/gm, '')}
                    </p>
                  </div>
                ))
              )}
            </div>
          </section>

          <section className="rounded-xl bg-forest-800 p-6 text-white">
            <div className="mb-4 flex items-center gap-3">
              <div className="rounded-lg bg-white/15 p-2">
                <MessageSquare size={20} />
              </div>
              <h2 className="font-bold">Contact the School</h2>
            </div>
            <p className="mb-4 text-xs leading-relaxed text-sage-100">
              Have questions about your child&apos;s progress or school fees? Send a message to the school office.
            </p>
            <Link
              href="/dashboard/messages"
              className="block w-full rounded-xl bg-card py-2.5 text-center text-xs font-bold text-forest-800 transition-colors hover:bg-sage-50"
            >
              Message School
            </Link>
          </section>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ title, value, icon, trend, color, warning }: any) {
  const colors: any = {
    green: 'bg-success-50 border-success-100',
    blue: 'bg-sage-50 border-sage-100',
    amber: 'bg-warning-50 border-warning-100',
    purple: 'bg-terracotta-50 border-terracotta-100',
  };

  return (
    <div className={`rounded-2xl border p-5 shadow-sm ${colors[color] || 'bg-card'} ${warning ? 'border-danger-300 ring-2 ring-danger-50' : ''}`}>
      <div className="mb-4 flex items-start justify-between">
        <div className="rounded-xl border border-inherit bg-card p-2 shadow-sm">{icon}</div>
        {warning && <AlertCircle size={16} className="text-danger-500" />}
      </div>
      <p className="mb-1 text-xs font-bold uppercase tracking-wider text-warm-500">{title}</p>
      <h3 className="text-2xl font-semibold text-charcoal-900">{value}</h3>
      <p className="mt-2 text-[11px] font-bold uppercase text-warm-400">{trend}</p>
    </div>
  );
}
