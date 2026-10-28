"use client";

import React, { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api/client";
import { useAuth } from "@/context/auth-context";
import {
  Calendar,
  Plus,
  Clock,
  User,
  Search,
  CheckCircle,
  ArrowRight,
  MoreVertical,
  MapPin,
  MessageSquare
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

export default function AppointmentsManagement() {
  const { activeSchoolId } = useAuth();
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAppointments() {
      if (!activeSchoolId) return;
      try {
        const data = await apiFetch("/front-office/appointments");
        setAppointments(data);
      } catch (error) {
        console.error("Failed to load appointments", error);
      } finally {
        setLoading(false);
      }
    }
    fetchAppointments();
  }, [activeSchoolId]);

  if (loading) return <div className="p-8 text-center">Opening Appointment Book...</div>;

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-charcoal-900">Appointment Management</h1>
          <p className="text-warm-500 text-sm">Schedule and monitor meetings with staff and administration.</p>
        </div>
        <Link
          href="/receptionist/appointments/new"
          className="bg-forest-700 text-white px-5 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-forest-800 transition-all shadow-lg shadow-sage-100"
        >
          <Plus size={18} />
          New Appointment
        </Link>
      </div>

      <div className="bg-card rounded-2xl border border-warm-100 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-warm-100 bg-ivory-50/50 flex flex-col md:flex-row justify-between gap-4">
           <div className="flex bg-card rounded-lg p-1 border border-warm-200">
             <button className="px-4 py-1.5 bg-charcoal-900 text-white text-[11px] font-semibold uppercase rounded-md shadow-sm">Upcoming</button>
             <button className="px-4 py-1.5 text-warm-500 text-[11px] font-semibold uppercase">Historical</button>
           </div>
           <div className="relative">
             <input
               type="text"
               placeholder="Search appointments..."
               className="pl-9 pr-4 py-1.5 bg-card border border-warm-200 rounded-lg text-xs font-medium focus:outline-none focus:border-forest-500"
             />
             <Search className="absolute left-3 top-2 text-warm-400" size={14} />
           </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-card text-[11px] font-bold text-warm-400 uppercase tracking-wider border-b border-warm-100">
                <th className="p-6">Date & Time</th>
                <th className="p-6">Visitor / Contact</th>
                <th className="p-6">Host / Purpose</th>
                <th className="p-6">Status</th>
                <th className="p-6 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ivory-50">
              {appointments.map((apt) => (
                <tr key={apt.id} className="hover:bg-ivory-50/50 transition-colors">
                  <td className="p-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-sage-50 rounded-xl flex items-center justify-center text-forest-700">
                         <Calendar size={18} />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-charcoal-900">{new Date(apt.dateTime).toLocaleDateString()}</p>
                        <p className="text-[11px] text-warm-400 font-bold uppercase">{new Date(apt.dateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-6">
                     <p className="text-sm font-bold text-charcoal-900">{apt.visitorName}</p>
                     <p className="text-[11px] text-warm-400 font-medium">{apt.phone}</p>
                  </td>
                  <td className="p-6">
                     <p className="text-sm font-bold text-charcoal-900">{apt.hostName}</p>
                     <p className="text-[11px] text-forest-700 font-semibold uppercase tracking-wider">{apt.purpose}</p>
                  </td>
                  <td className="p-6">
                    <span className="px-2 py-1 bg-success-50 text-success-700 text-[11px] font-semibold uppercase rounded-md border border-success-100">
                       {apt.status}
                    </span>
                  </td>
                  <td className="p-6 text-right">
                    <button className="p-2 hover:bg-card rounded-lg border border-transparent hover:border-warm-200 text-warm-400 transition-all">
                       <MoreVertical size={16} />
                    </button>
                  </td>
                </tr>
              ))}
              {appointments.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-20 text-center">
                    <Calendar className="mx-auto text-warm-200 mb-2" size={48} />
                    <p className="text-warm-400 font-medium">No appointments scheduled.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

