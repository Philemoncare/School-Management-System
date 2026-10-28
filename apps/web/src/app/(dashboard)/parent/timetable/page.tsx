'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Clock, MapPin, User, AlertCircle, Lock, Inbox, RefreshCw, CalendarX2 } from 'lucide-react';
import { apiFetch, ApiError } from '@/lib/api/client';
import { useAuth } from '@/context/auth-context';
import { useChild } from '@/context/child-context';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';

const DAYS_OF_WEEK = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function ParentTimetable() {
  const { activeChild, loading: childLoading } = useChild();
  const { activeSchoolId } = useAuth();
  const [timetable, setTimetable] = useState<any[]>([]);
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
      const data = await apiFetch(`/parent/children/${activeChild.id}/timetable`);
      setTimetable(Array.isArray(data) ? data : []);
    } catch (err) {
      setTimetable([]);
      if (err instanceof ApiError && err.isPermissionDenied()) setDenied(true);
      else setError(err instanceof Error ? err.message : 'Could not load the timetable.');
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
        <RefreshCw size={16} className="animate-spin" /> Loading timetable…
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
        title="Timetable is not available"
        description="Your account does not have permission to view this child's timetable."
        icon={<Lock className="h-8 w-8" />}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-charcoal-900 sm:text-2xl">Weekly Timetable</h1>
          <p className="mt-0.5 text-xs font-medium text-warm-500 sm:text-sm">
            Class schedule and period structure for {activeChild.firstName}.
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

      {timetable.length === 0 ? (
        <EmptyState
          title="No timetable published"
          description="The school has not published timetable entries for this class yet. Check back once the academic timetable is released."
          icon={<CalendarX2 className="h-8 w-8" />}
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
          {DAYS_OF_WEEK.map((dayName, index) => {
            if (index === 0 || index === 6) return null;
            const entries = timetable
              .filter((entry) => entry.dayOfWeek === index)
              .sort((a, b) => String(a.startTime || '').localeCompare(String(b.startTime || '')));

            return (
              <div key={dayName} className="flex flex-col gap-3 rounded-2xl border border-warm-200 bg-card p-4 shadow-xs">
                <h3 className="border-b border-warm-100 pb-2 text-sm font-bold text-charcoal-900">{dayName}</h3>
                {entries.length > 0 ? (
                  entries.map((entry) => (
                    <div key={entry.id} className="space-y-1.5 rounded-xl border border-warm-200 bg-ivory-50 p-3">
                      <p className="text-xs font-bold text-charcoal-900">{entry.subject?.name || 'Subject'}</p>
                      <div className="flex items-center gap-1.5 text-[11px] font-medium text-warm-500">
                        <Clock size={12} />
                        <span>{entry.startTime} – {entry.endTime}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-[11px] font-medium text-warm-500">
                        <MapPin size={12} />
                        <span>Room {entry.room?.name || 'TBA'}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-[11px] font-medium text-warm-500">
                        <User size={12} />
                        <span className="truncate">
                          {entry.teacher ? `${entry.teacher.firstName} ${entry.teacher.lastName}` : 'Teacher TBA'}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="py-4 text-center text-xs italic text-warm-400">No classes</p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
