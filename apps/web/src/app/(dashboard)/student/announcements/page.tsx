'use client';

import React, { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api/client';
import { useAuth } from '@/context/auth-context';
import { AlertCircle, Loader2, Bell } from 'lucide-react';

export default function StudentAnnouncements() {
  const { activeSchoolId } = useAuth();
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!activeSchoolId) return;
    apiFetch('/student/announcements')
      .then(setAnnouncements)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [activeSchoolId]);

  if (loading) return <div className="p-20 text-center"><Loader2 className="animate-spin mx-auto text-forest-700" size={48} /></div>;

  return (
    <div className="space-y-6">
      <div className="bg-card p-6 rounded-2xl border border-warm-100 shadow-sm">
        <h1 className="text-2xl font-bold text-charcoal-900 flex items-center gap-2">
          <AlertCircle className="text-forest-700" />
          Notice Board & Announcements
        </h1>
        <p className="text-warm-500 text-sm">Stay informed with the latest official broadcasts and target updates from school registry.</p>
      </div>

      <div className="space-y-4">
        {announcements.map((a) => (
          <div key={a.id} className="bg-card rounded-2xl p-6 border border-warm-100 shadow-sm space-y-2">
            <div className="flex justify-between items-center">
              <span className="px-2 py-0.5 bg-sage-50 text-forest-800 font-bold text-[11px] rounded-md uppercase tracking-wider">
                {new Date(a.createdAt).toLocaleDateString('en-US', { dateStyle: 'medium' })}
              </span>
              <span className={`px-2 py-0.5 text-[11px] font-bold rounded-md uppercase ${
                a.priority === 'HIGH' || a.priority === 'CRITICAL' ? 'bg-danger-50 text-danger-700' : 'bg-warm-100 text-warm-700'
              }`}>{a.priority} Priority</span>
            </div>
            <h3 className="text-lg font-bold text-charcoal-900">{a.title}</h3>
            <p className="text-warm-700 text-sm leading-relaxed font-medium whitespace-pre-wrap">{a.content.replace(/<[^>]*>?/gm, '')}</p>
          </div>
        ))}

        {announcements.length === 0 && (
          <div className="bg-card rounded-2xl p-12 text-center border border-warm-100 shadow-sm text-warm-400 italic">
            <Bell className="mx-auto text-warm-200 mb-2" size={40} />
            No recent notices published for your target profile.
          </div>
        )}
      </div>
    </div>
  );
}
