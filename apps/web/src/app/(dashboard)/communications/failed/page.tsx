'use client';

import React, { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api/client';
import {
  AlertCircle,
  RefreshCcw,
  Search,
  ArrowLeft,
  XCircle,
  Clock,
  Trash2,
  Mail,
  Smartphone
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

export default function FailedDeliveriesPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFailed();
  }, []);

  const fetchFailed = () => {
    setLoading(true);
    apiFetch('/communications/delivery-logs?status=FAILED')
      .then(res => setLogs(res.filter((l: any) => l.status === 'FAILED')))
      .finally(() => setLoading(false));
  };

  const handleRetry = async (id: string) => {
    toast.promise(apiFetch(`/communications/delivery-logs/${id}/retry`, { method: 'POST' }), {
      loading: 'Retrying delivery...',
      success: 'Retry initiated',
      error: 'Retry failed'
    });
  };

  return (
    <div className="p-8 space-y-10">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Link href="/communications" className="p-2 hover:bg-warm-100 rounded-2xl transition-colors text-warm-400">
            <ArrowLeft size={24} />
          </Link>
          <div>
            <h1 className="text-3xl font-semibold text-charcoal-900 tracking-tight">Failed <span className="text-danger-600">Deliveries</span></h1>
            <p className="text-warm-500 font-medium">Critical queue for messages that could not reach their destination.</p>
          </div>
        </div>
        <button onClick={fetchFailed} className="p-3 bg-card border border-warm-100 rounded-2xl text-warm-400 hover:text-forest-700 transition-all">
          <RefreshCcw size={20} />
        </button>
      </div>

      <div className="bg-card rounded-xl border border-danger-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-danger-50 bg-danger-50/10 flex justify-between items-center">
           <div className="flex items-center gap-2 text-danger-600">
              <AlertCircle size={20} />
              <span className="text-sm font-semibold uppercase tracking-wide">{logs.length} Messages require attention</span>
           </div>
        </div>

        <div className="divide-y divide-ivory-50">
           {loading ? (
             <div className="p-20 text-center text-warm-400 font-bold animate-pulse">Scanning failure logs...</div>
           ) : logs.length === 0 ? (
             <div className="p-20 text-center text-warm-400 font-bold italic">No active failures detected. Excellent!</div>
           ) : logs.map((log) => (
             <div key={log.id} className="p-8 flex items-center justify-between group hover:bg-danger-50/5 transition-all">
                <div className="flex items-start gap-6">
                   <div className="w-12 h-12 bg-danger-50 rounded-2xl flex items-center justify-center text-danger-500 shrink-0">
                      <XCircle size={24} />
                   </div>
                   <div>
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="text-base font-semibold text-charcoal-900">{log.notification?.title}</h3>
                        <span className="px-2 py-0.5 bg-warm-100 text-warm-500 text-[11px] font-semibold uppercase rounded">{log.channel}</span>
                      </div>
                      <p className="text-xs text-danger-600 font-bold mb-3 flex items-center gap-1">
                        <AlertCircle size={12} /> {log.errorMessage || 'Provider rejected message'}
                      </p>
                      <div className="flex items-center gap-4 text-[11px] font-bold text-warm-400 uppercase">
                         <span className="flex items-center gap-1"><Clock size={12} /> {new Date(log.createdAt).toLocaleString()}</span>
                         <span>Recipient: {log.notification?.userId}</span>
                         <span>Attempts: {log.attemptCount}</span>
                      </div>
                   </div>
                </div>
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                   <button
                     onClick={() => handleRetry(log.id)}
                     className="p-3 bg-card border border-warm-100 rounded-xl text-forest-700 hover:bg-forest-700 hover:text-white transition-all shadow-sm"
                   >
                     <RefreshCcw size={18} />
                   </button>
                   <button className="p-3 bg-card border border-warm-100 rounded-xl text-warm-400 hover:text-danger-600 transition-all shadow-sm">
                     <Trash2 size={18} />
                   </button>
                </div>
             </div>
           ))}
        </div>
      </div>
    </div>
  );
}
