'use client';

import React, { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api/client';
import { useAuth } from '@/context/auth-context';
import { School, Loader2, MapPin, Phone, Mail, Globe } from 'lucide-react';

export default function StudentSchoolInfo() {
  const { activeSchoolId } = useAuth();
  const [school, setSchool] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!activeSchoolId) return;
    apiFetch('/student/school')
      .then(setSchool)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [activeSchoolId]);

  if (loading) return <div className="p-20 text-center"><Loader2 className="animate-spin mx-auto text-forest-700" size={48} /></div>;
  if (!school) return <div className="p-8 text-center text-danger-500">Failed to load school workspace context.</div>;

  return (
    <div className="space-y-6">
      <div className="bg-card p-6 rounded-2xl border border-warm-100 shadow-sm flex items-center gap-4">
        <div className="p-3 bg-sage-50 text-forest-700 rounded-2xl">
          <School size={32} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-charcoal-900">{school.name}</h1>
          <p className="text-warm-500 text-sm">Official Institutional Information & Contact Desk</p>
        </div>
      </div>

      <div className="bg-card rounded-2xl p-6 border border-warm-100 shadow-sm space-y-4">
        <h3 className="text-lg font-bold text-charcoal-900">Campus Verification Details</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-warm-700 font-medium">
          <div className="p-4 bg-ivory-50 rounded-xl flex items-center gap-3 border border-warm-100/50">
            <MapPin className="text-forest-700 shrink-0" size={18} />
            <div>
              <p className="text-[11px] text-warm-400 font-bold uppercase tracking-wider">Physical Address</p>
              <p className="text-charcoal-900 font-bold">{school.address || 'Main Campus Hub'}</p>
            </div>
          </div>

          <div className="p-4 bg-ivory-50 rounded-xl flex items-center gap-3 border border-warm-100/50">
            <Phone className="text-forest-700 shrink-0" size={18} />
            <div>
              <p className="text-[11px] text-warm-400 font-bold uppercase tracking-wider">Helpdesk Phone</p>
              <p className="text-charcoal-900 font-bold">{school.phone || 'N/A'}</p>
            </div>
          </div>

          <div className="p-4 bg-ivory-50 rounded-xl flex items-center gap-3 border border-warm-100/50">
            <Mail className="text-forest-700 shrink-0" size={18} />
            <div>
              <p className="text-[11px] text-warm-400 font-bold uppercase tracking-wider">Official Email</p>
              <p className="text-charcoal-900 font-bold">{school.email || 'registry@school.edu'}</p>
            </div>
          </div>

          <div className="p-4 bg-ivory-50 rounded-xl flex items-center gap-3 border border-warm-100/50">
            <Globe className="text-forest-700 shrink-0" size={18} />
            <div>
              <p className="text-[11px] text-warm-400 font-bold uppercase tracking-wider">System Timezone Context</p>
              <p className="text-charcoal-900 font-bold uppercase">{school.timezone || 'UTC'}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
