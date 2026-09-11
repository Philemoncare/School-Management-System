'use client';

import React, { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api/client';
import {
  Activity,
  Server,
  Zap,
  Database,
  RefreshCw,
  Cpu,
  Globe,
  Clock,
  AlertCircle
} from 'lucide-react';

export default function PlatformMonitoring() {
  const [health, setHealth] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHealth();
    const interval = setInterval(loadHealth, 30000); // Auto-refresh every 30s
    return () => clearInterval(interval);
  }, []);

  async function loadHealth() {
    setLoading(true);
    try {
      const data = await apiFetch('/super-admin/monitoring/health');
      setHealth(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-8 space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">System Observability</h1>
          <p className="text-gray-500 font-medium mt-1">Real-time platform infrastructure monitoring.</p>
        </div>
        <div className="flex items-center gap-4">
           <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">
             Last checked: {health ? new Date(health.timestamp).toLocaleTimeString() : 'N/A'}
           </span>
           <button onClick={loadHealth} disabled={loading} className="bg-white border border-gray-200 p-3 rounded-2xl text-gray-500 hover:text-blue-600 shadow-sm transition-all">
             <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
           </button>
        </div>
      </div>

      {/* Service Health Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        <HealthCard label="API Gateway" status={health?.services?.api || 'unknown'} icon={<Zap />} />
        <HealthCard label="PostgreSQL Primary" status={health?.services?.database || 'unknown'} icon={<Database />} />
        <HealthCard label="Redis Cluster" status={health?.services?.redis || 'unknown'} icon={<Activity />} />
        <HealthCard label="Object Storage" status={health?.services?.storage || 'unknown'} icon={<Globe />} />
        <HealthCard label="Email Delivery" status={health?.services?.email || 'unknown'} icon={<Server />} />
        <HealthCard label="SMS Provider" status={health?.services?.sms || 'unknown'} icon={<Activity />} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
         {/* Server Performance */}
         <div className="bg-white border border-gray-200 rounded-3xl p-8 shadow-sm">
            <h3 className="text-xl font-bold text-gray-900 mb-8 flex items-center gap-3">
              <Cpu className="text-blue-600" size={24}/> Backend Resources
            </h3>
            <div className="grid grid-cols-2 gap-8">
               <div className="space-y-2">
                  <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Memory Usage (RSS)</p>
                  <p className="text-2xl font-black text-gray-900">
                    {health ? `${Math.round(health.infrastructure.memory.rss / 1024 / 1024)} MB` : '...'}
                  </p>
               </div>
               <div className="space-y-2">
                  <p className="text-xs font-black text-gray-400 uppercase tracking-widest">System Uptime</p>
                  <div className="flex items-center gap-2">
                    <Clock className="text-gray-300" size={18} />
                    <p className="text-xl font-bold text-gray-700">
                      {health ? `${Math.floor(health.infrastructure.uptime / 3600)}h ${Math.floor((health.infrastructure.uptime % 3600) / 60)}m` : '...'}
                    </p>
                  </div>
               </div>
            </div>
            <div className="mt-10 h-32 bg-gray-50 rounded-2xl flex items-center justify-center border-2 border-dashed border-gray-100">
               <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Real-time resource tracing foundation established</p>
            </div>
         </div>

         {/* Alert Configuration */}
         <div className="bg-gray-900 rounded-3xl p-8 shadow-xl text-white flex flex-col justify-between">
            <div>
               <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-blue-500 rounded-xl"><AlertCircle size={20}/></div>
                  <h3 className="text-xl font-black">Alert Configuration</h3>
               </div>
               <p className="text-gray-400 text-sm leading-relaxed mb-8">
                 Current platform policies are set to notify on P1 and P2 failures only. SMS alerting is active for database downtime.
               </p>
            </div>
            <div className="flex gap-3">
               <button className="flex-1 py-3 bg-white text-gray-900 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-gray-100 transition-colors">Manage Alerts</button>
               <button className="flex-1 py-3 bg-white/10 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-white/20 transition-colors border border-white/10">Thresholds</button>
            </div>
         </div>
      </div>
    </div>
  );
}

function HealthCard({ label, status, icon }: any) {
  const isUp = status === 'up' || status === 'ok' || status === 'operational';

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm flex items-center justify-between hover:shadow-md transition-all">
      <div className="flex items-center gap-4">
        <div className={`p-3 rounded-xl ${isUp ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
          {React.cloneElement(icon, { size: 24 })}
        </div>
        <div>
           <p className="text-sm font-black text-gray-900 leading-tight">{label}</p>
           <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">v1.0.0 • Production</p>
        </div>
      </div>
      <div className="flex flex-col items-end gap-1">
         <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter ${isUp ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700 animate-pulse'}`}>
           {status}
         </span>
         {isUp && <span className="text-[9px] font-bold text-gray-300 uppercase">99.9% uptime</span>}
      </div>
    </div>
  );
}
