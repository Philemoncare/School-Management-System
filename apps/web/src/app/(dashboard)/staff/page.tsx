'use client';

import React, { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api/client';
import { useAuth } from '@/context/auth-context';
import {
  User,
  Briefcase,
  Calendar,
  Clock,
  FileText,
  MessageSquare,
  Bell,
  Settings,
  ChevronRight,
  Loader2,
  PieChart,
  History,
  Plane
} from 'lucide-react';
import Link from 'next/link';

export default function StaffSelfServiceDashboard() {
  const { user } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // In a real app, we'd fetch specific staff context
    // For now, let's load a mock or shared endpoint
    setLoading(false);
  }, []);

  if (loading) return <div className="p-20 text-center"><Loader2 className="animate-spin mx-auto text-blue-600" size={48} /></div>;

  return (
    <div className="p-8 space-y-10">
      <div className="flex justify-between items-center bg-gray-900 rounded-[3rem] p-10 text-white shadow-2xl relative overflow-hidden">
        <div className="relative z-10">
          <h1 className="text-4xl font-black tracking-tight">Good morning, <span className="text-blue-400">{user?.firstName}</span>.</h1>
          <p className="text-gray-400 font-bold mt-2 uppercase tracking-widest text-xs">Workforce Self-Service & Employee Workspace</p>
        </div>
        <div className="relative z-10 flex gap-4">
           <button className="p-4 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-all"><Bell size={20}/></button>
           <button className="p-4 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-all"><Settings size={20}/></button>
        </div>
        <div className="absolute -right-20 -bottom-20 w-80 h-84 bg-blue-600/10 rounded-full blur-3xl" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
           <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <section className="bg-white border border-gray-200 rounded-[2.5rem] p-8 shadow-sm">
                 <div className="flex justify-between items-center mb-8">
                    <h3 className="text-xl font-black text-gray-900 tracking-tight">Leave Balance</h3>
                    <Link href="/staff/leave" className="text-[10px] font-black text-blue-600 uppercase tracking-widest flex items-center gap-1">Request <Plane size={12}/></Link>
                 </div>
                 <div className="space-y-6">
                    <BalanceRow label="Annual Leave" used={12} total={20} color="bg-blue-600" />
                    <BalanceRow label="Sick Leave" used={2} total={10} color="bg-red-500" />
                    <BalanceRow label="Personal Day" used={0} total={3} color="bg-emerald-500" />
                 </div>
              </section>

              <section className="bg-white border border-gray-200 rounded-[2.5rem] p-8 shadow-sm">
                 <div className="flex justify-between items-center mb-8">
                    <h3 className="text-xl font-black text-gray-900 tracking-tight">Today's Schedule</h3>
                    <Link href="/staff/schedule" className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Full View</Link>
                 </div>
                 <div className="space-y-4">
                    <ScheduleItem time="08:30" activity="Morning Briefing" room="Conf Room B" active />
                    <ScheduleItem time="10:00" activity="Teaching: Grade 10 Science" room="Lab 1" />
                    <ScheduleItem time="12:30" activity="Lunch Break" room="Staff Lounge" />
                 </div>
              </section>
           </div>

           <section className="bg-white border border-gray-200 rounded-[2.5rem] p-8 shadow-sm">
              <h3 className="text-xl font-black text-gray-900 tracking-tight mb-8">Recent Notifications</h3>
              <div className="space-y-4">
                 <NotificationCard title="August Salary Slip Released" sub="Your payroll record for the period is now available for download." icon={<FileText size={18}/>} color="bg-blue-50 text-blue-600" />
                 <NotificationCard title="Staff Meeting Rescheduled" sub="The general assembly has been moved to Friday at 14:00." icon={<Calendar size={18}/>} color="bg-amber-50 text-amber-600" />
                 <NotificationCard title="Leave Request Approved" sub="Your annual leave from Oct 12 to Oct 15 has been authorized." icon={<History size={18}/>} color="bg-green-50 text-green-600" />
              </div>
           </section>
        </div>

        <div className="space-y-8">
           <section className="bg-white border border-gray-200 rounded-[2.5rem] p-8 shadow-sm">
              <h3 className="text-lg font-black text-gray-900 mb-6 tracking-tight">Employee Quick Links</h3>
              <div className="space-y-4">
                 <SidebarLink label="My Digital Profile" icon={<User size={18}/>} href="/staff/profile" />
                 <SidebarLink label="Documents & Contracts" icon={<FileText size={18}/>} href="/staff/documents" />
                 <SidebarLink label="Attendance History" icon={<Clock size={18}/>} href="/staff/attendance" />
                 <SidebarLink label="Communication Hub" icon={<MessageSquare size={18}/>} href="/staff/messages" />
              </div>
           </section>

           <div className="bg-emerald-600 rounded-[2.5rem] p-8 shadow-xl text-white">
              <h3 className="text-lg font-black mb-2 flex items-center gap-2">
                <Briefcase size={20}/> Employment Status
              </h3>
              <p className="text-emerald-100 text-xs font-medium leading-relaxed opacity-80 uppercase tracking-tight">
                You are currently an active employee in good standing. Your next performance review is scheduled for December 2026.
              </p>
           </div>
        </div>
      </div>
    </div>
  );
}

function BalanceRow({ label, used, total, color }: any) {
  const percentage = (used / total) * 100;
  return (
    <div className="space-y-2">
       <div className="flex justify-between items-end">
          <p className="text-xs font-black text-gray-700">{label}</p>
          <p className="text-[10px] font-black text-gray-400">{used} / {total} Days</p>
       </div>
       <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div className={`h-full ${color}`} style={{ width: `${percentage}%` }} />
       </div>
    </div>
  );
}

function ScheduleItem({ time, activity, room, active }: any) {
  return (
    <div className={`flex items-center gap-4 p-4 rounded-2xl border transition-all ${
       active ? 'bg-blue-50 border-blue-100' : 'bg-white border-gray-100'
    }`}>
       <div className="text-center min-w-[50px]">
          <p className={`text-xs font-black ${active ? 'text-blue-600' : 'text-gray-900'}`}>{time}</p>
       </div>
       <div className="flex-1">
          <p className={`text-xs font-bold ${active ? 'text-blue-900' : 'text-gray-700'}`}>{activity}</p>
          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tight">{room}</p>
       </div>
    </div>
  );
}

function NotificationCard({ title, sub, icon, color }: any) {
  return (
    <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-2xl border border-gray-100 hover:bg-white hover:shadow-md transition-all group">
       <div className={`p-3 rounded-xl ${color}`}>{icon}</div>
       <div className="flex-1">
          <p className="text-xs font-black text-gray-900 group-hover:text-blue-600 transition-colors">{title}</p>
          <p className="text-[11px] text-gray-500 font-medium mt-0.5 leading-relaxed">{sub}</p>
       </div>
       <button className="text-gray-300 group-hover:text-gray-600 transition-colors"><ChevronRight size={16}/></button>
    </div>
  );
}

function SidebarLink({ label, icon, href }: any) {
  return (
    <Link href={href} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl hover:bg-blue-600 hover:text-white transition-all group">
       <div className="flex items-center gap-4">
          <div className="text-gray-400 group-hover:text-white/80 transition-colors">{icon}</div>
          <span className="text-xs font-black uppercase tracking-widest">{label}</span>
       </div>
       <ChevronRight size={14} className="text-gray-300 group-hover:text-white/50" />
    </Link>
  );
}
