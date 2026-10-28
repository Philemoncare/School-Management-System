'use client';

import { Select } from '@/components/ui/input';
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
          <h1 className="text-3xl font-semibold text-charcoal-900 tracking-tight">Active Workflows</h1>
          <p className="text-warm-500 mt-1 font-medium text-sm">Tracking multi-module process execution and failures.</p>
        </div>
      </div>

      <div className="bg-card border border-warm-200 rounded-xl shadow-sm overflow-hidden">
        <div className="p-6 border-b border-warm-100 flex items-center gap-4 bg-ivory-50/50">
           <div className="flex-1 bg-card border border-warm-200 px-5 py-3 rounded-2xl flex items-center shadow-sm">
              <Search size={18} className="text-warm-400 mr-3" />
              <input type="text" placeholder="Filter by correlation ID or resource..." className="bg-transparent border-none w-full focus:ring-0 text-sm font-bold" />
           </div>
           <Select
             className="p-3 bg-card border border-warm-200 rounded-2xl text-[11px] font-semibold uppercase outline-none focus:ring-2 focus:ring-forest-700/10"
             value={filter.status}
             onChange={(e) => setFilter({ ...filter, status: e.target.value })}
           >
              <option value="">All Statuses</option>
              <option value="RUNNING">Running</option>
              <option value="COMPLETED">Completed</option>
              <option value="FAILED">Failed</option>
              <option value="REQUIRES_ACTION">Action Required</option>
           </Select>
        </div>

        <div className="relative min-h-[400px]">
           {loading && (
             <div className="absolute inset-0 bg-card/60 z-10 flex items-center justify-center">
                <Loader2 className="animate-spin text-forest-700" size={32} />
             </div>
           )}

           <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-warm-200">
                 <thead className="bg-ivory-50/50">
                    <tr>
                       <th className="px-8 py-4 text-left text-[11px] font-semibold text-warm-400 uppercase tracking-wide">Workflow Type</th>
                       <th className="px-8 py-4 text-left text-[11px] font-semibold text-warm-400 uppercase tracking-wide">Progress</th>
                       <th className="px-8 py-4 text-left text-[11px] font-semibold text-warm-400 uppercase tracking-wide">Started At</th>
                       <th className="px-8 py-4 text-left text-[11px] font-semibold text-warm-400 uppercase tracking-wide">Status</th>
                       <th className="px-8 py-4 text-right text-[11px] font-semibold text-warm-400 uppercase tracking-wide">Details</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-warm-100 bg-card">
                    {workflows.map((wf) => (
                       <tr key={wf.id} className="hover:bg-ivory-50/50 transition-all group">
                          <td className="px-8 py-5">
                             <div className="flex items-center gap-4">
                                <div className={`p-2 rounded-xl ${
                                   wf.status === 'COMPLETED' ? 'bg-success-100 text-success-600' :
                                   wf.status === 'FAILED' ? 'bg-danger-100 text-danger-600' : 'bg-sage-100 text-forest-700'
                                }`}>
                                   <GitPullRequest size={16} />
                                </div>
                                <p className="text-sm font-semibold text-charcoal-900">{wf.workflowType.replace(/_/g, ' ')}</p>
                             </div>
                          </td>
                          <td className="px-8 py-5">
                             <div className="flex items-center gap-3">
                                <div className="w-24 h-1.5 bg-warm-100 rounded-full overflow-hidden">
                                   <div className="h-full bg-forest-700" style={{ width: `${(wf.steps.filter((s: any) => s.status === 'COMPLETED').length / wf.steps.length) * 100}%` }} />
                                </div>
                                <span className="text-[11px] font-bold text-warm-400">{wf.steps.filter((s: any) => s.status === 'COMPLETED').length} / {wf.steps.length}</span>
                             </div>
                          </td>
                          <td className="px-8 py-5 text-warm-500 text-xs font-medium">
                             {new Date(wf.createdAt).toLocaleString()}
                          </td>
                          <td className="px-8 py-5">
                             <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold uppercase ${
                                wf.status === 'COMPLETED' ? 'bg-success-50 text-success-700' :
                                wf.status === 'FAILED' ? 'bg-danger-50 text-danger-700' : 'bg-sage-50 text-forest-800'
                             }`}>{wf.status}</span>
                          </td>
                          <td className="px-8 py-5 text-right">
                             <Link href={`/dashboard/operations/workflows/${wf.id}`} className="p-2 hover:bg-card hover:shadow-md rounded-xl text-warm-400 hover:text-forest-700 transition-all">
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
