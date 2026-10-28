'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Clock, CheckCircle, AlertCircle, RefreshCw, Users } from 'lucide-react';
import { apiFetch } from '@/lib/api/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { EmptyState } from '@/components/ui/empty-state';

interface StaffAttendance {
  id: string;
  date: string;
  checkIn?: string | null;
  checkOut?: string | null;
  status: string;
  notes?: string | null;
  staff?: { firstName: string; lastName: string; employeeId?: string | null } | null;
  teacher?: { firstName: string; lastName: string; employeeId?: string | null } | null;
}

function formatTime(value?: string | null) {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? '—'
    : date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export default function StaffAttendanceAuditPage() {
  const [logs, setLogs] = useState<StaffAttendance[]>([]);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function loadAttendance(target = date) {
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch(`/hr/attendance?date=${target}`);
      setLogs(Array.isArray(data) ? data : []);
    } catch (err) {
      setLogs([]);
      setError(err instanceof Error ? err.message : 'Could not load staff attendance.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAttendance();
  }, [date]);

  const present = logs.filter((item) => item.status === 'PRESENT').length;
  const late = logs.filter((item) => item.status === 'LATE').length;
  const absent = logs.filter((item) => item.status === 'ABSENT').length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/hr"
            aria-label="Back to HR"
            className="rounded-xl border border-warm-200 bg-card p-2.5 text-warm-600 transition-colors hover:text-charcoal-900"
          >
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 className="flex items-center gap-2.5 text-2xl font-bold tracking-tight text-charcoal-900 sm:text-3xl">
              <Clock className="text-forest-700" /> Staff Attendance
            </h1>
            <p className="mt-0.5 text-xs font-medium text-warm-500 sm:text-sm">
              Daily check-in, check-out and duty presence records for employees.
            </p>
          </div>
        </div>
        <div className="flex items-end gap-2">
          <Input
            type="date"
            aria-label="Attendance date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="h-10 min-h-[40px]"
          />
          <Button variant="outline" size="sm" onClick={() => loadAttendance()} isLoading={loading} leftIcon={<RefreshCw size={15} />}>
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

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <SummaryCard label="Present" value={present} tone="text-success-700 bg-success-50" />
        <SummaryCard label="Late" value={late} tone="text-warning-700 bg-warning-50" />
        <SummaryCard label="Absent" value={absent} tone="text-danger-700 bg-danger-50" />
      </div>

      <div className="overflow-hidden rounded-2xl border border-warm-200 bg-card shadow-xs">
        <div className="flex items-center justify-between border-b border-warm-100 bg-ivory-50 px-4 py-3.5 sm:px-6">
          <h2 className="text-[11px] font-bold uppercase tracking-wide text-warm-500">
            Records for {new Date(date).toLocaleDateString()}
          </h2>
          <span className="text-[11px] font-semibold text-warm-500">{logs.length} entries</span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <RefreshCw className="animate-spin text-forest-700" size={28} />
          </div>
        ) : logs.length === 0 ? (
          <div className="p-6">
            <EmptyState
              title="No attendance recorded"
              description="No staff attendance has been marked for this date. Choose another date or record attendance from the HR module."
              icon={<Users className="h-8 w-8" />}
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-warm-200">
              <thead className="bg-ivory-50">
                <tr>
                  <th className="px-4 py-3.5 text-left text-[11px] font-bold uppercase tracking-wide text-warm-400 sm:px-6">Employee</th>
                  <th className="px-4 py-3.5 text-left text-[11px] font-bold uppercase tracking-wide text-warm-400 sm:px-6">Check In</th>
                  <th className="px-4 py-3.5 text-left text-[11px] font-bold uppercase tracking-wide text-warm-400 sm:px-6">Check Out</th>
                  <th className="px-4 py-3.5 text-left text-[11px] font-bold uppercase tracking-wide text-warm-400 sm:px-6">Status</th>
                  <th className="px-4 py-3.5 text-right text-[11px] font-bold uppercase tracking-wide text-warm-400 sm:px-6">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-warm-100 bg-card">
                {logs.map((item) => {
                  const employee = item.staff || item.teacher;
                  return (
                    <tr key={item.id} className="transition-colors hover:bg-sage-50/30">
                      <td className="px-4 py-4 sm:px-6">
                        <p className="text-xs font-bold text-charcoal-900 sm:text-sm">
                          {employee ? `${employee.firstName} ${employee.lastName}` : 'Unknown employee'}
                        </p>
                        <p className="text-[11px] font-semibold uppercase text-warm-500">
                          {employee?.employeeId || 'No staff ID'}
                        </p>
                      </td>
                      <td className="px-4 py-4 font-mono text-xs font-bold text-charcoal-800 sm:px-6">{formatTime(item.checkIn)}</td>
                      <td className="px-4 py-4 font-mono text-xs font-bold text-charcoal-800 sm:px-6">{formatTime(item.checkOut)}</td>
                      <td className="px-4 py-4 sm:px-6">
                        <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-tight ${
                          item.status === 'PRESENT'
                            ? 'bg-success-100 text-success-800'
                            : item.status === 'LATE'
                              ? 'bg-warning-100 text-warning-800'
                              : 'bg-danger-100 text-danger-800'
                        }`}>
                          {item.status.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-right text-xs font-semibold text-warm-500 sm:px-6">
                        {new Date(item.date).toLocaleDateString()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <p className="flex items-center gap-2 text-[11px] font-medium text-warm-500">
        <CheckCircle size={14} className="text-forest-700" />
        Records are read directly from the school&apos;s staff attendance register.
      </p>
    </div>
  );
}

function SummaryCard({ label, value, tone }: { label: string; value: number; tone: string }) {
  return (
    <div className="rounded-xl border border-warm-200 bg-card p-4 shadow-xs">
      <p className="text-[11px] font-bold uppercase tracking-wide text-warm-500">{label}</p>
      <p className={`mt-1 inline-block rounded-lg px-2 py-0.5 text-xl font-semibold ${tone}`}>{value}</p>
    </div>
  );
}
