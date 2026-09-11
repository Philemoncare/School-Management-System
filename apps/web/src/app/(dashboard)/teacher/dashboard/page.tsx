'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/auth-context';
import { apiFetch } from '@/lib/api/client';
import {
  LayoutDashboard,
  Users,
  BookMarked,
  CalendarDays,
  Clock,
  ChevronRight,
  TrendingUp,
  Bell,
  MessageSquare,
  ClipboardCheck,
  FileSpreadsheet
} from 'lucide-react';
import Link from 'next/link';

export default function TeacherDashboard() {
  const { user } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch('/teacher-portal/dashboard')
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="p-4 lg:p-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-black text-gray-900 tracking-tight leading-tight">
            Welcome back, <span className="text-blue-600">{user?.firstName}</span>
          </h1>
          <p className="text-gray-500 font-bold mt-1 uppercase tracking-widest text-[10px]">Academic Workspace • Teacher Portal</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-white border border-gray-200 px-5 py-2.5 rounded-2xl shadow-sm hidden sm:block">
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Current Date</span>
            <span className="text-sm font-black text-gray-900">{new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}</span>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="My Classes" value={loading ? '...' : data?.stats?.myClasses} icon={<BookMarked className="text-blue-600"/>} color="bg-blue-50" />
        <StatCard title="My Students" value={loading ? '...' : data?.stats?.myStudents} icon={<Users className="text-indigo-600"/>} color="bg-indigo-50" />
        <StatCard title="Pending Scores" value={loading ? '...' : data?.stats?.pendingAssessments} icon={<FileSpreadsheet className="text-orange-600"/>} color="bg-orange-50" />
        <StatCard title="Today's Load" value={loading ? '...' : `${data?.stats?.todayClasses} Classes`} icon={<Clock className="text-green-600"/>} color="bg-green-50" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Today's Schedule */}
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white border border-gray-200 rounded-[2.5rem] p-8 shadow-sm">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-xl font-black text-gray-900 tracking-tight">Today's Teaching Schedule</h3>
              <Link href="/teacher/timetable" className="text-xs font-black text-blue-600 uppercase tracking-widest hover:underline flex items-center gap-1">Full Timetable <ChevronRight size={14}/></Link>
            </div>

            <div className="space-y-4">
               {data?.todaySchedule?.map((slot: any) => (
                 <div key={slot.id} className="flex items-center gap-6 p-5 rounded-3xl bg-gray-50 border border-gray-100 hover:bg-white hover:shadow-md transition-all group">
                    <div className="w-16 text-center">
                       <p className="text-xs font-black text-gray-900">{slot.startTime}</p>
                       <p className="text-[9px] font-bold text-gray-400 uppercase">{slot.endTime}</p>
                    </div>
                    <div className="w-1.5 h-10 rounded-full bg-blue-500"></div>
                    <div className="flex-1">
                       <p className="text-sm font-black text-gray-900 leading-tight">{slot.subject.name}</p>
                       <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">{slot.class.name} • Section {slot.section?.name || 'A'}</p>
                    </div>
                    <Link href={`/teacher/attendance?classId=${slot.classId}&sectionId=${slot.sectionId}`} className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-[10px] font-black uppercase tracking-widest text-gray-500 group-hover:bg-blue-600 group-hover:text-white group-hover:border-blue-600 transition-all shadow-sm">Mark Attendance</Link>
                 </div>
               ))}
               {(!data?.todaySchedule || data.todaySchedule.length === 0) && !loading && (
                 <div className="py-20 text-center bg-gray-50/50 rounded-3xl border-2 border-dashed border-gray-100">
                    <CalendarDays className="mx-auto text-gray-200 mb-2" size={48} />
                    <p className="text-gray-400 font-bold uppercase tracking-widest text-[10px]">No classes scheduled for today</p>
                 </div>
               )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
             <QuickActionsCard />
             <AnnouncementsCard announcements={data?.announcements || []} />
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-8">
           <TasksCard stats={data?.stats} />
           <RecentMessagesCard count={data?.stats?.unreadMessages} />
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, color }: any) {
  return (
    <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm hover:shadow-md transition-shadow group">
      <div className="flex items-center justify-between mb-4">
        <div className={`${color} p-4 rounded-2xl group-hover:scale-110 transition-transform`}>{icon}</div>
        <TrendingUp size={16} className="text-gray-100" />
      </div>
      <div>
        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{title}</p>
        <p className="text-3xl font-black text-gray-900 mt-1">{value || '0'}</p>
      </div>
    </div>
  );
}

