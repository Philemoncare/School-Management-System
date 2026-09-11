'use client';

import React, { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api/client';
import {
  Clock,
  MapPin,
  User,
  Calendar,
  Loader2,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  LayoutGrid
} from 'lucide-react';

export default function StudentTimetable() {
  const [entries, setEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch student's own timetable based on their enrollment
    apiFetch('/timetable/entries?classId=own') // Backend should handle 'own' filter
      .then(setEntries)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-20 text-center"><Loader2 className="animate-spin mx-auto text-blue-600" size={48} /></div>;

  return (
    <div className="p-8 space-y-10">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight leading-tight">My <span className="text-blue-600">Schedule</span></h1>
          <p className="text-gray-500 font-bold mt-1 uppercase tracking-widest text-[10px]">Academic Year 2026/2027 • Term 2</p>
        </div>
        <div className="flex bg-white border border-gray-200 rounded-2xl p-1 shadow-sm">
           <button className="px-6 py-2 bg-gray-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg">Weekly</button>
           <button className="px-6 py-2 text-gray-500 rounded-xl text-[10px] font-black uppercase tracking-widest">Today</button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].map((day, idx) => (
           <div key={day} className="space-y-6">
              <div className="text-center pb-4 border-b border-gray-100">
                 <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{day}</p>
              </div>
              <div className="space-y-4">
                 {entries.filter(e => e.dayOfWeek === idx + 1).map((entry) => (
                    <div key={entry.id} className="p-5 bg-white border border-gray-100 rounded-3xl shadow-sm hover:shadow-xl transition-all group hover:-translate-y-1">
                       <div className="flex justify-between items-start mb-4">
                          <p className="text-[9px] font-black text-blue-600 uppercase bg-blue-50 px-2 py-0.5 rounded-full">{entry.period?.name || 'Lesson'}</p>
                          <Clock size={12} className="text-gray-300" />
                       </div>
                       <h4 className="text-sm font-black text-gray-900 group-hover:text-blue-600 transition-colors leading-tight">{entry.subject.name}</h4>
                       <div className="mt-6 space-y-2">
                          <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400 uppercase">
                             <User size={12} className="text-gray-300"/> {entry.teacher.firstName} {entry.teacher.lastName}
                          </div>
                          <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400 uppercase">
                             <MapPin size={12} className="text-gray-300"/> {entry.room?.name || 'Main Hall'}
                          </div>
                       </div>
                    </div>
                 ))}
                 {entries.filter(e => e.dayOfWeek === idx + 1).length === 0 && (
                    <div className="py-10 text-center bg-gray-50/50 rounded-[2rem] border border-dashed border-gray-100">
                       <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Free Period</p>
                    </div>
                 )}
              </div>
           </div>
        ))}
      </div>
    </div>
  );
}
