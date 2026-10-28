"use client";

import { Select } from '@/components/ui/input';
import React, { useState } from "react";
import { apiFetch } from "@/lib/api/client";
import { useRouter } from "next/navigation";
import {
  UserPlus,
  ArrowLeft,
  Loader2,
  Save,
  User,
  Phone,
  Mail,
  Building2,
  Tag,
  CreditCard,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

export default function NewVisitor() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
    phone: "",
    email: "",
    organization: "",
    visitorType: "General",
    identificationType: "ID Card",
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await apiFetch("/front-office/visitors", {
        method: "POST",
        body: JSON.stringify(formData),
      });
      toast.success("Visitor registered successfully!");
      router.push("/receptionist/visitors");
    } catch (error: any) {
      toast.error(error.message || "Failed to register visitor.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div className="flex items-center gap-4">
        <Link
          href="/receptionist/visitors"
          className="p-2 hover:bg-warm-100 rounded-lg transition-colors"
        >
          <ArrowLeft size={20} className="text-warm-500" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-charcoal-900">Register Visitor</h1>
          <p className="text-warm-500 text-sm">Capture details of a new person visiting the campus.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-card rounded-3xl border border-warm-100 shadow-sm overflow-hidden">
        <div className="p-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[11px] font-semibold text-warm-400 uppercase tracking-wide ml-1">Full Name</label>
              <div className="relative">
                <input
                  required
                  type="text"
                  placeholder="e.g. John Doe"
                  className="w-full pl-10 pr-4 py-2.5 bg-ivory-50 border border-warm-200 rounded-xl text-sm font-medium focus:outline-none focus:border-forest-500 transition-colors"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
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
              <label className="text-[11px] font-semibold text-warm-400 uppercase tracking-wide ml-1">Email Address (Optional)</label>
              <div className="relative">
                <input
                  type="email"
                  placeholder="john@example.com"
                  className="w-full pl-10 pr-4 py-2.5 bg-ivory-50 border border-warm-200 rounded-xl text-sm font-medium focus:outline-none focus:border-forest-500 transition-colors"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
                <Mail className="absolute left-3.5 top-3 text-warm-400" size={16} />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-semibold text-warm-400 uppercase tracking-wide ml-1">Organization / Company</label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Self, Company Name, etc."
                  className="w-full pl-10 pr-4 py-2.5 bg-ivory-50 border border-warm-200 rounded-xl text-sm font-medium focus:outline-none focus:border-forest-500 transition-colors"
                  value={formData.organization}
                  onChange={(e) => setFormData({ ...formData, organization: e.target.value })}
                />
                <Building2 className="absolute left-3.5 top-3 text-warm-400" size={16} />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-semibold text-warm-400 uppercase tracking-wide ml-1">Visitor Category</label>
              <div className="relative">
                <Select
                  className="w-full pl-10 pr-4 py-2.5 bg-ivory-50 border border-warm-200 rounded-xl text-sm font-medium focus:outline-none focus:border-forest-500 appearance-none transition-colors"
                  value={formData.visitorType}
                  onChange={(e) => setFormData({ ...formData, visitorType: e.target.value })}
                >
                  <option value="General">General</option>
                  <option value="Guardian">Guardian / Parent</option>
                  <option value="Contractor">Contractor</option>
                  <option value="Vendor">Vendor</option>
                  <option value="Official">Government / Official</option>
                  <option value="Alumni">Alumni</option>
                </Select>
                <Tag className="absolute left-3.5 top-3 text-warm-400" size={16} />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-semibold text-warm-400 uppercase tracking-wide ml-1">ID Provided</label>
              <div className="relative">
                <Select
                  className="w-full pl-10 pr-4 py-2.5 bg-ivory-50 border border-warm-200 rounded-xl text-sm font-medium focus:outline-none focus:border-forest-500 appearance-none transition-colors"
                  value={formData.identificationType}
                  onChange={(e) => setFormData({ ...formData, identificationType: e.target.value })}
                >
                  <option value="ID Card">National ID Card</option>
                  <option value="Driver License">Driver License</option>
                  <option value="Passport">Passport</option>
                  <option value="Other">Other</option>
                  <option value="None">None</option>
                </Select>
                <CreditCard className="absolute left-3.5 top-3 text-warm-400" size={16} />
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 bg-ivory-50 border-t border-warm-100 flex justify-end">
           <button
             type="submit"
             disabled={loading}
             className="bg-forest-700 text-white px-8 py-3 rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-forest-800 transition-all shadow-lg shadow-sage-100 disabled:opacity-50"
           >
             {loading ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
             Record Registration
           </button>
        </div>
      </form>
    </div>
  );
}
