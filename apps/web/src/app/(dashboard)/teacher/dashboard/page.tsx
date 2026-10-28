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
    <div className="space-y-6 sm:space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-semibold text-charcoal-900 tracking-tight leading-tight">
            Welcome back, <span className="text-forest-700">{user?.firstName}</span>
          </h1>
          <p className="text-warm-500 font-bold mt-1 uppercase tracking-wide text-[11px]">Academic Workspace • Teacher Portal</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-card border border-warm-200 px-4 py-2 rounded-xl shadow-xs hidden sm:block">
            <span className="text-[11px] font-semibold text-warm-400 uppercase tracking-wide block">Current Date</span>
            <span className="text-sm font-semibold text-charcoal-900">{new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}</span>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="My Classes" value={loading ? '...' : data?.stats?.myClasses} icon={<BookMarked className="text-forest-700"/>} color="bg-sage-50" />
        <StatCard title="My Students" value={loading ? '...' : data?.stats?.myStudents} icon={<Users className="text-terracotta-600"/>} color="bg-terracotta-50" />
        <StatCard title="Pending Scores" value={loading ? '...' : data?.stats?.pendingAssessments} icon={<FileSpreadsheet className="text-terracotta-600"/>} color="bg-terracotta-50" />
        <StatCard title="Today's Load" value={loading ? '...' : `${data?.stats?.todayClasses} Classes`} icon={<Clock className="text-success-600"/>} color="bg-success-50" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Today's Schedule */}
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-card border border-warm-200 rounded-xl p-8 shadow-sm">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-xl font-semibold text-charcoal-900 tracking-tight">Today's Teaching Schedule</h3>
              <Link href="/teacher/timetable" className="text-xs font-semibold text-forest-700 uppercase tracking-wide hover:underline flex items-center gap-1">Full Timetable <ChevronRight size={14}/></Link>
            </div>

            <div className="space-y-4">
               {data?.todaySchedule?.map((slot: any) => (
                 <div key={slot.id} className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-6 p-4 sm:p-5 rounded-2xl bg-ivory-50 border border-warm-100 hover:bg-card hover:shadow-xs transition-all group">
                    <div className="flex items-center gap-3 sm:block sm:w-16 sm:text-center shrink-0">
                       <span className="text-xs font-semibold text-charcoal-900">{slot.startTime} - {slot.endTime}</span>
                    </div>
                    <div className="hidden sm:block w-1.5 h-10 rounded-full bg-forest-500 shrink-0"></div>
                    <div className="flex-1 min-w-0">
                       <p className="text-sm font-semibold text-charcoal-900 leading-tight truncate">{slot.subject.name}</p>
                       <p className="text-[11px] font-bold text-warm-400 uppercase tracking-tight truncate">{slot.class.name} • Section {slot.section?.name || 'A'}</p>
                    </div>
                    <Link href={`/teacher/attendance?classId=${slot.classId}&sectionId=${slot.sectionId}`} className="w-full sm:w-auto text-center px-4 py-2 bg-card border border-warm-200 rounded-xl text-[11px] font-semibold uppercase tracking-wide text-warm-500 group-hover:bg-forest-700 group-hover:text-white group-hover:border-forest-700 transition-all shadow-xs">Mark Attendance</Link>
                 </div>
               ))}
               {(!data?.todaySchedule || data.todaySchedule.length === 0) && !loading && (
                 <div className="py-20 text-center bg-ivory-50/50 rounded-3xl border-2 border-dashed border-warm-100">
                    <CalendarDays className="mx-auto text-warm-200 mb-2" size={48} />
                    <p className="text-warm-400 font-bold uppercase tracking-wide text-[11px]">No classes scheduled for today</p>
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
    <div className="bg-card border border-warm-200 rounded-3xl p-6 shadow-sm hover:shadow-md transition-shadow group">
      <div className="flex items-center justify-between mb-4">
        <div className={`${color} p-4 rounded-2xl group-hover:scale-110 transition-transform`}>{icon}</div>
        <TrendingUp size={16} className="text-warm-100" />
      </div>
      <div>
        <p className="text-[11px] font-semibold text-warm-400 uppercase tracking-wide">{title}</p>
        <p className="text-3xl font-semibold text-charcoal-900 mt-1">{value || '0'}</p>
      </div>
    </div>
  );
}

