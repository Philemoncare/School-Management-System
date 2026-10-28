'use client';

import React, { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api/client';
import {
  AlertCircle,
  BarChart3,
  BookOpen,
  ClipboardCheck,
  Download,
  Loader2,
  Users,
} from 'lucide-react';

type Summary = {
  stats: {
    classes: number;
    subjects: number;
    students: number;
    assignments: number;
    pendingAssessments: number;
    attendanceRate: number | null;
  };
  classes: Array<{
    sectionId: string;
    className: string;
    sectionName: string;
    subjects: string[];
    students: number;
    attendanceRate: number | null;
    present: number;
    absent: number;
    late: number;
    assignments: number;
  }>;
};

export default function TeacherReportsPage() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    apiFetch('/teacher-portal/reports/summary')
      .then(setSummary)
      .catch((err) => setError(err.message || 'Unable to load class reports.'))
      .finally(() => setLoading(false));
  }, []);

  function exportCsv() {
    if (!summary) return;
    const rows = [
      ['Class', 'Section', 'Subjects', 'Students', 'Attendance Rate (%)', 'Present', 'Absent', 'Late', 'Assignments'],
      ...summary.classes.map((item) => [
        item.className,
        item.sectionName,
        item.subjects.join(', '),
        item.students,
        item.attendanceRate ?? '',
        item.present,
        item.absent,
        item.late,
        item.assignments,
      ]),
    ];
    const csv = rows.map((row) => row.map((cell) => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(',')).join('\r\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `teacher-report-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  if (loading) return <div className="p-20 text-center"><Loader2 className="animate-spin mx-auto text-forest-700" size={40} /></div>;

  if (error) {
    return (
      <div className="p-8">
        <div className="flex items-start gap-3 rounded-xl border border-danger-200 bg-danger-50 p-5 text-danger-700">
          <AlertCircle size={20} className="shrink-0 mt-0.5" />
          <p className="text-sm font-semibold">{error}</p>
        </div>
      </div>
    );
  }

  if (!summary) return null;

  return (
    <div className="p-8 space-y-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-3xl font-semibold text-charcoal-900 tracking-tight flex items-center gap-3">
            <BarChart3 className="text-forest-700" /> Academic Reports
          </h1>
          <p className="text-warm-500 font-bold mt-1 uppercase tracking-wide text-[11px]">Live class, attendance and assignment summaries</p>
        </div>
        <button onClick={exportCsv} disabled={summary.classes.length === 0} className="bg-forest-700 text-white px-6 py-3 rounded-xl font-semibold text-xs uppercase tracking-wide hover:bg-forest-800 transition-all flex items-center gap-2 disabled:opacity-50">
          <Download size={16} /> Export Class Report
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
        <MetricCard label="Class Sections" value={summary.stats.classes} icon={<BookOpen size={20} />} />
        <MetricCard label="Students" value={summary.stats.students} icon={<Users size={20} />} />
        <MetricCard label="Assignments" value={summary.stats.assignments} icon={<ClipboardCheck size={20} />} />
        <MetricCard label="Attendance Rate" value={summary.stats.attendanceRate === null ? 'No records' : `${summary.stats.attendanceRate}%`} icon={<BarChart3 size={20} />} />
      </div>

      <div className="bg-card border border-warm-200 rounded-xl shadow-sm overflow-hidden">
        <div className="p-6 border-b border-warm-100 bg-ivory-50/50">
          <h3 className="text-lg font-semibold text-charcoal-900">Class Overview</h3>
          <p className="text-xs font-medium text-warm-400 mt-1">{summary.stats.subjects} subjects - {summary.stats.pendingAssessments} pending assessments</p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-warm-200">
            <thead>
              <tr>
                <th className="px-6 py-4 text-left text-[11px] font-semibold uppercase tracking-wide text-warm-400">Class</th>
                <th className="px-6 py-4 text-left text-[11px] font-semibold uppercase tracking-wide text-warm-400">Subjects</th>
                <th className="px-6 py-4 text-left text-[11px] font-semibold uppercase tracking-wide text-warm-400">Students</th>
                <th className="px-6 py-4 text-left text-[11px] font-semibold uppercase tracking-wide text-warm-400">Attendance</th>
                <th className="px-6 py-4 text-left text-[11px] font-semibold uppercase tracking-wide text-warm-400">Assignments</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-warm-100">
              {summary.classes.map((item) => (
                <tr key={item.sectionId} className="hover:bg-ivory-50 transition-colors">
                  <td className="px-6 py-5 text-sm font-semibold text-charcoal-900">{item.className} {item.sectionName ? `/ ${item.sectionName}` : ''}</td>
                  <td className="px-6 py-5 text-sm font-medium text-warm-600">{item.subjects.join(', ')}</td>
                  <td className="px-6 py-5 text-sm font-semibold text-charcoal-900">{item.students}</td>
                  <td className="px-6 py-5">
                    {item.attendanceRate === null ? (
                      <span className="text-xs font-medium text-warm-400">No records</span>
                    ) : (
                      <div className="flex items-center gap-3">
                        <div className="h-2 w-20 rounded-full bg-warm-100 overflow-hidden">
                          <div className="h-full bg-forest-700" style={{ width: `${item.attendanceRate}%` }} />
                        </div>
                        <span className="text-xs font-semibold text-charcoal-900">{item.attendanceRate}%</span>
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-5 text-sm font-semibold text-charcoal-900">{item.assignments}</td>
                </tr>
              ))}
              {summary.classes.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-20 text-center">
                    <BarChart3 className="mx-auto text-warm-200 mb-4" size={56} />
                    <p className="text-warm-400 font-semibold">No classes are assigned to you yet.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ label, value, icon }: { label: string; value: number | string; icon: React.ReactNode }) {
  return (
    <div className="bg-card border border-warm-200 rounded-xl p-6 shadow-sm">
      <div className="w-10 h-10 rounded-xl bg-sage-50 text-forest-700 flex items-center justify-center mb-4">{icon}</div>
      <p className="text-[11px] font-semibold uppercase tracking-wide text-warm-400">{label}</p>
      <p className="text-2xl font-semibold text-charcoal-900 mt-1">{value}</p>
    </div>
  );
}
