"use client";

import React, { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api/client";
import { useAuth } from "@/context/auth-context";
import {
  Package,
  Plus,
  Search,
  Truck,
  CheckCircle,
  Clock,
  User,
  MoreVertical,
  Building2
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

export default function DeliveriesLog() {
  const { activeSchoolId } = useAuth();
  const [deliveries, setDeliveries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDeliveries() {
      if (!activeSchoolId) return;
      try {
        const data = await apiFetch("/front-office/deliveries");
        setDeliveries(data);
      } catch (error) {
        console.error("Failed to load deliveries", error);
      } finally {
        setLoading(false);
      }
    }
    fetchDeliveries();
  }, [activeSchoolId]);

  if (loading) return <div className="p-8 text-center">Auditing Parcel Registry...</div>;

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-charcoal-900">Deliveries & Courier Log</h1>
          <p className="text-warm-500 text-sm">Track physical incoming parcels and courier handoffs.</p>
        </div>
        <button className="bg-forest-700 text-white px-5 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-forest-800 transition-all shadow-lg shadow-sage-100">
          <Plus size={18} />
          Record Delivery
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {deliveries.map((del) => (
          <div key={del.id} className="bg-card rounded-3xl border border-warm-100 shadow-sm p-6 hover:shadow-md transition-shadow group">
             <div className="flex justify-between items-start mb-6">
               <div className="p-3 bg-terracotta-50 text-terracotta-600 rounded-2xl group-hover:bg-terracotta-600 group-hover:text-white transition-colors">
                  <Package size={24} />
               </div>
               <span className="px-2 py-1 bg-success-50 text-success-700 text-[11px] font-semibold uppercase rounded-lg border border-success-100">
                 {del.status}
               </span>
             </div>

             <div className="space-y-4">
               <div>
                 <p className="text-[11px] font-semibold text-warm-400 uppercase tracking-wide mb-1">Recipient</p>
                 <h3 className="text-lg font-bold text-charcoal-900">{del.recipientName}</h3>
               </div>

               <div className="grid grid-cols-2 gap-4">
                 <div>
                    <p className="text-[11px] font-semibold text-warm-400 uppercase tracking-wide mb-1">Courier</p>
                    <p className="text-xs font-bold text-warm-700">{del.courierCompany}</p>
                 </div>
                 <div>
                    <p className="text-[11px] font-semibold text-warm-400 uppercase tracking-wide mb-1">Ref #</p>
                    <p className="text-xs font-bold text-warm-700 truncate">{del.referenceNumber}</p>
                 </div>
               </div>

               <div className="pt-4 border-t border-ivory-50 flex items-center justify-between">
                  <span className="text-[11px] text-warm-400 font-bold flex items-center gap-1.5 uppercase">
                    <Clock size={12} /> {new Date(del.receivedAt).toLocaleDateString()}
                  </span>
                  <button className="text-[11px] font-semibold text-forest-700 uppercase tracking-wide hover:underline">Mark Collected</button>
               </div>
             </div>
          </div>
        ))}

        {deliveries.length === 0 && (
          <div className="col-span-full bg-card rounded-3xl p-20 text-center border border-warm-100 shadow-sm">
             <Truck className="mx-auto text-warm-200 mb-2" size={48} />
             <p className="text-warm-400 font-medium">No deliveries logged in the registry.</p>
          </div>
        )}
      </div>
    </div>
  );
}

