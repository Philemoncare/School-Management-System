'use client';

import React, { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api/client';
import {
  Package,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  History,
  Plus,
  Box,
  MapPin,
  ClipboardList
} from 'lucide-react';
import Link from 'next/link';

export default function InventoryDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch('/inventory/dashboard')
      .then(setStats)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-8 text-center">Loading Inventory Dashboard...</div>;

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-semibold text-charcoal-900 tracking-tight">Inventory <span className="text-forest-700">Control</span></h1>
          <p className="text-warm-500 font-medium">Real-time monitoring of school stock and consumables.</p>
        </div>
        <div className="flex gap-3">
          <Link href="/inventory/items/new" className="bg-forest-700 text-white px-5 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-forest-800 transition-colors shadow-lg shadow-sage-100">
            <Plus size={18} /> New Item
          </Link>
          <Link href="/inventory/adjust" className="bg-card border border-warm-200 text-warm-700 px-5 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-ivory-50 transition-colors">
            <ClipboardList size={18} /> Adjust Stock
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Items" value={stats.itemCount} icon={Box} color="blue" />
        <StatCard label="Low Stock" value={stats.lowStockItems} icon={AlertTriangle} color="amber" />
        <StatCard label="Out of Stock" value={stats.outOfStockItems} icon={AlertTriangle} color="red" />
        <StatCard label="Active Assets" value={stats.assetCount} icon={Package} color="emerald" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
           <section className="bg-card rounded-3xl border border-warm-100 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-warm-100 flex justify-between items-center bg-ivory-50/50">
                 <h2 className="text-lg font-semibold text-charcoal-900 flex items-center gap-2">
                   <History size={20} className="text-forest-700" /> Recent Movements
                 </h2>
                 <Link href="/inventory/movements" className="text-[11px] font-semibold text-forest-700 uppercase tracking-wide hover:underline">View All</Link>
              </div>
              <div className="divide-y divide-ivory-50">
                 {stats.recentMovements.map((move: any) => (
                   <div key={move.id} className="p-5 flex items-center justify-between hover:bg-ivory-50 transition-colors">
                      <div className="flex items-center gap-4">
                         <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                           move.quantity > 0 ? 'bg-sage-50 text-forest-600' : 'bg-danger-50 text-danger-600'
                         }`}>
                           <TrendingUp size={20} className={move.quantity < 0 ? 'rotate-180' : ''} />
                         </div>
                         <div>
                            <p className="text-sm font-bold text-charcoal-900">{move.item.name}</p>
                            <p className="text-[11px] text-warm-400 font-bold uppercase">{move.type} • {move.location.name}</p>
                         </div>
                      </div>
                      <div className="text-right">
                         <p className={`text-sm font-semibold ${move.quantity > 0 ? 'text-forest-600' : 'text-danger-600'}`}>
                           {move.quantity > 0 ? '+' : ''}{move.quantity}
                         </p>
                         <p className="text-[11px] text-warm-400 font-medium">{new Date(move.timestamp).toLocaleTimeString()}</p>
                      </div>
                   </div>
                 ))}
                 {stats.recentMovements.length === 0 && (
                   <div className="p-10 text-center text-warm-400 italic">No recent movements recorded.</div>
                 )}
              </div>
           </section>
        </div>

        <div className="space-y-6">
           <section className="bg-charcoal-900 rounded-xl p-8 shadow-xs text-white relative overflow-hidden">
              <div className="relative z-10">
                <h3 className="text-lg font-semibold mb-4">Stock Locations</h3>
                <p className="text-warm-400 text-sm font-medium mb-6">Manage distribution points and storage hubs across campus.</p>
                <Link href="/inventory/locations" className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-sage-400 hover:text-sage-300 transition-colors">
                   Manage Locations <ArrowRight size={14} />
                </Link>
              </div>
              <MapPin size={120} className="absolute -bottom-10 -right-10 text-white/5 -rotate-12" />
           </section>

           <section className="bg-card rounded-3xl border border-warm-100 p-8 shadow-sm">
              <h3 className="text-lg font-semibold text-charcoal-900 mb-6 flex items-center gap-2">
                <Package size={20} className="text-forest-700" /> Asset Management
              </h3>
              <div className="space-y-4">
                 <div className="flex justify-between items-center py-3 border-b border-ivory-50">
                    <span className="text-sm text-warm-500 font-medium">Assigned Assets</span>
                    <span className="text-sm font-semibold text-charcoal-900">{stats.assetsAssigned}</span>
                 </div>
                 <div className="flex justify-between items-center py-3 border-b border-ivory-50">
                    <span className="text-sm text-warm-500 font-medium">In Maintenance</span>
                    <span className="text-sm font-semibold text-warning-600">0</span>
                 </div>
                 <Link href="/assets" className="block w-full text-center py-3 bg-ivory-50 text-warm-600 font-bold rounded-xl text-xs hover:bg-warm-100 transition-colors">
                    Go to Asset Register
                 </Link>
              </div>
           </section>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon: Icon, color }: any) {
  const colors: any = {
    blue: 'bg-sage-50 text-forest-700 border-sage-100',
    amber: 'bg-warning-50 text-warning-600 border-warning-100',
    red: 'bg-danger-50 text-danger-600 border-danger-100',
    emerald: 'bg-sage-50 text-forest-600 border-sage-100',
  };
  return (
    <div className={`p-6 rounded-3xl border shadow-sm transition-all hover:shadow-md ${colors[color]}`}>
       <div className="flex justify-between items-start mb-4">
          <div className="bg-card p-2.5 rounded-xl shadow-sm border border-inherit">
             <Icon size={22} />
          </div>
       </div>
       <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide opacity-70 mb-1">{label}</p>
          <h3 className="text-3xl font-semibold text-charcoal-900">{value}</h3>
       </div>
    </div>
  );
}
