'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { apiFetch } from '@/lib/api/client';
import { useAuth } from '@/context/auth-context';
import { collectUserRoles } from '@/lib/auth/roles';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import {
  ArrowRight,
  BarChart3,
  BookOpenCheck,
  ChevronRight,
  ClipboardList,
  FileText,
  Layers,
  Loader2,
  Plus,
  RefreshCw,
  Trophy,
} from 'lucide-react';

interface Assessment {
  id: string;
  name: string;
  code: string;
  status: string;
  totalMarks: number;
  assessmentType?: { name: string };
  class?: { name: string };
  section?: { name: string } | null;
  subject?: { name: string };
  _count?: { scores: number };
}

const STATUS_STYLES: Record<string, string> = {
  DRAFT: 'bg-warm-100 text-warm-700',
  SCHEDULED: 'bg-sage-100 text-forest-800',
  OPEN: 'bg-sage-100 text-forest-800',
  SUBMISSION_OPEN: 'bg-sage-100 text-forest-800',
  SUBMITTED: 'bg-warning-100 text-warning-800',
  UNDER_REVIEW: 'bg-warning-100 text-warning-800',
  APPROVED: 'bg-success-100 text-success-800',
  PUBLISHED: 'bg-success-100 text-success-800',
  LOCKED: 'bg-charcoal-100 text-charcoal-800',
  CANCELLED: 'bg-danger-100 text-danger-700',
};

