'use client';

import React, { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api/client';
import {
  CreditCard,
  TrendingUp,
  ArrowUpRight,
  DollarSign,
  Download,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  XCircle,
  Loader2
} from 'lucide-react';

export default function SuperAdminRevenue() {
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch('/super-admin/dashboard/metrics')
      .then(setMetrics)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="p-8 space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Platform Revenue</h1>
          <p className="text-gray-500 font-medium mt-1">Global SaaS billing and financial health.</p>
        </div>
        <button className="bg-white border border-gray-200 text-gray-700 px-6 py-3 rounded-2xl font-bold hover:bg-gray-50 transition-all flex items-center gap-2 shadow-sm">
          <Download size={20} /> Financial Export
        </button>
      </div>

      {/* Aggregates */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <StatCard title="Total Collected" value={loading ? '...' : `$${metrics?.revenue?.totalPaid || 0}`} change="+8.2%" icon={<TrendingUp className="text-blue-600"/>} />
        <StatCard title="MRR (Projected)" value="$12,450" change="+12%" icon={<DollarSign className="text-green-600"/>} />
        <StatCard title="Active Subscriptions" value={loading ? '...' : metrics?.subscriptions?.active} change="+5" icon={<CreditCard className="text-purple-600"/>} />
      </div>

      <div className="bg-white border border-gray-200 rounded-3xl overflow-hidden shadow-sm">
        <div className="p-6 border-b border-gray-100 flex items-center gap-4 bg-gray-50/50">
           <div className="flex-1 bg-white border border-gray-200 px-4 py-2.5 rounded-2xl flex items-center shadow-sm">
              <Search size={18} className="text-gray-400 mr-3" />
              <input type="text" placeholder="Search invoices or payments..." className="bg-transparent border-none w-full focus:ring-0 text-sm font-bold" />
           </div>
           <button className="p-2.5 bg-white border border-gray-200 rounded-2xl text-gray-500 hover:bg-gray-50 shadow-sm"><Filter size={18}/></button>
        </div>

        <div className="py-24 text-center">
           <CreditCard className="mx-auto text-gray-200 mb-4" size={64} />
           <p className="text-gray-400 font-bold text-lg uppercase tracking-[0.1em]">Transaction auditing foundation active</p>
           <p className="text-gray-400 text-sm mt-1 font-medium">Real-time payment verification and reconciliation logs will appear here.</p>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, change, icon }: any) {
  return (
    <div className="bg-white border border-gray-200 rounded-3xl p-8 shadow-sm hover:shadow-md transition-shadow">
       <div className="flex items-center justify-between mb-6">
          <div className="p-3 bg-gray-50 rounded-2xl">{icon}</div>
          <span className="text-green-600 text-xs font-black flex items-center gap-1 bg-green-50 px-2 py-1 rounded-lg">
            <ArrowUpRight size={14}/> {change}
          </span>
       </div>
       <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{title}</p>
       <p className="text-3xl font-black text-gray-900 mt-1">{value}</p>
    </div>
  );
}
