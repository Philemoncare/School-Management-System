'use client';

import React, { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api/client';
import { Bell, CheckCircle, Clock, Filter, Search, Loader2 } from 'lucide-react';

export default function TeacherNotificationsPage() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // In production, we'd have a specific notifications endpoint
    apiFetch('/notifications')
      .then(setNotifications)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-10">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-semibold text-charcoal-900 tracking-tight">Personal Alerts</h1>
          <p className="text-warm-500 font-bold mt-1 uppercase tracking-wide text-[11px]">Academic Reminders & System Notices</p>
        </div>
        <button className="text-xs font-semibold text-forest-700 uppercase tracking-wide hover:underline">Mark all as read</button>
      </div>

      <div className="bg-card border border-warm-200 rounded-xl shadow-sm overflow-hidden">
        <div className="p-6 border-b border-warm-100 flex items-center gap-4 bg-ivory-50/50">
           <div className="flex-1 bg-card border border-warm-200 px-5 py-2.5 rounded-2xl flex items-center shadow-sm">
              <Search size={18} className="text-warm-400 mr-3" />
              <input type="text" placeholder="Filter alerts..." className="bg-transparent border-none w-full focus:ring-0 text-sm font-bold" />
           </div>
        </div>

        <div className="relative">
           {loading && <div className="py-20 flex justify-center"><Loader2 className="animate-spin text-forest-700" size={32}/></div>}

           <div className="divide-y divide-warm-100">
              {notifications.map((n) => (
                <div key={n.id} className={`p-6 hover:bg-ivory-50 transition-all flex gap-6 ${!n.readAt ? 'bg-sage-50/20' : ''}`}>
                   <div className={`shrink-0 w-12 h-12 rounded-2xl flex items-center justify-center ${!n.readAt ? 'bg-sage-100 text-forest-700' : 'bg-warm-100 text-warm-400'}`}>
                      <Bell size={24} />
                   </div>
                   <div className="flex-1">
                      <div className="flex justify-between items-start">
                         <h3 className={`text-sm font-semibold ${!n.readAt ? 'text-charcoal-900' : 'text-warm-600'}`}>{n.title}</h3>
                         <span className="text-[11px] font-bold text-warm-400 uppercase">{new Date(n.createdAt).toLocaleDateString()}</span>
                      </div>
                      <p className="text-xs font-medium text-warm-500 mt-1 leading-relaxed">{n.content}</p>
                      <div className="mt-4 flex items-center gap-4">
                         <button className="text-[11px] font-semibold text-forest-700 uppercase tracking-wide">View Details</button>
                         {!n.readAt && <button className="text-[11px] font-semibold text-warm-400 uppercase tracking-wide hover:text-warm-600">Dismiss</button>}
                      </div>
                   </div>
                </div>
              ))}
              {notifications.length === 0 && !loading && (
                <div className="py-32 text-center text-warm-400 uppercase font-semibold text-[11px] tracking-wide">No active alerts found</div>
              )}
           </div>
        </div>
      </div>
    </div>
  );
}


