'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { apiFetch } from '@/lib/api/client';
import { useAuth } from '@/context/auth-context';
import { collectUserRoles } from '@/lib/auth/roles';
import { Button } from '@/components/ui/button';
import { Input, Select } from '@/components/ui/input';
import { EmptyState } from '@/components/ui/empty-state';
import { showFeedback } from '@/components/layout/global-feedback';
import {
  ArrowLeft,
  BarChart3,
  CheckCircle2,
  Loader2,
  RefreshCw,
  Save,
  Send,
  UploadCloud,
  Users,
} from 'lucide-react';

interface Student {
  id: string;
  firstName: string;
  lastName: string;
  studentNumber: string;
}

interface Row {
  studentId: string;
  student: Student;
  rawScore: string;
  status: string;
  remarks: string;
  saved: boolean;
}

interface AssessmentInfo {
  id: string;
  name: string;
  code: string;
  status: string;
  totalMarks: number;
  weight: number;
  assessmentType?: { name: string };
  class?: { name: string };
  section?: { name: string } | null;
  subject?: { name: string };
  term?: { name: string } | null;
}

const STATUS_STYLES: Record<string, string> = {
  DRAFT: 'bg-warm-100 text-warm-700',
  SUBMITTED: 'bg-warning-100 text-warning-800',
  APPROVED: 'bg-success-100 text-success-800',
  PUBLISHED: 'bg-success-100 text-success-800',
  LOCKED: 'bg-charcoal-100 text-charcoal-800',
};

const SCORE_STATUSES = ['NOT_ENTERED', 'SUBMITTED', 'ABSENT', 'EXCUSED', 'EXEMPTED'];

