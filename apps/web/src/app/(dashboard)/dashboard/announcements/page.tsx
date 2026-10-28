'use client';

import React, { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api/client';
import {
  Bell,
  Plus,
  Search,
  Filter,
  Calendar,
  ChevronRight,
  MoreVertical,
  Megaphone
} from 'lucide-react';
import Link from 'next/link';

export default function AnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch('/announcements')
      .then(setAnnouncements)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-10">
        <div>
          <h1 className="text-3xl font-bold text-charcoal-900 tracking-tight flex items-center gap-3">
             <Megaphone className="text-forest-700" /> School Announcements
          </h1>
          <p className="text-warm-500 font-medium mt-1">Broadcast important news and updates to the school community.</p>
        </div>
        <button className="bg-forest-700 text-white px-6 py-3 rounded-2xl font-bold hover:bg-forest-800 shadow-xs shadow-sage-200 transition-all flex items-center gap-2">
          <Plus size={20} /> Create Announcement
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Feed */}
        <div className="lg:col-span-2 space-y-6">
           {loading ? (
             <div className="p-20 text-center text-warm-400 font-bold animate-pulse">Syncing platform broadcasts...</div>
           ) : announcements.length === 0 ? (
             <div className="bg-card border-2 border-dashed border-warm-100 rounded-3xl p-20 text-center">
                <Bell className="mx-auto text-warm-200 mb-4" size={64} />
                <p className="text-warm-400 font-bold text-lg">No announcements posted yet</p>
             </div>
           ) : announcements.map((ann) => (
             <div key={ann.id} className="bg-card border border-warm-200 rounded-3xl p-8 shadow-sm hover:shadow-md transition-all relative overflow-hidden group">
                <div className={`absolute top-0 left-0 w-1.5 h-full ${ann.priority === 'HIGH' ? 'bg-danger-500' : 'bg-forest-500'}`} />
                <div className="flex justify-between items-start mb-6">
                   <div className="flex items-center gap-3">
                      <span className={`px-3 py-1 rounded-full text-[11px] font-semibold uppercase tracking-wide ${
                        ann.priority === 'HIGH' ? 'bg-danger-50 text-danger-600' : 'bg-sage-50 text-forest-700'
                      }`}>
                        {ann.priority} Priority
                      </span>
                      <span className="text-[11px] font-semibold text-warm-400 uppercase tracking-wide">{ann.audienceType}</span>
                   </div>
                   <button className="p-1 text-warm-300 hover:text-charcoal-900"><MoreVertical size={18}/></button>
                </div>
                <h3 className="text-xl font-semibold text-charcoal-900 mb-4 group-hover:text-forest-700 transition-colors">{ann.title}</h3>
                <p className="text-warm-600 leading-relaxed font-medium line-clamp-3">{ann.content}</p>
                <div className="mt-8 pt-6 border-t border-ivory-50 flex justify-between items-center">
                   <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-warm-100 flex items-center justify-center text-xs font-semibold text-warm-500 uppercase">SA</div>
                      <div>
                         <p className="text-xs font-semibold text-charcoal-900 leading-tight">School Admin</p>
                         <p className="text-[11px] font-bold text-warm-400 uppercase">{new Date(ann.createdAt).toLocaleDateString()}</p>
                      </div>
                   </div>
                   <button className="text-xs font-semibold text-forest-700 uppercase tracking-wide flex items-center gap-1 hover:gap-2 transition-all">Read More <ChevronRight size={14}/></button>
                </div>
             </div>
           ))}
        </div>

        {/* Filters/Actions Sidebar */}
        <div className="space-y-8">
           <div className="bg-card border border-warm-200 rounded-3xl p-6 shadow-sm">
              <h3 className="font-bold text-charcoal-900 mb-6 flex items-center gap-2">
                <Filter size={18} className="text-forest-700" /> Target Audience
              </h3>
              <div className="space-y-2">
                 <AudienceFilter label="All Community" active />
                 <AudienceFilter label="Teachers Only" />
                 <AudienceFilter label="Students & Parents" />
                 <AudienceFilter label="Specific Classes" />
              </div>
           </div>

           <div className="bg-charcoal-900 rounded-3xl p-8 shadow-xs text-white overflow-hidden relative">
              <Calendar className="absolute -bottom-6 -right-6 text-white/5" size={120} />
              <div className="relative z-10">
                <h3 className="font-bold text-lg mb-6">Scheduled Posts</h3>
                <p className="text-warm-400 text-sm font-medium leading-relaxed mb-6">You have 2 announcements scheduled for next week.</p>
                <button className="w-full py-3 bg-card/10 text-white rounded-2xl font-semibold text-xs uppercase tracking-wide hover:bg-card/20 transition-colors border border-white/10">
                  Manage Queue
                </button>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}

function AudienceFilter({ label, active = false }: any) {
  return (
    <button className={`w-full flex items-center justify-between p-3 rounded-xl transition-all ${
      active ? 'bg-sage-50 text-forest-800 font-bold shadow-sm' : 'text-warm-500 hover:bg-ivory-50 font-medium'
    }`}>
      <span className="text-sm">{label}</span>
      {active && <div className="w-1.5 h-1.5 bg-forest-700 rounded-full" />}
    </button>
  );
}
