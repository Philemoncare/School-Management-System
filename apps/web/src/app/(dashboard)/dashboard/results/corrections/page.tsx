'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  FileSpreadsheet,
  Save,
  Search,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import { apiFetch } from '@/lib/api/client';
import { Input, Select } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { SkeletonTable } from '@/components/ui/loading-state';

interface SubjectResult {
  id: string;
  percentage: number;
  grade: string;
  student: { id: string; firstName: string; lastName: string; studentNumber: string };
  subject: { id: string; name: string };
  class: { id: string; name: string } | null;
}

interface CorrectionRequest {
  id: string;
  reason: string;
  previousScore: number;
  newScore: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'IMPLEMENTED';
  createdAt: string;
  student: { firstName: string; lastName: string; studentNumber: string };
  requestedBy: { firstName: string; lastName: string } | null;
  reviewedBy: { firstName: string; lastName: string } | null;
  subjectResult: {
    subject: { name: string };
    class: { name: string } | null;
    term: { name: string } | null;
    academicYear: { name: string } | null;
  } | null;
}

const STATUS_STYLES: Record<string, string> = {
  PENDING: 'bg-warning-100 text-warning-800',
  APPROVED: 'bg-sage-100 text-forest-800',
  IMPLEMENTED: 'bg-success-100 text-success-800',
  REJECTED: 'bg-danger-100 text-danger-800',
};

