'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/auth-context';
import { apiFetch } from '@/lib/api/client';
import {
  Users,
  UserSquare2,
  CalendarCheck,
  CreditCard,
  ArrowUpRight,
  ArrowDownRight,
  TrendingUp,
  Clock,
  ChevronRight,
  Bell,
  GraduationCap
} from 'lucide-react';
import Link from 'next/link';

export default function SchoolDashboard() {
  const { user } = useAuth();
  const { on } = useRealtime();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const schoolName = user?.memberships?.[0]?.school.name || 'Your School';

  const loadMetrics = () => {
    apiFetch('/schools/dashboard/metrics')
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadMetrics();
  }, []);

  on('STUDENT_CREATED', () => {
    loadMetrics();
  });

  on('PAYMENT_RECEIVED', () => {
    loadMetrics();
  });

  on('ATTENDANCE_UPDATED', () => {
    loadMetrics();
  });

  return (
    <div className="p-4 lg:p-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 tracking-tight">
            Welcome back, {user?.firstName}!
          </h1>
          <p className="text-gray-500 font-medium mt-1">Here's what's happening at {schoolName} today.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-white border border-gray-200 px-4 py-2 rounded-xl shadow-sm hidden sm:block">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">Academic Year</span>
            <span className="text-sm font-bold text-gray-900">{data?.academicContext?.year || '...'}</span>
          </div>
          <button className="bg-blue-600 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 flex items-center gap-2">
            Quick Action <ChevronRight size={16}/>
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <KpiCard
          title="Total Students"
          value={loading ? '...' : data?.stats?.students || '0'}
          change="+0%"
          trend="up"
          icon={<Users className="text-blue-600" />}
          color="bg-blue-50"
        />
        <KpiCard
          title="Total Teachers"
          value={loading ? '...' : data?.stats?.teachers || '0'}
          change="+0"
          trend="up"
          icon={<UserSquare2 className="text-indigo-600" />}
          color="bg-indigo-50"
        />
        <KpiCard
          title="Attendance Rate"
          value={loading ? '...' : data?.stats?.attendanceRate || '0%'}
          change="Today"
          trend="up"
          icon={<CalendarCheck className="text-green-600" />}
          color="bg-green-50"
        />
        <KpiCard
          title="Outstanding Fees"
          value={loading ? '...' : `GH₵ ${parseFloat(data?.stats?.outstandingFees || 0).toLocaleString()}`}
          change="Total"
          trend="up"
          icon={<CreditCard className="text-purple-600" />}
          color="bg-purple-50"
        />
      </div>

      {/* Charts & Activity Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white border border-gray-200 rounded-3xl p-6 lg:p-8 shadow-sm">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-xl font-bold text-gray-900">Academic Overview</h3>
              <div className="flex gap-2">
                <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-lg text-xs font-bold">Term: {data?.academicContext?.term || '...'}</span>
              </div>
            </div>
            <div className="h-[300px] flex items-center justify-center border-2 border-dashed border-gray-100 rounded-2xl bg-gray-50/50">
              <div className="text-center">
                <TrendingUp className="mx-auto text-gray-300 mb-2" size={48} />
                <p className="text-gray-400 font-medium">Performance analytics will appear here</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
             <QuickLinksCard />
             <AnnouncementsCard announcements={data?.announcements || []} />
          </div>
        </div>

        <div className="space-y-8">
          <RecentActivityCard activities={data?.recentActivity || []} />
          <UpcomingEventsCard />
        </div>
      </div>
    </div>
  );
}

function KpiCard({ title, value, change, trend, icon, color }: any) {
  return (
    <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-4">
        <div className={`${color} p-3 rounded-2xl`}>{icon}</div>
        <div className={`flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider ${trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
          {change}
        </div>
      </div>
      <div>
        <p className="text-sm font-bold text-gray-400 uppercase tracking-wider">{title}</p>
        <p className="text-3xl font-black text-gray-900 mt-1">{value}</p>
      </div>
    </div>
  );
}

function RecentActivityCard({ activities }: { activities: any[] }) {
  return (
    <div className="bg-white border border-gray-200 rounded-3xl shadow-sm overflow-hidden">
      <div className="p-6 border-b border-gray-100 flex items-center justify-between">
        <h3 className="font-bold text-gray-900">Recent Activity</h3>
        <Link href="/admin/activity" className="text-xs font-bold text-blue-600 hover:underline">View All</Link>
      </div>
      <div className="p-2">
        {activities.map((item) => (
          <div key={item.id} className="flex gap-4 p-4 hover:bg-gray-50 rounded-2xl transition-colors group">
            <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center shrink-0 group-hover:bg-white shadow-sm">
              <Clock size={18} className="text-gray-400" />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-800 leading-snug">{item.action.replace(/_/g, ' ')}</p>
              <p className="text-[10px] font-bold text-gray-400 mt-0.5 uppercase tracking-tight">{item.user} • {item.module}</p>
              <p className="text-[9px] font-medium text-gray-400 mt-1">{new Date(item.time).toLocaleTimeString()}</p>
            </div>
          </div>
        ))}
        {activities.length === 0 && <div className="p-8 text-center text-gray-400 text-xs font-bold uppercase tracking-widest">No recent activity</div>}
      </div>
    </div>
  );
}

function QuickLinksCard() {
  return (
    <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm">
      <h3 className="font-bold text-gray-900 mb-4">Quick Actions</h3>
      <div className="grid grid-cols-2 gap-3">
        <QuickLink label="Admit Student" href="/dashboard/students" color="bg-blue-600" />
        <QuickLink label="Mark Attendance" href="/dashboard/attendance" color="bg-green-600" />
        <QuickLink label="Issue Invoice" href="/dashboard/finance/invoices" color="bg-purple-600" />
        <QuickLink label="Post Result" href="/dashboard/assessments" color="bg-orange-600" />
      </div>
    </div>
  );
}

function QuickLink({ label, href, color }: any) {
  return (
    <Link href={href} className="flex items-center gap-3 p-3 rounded-2xl border border-gray-100 hover:border-gray-200 hover:bg-gray-50 transition-all">
      <div className={`w-2 h-2 rounded-full ${color}`} />
      <span className="text-xs font-bold text-gray-700">{label}</span>
    </Link>
  );
}

function AnnouncementsCard({ announcements }: { announcements: any[] }) {
  const current = announcements[0];
  return (
    <div className="bg-gray-900 rounded-3xl p-6 shadow-xl relative overflow-hidden group">
      <div className="relative z-10">
        <span className="bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg">
          {announcements.length > 0 ? 'Latest Announcement' : 'No Announcements'}
        </span>
        <h3 className="text-white font-bold mt-4 text-lg leading-tight group-hover:text-blue-400 transition-colors">
          {current ? current.title : 'Check back later for school updates.'}
        </h3>
        <p className="text-gray-400 text-xs mt-2 font-medium line-clamp-2">
          {current ? current.content : 'Announcements from the school administration will appear here.'}
        </p>
        {announcements.length > 0 && (
          <Link href="/dashboard/announcements" className="mt-6 flex items-center gap-2 text-xs font-black text-blue-500 uppercase tracking-widest">
            View All <ChevronRight size={14}/>
          </Link>
        )}
      </div>
      <div className="absolute -bottom-8 -right-8 opacity-10 group-hover:scale-110 transition-transform">
        <Bell size={120} className="text-white" />
      </div>
    </div>
  );
}

function UpcomingEventsCard() {
  return (
    <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm">
      <h3 className="font-bold text-gray-900 mb-4">Calendar</h3>
      <div className="space-y-4">
        <EventItem date="Sep 12" title="Mid-Term Break" type="Holiday" />
        <EventItem date="Sep 18" title="PTA Meeting" type="Event" />
        <EventItem date="Oct 05" title="Math Quiz Finals" type="Academic" />
      </div>
    </div>
  );
}

function EventItem({ date, title, type }: any) {
  return (
    <div className="flex items-center gap-4">
      <div className="w-12 h-12 rounded-2xl bg-gray-50 flex flex-col items-center justify-center border border-gray-100">
        <span className="text-[10px] font-black uppercase text-gray-400 leading-none">{date.split(' ')[0]}</span>
        <span className="text-sm font-black text-gray-800 leading-none mt-1">{date.split(' ')[1]}</span>
      </div>
      <div>
        <p className="text-sm font-bold text-gray-800 leading-none">{title}</p>
        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{type}</span>
      </div>
    </div>
  );
}
