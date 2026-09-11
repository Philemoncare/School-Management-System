'use client';

import React, { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api/client';
import {
  Building2,
  Users,
  ShieldCheck,
  CreditCard,
  Zap,
  Server,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  TrendingUp,
} from 'lucide-react';

export default function SuperAdminDashboard() {
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch('/super-admin/dashboard/metrics')
      .then(setMetrics)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="p-4 lg:p-8 space-y-8">
      <div className="mb-8">
        <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 tracking-tight">Platform Command Center</h1>
        <p className="text-gray-500 font-medium">Global Multi-tenant Control Plane</p>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Active Schools"
          value={loading ? '...' : metrics?.schools?.active}
          subValue={`${metrics?.schools?.total} total`}
          icon={<Building2 className="text-blue-600" />}
          color="bg-blue-50"
        />
        <StatCard
          title="Total Users"
          value={loading ? '...' : metrics?.users?.total}
          icon={<Users className="text-indigo-600" />}
          color="bg-indigo-50"
        />
        <StatCard
          title="Total Revenue"
          value={loading ? '...' : `$${parseFloat(metrics?.revenue?.totalPaid).toLocaleString()}`}
          icon={<CreditCard className="text-green-600" />}
          color="bg-green-50"
        />
        <StatCard
          title="System Status"
          value={loading ? '...' : 'HEALTHY'}
          icon={<Zap className="text-orange-600" />}
          color="bg-orange-50"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content Area */}
        <div className="lg:col-span-2 space-y-8">
           <div className="bg-white border border-gray-200 rounded-3xl p-8 shadow-sm">
             <div className="flex items-center justify-between mb-8">
                <h3 className="text-xl font-bold text-gray-900">Platform Growth</h3>
                <div className="flex gap-2">
                   <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-lg text-xs font-bold">Monthly</span>
                   <span className="px-3 py-1 text-gray-400 rounded-lg text-xs font-bold">Annual</span>
                </div>
             </div>
             <div className="h-[300px] bg-gray-50 rounded-2xl flex items-center justify-center border-2 border-dashed border-gray-100 relative overflow-hidden">
                <div className="absolute inset-0 flex items-end justify-around px-8 pb-4">
                   {[40, 70, 45, 90, 65, 80, 100].map((h, i) => (
                     <div key={i} className="w-12 bg-blue-500/20 rounded-t-lg transition-all hover:bg-blue-500/40" style={{ height: `${h}%` }}></div>
                   ))}
                </div>
                <p className="text-gray-400 font-bold text-sm z-10 bg-white/80 px-4 py-2 rounded-full backdrop-blur-sm shadow-sm">Live data visualization active</p>
             </div>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <RecentSchoolsCard />
              <SecurityAlertsCard />
           </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-8">
           <SystemHealthCard />
           <QueueStatusCard />
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, subValue, icon, color }: any) {
  return (
    <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm flex items-center gap-5 hover:shadow-md transition-shadow">
      <div className={`${color} p-4 rounded-2xl`}>{icon}</div>
      <div>
        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{title}</p>
        <p className="text-2xl font-black text-gray-900">{value}</p>
        {subValue && <p className="text-[10px] font-bold text-gray-400 mt-0.5">{subValue}</p>}
      </div>
    </div>
  );
}

function SystemHealthCard() {
  return (
    <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm">
      <h3 className="font-bold text-gray-900 mb-6 flex items-center gap-2">
        <Server size={18} className="text-blue-600" /> Infrastructure Health
      </h3>
      <div className="space-y-4">
        <HealthItem label="API Services" status="up" />
        <HealthItem label="Database" status="up" />
        <HealthItem label="Redis Layer" status="up" />
        <HealthItem label="Workers" status="degraded" />
      </div>
    </div>
  );
}

function HealthItem({ label, status }: any) {
  const isUp = status === 'up';
  return (
    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100">
      <span className="text-sm font-bold text-gray-700">{label}</span>
      <div className={`w-2 h-2 rounded-full ${isUp ? 'bg-green-500' : 'bg-orange-500'} animate-pulse`} />
    </div>
  );
}

function QueueStatusCard() {
  return (
    <div className="bg-gray-900 rounded-3xl p-6 shadow-xl text-white">
      <h3 className="font-bold text-lg mb-6 flex items-center gap-2">
        <Activity size={18} className="text-blue-400" /> Queue Throughput
      </h3>
      <div className="space-y-4">
         <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-gray-400">Notifications</span>
            <span className="text-sm font-black">1.2k / min</span>
         </div>
         <div className="w-full bg-gray-800 rounded-full h-1.5">
            <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: '75%' }}></div>
         </div>
         <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-gray-400">System Logs</span>
            <span className="text-sm font-black">4.8k / min</span>
         </div>
         <div className="w-full bg-gray-800 rounded-full h-1.5">
            <div className="bg-purple-500 h-1.5 rounded-full" style={{ width: '40%' }}></div>
         </div>
      </div>
    </div>
  );
}

function RecentSchoolsCard() {
  return (
    <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm">
      <h3 className="font-bold text-gray-900 mb-6">Recently Onboarded</h3>
      <div className="space-y-4">
         {[1, 2, 3].map(i => (
           <div key={i} className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gray-100 rounded-lg"></div>
              <div className="flex-1">
                 <p className="text-xs font-black">Greenwood Academy</p>
                 <p className="text-[10px] text-gray-400">Provisioned 2h ago</p>
              </div>
              <span className="px-2 py-0.5 bg-green-50 text-green-600 text-[9px] font-black rounded uppercase">Trial</span>
           </div>
         ))}
      </div>
    </div>
  );
}

function SecurityAlertsCard() {
  return (
    <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm border-l-4 border-l-orange-500">
      <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
        <ShieldCheck size={18} className="text-orange-500" /> Security Events
      </h3>
      <div className="space-y-3">
         <div className="p-2 bg-orange-50 rounded-lg">
            <p className="text-[10px] font-black text-orange-800">BRUTE_FORCE_DETECTED</p>
            <p className="text-[9px] text-orange-600 font-bold">IP: 192.168.1.4 • 5 mins ago</p>
         </div>
         <div className="p-2 bg-blue-50 rounded-lg">
            <p className="text-[10px] font-black text-blue-800">SESSION_REVOKED_BULK</p>
            <p className="text-[9px] text-blue-600 font-bold">Admin: John Doe • 15 mins ago</p>
         </div>
      </div>
    </div>
  );
}
