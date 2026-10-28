"use client";

import React, { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api/client";
import { useAuth } from "@/context/auth-context";
import {
  Users,
  Plus,
  LogIn,
  LogOut,
  Search,
  Loader2,
  CheckCircle,
  Clock,
  UserPlus,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

export default function VisitorManagement() {
  const { activeSchoolId } = useAuth();
  const [visits, setVisits] = useState<any[]>([]);
  const [visitors, setVisitors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    async function fetchData() {
      if (!activeSchoolId) return;
      try {
        const [visitsData, visitorsData] = await Promise.all([
          apiFetch("/front-office/visitors/current"),
          apiFetch("/front-office/visitors"),
        ]);
        setVisits(visitsData);
        setVisitors(visitorsData);
      } catch (error) {
        console.error("Failed to load visitor data", error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [activeSchoolId]);

  async function handleCheckOut(visitId: string) {
    try {
      await apiFetch(`/front-office/visitors/check-out/${visitId}`, {
        method: "PATCH",
      });
      setVisits(visits.filter(v => v.id !== visitId));
      toast.success("Visitor checked out successfully.");
    } catch (error: any) {
      toast.error(error.message || "Failed to check out visitor.");
    }
  }

  if (loading) return <div className="p-8 text-center">Synchronizing Visitor Desk...</div>;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-charcoal-900">Visitor Management</h1>
          <p className="text-warm-500 text-sm">Control campus access and monitor active visits.</p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/receptionist/visitors/new"
            className="bg-forest-700 text-white px-5 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-forest-800 transition-colors shadow-lg shadow-sage-100"
          >
            <UserPlus size={18} />
            Register Visitor
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Active On Campus */}
        <div className="lg:col-span-2 space-y-6">
          <section className="bg-card rounded-2xl border border-warm-100 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-warm-100 flex justify-between items-center bg-ivory-50/50">
              <h3 className="font-bold text-charcoal-900 flex items-center gap-2">
                <CheckCircle size={18} className="text-success-600" />
                Active on Campus ({visits.length})
              </h3>
            </div>
            <div className="divide-y divide-ivory-50">
              {visits.map((visit) => (
                <div key={visit.id} className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-ivory-50 transition-colors group">
                  <div className="flex items-start gap-4">
                     <div className="w-12 h-12 bg-success-50 rounded-xl flex items-center justify-center text-success-600 shrink-0 border border-success-100">
                        <Users size={24} />
                     </div>
                     <div>
                       <p className="text-sm font-bold text-charcoal-900">{visit.visitorName}</p>
                       <p className="text-xs text-warm-500 font-medium">Purpose: {visit.purpose}</p>
                       <div className="flex items-center gap-3 mt-1.5">
                          <span className="text-[11px] font-semibold bg-sage-50 text-forest-700 px-1.5 py-0.5 rounded uppercase">Pass {visit.badgeNumber}</span>
                          <span className="text-[11px] text-warm-400 font-bold flex items-center gap-1">
                            <Clock size={12} /> IN: {new Date(visit.actualCheckInAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                       </div>
                     </div>
                  </div>
                  <button
                    onClick={() => handleCheckOut(visit.id)}
                    className="flex items-center justify-center gap-2 px-4 py-2 bg-warm-100 text-warm-700 rounded-lg text-xs font-bold hover:bg-danger-50 hover:text-danger-600 transition-all border border-transparent hover:border-danger-100"
                  >
                    <LogOut size={14} />
                    Check Out
                  </button>
                </div>
              ))}
              {visits.length === 0 && (
                <div className="p-12 text-center">
                  <Users className="mx-auto text-warm-200 mb-2" size={48} />
                  <p className="text-warm-400 font-medium italic">No visitors currently on campus.</p>
                </div>
              )}
            </div>
          </section>
        </div>

        {/* Directory / Search */}
        <div className="space-y-6">
           <section className="bg-card rounded-2xl border border-warm-100 shadow-sm p-6">
              <h3 className="font-bold text-charcoal-900 mb-4 flex items-center gap-2">
                <Search size={18} className="text-forest-700" />
                Visitor Directory
              </h3>
              <div className="relative mb-6">
                <input
                  type="text"
                  placeholder="Search registered persons..."
                  className="w-full pl-10 pr-4 py-2.5 bg-ivory-50 border border-warm-100 rounded-xl text-sm font-medium focus:outline-none focus:border-forest-500"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <Search className="absolute left-3 top-3 text-warm-400" size={16} />
              </div>

              <div className="space-y-3 max-h-[500px] overflow-y-auto custom-scrollbar pr-1">
                {visitors
                  .filter(v => v.fullName.toLowerCase().includes(searchQuery.toLowerCase()))
                  .map((visitor) => (
                  <div key={visitor.id} className="p-4 bg-ivory-50 rounded-xl border border-warm-100/50 hover:border-sage-100 hover:bg-sage-50/30 transition-all group">
                    <p className="text-sm font-bold text-charcoal-900">{visitor.fullName}</p>
                    <p className="text-[11px] text-warm-400 font-bold uppercase tracking-wider">{visitor.visitorType} • {visitor.organization}</p>
                    <div className="mt-3 flex items-center justify-between">
                       <span className="text-[11px] text-warm-500 font-medium">{visitor.phone}</span>
                       <button className="text-forest-700 font-bold text-[11px] uppercase flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                         New Visit <ArrowRight size={12} />
                       </button>
                    </div>
                  </div>
                ))}
                {visitors.length === 0 && <p className="text-center text-warm-400 text-xs py-4 font-medium italic">No registered visitors found.</p>}
              </div>
           </section>
        </div>
      </div>
    </div>
  );
}

