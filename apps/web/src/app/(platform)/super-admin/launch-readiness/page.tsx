'use client';

import React, { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api/client';
import {
  AlertTriangle,
  CheckCircle,
  Database,
  Loader2,
  RefreshCw,
  Rocket,
  ShieldCheck,
  XCircle,
} from 'lucide-react';

export default function LaunchReadinessPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadReadiness();
  }, []);

  async function loadReadiness() {
    setLoading(true);
    setError('');
    try {
      setData(await apiFetch('/super-admin/launch-readiness'));
    } catch (err: any) {
      setError(err.message || 'Unable to load launch readiness');
    } finally {
      setLoading(false);
    }
  }

  if (loading && !data) {
    return <div className="py-20 text-center"><Loader2 className="mx-auto animate-spin text-forest-700" size={42} /></div>;
  }

  const statusStyles: any = {
    PASS: 'border-success-200 bg-success-50 text-success-700',
    WARNING: 'border-warning-200 bg-warning-50 text-warning-700',
    FAIL: 'border-danger-200 bg-danger-50 text-danger-700',
  };

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-3 text-2xl sm:text-3xl font-semibold tracking-tight text-charcoal-900">
            <Rocket className="text-terracotta-500" /> Launch Readiness
          </h1>
          <p className="mt-1 font-medium text-warm-500">Live production certification derived from database, security, queue, and integration checks.</p>
        </div>
        <button onClick={loadReadiness} disabled={loading} className="rounded-xl border border-warm-200 bg-card p-3 text-warm-500 shadow-sm transition hover:text-forest-700">
          <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {error && <div className="rounded-xl border border-danger-200 bg-danger-50 px-4 py-3 text-sm font-semibold text-danger-700">{error}</div>}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="rounded-2xl bg-charcoal-900 p-6 text-white shadow-sm">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-warm-400">Readiness Score</p>
          <p className="mt-3 text-6xl font-semibold">{data?.summary?.score}%</p>
          <p className={`mt-4 inline-flex rounded-full px-3 py-1 text-[10px] font-bold uppercase ${data?.summary?.status === 'READY' ? 'bg-success-500' : 'bg-terracotta-500'}`}>
            {data?.summary?.status?.replace(/_/g, ' ')}
          </p>
          <p className="mt-4 text-[11px] font-semibold text-warm-400">Checked {data?.summary?.checkedAt ? new Date(data.summary.checkedAt).toLocaleString() : 'just now'}</p>
        </div>
        <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-3">
          {data?.categories?.map((category: any) => (
            <div key={category.name} className="flex items-center justify-between gap-3 rounded-2xl border border-warm-200 bg-card p-4 shadow-sm">
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-wide text-warm-400">{category.name}</p>
                <p className="mt-1 text-xs font-semibold text-warm-600 leading-relaxed">{category.details}</p>
              </div>
              <span className={`shrink-0 rounded-full border px-2 py-1 text-[10px] font-bold ${statusStyles[category.status] || 'border-warm-200 bg-warm-50 text-warm-600'}`}>
                {category.status}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-warm-200 bg-card shadow-sm">
        <div className="border-b border-warm-100 p-5">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-charcoal-900"><Database size={19} className="text-forest-700" /> Database Integrity Audit</h2>
        </div>
        {data?.integrity?.issues?.length ? (
          <div className="divide-y divide-warm-100">
            {data.integrity.issues.map((issue: any) => (
              <div key={issue.type} className="flex items-center justify-between p-5">
                <div className="flex items-center gap-3">
                  <div className="rounded-xl bg-danger-50 p-2.5 text-danger-600"><AlertTriangle size={18} /></div>
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-tight text-charcoal-900">{issue.type.replace(/_/g, ' ')}</p>
                    <p className="text-xs font-medium text-warm-500">Anomalous records may require manual cleanup.</p>
                  </div>
                </div>
                <span className="rounded-lg bg-danger-100 px-3 py-1 text-[11px] font-bold text-danger-700">{issue.count}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-12 text-center">
            <ShieldCheck size={42} className="mx-auto mb-3 text-success-300" />
            <p className="text-xs font-bold uppercase tracking-wide text-warm-400">No data integrity violations detected.</p>
          </div>
        )}
      </div>

      {data?.blockers?.length > 0 ? (
        <div className="rounded-2xl border border-terracotta-200 bg-terracotta-50 p-6">
          <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-terracotta-900"><AlertTriangle size={19} /> Production Warnings & Blockers</h3>
          <div className="space-y-2">
            {data.blockers.map((blocker: any, index: number) => (
              <div key={`${blocker.category}-${index}`} className="flex items-start gap-2 text-sm font-semibold text-terracotta-800">
                <XCircle size={15} className="mt-0.5 shrink-0" />
                <span><span className="uppercase">{blocker.category}:</span> {blocker.message}</span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-success-200 bg-success-50 p-5 text-sm font-semibold text-success-800 flex items-center gap-2">
          <CheckCircle size={18} /> All readiness checks passed. The platform is ready for launch.
        </div>
      )}
    </div>
  );
}
