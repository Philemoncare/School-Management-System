'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { apiFetch } from '@/lib/api/client';
import {
  GitPullRequest,
  ChevronLeft,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Loader2,
  RefreshCcw,
  History,
  Info,
  ArrowRight
} from 'lucide-react';
import Link from 'next/link';

export default function WorkflowDetailPage() {
  const { id } = useParams();
  const [workflow, setWorkflow] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch(`/operations/workflows/${id}`)
      .then(setWorkflow)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="p-20 text-center"><Loader2 className="animate-spin mx-auto text-blue-600" size={48} /></div>;

  return (
    <div className="p-8 space-y-10 max-w-5xl mx-auto">
      <div className="flex items-center gap-6">
        <Link href="/dashboard/operations/workflows" className="p-3 bg-white border border-gray-200 rounded-2xl text-gray-400 hover:text-blue-600 transition-all shadow-sm">
          <ChevronLeft size={20}/>
        </Link>
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight flex items-center gap-3">
            {workflow.workflowType.replace(/_/g, ' ')}
            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
              workflow.status === 'COMPLETED' ? 'bg-green-50 text-green-700' :
              workflow.status === 'FAILED' ? 'bg-red-50 text-red-700' : 'bg-blue-50 text-blue-700'
            }`}>{workflow.status}</span>
          </h1>
          <p className="text-gray-500 font-bold mt-1 uppercase tracking-widest text-[10px] flex items-center gap-2">
            ID: <span className="text-blue-600 font-mono">{workflow.id}</span> • Started {new Date(workflow.createdAt).toLocaleString()}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
           <section className="bg-white border border-gray-200 rounded-[2.5rem] p-8 shadow-sm">
              <h3 className="text-sm font-black uppercase tracking-widest text-gray-900 mb-8 flex items-center gap-2">
                 <History size={16} className="text-blue-600" /> Execution Timeline
              </h3>
              <div className="space-y-0">
                 {workflow.steps.map((step: any, index: number) => (
                    <div key={step.id} className="flex gap-6 relative pb-10 last:pb-0">
                       {index < workflow.steps.length - 1 && (
                          <div className={`absolute left-4 top-8 bottom-0 w-0.5 ${
                             step.status === 'COMPLETED' ? 'bg-green-500' : 'bg-gray-100'
                          }`} />
                       )}
                       <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 z-10 border-2 ${
                          step.status === 'COMPLETED' ? 'bg-green-500 border-green-500 text-white shadow-lg shadow-green-100' :
                          step.status === 'FAILED' ? 'bg-red-500 border-red-500 text-white shadow-lg shadow-red-100' :
                          step.status === 'IN_PROGRESS' ? 'bg-blue-500 border-blue-500 text-white shadow-lg shadow-blue-100 animate-pulse' :
                          'bg-white border-gray-100 text-gray-300'
                       }`}>
                          {step.status === 'COMPLETED' ? <CheckCircle size={16} /> :
                           step.status === 'FAILED' ? <XCircle size={16} /> :
                           step.status === 'IN_PROGRESS' ? <Clock size={16} /> : <div className="w-1.5 h-1.5 rounded-full bg-gray-200" />}
                       </div>
                       <div className="flex-1 pt-1">
                          <div className="flex justify-between items-start">
                             <div>
                                <p className={`text-sm font-black uppercase tracking-widest ${
                                   step.status === 'COMPLETED' ? 'text-gray-900' : 'text-gray-400'
                                }`}>{step.name.replace(/_/g, ' ')}</p>
                                {step.errorInfo && <p className="text-red-500 text-[10px] font-bold mt-2 bg-red-50 p-3 rounded-xl border border-red-100">{step.errorInfo}</p>}
                             </div>
                             {step.completedAt && <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{new Date(step.completedAt).toLocaleTimeString()}</p>}
                          </div>
                       </div>
                    </div>
                 ))}
              </div>
           </section>
        </div>

        <div className="space-y-8">
           <section className="bg-gray-900 rounded-[2.5rem] p-8 shadow-xl text-white">
              <h3 className="text-lg font-black mb-6 tracking-tight flex items-center gap-2">
                 <Info size={20} className="text-blue-400" /> Context Data
              </h3>
              <div className="space-y-4">
                 {Object.entries(workflow.context || {}).map(([key, value]: [string, any]) => (
                    <div key={key} className="p-4 bg-white/5 rounded-2xl border border-white/5">
                       <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{key}</p>
                       <p className="text-xs font-mono break-all">{typeof value === 'object' ? JSON.stringify(value) : String(value)}</p>
                    </div>
                 ))}
              </div>
           </section>

           {workflow.status === 'FAILED' && (
              <button className="w-full bg-blue-600 text-white p-5 rounded-[1.5rem] font-black text-xs uppercase tracking-widest hover:bg-blue-700 transition-all shadow-xl shadow-blue-100 flex items-center justify-center gap-3">
                 <RefreshCcw size={18} /> Retry Failed Steps
              </button>
           )}
        </div>
      </div>
    </div>
  );
}
