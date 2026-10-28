'use client';

import React, { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api/client';
import { useAuth } from '@/context/auth-context';
import {
  Clock,
  MapPin,
  User,
  Loader2
} from 'lucide-react';

export default function StudentTimetable() {
  const { activeSchoolId } = useAuth();
  const [entries, setEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!activeSchoolId) return;
    apiFetch('/student/timetable')
      .then(setEntries)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [activeSchoolId]);

  if (loading) return <div className="p-20 text-center"><Loader2 className="animate-spin mx-auto text-forest-700" size={48} /></div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-charcoal-900">My Timetable</h1>
          <p className="text-warm-500 text-sm">Weekly schedule of all your enrolled subjects and classes.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].map((day, idx) => (
           <div key={day} className="bg-card rounded-2xl p-4 border border-warm-100 shadow-sm space-y-4">
              <div className="text-center pb-2 border-b border-warm-100">
                 <p className="text-xs font-bold text-warm-700 uppercase tracking-wider">{day}</p>
              </div>
              <div className="space-y-3">
                 {entries.filter(e => e.dayOfWeek === idx + 1).map((entry) => (
                    <div key={entry.id} className="p-3 bg-ivory-50 rounded-xl border border-warm-100/50 group">
                       <div className="flex justify-between items-center mb-2">
                          <p className="text-[11px] font-bold text-forest-700 uppercase bg-sage-50 px-2 py-0.5 rounded-md">Period {entry.period?.periodNumber || entry.period?.name}</p>
                          <span className="text-[11px] text-warm-400 font-medium flex items-center gap-1">
                            <Clock size={10} /> {entry.startTime}
                          </span>
                       </div>
                       <h4 className="text-xs font-bold text-charcoal-900 group-hover:text-forest-700 transition-colors truncate">{entry.subject?.name}</h4>
                       <div className="mt-2 space-y-1 text-[11px] text-warm-500 font-medium">
                          <div className="flex items-center gap-1.5 truncate">
                             <User size={10} className="text-warm-400"/> {entry.teacher?.firstName} {entry.teacher?.lastName}
                          </div>
                          <div className="flex items-center gap-1.5 truncate">
                             <MapPin size={10} className="text-warm-400"/> Room {entry.room?.name || 'TBA'}
                          </div>
                       </div>
                    </div>
                 ))}
                 {entries.filter(e => e.dayOfWeek === idx + 1).length === 0 && (
                    <div className="py-6 text-center bg-ivory-50/50 rounded-xl border border-dashed border-warm-200">
                       <p className="text-[11px] font-medium text-warm-400 italic">No classes</p>
                    </div>
                 )}
              </div>
           </div>
        ))}
      </div>
    </div>
  );
}
