"use client";

import { Select } from '@/components/ui/input';
import React, { useState } from "react";
import { apiFetch } from "@/lib/api/client";
import { useRouter } from "next/navigation";
import {
  MessageSquare,
  ArrowLeft,
  Loader2,
  Save,
  User,
  Phone,
  Mail,
  Tag,
  FileText,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

export default function NewEnquiry() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    visitorName: "",
    phone: "",
    email: "",
    category: "General",
    subject: "",
    description: "",
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await apiFetch("/front-office/enquiries", {
        method: "POST",
        body: JSON.stringify(formData),
      });
      toast.success("Enquiry recorded successfully!");
      router.push("/receptionist/enquiries");
    } catch (error: any) {
      toast.error(error.message || "Failed to record enquiry.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div className="flex items-center gap-4">
        <Link
          href="/receptionist/enquiries"
          className="p-2 hover:bg-warm-100 rounded-lg transition-colors"
        >
          <ArrowLeft size={20} className="text-warm-500" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-charcoal-900">Record New Enquiry</h1>
          <p className="text-warm-500 text-sm">Capture public or prospective parent enquiries for follow-up.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-card rounded-3xl border border-warm-100 shadow-sm overflow-hidden">
        <div className="p-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[11px] font-semibold text-warm-400 uppercase tracking-wide ml-1">Contact Name</label>
              <div className="relative">
                <input
                  required
                  type="text"
                  placeholder="e.g. Ama Serwaa"
                  className="w-full pl-10 pr-4 py-2.5 bg-ivory-50 border border-warm-200 rounded-xl text-sm font-medium focus:outline-none focus:border-forest-500 transition-colors"
                  value={formData.visitorName}
                  onChange={(e) => setFormData({ ...formData, visitorName: e.target.value })}
                />
                <User className="absolute left-3.5 top-3 text-warm-400" size={16} />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-semibold text-warm-400 uppercase tracking-wide ml-1">Phone Number</label>
              <div className="relative">
                <input
                  required
                  type="tel"
                  placeholder="+233..."
                  className="w-full pl-10 pr-4 py-2.5 bg-ivory-50 border border-warm-200 rounded-xl text-sm font-medium focus:outline-none focus:border-forest-500 transition-colors"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
                <Phone className="absolute left-3.5 top-3 text-warm-400" size={16} />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-semibold text-warm-400 uppercase tracking-wide ml-1">Category</label>
              <div className="relative">
                <Select
                  className="w-full pl-10 pr-4 py-2.5 bg-ivory-50 border border-warm-200 rounded-xl text-sm font-medium focus:outline-none focus:border-forest-500 appearance-none transition-colors"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                >
                  <option value="General">General Info</option>
                  <option value="Admissions">Admissions Enquiry</option>
                  <option value="Finance">Fees & Payments</option>
                  <option value="Academics">Academics / Curriculum</option>
                  <option value="Complaint">Feedback / Complaint</option>
                </Select>
                <Tag className="absolute left-3.5 top-3 text-warm-400" size={16} />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-semibold text-warm-400 uppercase tracking-wide ml-1">Subject</label>
              <div className="relative">
                <input
                  required
                  type="text"
                  placeholder="Enquiry topic..."
                  className="w-full pl-10 pr-4 py-2.5 bg-ivory-50 border border-warm-200 rounded-xl text-sm font-medium focus:outline-none focus:border-forest-500 transition-colors"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                />
                <FileText className="absolute left-3.5 top-3 text-warm-400" size={16} />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[11px] font-semibold text-warm-400 uppercase tracking-wide ml-1">Description / Notes</label>
            <textarea
              required
              rows={4}
              placeholder="Capture the full context of the enquiry here..."
              className="w-full p-4 bg-ivory-50 border border-warm-200 rounded-2xl text-sm font-medium focus:outline-none focus:border-forest-500 transition-colors resize-none"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>
        </div>

        <div className="p-6 bg-ivory-50 border-t border-warm-100 flex justify-end">
           <button
             type="submit"
             disabled={loading}
             className="bg-forest-700 text-white px-8 py-3 rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-forest-800 transition-all shadow-lg shadow-sage-100 disabled:opacity-50"
           >
             {loading ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
             Log Enquiry Reference
           </button>
        </div>
      </form>
    </div>
  );
}
