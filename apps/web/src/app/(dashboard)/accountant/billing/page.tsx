'use client';

import React, { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api/client';
import {
  FileText,
  Search,
  Plus,
  Filter,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ChevronRight,
  Loader2,
  Play
} from 'lucide-react';
import Link from 'next/link';

export default function BillingHistoryPage() {
  const [billingRuns, setBillingRuns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // In production: apiFetch('/finance/billing-runs')
    setLoading(false);
  }, []);

  return (
    <div className="p-8 space-y-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight flex items-center gap-3">
             <FileText className="text-blue-600" /> Billing Center
          </h1>
          <p className="text-gray-500 font-bold mt-1 uppercase tracking-widest text-[10px]">Execute and monitor institutional billing cycles</p>
        </div>
        <Link href="/accountant/billing/new" className="bg-blue-600 text-white px-8 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-700 shadow-xl shadow-blue-100 transition-all flex items-center gap-2">
          <Play size={16} /> Start New Billing Run
        </Link>
      </div>

      <div className="bg-white border border-gray-200 rounded-[2.5rem] shadow-sm overflow-hidden">
        <div className="p-8 border-b border-gray-100 bg-gray-50/50">
           <h3 className="text-lg font-black text-gray-900">Billing Run History</h3>
        </div>

        <div className="relative min-h-[400px]">
           {loading && (
             <div className="absolute inset-0 bg-white/60 z-10 flex items-center justify-center">
                <Loader2 className="animate-spin text-blue-600" size={32} />
             </div>
           )}

           <table className="min-w-full divide-y divide-gray-200">
             <thead className="bg-white">
               <tr>
                 <th className="px-8 py-5 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Run Details</th>
                 <th className="px-8 py-5 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Scope</th>
                 <th className="px-8 py-5 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Progress</th>
                 <th className="px-8 py-5 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Status</th>
                 <th className="px-8 py-5 text-right text-[10px] font-black text-gray-400 uppercase tracking-widest">Actions</th>
               </tr>
             </thead>
             <tbody className="divide-y divide-gray-100 bg-white">
               {billingRuns.map((run) => (
                 <tr key={run.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-8 py-6">
                       <p className="text-sm font-black text-gray-900 leading-tight">Batch #{run.id.split('-')[0].toUpperCase()}</p>
                       <p className="text-[10px] font-bold text-gray-400 uppercase mt-0.5 tracking-tighter">{new Date(run.createdAt).toLocaleString()}</p>
                    </td>
                    <td className="px-8 py-6">
                       <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-lg text-xs font-black uppercase tracking-tight">
                          {run.academicYear.name} • {run.term?.name || 'Full Year'}
                       </span>
                    </td>
                    <td className="px-8 py-6">
                       <div className="space-y-1.5">
                          <div className="flex justify-between text-[9px] font-black uppercase tracking-widest text-gray-400">
                             <span>{run.invoicesGenerated} / {run.studentsProcessed}</span>
                             <span>{Math.round((run.invoicesGenerated / run.studentsProcessed) * 100)}%</span>
                          </div>
                          <div className="w-32 bg-gray-100 h-1.5 rounded-full overflow-hidden">
                             <div className="bg-blue-600 h-full" style={{ width: `${(run.invoicesGenerated / run.studentsProcessed) * 100}%` }}></div>
                          </div>
                       </div>
                    </td>
                    <td className="px-8 py-6">
                       <StatusBadge status={run.status} />
                    </td>
                    <td className="px-8 py-6 text-right">
                       <button className="p-2 text-gray-400 hover:text-blue-600 transition-colors"><ChevronRight size={20}/></button>
                    </td>
                 </tr>
               ))}
               {billingRuns.length === 0 && !loading && (
                 <tr>
                    <td colSpan={5} className="px-8 py-20 text-center">
                       <FileText className="mx-auto text-gray-200 mb-4" size={64} />
                       <p className="text-gray-400 font-bold text-lg uppercase tracking-widest">No billing runs recorded</p>
                    </td>
                 </tr>
               )}
             </tbody>
           </table>
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: any) {
  const configs: any = {
    COMPLETED: { color: 'bg-green-100 text-green-700', icon: CheckCircle2 },
    PROCESSING: { color: 'bg-blue-100 text-blue-700', icon: Loader2 },
    FAILED: { color: 'bg-red-100 text-red-700', icon: AlertTriangle },
    PENDING: { color: 'bg-gray-100 text-gray-600', icon: Clock },
  };
  const config = configs[status] || configs.PENDING;
  const Icon = config.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter ${config.color}`}>
       <Icon size={12} className={status === 'PROCESSING' ? 'animate-spin' : ''} /> {status}
    </span>
  );
}
