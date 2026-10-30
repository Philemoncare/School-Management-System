'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { apiFetch } from '@/lib/api/client';
import { Button } from '@/components/ui/button';
import {
  ChevronLeft,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Loader2,
  History,
  Info,
  GitBranch,
} from 'lucide-react';

export default function WorkflowDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [workflow, setWorkflow] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadWorkflow = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await apiFetch(`/operations/workflows/${id}`);
      setWorkflow(data);
    } catch (err: any) {
      setWorkflow(null);
      setError(err?.message || 'Could not load this workflow.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadWorkflow();
  }, [loadWorkflow]);

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-3 p-20 text-sm font-medium text-warm-500">
        <Loader2 className="h-5 w-5 animate-spin text-forest-700" /> Loading workflow…
      </div>
    );
  }

  if (error || !workflow) {
    return (
      <div className="mx-auto max-w-3xl space-y-5 p-4 sm:p-6 lg:p-8">
        <Link
          href="/dashboard/operations/workflows"
          className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-forest-700"
        >
          <ChevronLeft size={16} /> Back to workflows
        </Link>
        <div
          role="alert"
          className="flex flex-col gap-3 rounded-2xl border border-danger-200 bg-danger-50 p-4 text-xs font-semibold text-danger-700 sm:flex-row sm:items-center sm:justify-between"
        >
          <span className="flex items-center gap-2">
            <AlertTriangle size={16} /> {error || 'Workflow not found.'}
          </span>
          <Button variant="outline" size="sm" onClick={loadWorkflow}>
            Try again
          </Button>
        </div>
      </div>
    );
  }

  const steps = Array.isArray(workflow.steps) ? workflow.steps : [];
  const failedSteps = steps.filter((step: any) => step.status === 'FAILED');
  const completedSteps = steps.filter((step: any) => step.status === 'COMPLETED').length;

  return (
    <div className="mx-auto max-w-5xl space-y-8 p-4 sm:p-6 lg:p-8">
      <div className="flex items-start gap-4 sm:gap-6">
        <Link
          href="/dashboard/operations/workflows"
          aria-label="Back to workflows"
          className="rounded-2xl border border-warm-200 bg-card p-3 text-warm-400 shadow-sm transition-all hover:text-forest-700"
        >
          <ChevronLeft size={20} />
        </Link>
        <div className="min-w-0">
          <h1 className="flex flex-wrap items-center gap-3 text-2xl font-semibold tracking-tight text-charcoal-900 sm:text-3xl">
            {String(workflow.workflowType).replace(/_/g, ' ')}
            <span
              className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-wide ${
                workflow.status === 'COMPLETED'
                  ? 'bg-success-50 text-success-700'
                  : workflow.status === 'FAILED'
                    ? 'bg-danger-50 text-danger-700'
                    : 'bg-sage-50 text-forest-800'
              }`}
            >
              {String(workflow.status).replace(/_/g, ' ')}
            </span>
          </h1>
          <p className="mt-1 flex flex-wrap items-center gap-2 text-[11px] font-bold uppercase tracking-wide text-warm-500">
            <span className="font-mono normal-case text-forest-700">{workflow.id}</span>
            <span aria-hidden="true">•</span>
            Started {new Date(workflow.createdAt).toLocaleString()}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <MetricTile label="Steps complete" value={`${completedSteps} / ${steps.length}`} />
        <MetricTile label="Failed steps" value={String(failedSteps.length)} danger={failedSteps.length > 0} />
        <MetricTile
          label="Last update"
          value={new Date(workflow.updatedAt).toLocaleTimeString()}
          className="col-span-2 sm:col-span-1"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <section className="rounded-xl border border-warm-200 bg-card p-5 shadow-sm sm:p-8">
            <h2 className="mb-8 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-charcoal-900">
              <History size={16} className="text-forest-700" /> Execution timeline
            </h2>

            {steps.length === 0 ? (
              <p className="rounded-xl border border-warm-100 bg-ivory-50 p-4 text-xs font-semibold text-warm-500">
                This workflow has no recorded steps. It was created without a step definition.
              </p>
            ) : (
              <div className="space-y-0">
                {steps.map((step: any, index: number) => (
                  <div key={step.id} className="relative flex gap-5 pb-8 last:pb-0 sm:gap-6">
                    {index < steps.length - 1 && (
                      <div
                        className={`absolute bottom-0 left-4 top-8 w-0.5 ${
                          step.status === 'COMPLETED' ? 'bg-success-500' : 'bg-warm-100'
                        }`}
                      />
                    )}
                    <div
                      className={`z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border-2 ${
                        step.status === 'COMPLETED'
                          ? 'border-success-500 bg-success-500 text-white shadow-lg shadow-success-100'
                          : step.status === 'FAILED'
                            ? 'border-danger-500 bg-danger-500 text-white shadow-lg shadow-danger-100'
                            : step.status === 'IN_PROGRESS'
                              ? 'animate-pulse border-forest-500 bg-forest-500 text-white shadow-lg shadow-sage-100'
                              : 'border-warm-100 bg-card text-warm-300'
                      }`}
                    >
                      {step.status === 'COMPLETED' ? (
                        <CheckCircle size={16} />
                      ) : step.status === 'FAILED' ? (
                        <XCircle size={16} />
                      ) : step.status === 'IN_PROGRESS' ? (
                        <Clock size={16} />
                      ) : (
                        <span className="h-1.5 w-1.5 rounded-full bg-warm-200" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1 pt-1">
                      <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0">
                          <p
                            className={`text-sm font-semibold uppercase tracking-wide ${
                              step.status === 'COMPLETED' ? 'text-charcoal-900' : 'text-warm-500'
                            }`}
                          >
                            {String(step.name).replace(/_/g, ' ')}
                          </p>
                          <p className="mt-0.5 text-[10px] font-bold uppercase tracking-wide text-warm-400">
                            Order {step.order + 1} • {String(step.status).replace(/_/g, ' ')}
                          </p>
                          {step.errorInfo && (
                            <p className="mt-2 rounded-xl border border-danger-100 bg-danger-50 p-3 text-[11px] font-semibold text-danger-700">
                              {step.errorInfo}
                            </p>
                          )}
                        </div>
                        {step.completedAt && (
                          <p className="shrink-0 text-[11px] font-semibold uppercase tracking-wide text-warm-400">
                            {new Date(step.completedAt).toLocaleTimeString()}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {workflow.status === 'FAILED' && (
            <section
              role="alert"
              className="rounded-xl border border-danger-200 bg-danger-50 p-5 sm:p-6"
            >
              <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-danger-700">
                <AlertTriangle size={16} /> What happens next
              </h2>
              <p className="mt-3 text-xs font-semibold leading-relaxed text-danger-700">
                This workflow stopped because one or more steps failed. There is no automatic retry
                worker in this deployment, so failed steps cannot be re-queued from here.
              </p>
              <ol className="mt-3 list-decimal space-y-1.5 pl-5 text-xs font-medium leading-relaxed text-danger-700">
                <li>Review the error message shown against each failed step above.</li>
                <li>Correct the underlying record (for example a missing class or guardian).</li>
                <li>Repeat the original action that started this workflow to create a fresh run.</li>
              </ol>
            </section>
          )}
        </div>

        <div className="space-y-6">
          <section className="rounded-xl bg-charcoal-900 p-5 text-white shadow-sm sm:p-8">
            <h2 className="mb-6 flex items-center gap-2 text-lg font-semibold tracking-tight">
              <Info size={20} className="text-sage-400" /> Context data
            </h2>
            {Object.keys(workflow.context || {}).length === 0 ? (
              <p className="rounded-xl border border-white/10 p-4 text-[11px] font-semibold text-warm-400">
                No context was captured for this workflow.
              </p>
            ) : (
              <div className="space-y-3">
                {Object.entries(workflow.context || {}).map(([key, value]: [string, any]) => (
                  <div key={key} className="rounded-2xl border border-white/5 bg-card/5 p-4">
                    <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-warm-400">
                      {key.replace(/_/g, ' ')}
                    </p>
                    <p className="break-all font-mono text-xs">
                      {value === null || value === undefined
                        ? '—'
                        : typeof value === 'object'
                          ? JSON.stringify(value, null, 2)
                          : String(value)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="rounded-xl border border-warm-200 bg-card p-5 shadow-sm sm:p-6">
            <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-charcoal-900">
              <GitBranch size={16} className="text-forest-700" /> Trace identifiers
            </h2>
            <dl className="space-y-3 text-[11px]">
              <TraceRow label="Workflow ID" value={workflow.id} />
              <TraceRow label="Correlation ID" value={workflow.correlationId} />
              <TraceRow label="Causation ID" value={workflow.causationId} />
            </dl>
          </section>
        </div>
      </div>
    </div>
  );
}

function MetricTile({
  label,
  value,
  danger,
  className = '',
}: {
  label: string;
  value: string;
  danger?: boolean;
  className?: string;
}) {
  return (
    <div className={`rounded-xl border border-warm-200 bg-card p-4 shadow-sm ${className}`}>
      <p className="text-[10px] font-semibold uppercase tracking-wide text-warm-400">{label}</p>
      <p
        className={`mt-1 text-lg font-semibold ${danger ? 'text-danger-600' : 'text-charcoal-900'}`}
      >
        {value}
      </p>
    </div>
  );
}

function TraceRow({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="font-semibold uppercase tracking-wide text-warm-400">{label}</dt>
      <dd className="break-all font-mono text-warm-700">{value || '—'}</dd>
    </div>
  );
}
