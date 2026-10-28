"use client";

import React, { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api/client";
import { useAuth } from "@/context/auth-context";
import {
  GraduationCap,
  Plus,
  Search,
  UserCheck,
  Clock,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  ShieldCheck
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

export default function StudentCheckoutManagement() {
  const { activeSchoolId } = useAuth();
  const [checkouts, setCheckouts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCheckouts() {
      if (!activeSchoolId) return;
      try {
        const data = await apiFetch("/front-office/students/checkouts");
        setCheckouts(data);
      } catch (error) {
        console.error("Failed to load checkouts", error);
      } finally {
        setLoading(false);
      }
    }
    fetchCheckouts();
  }, [activeSchoolId]);

  if (loading) return <div className="p-8 text-center">Loading Departure Registry...</div>;

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-charcoal-900">Student Early Checkout</h1>
          <p className="text-warm-500 text-sm">Manage student departures during active school hours.</p>
        </div>
        <Link
          href="/receptionist/student-checkout/new"
          className="bg-forest-700 text-white px-5 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-forest-800 transition-all shadow-lg shadow-sage-100"
        >
          <Plus size={18} />
          New Checkout
        </Link>
      </div>

      <div className="bg-card rounded-3xl border border-warm-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-warm-100 bg-ivory-50/30">
          <h3 className="font-bold text-charcoal-900 flex items-center gap-2">
            <ShieldCheck size={18} className="text-forest-700" />
            Verification Log
          </h3>
        </div>

        <div className="divide-y divide-ivory-50">
          {checkouts.map((co) => (
            <div key={co.id} className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:bg-ivory-50 transition-colors">
              <div className="flex items-start gap-5">
                <div className="w-12 h-12 bg-sage-50 rounded-2xl flex items-center justify-center text-forest-700 border border-sage-100 shrink-0">
                   <GraduationCap size={24} />
                </div>
                <div>
                   <h3 className="text-base font-bold text-charcoal-900">{co.studentName}</h3>
                   <p className="text-xs text-warm-500 font-medium">Pickup by: <span className="text-charcoal-900 font-bold">{co.guardianName}</span></p>
                   <div className="flex items-center gap-3 mt-2">
                      <span className="text-[11px] font-semibold bg-success-50 text-success-600 px-1.5 py-0.5 rounded uppercase border border-success-100">{co.status}</span>
                      <span className="text-[11px] text-warm-400 font-bold flex items-center gap-1">
                        <Clock size={12} /> {new Date(co.checkedOutAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                   </div>
                </div>
              </div>

              <div className="bg-ivory-50 px-4 py-2 rounded-xl border border-warm-100 min-w-[200px]">
                 <p className="text-[11px] font-semibold text-warm-400 uppercase tracking-wide mb-1">Reason for Leave</p>
                 <p className="text-xs font-bold text-warm-700">{co.reason}</p>
              </div>
            </div>
          ))}
          {checkouts.length === 0 && (
            <div className="p-20 text-center">
               <AlertCircle className="mx-auto text-warm-200 mb-2" size={48} />
               <p className="text-warm-400 font-medium">No checkout requests recorded today.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