function QuickActionsCard() {
  return (
    <div className="bg-white border border-gray-200 rounded-[2rem] p-6 shadow-sm">
      <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest mb-6">Workflow Tools</h3>
      <div className="grid grid-cols-2 gap-3">
        <QuickLink label="Enter Scores" href="/teacher/assessments" color="bg-orange-500" />
        <QuickLink label="My Students" href="/teacher/students" color="bg-indigo-500" />
        <QuickLink label="Assignments" href="/teacher/assignments" color="bg-purple-500" />
        <QuickLink label="Resources" href="/teacher/resources" color="bg-blue-500" />
      </div>
    </div>
  );
}

function QuickLink({ label, href, color }: any) {
  return (
    <Link href={href} className="flex items-center gap-3 p-4 rounded-2xl border border-gray-100 hover:border-blue-200 hover:bg-blue-50/30 transition-all group">
      <div className={`w-2 h-2 rounded-full ${color}`} />
      <span className="text-[10px] font-black text-gray-700 uppercase tracking-widest group-hover:text-blue-700 transition-colors">{label}</span>
    </Link>
  );
}

function AnnouncementsCard({ announcements }: { announcements: any[] }) {
  return (
    <div className="bg-gray-900 rounded-[2rem] p-6 shadow-xl relative overflow-hidden group">
      <div className="relative z-10">
        <span className="bg-blue-600 text-white text-[9px] font-black uppercase tracking-[0.2em] px-3 py-1 rounded-full">School Updates</span>
        <div className="mt-6 space-y-4">
           {announcements.map((a: any) => (
             <div key={a.id} className="border-l-2 border-white/10 pl-4 py-1">
                <p className="text-white text-sm font-bold leading-tight line-clamp-1">{a.title}</p>
                <p className="text-gray-400 text-[10px] mt-1 uppercase font-bold">{new Date(a.createdAt).toLocaleDateString()}</p>
             </div>
           ))}
           {announcements.length === 0 && <p className="text-gray-500 text-xs font-medium italic">No new announcements</p>}
        </div>
      </div>
      <Bell size={120} className="absolute -bottom-8 -right-8 text-white/5 group-hover:rotate-12 transition-transform" />
    </div>
  );
}

function TasksCard({ stats }: any) {
  return (
    <div className="bg-white border border-gray-200 rounded-[2.5rem] p-8 shadow-sm">
      <h3 className="font-black text-gray-900 tracking-tight mb-6">Action Items</h3>
      <div className="space-y-4">
         <TaskItem label="Pending Attendance" count={stats?.todayClasses || 0} priority="HIGH" color="text-red-600 bg-red-50" />
         <TaskItem label="Score Submissions" count={stats?.pendingAssessments || 0} priority="NORMAL" color="text-orange-600 bg-orange-50" />
      </div>
    </div>
  );
}

function TaskItem({ label, count, priority, color }: any) {
  return (
    <div className="flex items-center justify-between p-4 rounded-2xl bg-gray-50 border border-gray-100 group hover:border-gray-200 transition-all">
       <div>
          <p className="text-xs font-black text-gray-800 leading-none mb-1">{label}</p>
          <span className={`text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-widest ${color}`}>{priority}</span>
       </div>
       <div className="w-10 h-10 rounded-xl bg-white border border-gray-100 flex items-center justify-center font-black text-sm text-gray-900 shadow-sm">{count}</div>
    </div>
  );
}

function RecentMessagesCard({ count }: { count: number }) {
  return (
    <div className="bg-blue-600 rounded-[2.5rem] p-8 shadow-xl text-white group cursor-pointer hover:bg-blue-700 transition-all">
       <div className="flex justify-between items-start mb-6">
          <div className="p-3 bg-white/10 rounded-2xl"><MessageSquare size={24}/></div>
          {count > 0 && <span className="bg-red-500 text-white text-[10px] font-black px-2 py-1 rounded-lg animate-bounce">{count} NEW</span>}
       </div>
       <h3 className="text-xl font-black mb-2">Staff & Parent Messaging</h3>
       <p className="text-blue-100 text-xs font-medium leading-relaxed mb-6">Coordinate with your teaching team and keep parents informed through secure internal channels.</p>
       <Link href="/teacher/messages" className="text-[10px] font-black text-white uppercase tracking-[0.2em] flex items-center gap-2">Open Conversations <ChevronRight size={14}/></Link>
    </div>
  );
}
