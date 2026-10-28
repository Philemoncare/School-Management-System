'use client';

import React, { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api/client';
import { useAuth } from '@/context/auth-context';
import { CheckCircle, Loader2, Calendar } from 'lucide-react';

export default function StudentAttendance() {
  const { activeSchoolId } = useAuth();
  const [attendance, setAttendance] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!activeSchoolId) return;
    apiFetch('/student/attendance')
      .then(setAttendance)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [activeSchoolId]);

  if (loading) return <div className="p-20 text-center"><Loader2 className="animate-spin mx-auto text-forest-700" size={48} /></div>;

  const total = attendance.length;
  const present = attendance.filter(a => a.status === 'PRESENT').length;
  const rate = total > 0 ? ((present / total) * 100).toFixed(1) : '100.0';

  return (
    <div className="space-y-6">
      <div className="bg-card p-6 rounded-2xl border border-warm-100 shadow-sm flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-charcoal-900 flex items-center gap-2">
            <CheckCircle className="text-success-600" />
            My Attendance Record
          </h1>
          <p className="text-warm-500 text-sm">Review your official daily and subject-level attendance logs.</p>
        </div>
        <div className="text-right">
          <p className="text-[11px] font-bold text-warm-400 uppercase tracking-wide">Attendance Rate</p>
          <p className="text-3xl font-semibold text-success-600">{rate}%</p>
        </div>
      </div>

      <div className="bg-card border border-warm-100 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-ivory-50 text-[11px] font-bold text-warm-400 uppercase tracking-wider border-b border-warm-100">
                <th className="p-4">Date</th>
                <th className="p-4">Session Type</th>
                <th className="p-4">Subject</th>
                <th className="p-4">Status</th>
                <th className="p-4">Remarks</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ivory-50 text-sm text-warm-700 font-medium">
              {attendance.map((record) => (
                <tr key={record.id} className="hover:bg-ivory-50/50 transition-colors">
                  <td className="p-4 font-bold text-charcoal-900">{new Date(record.session?.date).toLocaleDateString('en-US', { dateStyle: 'medium' })}</td>
                  <td className="p-4 text-xs text-warm-500">{record.session?.sessionType}</td>
                  <td className="p-4 text-xs">{record.session?.subject?.name || 'General Daily Roll'}</td>
                  <td className="p-4">
                    <span className={`px-2 py-0.5 rounded-md font-bold text-xs uppercase ${
                      record.status === 'PRESENT' ? 'bg-success-50 text-success-700' : 'bg-danger-50 text-danger-700'
                    }`}>
                      {record.status}
                    </span>
                  </td>
                  <td className="p-4 text-xs text-warm-500 italic">{record.remarks || 'No remarks'}</td>
                </tr>
              ))}
              {attendance.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center p-12 text-warm-400 italic font-medium">
                    <Calendar className="mx-auto text-warm-200 mb-2" size={40} />
                    No attendance records found yet.
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
