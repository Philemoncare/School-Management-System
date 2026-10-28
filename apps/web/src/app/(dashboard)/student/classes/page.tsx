'use client';

import React, { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api/client';
import { useAuth } from '@/context/auth-context';
import { Layers, Loader2, BookOpen } from 'lucide-react';

export default function StudentClasses() {
  const { activeSchoolId } = useAuth();
  const [subjects, setSubjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!activeSchoolId) return;
    apiFetch('/student/subjects')
      .then(setSubjects)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [activeSchoolId]);

  if (loading) return <div className="p-20 text-center"><Loader2 className="animate-spin mx-auto text-forest-700" size={48} /></div>;

  return (
    <div className="space-y-6">
      <div className="bg-card p-6 rounded-2xl border border-warm-100 shadow-sm">
        <h1 className="text-2xl font-bold text-charcoal-900 flex items-center gap-2">
          <Layers className="text-forest-700" />
          My Registered Classes & Sections
        </h1>
        <p className="text-warm-500 text-sm">Overview of active academic classroom distributions mapped to your primary enrollment card.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {subjects.map((item: any) => (
          <div key={item.id} className="bg-card rounded-2xl p-6 border border-warm-100 shadow-sm flex items-start gap-4">
            <div className="p-3 bg-sage-50 text-forest-700 rounded-xl">
              <BookOpen size={20} />
            </div>
            <div>
              <h3 className="font-bold text-charcoal-900 text-base">{item.subject?.name}</h3>
              <p className="text-xs text-warm-400 font-semibold uppercase mt-0.5">Code: {item.subject?.code}</p>
              <div className="mt-3 space-y-1 text-xs text-warm-600 font-medium">
                <p><span className="text-warm-400 font-bold uppercase text-[11px] tracking-wider block">Class Level Level</span> Level {item.class?.level || 'Active Stream'}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
