'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/auth-context';
import {
  Calendar,
  BookOpen,
  Clock,
  Wallet,
  Bell,
  MessageSquare,
  ChevronRight,
  UserCheck,
  TrendingUp,
  AlertCircle
} from 'lucide-react';
import Link from 'next/link';

export default function ParentDashboard() {
  const { user, activeSchoolId } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDashboard() {
      if (!activeSchoolId) return;
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/parent/dashboard`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'x-school-id': activeSchoolId,
          },
        });
        const dashboardData = await response.json();
        setData(dashboardData);
      } catch (error) {
        console.error('Failed to fetch dashboard:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchDashboard();
  }, [activeSchoolId]);

  if (loading) return <div>Loading dashboard...</div>;
  if (!data) return <div>Failed to load dashboard data.</div>;

  const { activeStudentId, summary, students, announcements, notifications } = data;
  const activeStudent = students.find((s: any) => s.id === activeStudentId);

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="flex justify-between items-center bg-card p-6 rounded-2xl border border-warm-100 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-charcoal-900">Welcome, {data.guardian?.firstName}!</h1>
          <p className="text-warm-500">Here's an overview of your children's activities today.</p>
        </div>
        <div className="flex gap-2">
          {students.map((student: any) => (
            <button
              key={student.id}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition-all ${
                student.id === activeStudentId
                  ? 'bg-forest-700 border-forest-700 text-white shadow-lg shadow-sage-200'
                  : 'bg-card border-warm-200 text-warm-600 hover:border-forest-700'
              }`}
            >
              <div className="w-6 h-6 rounded-full bg-warm-200 overflow-hidden">
                {student.photo ? (
                  <img src={student.photo} alt={student.firstName} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-[11px] font-bold text-warm-400">
                    {student.firstName[0]}
                  </div>
                )}
              </div>
              <span className="text-sm font-bold">{student.firstName}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Attendance"
          value={`${((Number(summary.attendance?.PRESENT) || 0) / (Object.values(summary.attendance || {}).map(v => Number(v) || 0).reduce((a, b) => a + b, 0) || 1) * 100).toFixed(1)}%`}
          icon={<UserCheck className="text-success-600" size={20} />}
          trend="Monthly Average"
          color="green"
        />
        <MetricCard
          title="Academic Progress"
          value={summary.recentResults?.[0]?.grade || 'N/A'}
          icon={<TrendingUp className="text-forest-700" size={20} />}
          trend="Latest Result"
          color="blue"
        />
        <MetricCard
          title="Upcoming Fees"
          value={`$${summary.outstandingFees}`}
          icon={<Wallet className="text-warning-600" size={20} />}
          trend="Next Due Date: Oct 15"
          color="amber"
          warning={summary.outstandingFees > 0}
        />
        <MetricCard
          title="Notifications"
          value={notifications.length.toString()}
          icon={<Bell className="text-terracotta-600" size={20} />}
          trend="Unread Alerts"
          color="purple"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Today's Timetable */}
          <section className="bg-card rounded-2xl border border-warm-100 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-warm-100 flex justify-between items-center">
              <h2 className="text-lg font-bold text-charcoal-900 flex items-center gap-2">
                <Clock size={20} className="text-forest-700" />
                Today's Timetable
              </h2>
              <Link href={`/parent/timetable?studentId=${activeStudentId}`} className="text-sm font-bold text-forest-700 hover:underline">
                View Weekly
              </Link>
            </div>
            <div className="p-6">
              {summary.timetable.length > 0 ? (
                <div className="space-y-4">
                  {summary.timetable.map((entry: any) => (
                    <div key={entry.id} className="flex items-center gap-4 p-4 rounded-xl bg-ivory-50 border border-warm-100">
                      <div className="w-20 text-center border-r border-warm-200 pr-4">
                        <p className="text-sm font-bold text-charcoal-900">{entry.startTime}</p>
                        <p className="text-[11px] text-warm-500 font-medium uppercase">{entry.endTime}</p>
                      </div>
                      <div className="flex-1">
                        <p className="font-bold text-charcoal-900">{entry.subject.name}</p>
                        <p className="text-xs text-warm-500 font-medium">Room {entry.room?.name || 'TBA'} • {entry.teacher?.firstName} {entry.teacher?.lastName}</p>
                      </div>
                      <div className="bg-card px-3 py-1 rounded-lg border border-warm-200 shadow-sm">
                        <span className="text-[11px] font-bold text-forest-700 uppercase tracking-wider">Period {entry.period?.periodNumber}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-warm-500 font-medium">No classes scheduled for today.</p>
                </div>
              )}
            </div>
          </section>

          {/* Academic Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Recent Results */}
            <section className="bg-card rounded-2xl border border-warm-100 shadow-sm">
              <div className="p-6 border-b border-warm-100">
                <h2 className="text-lg font-bold text-charcoal-900 flex items-center gap-2">
                  <BookOpen size={20} className="text-success-600" />
                  Recent Results
                </h2>
              </div>
              <div className="p-6 space-y-4">
                {summary.recentResults.length > 0 ? (
                  summary.recentResults.map((result: any) => (
                    <div key={result.id} className="flex justify-between items-center">
                      <div>
                        <p className="text-sm font-bold text-charcoal-900">{result.subject.name}</p>
                        <p className="text-[11px] text-warm-500 font-medium uppercase">{new Date(result.publishedAt).toLocaleDateString()}</p>
                      </div>
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold ${
                        result.grade === 'A' ? 'bg-success-100 text-success-700' : 'bg-sage-100 text-forest-800'
                      }`}>
                        {result.grade}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-warm-500 text-center py-4">No published results yet.</p>
                )}
                <Link href={`/parent/results?studentId=${activeStudentId}`} className="block text-center text-sm font-bold text-warm-600 hover:text-forest-700 pt-2">
                  View All Results
                </Link>
              </div>
            </section>

            {/* Upcoming Assessments */}
            <section className="bg-card rounded-2xl border border-warm-100 shadow-sm">
              <div className="p-6 border-b border-warm-100">
                <h2 className="text-lg font-bold text-charcoal-900 flex items-center gap-2">
                  <Calendar size={20} className="text-warning-600" />
                  Upcoming Assessments
                </h2>
              </div>
              <div className="p-6 space-y-4">
                {summary.upcomingAssessments.length > 0 ? (
                  summary.upcomingAssessments.map((assessment: any) => (
                    <div key={assessment.id} className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-warning-50 flex flex-col items-center justify-center shrink-0 border border-warning-100">
                        <span className="text-[11px] font-bold text-warning-600 uppercase">{new Date(assessment.startDate).toLocaleString('default', { month: 'short' })}</span>
                        <span className="text-xs font-bold text-warning-700 leading-none">{new Date(assessment.startDate).getDate()}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-charcoal-900 truncate">{assessment.name}</p>
                        <p className="text-[11px] text-warm-500 font-medium truncate uppercase">{assessment.subject?.name || 'Subject'}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-warm-500 text-center py-4">No upcoming assessments.</p>
                )}
                <Link href={`/parent/assessments?studentId=${activeStudentId}`} className="block text-center text-sm font-bold text-warm-600 hover:text-forest-700 pt-2">
                  View Full Schedule
                </Link>
              </div>
            </section>
          </div>
        </div>

        {/* Sidebar Column */}
        <div className="space-y-6">
          {/* Announcements */}
          <section className="bg-card rounded-2xl border border-warm-100 shadow-sm">
            <div className="p-6 border-b border-warm-100 flex justify-between items-center">
              <h2 className="text-lg font-bold text-charcoal-900 flex items-center gap-2">
                <Bell size={20} className="text-forest-700" />
                School Notices
              </h2>
            </div>
            <div className="p-6 space-y-4">
              {announcements.length > 0 ? (
                announcements.map((announcement: any) => (
                  <div key={announcement.id} className="group cursor-pointer">
                    <p className="text-xs font-bold text-forest-700 mb-1">{new Date(announcement.createdAt).toLocaleDateString()}</p>
                    <h3 className="text-sm font-bold text-charcoal-900 group-hover:text-forest-700 transition-colors line-clamp-2">{announcement.title}</h3>
                    <p className="text-xs text-warm-500 mt-1 line-clamp-2">{announcement.content.replace(/<[^>]*>?/gm, '')}</p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-warm-500 text-center py-4">No recent announcements.</p>
              )}
              <Link href="/parent/announcements" className="block w-full text-center py-2.5 rounded-xl border border-warm-100 bg-ivory-50 text-xs font-bold text-warm-600 hover:bg-warm-100 transition-all">
                View All Announcements
              </Link>
            </div>
          </section>

          {/* Quick Support */}
          <section className="rounded-xl bg-forest-800 p-6 text-white">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-card/20 rounded-lg">
                <MessageSquare size={20} />
              </div>
              <h2 className="font-bold">Contact Support</h2>
            </div>
            <p className="text-xs text-sage-100 mb-4 leading-relaxed">
              Have questions about your child's progress or school fees? Our staff is here to help.
            </p>
            <button className="w-full py-2.5 bg-card text-forest-800 rounded-xl text-xs font-bold hover:bg-sage-50 transition-all">
              Message School
            </button>
          </section>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ title, value, icon, trend, color, warning }: any) {
  const colors: any = {
    green: 'bg-success-50 border-success-100',
    blue: 'bg-sage-50 border-sage-100',
    amber: 'bg-warning-50 border-warning-100',
    purple: 'bg-terracotta-50 border-terracotta-100',
  };

  return (
    <div className={`p-5 rounded-2xl border shadow-sm ${colors[color] || 'bg-card'} ${warning ? 'border-danger-300 ring-2 ring-danger-50' : ''}`}>
      <div className="flex justify-between items-start mb-4">
        <div className="p-2 bg-card rounded-xl shadow-sm border border-inherit">
          {icon}
        </div>
        {warning && <AlertCircle size={16} className="text-danger-500 animate-pulse" />}
      </div>
      <div>
        <p className="text-xs font-bold text-warm-500 uppercase tracking-wider mb-1">{title}</p>
        <div className="flex items-baseline gap-2">
          <h3 className="text-2xl font-semibold text-charcoal-900">{value}</h3>
        </div>
        <p className="text-[11px] font-bold text-warm-400 uppercase mt-2 flex items-center gap-1">
          {trend}
        </p>
      </div>
    </div>
  );
}
