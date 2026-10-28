'use client';

import React, { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api/client';
import {
  Calendar as CalendarIcon,
  Plus,
  ChevronLeft,
  ChevronRight,
  Loader2,
  MoreVertical,
  Clock,
  MapPin,
  Tag,
  AlertCircle
} from 'lucide-react';

export default function AcademicCalendarPage() {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());

  useEffect(() => {
    loadCalendar();
  }, []);

  async function loadCalendar() {
    setLoading(true);
    try {
      // In a real app we'd pass academicYearId
      const data = await apiFetch('/timetable/calendar');
      setEvents(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-8 space-y-10">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-semibold text-charcoal-900 tracking-tight">Academic Calendar</h1>
          <p className="text-warm-500 mt-1 font-medium text-sm">Schedule teaching days, holidays, and school-wide events.</p>
        </div>
        <button className="bg-forest-700 text-white px-6 py-3 rounded-2xl font-semibold text-xs uppercase tracking-wide hover:bg-forest-800 transition-all shadow-xs shadow-sage-200 flex items-center gap-2">
          <Plus size={18} /> Schedule Event
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-card border border-warm-200 rounded-xl p-8 shadow-sm">
           <div className="flex justify-between items-center mb-8">
              <div className="flex items-center gap-4">
                 <h3 className="text-xl font-semibold text-charcoal-900 tracking-tight">
                    {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
                 </h3>
                 <div className="flex gap-1">
                    <button className="p-2 hover:bg-ivory-50 rounded-xl transition-all"><ChevronLeft size={18}/></button>
                    <button className="p-2 hover:bg-ivory-50 rounded-xl transition-all"><ChevronRight size={18}/></button>
                 </div>
              </div>
              <button className="text-[11px] font-semibold text-forest-700 uppercase tracking-wide bg-sage-50 px-4 py-2 rounded-xl">Today</button>
           </div>

           <div className="grid grid-cols-7 gap-px bg-warm-100 border border-warm-100 rounded-2xl overflow-hidden">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                 <div key={day} className="bg-ivory-50 p-4 text-center">
                    <span className="text-[11px] font-semibold text-warm-400 uppercase tracking-wide">{day}</span>
                 </div>
              ))}
              {Array.from({ length: 35 }).map((_, i) => (
                 <div key={i} className="bg-card min-h-[120px] p-4 group hover:bg-sage-50/30 transition-all cursor-pointer">
                    <span className="text-xs font-bold text-warm-400 group-hover:text-forest-700">{i + 1}</span>
                    {i === 15 && (
                       <div className="mt-2 p-2 bg-forest-700 rounded-lg text-white shadow-lg shadow-sage-100">
                          <p className="text-[11px] font-semibold uppercase leading-tight line-clamp-1">Mid-Term Exam</p>
                       </div>
                    )}
                 </div>
              ))}
           </div>
        </div>

        <div className="space-y-8">
           <section className="bg-charcoal-900 rounded-xl p-8 shadow-xs text-white">
              <h3 className="text-lg font-semibold mb-8 tracking-tight">Upcoming Dates</h3>
              <div className="space-y-6">
                 {events.map((event) => (
                    <div key={event.id} className="flex gap-6 group">
                       <div className="text-center min-w-[40px]">
                          <p className="text-xl font-semibold text-sage-400 leading-none">{new Date(event.startDate).getDate()}</p>
                          <p className="text-[11px] font-semibold text-warm-500 uppercase mt-1">{new Date(event.startDate).toLocaleString('default', { month: 'short' })}</p>
                       </div>
                       <div className="flex-1">
                          <p className="text-sm font-semibold group-hover:text-sage-400 transition-colors">{event.title}</p>
                          <div className="flex items-center gap-3 mt-1.5 opacity-50">
                             <span className="text-[11px] font-bold uppercase tracking-tight flex items-center gap-1"><Tag size={10}/> {event.type}</span>
                             <span className="text-[11px] font-bold uppercase tracking-tight flex items-center gap-1"><Clock size={10}/> 09:00</span>
                          </div>
                       </div>
                    </div>
                 ))}
                 {events.length === 0 && (
                    <div className="py-12 text-center border border-white/5 rounded-xl">
                       <CalendarIcon className="mx-auto text-white/10 mb-4" size={40} />
                       <p className="text-warm-500 font-bold uppercase tracking-wide text-[11px]">No scheduled events</p>
                    </div>
                 )}
              </div>
           </section>

           <div className="bg-forest-700 rounded-xl p-8 shadow-xs text-white">
              <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                <AlertCircle size={20}/> Term Notice
              </h3>
              <p className="text-sage-100 text-xs font-medium leading-relaxed opacity-80 uppercase tracking-tight">
                Term 2 ends in 14 days. Final grade submissions must be completed before the orientation week starts.
              </p>
           </div>
        </div>
      </div>
    </div>
  );
}
