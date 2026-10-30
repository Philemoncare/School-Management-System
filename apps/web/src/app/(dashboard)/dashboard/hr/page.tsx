'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { apiFetch } from '@/lib/api/client';
import { Button } from '@/components/ui/button';
import {
  Users,
  UserPlus,
  Calendar,
  Clock,
  FileText,
  ChevronRight,
  Loader2,
  AlertCircle,
  ShieldAlert,
  ArrowUpRight,
  BadgeCheck,
} from 'lucide-react';

export default function HRDashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await apiFetch('/hr/dashboard');
      setData(response);
    } catch (err: any) {
      setData(null);
      setError(err?.message || 'Could not load the HR dashboard.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-3 p-20 text-sm font-medium text-warm-500">
        <Loader2 className="h-5 w-5 animate-spin text-forest-700" /> Loading workforce data…
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
            <AlertCircle size={16} /> {error || 'Workforce data is unavailable.'}
          </span>
          <Button variant="outline" size="sm" onClick={loadDashboard}>
            Try again
          </Button>
        </div>
      </div>
    );
  }

  const metrics = data.metrics ?? {};
  const departments = Array.isArray(data.departments) ? data.departments : [];
  const recentLeaveRequests = Array.isArray(data.recentLeaveRequests)
    ? data.recentLeaveRequests
    : [];
  const complianceIssues = (metrics.expiringCertifications ?? 0) + (metrics.pendingDocuments ?? 0);

  return (
    <div className="space-y-8 p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-charcoal-900 sm:text-3xl">
            Workforce command
          </h1>
          <p className="mt-1 text-sm font-medium text-warm-500">
            HR operations, staff records and compliance auditing.
          </p>
        </div>
        <Link
          href="/dashboard/hr/staff/new"
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-forest-700 px-6 py-3 text-xs font-semibold uppercase tracking-wide text-white shadow-sm transition-all hover:bg-forest-800"
        >
          <UserPlus size={18} /> Onboard staff
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          title="Total headcount"
          value={metrics.totalEmployees ?? 0}
          sub={`${metrics.activeTeachers ?? 0} teachers / ${metrics.activeStaff ?? 0} staff`}
          icon={<Users className="text-forest-700" />}
          color="bg-sage-50"
        />
        <KpiCard
          title="On leave today"
          value={metrics.employeesOnLeave ?? 0}
          sub="Approved requests"
          icon={<Calendar className="text-success-600" />}
          color="bg-success-50"
        />
        <KpiCard
          title="Absent"
          value={metrics.absentToday ?? 0}
          sub="No check-in recorded"
          icon={<Clock className="text-danger-600" />}
          color="bg-danger-50"
        />
        <KpiCard
          title="Pending requests"
          value={metrics.pendingLeaveRequests ?? 0}
          sub="Awaiting HR review"
          icon={<FileText className="text-terracotta-600" />}
          color="bg-terracotta-50"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <section className="rounded-xl border border-warm-200 bg-card p-5 shadow-sm sm:p-8">
            <h2 className="mb-6 text-xl font-semibold tracking-tight text-charcoal-900">
              Departmental distribution
            </h2>
            {departments.length === 0 ? (
              <div className="rounded-xl border-2 border-dashed border-warm-100 py-10 text-center">
                <p className="text-[11px] font-bold uppercase tracking-wide text-warm-400">
                  No departments configured
                </p>
                <Link
                  href="/dashboard/hr/departments"
                  className="mt-3 inline-flex text-[11px] font-semibold uppercase tracking-wide text-forest-700 hover:underline"
                >
                  Create a department
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                {departments.map((dept: any) => (
                  <div
                    key={dept.name}
                    className="rounded-xl border border-warm-100 bg-ivory-50 p-5 transition-all hover:border-sage-200"
                  >
                    <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-warm-400">
                      {dept.name}
                    </p>
                    <p className="text-2xl font-semibold text-charcoal-900">
                      {dept.count} <span className="text-xs text-warm-400">staff</span>
                    </p>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="rounded-xl border border-warm-200 bg-card p-5 shadow-sm sm:p-8">
            <div className="mb-6 flex items-center justify-between gap-3">
              <h2 className="text-xl font-semibold tracking-tight text-charcoal-900">
                Leave awaiting review
              </h2>
              <Link
                href="/dashboard/hr/leave"
                className="flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wide text-forest-700 hover:underline"
              >
                Leave management <ArrowUpRight size={14} />
              </Link>
            </div>
            {recentLeaveRequests.length === 0 ? (
              <p className="rounded-xl border border-warm-100 bg-ivory-50 p-4 text-xs font-semibold text-warm-500">
                No leave requests are waiting for approval.
              </p>
            ) : (
              <ul className="space-y-3">
                {recentLeaveRequests.map((request: any) => (
                  <li
                    key={request.id}
                    className="flex flex-col gap-2 rounded-xl border border-warm-100 bg-ivory-50 p-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="flex items-start gap-3">
                      <div className="rounded-xl bg-terracotta-100 p-2 text-terracotta-600">
                        <Calendar size={16} />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-charcoal-900">
                          {request.employeeName} • {request.leaveType}
                        </p>
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-warm-400">
                          {new Date(request.startDate).toLocaleDateString()} –{' '}
                          {new Date(request.endDate).toLocaleDateString()} •{' '}
                          {request.totalDays} day{Number(request.totalDays) === 1 ? '' : 's'}
                        </p>
                      </div>
                    </div>
                    <Link
                      href="/dashboard/hr/leave"
                      className="text-[11px] font-semibold uppercase tracking-wide text-forest-700 hover:underline"
                    >
                      Review
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <div className="space-y-6">
          <div className="rounded-xl bg-charcoal-900 p-5 text-white shadow-sm sm:p-8">
            <h2 className="mb-5 text-lg font-semibold tracking-tight">Operational shortcuts</h2>
            <div className="space-y-3">
              <SidebarLink label="Staff directory" href="/dashboard/hr/staff" />
              <SidebarLink label="Leave management" href="/dashboard/hr/leave" />
              <SidebarLink label="Attendance audit" href="/dashboard/hr/attendance" />
              <SidebarLink label="Manage departments" href="/dashboard/hr/departments" />
              <SidebarLink label="Position registry" href="/dashboard/hr/positions" />
            </div>
          </div>

          <div className="rounded-xl bg-forest-700 p-5 text-white shadow-sm sm:p-8">
            <h2 className="mb-2 flex items-center gap-2 text-lg font-semibold">
              <ShieldAlert size={20} /> Compliance alerts
            </h2>
            {complianceIssues > 0 ? (
              <>
                <p className="text-[11px] font-medium uppercase leading-relaxed tracking-tight text-sage-100 opacity-80">
                  {metrics.expiringCertifications ?? 0} certification
                  {(metrics.expiringCertifications ?? 0) === 1 ? '' : 's'} expire within 30 days and{' '}
                  {metrics.pendingDocuments ?? 0} document
                  {(metrics.pendingDocuments ?? 0) === 1 ? '' : 's'} await verification.
                </p>
                <ul className="mt-3 space-y-1 text-[11px] font-semibold text-sage-100">
                  <li className="flex items-center gap-2">
                    <BadgeCheck size={12} /> {metrics.expiringCertifications ?? 0} expiring
                    certifications
                  </li>
                  <li className="flex items-center gap-2">
                    <FileText size={12} /> {metrics.pendingDocuments ?? 0} unverified documents
                  </li>
                </ul>
              </>
            ) : (
              <p className="text-[11px] font-medium uppercase leading-relaxed tracking-tight text-sage-100 opacity-80">
                No certifications expire within 30 days and no documents are awaiting verification.
              </p>
            )}
            <Link
              href="/dashboard/hr/staff"
              className="mt-5 block w-full rounded-2xl border border-white/20 bg-card/10 py-3.5 text-center text-[11px] font-semibold uppercase tracking-wide transition-all hover:bg-card/20"
            >
              Review staff records
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

function SidebarLink({ label, href }: any) {
  return (
    <Link
      href={href}
      className="flex items-center justify-between rounded-2xl border border-white/5 bg-card/5 p-3.5 transition-all hover:bg-card/10"
    >
      <span className="text-[11px] font-semibold uppercase tracking-wide">{label}</span>
      <ChevronRight size={14} className="text-forest-500" />
    </Link>
  );
}