function QuickActionsCard() {
  return (
    <div className="bg-card border border-warm-200 rounded-xl p-6 shadow-sm">
      <h3 className="text-sm font-semibold text-charcoal-900 uppercase tracking-wide mb-6">Workflow Tools</h3>
      <div className="grid grid-cols-2 gap-3">
        <QuickLink label="Enter Scores" href="/teacher/assessments" color="bg-terracotta-500" />
        <QuickLink label="My Students" href="/teacher/students" color="bg-terracotta-500" />
        <QuickLink label="Assignments" href="/teacher/assignments" color="bg-terracotta-500" />
        <QuickLink label="Resources" href="/teacher/resources" color="bg-forest-500" />
      </div>
    </div>
  );
}

function QuickLink({ label, href, color }: any) {
  return (
    <Link href={href} className="flex items-center gap-3 p-4 rounded-2xl border border-warm-100 hover:border-sage-200 hover:bg-sage-50/30 transition-all group">
      <div className={`w-2 h-2 rounded-full ${color}`} />
      <span className="text-[11px] font-semibold text-warm-700 uppercase tracking-wide group-hover:text-forest-800 transition-colors">{label}</span>
    </Link>
  );
}

function AnnouncementsCard({ announcements }: { announcements: any[] }) {
  return (
    <div className="bg-charcoal-900 rounded-xl p-6 shadow-xs relative overflow-hidden group">
      <div className="relative z-10">
        <span className="bg-forest-700 text-white text-[11px] font-semibold uppercase tracking-wide px-3 py-1 rounded-full">School Updates</span>
        <div className="mt-6 space-y-4">
           {announcements.map((a: any) => (
             <div key={a.id} className="border-l-2 border-white/10 pl-4 py-1">
                <p className="text-white text-sm font-bold leading-tight line-clamp-1">{a.title}</p>
                <p className="text-warm-400 text-[11px] mt-1 uppercase font-bold">{new Date(a.createdAt).toLocaleDateString()}</p>
             </div>
           ))}
           {announcements.length === 0 && <p className="text-warm-500 text-xs font-medium italic">No new announcements</p>}
        </div>
      </div>
      <Bell size={120} className="absolute -bottom-8 -right-8 text-white/5 group-hover:rotate-12 transition-transform" />
    </div>
  );
}

function TasksCard({ stats }: any) {
  return (
    <div className="bg-card border border-warm-200 rounded-xl p-8 shadow-sm">
      <h3 className="font-semibold text-charcoal-900 tracking-tight mb-6">Action Items</h3>
      <div className="space-y-4">
         <TaskItem label="Pending Attendance" count={stats?.todayClasses || 0} priority="HIGH" color="text-danger-600 bg-danger-50" />
         <TaskItem label="Score Submissions" count={stats?.pendingAssessments || 0} priority="NORMAL" color="text-terracotta-600 bg-terracotta-50" />
      </div>
    </div>
  );
}

function TaskItem({ label, count, priority, color }: any) {
  return (
    <div className="flex items-center justify-between p-4 rounded-2xl bg-ivory-50 border border-warm-100 group hover:border-warm-200 transition-all">
       <div>
          <p className="text-xs font-semibold text-charcoal-800 leading-none mb-1">{label}</p>
          <span className={`text-[11px] font-semibold px-1.5 py-0.5 rounded uppercase tracking-wide ${color}`}>{priority}</span>
       </div>
       <div className="w-10 h-10 rounded-xl bg-card border border-warm-100 flex items-center justify-center font-semibold text-sm text-charcoal-900 shadow-sm">{count}</div>
    </div>
  );
}

function RecentMessagesCard({ count }: { count: number }) {
  return (
    <div className="bg-forest-700 rounded-xl p-8 shadow-xs text-white group cursor-pointer hover:bg-forest-800 transition-all">
       <div className="flex justify-between items-start mb-6">
          <div className="p-3 bg-card/10 rounded-2xl"><MessageSquare size={24}/></div>
          {count > 0 && <span className="rounded-md bg-danger-50 px-2 py-1 text-[11px] font-semibold text-danger-700">{count} new</span>}
       </div>
       <h3 className="text-xl font-semibold mb-2">Staff & Parent Messaging</h3>
       <p className="text-sage-100 text-xs font-medium leading-relaxed mb-6">Coordinate with your teaching team and keep parents informed through secure internal channels.</p>
       <Link href="/teacher/messages" className="text-[11px] font-semibold text-white uppercase tracking-wide flex items-center gap-2">Open Conversations <ChevronRight size={14}/></Link>
    </div>
  );
}