export default function AssessmentDashboard() {
  const { user, activeSchoolId } = useAuth();
  const roles = useMemo(() => collectUserRoles(user, activeSchoolId), [user, activeSchoolId]);
  const canManage = roles.some((role) => ['SCHOOL_ADMIN', 'PRINCIPAL', 'TEACHER'].includes(role));

  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await apiFetch('/assessments');
      setAssessments(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setAssessments([]);
      setError(err?.message || 'Could not load assessments.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const published = assessments.filter((item) => item.status === 'PUBLISHED').length;
  const draft = assessments.filter((item) => item.status === 'DRAFT').length;
  const scored = assessments.reduce((sum, item) => sum + (item._count?.scores ?? 0), 0);
  const recent = assessments.slice(0, 6);

  const modules = [
    {
      name: 'Assessments',
      description: 'Create exams, quizzes and assignments, then enter scores.',
      href: '/dashboard/assessments/list',
      icon: FileText,
      color: 'bg-forest-700',
    },
    {
      name: 'Evaluation Types',
      description: 'Categories such as exam, quiz and continuous assessment.',
      href: '/dashboard/assessments/types',
      icon: Layers,
      color: 'bg-success-600',
    },
    {
      name: 'Grading Scales',
      description: 'Grade bands that convert percentages into letter grades.',
      href: '/dashboard/assessments/grading',
      icon: Trophy,
      color: 'bg-terracotta-600',
    },
    {
      name: 'Results & Report Cards',
      description: 'Calculate, approve and publish term results.',
      href: '/dashboard/results',
      icon: BookOpenCheck,
      color: 'bg-forest-700',
    },
  ];

  return (
    <div className="space-y-6 sm:space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-charcoal-900 sm:text-3xl">
            Examination Hub
          </h1>
          <p className="mt-1 text-xs font-medium text-warm-500 sm:text-sm">
            Assessment setup, score entry, grading and result publication.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={load}
            disabled={loading}
            leftIcon={<RefreshCw size={14} className={loading ? 'animate-spin' : undefined} />}
          >
            Refresh
          </Button>
          {canManage && (
            <Link href="/dashboard/assessments/list">
              <Button size="sm" leftIcon={<Plus size={16} />}>
                New Assessment
              </Button>
            </Link>
          )}
        </div>
      </div>

      {error && (
        <div
          role="alert"
          className="flex flex-col gap-3 rounded-xl border border-danger-200 bg-danger-50 p-4 text-sm font-semibold text-danger-700 sm:flex-row sm:items-center sm:justify-between"
        >
          <span>{error}</span>
          <Button variant="outline" size="sm" onClick={load}>
            Try again
          </Button>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Metric label="Assessments" value={assessments.length} />
        <Metric label="Draft" value={draft} />
        <Metric label="Published" value={published} />
        <Metric label="Scores entered" value={scored} />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {modules.map((module) => (
          <Link
            key={module.name}
            href={module.href}
            className="group relative block overflow-hidden rounded-2xl border border-warm-200 bg-card p-5 shadow-xs transition-all hover:border-sage-300 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest-600/30 sm:p-6"
          >
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className={`${module.color} rounded-2xl p-3.5 text-ivory-50 transition-transform group-hover:scale-105`}>
                  <module.icon size={22} />
                </div>
                <div>
                  <h2 className="text-base font-bold text-charcoal-900 transition-colors group-hover:text-forest-800 sm:text-lg">
                    {module.name}
                  </h2>
                  <p className="mt-1 text-xs font-medium leading-relaxed text-warm-500">
                    {module.description}
                  </p>
                </div>
              </div>
              <div className="hidden h-10 w-10 shrink-0 items-center justify-center rounded-full bg-ivory-50 text-warm-400 transition-colors group-hover:bg-sage-50 group-hover:text-forest-700 sm:flex">
                <ChevronRight size={20} />
              </div>
            </div>
          </Link>
        ))}
      </div>

      <section className="overflow-hidden rounded-xl border border-warm-200 bg-card shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-warm-100 bg-ivory-50/50 px-5 py-4 sm:px-6">
          <div>
            <h2 className="text-sm font-bold text-charcoal-900">Recent assessments</h2>
            <p className="text-[11px] font-medium text-warm-500">
              The latest assessments created for this school.
            </p>
          </div>
          <Link
            href="/dashboard/assessments/list"
            className="text-[11px] font-bold uppercase tracking-wide text-forest-700 hover:underline"
          >
            View all
          </Link>
        </div>

        {loading && assessments.length === 0 ? (
          <div className="flex items-center justify-center gap-2 py-16 text-sm font-medium text-warm-500">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading assessments…
          </div>
        ) : recent.length === 0 ? (
          <div className="p-5 sm:p-6">
            <EmptyState
              icon={<ClipboardList className="h-8 w-8" />}
              title="No assessments yet"
              description="Create the first assessment, enter scores, then submit and publish it for results."
              actionButton={
                canManage ? (
                  <Link href="/dashboard/assessments/list">
                    <Button leftIcon={<Plus size={16} />}>Create assessment</Button>
                  </Link>
                ) : undefined
              }
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-warm-200">
              <caption className="sr-only">Recent assessments</caption>
              <thead className="bg-ivory-50/30">
                <tr>
                  {['Assessment', 'Target', 'Scores', 'Status', 'Action'].map((heading) => (
                    <th
                      key={heading}
                      scope="col"
                      className={`px-4 py-3 text-[11px] font-bold uppercase tracking-wide text-warm-500 sm:px-6 ${
                        heading === 'Action' ? 'text-right' : 'text-left'
                      }`}
                    >
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-warm-100">
                {recent.map((assessment) => (
                  <tr key={assessment.id} className="transition-colors hover:bg-sage-50/30">
                    <td className="px-4 py-3.5 sm:px-6">
                      <p className="text-sm font-semibold text-charcoal-900">{assessment.name}</p>
                      <p className="mt-0.5 text-[11px] font-medium text-warm-500">
                        {assessment.assessmentType?.name ?? 'Assessment'} · {assessment.subject?.name ?? '—'}
                      </p>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3.5 text-xs font-semibold text-warm-700 sm:px-6">
                      {assessment.class?.name ?? '—'}
                      {assessment.section?.name ? ` · ${assessment.section.name}` : ''}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3.5 text-xs text-warm-600 sm:px-6">
                      {assessment._count?.scores ?? 0} entered
                    </td>
                    <td className="whitespace-nowrap px-4 py-3.5 sm:px-6">
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase ${
                          STATUS_STYLES[assessment.status] ?? 'bg-warm-100 text-warm-700'
                        }`}
                      >
                        {assessment.status.replaceAll('_', ' ')}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3.5 text-right sm:px-6">
                      <Link
                        href={`/dashboard/assessments/${assessment.id}/scores`}
                        className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wide text-forest-700 hover:underline"
                      >
                        <BarChart3 size={12} /> Scores
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-warm-100 bg-ivory-50/40 px-5 py-3 text-[11px] font-medium text-warm-500 sm:px-6">
          <span className="inline-flex items-center gap-1.5">
            <ArrowRight size={12} /> Scores must be submitted before an assessment can be published.
          </span>
          <Link href="/dashboard/results" className="font-bold text-forest-700 hover:underline">
            Go to results
          </Link>
        </div>
      </section>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-warm-200 bg-card px-4 py-3 shadow-xs">
      <p className="text-[10px] font-bold uppercase tracking-wide text-warm-500">{label}</p>
      <p className="mt-0.5 text-xl font-bold text-charcoal-900">{value}</p>
    </div>
  );
}
