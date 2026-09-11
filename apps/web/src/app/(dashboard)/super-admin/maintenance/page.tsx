'use client';

import React, { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api/client';
import {
  Plus,
  Calendar,
  Clock,
  Settings,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  MoreVertical,
  Wrench
} from 'lucide-react';

export default function SuperAdminMaintenance() {
  const [windows, setWindows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMaintenance();
  }, []);

  async function loadMaintenance() {
    setLoading(true);
    try {
      const data = await apiFetch('/super-admin/maintenance');
      setWindows(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-10">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight flex items-center gap-3">
             <Wrench className="text-blue-600" /> Platform Maintenance
          </h1>
          <p className="text-gray-500 font-medium mt-1">Schedule service windows and broadcast downtime alerts.</p>
        </div>
        <button className="bg-blue-600 text-white px-6 py-3 rounded-2xl font-bold hover:bg-blue-700 shadow-xl shadow-blue-200 transition-all flex items-center gap-2">
          <Plus size={20} /> Schedule Window
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {loading ? (
          <div className="py-20 text-center text-gray-400 font-bold animate-pulse">Syncing maintenance schedules...</div>
        ) : windows.length === 0 ? (
          <div className="bg-white border-2 border-dashed border-gray-100 rounded-3xl p-20 text-center">
             <Calendar className="mx-auto text-gray-200 mb-4" size={64} />
             <p className="text-gray-400 font-bold text-lg uppercase tracking-widest">No maintenance scheduled</p>
          </div>
        ) : windows.map((win) => (
          <div key={win.id} className="bg-white border border-gray-200 rounded-3xl p-8 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6 group hover:shadow-md transition-all">
             <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                   <StatusBadge status={win.status} />
                   <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded ${
                     win.priority === 'CRITICAL' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'
                   }`}>{win.priority} Priority</span>
                </div>
                <h3 className="text-xl font-black text-gray-900 mb-1">{win.title}</h3>
                <p className="text-gray-500 font-medium text-sm leading-relaxed max-w-2xl">{win.description}</p>
                <div className="mt-6 flex flex-wrap gap-4">
                   <InfoItem label="Start" value={new Date(win.startAt).toLocaleString()} icon={<Clock size={14}/>} />
                   <InfoItem label="End" value={new Date(win.endAt).toLocaleString()} icon={<Clock size={14}/>} />
                   <InfoItem label="Services" value={win.affectedServices.join(', ')} icon={<Settings size={14}/>} />
                </div>
             </div>
             <div className="flex items-center gap-2 border-t md:border-t-0 pt-6 md:pt-0 w-full md:w-auto">
                <button className="flex-1 md:flex-none px-6 py-2.5 bg-gray-50 text-gray-700 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-gray-100 transition-colors">Edit</button>
                <button className="p-2.5 text-gray-400 hover:text-gray-900 transition-colors"><MoreVertical size={20}/></button>
             </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function StatusBadge({ status }: any) {
  const configs: any = {
    SCHEDULED: { color: 'bg-blue-100 text-blue-700', icon: Calendar },
    ACTIVE: { color: 'bg-orange-100 text-orange-700', icon: AlertTriangle },
    COMPLETED: { color: 'bg-green-100 text-green-700', icon: CheckCircle2 },
    CANCELLED: { color: 'bg-gray-100 text-gray-700', icon: XCircle },
  };
  const config = configs[status] || configs.SCHEDULED;
  const Icon = config.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter ${config.color}`}>
       <Icon size={12} /> {status}
    </span>
  );
}

function InfoItem({ label, value, icon }: any) {
  return (
    <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-400">
       <div className="opacity-50">{icon}</div>
       <span>{label}: <span className="text-gray-900">{value}</span></span>
    </div>
  );
}
