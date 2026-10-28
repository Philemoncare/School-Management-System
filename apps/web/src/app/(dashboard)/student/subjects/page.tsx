'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { BookOpen, User, RefreshCw, AlertCircle, Lock, Inbox } from 'lucide-react';
import { apiFetch, ApiError } from '@/lib/api/client';
import { useAuth } from '@/context/auth-context';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';

export default function StudentSubjects() {
  const { activeSchoolId } = useAuth();
  const [subjects, setSubjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [denied, setDenied] = useState(false);

  async function load() {
    if (!activeSchoolId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    setDenied(false);
    try {
      const data = await apiFetch('/student/subjects');
      setSubjects(Array.isArray(data) ? data : []);
    } catch (err) {
      setSubjects([]);
      if (err instanceof ApiError && err.isPermissionDenied()) {
        setDenied(true);
      } else {
        setError(err instanceof Error ? err.message : 'Could not load your subjects.');
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [activeSchoolId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 py-20 text-xs font-semibold text-warm-500">
        <RefreshCw size={16} className="animate-spin" /> Loading your curriculum…
      </div>
    );
  }

  if (denied) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-charcoal-900">My Subjects</h1>
          <p className="text-sm font-medium text-warm-500">Overview of your enrolled courses and assigned teachers.</p>
        </div>
        <EmptyState
          title="Student portal access only"
          description="You are signed in with a staff account. These pages belong to the student portal and are available to learners with a student profile."
          icon={<Lock className="h-8 w-8" />}
          actionButton={
            <Link href="/dashboard">
              <Button variant="primary" size="sm">Back to Dashboard</Button>
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-charcoal-900">My Subjects</h1>
          <p className="text-sm font-medium text-warm-500">Overview of your enrolled courses and assigned teachers.</p>
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
          title="No subjects assigned yet"
          description="Your class subjects will appear here once the school has added you to a class and assigned subjects for the academic year."
          icon={<Inbox className="h-8 w-8" />}
        />
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {subjects.map((cs: any) => {
            const assignments: any[] = Array.isArray(cs?.subject?.teacherAssignments)
              ? cs.subject.teacherAssignments
              : [];
            return (
              <div key={cs.id} className="overflow-hidden rounded-2xl border border-warm-200 bg-card shadow-xs transition-all hover:shadow-md">
                <div className="p-5 sm:p-6">
                  <div className="mb-4 flex items-start justify-between gap-3">
                    <div className="rounded-2xl bg-sage-50 p-3 text-forest-700 shadow-xs">
                      <BookOpen size={24} />
                    </div>
                    <div className="text-right">
                      <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide leading-none text-warm-400">Subject Code</p>
                      <p className="text-sm font-semibold leading-none text-charcoal-900">{cs.subject?.code || '—'}</p>
                    </div>
                  </div>

                  <h3 className="mb-2 text-lg font-bold text-charcoal-900">{cs.subject?.name || 'Unnamed subject'}</h3>
                  <p className="mb-5 line-clamp-2 text-sm font-medium text-warm-500">
                    {cs.subject?.description || 'No description available for this subject.'}
                  </p>

                  <div className="space-y-3">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-warm-400">Assigned Teachers</p>
                    {assignments.length > 0 ? (
                      assignments.map((ta: any) => (
                        <div key={ta.id} className="flex items-center gap-3 rounded-xl border border-warm-100 bg-ivory-50 p-2">
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-warm-200 bg-card text-warm-400">
                            <User size={16} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-xs font-bold text-charcoal-900">
                              {ta.teacher?.firstName} {ta.teacher?.lastName}
                            </p>
                            <p className="text-[11px] font-bold uppercase tracking-wider text-forest-700">
                              {ta.designation || 'Subject Teacher'}
                            </p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs font-medium italic text-warm-400">No teachers assigned yet.</p>
                    )}
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
