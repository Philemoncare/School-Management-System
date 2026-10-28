'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Award, Calendar, AlertCircle, Lock, Inbox, RefreshCw, FileSpreadsheet } from 'lucide-react';
import { apiFetch, ApiError } from '@/lib/api/client';
import { useAuth } from '@/context/auth-context';
import { useChild } from '@/context/child-context';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';

export default function ParentResults() {
  const { activeChild, loading: childLoading } = useChild();
  const { activeSchoolId } = useAuth();
  const [results, setResults] = useState<any[]>([]);
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
      const data = await apiFetch(`/parent/children/${activeChild.id}/results`);
      setResults(Array.isArray(data) ? data : []);
    } catch (err) {
      setResults([]);
      if (err instanceof ApiError && err.isPermissionDenied()) setDenied(true);
      else setError(err instanceof Error ? err.message : 'Could not load published results.');
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
        <RefreshCw size={16} className="animate-spin" /> Loading published results…
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
        title="Results are not available"
        description="Your account does not have permission to view this child's academic results."
        icon={<Lock className="h-8 w-8" />}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-charcoal-900 sm:text-2xl">Academic Results</h1>
          <p className="mt-0.5 text-xs font-medium text-warm-500 sm:text-sm">
            Published term results for {activeChild.firstName} {activeChild.lastName}.
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

      <div className="overflow-hidden rounded-2xl border border-warm-200 bg-card shadow-xs">
        <div className="flex items-center gap-2 border-b border-warm-100 p-5 sm:p-6">
          <Award size={20} className="text-forest-700" />
          <h2 className="text-lg font-bold text-charcoal-900">Term-End Results</h2>
        </div>
        <div className="p-5 sm:p-6">
          {results.length === 0 ? (
            <div className="py-8 text-center">
              <FileSpreadsheet size={40} className="mx-auto mb-3 text-warm-300" />
              <p className="text-sm font-medium text-warm-500">No official term results have been published yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {results.map((result) => {
                const score = result.weightedScore ?? result.percentage;
                return (
                  <div key={result.id} className="flex items-center justify-between gap-3 rounded-xl border border-warm-200 bg-ivory-50 p-4">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-charcoal-900">{result.subject?.name || 'Subject'}</p>
                      <div className="mt-1 flex items-center gap-2 text-xs font-medium text-warm-500">
                        <Calendar size={12} />
                        <span className="truncate">
                          {result.academicYear?.name || 'Academic year'}
                          {result.term?.name ? ` • ${result.term.name}` : ''}
                        </span>
                      </div>
                      {result.remark && (
                        <p className="mt-2 line-clamp-2 text-xs font-medium italic text-warm-400">&ldquo;{result.remark}&rdquo;</p>
                      )}
                      {result.publishedAt && (
                        <p className="mt-1 text-[11px] font-semibold uppercase tracking-wide text-warm-400">
                          Published {new Date(result.publishedAt).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1">
                      <div className="rounded-lg border border-sage-100 bg-sage-50 px-3 py-1 text-xl font-semibold text-forest-700">
                        {result.grade || '—'}
                      </div>
                      <span className="text-[11px] font-bold uppercase tracking-wider text-warm-400">
                        {score != null ? `${Number(score).toFixed(1)}%` : '—'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
