"use client";

import React, { useState } from "react";
import { apiFetch } from "@/lib/api/client";
import { useRouter } from "next/navigation";
import {
  Calendar,
  ArrowLeft,
  Loader2,
  Save,
  User,
  Phone,
  Clock,
  MapPin,
  FileText,
  UserCheck
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

export default function NewAppointment() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    visitorName: "",
    phone: "",
    hostName: "",
    purpose: "",
    dateTime: "",
    location: "Main Reception",
    notes: "",
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await apiFetch("/front-office/appointments", {
        method: "POST",
        body: JSON.stringify(formData),
      });
      toast.success("Appointment scheduled successfully!");
      router.push("/receptionist/appointments");
    } catch (error: any) {
      toast.error(error.message || "Failed to schedule appointment.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div className="flex items-center gap-4">
        <Link
          href="/receptionist/appointments"
          className="p-2 hover:bg-warm-100 rounded-lg transition-colors"
        >
          <ArrowLeft size={20} className="text-warm-500" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-charcoal-900">Schedule Appointment</h1>
          <p className="text-warm-500 text-sm">Create a formal meeting entry in the school calendar.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-card rounded-3xl border border-warm-100 shadow-sm overflow-hidden">
        <div className="p-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[11px] font-semibold text-warm-400 uppercase tracking-wide ml-1">Visitor Name</label>
              <div className="relative">
                <input
                  required
                  type="text"
                  placeholder="Guest name..."
                  className="w-full pl-10 pr-4 py-2.5 bg-ivory-50 border border-warm-200 rounded-xl text-sm font-medium focus:outline-none focus:border-forest-500 transition-colors"
                  value={formData.visitorName}
                  onChange={(e) => setFormData({ ...formData, visitorName: e.target.value })}
                />
                <User className="absolute left-3.5 top-3 text-warm-400" size={16} />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-semibold text-warm-400 uppercase tracking-wide ml-1">Contact Phone</label>
              <div className="relative">
                <input
                  required
                  type="tel"
                  placeholder="Visitor number..."
                  className="w-full pl-10 pr-4 py-2.5 bg-ivory-50 border border-warm-200 rounded-xl text-sm font-medium focus:outline-none focus:border-forest-500 transition-colors"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
                <Phone className="absolute left-3.5 top-3 text-warm-400" size={16} />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-semibold text-warm-400 uppercase tracking-wide ml-1">Appointment Date & Time</label>
              <div className="relative">
                <input
                  required
                  type="datetime-local"
                  className="w-full pl-10 pr-4 py-2.5 bg-ivory-50 border border-warm-200 rounded-xl text-sm font-medium focus:outline-none focus:border-forest-500 transition-colors"
                  value={formData.dateTime}
                  onChange={(e) => setFormData({ ...formData, dateTime: e.target.value })}
                />
                <Clock className="absolute left-3.5 top-3 text-warm-400" size={16} />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-semibold text-warm-400 uppercase tracking-wide ml-1">Host Staff / Officer</label>
              <div className="relative">
                <input
                  required
                  type="text"
                  placeholder="Who are they meeting?"
                  className="w-full pl-10 pr-4 py-2.5 bg-ivory-50 border border-warm-200 rounded-xl text-sm font-medium focus:outline-none focus:border-forest-500 transition-colors"
                  value={formData.hostName}
                  onChange={(e) => setFormData({ ...formData, hostName: e.target.value })}
                />
                <UserCheck className="absolute left-3.5 top-3 text-warm-400" size={16} />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-semibold text-warm-400 uppercase tracking-wide ml-1">Meeting Purpose</label>
              <div className="relative">
                <input
                  required
                  type="text"
                  placeholder="e.g. Admission Interview"
                  className="w-full pl-10 pr-4 py-2.5 bg-ivory-50 border border-warm-200 rounded-xl text-sm font-medium focus:outline-none focus:border-forest-500 transition-colors"
                  value={formData.purpose}
                  onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
                />
                <FileText className="absolute left-3.5 top-3 text-warm-400" size={16} />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-semibold text-warm-400 uppercase tracking-wide ml-1">Meeting Venue</label>
              <div className="relative">
                <input
                  required
                  type="text"
                  placeholder="e.g. Admin Office B"
                  className="w-full pl-10 pr-4 py-2.5 bg-ivory-50 border border-warm-200 rounded-xl text-sm font-medium focus:outline-none focus:border-forest-500 transition-colors"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                />
                <MapPin className="absolute left-3.5 top-3 text-warm-400" size={16} />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[11px] font-semibold text-warm-400 uppercase tracking-wide ml-1">Additional Instructions</label>
            <textarea
              rows={3}
              placeholder="Any specific prep or notes..."
              className="w-full p-4 bg-ivory-50 border border-warm-200 rounded-2xl text-sm font-medium focus:outline-none focus:border-forest-500 transition-colors resize-none"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            />
          </div>
        </div>

        <div className="p-6 bg-ivory-50 border-t border-warm-100 flex justify-end">
           <button
             type="submit"
             disabled={loading}
             className="bg-forest-700 text-white px-8 py-3 rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-forest-800 transition-all shadow-lg shadow-sage-100 disabled:opacity-50"
           >
             {loading ? <Loader2 size={18} className="animate-spin" /> : <Calendar size={18} />}
             Confirm Appointment
           </button>
        </div>
      </form>
    </div>
  );
}
