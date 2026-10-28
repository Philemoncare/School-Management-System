'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, FileSpreadsheet, RefreshCw, AlertCircle } from 'lucide-react';
import { apiFetch } from '@/lib/api/client';
import { showFeedback } from '@/components/layout/global-feedback';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { SkeletonTable } from '@/components/ui/loading-state';

interface HistoryGroup {
  id: string;
  academicYear: { id: string; name: string } | null;
  term: { id: string; name: string } | null;
  class: { id: string; name: string } | null;
  totalStudents: number;
  published: number;
  generated: number;
  draft: number;
  lastPublishedAt: string | null;
}

export default function ResultHistoryPage() {
  const [groups, setGroups] = useState<HistoryGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function publishBatch(group: HistoryGroup) {
    setBusyId(group.id);
    setError(null);
    try {
      const result = await apiFetch('/results/report-cards/publish', {
        method: 'PATCH',
        body: JSON.stringify({
          classId: group.class?.id,
          academicYearId: group.academicYear?.id,
          termId: group.term?.id,
        }),
      });
      showFeedback('SUCCESS', result?.message || 'Report cards published successfully.');
      await load();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Could not publish these report cards.';
      setError(message);
      showFeedback('ERROR', message);
    } finally {
      setBusyId(null);
    }
  }

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch('/results/history');
      setGroups(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load the results archive.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const publicationLabel = (group: HistoryGroup) => {
    if (group.published > 0) return { text: 'PUBLISHED', className: 'bg-sage-100 text-forest-800' };
    if (group.generated > 0) return { text: 'GENERATED', className: 'bg-warning-100 text-warning-800' };
    return { text: 'DRAFT', className: 'bg-warm-100 text-warm-700' };
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/results"
            aria-label="Back to results"
            className="rounded-xl border border-warm-200 bg-card p-2.5 text-warm-600 transition-colors hover:text-charcoal-900"
          >
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 className="flex items-center gap-2.5 text-2xl font-bold tracking-tight text-charcoal-900 sm:text-3xl">
              <FileSpreadsheet className="text-forest-700" /> Results Archive
            </h1>
            <p className="mt-0.5 text-xs font-medium text-warm-500 sm:text-sm">
              Report card batches actually generated for each academic year, term and class.
            </p>
          </div>
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

      {loading ? (
        <SkeletonTable />
      ) : groups.length === 0 ? (
        <EmptyState
          title="No report cards generated yet"
          description="Once results are calculated and report cards generated, each publication batch will appear here."
          icon={<FileSpreadsheet className="h-8 w-8" />}
          actionButton={
            <Link href="/dashboard/results">
              <Button variant="primary" size="sm">Go to Results</Button>
            </Link>
          }
        />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-warm-200 bg-card shadow-xs">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-warm-200">
              <thead className="bg-ivory-50">
                <tr>
                  <th className="px-4 py-3.5 text-left text-[11px] font-bold uppercase tracking-wide text-warm-400 sm:px-6">Academic Year / Term</th>
                  <th className="px-4 py-3.5 text-left text-[11px] font-bold uppercase tracking-wide text-warm-400 sm:px-6">Class</th>
                  <th className="px-4 py-3.5 text-left text-[11px] font-bold uppercase tracking-wide text-warm-400 sm:px-6">Report Cards</th>
                  <th className="px-4 py-3.5 text-left text-[11px] font-bold uppercase tracking-wide text-warm-400 sm:px-6">Status</th>
                  <th className="px-4 py-3.5 text-right text-[11px] font-bold uppercase tracking-wide text-warm-400 sm:px-6">Last Published</th>
                  <th className="px-4 py-3.5 text-right text-[11px] font-bold uppercase tracking-wide text-warm-400 sm:px-6">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-warm-100 bg-card">
                {groups.map((group) => {
                  const status = publicationLabel(group);
                  return (
                    <tr key={group.id} className="transition-colors hover:bg-sage-50/30">
                      <td className="px-4 py-4 sm:px-6">
                        <p className="text-xs font-bold text-charcoal-900 sm:text-sm">{group.academicYear?.name || '—'}</p>
                        <p className="text-[11px] font-medium text-warm-500">{group.term?.name || 'Full year'}</p>
                      </td>
                      <td className="px-4 py-4 text-xs font-semibold text-warm-700 sm:px-6 sm:text-sm">{group.class?.name || '—'}</td>
                      <td className="px-4 py-4 sm:px-6">
                        <p className="text-xs font-semibold text-warm-700 sm:text-sm">{group.totalStudents} learners</p>
                        <p className="text-[11px] text-warm-500">
                          {group.published} published · {group.generated} generated · {group.draft} draft
                        </p>
                      </td>
                      <td className="px-4 py-4 sm:px-6">
                        <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-tight ${status.className}`}>
                          {status.text}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-right text-xs font-semibold text-warm-500 sm:px-6">
                        {group.lastPublishedAt ? new Date(group.lastPublishedAt).toLocaleDateString() : 'Not published'}
                      </td>
                      <td className="px-4 py-4 text-right sm:px-6">
                        {group.generated > 0 ? (
                          <Button
                            size="xs"
                            variant="primary"
                            isLoading={busyId === group.id}
                            onClick={() => publishBatch(group)}
                          >
                            Publish
                          </Button>
                        ) : (
                          <span className="text-[11px] font-semibold text-warm-400">
                            {group.published > 0 ? 'Published' : '—'}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
