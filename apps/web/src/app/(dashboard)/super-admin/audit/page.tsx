'use client';

import React, { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api/client';
import {
  FileText,
  Search,
  Filter,
  Download,
  Clock,
  User,
  ShieldCheck,
  Loader2
} from 'lucide-react';

export default function SuperAdminAudit() {
  const [data, setData] = useState<any>({ items: [], total: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLogs();
  }, []);

  async function loadLogs() {
    setLoading(true);
    try {
      const result = await apiFetch('/super-admin/audit?take=50');
      setData(result);
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
             <ShieldCheck className="text-blue-600" /> Platform Audit Trail
          </h1>
          <p className="text-gray-500 font-medium mt-1">Immutable record of all administrative and security events.</p>
        </div>
        <button className="bg-white border border-gray-200 text-gray-700 px-6 py-3 rounded-2xl font-bold hover:bg-gray-50 transition-all flex items-center gap-2 shadow-sm">
          <Download size={20} /> Export History
        </button>
      </div>

      <div className="bg-white border border-gray-200 rounded-3xl shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex items-center gap-4 bg-gray-50/50">
           <div className="flex-1 bg-white border border-gray-200 px-4 py-2.5 rounded-2xl flex items-center shadow-sm">
              <Search size={18} className="text-gray-400 mr-3" />
              <input type="text" placeholder="Search by actor, module or action..." className="bg-transparent border-none w-full focus:ring-0 text-sm font-bold" />
           </div>
           <button className="p-2.5 bg-white border border-gray-200 rounded-2xl text-gray-500 hover:bg-gray-50 shadow-sm"><Filter size={18}/></button>
        </div>

        <div className="relative">
           {loading && (
             <div className="absolute inset-0 bg-white/60 backdrop-blur-sm z-10 flex items-center justify-center">
                <Loader2 className="animate-spin text-blue-600" size={32} />
             </div>
           )}

           <table className="min-w-full divide-y divide-gray-200">
             <thead className="bg-gray-50">
                <tr>
                   <th className="px-8 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Timestamp</th>
                   <th className="px-8 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Actor</th>
                   <th className="px-8 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Context</th>
                   <th className="px-8 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Action</th>
                   <th className="px-8 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Target</th>
                </tr>
             </thead>
             <tbody className="divide-y divide-gray-100 bg-white">
                {data.items.map((log: any) => (
                  <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                     <td className="px-8 py-4">
                        <div className="flex items-center gap-2 text-gray-500">
                           <Clock size={14} />
                           <span className="text-[11px] font-bold">{new Date(log.createdAt).toLocaleString()}</span>
                        </div>
                     </td>
                     <td className="px-8 py-4">
                        <div className="flex items-center gap-2">
                           <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-[10px] font-black text-blue-600">ID</div>
                           <span className="text-xs font-black text-gray-700 truncate max-w-[120px]">{log.userId || 'SYSTEM'}</span>
                        </div>
                     </td>
                     <td className="px-8 py-4">
                        <span className="text-[10px] font-black px-2 py-0.5 bg-gray-100 text-gray-500 rounded uppercase tracking-tighter">{log.module}</span>
                     </td>
                     <td className="px-8 py-4">
                        <span className="text-xs font-black text-gray-900">{log.action}</span>
                     </td>
                     <td className="px-8 py-4">
                        <span className="text-[10px] font-mono text-gray-400 truncate max-w-[150px] block">{log.resourceId || '-'}</span>
                     </td>
                  </tr>
                ))}
             </tbody>
           </table>

           {data.items.length === 0 && !loading && (
             <div className="py-20 text-center">
                <FileText className="mx-auto text-gray-200 mb-4" size={64} />
                <p className="text-gray-400 font-bold text-lg uppercase tracking-widest">No audit logs found</p>
             </div>
           )}
        </div>
      </div>
    </div>
  );
}
