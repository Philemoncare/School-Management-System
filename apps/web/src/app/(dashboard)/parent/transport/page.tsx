'use client';

import React, { useEffect, useState } from 'react';
import { useChild } from '@/context/child-context';
import { useAuth } from '@/context/auth-context';
import { Bus, MapPin, Map, Shield } from 'lucide-react';

export default function ParentTransport() {
  const { activeChild, loading: childLoading } = useChild();
  const { activeSchoolId } = useAuth();
  const [transport, setTransport] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchTransport() {
      if (!activeChild || !activeSchoolId) return;
      setLoading(true);
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/parent/children/${activeChild.id}/transport`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'x-school-id': activeSchoolId,
          },
        });
        const data = await response.json();
        setTransport(data);
      } catch (error) {
        console.error('Failed to fetch transport schedule:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchTransport();
  }, [activeChild, activeSchoolId]);

  if (childLoading || loading) return <div>Loading transit routes and trip statuses...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-charcoal-900">Transit Routes & Shuttles</h1>
        <p className="text-warm-500">Authorized school vehicle assignments and stop timings for {activeChild?.firstName}.</p>
      </div>

      <div className="bg-card rounded-2xl border border-warm-100 shadow-sm p-6">
        {transport.length > 0 ? (
          <div className="space-y-6">
            {transport.map((item) => (
              <div key={item.id} className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6 rounded-2xl bg-ivory-50 border border-warm-100">
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-forest-700 text-white shadow-md shadow-sage-200">
                      <Bus size={18} />
                    </div>
                    <div>
                      <p className="font-semibold text-charcoal-950">{item.route?.name}</p>
                      <p className="text-[11px] text-warm-400 font-bold uppercase tracking-wider">Assigned Route</p>
                    </div>
                  </div>
                  <div className="mt-4 p-3 bg-card rounded-xl border border-warm-200/60 shadow-sm flex items-center gap-2">
                    <Shield size={14} className="text-success-600 shrink-0" />
                    <span className="text-xs font-semibold text-warm-700">Status: {item.status}</span>
                  </div>
                </div>

                <div className="md:col-span-2 space-y-4">
                  <div className="flex items-start gap-3">
                    <MapPin size={16} className="text-forest-700 mt-1 shrink-0" />
                    <div>
                      <p className="text-sm font-bold text-charcoal-900">Pickup Location</p>
                      <p className="text-xs text-warm-500 font-medium">{item.pickupStop?.name || 'Standard Drop-off'}</p>
                      <p className="text-[11px] text-warm-400 font-semibold uppercase mt-0.5">Est. Arrival: {item.pickupStop?.estimatedArrivalTime || 'TBA'}</p>
                    </div>
                  </div>

                  <div className="w-px h-6 bg-warm-200 ml-2" />

                  <div className="flex items-start gap-3">
                    <MapPin size={16} className="text-terracotta-600 mt-1 shrink-0" />
                    <div>
                      <p className="text-sm font-bold text-charcoal-900">Drop-off Location</p>
                      <p className="text-xs text-warm-500 font-medium">{item.dropoffStop?.name || 'Standard Departure'}</p>
                      <p className="text-[11px] text-warm-400 font-semibold uppercase mt-0.5">Est. Arrival: {item.dropoffStop?.estimatedArrivalTime || 'TBA'}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Map size={40} className="text-warm-300 mx-auto mb-3" />
            <p className="text-warm-500 font-medium">This child is not currently assigned to any active transport services.</p>
          </div>
        )}
      </div>
    </div>
  );
}
