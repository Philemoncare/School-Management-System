"use client";

import React, { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api/client";
import { useAuth } from "@/context/auth-context";
import {
  Users,
  Calendar,
  ClipboardList,
  Clock,
  Truck,
  AlertCircle,
  PlusCircle,
  CheckCircle,
  ArrowRight,
  UserCheck,
  Package,
  Search,
  LogIn,
  LogOut,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

export default function ReceptionistDashboard() {
  const { activeSchoolId } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDashboard() {
      if (!activeSchoolId) return;
      try {
        const data = await apiFetch("/front-office/dashboard");
        setStats(data);
      } catch (error) {
        console.error("Failed to load front office stats", error);
      } finally {
        setLoading(false);
      }
    }
    fetchDashboard();
  }, [activeSchoolId]);

  if (loading) return <div className="p-8 text-center">Loading Reception Workspace...</div>;

  const quickActions = [
    { label: "New Visitor", href: "/receptionist/visitors/new", icon: PlusCircle, color: "bg-forest-700" },
    { label: "Check In", href: "/receptionist/visitors", icon: LogIn, color: "bg-success-600" },
    { label: "New Appointment", href: "/receptionist/appointments/new", icon: Calendar, color: "bg-warning-600" },
    { label: "Log Enquiry", href: "/receptionist/enquiries/new", icon: ClipboardList, color: "bg-terracotta-600" },
    { label: "Verify Guardian", href: "/receptionist/pickup-authorizations", icon: UserCheck, color: "bg-terracotta-600" },
    { label: "Late Arrival", href: "/receptionist/late-arrivals", icon: Clock, color: "bg-terracotta-600" },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold text-charcoal-900 tracking-tight">Front Office <span className="text-forest-700">Command Center</span></h1>
          <p className="text-warm-500 font-medium">Real-time school reception monitoring and operations.</p>
        </div>
        <div className="bg-danger-50 border border-danger-100 px-4 py-2.5 rounded-xl flex items-center gap-3">
          <AlertCircle className="text-danger-600 animate-pulse" size={20} />
          <div>
            <p className="text-[11px] font-semibold text-danger-600 uppercase tracking-wide leading-none mb-1">Status</p>
            <p className="text-sm font-bold text-danger-900 leading-none uppercase">Standard Ops</p>
          </div>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard label="On Campus Now" value={stats.visitorsOnCampus} icon={UserCheck} color="blue" />
        <MetricCard label="Today's Visitors" value={stats.todayVisitorCount} icon={Users} color="green" />
        <MetricCard label="Appointments" value={stats.pendingAppointments} icon={Calendar} color="amber" />
        <MetricCard label="Open Enquiries" value={stats.pendingEnquiries} icon={ClipboardList} color="purple" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Quick Actions Panel */}
        <div className="lg:col-span-2 space-y-8">
          <section className="bg-card rounded-3xl border border-warm-100 shadow-sm overflow-hidden p-8">
             <h2 className="text-xl font-bold text-charcoal-900 mb-6 flex items-center gap-2">
               <PlusCircle size={24} className="text-forest-700" />
               Express Operations
             </h2>
             <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
               {quickActions.map((action) => (
                 <Link
                   key={action.label}
                   href={action.href}
                   className="flex flex-col items-center justify-center p-6 bg-ivory-50 rounded-2xl border border-warm-100 hover:border-sage-200 hover:bg-sage-50/50 transition-all group"
                 >
                   <div className={`${action.color} text-white p-3 rounded-xl mb-3 shadow-md group-hover:scale-110 transition-transform`}>
                     <action.icon size={24} />
                   </div>
                   <span className="text-sm font-bold text-warm-700 text-center">{action.label}</span>
                 </Link>
               ))}
             </div>
          </section>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
             {/* Pending Deliveries */}
             <section className="bg-card rounded-3xl border border-warm-100 shadow-sm p-6">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="font-bold text-charcoal-900 flex items-center gap-2">
                    <Package size={20} className="text-terracotta-600" />
                    Pending Deliveries
                  </h3>
                  <span className="text-[11px] font-semibold bg-terracotta-50 text-terracotta-600 px-2 py-1 rounded-full uppercase">{stats.expectedDeliveries} Active</span>
                </div>
                <p className="text-xs text-warm-500 font-medium italic text-center py-4">No uncollected deliveries logged.</p>
                <Link href="/receptionist/deliveries" className="block w-full text-center py-3 bg-ivory-50 text-warm-600 font-bold rounded-xl text-[11px] uppercase tracking-wide hover:bg-warm-100 transition-colors">
                  View Full Log
                </Link>
             </section>

             {/* Late Arrivals */}
             <section className="bg-card rounded-3xl border border-warm-100 shadow-sm p-6">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="font-bold text-charcoal-900 flex items-center gap-2">
                    <Clock size={20} className="text-forest-700" />
                    Late Admissions
                  </h3>
                  <span className="text-[11px] font-semibold bg-sage-50 text-forest-700 px-2 py-1 rounded-full uppercase">{stats.lateArrivalsCount} Today</span>
                </div>
                <p className="text-xs text-warm-500 font-medium italic text-center py-4">All arrivals marked present.</p>
                <Link href="/receptionist/late-arrivals" className="block w-full text-center py-3 bg-ivory-50 text-warm-600 font-bold rounded-xl text-[11px] uppercase tracking-wide hover:bg-warm-100 transition-colors">
                   Log Arrival
                </Link>
             </section>
          </div>
        </div>

        {/* Sidebar Ops */}
        <div className="space-y-8">
           <section className="bg-charcoal-900 text-white rounded-3xl p-8 shadow-xs relative overflow-hidden">
              <div className="relative z-10">
                <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                  <Search size={20} />
                  Quick Student Verify
                </h3>
                <div className="bg-card/10 border border-white/20 p-4 rounded-2xl mb-6">
                   <input
                     type="text"
                     placeholder="Name or Student #"
                     className="bg-transparent border-none w-full text-white placeholder:text-warm-400 focus:ring-0 text-sm font-bold"
                   />
                </div>
                <p className="text-[11px] text-warm-400 font-bold uppercase tracking-wide">Authorized Records Access Only</p>
              </div>
              <Users size={120} className="absolute -bottom-10 -right-10 text-white/5 -rotate-12" />
           </section>

           <section className="bg-card rounded-3xl border border-warm-100 shadow-sm p-6 overflow-hidden">
              <h3 className="font-bold text-charcoal-900 mb-6 flex items-center gap-2">
                <ArrowRight size={20} className="text-forest-700" />
                Next Appointment
              </h3>
              <div className="bg-sage-50/50 p-4 rounded-2xl border border-sage-100/50 mb-4">
                 <p className="text-[11px] font-semibold text-forest-700 uppercase tracking-wide mb-1">02:30 PM • Main Office</p>
                 <p className="text-sm font-bold text-charcoal-900">Guardian Meeting</p>
                 <p className="text-xs text-warm-500 mt-1 font-medium">Mrs. Akua Mensah with Principal</p>
              </div>
              <Link href="/receptionist/appointments" className="text-xs font-bold text-forest-700 hover:underline">See full schedule</Link>
           </section>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ label, value, icon: Icon, color }: any) {
  const colors: any = {
    blue: "bg-sage-50 border-sage-100 text-forest-700",
    green: "bg-success-50 border-success-100 text-success-600",
    amber: "bg-warning-50 border-warning-100 text-warning-600",
    purple: "bg-terracotta-50 border-terracotta-100 text-terracotta-600",
  };

  return (
    <div className={`p-6 rounded-3xl border shadow-sm transition-all hover:shadow-md ${colors[color] || ""}`}>
       <div className="flex items-center justify-between mb-4">
         <div className="bg-card p-2.5 rounded-xl shadow-sm border border-inherit">
           <Icon size={24} />
         </div>
       </div>
       <div>
         <p className="text-[11px] font-semibold uppercase tracking-wide opacity-70 mb-1">{label}</p>
         <h3 className="text-3xl font-semibold text-charcoal-900">{value}</h3>
       </div>
    </div>
  );
}
