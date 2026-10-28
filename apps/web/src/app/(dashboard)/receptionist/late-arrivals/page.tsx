"use client";

import React, { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api/client";
import { useAuth } from "@/context/auth-context";
import {
  Clock,
  Plus,
  Search,
  User,
  AlertCircle,
  History,
  GraduationCap
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

export default function LateArrivalsManagement() {
  const { activeSchoolId } = useAuth();
  const [lates, setLates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchLates() {
      if (!activeSchoolId) return;
      try {
        const data = await apiFetch("/front-office/students/late-arrivals");
        setLates(data);
      } catch (error) {
        console.error("Failed to load late arrivals", error);
      } finally {
        setLoading(false);
      }
    }
    fetchLates();
  }, [activeSchoolId]);

  if (loading) return <div className="p-8 text-center">Synchronizing Clock-in Records...</div>;

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-charcoal-900">Late Arrival Records</h1>
          <p className="text-warm-500 text-sm">Monitor and record students arriving after session start.</p>
        </div>
        <button className="bg-forest-700 text-white px-5 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-forest-800 transition-all shadow-lg shadow-sage-100">
          <Plus size={18} />
          Record Late Arrival
        </button>
      </div>

      <div className="bg-card rounded-3xl border border-warm-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-warm-100 bg-ivory-50/50 flex justify-between items-center">
           <h3 className="font-bold text-charcoal-900 flex items-center gap-2">
             <History size={18} className="text-forest-700" />
             Arrival Log
           </h3>
           <span className="text-[11px] font-semibold bg-sage-100 text-forest-800 px-2.5 py-1 rounded-full uppercase tracking-wider">Today</span>
        </div>

        <div className="divide-y divide-ivory-50">
          {lates.map((late) => (
            <div key={late.id} className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:bg-ivory-50 transition-colors">
               <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-terracotta-50 rounded-2xl flex items-center justify-center text-terracotta-600 border border-terracotta-100">
                     <GraduationCap size={24} />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-charcoal-900">{late.studentName}</h3>
                    <p className="text-xs text-warm-500 font-medium">Arrival Time: <span className="text-charcoal-900 font-bold">{new Date(late.arrivalTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span></p>
                  </div>
               </div>

               <div className="flex-1 max-w-md bg-ivory-50 p-3 rounded-xl border border-warm-100">
                  <p className="text-[11px] font-semibold text-warm-400 uppercase tracking-wide mb-0.5">Recorded Reason</p>
                  <p className="text-xs font-bold text-warm-700">{late.reason}</p>
               </div>

               <div className="text-right">
                  <button className="text-[11px] font-semibold text-forest-700 uppercase tracking-wide hover:underline">Edit Entry</button>
               </div>
            </div>
          ))}
          {lates.length === 0 && (
            <div className="p-20 text-center">
               <Clock className="mx-auto text-warm-200 mb-2" size={48} />
               <p className="text-warm-400 font-medium">No late arrivals recorded yet.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
