'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Layers, Loader2, BookOpen, AlertCircle, Inbox, RefreshCw } from 'lucide-react';
import { apiFetch, ApiError } from '@/lib/api/client';
import { useAuth } from '@/context/auth-context';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';

export default function StudentClasses() {
  const { activeSchoolId } = useAuth();
  const [subjects, setSubjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    if (!activeSchoolId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch('/student/subjects');
      setSubjects(Array.isArray(data) ? data : []);
    } catch (err) {
      setSubjects([]);
      setError(err instanceof ApiError ? err.message : 'Could not load your classes.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSchoolId]);

  if (loading) {
    return <div className="flex items-center justify-center gap-2 py-20 text-xs font-semibold text-warm-500"><RefreshCw size={16} className="animate-spin" /> Loading your classes…</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-xl font-semibold tracking-tight text-charcoal-900 sm:text-2xl">
            <Layers className="text-forest-700" size={24} /> My Classes & Subjects
          </h1>
          <p className="mt-0.5 text-xs font-medium text-warm-500 sm:text-sm">
            Subjects attached to your active enrollment for the current academic year.
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

      {subjects.length === 0 ? (
        <EmptyState
          title="No class subjects assigned"
          description="Your class subjects will appear here once the school enrolls you and assigns subjects for the academic year."
          icon={<Inbox className="h-8 w-8" />}
          actionButton={<Link href="/student/subjects"><Button variant="outline" size="sm">My Subjects</Button></Link>}
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {subjects.map((item: any) => {
            return (
              <div key={item.id} className="flex items-start gap-4 rounded-2xl border border-warm-200 bg-card p-5 shadow-xs sm:p-6">
                <div className="rounded-xl bg-sage-50 p-3 text-forest-700">
                  <BookOpen size={20} />
                </div>
                <div className="min-w-0">
                  <h3 className="text-base font-bold text-charcoal-900">{item.subject?.name || 'Unnamed subject'}</h3>
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-warm-400">
                    Subject code: {item.subject?.code || '—'}
                  </p>
                  <div className="mt-3 space-y-1 text-xs font-medium text-warm-600">
                    <p>
                      <span className="block text-[10px] font-bold uppercase tracking-wide text-warm-400">Class</span>
                      {item.class?.name || 'Not assigned'}
                    </p>
                    <p>
                      <span className="block text-[10px] font-bold uppercase tracking-wide text-warm-400">Section</span>
                      {item.section?.name || 'Not assigned'}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
