'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Calendar as CalendarIcon, Download, AlertCircle, Lock, Inbox, RefreshCw } from 'lucide-react';
import { apiFetch, ApiError } from '@/lib/api/client';
import { useAuth } from '@/context/auth-context';
import { useChild } from '@/context/child-context';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';

const STATUS_OPTIONS = ['ALL', 'PRESENT', 'ABSENT', 'LATE', 'EXCUSED'];

export default function ParentAttendance() {
  const { activeChild, loading: childLoading } = useChild();
  const { activeSchoolId } = useAuth();
  const [attendance, setAttendance] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [denied, setDenied] = useState(false);
  const [status, setStatus] = useState('ALL');

  async function load() {
    if (!activeChild || !activeSchoolId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    setDenied(false);
    try {
      const data = await apiFetch(`/parent/children/${activeChild.id}/attendance`);
      setAttendance(Array.isArray(data) ? data : []);
    } catch (err) {
      setAttendance([]);
      if (err instanceof ApiError && err.isPermissionDenied()) setDenied(true);
      else setError(err instanceof Error ? err.message : 'Could not load attendance records.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeChild?.id, activeSchoolId]);

  const filtered = useMemo(
    () => (status === 'ALL' ? attendance : attendance.filter((record) => record.status === status)),
    [attendance, status],
  );

  const summary = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const record of attendance) counts[record.status] = (counts[record.status] || 0) + 1;
    const total = attendance.length;
    const present = counts.PRESENT || 0;
    return { counts, total, rate: total > 0 ? ((present / total) * 100).toFixed(1) : '—' };
  }, [attendance]);

  function exportCsv() {
    if (filtered.length === 0) return;
    const rows = [
      ['Date', 'Session', 'Subject', 'Status', 'Check In', 'Remarks'],
      ...filtered.map((record) => [
        record.session?.date ? new Date(record.session.date).toISOString().slice(0, 10) : '',
        record.session?.sessionType || '',
        record.session?.subject?.name || '',
        record.status || '',
        record.checkInTime ? new Date(record.checkInTime).toLocaleTimeString() : '',
        (record.reason || record.remarks || '').replace(/"/g, '""'),
      ]),
    ];
    const csv = rows.map((row) => row.map((cell) => `"${String(cell)}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `attendance-${activeChild?.firstName || 'child'}-${new Date().toISOString().slice(0, 10)}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  if (childLoading || (loading && !!activeChild)) {
    return (
      <div className="flex items-center justify-center gap-2 py-20 text-xs font-semibold text-warm-500">
        <RefreshCw size={16} className="animate-spin" /> Loading attendance records…
      </div>
    );
  }

  if (!activeChild) {
    return (
      <EmptyState
        title="No child linked yet"
        description="Your school has not linked a student record to this guardian account. Contact the school office to complete the link."
        icon={<Inbox className="h-8 w-8" />}
        actionButton={<Link href="/parent/children"><Button variant="outline" size="sm">Family Overview</Button></Link>}
      />
    );
  }

  if (denied) {
    return (
      <EmptyState
        title="Attendance is not available"
        description="Your account does not have permission to view this child's attendance records."
        icon={<Lock className="h-8 w-8" />}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-charcoal-900 sm:text-2xl">Attendance History</h1>
          <p className="mt-0.5 text-xs font-medium text-warm-500 sm:text-sm">
            Attendance records for {activeChild.firstName} {activeChild.lastName}.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <label htmlFor="attendance-status" className="sr-only">Filter by status</label>
          <select
            id="attendance-status"
            value={status}
            onChange={(event) => setStatus(event.target.value)}
            className="h-9 rounded-lg border border-warm-300 bg-card px-3 text-xs font-semibold text-charcoal-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-forest-600/30"
          >
            {STATUS_OPTIONS.map((option) => (
              <option key={option} value={option}>{option === 'ALL' ? 'All statuses' : option}</option>
            ))}
          </select>
          <Button variant="outline" size="sm" onClick={exportCsv} disabled={filtered.length === 0} leftIcon={<Download size={15} />}>
            Export CSV
          </Button>
          <Button variant="outline" size="sm" onClick={load} isLoading={loading} leftIcon={<RefreshCw size={15} />}>
            Refresh
          </Button>
        </div>
      </div>

      {error && (
        <div role="alert" className="flex items-start gap-3 rounded-xl border border-danger-200 bg-danger-50 px-4 py-3 text-sm font-medium text-danger-800">
          <AlertCircle size={18} className="mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: 'Recorded', value: summary.total },
          { label: 'Present', value: summary.counts.PRESENT || 0 },
          { label: 'Absent', value: summary.counts.ABSENT || 0 },
          { label: 'Attendance rate', value: `${summary.rate}%` },
        ].map((item) => (
          <div key={item.label} className="rounded-2xl border border-warm-200 bg-card p-4 shadow-xs">
            <p className="text-[11px] font-bold uppercase tracking-wide text-warm-400">{item.label}</p>
            <p className="mt-1 text-xl font-semibold text-charcoal-900">{item.value}</p>
          </div>
        ))}
      </div>

      {attendance.length === 0 ? (
        <EmptyState
          title="No attendance recorded yet"
          description="Attendance will appear here as soon as your child's teacher marks a class register."
          icon={<CalendarIcon className="h-8 w-8" />}
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          title="No records match this filter"
          description="Try selecting a different attendance status."
          icon={<CalendarIcon className="h-8 w-8" />}
        />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-warm-200 bg-card shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] border-collapse text-left">
              <thead>
                <tr className="border-b border-warm-200 bg-ivory-50">
                  <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wide text-warm-500 sm:px-6">Date</th>
                  <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wide text-warm-500 sm:px-6">Session / Subject</th>
                  <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wide text-warm-500 sm:px-6">Status</th>
                  <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wide text-warm-500 sm:px-6">Check In</th>
                  <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wide text-warm-500 sm:px-6">Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-warm-100">
                {filtered.map((record) => (
                  <tr key={record.id} className="transition-colors hover:bg-ivory-50/60">
                    <td className="px-4 py-3 sm:px-6 sm:py-4">
                      <span className="text-xs font-semibold text-charcoal-900 sm:text-sm">
                        {record.session?.date ? new Date(record.session.date).toLocaleDateString() : '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3 sm:px-6 sm:py-4">
                      <span className="text-xs font-semibold text-charcoal-900 sm:text-sm">{record.session?.sessionType || 'School day'}</span>
                      <p className="text-[11px] font-medium uppercase text-warm-500">{record.session?.subject?.name || 'General'}</p>
                    </td>
                    <td className="px-4 py-3 sm:px-6 sm:py-4"><StatusBadge status={record.status} /></td>
                    <td className="px-4 py-3 text-xs font-medium text-warm-500 sm:px-6 sm:py-4">
                      {record.checkInTime ? new Date(record.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}
                    </td>
                    <td className="px-4 py-3 text-xs text-warm-500 sm:px-6 sm:py-4">{record.reason || record.remarks || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    PRESENT: 'bg-success-50 text-success-700 border-success-100',
    ABSENT: 'bg-danger-50 text-danger-700 border-danger-100',
    LATE: 'bg-warning-50 text-warning-700 border-warning-100',
    EXCUSED: 'bg-sage-50 text-forest-800 border-sage-100',
  };

  return (
    <span className={`inline-flex rounded-lg border px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider ${styles[status] || 'border-warm-200 bg-ivory-50 text-warm-600'}`}>
      {status || 'UNKNOWN'}
    </span>
  );
}
