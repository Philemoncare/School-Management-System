'use client';

import React, { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api/client';
import {
  History,
  Search,
  Filter,
  Clock,
  User,
  ShieldCheck,
  SearchCode,
  ArrowLeft,
  ChevronLeft
} from 'lucide-react';
import Link from 'next/link';

export default function SchoolActivityPage() {
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch('/schools/dashboard/activity')
      .then(setActivities)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="p-8">
      <div className="flex items-center gap-4 mb-8">
        <Link href="/dashboard" className="p-2.5 bg-white border border-gray-200 rounded-2xl hover:bg-gray-50 transition-colors shadow-sm text-gray-500">
           <ChevronLeft size={20} />
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">School Activity Audit</h1>
          <p className="text-gray-500 font-medium mt-1">Real-time log of administrative and operational events.</p>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-3xl shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex items-center gap-4 bg-gray-50/50">
           <div className="flex-1 bg-white border border-gray-200 px-4 py-2.5 rounded-2xl flex items-center shadow-sm">
              <Search size={18} className="text-gray-400 mr-3" />
              <input type="text" placeholder="Search by user or action..." className="bg-transparent border-none w-full focus:ring-0 text-sm font-bold" />
           </div>
           <button className="p-2.5 bg-white border border-gray-200 rounded-2xl text-gray-500 hover:bg-gray-50 shadow-sm"><Filter size={18}/></button>
        </div>

        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-8 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Timestamp</th>
              <th className="px-8 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Actor</th>
              <th className="px-8 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Module</th>
              <th className="px-8 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Action</th>
              <th className="px-8 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Target ID</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white">
            {loading ? (
              <tr><td colSpan={5} className="px-8 py-20 text-center text-gray-400 animate-pulse font-bold">Retrieving audit history...</td></tr>
            ) : activities.length === 0 ? (
              <tr><td colSpan={5} className="px-8 py-20 text-center text-gray-400 font-bold">No activity recorded yet.</td></tr>
            ) : activities.map((log) => (
              <tr key={log.id} className="hover:bg-blue-50/30 transition-colors">
                <td className="px-8 py-5">
                   <div className="flex items-center gap-2 text-gray-600">
                      <Clock size={14} className="opacity-50" />
                      <span className="text-[11px] font-bold">{new Date(log.createdAt).toLocaleString()}</span>
                   </div>
                </td>
                <td className="px-8 py-5">
                   <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center text-[10px] font-black">
                        {log.user?.firstName[0]}
                      </div>
                      <div>
                        <p className="text-xs font-black text-gray-900 leading-tight">{log.user?.firstName} {log.user?.lastName}</p>
                        <p className="text-[10px] text-gray-400 font-bold uppercase">{log.user?.email}</p>
                      </div>
                   </div>
                </td>
                <td className="px-8 py-5">
                   <span className="text-[10px] font-black px-2 py-0.5 bg-gray-100 text-gray-500 rounded uppercase tracking-tighter">{log.module}</span>
                </td>
                <td className="px-8 py-5">
                   <span className="text-xs font-black text-gray-800">{log.action.replace(/_/g, ' ')}</span>
                </td>
                <td className="px-8 py-5">
                   <code className="text-[10px] text-gray-400 font-mono truncate block max-w-[100px]">{log.resourceId || '-'}</code>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
