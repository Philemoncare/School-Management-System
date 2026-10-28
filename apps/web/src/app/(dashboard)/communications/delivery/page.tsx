'use client';

import React, { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api/client';
import {
  History,
  Search,
  Filter,
  ArrowLeft,
  CheckCircle,
  XCircle,
  Clock,
  Mail,
  Smartphone,
  MessageSquare,
  Send
} from 'lucide-react';
import Link from 'next/link';

export default function DeliveryLogsPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch('/communications/delivery-logs')
      .then(setLogs)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="p-8 space-y-10">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Link href="/communications" className="p-2 hover:bg-warm-100 rounded-2xl transition-colors text-warm-400">
            <ArrowLeft size={24} />
          </Link>
          <div>
            <h1 className="text-3xl font-semibold text-charcoal-900 tracking-tight">Delivery <span className="text-forest-700">Logs</span></h1>
            <p className="text-warm-500 font-medium">Real-time trace of every message sent through the platform.</p>
          </div>
        </div>
      </div>

      <div className="bg-card rounded-xl border border-warm-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-warm-100 bg-ivory-50/50 flex justify-between items-center">
           <div className="flex gap-4">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Filter by recipient..."
                  className="pl-10 pr-4 py-2 bg-card border border-warm-200 rounded-xl text-sm font-bold focus:outline-none focus:border-forest-500"
                />
                <Search className="absolute left-3 top-2.5 text-warm-400" size={16} />
              </div>
              <button className="flex items-center gap-2 px-4 py-2 bg-card border border-warm-200 rounded-xl text-sm font-bold text-warm-600 hover:bg-ivory-50">
                <Filter size={16} /> Status
              </button>
           </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-ivory-50/30 text-[11px] font-semibold text-warm-400 uppercase tracking-wide border-b border-warm-100">
                <th className="px-8 py-4">Status</th>
                <th className="px-8 py-4">Channel</th>
                <th className="px-8 py-4">Message</th>
                <th className="px-8 py-4">Recipient</th>
                <th className="px-8 py-4">Time</th>
                <th className="px-8 py-4 text-right">Provider Ref</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ivory-50">
               {loading ? (
                 <tr><td colSpan={6} className="p-20 text-center text-warm-400 font-bold animate-pulse">Loading delivery data...</td></tr>
               ) : logs.length === 0 ? (
                 <tr><td colSpan={6} className="p-20 text-center text-warm-400 font-bold italic">No delivery records found.</td></tr>
               ) : logs.map((log) => (
                 <tr key={log.id} className="hover:bg-ivory-50/50 transition-colors">
                    <td className="px-8 py-5">
                       {log.status === 'DELIVERED' ? (
                         <span className="flex items-center gap-2 text-forest-600 font-semibold text-[11px] uppercase"><CheckCircle size={14} /> Delivered</span>
                       ) : log.status === 'FAILED' ? (
                         <span className="flex items-center gap-2 text-danger-600 font-semibold text-[11px] uppercase"><XCircle size={14} /> Failed</span>
                       ) : (
                         <span className="flex items-center gap-2 text-warning-600 font-semibold text-[11px] uppercase"><Clock size={14} /> Pending</span>
                       )}
                    </td>
                    <td className="px-8 py-5"><ChannelIcon channel={log.channel} /></td>
                    <td className="px-8 py-5">
                       <p className="text-sm font-semibold text-charcoal-900 line-clamp-1">{log.notification?.title}</p>
                    </td>
                    <td className="px-8 py-5 text-xs font-bold text-warm-500">{log.notification?.userId}</td>
                    <td className="px-8 py-5 text-xs font-bold text-warm-400">{new Date(log.createdAt).toLocaleTimeString()}</td>
                    <td className="px-8 py-5 text-right font-mono text-[11px] text-warm-400">{log.providerRef || 'N/A'}</td>
                 </tr>
               ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function ChannelIcon({ channel }: { channel: string }) {
  const icons: any = {
    IN_APP: MessageSquare,
    EMAIL: Mail,
    SMS: Smartphone,
    WEBSOCKET: Send,
  };
  const Icon = icons[channel] || History;
  return (
    <div className="flex items-center gap-2 text-xs font-bold text-warm-600">
      <Icon size={16} className="text-warm-400" />
      <span className="uppercase tracking-wide text-[11px]">{channel}</span>
    </div>
  );
}

