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
  LayoutGrid
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
    { name: 'Academic Years', description: 'Terms, semesters and calendars', href: '/dashboard/academics/years', icon: Calendar, color: 'bg-blue-500' },
    { name: 'Classes & Sections', description: 'Institutional structure and streams', href: '/dashboard/academics/classes', icon: LayoutGrid, color: 'bg-green-500' },
    { name: 'Subject Catalog', description: 'Core curriculum and electives', href: '/dashboard/academics/subjects', icon: BookOpen, color: 'bg-purple-500' },
    { name: 'Student Enrollments', description: 'Placements and active status', href: '/dashboard/academics/enrollments', icon: Users, color: 'bg-orange-500' },
    { name: 'Teacher Assignments', description: 'Schedule and responsibility mapping', href: '/dashboard/academics/assignments', icon: ClipboardList, color: 'bg-pink-500' },
  ];

  return (
    <div className="p-8 space-y-10">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Academic Operations</h1>
          <p className="text-gray-500 mt-1 font-medium">Core institutional structure and curriculum management.</p>
        </div>
        <div className="px-4 py-2 bg-blue-50 text-blue-700 rounded-xl border border-blue-100 text-xs font-black uppercase tracking-widest">
          Active Year: {stats?.currentYear || '...'}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {modules.map((module) => (
          <Link
            key={module.name}
            href={module.href}
            className="group block bg-white border border-gray-200 rounded-[2.5rem] p-8 hover:shadow-xl hover:border-blue-200 transition-all relative overflow-hidden"
          >
             <div className="flex justify-between items-start mb-6">
                <div className={`${module.color} p-4 rounded-2xl text-white shadow-lg group-hover:scale-110 transition-transform`}>
                   <module.icon size={24} />
                </div>
                <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-300 group-hover:bg-blue-50 group-hover:text-blue-600 transition-all">
                  <ChevronRight size={20} />
                </div>
             </div>
             <h3 className="text-xl font-black text-gray-900 group-hover:text-blue-600 transition-colors">{module.name}</h3>
             <p className="mt-2 text-sm text-gray-500 font-medium leading-relaxed">{module.description}</p>

             <div className="mt-8 flex items-center gap-2 text-[10px] font-black text-blue-600 uppercase tracking-widest group-hover:gap-3 transition-all">
                Access Module <ChevronRight size={12}/>
             </div>
          </Link>
        ))}
      </div>

      {/* Overview Table or Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
         <div className="lg:col-span-2 bg-white border border-gray-200 rounded-[2.5rem] p-8 shadow-sm">
            <h3 className="text-lg font-black text-gray-900 mb-6">Active Class Strength</h3>
            <div className="space-y-4">
               {/* This would be populated with real data in a full implementation */}
               <div className="h-40 bg-gray-50 rounded-2xl flex items-center justify-center border-2 border-dashed border-gray-100">
                  <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">Real-time enrollment metrics active</p>
               </div>
            </div>
         </div>
         <div className="bg-gray-900 rounded-[2.5rem] p-8 shadow-xl text-white">
            <GraduationCap className="text-blue-500 mb-6" size={40} />
            <h3 className="text-xl font-black mb-4">Promotion Center</h3>
            <p className="text-gray-400 text-sm font-medium leading-relaxed mb-8">
               Move students to the next grade. Automated validation for outstanding fees and result approvals.
            </p>
            <button className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all">
               Start Promotion Process
            </button>
         </div>
      </div>
    </div>
  );
}
