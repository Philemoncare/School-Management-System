'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api/client';
import Link from 'next/link';
import {
  Calendar,
  BookOpen,
  Layers,
  Users,
  ChevronRight,
  ClipboardList,
  GraduationCap,
  LayoutGrid,
  Clock,
} from 'lucide-react';

export default function AcademicsDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  async function loadStats() {
    try {
      const [years, classes, subjects] = await Promise.all([
        apiFetch('/academic-years'),
        apiFetch('/classes'),
        apiFetch('/subjects'),
      ]);

      setStats({
        yearsCount: years.length,
        classesCount: classes.length,
        subjectsCount: subjects.length,
        currentYear: years.find((y: any) => y.isCurrent)?.name || 'None Set'
      });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const modules = [
    { name: 'Academic Years', description: 'Terms, semesters and calendars', href: '/dashboard/academics/years', icon: Calendar, color: 'bg-forest-500' },
    { name: 'Student Enrollments', description: 'Placements and active status', href: '/dashboard/academics/enrollments', icon: Users, color: 'bg-terracotta-500' },
    { name: 'Timetable', description: 'Schedules and lesson periods', href: '/dashboard/academics/timetable', icon: Clock, color: 'bg-forest-500' },
    { name: 'Rooms & Spaces', description: 'Classrooms and facility capacity', href: '/dashboard/academics/rooms', icon: LayoutGrid, color: 'bg-success-500' },
    { name: 'Academic Calendar', description: 'Term dates and key milestones', href: '/dashboard/academics/calendar', icon: Calendar, color: 'bg-terracotta-500' },
  ];

  return (
    <div className="p-8 space-y-10">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-semibold text-charcoal-900 tracking-tight">Academic Operations</h1>
          <p className="text-warm-500 mt-1 font-medium">Core institutional structure and curriculum management.</p>
        </div>
        <div className="px-4 py-2 bg-sage-50 text-forest-800 rounded-xl border border-sage-100 text-xs font-semibold uppercase tracking-wide">
          Active Year: {stats?.currentYear || '...'}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {modules.map((module) => (
          <Link
            key={module.name}
            href={module.href}
            className="group block bg-card border border-warm-200 rounded-xl p-8 hover:shadow-xs hover:border-sage-200 transition-all relative overflow-hidden"
          >
             <div className="flex justify-between items-start mb-6">
                <div className={`${module.color} p-4 rounded-2xl text-white shadow-lg group-hover:scale-110 transition-transform`}>
                   <module.icon size={24} />
                </div>
                <div className="w-10 h-10 rounded-full bg-ivory-50 flex items-center justify-center text-warm-300 group-hover:bg-sage-50 group-hover:text-forest-700 transition-all">
                  <ChevronRight size={20} />
                </div>
             </div>
             <h3 className="text-xl font-semibold text-charcoal-900 group-hover:text-forest-700 transition-colors">{module.name}</h3>
             <p className="mt-2 text-sm text-warm-500 font-medium leading-relaxed">{module.description}</p>

             <div className="mt-8 flex items-center gap-2 text-[11px] font-semibold text-forest-700 uppercase tracking-wide group-hover:gap-3 transition-all">
                Access Module <ChevronRight size={12}/>
             </div>
          </Link>
        ))}
      </div>

      {/* Overview Table or Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
         <div className="lg:col-span-2 bg-card border border-warm-200 rounded-xl p-8 shadow-sm">
            <h3 className="text-lg font-semibold text-charcoal-900 mb-6">Active Class Strength</h3>
            <div className="space-y-4">
               {/* This would be populated with real data in a full implementation */}
               <div className="h-40 bg-ivory-50 rounded-2xl flex items-center justify-center border-2 border-dashed border-warm-100">
                  <p className="text-warm-400 font-bold uppercase tracking-wide text-xs">Real-time enrollment metrics active</p>
               </div>
            </div>
         </div>
         <div className="bg-charcoal-900 rounded-xl p-8 shadow-xs text-white">
            <GraduationCap className="text-forest-500 mb-6" size={40} />
            <h3 className="text-xl font-semibold mb-4">Promotion Center</h3>
            <p className="text-warm-400 text-sm font-medium leading-relaxed mb-8">
               Move students to the next grade. Automated validation for outstanding fees and result approvals.
            </p>
            <button className="w-full py-4 bg-forest-700 hover:bg-forest-800 text-white rounded-2xl font-semibold text-xs uppercase tracking-wide transition-all">
               Start Promotion Process
            </button>
         </div>
      </div>
    </div>
  );
}
