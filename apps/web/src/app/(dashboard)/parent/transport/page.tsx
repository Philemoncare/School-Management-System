'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Bus, MapPin, Map, Shield, AlertCircle, Lock, Inbox, RefreshCw } from 'lucide-react';
import { apiFetch, ApiError } from '@/lib/api/client';
import { useAuth } from '@/context/auth-context';
import { useChild } from '@/context/child-context';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';

export default function ParentTransport() {
  const { activeChild, loading: childLoading } = useChild();
  const { activeSchoolId } = useAuth();
  const [transport, setTransport] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [denied, setDenied] = useState(false);

  async function load() {
    if (!activeChild || !activeSchoolId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    setDenied(false);
    try {
      const data = await apiFetch(`/parent/children/${activeChild.id}/transport`);
      setTransport(Array.isArray(data) ? data : []);
    } catch (err) {
      setTransport([]);
      if (err instanceof ApiError && err.isPermissionDenied()) setDenied(true);
      else setError(err instanceof Error ? err.message : 'Could not load transport assignments.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeChild?.id, activeSchoolId]);

  if (childLoading || (loading && !!activeChild)) {
    return (
      <div className="flex items-center justify-center gap-2 py-20 text-xs font-semibold text-warm-500">
        <RefreshCw size={16} className="animate-spin" /> Loading transport assignments…
      </div>
    );
  }

  if (!activeChild) {
    return (
      <EmptyState
        title="No child linked yet"
        description="Your school has not linked a student record to this guardian account. Contact the school office to complete the link."
        icon={<Inbox className="h-8 w-8" />}
        actionButton={<Link href="/parent/children"><Button variant="outline" size="sm">Family Overview</Button></Link>}
      />
    );
  }

  if (denied) {
    return (
      <EmptyState
        title="Transport records are not available"
        description="Your account does not have permission to view this child's transport records."
        icon={<Lock className="h-8 w-8" />}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-charcoal-900 sm:text-2xl">Transport Routes</h1>
          <p className="mt-0.5 text-xs font-medium text-warm-500 sm:text-sm">
            School vehicle assignments and stop timings for {activeChild.firstName}.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={load} isLoading={loading} leftIcon={<RefreshCw size={15} />}>
          Refresh
        </Button>
      </div>

      {error && (
        <div role="alert" className="flex items-start gap-3 rounded-xl border border-danger-200 bg-danger-50 px-4 py-3 text-sm font-medium text-danger-800">
          <AlertCircle size={18} className="mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {transport.length === 0 ? (
        <EmptyState
          title="No transport assignment"
          description="This child is not currently assigned to an active school transport route. Contact the school office if transport is expected."
          icon={<Map className="h-8 w-8" />}
        />
      ) : (
        <div className="space-y-4">
          {transport.map((item) => (
            <div key={item.id} className="grid grid-cols-1 gap-6 rounded-2xl border border-warm-200 bg-card p-5 shadow-xs sm:p-6 md:grid-cols-3">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="rounded-xl bg-forest-700 p-2.5 text-white shadow-md shadow-sage-200">
                    <Bus size={18} />
                  </div>
                  <div>
                    <p className="font-semibold text-charcoal-900">{item.route?.name || 'Assigned route'}</p>
                    <p className="text-[11px] font-bold uppercase tracking-wider text-warm-400">Assigned route</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 rounded-xl border border-warm-200 bg-ivory-50 p-3">
                  <Shield size={14} className="shrink-0 text-success-600" />
                  <span className="text-xs font-semibold text-warm-700">Status: {item.status}</span>
                </div>
              </div>

              <div className="space-y-4 md:col-span-2">
                <div className="flex items-start gap-3">
                  <MapPin size={16} className="mt-1 shrink-0 text-forest-700" />
                  <div>
                    <p className="text-sm font-bold text-charcoal-900">Pickup location</p>
                    <p className="text-xs font-medium text-warm-500">{item.pickupStop?.name || 'Standard pickup'}</p>
                    <p className="mt-0.5 text-[11px] font-semibold uppercase text-warm-400">
                      Est. arrival: {item.pickupStop?.estimatedArrivalTime || 'TBA'}
                    </p>
                  </div>
                </div>

                <div className="ml-2 h-6 w-px bg-warm-200" />

                <div className="flex items-start gap-3">
                  <MapPin size={16} className="mt-1 shrink-0 text-terracotta-600" />
                  <div>
                    <p className="text-sm font-bold text-charcoal-900">Drop-off location</p>
                    <p className="text-xs font-medium text-warm-500">{item.dropoffStop?.name || 'Standard drop-off'}</p>
                    <p className="mt-0.5 text-[11px] font-semibold uppercase text-warm-400">
                      Est. arrival: {item.dropoffStop?.estimatedArrivalTime || 'TBA'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
