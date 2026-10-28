'use client';

import React, { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api/client';
import {
  MapPin,
  Plus,
  Search,
  Building2,
  User,
  ArrowRight,
  MoreVertical,
  Layers
} from 'lucide-react';
import Link from 'next/link';

export default function InventoryLocationsPage() {
  const [locations, setLocations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch('/inventory/locations')
      .then(setLocations)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-charcoal-900">Stock Locations</h1>
          <p className="text-warm-500 text-sm">Manage physical stores, labs and distribution points.</p>
        </div>
        <button className="bg-forest-700 text-white px-5 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-forest-800 transition-colors">
          <Plus size={18} /> New Location
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
         {loading ? (
           <div className="col-span-full p-20 text-center text-warm-400 font-bold animate-pulse">Syncing locations...</div>
         ) : locations.length === 0 ? (
           <div className="col-span-full p-20 text-center text-warm-400 font-bold italic border-2 border-dashed border-warm-100 rounded-3xl">
              No stock locations defined. Create a location to start managing inventory.
           </div>
         ) : locations.map((loc) => (
           <div key={loc.id} className="bg-card rounded-3xl border border-warm-100 p-6 shadow-sm hover:shadow-md transition-all group">
              <div className="flex justify-between items-start mb-6">
                 <div className="w-12 h-12 bg-sage-50 text-forest-700 rounded-2xl flex items-center justify-center group-hover:bg-forest-700 group-hover:text-white transition-colors">
                    <MapPin size={24} />
                 </div>
                 <span className="text-[11px] font-semibold bg-warm-100 text-warm-500 px-2 py-1 rounded-lg uppercase">{loc.type || 'Storage'}</span>
              </div>
              <h3 className="text-base font-semibold text-charcoal-900 mb-1">{loc.name}</h3>
              <p className="text-[11px] text-warm-400 font-bold uppercase tracking-wide mb-6">Code: {loc.code}</p>

              <div className="space-y-3 mb-6">
                 <div className="flex items-center gap-3 text-xs text-warm-600 font-medium">
                    <Building2 size={14} className="text-warm-400" />
                    <span>{loc.building || 'Main Campus'}</span>
                 </div>
                 <div className="flex items-center gap-3 text-xs text-warm-600 font-medium">
                    <User size={14} className="text-warm-400" />
                    <span>In-charge: Senior Storekeeper</span>
                 </div>
              </div>

              <div className="pt-4 border-t border-ivory-50 flex items-center justify-between">
                 <div className="flex items-center gap-2 text-forest-700 font-bold text-xs">
                    <Layers size={14} />
                    <span>Manage Stock</span>
                 </div>
                 <Link href={`/inventory/locations/${loc.id}`} className="p-2 text-warm-400 hover:text-forest-700 transition-colors">
                    <ArrowRight size={18} />
                 </Link>
              </div>
           </div>
         ))}
      </div>
    </div>
  );
}
