'use client';

import React, { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api/client';
import { useAuth } from '@/context/auth-context';
import { CalendarDays, Loader2, MapPin, Clock } from 'lucide-react';

export default function StudentExaminations() {
  const { activeSchoolId } = useAuth();
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!activeSchoolId) return;
    apiFetch('/student/examinations')
      .then(setSessions)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [activeSchoolId]);

  if (loading) return <div className="p-20 text-center"><Loader2 className="animate-spin mx-auto text-forest-700" size={48} /></div>;

  return (
    <div className="space-y-6">
      <div className="bg-card p-6 rounded-2xl border border-warm-100 shadow-sm">
        <h1 className="text-2xl font-bold text-charcoal-900 flex items-center gap-2">
          <CalendarDays className="text-forest-700" />
          Examination Schedule
        </h1>
        <p className="text-warm-500 text-sm">Official confirmation of upcoming assessment periods, slots, and physical desk locations.</p>
      </div>

      <div className="bg-card border border-warm-100 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-ivory-50 text-[11px] font-bold text-warm-400 uppercase tracking-wider border-b border-warm-100">
                <th className="p-4">Subject</th>
                <th className="p-4">Date</th>
                <th className="p-4">Time Slot</th>
                <th className="p-4">Room / Venue</th>
                <th className="p-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ivory-50 text-sm text-warm-700 font-medium">
              {sessions.map((session) => (
                <tr key={session.id} className="hover:bg-ivory-50/50 transition-colors">
                  <td className="p-4 font-bold text-charcoal-900">{session.subject?.name} ({session.subject?.code})</td>
                  <td className="p-4 text-xs text-warm-500">{new Date(session.date).toLocaleDateString('en-US', { dateStyle: 'medium' })}</td>
                  <td className="p-4 text-xs flex items-center gap-1 mt-1 text-warm-700">
                    <Clock size={12} className="text-warm-400" /> {session.startTime} - {session.endTime}
                  </td>
                  <td className="p-4 text-xs">
                    <span className="flex items-center gap-1 text-warm-600 font-semibold">
                      <MapPin size={12} className="text-warm-400" /> Room {session.room?.name || 'Assigned Hall'}
                    </span>
                  </td>
                  <td className="p-4">
                    <span className="px-2 py-0.5 bg-sage-50 text-forest-800 text-xs font-bold rounded-md uppercase">{session.status}</span>
                  </td>
                </tr>
              ))}
              {sessions.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center p-12 text-warm-400 italic font-medium">
                    <CalendarDays className="mx-auto text-warm-200 mb-2" size={40} />
                    No active official examination timetables currently published.
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
