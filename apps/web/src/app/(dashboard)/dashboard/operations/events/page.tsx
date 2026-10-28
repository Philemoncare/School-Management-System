'use client';

import React, { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api/client';
import {
  Activity,
  Search,
  Loader2,
  ChevronRight,
  Database,
  Info,
  Calendar
} from 'lucide-react';
import Link from 'next/link';

export default function EventsPage() {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch('/operations/events')
      .then(setEvents)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-20 text-center"><Loader2 className="animate-spin mx-auto text-forest-700" size={48} /></div>;

  return (
    <div className="p-8 space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-semibold text-charcoal-900 tracking-tight">System Events</h1>
          <p className="text-warm-500 mt-1 font-medium text-sm">Low-level domain event audit and traceability logs.</p>
        </div>
      </div>

      <div className="bg-card border border-warm-200 rounded-xl shadow-sm overflow-hidden">
        <div className="p-6 border-b border-warm-100 flex items-center gap-4 bg-ivory-50/50">
           <div className="flex-1 bg-card border border-warm-200 px-5 py-3 rounded-2xl flex items-center shadow-sm">
              <Search size={18} className="text-warm-400 mr-3" />
              <input type="text" placeholder="Search events by type or resource ID..." className="bg-transparent border-none w-full focus:ring-0 text-sm font-bold" />
           </div>
        </div>

        <div className="relative min-h-[400px]">
           <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-warm-200">
                 <thead className="bg-ivory-50/50">
                    <tr>
                       <th className="px-8 py-4 text-left text-[11px] font-semibold text-warm-400 uppercase tracking-wide">Event Type</th>
                       <th className="px-8 py-4 text-left text-[11px] font-semibold text-warm-400 uppercase tracking-wide">Resource</th>
                       <th className="px-8 py-4 text-left text-[11px] font-semibold text-warm-400 uppercase tracking-wide">Timestamp</th>
                       <th className="px-8 py-4 text-right text-[11px] font-semibold text-warm-400 uppercase tracking-wide">Metadata</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-warm-100 bg-card">
                    {events.map((event) => (
                       <tr key={event.id} className="hover:bg-ivory-50/50 transition-all group">
                          <td className="px-8 py-5">
                             <div className="flex items-center gap-4">
                                <div className="p-2 bg-sage-50 text-forest-700 rounded-xl">
                                   <Activity size={16} />
                                </div>
                                <p className="text-xs font-semibold text-charcoal-900">{event.eventType.replace(/_/g, ' ')}</p>
                             </div>
                          </td>
                          <td className="px-8 py-5">
                             <p className="text-[11px] font-semibold text-warm-400 uppercase tracking-wide">{event.resourceType}</p>
                             <p className="text-[11px] font-mono font-bold text-charcoal-900 truncate max-w-[120px]">{event.resourceId}</p>
                          </td>
                          <td className="px-8 py-5 text-warm-500 text-xs font-medium">
                             {new Date(event.timestamp).toLocaleString()}
                          </td>
                          <td className="px-8 py-5 text-right">
                             <button className="p-2 hover:bg-card hover:shadow-md rounded-xl text-warm-400 hover:text-forest-700 transition-all">
                                <Info size={18} />
                             </button>
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