export default function ResultCorrectionsPage() {
  const [subjectResults, setSubjectResults] = useState<SubjectResult[]>([]);
  const [requests, setRequests] = useState<CorrectionRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingError, setLoadingError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({ subjectResultId: '', newScore: '', reason: '' });

  async function load() {
    setLoading(true);
    setLoadingError(null);
    try {
      const [results, existing] = await Promise.all([
        apiFetch('/results/subject-results'),
        apiFetch('/results/corrections'),
      ]);
      setSubjectResults(Array.isArray(results) ? results : []);
      setRequests(Array.isArray(existing) ? existing : []);
    } catch (err) {
      setLoadingError(err instanceof Error ? err.message : 'Could not load results or correction requests.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const filteredResults = useMemo(() => {
    const term = search.trim().toLowerCase();
    const list = term
      ? subjectResults.filter((result) => {
          const name = `${result.student.firstName} ${result.student.lastName}`.toLowerCase();
          return (
            name.includes(term) ||
            result.student.studentNumber?.toLowerCase().includes(term) ||
            result.subject.name.toLowerCase().includes(term)
          );
        })
      : subjectResults;
    return list.slice(0, 100);
  }, [subjectResults, search]);

  const selectedResult = subjectResults.find((result) => result.id === form.subjectResultId);

  const options = [
    { value: '', label: loading ? 'Loading results…' : 'Select a student and subject' },
    ...filteredResults.map((result) => ({
      value: result.id,
      label: `${result.student.lastName}, ${result.student.firstName} (${result.student.studentNumber}) — ${result.subject.name} — ${result.percentage.toFixed(1)}%`,
    })),
  ];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    setFeedback(null);

    if (!form.subjectResultId) {
      setFormError('Select the result you want to correct.');
      return;
    }
    const score = Number(form.newScore);
    if (!Number.isFinite(score) || score < 0 || score > 100) {
      setFormError('Enter a corrected score between 0 and 100.');
      return;
    }
    if (form.reason.trim().length < 5) {
      setFormError('Please provide a reason of at least 5 characters.');
      return;
    }

    setSubmitting(true);
    try {
      await apiFetch('/results/corrections', {
        method: 'POST',
        body: JSON.stringify({
          subjectResultId: form.subjectResultId,
          newScore: score,
          reason: form.reason.trim(),
        }),
      });
      setFeedback({ type: 'success', text: 'Correction request submitted and awaiting review.' });
      setForm({ subjectResultId: '', newScore: '', reason: '' });
      setSearch('');
      await load();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Could not submit the correction request.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDecision(id: string, decision: 'approve' | 'reject') {
    setProcessingId(id);
    setFeedback(null);
    try {
      await apiFetch(`/results/corrections/${id}/${decision}`, { method: 'PATCH' });
      setFeedback({
        type: 'success',
        text: decision === 'approve' ? 'Correction applied to the result.' : 'Correction request rejected.',
      });
      await load();
    } catch (err) {
      setFeedback({ type: 'error', text: err instanceof Error ? err.message : 'Could not process the request.' });
    } finally {
      setProcessingId(null);
    }
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
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
              <FileSpreadsheet className="text-forest-700" /> Result Corrections
            </h1>
            <p className="mt-0.5 text-xs font-medium text-warm-500 sm:text-sm">
              Submit a score adjustment for review, and track its approval trail.
            </p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={load} isLoading={loading} leftIcon={<RefreshCw size={15} />}>
          Refresh
        </Button>
      </div>

      {loadingError && (
        <div role="alert" className="flex items-start gap-3 rounded-xl border border-danger-200 bg-danger-50 px-4 py-3 text-sm font-medium text-danger-800">
          <AlertCircle size={18} className="mt-0.5 shrink-0" />
          <span>{loadingError}</span>
        </div>
      )}

      {feedback && (
        <div
          role="status"
          className={`rounded-xl border px-4 py-3 text-sm font-semibold ${
            feedback.type === 'success'
              ? 'border-success-200 bg-success-50 text-success-800'
              : 'border-danger-200 bg-danger-50 text-danger-800'
          }`}
        >
          {feedback.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5 rounded-2xl border border-warm-200 bg-card p-5 shadow-xs sm:p-6">
        <div>
          <h2 className="text-base font-bold text-charcoal-900">New correction request</h2>
          <p className="mt-0.5 text-xs text-warm-500">
            Only a result that already exists can be corrected. The current score is recorded for the audit trail.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            label="Find student or subject"
            placeholder="Search by name, student number or subject"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            leftIcon={<Search size={15} />}
          />
          <Select
            label="Result to correct *"
            value={form.subjectResultId}
            onChange={(e) => setForm({ ...form, subjectResultId: e.target.value })}
            options={options}
            required
          />
        </div>

        {selectedResult && (
          <div className="grid grid-cols-1 gap-3 rounded-xl border border-warm-200 bg-ivory-50 p-4 sm:grid-cols-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-warm-500">Student</p>
              <p className="text-sm font-semibold text-charcoal-900">
                {selectedResult.student.firstName} {selectedResult.student.lastName}
              </p>
              <p className="text-[11px] text-warm-500">{selectedResult.student.studentNumber}</p>
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-warm-500">Subject</p>
              <p className="text-sm font-semibold text-charcoal-900">{selectedResult.subject.name}</p>
              <p className="text-[11px] text-warm-500">{selectedResult.class?.name || 'No class'}</p>
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-warm-500">Current score</p>
              <p className="text-sm font-semibold text-charcoal-900">
                {selectedResult.percentage.toFixed(1)}% · Grade {selectedResult.grade}
              </p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Input
            label="Corrected score (%) *"
            type="number"
            min={0}
            max={100}
            step="0.1"
            required
            placeholder="e.g. 78"
            value={form.newScore}
            onChange={(e) => setForm({ ...form, newScore: e.target.value })}
          />
          <Input
            label="Reason for correction *"
            required
            placeholder="e.g. Mark tallying omission in paper 2"
            value={form.reason}
            onChange={(e) => setForm({ ...form, reason: e.target.value })}
            className="sm:col-span-2"
          />
        </div>

        {formError && (
          <p role="alert" className="rounded-lg border border-danger-200 bg-danger-50 px-3 py-2 text-xs font-semibold text-danger-800">
            {formError}
          </p>
        )}

        <div className="flex flex-col justify-end gap-3 border-t border-warm-100 pt-4 sm:flex-row">
          <Link
            href="/dashboard/results"
            className="rounded-xl border border-warm-200 px-5 py-2.5 text-center text-xs font-bold text-warm-600 transition-colors hover:bg-warm-50"
          >
            Cancel
          </Link>
          <Button type="submit" isLoading={submitting} leftIcon={<Save size={16} />}>
            Submit Request
          </Button>
        </div>
      </form>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-charcoal-900">Correction requests</h2>
          <span className="text-xs font-semibold text-warm-500">{requests.length} total</span>
        </div>

        {loading ? (
          <SkeletonTable />
        ) : requests.length === 0 ? (
          <EmptyState
            title="No correction requests"
            description="Requests submitted by teachers and administrators will appear here with their review status."
            icon={<FileSpreadsheet className="h-8 w-8" />}
          />
        ) : (
          <div className="overflow-hidden rounded-2xl border border-warm-200 bg-card shadow-xs">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-warm-200">
                <thead className="bg-ivory-50">
                  <tr>
                    <th className="px-4 py-3.5 text-left text-[11px] font-bold uppercase tracking-wide text-warm-400 sm:px-5">Student / Subject</th>
                    <th className="px-4 py-3.5 text-left text-[11px] font-bold uppercase tracking-wide text-warm-400 sm:px-5">Change</th>
                    <th className="px-4 py-3.5 text-left text-[11px] font-bold uppercase tracking-wide text-warm-400 sm:px-5">Reason</th>
                    <th className="px-4 py-3.5 text-left text-[11px] font-bold uppercase tracking-wide text-warm-400 sm:px-5">Status</th>
                    <th className="px-4 py-3.5 text-right text-[11px] font-bold uppercase tracking-wide text-warm-400 sm:px-5">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-warm-100 bg-card">
                  {requests.map((request) => (
                    <tr key={request.id} className="align-top transition-colors hover:bg-sage-50/30">
                      <td className="px-4 py-4 sm:px-5">
                        <p className="text-xs font-bold text-charcoal-900 sm:text-sm">
                          {request.student?.lastName}, {request.student?.firstName}
                        </p>
                        <p className="text-[11px] font-medium text-warm-500">
                          {request.subjectResult?.subject?.name || 'Unknown subject'}
                          {request.subjectResult?.class?.name ? ` · ${request.subjectResult.class.name}` : ''}
                        </p>
                        <p className="text-[11px] text-warm-400">
                          {request.subjectResult?.academicYear?.name}
                          {request.subjectResult?.term?.name ? ` · ${request.subjectResult.term.name}` : ''}
                        </p>
                      </td>
                      <td className="px-4 py-4 text-xs font-semibold text-charcoal-800 sm:px-5">
                        {request.previousScore.toFixed(1)}% → {request.newScore.toFixed(1)}%
                      </td>
                      <td className="max-w-[220px] px-4 py-4 text-xs text-warm-600 sm:px-5">
                        <p className="line-clamp-2">{request.reason}</p>
                        <p className="mt-1 text-[11px] text-warm-400">
                          by {request.requestedBy ? `${request.requestedBy.firstName} ${request.requestedBy.lastName}` : 'Unknown'}
                        </p>
                      </td>
                      <td className="px-4 py-4 sm:px-5">
                        <span className={`inline-block rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-tight ${STATUS_STYLES[request.status] || 'bg-warm-100 text-warm-700'}`}>
                          {request.status}
                        </span>
                        {request.reviewedBy && (
                          <p className="mt-1 text-[11px] text-warm-400">
                            by {request.reviewedBy.firstName} {request.reviewedBy.lastName}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-4 text-right sm:px-5">
                        {request.status === 'PENDING' ? (
                          <div className="flex flex-col items-end gap-2 sm:flex-row sm:justify-end">
                            <Button
                              size="xs"
                              variant="success"
                              isLoading={processingId === request.id}
                              leftIcon={<CheckCircle size={14} />}
                              onClick={() => handleDecision(request.id, 'approve')}
                            >
                              Approve
                            </Button>
                            <Button
                              size="xs"
                              variant="outline"
                              disabled={processingId === request.id}
                              leftIcon={<XCircle size={14} />}
                              onClick={() => handleDecision(request.id, 'reject')}
                            >
                              Reject
                            </Button>
                          </div>
                        ) : (
                          <span className="text-[11px] font-semibold text-warm-400">
                            {request.status === 'IMPLEMENTED' ? 'Applied to result' : 'Closed'}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>

      {submitting && (
        <p className="flex items-center justify-center gap-2 text-xs font-semibold text-warm-500">
          <Loader2 size={14} className="animate-spin" /> Submitting request…
        </p>
      )}
    </div>
  );
}
