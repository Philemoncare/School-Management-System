"use client";

import React, { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api/client";
import { useAuth } from "@/context/auth-context";
import {
  ClipboardList,
  Plus,
  Search,
  MessageSquare,
  Clock,
  CheckCircle,
  Tag,
  AlertCircle,
  MoreHorizontal
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

export default function EnquiriesManagement() {
  const { activeSchoolId } = useAuth();
  const [enquiries, setEnquiries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchEnquiries() {
      if (!activeSchoolId) return;
      try {
        const data = await apiFetch("/front-office/enquiries");
        setEnquiries(data);
      } catch (error) {
        console.error("Failed to load enquiries", error);
      } finally {
        setLoading(false);
      }
    }
    fetchEnquiries();
  }, [activeSchoolId]);

  if (loading) return <div className="p-8 text-center">Loading Enquiries Queue...</div>;

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-charcoal-900">Enquiry Management</h1>
          <p className="text-warm-500 text-sm">Track and resolve prospective parent and public enquiries.</p>
        </div>
        <Link
          href="/receptionist/enquiries/new"
          className="bg-forest-700 text-white px-5 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-forest-800 transition-all shadow-lg shadow-sage-100"
        >
          <Plus size={18} />
          Record Enquiry
        </Link>
      </div>

      <div className="bg-card rounded-3xl border border-warm-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-warm-100 flex flex-col md:flex-row justify-between gap-4">
           <div className="flex gap-4">
              <button className="text-sm font-bold text-forest-700 border-b-2 border-forest-700 pb-1">All Tasks</button>
              <button className="text-sm font-bold text-warm-400 hover:text-warm-600 pb-1 transition-colors">Pending</button>
              <button className="text-sm font-bold text-warm-400 hover:text-warm-600 pb-1 transition-colors">Resolved</button>
           </div>
           <div className="relative">
             <input
               type="text"
               placeholder="Ref # or Name..."
               className="pl-9 pr-4 py-2 bg-ivory-50 border border-warm-200 rounded-xl text-xs font-medium focus:outline-none focus:border-forest-500"
             />
             <Search className="absolute left-3 top-2.5 text-warm-400" size={14} />
           </div>
        </div>

        <div className="divide-y divide-ivory-50">
           {enquiries.map((enq) => (
             <div key={enq.id} className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:bg-ivory-50 transition-colors">
               <div className="flex items-start gap-5 flex-1">
                 <div className="w-12 h-12 bg-terracotta-50 rounded-2xl flex items-center justify-center text-terracotta-600 border border-terracotta-100 shrink-0">
                    <MessageSquare size={24} />
                 </div>
                 <div className="min-w-0">
                   <div className="flex items-center gap-2 mb-1">
                     <p className="text-[11px] font-semibold text-warm-400 uppercase tracking-wide leading-none">{enq.referenceNumber}</p>
                     <span className="px-1.5 py-0.5 bg-warm-100 text-warm-600 text-[11px] font-semibold uppercase rounded">{enq.category}</span>
                   </div>
                   <h3 className="text-base font-bold text-charcoal-900 truncate">{enq.subject}</h3>
                   <p className="text-xs text-warm-500 line-clamp-1 mt-1 font-medium">{enq.description}</p>
                   <div className="flex items-center gap-3 mt-3">
                      <span className="text-[11px] font-bold text-warm-700 flex items-center gap-1.5">
                        <Tag size={12} className="text-warm-400" /> {enq.visitorName}
                      </span>
                      <span className="w-1 h-1 bg-warm-300 rounded-full" />
                      <span className="text-[11px] font-bold text-warm-400 flex items-center gap-1.5">
                        <Clock size={12} /> {new Date(enq.createdAt).toLocaleDateString()}
                      </span>
                   </div>
                 </div>
               </div>

               <div className="flex items-center gap-4">
                 <div className="text-right hidden md:block">
                   <span className={`px-2 py-1 rounded-lg text-[11px] font-semibold uppercase ${
                     enq.status === 'NEW' ? 'bg-warning-50 text-warning-600 border border-warning-100' : 'bg-success-50 text-success-600 border border-success-100'
                   }`}>
                     {enq.status}
                   </span>
                 </div>
                 <button className="p-2 hover:bg-warm-200 rounded-xl text-warm-400 transition-colors">
                   <MoreHorizontal size={20} />
                 </button>
               </div>
             </div>
           ))}
           {enquiries.length === 0 && (
             <div className="p-20 text-center">
                <ClipboardList className="mx-auto text-warm-200 mb-2" size={48} />
                <p className="text-warm-400 font-medium">No enquires found in registry.</p>
             </div>
           )}
        </div>
      </div>
    </div>
  );
}

