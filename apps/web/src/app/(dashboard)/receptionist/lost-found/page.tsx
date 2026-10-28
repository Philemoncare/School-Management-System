"use client";

import React, { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api/client";
import { useAuth } from "@/context/auth-context";
import {
  AlertCircle,
  Plus,
  Search,
  CheckCircle,
  Clock,
  MapPin,
  Tag,
  Loader2,
  Camera
} from "lucide-react";
import { toast } from "sonner";

export default function LostFoundManagement() {
  const { activeSchoolId } = useAuth();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchItems() {
      if (!activeSchoolId) return;
      try {
        const data = await apiFetch("/front-office/lost-found");
        setItems(data);
      } catch (error) {
        console.error("Failed to load lost-found items", error);
      } finally {
        setLoading(false);
      }
    }
    fetchItems();
  }, [activeSchoolId]);

  if (loading) return <div className="p-8 text-center">Loading Inventory Log...</div>;

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-charcoal-900">Lost & Found Inventory</h1>
          <p className="text-warm-500 text-sm">Manage recovered items and facilitate claimant handoffs.</p>
        </div>
        <button className="bg-forest-700 text-white px-5 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-forest-800 transition-all shadow-lg shadow-sage-100">
          <Plus size={18} />
          Log Found Item
        </button>
      </div>

      <div className="bg-card rounded-3xl border border-warm-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-warm-100 bg-ivory-50/50 flex flex-col md:flex-row justify-between gap-4">
           <div className="flex gap-4">
              <button className="text-sm font-bold text-forest-700 border-b-2 border-forest-700 pb-1">Unclaimed</button>
              <button className="text-sm font-bold text-warm-400 hover:text-warm-600 pb-1 transition-colors">Claimed</button>
           </div>
           <div className="relative">
             <input
               type="text"
               placeholder="Search items..."
               className="pl-9 pr-4 py-2 bg-card border border-warm-200 rounded-xl text-xs font-medium focus:outline-none focus:border-forest-500"
             />
             <Search className="absolute left-3 top-2.5 text-warm-400" size={14} />
           </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-card text-[11px] font-bold text-warm-400 uppercase tracking-wider border-b border-warm-100">
                <th className="p-6">Found Item</th>
                <th className="p-6">Location</th>
                <th className="p-6">Date Found</th>
                <th className="p-6">Status</th>
                <th className="p-6 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ivory-50">
              {items.map((item) => (
                <tr key={item.id} className="hover:bg-ivory-50/50 transition-colors">
                  <td className="p-6">
                     <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-warm-100 rounded-xl flex items-center justify-center text-warm-400 border border-warm-200">
                           <Tag size={20} />
                        </div>
                        <div>
                           <p className="text-sm font-bold text-charcoal-900">{item.itemName}</p>
                           <p className="text-[11px] text-warm-400 font-semibold uppercase">{item.category}</p>
                        </div>
                     </div>
                  </td>
                  <td className="p-6">
                    <p className="text-xs font-bold text-warm-700 flex items-center gap-1.5 uppercase">
                      <MapPin size={12} className="text-warm-400" /> {item.foundLocation}
                    </p>
                  </td>
                  <td className="p-6">
                    <p className="text-xs font-medium text-warm-500">{new Date(item.foundAt).toLocaleDateString()}</p>
                  </td>
                  <td className="p-6">
                     <span className={`px-2 py-0.5 rounded text-[11px] font-semibold uppercase ${
                       item.status === 'STORED' ? 'bg-sage-50 text-forest-800' : 'bg-success-50 text-success-700'
                     }`}>
                       {item.status}
                     </span>
                  </td>
                  <td className="p-6 text-right">
                     <button className="text-[11px] font-semibold text-forest-700 uppercase tracking-wide hover:underline">Process Claim</button>
                  </td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-20 text-center">
                    <AlertCircle className="mx-auto text-warm-200 mb-2" size={48} />
                    <p className="text-warm-400 font-medium">No items in lost & found inventory.</p>
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

