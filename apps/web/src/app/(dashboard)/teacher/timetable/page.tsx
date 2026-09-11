'use client';

import React, { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api/client';
import {
  Clock,
  MapPin,
  CalendarDays,
  ChevronLeft,
  Loader2,
  BookMarked
} from 'lucide-react';
import Link from 'next/link';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export default function TeacherTimetablePage() {
  const [timetable, setTimetable] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch('/teacher-portal/timetable')
      .then(setTimetable)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="p-8 space-y-10">
      <div className="flex items-center gap-4">
        <Link href="/teacher/dashboard" className="p-2.5 bg-white border border-gray-200 rounded-2xl hover:bg-gray-50 transition-colors shadow-sm text-gray-500">
           <ChevronLeft size={20} />
        </Link>
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Academic Timetable</h1>
          <p className="text-gray-500 font-bold mt-1 uppercase tracking-widest text-[10px]">Weekly Teaching Schedule • Personal Workspace</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-7 gap-6">
        {DAYS.map((day, idx) => {
          const slots = timetable.filter(t => t.dayOfWeek === idx + 1);
          return (
            <div key={day} className="space-y-4">
               <div className="bg-gray-900 rounded-2xl py-3 px-4 text-center">
                  <span className="text-[10px] font-black text-white uppercase tracking-widest">{day}</span>
               </div>

               <div className="space-y-3">
                  {slots.map((slot) => (
                    <div key={slot.id} className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm hover:border-blue-400 transition-all group">
                       <div className="flex items-center gap-2 mb-3">
                          <Clock size={12} className="text-blue-500" />
                          <span className="text-[10px] font-black text-gray-900">{slot.startTime}</span>
                       </div>
                       <p className="text-xs font-black text-gray-800 leading-tight mb-1">{slot.subject.name}</p>
                       <p className="text-[9px] font-bold text-gray-400 uppercase">{slot.class.name} • {slot.section?.name || 'A'}</p>
                       {slot.room && (
                         <div className="mt-3 flex items-center gap-1.5 text-[9px] font-bold text-gray-400">
                            <MapPin size={10} /> {slot.room}
                         </div>
                       )}
                    </div>
                  ))}
                  {slots.length === 0 && !loading && (
                    <div className="py-8 text-center bg-gray-50/50 rounded-2xl border border-dashed border-gray-100">
                       <p className="text-[8px] font-black text-gray-300 uppercase tracking-widest">Free Period</p>
                    </div>
                  )}
                  {loading && <div className="py-12 flex justify-center"><Loader2 size={16} className="animate-spin text-gray-200" /></div>}
               </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
