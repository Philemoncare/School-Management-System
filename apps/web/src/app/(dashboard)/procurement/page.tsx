'use client';

import React, { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api/client';
import {
  ShoppingCart,
  Plus,
  Search,
  ClipboardList,
  Truck,
  Users,
  TrendingUp,
  ArrowRight,
  Clock,
  CheckCircle,
  FileText
} from 'lucide-react';
import Link from 'next/link';

export default function ProcurementDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch('/procurement/dashboard')
      .then(setStats)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-8 text-center text-warm-400 font-bold animate-pulse">Syncing Procurement Control...</div>;

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-semibold text-charcoal-900 tracking-tight">Procurement <span className="text-forest-700">Hub</span></h1>
          <p className="text-warm-500 font-medium">Streamline school acquisitions and supplier relations.</p>
        </div>
        <div className="flex gap-3">
          <Link href="/procurement/requests/new" className="bg-forest-700 text-white px-5 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-forest-800 transition-colors shadow-lg shadow-sage-100">
            <Plus size={18} /> New Request
          </Link>
          <Link href="/procurement/orders/new" className="bg-charcoal-900 text-white px-5 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-charcoal-950 transition-colors shadow-lg">
            <ShoppingCart size={18} /> Create PO
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Pending Requests" value={stats.pendingRequests} icon={FileText} color="blue" />
        <StatCard label="Approved POs" value={stats.pendingOrders} icon={ShoppingCart} color="amber" />
        <StatCard label="Active Suppliers" value={stats.suppliersCount} icon={Users} color="emerald" />
        <StatCard label="Goods Receipts" value="0" icon={Truck} color="purple" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
           <section className="bg-card rounded-3xl border border-warm-100 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-warm-100 flex justify-between items-center bg-ivory-50/50">
                 <h2 className="text-lg font-semibold text-charcoal-900 flex items-center gap-2">
                   <Clock size={20} className="text-forest-700" /> Recent Purchase Orders
                 </h2>
                 <Link href="/procurement/orders" className="text-[11px] font-semibold text-forest-700 uppercase tracking-wide hover:underline">View All</Link>
              </div>
              <div className="divide-y divide-ivory-50">
                 {stats.recentOrders.map((order: any) => (
                   <div key={order.id} className="p-6 flex items-center justify-between hover:bg-ivory-50 transition-colors group">
                      <div className="flex items-center gap-5">
                         <div className="w-12 h-12 bg-warm-100 rounded-2xl flex items-center justify-center text-warm-400 group-hover:bg-sage-50 group-hover:text-forest-700 transition-colors">
                            <ShoppingCart size={24} />
                         </div>
                         <div>
                            <p className="text-sm font-semibold text-charcoal-900">{order.poNumber}</p>
                            <p className="text-xs text-warm-500 font-bold uppercase">{order.supplier.name}</p>
                         </div>
                      </div>
                      <div className="text-right">
                         <p className="text-sm font-semibold text-charcoal-900">${parseFloat(order.totalAmount).toFixed(2)}</p>
                         <span className={`px-2 py-0.5 rounded-lg text-[11px] font-semibold uppercase tracking-wider ${
                           order.status === 'APPROVED' ? 'bg-sage-50 text-forest-600' : 'bg-warning-50 text-warning-600'
                         }`}>{order.status}</span>
                      </div>
                   </div>
                 ))}
                 {stats.recentOrders.length === 0 && (
                   <div className="p-10 text-center text-warm-400 italic">No purchase orders found.</div>
                 )}
              </div>
           </section>

           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Link href="/procurement/suppliers" className="bg-card rounded-3xl border border-warm-100 p-8 shadow-sm hover:shadow-md transition-all group">
                 <div className="w-12 h-12 bg-sage-50 text-forest-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                    <Users size={24} />
                 </div>
                 <h4 className="text-lg font-semibold text-charcoal-900 mb-2">Supplier Registry</h4>
                 <p className="text-xs text-warm-500 font-medium leading-relaxed mb-4">Manage certified vendors and performance ratings.</p>
                 <span className="text-[11px] font-semibold text-forest-700 uppercase tracking-wide flex items-center gap-1">Open Registry <ArrowRight size={14} /></span>
              </Link>

              <Link href="/procurement/requests" className="bg-card rounded-3xl border border-warm-100 p-8 shadow-sm hover:shadow-md transition-all group">
                 <div className="w-12 h-12 bg-sage-50 text-forest-700 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                    <ClipboardList size={24} />
                 </div>
                 <h4 className="text-lg font-semibold text-charcoal-900 mb-2">Purchase Requests</h4>
                 <p className="text-xs text-warm-500 font-medium leading-relaxed mb-4">Monitor and approve internal supply requirements.</p>
                 <span className="text-[11px] font-semibold text-forest-700 uppercase tracking-wide flex items-center gap-1">View Queue <ArrowRight size={14} /></span>
              </Link>
           </div>
        </div>

        <div className="space-y-6">
           <section className="bg-charcoal-900 rounded-xl p-8 shadow-xs text-white relative overflow-hidden">
              <div className="relative z-10">
                <h3 className="text-lg font-semibold mb-4">Quotation Box</h3>
                <p className="text-warm-400 text-sm font-medium mb-6">Compare supplier pricing and select best value offers for orders.</p>
                <Link href="/procurement/quotations" className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-sage-400 hover:text-sage-300 transition-colors">
                   Compare Quotes <ArrowRight size={14} />
                </Link>
              </div>
              <TrendingUp size={120} className="absolute -bottom-10 -right-10 text-white/5 -rotate-12" />
           </section>

           <section className="bg-card rounded-3xl border border-warm-100 p-8 shadow-sm">
              <h3 className="text-lg font-semibold text-charcoal-900 mb-6 flex items-center gap-2">
                <Truck size={20} className="text-forest-700" /> Receiving
              </h3>
              <div className="space-y-4">
                 <p className="text-xs text-warm-500 font-medium leading-relaxed">
                   Confirm arrival of goods and automatically update inventory balances.
                 </p>
                 <Link href="/procurement/receipts/new" className="block w-full text-center py-3 bg-forest-700 text-white font-bold rounded-xl text-xs hover:bg-forest-800 transition-colors">
                    Process Goods Receipt
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
    emerald: 'bg-sage-50 text-forest-600 border-sage-100',
    purple: 'bg-terracotta-50 text-terracotta-600 border-terracotta-100',
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

