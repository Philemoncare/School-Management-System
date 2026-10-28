'use client';

import React, { useEffect, useState } from 'react';
import { useChild } from '@/context/child-context';
import { useAuth } from '@/context/auth-context';
import { Clock, MapPin, User } from 'lucide-react';

const DAYS_OF_WEEK = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function ParentTimetable() {
  const { activeChild, loading: childLoading } = useChild();
  const { activeSchoolId } = useAuth();
  const [timetable, setTimetable] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchTimetable() {
      if (!activeChild || !activeSchoolId) return;
      setLoading(true);
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/parent/children/${activeChild.id}/timetable`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'x-school-id': activeSchoolId,
          },
        });
        const data = await response.json();
        setTimetable(data);
      } catch (error) {
        console.error('Failed to fetch timetable:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchTimetable();
  }, [activeChild, activeSchoolId]);

  if (childLoading || loading) return <div>Loading timetable entries...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-charcoal-900">Weekly Timetable</h1>
        <p className="text-warm-500">Class schedule and period structure for {activeChild?.firstName}.</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-4">
        {DAYS_OF_WEEK.map((dayName, index) => {
          if (index === 0 || index === 6) return null; // Hide weekend columns
          const entries = timetable.filter((e) => e.dayOfWeek === index);

          return (
            <div key={dayName} className="bg-card p-4 rounded-2xl border border-warm-100 shadow-sm flex flex-col gap-3">
              <h3 className="font-bold text-charcoal-900 text-sm border-b border-ivory-50 pb-2">{dayName}</h3>
              {entries.length > 0 ? (
                entries.map((entry) => (
                  <div key={entry.id} className="p-3 bg-ivory-50 rounded-xl border border-warm-100 space-y-1.5">
                    <p className="text-xs font-bold text-charcoal-900">{entry.subject.name}</p>
                    <div className="flex items-center gap-1.5 text-[11px] text-warm-500 font-medium">
                      <Clock size={12} />
                      <span>{entry.startTime} - {entry.endTime}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[11px] text-warm-500 font-medium">
                      <MapPin size={12} />
                      <span>Room {entry.room?.name || 'TBA'}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[11px] text-warm-500 font-medium">
                      <User size={12} />
                      <span className="truncate">{entry.teacher?.firstName} {entry.teacher?.lastName}</span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-warm-400 italic text-center py-4">No classes</p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
