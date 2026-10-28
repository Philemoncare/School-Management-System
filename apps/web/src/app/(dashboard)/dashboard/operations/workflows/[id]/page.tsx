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

  if (loading) return <div className="p-20 text-center"><Loader2 className="animate-spin mx-auto text-forest-700" size={48} /></div>;

  return (
    <div className="p-8 space-y-10 max-w-5xl mx-auto">
      <div className="flex items-center gap-6">
        <Link href="/dashboard/operations/workflows" className="p-3 bg-card border border-warm-200 rounded-2xl text-warm-400 hover:text-forest-700 transition-all shadow-sm">
          <ChevronLeft size={20}/>
        </Link>
        <div>
          <h1 className="text-3xl font-semibold text-charcoal-900 tracking-tight flex items-center gap-3">
            {workflow.workflowType.replace(/_/g, ' ')}
            <span className={`px-3 py-1 rounded-full text-[11px] font-semibold uppercase tracking-wide ${
              workflow.status === 'COMPLETED' ? 'bg-success-50 text-success-700' :
              workflow.status === 'FAILED' ? 'bg-danger-50 text-danger-700' : 'bg-sage-50 text-forest-800'
            }`}>{workflow.status}</span>
          </h1>
          <p className="text-warm-500 font-bold mt-1 uppercase tracking-wide text-[11px] flex items-center gap-2">
            ID: <span className="text-forest-700 font-mono">{workflow.id}</span> • Started {new Date(workflow.createdAt).toLocaleString()}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
           <section className="bg-card border border-warm-200 rounded-xl p-8 shadow-sm">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-charcoal-900 mb-8 flex items-center gap-2">
                 <History size={16} className="text-forest-700" /> Execution Timeline
              </h3>
              <div className="space-y-0">
                 {workflow.steps.map((step: any, index: number) => (
                    <div key={step.id} className="flex gap-6 relative pb-10 last:pb-0">
                       {index < workflow.steps.length - 1 && (
                          <div className={`absolute left-4 top-8 bottom-0 w-0.5 ${
                             step.status === 'COMPLETED' ? 'bg-success-500' : 'bg-warm-100'
                          }`} />
                       )}
                       <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 z-10 border-2 ${
                          step.status === 'COMPLETED' ? 'bg-success-500 border-success-500 text-white shadow-lg shadow-success-100' :
                          step.status === 'FAILED' ? 'bg-danger-500 border-danger-500 text-white shadow-lg shadow-danger-100' :
                          step.status === 'IN_PROGRESS' ? 'bg-forest-500 border-forest-500 text-white shadow-lg shadow-sage-100 animate-pulse' :
                          'bg-card border-warm-100 text-warm-300'
                       }`}>
                          {step.status === 'COMPLETED' ? <CheckCircle size={16} /> :
                           step.status === 'FAILED' ? <XCircle size={16} /> :
                           step.status === 'IN_PROGRESS' ? <Clock size={16} /> : <div className="w-1.5 h-1.5 rounded-full bg-warm-200" />}
                       </div>
                       <div className="flex-1 pt-1">
                          <div className="flex justify-between items-start">
                             <div>
                                <p className={`text-sm font-semibold uppercase tracking-wide ${
                                   step.status === 'COMPLETED' ? 'text-charcoal-900' : 'text-warm-400'
                                }`}>{step.name.replace(/_/g, ' ')}</p>
                                {step.errorInfo && <p className="text-danger-500 text-[11px] font-bold mt-2 bg-danger-50 p-3 rounded-xl border border-danger-100">{step.errorInfo}</p>}
                             </div>
                             {step.completedAt && <p className="text-[11px] font-semibold text-warm-400 uppercase tracking-wide">{new Date(step.completedAt).toLocaleTimeString()}</p>}
                          </div>
                       </div>
                    </div>
                 ))}
              </div>
           </section>
        </div>

        <div className="space-y-8">
           <section className="bg-charcoal-900 rounded-xl p-8 shadow-xs text-white">
              <h3 className="text-lg font-semibold mb-6 tracking-tight flex items-center gap-2">
                 <Info size={20} className="text-sage-400" /> Context Data
              </h3>
              <div className="space-y-4">
                 {Object.entries(workflow.context || {}).map(([key, value]: [string, any]) => (
                    <div key={key} className="p-4 bg-card/5 rounded-2xl border border-white/5">
                       <p className="text-[11px] font-semibold text-warm-400 uppercase tracking-wide mb-1">{key}</p>
                       <p className="text-xs font-mono break-all">{typeof value === 'object' ? JSON.stringify(value) : String(value)}</p>
                    </div>
                 ))}
              </div>
           </section>

           {workflow.status === 'FAILED' && (
              <button className="w-full bg-forest-700 text-white p-5 rounded-xl font-semibold text-xs uppercase tracking-wide hover:bg-forest-800 transition-all shadow-xs shadow-sage-100 flex items-center justify-center gap-3">
                 <RefreshCcw size={18} /> Retry Failed Steps
              </button>
           )}
        </div>
      </div>
    </div>
  );
}
