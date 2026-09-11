'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api/client';
import Link from 'next/link';
import {
  ClipboardCheck,
  History,
  Settings,
  AlertTriangle,
  ChevronRight,
  CalendarCheck,
  FileSpreadsheet,
  BellRing
} from 'lucide-react';

export default function AttendanceDashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch('/schools/dashboard/metrics')
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  const modules = [
    { name: 'Daily Roll Call', description: 'Mark presence for active classes', href: '/dashboard/attendance/sessions', icon: ClipboardCheck, color: 'bg-green-600' },
    { name: 'Audit & History', description: 'Comprehensive attendance records', href: '/dashboard/attendance/history', icon: History, color: 'bg-blue-600' },
    { name: 'Reporting', description: 'Trends and absence summaries', href: '/dashboard/attendance/reports', icon: FileSpreadsheet, color: 'bg-purple-600' },
    { name: 'Notification Rules', description: 'Automated guardian alerts', href: '/dashboard/attendance/alerts', icon: BellRing, color: 'bg-orange-600' },
  ];

  return (
    <div className="p-8 space-y-10">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Attendance Center</h1>
          <p className="text-gray-500 mt-1 font-medium">Real-time student presence tracking and safety alerts.</p>
        </div>
        <div className="flex items-center gap-3">
           <div className="bg-white border border-gray-200 px-5 py-2.5 rounded-2xl shadow-sm">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Attendance Rate (Today)</p>
              <p className="text-xl font-black text-gray-900">{data?.stats?.attendanceRate || '0.0%'}</p>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {modules.map((module) => (
          <Link
            key={module.name}
            href={module.href}
            className="group block bg-white border border-gray-200 rounded-[2.5rem] p-8 hover:shadow-xl hover:border-blue-200 transition-all relative overflow-hidden"
          >
             <div className="flex items-center justify-between">
                <div className="flex items-center gap-6">
                   <div className={`${module.color} p-5 rounded-3xl text-white shadow-lg group-hover:scale-110 transition-transform`}>
                      <module.icon size={28} />
                   </div>
                   <div>
                      <h3 className="text-xl font-black text-gray-900 group-hover:text-blue-600 transition-colors">{module.name}</h3>
                      <p className="text-sm text-gray-500 mt-1 font-medium">{module.description}</p>
                   </div>
                </div>
                <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center text-gray-300 group-hover:bg-blue-50 group-hover:text-blue-600 transition-all">
                  <ChevronRight size={24} />
                </div>
             </div>
          </Link>
        ))}
      </div>

      {/* Summary View */}
      <div className="bg-white border border-gray-200 rounded-[2.5rem] p-8 shadow-sm">
         <h3 className="text-lg font-black text-gray-900 mb-6 flex items-center gap-2">
            <CalendarCheck className="text-blue-600" /> Recent Attendance Sessions
         </h3>
         <div className="h-48 bg-gray-50 rounded-2xl flex items-center justify-center border-2 border-dashed border-gray-100">
            <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">Live session audit stream active</p>
         </div>
      </div>
    </div>
  );
}
