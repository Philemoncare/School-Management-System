'use client';

import { Select } from '@/components/ui/input';
import React, { useEffect, useMemo, useState } from 'react';
import { apiFetch } from '@/lib/api/client';
import {
  AlertCircle,
  Calendar,
  CheckCircle,
  Clock,
  FileSpreadsheet,
  History,
  Loader2,
  Search,
  XCircle,
} from 'lucide-react';

type RecordItem = {
  id: string;
  status: string;
  remarks?: string | null;
  student: { id: string; firstName: string; lastName: string; studentNumber: string };
  session: {
    date: string;
    class: { id: string; name: string };
    section?: { name: string } | null;
    subject?: { name: string } | null;
  };
};

const STATUS_STYLES: Record<string, string> = {
  PRESENT: 'bg-success-50 text-success-700',
  ABSENT: 'bg-danger-50 text-danger-700',
  LATE: 'bg-warning-50 text-warning-700',
  EXCUSED: 'bg-sage-50 text-forest-700',
};

export default function AttendanceHistoryPage() {
  const [records, setRecords] = useState<RecordItem[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [classId, setClassId] = useState('');
  const [status, setStatus] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    apiFetch('/classes').then(setClasses).catch(() => setClasses([]));
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => {
      const params = new URLSearchParams();
      if (search.trim()) params.set('search', search.trim());
      if (classId) params.set('classId', classId);
      if (status) params.set('status', status);
      if (startDate) params.set('startDate', startDate);
      if (endDate) params.set('endDate', endDate);

      setLoading(true);
      setError('');
      apiFetch(`/attendance/records${params.toString() ? `?${params.toString()}` : ''}`)
        .then(setRecords)
        .catch((err) => setError(err.message || 'Unable to load attendance records.'))
        .finally(() => setLoading(false));
    }, 300);

    return () => clearTimeout(timeout);
  }, [search, classId, status, startDate, endDate]);

  const summary = useMemo(() => ({
    present: records.filter((item) => item.status === 'PRESENT').length,
    absent: records.filter((item) => item.status === 'ABSENT').length,
    late: records.filter((item) => item.status === 'LATE').length,
  }), [records]);

  function exportCsv() {
    const rows = [
      ['Student', 'Student Number', 'Class', 'Section', 'Subject', 'Date', 'Status', 'Remarks'],
      ...records.map((record) => [
        `${record.student.firstName} ${record.student.lastName}`,
        record.student.studentNumber,
        record.session.class?.name || '',
        record.session.section?.name || '',
        record.session.subject?.name || '',
        new Date(record.session.date).toLocaleDateString(),
        record.status,
        record.remarks || '',
      ]),
    ];
    const csv = rows.map((row) => row.map((cell) => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(',')).join('\r\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `attendance-audit-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="p-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
        <div>
          <h1 className="text-3xl font-semibold text-charcoal-900 tracking-tight flex items-center gap-3">
            <History className="text-forest-700" /> Attendance Audit
          </h1>
          <p className="text-warm-500 font-medium mt-1">Review student attendance history across all classes and subjects.</p>
        </div>
        <button onClick={exportCsv} disabled={records.length === 0} className="bg-card border border-warm-200 text-warm-700 px-6 py-3 rounded-xl font-semibold hover:bg-ivory-50 transition-all flex items-center gap-2 shadow-sm disabled:opacity-50">
          <FileSpreadsheet size={18} /> Export Audit Log
        </button>
      </div>

      {error && (
        <div className="mb-6 flex items-start gap-3 rounded-xl border border-danger-200 bg-danger-50 p-4 text-danger-700">
          <AlertCircle size={18} className="shrink-0 mt-0.5" />
          <p className="text-sm font-semibold">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-8">
        <SummaryCard label="Present" value={summary.present} color="text-success-700" icon={<CheckCircle size={18} />} />
        <SummaryCard label="Absent" value={summary.absent} color="text-danger-700" icon={<XCircle size={18} />} />
        <SummaryCard label="Late" value={summary.late} color="text-warning-700" icon={<Clock size={18} />} />
      </div>

      <div className="bg-card border border-warm-200 rounded-xl shadow-sm overflow-hidden">
        <div className="p-6 border-b border-warm-100 flex flex-col xl:flex-row items-stretch xl:items-center gap-4 bg-ivory-50/50">
          <div className="flex-1 bg-card border border-warm-200 px-4 py-2.5 rounded-xl flex items-center shadow-sm min-w-[220px]">
            <Search size={18} className="text-warm-400 mr-3 shrink-0" />
            <input type="text" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search by student name or ID..." className="bg-transparent border-none w-full focus:ring-0 text-sm font-medium placeholder:text-warm-400 outline-none" />
          </div>
          <Select value={classId} onChange={(event) => setClassId(event.target.value)} className="bg-card border border-warm-200 px-4 py-2.5 rounded-xl text-sm font-medium text-warm-700">
            <option value="">All classes</option>
            {classes.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
          </Select>
          <Select value={status} onChange={(event) => setStatus(event.target.value)} className="bg-card border border-warm-200 px-4 py-2.5 rounded-xl text-sm font-medium text-warm-700">
            <option value="">All statuses</option>
            <option value="PRESENT">Present</option>
            <option value="ABSENT">Absent</option>
            <option value="LATE">Late</option>
            <option value="EXCUSED">Excused</option>
          </Select>
          <div className="flex items-center gap-2 bg-card border border-warm-200 px-3 py-2 rounded-xl">
            <Calendar size={16} className="text-warm-400" />
            <input aria-label="Start date" type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} className="bg-transparent text-xs font-medium outline-none text-warm-700" />
            <span className="text-warm-300">to</span>
            <input aria-label="End date" type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} className="bg-transparent text-xs font-medium outline-none text-warm-700" />
          </div>
        </div>

        <div className="relative overflow-x-auto min-h-[260px]">
          {loading && (
            <div className="absolute inset-0 bg-card/60 z-10 flex items-center justify-center">
              <Loader2 className="animate-spin text-forest-700" size={32} />
            </div>
          )}
          <table className="min-w-full divide-y divide-warm-200">
            <thead className="bg-card">
              <tr>
                <th className="px-6 py-4 text-left text-[11px] font-semibold text-warm-400 uppercase tracking-wide">Student</th>
                <th className="px-6 py-4 text-left text-[11px] font-semibold text-warm-400 uppercase tracking-wide">Class</th>
                <th className="px-6 py-4 text-left text-[11px] font-semibold text-warm-400 uppercase tracking-wide">Subject</th>
                <th className="px-6 py-4 text-left text-[11px] font-semibold text-warm-400 uppercase tracking-wide">Date</th>
                <th className="px-6 py-4 text-left text-[11px] font-semibold text-warm-400 uppercase tracking-wide">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-warm-100">
              {records.map((record) => (
                <tr key={record.id} className="hover:bg-ivory-50 transition-colors">
                  <td className="px-6 py-4">
                    <p className="text-sm font-semibold text-charcoal-900">{record.student.firstName} {record.student.lastName}</p>
                    <p className="text-[11px] font-medium text-warm-400">{record.student.studentNumber}</p>
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-warm-600">{record.session.class?.name}{record.session.section?.name ? ` / ${record.session.section.name}` : ''}</td>
                  <td className="px-6 py-4 text-sm font-medium text-warm-600">{record.session.subject?.name || 'General'}</td>
                  <td className="px-6 py-4 text-sm font-medium text-warm-600">{new Date(record.session.date).toLocaleDateString()}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex px-2.5 py-1 rounded-full text-[11px] font-semibold uppercase ${STATUS_STYLES[record.status] || 'bg-warm-100 text-warm-600'}`}>{record.status}</span>
                  </td>
                </tr>
              ))}
              {records.length === 0 && !loading && (
                <tr>
                  <td colSpan={5} className="px-6 py-20 text-center">
                    <History className="mx-auto text-warm-200 mb-4" size={56} />
                    <p className="text-warm-400 font-semibold">No attendance records match these filters.</p>
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

function SummaryCard({ label, value, color, icon }: { label: string; value: number; color: string; icon: React.ReactNode }) {
  return (
    <div className="bg-card border border-warm-200 rounded-xl p-5 shadow-sm flex items-center justify-between">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-wide text-warm-400">{label}</p>
        <p className={`text-2xl font-semibold mt-1 ${color}`}>{value}</p>
      </div>
      <div className={color}>{icon}</div>
    </div>
  );
}
