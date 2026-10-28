'use client';

import React, { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api/client';
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle,
  ChevronRight,
  Clock,
  FileText,
  Loader2,
  Play,
} from 'lucide-react';
import Link from 'next/link';

export default function BillingHistoryPage() {
  const [billingRuns, setBillingRuns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    apiFetch('/finance/billing-runs')
      .then(setBillingRuns)
      .catch((err) => setError(err.message || 'Unable to load billing runs.'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="p-8 space-y-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-semibold text-charcoal-900 tracking-tight flex items-center gap-3">
            <FileText className="text-forest-700" /> Billing Center
          </h1>
          <p className="text-warm-500 font-bold mt-1 uppercase tracking-wide text-[11px]">Execute and monitor institutional billing cycles</p>
        </div>
        <Link href="/accountant/billing/new" className="bg-forest-700 text-white px-8 py-3 rounded-xl font-semibold text-[11px] uppercase tracking-wide hover:bg-forest-800 transition-all flex items-center gap-2">
          <Play size={16} /> Start New Billing Run
        </Link>
      </div>

      {error && (
        <div className="flex items-start gap-3 rounded-xl border border-danger-200 bg-danger-50 p-4 text-danger-700">
          <AlertCircle size={18} className="shrink-0 mt-0.5" />
          <p className="text-sm font-semibold">{error}</p>
        </div>
      )}

      <div className="bg-card border border-warm-200 rounded-xl shadow-sm overflow-hidden">
        <div className="p-8 border-b border-warm-100 bg-ivory-50/50">
          <h3 className="text-lg font-semibold text-charcoal-900">Billing Run History</h3>
        </div>

        <div className="relative min-h-[300px] overflow-x-auto">
          {loading && (
            <div className="absolute inset-0 bg-card/60 z-10 flex items-center justify-center">
              <Loader2 className="animate-spin text-forest-700" size={32} />
            </div>
          )}

          <table className="min-w-full divide-y divide-warm-200">
            <thead className="bg-card">
              <tr>
                <th className="px-8 py-5 text-left text-[11px] font-semibold text-warm-400 uppercase tracking-wide">Run Details</th>
                <th className="px-8 py-5 text-left text-[11px] font-semibold text-warm-400 uppercase tracking-wide">Scope</th>
                <th className="px-8 py-5 text-left text-[11px] font-semibold text-warm-400 uppercase tracking-wide">Progress</th>
                <th className="px-8 py-5 text-left text-[11px] font-semibold text-warm-400 uppercase tracking-wide">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-warm-100 bg-card">
              {billingRuns.map((run) => {
                const progress = run.studentsProcessed > 0
                  ? Math.min(100, Math.round((run.invoicesGenerated / run.studentsProcessed) * 100))
                  : 0;
                return (
                  <tr key={run.id} className="hover:bg-ivory-50 transition-colors">
                    <td className="px-8 py-6">
                      <p className="text-sm font-semibold text-charcoal-900 leading-tight">Batch #{run.id.slice(0, 8).toUpperCase()}</p>
                      <p className="text-[11px] font-bold text-warm-400 uppercase mt-0.5">{new Date(run.createdAt).toLocaleString()}</p>
                    </td>
                    <td className="px-8 py-6">
                      <span className="px-3 py-1 bg-warm-100 text-warm-600 rounded-lg text-xs font-semibold uppercase tracking-tight">
                        {run.academicYear?.name || 'Academic year'} / {run.term?.name || 'Full Year'}
                      </span>
                    </td>
                    <td className="px-8 py-6">
                      <div className="space-y-1.5">
                        <div className="flex justify-between gap-4 text-[11px] font-semibold uppercase tracking-wide text-warm-400">
                          <span>{run.invoicesGenerated} / {run.studentsProcessed}</span>
                          <span>{progress}%</span>
                        </div>
                        <div className="w-32 bg-warm-100 h-1.5 rounded-full overflow-hidden">
                          <div className="bg-forest-700 h-full" style={{ width: `${progress}%` }} />
                        </div>
                        {run.failures > 0 && <p className="text-[11px] font-semibold text-danger-600">{run.failures} failures</p>}
                      </div>
                    </td>
                    <td className="px-8 py-6"><StatusBadge status={run.status} /></td>
                  </tr>
                );
              })}
              {billingRuns.length === 0 && !loading && (
                <tr>
                  <td colSpan={4} className="px-8 py-20 text-center">
                    <FileText className="mx-auto text-warm-200 mb-4" size={64} />
                    <p className="text-warm-400 font-bold text-lg uppercase tracking-wide">No billing runs recorded</p>
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

function StatusBadge({ status }: { status: string }) {
  const configs: Record<string, { color: string; icon: any }> = {
    COMPLETED: { color: 'bg-success-100 text-success-700', icon: CheckCircle },
    PROCESSING: { color: 'bg-sage-100 text-forest-800', icon: Loader2 },
    FAILED: { color: 'bg-danger-100 text-danger-700', icon: AlertTriangle },
    PENDING: { color: 'bg-warm-100 text-warm-600', icon: Clock },
  };
  const config = configs[status] || configs.PENDING;
  const Icon = config.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold uppercase tracking-tight ${config.color}`}>
      <Icon size={12} className={status === 'PROCESSING' ? 'animate-spin' : ''} /> {status}
    </span>
  );
}
