'use client';

import React, { useEffect, useState } from 'react';
import { useChild } from '@/context/child-context';
import { useAuth } from '@/context/auth-context';
import { Calendar as CalendarIcon, Filter, Download } from 'lucide-react';

export default function ParentAttendance() {
  const { activeChild, loading: childLoading } = useChild();
  const { activeSchoolId } = useAuth();
  const [attendance, setAttendance] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAttendance() {
      if (!activeChild || !activeSchoolId) return;
      setLoading(true);
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/parent/children/${activeChild.id}/attendance`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'x-school-id': activeSchoolId,
          },
        });
        const data = await response.json();
        setAttendance(data);
      } catch (error) {
        console.error('Failed to fetch attendance:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchAttendance();
  }, [activeChild, activeSchoolId]);

  if (childLoading || loading) return <div>Loading attendance records...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-charcoal-900">Attendance History</h1>
          <p className="text-warm-500">Tracking attendance for {activeChild?.firstName}.</p>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 px-4 py-2 bg-card border border-warm-200 rounded-xl text-sm font-bold text-warm-600 hover:bg-ivory-50 transition-all">
            <Filter size={16} />
            Filter
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-forest-700 text-white rounded-xl text-sm font-bold hover:bg-forest-800 transition-all shadow-lg shadow-sage-200">
            <Download size={16} />
            Export Report
          </button>
        </div>
      </div>

      <div className="bg-card rounded-2xl border border-warm-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-ivory-50/50 border-b border-warm-100">
                <th className="px-6 py-4 text-[11px] font-bold text-warm-400 uppercase tracking-wide">Date</th>
                <th className="px-6 py-4 text-[11px] font-bold text-warm-400 uppercase tracking-wide">Session / Subject</th>
                <th className="px-6 py-4 text-[11px] font-bold text-warm-400 uppercase tracking-wide">Status</th>
                <th className="px-6 py-4 text-[11px] font-bold text-warm-400 uppercase tracking-wide">Check In</th>
                <th className="px-6 py-4 text-[11px] font-bold text-warm-400 uppercase tracking-wide">Remarks</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ivory-50">
              {attendance.map((record) => (
                <tr key={record.id} className="hover:bg-ivory-50/50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-sage-50 text-forest-700">
                        <CalendarIcon size={16} />
                      </div>
                      <span className="text-sm font-bold text-charcoal-900">{new Date(record.session.date).toLocaleDateString()}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm font-bold text-charcoal-900">{record.session.sessionType}</span>
                    <p className="text-[11px] text-warm-500 font-medium uppercase">{record.session.subject?.name || 'School Day'}</p>
                  </td>
                  <td className="px-6 py-4">
                    <StatusBadge status={record.status} />
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-warm-500">
                    {record.checkInTime ? new Date(record.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}
                  </td>
                  <td className="px-6 py-4 text-sm text-warm-500">
                    {record.reason || record.remarks || '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: any = {
    PRESENT: 'bg-success-50 text-success-700 border-success-100',
    ABSENT: 'bg-danger-50 text-danger-700 border-danger-100',
    LATE: 'bg-warning-50 text-warning-700 border-warning-100',
    EXCUSED: 'bg-sage-50 text-forest-800 border-sage-100',
  };

  return (
    <span className={`px-2.5 py-1 rounded-lg border text-[11px] font-bold uppercase tracking-wider ${styles[status] || 'bg-ivory-50 text-warm-600'}`}>
      {status}
    </span>
  );
}
