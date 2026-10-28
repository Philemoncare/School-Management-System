'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { ClipboardList, Calendar, AlertCircle, Inbox, RefreshCw, Award } from 'lucide-react';
import { apiFetch, ApiError } from '@/lib/api/client';
import { useAuth } from '@/context/auth-context';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';

export default function StudentAssessments() {
  const { activeSchoolId } = useAuth();
  const [assessments, setAssessments] = useState<any[]>([]);
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
      const data = await apiFetch('/student/assessments');
      setAssessments(Array.isArray(data) ? data : []);
    } catch (err) {
      setAssessments([]);
      setError(err instanceof ApiError ? err.message : 'Could not load assessments.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSchoolId]);

  const upcoming = useMemo(
    () => assessments.filter((item) => item.startDate && new Date(item.startDate) >= new Date()).length,
    [assessments],
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 py-20 text-xs font-semibold text-warm-500">
        <RefreshCw size={16} className="animate-spin" /> Loading assessments…
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-xl font-semibold tracking-tight text-charcoal-900 sm:text-2xl">
            <ClipboardList className="text-forest-700" size={24} /> Assessments
          </h1>
          <p className="mt-0.5 text-xs font-medium text-warm-500 sm:text-sm">
            Published class assessments, tests, and examinations for your class.
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

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-warm-200 bg-card p-4 shadow-xs">
          <p className="text-[11px] font-bold uppercase tracking-wide text-warm-400">Published</p>
          <p className="mt-1 text-xl font-semibold text-charcoal-900">{assessments.length}</p>
        </div>
        <div className="rounded-2xl border border-warm-200 bg-card p-4 shadow-xs">
          <p className="text-[11px] font-bold uppercase tracking-wide text-warm-400">Upcoming</p>
          <p className="mt-1 text-xl font-semibold text-warning-600">{upcoming}</p>
        </div>
        <div className="rounded-2xl border border-warm-200 bg-card p-4 shadow-xs">
          <p className="text-[11px] font-bold uppercase tracking-wide text-warm-400">Past</p>
          <p className="mt-1 text-xl font-semibold text-charcoal-900">{assessments.length - upcoming}</p>
        </div>
      </div>

      {assessments.length === 0 ? (
        <EmptyState
          title="No assessments published"
          description="Your teachers have not published any assessments for your class yet. They will appear here once released."
          icon={<ClipboardList className="h-8 w-8" />}
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {assessments.map((assessment) => {
            const start = assessment.startDate ? new Date(assessment.startDate) : null;
            const isUpcoming = start ? start >= new Date() : false;
            return (
              <article key={assessment.id} className="rounded-2xl border border-warm-200 bg-card p-5 shadow-xs">
                <div className="mb-3 flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="text-sm font-bold text-charcoal-900">{assessment.name}</h2>
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-forest-700">
                      {assessment.subject?.name || 'Subject'}
                      {assessment.assessmentType?.name ? ` • ${assessment.assessmentType.name}` : ''}
                    </p>
                  </div>
                  <span className={`shrink-0 rounded-md border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                    isUpcoming
                      ? 'border-warning-100 bg-warning-50 text-warning-700'
                      : 'border-warm-200 bg-ivory-50 text-warm-500'
                  }`}>
                    {isUpcoming ? 'Upcoming' : 'Completed'}
                  </span>
                </div>
                <div className="space-y-2 text-xs font-medium text-warm-500">
                  <p className="flex items-center gap-2">
                    <Calendar size={13} />
                    {start ? start.toLocaleDateString() : 'Date TBA'}
                    {assessment.endDate ? ` – ${new Date(assessment.endDate).toLocaleDateString()}` : ''}
                  </p>
                  <p className="flex items-center gap-2">
                    <Award size={13} />
                    Total marks: {assessment.totalMarks ?? '—'} • Weight: {assessment.weight ?? '—'}
                  </p>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
