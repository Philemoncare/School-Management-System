'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/auth-context';
import {
  BookOpen,
  Calendar,
  Clock,
  CheckCircle,
  AlertCircle,
  MessageSquare,
  TrendingUp,
  ArrowRight,
  ClipboardList,
  FileText
} from 'lucide-react';
import Link from 'next/link';

export default function StudentDashboard() {
  const { user, activeSchoolId } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDashboard() {
      if (!activeSchoolId) return;
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/student/dashboard`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'x-school-id': activeSchoolId,
          },
        });
        const result = await response.json();
        setData(result);
      } catch (error) {
        console.error('Failed to fetch student dashboard:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchDashboard();
  }, [activeSchoolId]);

  if (loading) return <div className="p-8 text-center">Loading your learning workspace...</div>;
  if (!data) return <div className="p-8 text-center text-danger-500">Failed to load dashboard. Please try again.</div>;

  const { student, enrollment, timetable, assessments, assignments, announcements, notifications, attendance } = data;

  const attendanceValues = Object.values(attendance || {}) as number[];
  const totalAttendance = attendanceValues.reduce((a, b) => a + (Number(b) || 0), 0) || 1;
  const attendanceRate = (((Number(attendance?.PRESENT) || 0) / totalAttendance) * 100).toFixed(1);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-card p-6 rounded-2xl border border-warm-100 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-charcoal-900">Welcome back, {student.firstName}.</h1>
          <p className="text-warm-500 font-medium">
            {enrollment?.class?.name} • Section {enrollment?.section?.name} • {enrollment?.academicYear?.name}
          </p>
        </div>
        <div className="flex items-center gap-3 bg-sage-50 px-4 py-2 rounded-xl border border-sage-100">
          <Calendar className="text-forest-700" size={20} />
          <div>
            <p className="text-[11px] font-bold text-forest-700 uppercase tracking-wide leading-none mb-1">Today</p>
            <p className="text-sm font-bold text-forest-950 leading-none">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}</p>
          </div>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard title="Attendance" value={`${attendanceRate}%`} icon={<CheckCircle className="text-success-600" />} color="green" />
        <MetricCard title="Assignments" value={assignments.filter((a: any) => a.submissions.length === 0).length} subtitle="Pending" icon={<FileText className="text-forest-700" />} color="blue" />
        <MetricCard title="Assessments" value={assessments.length} subtitle="Upcoming" icon={<ClipboardList className="text-warning-600" />} color="amber" />
        <MetricCard title="Messages" value={notifications.length} subtitle="Unread" icon={<MessageSquare className="text-terracotta-600" />} color="purple" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Today's Classes */}
          <section className="bg-card rounded-2xl border border-warm-100 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-warm-100 flex justify-between items-center">
              <h2 className="text-lg font-bold text-charcoal-900 flex items-center gap-2">
                <Clock size={20} className="text-forest-700" />
                Today's Timetable
              </h2>
              <Link href="/student/timetable" className="text-sm font-bold text-forest-700 hover:underline">Full Schedule</Link>
            </div>
            <div className="p-6">
              {timetable.length > 0 ? (
                <div className="space-y-4">
                  {timetable.map((entry: any) => (
                    <div key={entry.id} className="flex items-center gap-4 p-4 rounded-xl bg-ivory-50 border border-warm-100 hover:border-sage-200 transition-colors group">
                      <div className="w-20 text-center border-r border-warm-200 pr-4">
                        <p className="text-sm font-semibold text-charcoal-900">{entry.startTime}</p>
                        <p className="text-[11px] text-warm-500 font-bold uppercase">{entry.endTime}</p>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-charcoal-900 truncate">{entry.subject?.name}</p>
                        <p className="text-xs text-warm-500 font-medium truncate">Room {entry.room?.name || 'TBA'} • {entry.teacher?.firstName} {entry.teacher?.lastName}</p>
                      </div>
                      <div className="hidden sm:block">
                         <span className="px-3 py-1 bg-card rounded-lg border border-warm-200 text-[11px] font-bold text-warm-400 group-hover:text-forest-700 group-hover:border-sage-200 transition-colors">PERIOD {entry.period?.periodNumber}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-10 bg-ivory-50/50 rounded-xl border border-dashed border-warm-200">
                  <p className="text-warm-500 font-medium">No classes scheduled for today.</p>
                </div>
              )}
            </div>
          </section>

          {/* Assignments & Assessments */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <section className="bg-card rounded-2xl border border-warm-100 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-warm-100 flex justify-between items-center">
                <h3 className="font-bold text-charcoal-900 flex items-center gap-2">
                  <FileText size={18} className="text-forest-700" />
                  Recent Assignments
                </h3>
              </div>
              <div className="p-4 space-y-3">
                {assignments.length > 0 ? (
                  assignments.map((item: any) => (
                    <Link href={`/student/assignments/${item.id}`} key={item.id} className="block p-3 rounded-xl hover:bg-ivory-50 transition-colors border border-transparent hover:border-warm-100">
                      <div className="flex justify-between items-start mb-1">
                        <p className="text-sm font-bold text-charcoal-900 truncate">{item.title}</p>
                        <span className={`text-[11px] font-semibold uppercase px-1.5 py-0.5 rounded ${item.submissions.length > 0 ? 'bg-success-100 text-success-700' : 'bg-warning-100 text-warning-700'}`}>
                          {item.submissions.length > 0 ? 'Submitted' : 'Pending'}
                        </span>
                      </div>
                      <p className="text-[11px] text-warm-500 font-semibold uppercase">{item.subject?.name} • Due {new Date(item.dueDate).toLocaleDateString()}</p>
                    </Link>
                  ))
                ) : <p className="text-xs text-center text-warm-400 py-4 font-medium">No active assignments.</p>}
              </div>
            </section>

            <section className="bg-card rounded-2xl border border-warm-100 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-warm-100 flex justify-between items-center">
                <h3 className="font-bold text-charcoal-900 flex items-center gap-2">
                  <ClipboardList size={18} className="text-warning-600" />
                  Upcoming Tests
                </h3>
              </div>
              <div className="p-4 space-y-3">
                {assessments.length > 0 ? (
                  assessments.map((item: any) => (
                    <div key={item.id} className="p-3 rounded-xl border border-ivory-50 bg-ivory-50/30">
                      <p className="text-sm font-bold text-charcoal-900 truncate">{item.name}</p>
                      <p className="text-[11px] text-warm-500 font-semibold uppercase">{item.subject?.name} • {new Date(item.startDate).toLocaleDateString()}</p>
                    </div>
                  ))
                ) : <p className="text-xs text-center text-warm-400 py-4 font-medium">No upcoming assessments.</p>}
              </div>
            </section>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Announcements */}
          <section className="bg-card rounded-2xl border border-warm-100 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-warm-100 flex justify-between items-center">
              <h2 className="text-lg font-bold text-charcoal-900 flex items-center gap-2">
                <AlertCircle size={20} className="text-forest-700" />
                Notice Board
              </h2>
            </div>
            <div className="p-6 space-y-6">
              {announcements.length > 0 ? (
                announcements.map((a: any) => (
                  <div key={a.id} className="group cursor-pointer">
                    <p className="text-[11px] font-semibold text-forest-700 uppercase tracking-wide mb-1">{new Date(a.createdAt).toLocaleDateString()}</p>
                    <h4 className="text-sm font-bold text-charcoal-900 group-hover:text-forest-700 transition-colors line-clamp-2">{a.title}</h4>
                    <p className="text-xs text-warm-500 mt-1 line-clamp-2">{a.content.replace(/<[^>]*>?/gm, '')}</p>
                  </div>
                ))
              ) : <p className="text-xs text-warm-400 text-center font-medium">No recent notices.</p>}
              <Link href="/student/announcements" className="block w-full text-center py-2.5 rounded-xl border border-warm-100 bg-ivory-50 text-xs font-bold text-warm-600 hover:bg-warm-100 transition-all">
                View All Announcements
              </Link>
            </div>
          </section>

          {/* Quick Learning Stats */}
          <section className="rounded-xl bg-forest-800 p-6 text-white">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-card/20 rounded-xl">
                <TrendingUp size={20} />
              </div>
              <h3 className="font-bold">Learning Progress</h3>
            </div>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-[11px] font-bold uppercase tracking-wider mb-1.5 opacity-80">
                  <span>Course Completion</span>
                  <span>78%</span>
                </div>
                <div className="h-1.5 w-full bg-card/20 rounded-full overflow-hidden">
                  <div className="h-full bg-card rounded-full" style={{ width: '78%' }} />
                </div>
              </div>
              <button className="w-full mt-4 py-3 bg-card text-forest-800 rounded-xl text-xs font-bold hover:bg-sage-50 transition-all flex items-center justify-center gap-2">
                View Detailed Analytics
                <ArrowRight size={14} />
              </button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ title, value, subtitle, icon, color }: any) {
  const colors: any = {
    green: 'bg-success-50 border-success-100',
    blue: 'bg-sage-50 border-sage-100',
    amber: 'bg-warning-50 border-warning-100',
    purple: 'bg-terracotta-50 border-terracotta-100',
  };

  return (
    <div className={`p-5 rounded-2xl border shadow-sm ${colors[color] || 'bg-card'}`}>
      <div className="flex justify-between items-start mb-4">
        <div className="p-2 bg-card rounded-xl shadow-sm border border-inherit">{icon}</div>
      </div>
      <div>
        <p className="text-[11px] font-semibold text-warm-500 uppercase tracking-wide mb-1">{title}</p>
        <div className="flex items-baseline gap-2">
          <h3 className="text-2xl font-semibold text-charcoal-900">{value}</h3>
          {subtitle && <span className="text-[11px] font-bold text-warm-400 uppercase">{subtitle}</span>}
        </div>
      </div>
    </div>
  );
}
