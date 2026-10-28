'use client';

import React, { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api/client';
import {
  Users,
  UserPlus,
  Briefcase,
  Calendar,
  Clock,
  FileText,
  PieChart,
  ChevronRight,
  Loader2,
  AlertCircle,
  Building2,
  Trophy,
  ShieldAlert,
  ArrowUpRight
} from 'lucide-react';
import Link from 'next/link';

export default function HRDashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch('/hr/dashboard')
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-20 text-center"><Loader2 className="animate-spin mx-auto text-forest-700" size={48} /></div>;

  const { metrics, departments } = data;

  return (
    <div className="p-8 space-y-10">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-semibold text-charcoal-900 tracking-tight">Workforce Command</h1>
          <p className="text-warm-500 mt-1 font-medium">Global HR operations, staff records and performance auditing.</p>
        </div>
        <div className="flex gap-4">
          <Link href="/dashboard/hr/staff/new" className="bg-forest-700 text-white px-6 py-3 rounded-2xl font-semibold text-xs uppercase tracking-wide hover:bg-forest-800 transition-all shadow-xs shadow-sage-200 flex items-center gap-2">
            <UserPlus size={18} /> Onboard Staff
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        <KpiCard title="Total Headcount" value={metrics.totalEmployees} sub={`${metrics.activeTeachers} Teachers / ${metrics.activeStaff} Staff`} icon={<Users className="text-forest-700"/>} color="bg-sage-50" />
        <KpiCard title="On Leave Today" value={metrics.employeesOnLeave} sub="Approved Requests" icon={<Calendar className="text-success-600"/>} color="bg-success-50" />
        <KpiCard title="Absent" value={metrics.absentToday} sub="No check-in detected" icon={<Clock className="text-danger-600"/>} color="bg-danger-50" />
        <KpiCard title="Pending Requests" value={metrics.pendingLeaveRequests} sub="Awaiting HR Review" icon={<FileText className="text-terracotta-600"/>} color="bg-terracotta-50" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <section className="bg-card border border-warm-200 rounded-xl p-8 shadow-sm">
            <h3 className="text-xl font-semibold text-charcoal-900 tracking-tight mb-8">Departmental Distribution</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
              {departments.map((dept: any) => (
                <div key={dept.name} className="p-6 bg-ivory-50 rounded-xl border border-warm-100 hover:border-sage-200 transition-all">
                  <p className="text-[11px] font-semibold text-warm-400 uppercase tracking-wide mb-1">{dept.name}</p>
                  <p className="text-2xl font-semibold text-charcoal-900">{dept.count} <span className="text-xs text-warm-400">Staff</span></p>
                </div>
              ))}
            </div>
          </section>

          <section className="bg-card border border-warm-200 rounded-xl p-8 shadow-sm">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-xl font-semibold text-charcoal-900 tracking-tight">Recent HR Activities</h3>
              <Link href="/dashboard/activity" className="text-[11px] font-semibold text-forest-700 uppercase tracking-wide flex items-center gap-1">Audit Trail <ArrowUpRight size={14}/></Link>
            </div>
            <div className="space-y-4">
              <ActivityItem icon={<UserPlus size={16}/>} text="New Teacher Onboarding: Michael Chen (Science)" time="2h ago" color="bg-sage-100 text-forest-700" />
              <ActivityItem icon={<Calendar size={16}/>} text="Leave Approved: Sarah Smith (Annual Leave)" time="5h ago" color="bg-success-100 text-success-600" />
              <ActivityItem icon={<ShieldAlert size={16}/>} text="Contract Approaching Expiry: David Miller" time="Yesterday" color="bg-terracotta-100 text-terracotta-600" />
            </div>
          </section>
        </div>

        <div className="space-y-8">
          <div className="bg-charcoal-900 rounded-xl p-8 shadow-xs text-white">
            <h3 className="text-lg font-semibold mb-6 tracking-tight">Operational Shortcuts</h3>
            <div className="space-y-4">
              <SidebarLink label="Staff Directory" href="/dashboard/hr/staff" />
              <SidebarLink label="Leave Management" href="/dashboard/hr/leave" />
              <SidebarLink label="Attendance Audit" href="/dashboard/hr/attendance" />
              <SidebarLink label="Manage Departments" href="/dashboard/hr/departments" />
              <SidebarLink label="Position Registry" href="/dashboard/hr/positions" />
            </div>
          </div>

          <div className="bg-forest-700 rounded-xl p-8 shadow-xs text-white">
            <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
              <ShieldAlert size={20}/> Compliance Alerts
            </h3>
            <p className="text-sage-100 text-xs font-medium leading-relaxed opacity-80 uppercase tracking-tight">
              4 Staff members have expiring certifications within the next 30 days. Action required.
            </p>
            <button className="mt-6 w-full bg-card/10 border border-white/20 py-4 rounded-2xl text-[11px] font-semibold uppercase tracking-wide hover:bg-card/20 transition-all">
              Review Documents
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function KpiCard({ title, value, sub, icon, color }: any) {
  return (
    <div className="bg-card border border-warm-200 rounded-xl p-8 shadow-sm flex flex-col gap-6 hover:shadow-md transition-shadow">
      <div className={`p-4 rounded-2xl w-fit ${color}`}>{icon}</div>
      <div>
        <p className="text-[11px] font-semibold text-warm-400 uppercase tracking-wide mb-1">{title}</p>
        <p className="text-3xl font-semibold text-charcoal-900">{value}</p>
        <p className="text-[11px] font-bold text-warm-400 mt-1 italic">{sub}</p>
      </div>
    </div>
  );
}

function ActivityItem({ icon, text, time, color }: any) {
  return (
    <div className="flex items-center justify-between p-4 bg-ivory-50 rounded-2xl border border-warm-100">
      <div className="flex items-center gap-4">
        <div className={`p-2 rounded-xl ${color}`}>{icon}</div>
        <p className="text-xs font-bold text-warm-700">{text}</p>
      </div>
      <span className="text-[11px] font-semibold text-warm-400 uppercase">{time}</span>
    </div>
  );
}

function SidebarLink({ label, href }: any) {
  return (
    <Link href={href} className="flex items-center justify-between p-4 bg-card/5 rounded-2xl hover:bg-card/10 transition-all border border-white/5">
       <span className="text-xs font-semibold uppercase tracking-wide">{label}</span>
       <ChevronRight size={14} className="text-forest-500" />
    </Link>
  );
}
