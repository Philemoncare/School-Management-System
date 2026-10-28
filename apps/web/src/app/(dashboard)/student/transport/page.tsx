'use client';

import React, { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api/client';
import { useAuth } from '@/context/auth-context';
import { Bus, MapPin, Loader2, Navigation } from 'lucide-react';

export default function StudentTransport() {
  const { activeSchoolId } = useAuth();
  const [assignments, setAssignments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!activeSchoolId) return;
    apiFetch('/student/transport')
      .then(setAssignments)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [activeSchoolId]);

  if (loading) return <div className="p-20 text-center"><Loader2 className="animate-spin mx-auto text-forest-700" size={48} /></div>;

  return (
    <div className="space-y-6">
      <div className="bg-card p-6 rounded-2xl border border-warm-100 shadow-sm">
        <h1 className="text-2xl font-bold text-charcoal-900 flex items-center gap-2">
          <Bus className="text-forest-700" />
          School Transport Route
        </h1>
        <p className="text-warm-500 text-sm">Overview of your assigned school bus route, vehicle number, and scheduled stops.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {assignments.map((assignment: any) => (
          <div key={assignment.id} className="bg-card rounded-2xl p-6 border border-warm-100 shadow-sm space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-[11px] font-semibold text-forest-700 uppercase tracking-wide">Assigned Route</p>
                <h3 className="text-xl font-bold text-charcoal-900">{assignment.route?.name} ({assignment.route?.code})</h3>
              </div>
              <div className="p-3 rounded-xl bg-sage-50 text-forest-700">
                <Bus size={24} />
              </div>
            </div>

            <div className="space-y-4 border-t border-ivory-50 pt-4">
              <div className="flex items-start gap-3">
                <MapPin className="text-success-600 mt-0.5" size={16} />
                <div>
                  <p className="text-[11px] font-bold text-warm-400 uppercase tracking-wider">Pickup Stop</p>
                  <p className="text-sm font-bold text-charcoal-900">{assignment.pickupStop?.name || 'Main Gate'}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <MapPin className="text-danger-600 mt-0.5" size={16} />
                <div>
                  <p className="text-[11px] font-bold text-warm-400 uppercase tracking-wider">Dropoff Stop</p>
                  <p className="text-sm font-bold text-charcoal-900">{assignment.dropoffStop?.name || 'Home Station'}</p>
                </div>
              </div>
            </div>
          </div>
        ))}

        {assignments.length === 0 && (
          <div className="md:col-span-2 bg-card rounded-2xl p-12 text-center border border-warm-100 shadow-sm text-warm-400 italic">
            <Navigation className="mx-auto text-warm-200 mb-2" size={40} />
            No school transport route currently assigned to your student profile.
          </div>
        )}
      </div>
    </div>
  );
}
