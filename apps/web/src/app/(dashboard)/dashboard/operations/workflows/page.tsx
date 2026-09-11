'use client';

import React, { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api/client';
import {
  GitPullRequest,
  Filter,
  Search,
  ChevronRight,
  Loader2,
  Clock,
  AlertTriangle,
  CheckCircle,
  PlayCircle
} from 'lucide-react';
import Link from 'next/link';

export default function WorkflowsPage() {
  const [workflows, setWorkflows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ status: '', type: '' });

  useEffect(() => {
    loadWorkflows();
  }, [filter]);

  async function loadWorkflows() {
    setLoading(true);
    try {
      const query = new URLSearchParams();
      if (filter.status) query.append('status', filter.status);
      if (filter.type) query.append('type', filter.type);

      const data = await apiFetch(`/operations/workflows?${query.toString()}`);
      setWorkflows(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-8 space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Active Workflows</h1>
          <p className="text-gray-500 mt-1 font-medium text-sm">Tracking multi-module process execution and failures.</p>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-[2.5rem] shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex items-center gap-4 bg-gray-50/50">
           <div className="flex-1 bg-white border border-gray-200 px-5 py-3 rounded-2xl flex items-center shadow-sm">
              <Search size={18} className="text-gray-400 mr-3" />
              <input type="text" placeholder="Filter by correlation ID or resource..." className="bg-transparent border-none w-full focus:ring-0 text-sm font-bold" />
           </div>
           <select
             className="p-3 bg-white border border-gray-200 rounded-2xl text-[10px] font-black uppercase outline-none focus:ring-2 focus:ring-blue-600/10"
             value={filter.status}
             onChange={(e) => setFilter({ ...filter, status: e.target.value })}
           >
              <option value="">All Statuses</option>
              <option value="RUNNING">Running</option>
              <option value="COMPLETED">Completed</option>
              <option value="FAILED">Failed</option>
              <option value="REQUIRES_ACTION">Action Required</option>
           </select>
        </div>

        <div className="relative min-h-[400px]">
           {loading && (
             <div className="absolute inset-0 bg-white/60 z-10 flex items-center justify-center">
                <Loader2 className="animate-spin text-blue-600" size={32} />
             </div>
           )}

           <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                 <thead className="bg-gray-50/50">
                    <tr>
                       <th className="px-8 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Workflow Type</th>
                       <th className="px-8 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Progress</th>
                       <th className="px-8 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Started At</th>
                       <th className="px-8 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Status</th>
                       <th className="px-8 py-4 text-right text-[10px] font-black text-gray-400 uppercase tracking-widest">Details</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-gray-100 bg-white">
                    {workflows.map((wf) => (
                       <tr key={wf.id} className="hover:bg-gray-50/50 transition-all group">
                          <td className="px-8 py-5">
                             <div className="flex items-center gap-4">
                                <div className={`p-2 rounded-xl ${
                                   wf.status === 'COMPLETED' ? 'bg-green-100 text-green-600' :
                                   wf.status === 'FAILED' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'
                                }`}>
                                   <GitPullRequest size={16} />
                                </div>
                                <p className="text-sm font-black text-gray-900">{wf.workflowType.replace(/_/g, ' ')}</p>
                             </div>
                          </td>
                          <td className="px-8 py-5">
                             <div className="flex items-center gap-3">
                                <div className="w-24 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                   <div className="h-full bg-blue-600" style={{ width: `${(wf.steps.filter((s: any) => s.status === 'COMPLETED').length / wf.steps.length) * 100}%` }} />
                                </div>
                                <span className="text-[10px] font-bold text-gray-400">{wf.steps.filter((s: any) => s.status === 'COMPLETED').length} / {wf.steps.length}</span>
                             </div>
                          </td>
                          <td className="px-8 py-5 text-gray-500 text-xs font-medium">
                             {new Date(wf.createdAt).toLocaleString()}
                          </td>
                          <td className="px-8 py-5">
                             <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${
                                wf.status === 'COMPLETED' ? 'bg-green-50 text-green-700' :
                                wf.status === 'FAILED' ? 'bg-red-50 text-red-700' : 'bg-blue-50 text-blue-700'
                             }`}>{wf.status}</span>
                          </td>
                          <td className="px-8 py-5 text-right">
                             <Link href={`/dashboard/operations/workflows/${wf.id}`} className="p-2 hover:bg-white hover:shadow-md rounded-xl text-gray-400 hover:text-blue-600 transition-all">
                                <ChevronRight size={18} />
                             </Link>
                          </td>
                       </tr>
                    ))}
                 </tbody>
              </table>
           </div>
        </div>
      </div>
    </div>
  );
}