export default function AssessmentScoresPage() {
  const params = useParams();
  const rawId = params?.id;
  const assessmentId = Array.isArray(rawId) ? rawId[0] : rawId;
  const { user, activeSchoolId } = useAuth();
  const roles = useMemo(() => collectUserRoles(user, activeSchoolId), [user, activeSchoolId]);
  const canManage = roles.some((role) => ['SCHOOL_ADMIN', 'PRINCIPAL', 'TEACHER'].includes(role));

  const [assessment, setAssessment] = useState<AssessmentInfo | null>(null);
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [busy, setBusy] = useState(false);
  const [dirty, setDirty] = useState(false);

  const load = useCallback(async () => {
    if (!assessmentId) return;
    setLoading(true);
    setError('');
    try {
      const data = await apiFetch(`/assessments/${assessmentId}/scores`);
      setAssessment(data.assessment);
      const saved = new Map<string, any>(
        (data.scores ?? []).map((score: any) => [score.studentId, score]),
      );
      const list: Row[] = (data.students ?? []).map((entry: any) => {
        const score = saved.get(entry.student.id);
        return {
          studentId: entry.student.id,
          student: entry.student,
          rawScore: score?.rawScore == null ? '' : String(score.rawScore),
          status: score?.status ?? 'NOT_ENTERED',
          remarks: score?.remarks ?? '',
          saved: Boolean(score),
        };
      });
      setRows(list);
      setDirty(false);
    } catch (err: any) {
      setAssessment(null);
      setRows([]);
      setError(err?.message || 'Could not load the score sheet.');
    } finally {
      setLoading(false);
    }
  }, [assessmentId]);

  useEffect(() => {
    load();
  }, [load]);

  const totalMarks = Number(assessment?.totalMarks ?? 0);
  const locked = assessment?.status === 'LOCKED' || assessment?.status === 'PUBLISHED';

  function updateRow(studentId: string, patch: Partial<Row>) {
    setRows((previous) =>
      previous.map((row) => (row.studentId === studentId ? { ...row, ...patch } : row)),
    );
    setDirty(true);
  }

  function validate(): string | null {
    for (const row of rows) {
      if (row.rawScore === '') continue;
      const value = Number(row.rawScore);
      if (Number.isNaN(value)) return `Enter a valid score for ${row.student.firstName} ${row.student.lastName}.`;
      if (value < 0 || value > totalMarks) {
        return `Score for ${row.student.firstName} ${row.student.lastName} must be between 0 and ${totalMarks}.`;
      }
    }
    return null;
  }

  async function saveScores() {
    if (saving || !assessmentId) return;
    const problem = validate();
    if (problem) {
      showFeedback('ERROR', problem);
      return;
    }
    setSaving(true);
    try {
      const scores = rows
        .filter((row) => row.rawScore !== '' || row.status !== 'NOT_ENTERED')
        .map((row) => ({
          studentId: row.studentId,
          rawScore: row.rawScore === '' ? undefined : Number(row.rawScore),
          status: row.status === 'NOT_ENTERED' ? undefined : row.status,
          remarks: row.remarks.trim() || undefined,
        }));
      await apiFetch(`/assessments/${assessmentId}/bulk-mark`, {
        method: 'POST',
        body: JSON.stringify({ scores }),
      });
      showFeedback('SUCCESS', `Saved ${scores.length} score${scores.length === 1 ? '' : 's'}.`);
      await load();
    } catch (err: any) {
      showFeedback('ERROR', err?.message || 'Could not save the scores.');
    } finally {
      setSaving(false);
    }
  }

  async function changeStatus(action: 'submit' | 'publish') {
    if (!assessmentId || busy) return;
    if (dirty) {
      showFeedback('WARNING', 'Save the scores before changing the assessment status.');
      return;
    }
    if (action === 'publish' && !window.confirm('Publish this assessment? Scores will become visible in results.')) {
      return;
    }
    setBusy(true);
    try {
      await apiFetch(`/assessments/${assessmentId}/${action}`, { method: 'POST' });
      showFeedback('SUCCESS', action === 'submit' ? 'Assessment submitted.' : 'Assessment published.');
      await load();
    } catch (err: any) {
      showFeedback('ERROR', err?.message || 'Could not update the assessment status.');
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 py-20 text-sm font-medium text-warm-500">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading score sheet…
      </div>
    );
  }

  if (error || !assessment) {
    return (
      <div className="mx-auto max-w-lg space-y-4 py-16 text-center">
        <h1 className="text-xl font-bold text-charcoal-900">Assessment not available</h1>
        <p className="text-sm text-warm-500">{error || 'This assessment could not be found.'}</p>
        <div className="flex flex-col justify-center gap-3 sm:flex-row">
          <Button variant="outline" onClick={load} leftIcon={<RefreshCw size={16} />}>
            Try again
          </Button>
          <Link href="/dashboard/assessments/list">
            <Button>Back to assessments</Button>
          </Link>
        </div>
      </div>
    );
  }

  const entered = rows.filter((row) => row.saved).length;

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Link
          href="/dashboard/assessments/list"
          className="inline-flex items-center gap-2 text-xs font-semibold text-warm-600 hover:text-charcoal-900"
        >
          <ArrowLeft size={16} /> Back to assessments
        </Link>
        <Button
          variant="outline"
          size="sm"
          onClick={load}
          disabled={loading || saving}
          leftIcon={<RefreshCw size={14} className={loading ? 'animate-spin' : undefined} />}
        >
          Refresh
        </Button>
      </div>

      <section className="rounded-2xl border border-warm-200 bg-card p-5 shadow-xs sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-charcoal-900 sm:text-2xl">
                {assessment.name}
              </h1>
              <span
                className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase ${
                  STATUS_STYLES[assessment.status] ?? 'bg-warm-100 text-warm-700'
                }`}
              >
                {assessment.status.replaceAll('_', ' ')}
              </span>
            </div>
            <p className="mt-1 text-xs text-warm-500">
              {assessment.class?.name ?? '—'}
              {assessment.section ? ` · ${assessment.section.name}` : ''} ·{' '}
              {assessment.subject?.name ?? '—'} · {assessment.assessmentType?.name ?? 'Assessment'}
              {assessment.term?.name ? ` · ${assessment.term.name}` : ''}
            </p>
            <p className="mt-1 font-mono text-[11px] text-warm-400">
              {assessment.code} · out of {totalMarks} marks · weight {Number(assessment.weight ?? 1).toFixed(2)}
            </p>
          </div>

          {canManage && (
            <div className="flex flex-wrap gap-2">
              {!locked && (
                <Button
                  onClick={saveScores}
                  isLoading={saving}
                  disabled={rows.length === 0}
                  leftIcon={<Save size={16} />}
                >
                  Save scores
                </Button>
              )}
              {assessment.status === 'DRAFT' && (
                <Button
                  variant="outline"
                  onClick={() => changeStatus('submit')}
                  isLoading={busy}
                  leftIcon={<Send size={16} />}
                >
                  Submit
                </Button>
              )}
              {['SUBMITTED', 'UNDER_REVIEW', 'APPROVED'].includes(assessment.status) && (
                <Button
                  variant="outline"
                  onClick={() => changeStatus('publish')}
                  isLoading={busy}
                  leftIcon={<UploadCloud size={16} />}
                >
                  Publish
                </Button>
              )}
            </div>
          )}
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Metric label="Students" value={String(rows.length)} />
          <Metric label="Entered" value={String(entered)} />
          <Metric label="Total marks" value={String(totalMarks)} />
          <Metric
            label="Average"
            value={
              rows.filter((row) => row.rawScore !== '').length
                ? `${(
                    rows.reduce((sum, row) => sum + Number(row.rawScore || 0), 0) /
                    Math.max(1, rows.filter((row) => row.rawScore !== '').length)
                  ).toFixed(1)}`
                : '—'
            }
          />
        </div>
      </section>

      {locked && (
        <div className="rounded-xl border border-warning-200 bg-warning-50 p-3 text-xs font-semibold text-warning-800">
          This assessment is {assessment.status.toLowerCase()}. Scores are read-only.
        </div>
      )}

      {rows.length === 0 ? (
        <EmptyState
          icon={<Users className="h-8 w-8" />}
          title="No eligible students"
          description="No active enrollments match this assessment's class, section and academic year. Enroll students first, then return to enter scores."
          actionButton={
            <Link href="/dashboard/academics/enrollments">
              <Button variant="outline">Go to enrollments</Button>
            </Link>
          }
        />
      ) : (
        <div className="overflow-hidden rounded-xl border border-warm-200 bg-card shadow-xs">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-warm-200">
              <caption className="sr-only">Student scores for {assessment.name}</caption>
              <thead className="bg-ivory-50">
                <tr>
                  {['Student', `Score (0–${totalMarks})`, 'Status', 'Remarks'].map((heading) => (
                    <th
                      key={heading}
                      scope="col"
                      className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wide text-warm-500 sm:px-5"
                    >
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-warm-100">
                {rows.map((row) => (
                  <tr key={row.studentId} className="hover:bg-sage-50/30">
                    <td className="whitespace-nowrap px-4 py-3 sm:px-5">
                      <p className="text-sm font-semibold text-charcoal-900">
                        {row.student.lastName}, {row.student.firstName}
                      </p>
                      <p className="font-mono text-[11px] text-warm-500">{row.student.studentNumber}</p>
                    </td>
                    <td className="px-4 py-3 sm:px-5">
                      <div className="w-32">
                        <Input
                          type="number"
                          min={0}
                          max={totalMarks}
                          step="0.5"
                          aria-label={`Score for ${row.student.firstName} ${row.student.lastName}`}
                          value={row.rawScore}
                          disabled={locked || !canManage}
                          placeholder="—"
                          onChange={(event) =>
                            updateRow(row.studentId, {
                              rawScore: event.target.value,
                              status:
                                event.target.value === '' && row.status === 'NOT_ENTERED'
                                  ? 'NOT_ENTERED'
                                  : row.status === 'NOT_ENTERED'
                                    ? 'SUBMITTED'
                                    : row.status,
                            })
                          }
                        />
                      </div>
                    </td>
                    <td className="px-4 py-3 sm:px-5">
                      <div className="w-40">
                        <Select
                          aria-label={`Score status for ${row.student.firstName} ${row.student.lastName}`}
                          value={row.status}
                          disabled={locked || !canManage}
                          options={SCORE_STATUSES.map((status) => ({
                            value: status,
                            label: status.replaceAll('_', ' '),
                          }))}
                          onChange={(event) => updateRow(row.studentId, { status: event.target.value })}
                        />
                      </div>
                    </td>
                    <td className="px-4 py-3 sm:px-5">
                      <Input
                        aria-label={`Remarks for ${row.student.firstName} ${row.student.lastName}`}
                        placeholder="Optional remark"
                        value={row.remarks}
                        disabled={locked || !canManage}
                        onChange={(event) => updateRow(row.studentId, { remarks: event.target.value })}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {canManage && !locked && (
            <div className="flex flex-col gap-2 border-t border-warm-100 bg-ivory-50/60 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
              <p className="flex items-center gap-1.5 text-xs text-warm-500">
                <BarChart3 size={14} />
                {dirty ? 'You have unsaved score changes.' : 'All changes saved.'}
              </p>
              <Button
                size="sm"
                onClick={saveScores}
                isLoading={saving}
                leftIcon={<Save size={14} />}
              >
                Save scores
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-warm-100 bg-ivory-50 px-3 py-2">
      <p className="text-[10px] font-bold uppercase tracking-wide text-warm-500">{label}</p>
      <p className="mt-0.5 text-sm font-bold text-charcoal-900">{value}</p>
    </div>
  );
}
