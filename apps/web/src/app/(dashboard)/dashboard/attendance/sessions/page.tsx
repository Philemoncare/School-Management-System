'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api/client';
import Link from 'next/link';

export default function AttendanceSessionsPage() {
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch('/attendance/sessions')
      .then(setSessions)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-8 text-center text-warm-500">Loading Sessions...</div>;

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold">Attendance Sessions</h1>
          <p className="text-warm-600 text-sm">Create or manage attendance for specific dates and classes.</p>
        </div>
        <button className="bg-forest-700 text-white px-4 py-2 rounded-lg hover:bg-forest-800 font-medium">
          Create New Session
        </button>
      </div>

      <div className="bg-card border border-warm-200 rounded-xl overflow-hidden shadow-sm">
        <table className="min-w-full divide-y divide-warm-200">
          <thead className="bg-ivory-50">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-semibold text-warm-500 uppercase">Date</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-warm-500 uppercase">Class/Section</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-warm-500 uppercase">Type</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-warm-500 uppercase">Status</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-warm-500 uppercase">Students Marked</th>
              <th className="px-6 py-4 text-right text-xs font-semibold text-warm-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-warm-200">
            {sessions.map((session) => (
              <tr key={session.id} className="hover:bg-ivory-50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-charcoal-900">
                  {new Date(session.date).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-warm-600">
                  {session.class.name} - {session.section?.name || 'No Section'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-xs text-warm-500 font-mono">
                  {session.sessionType}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 text-[11px] font-bold uppercase rounded-full ${
                    session.status === 'LOCKED' ? 'bg-warm-100 text-charcoal-800' :
                    session.status === 'COMPLETED' ? 'bg-success-100 text-success-800' : 'bg-sage-100 text-forest-900'
                  }`}>
                    {session.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-warm-500">
                  {session._count?.records || 0} Records
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                  <Link
                    href={`/dashboard/attendance/sessions/${session.id}`}
                    className="text-forest-700 hover:text-forest-950 font-semibold"
                  >
                    Open Sheet
                  </Link>
                </td>
              </tr>
            ))}
            {sessions.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-warm-500">
                  No attendance sessions found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
