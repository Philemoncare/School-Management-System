'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { apiFetch } from '@/lib/api/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { EmptyState } from '@/components/ui/empty-state';
import { showFeedback } from '@/components/layout/global-feedback';
import {
  User,
  FileText,
  Mail,
  Phone,
  ShieldCheck,
  ChevronLeft,
  Loader2,
  CheckCircle,
  XCircle,
  AlertCircle,
  ClipboardList,
  Users,
  Download,
} from 'lucide-react';
import Link from 'next/link';

type DecisionIntent = 'ADMIT' | 'REJECT' | 'WAITLIST';

const DECIDABLE_STATUSES = [
  'SUBMITTED',
  'UNDER_REVIEW',
  'SCREENING',
  'INTERVIEW_SCHEDULED',
  'ASSESSMENT_PENDING',
  'ASSESSMENT_COMPLETED',
  'DOCUMENTS_REQUIRED',
];

function formatDate(value: unknown) {
  if (!value) return '—';
  const date = new Date(value as string);
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleDateString();
}

function formatDateTime(value: unknown) {
  if (!value) return '—';
  const date = new Date(value as string);
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleString();
}

function personName(person: any) {
  if (!person) return '—';
  return `${person.firstName ?? ''} ${person.lastName ?? ''}`.trim() || person.email || '—';
}

export default function ApplicationDetailPage() {
  const { applicationId } = useParams<{ applicationId: string }>();
  const [application, setApplication] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [decisionIntent, setDecisionIntent] = useState<DecisionIntent | null>(null);
  const [offerOpen, setOfferOpen] = useState(false);

  const loadApplication = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await apiFetch(`/admissions/applications/${applicationId}`);
      setApplication(data);
    } catch (err: any) {
      setApplication(null);
      setError(err?.message || 'Could not load this application.');
    } finally {
      setLoading(false);
    }
  }, [applicationId]);

  useEffect(() => {
    loadApplication();
  }, [loadApplication]);

  async function runAction(action: () => Promise<unknown>, successMessage: string) {
    if (submitting) return;
    setSubmitting(true);
    try {
      await action();
      showFeedback('SUCCESS', successMessage);
      await loadApplication();
    } catch (err: any) {
      showFeedback('ERROR', err?.message || 'The action could not be completed.');
    } finally {
      setSubmitting(false);
    }
  }

  async function acceptOffer(offerId: string) {
    if (!window.confirm('Record that the guardian accepted this admission offer?')) return;
    await runAction(
      () => apiFetch(`/admissions/offers/${offerId}/accept`, { method: 'POST' }),
      'Offer accepted. The application is ready for final enrollment.',
    );
  }

  async function confirmAdmission() {
    if (
      !window.confirm(
        'This creates the official student record, guardian links and enrollment. This cannot be undone. Proceed?',
      )
    ) {
      return;
    }
    await runAction(
      () => apiFetch(`/admissions/applications/${applicationId}/confirm`, { method: 'POST' }),
      'Admission confirmed. The student record has been created.',
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-3 p-16 text-sm font-medium text-warm-500">
        <Loader2 className="h-5 w-5 animate-spin text-forest-700" /> Loading application…
      </div>
    );
  }

  if (error || !application) {
    return (
      <div className="space-y-5 p-4 sm:p-6 lg:p-8">
        <Link
          href="/dashboard/admissions/applications"
          className="inline-flex items-center gap-2 text-sm font-semibold text-forest-700"
        >
          <ChevronLeft size={16} /> Back to applications
        </Link>
        <div
          role="alert"
          className="flex flex-col gap-3 rounded-2xl border border-danger-200 bg-danger-50 p-4 text-xs font-semibold text-danger-700 sm:flex-row sm:items-center sm:justify-between"
        >
          <span className="flex items-center gap-2">
            <AlertCircle size={16} /> {error || 'Application not found.'}
          </span>
          <Button variant="outline" size="sm" onClick={loadApplication}>
            Try again
          </Button>
        </div>
      </div>
    );
  }

  const status = String(application.status);
  const canDecide = DECIDABLE_STATUSES.includes(status);
  const canIssueOffer =
    ['DECISION_PENDING', 'WAITLISTED', 'UNDER_REVIEW'].includes(status) &&
    !(application.offers ?? []).some((offer: any) => offer.status === 'ISSUED');
  const issuedOffer = (application.offers ?? []).find((offer: any) => offer.status === 'ISSUED');
  const canConfirm = status === 'ACCEPTED';
  const documents: any[] = application.documents ?? [];
  const guardians: any[] = application.guardians ?? [];
  const decisions: any[] = application.decisions ?? [];
  const offers: any[] = application.offers ?? [];

  return (
    <div className="space-y-8 p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex min-w-0 items-start gap-4">
          <Link
            href="/dashboard/admissions/applications"
            aria-label="Back to applications"
            className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-warm-200 bg-card text-warm-400 shadow-sm transition-all hover:text-forest-700"
          >
            <ChevronLeft size={20} />
          </Link>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="truncate text-2xl font-semibold tracking-tight text-charcoal-900 sm:text-3xl">
                {application.firstName} {application.lastName}
              </h1>
              <StatusBadge status={status} />
            </div>
            <p className="mt-1 flex flex-wrap items-center gap-2 text-[11px] font-bold uppercase tracking-wide text-warm-500">
              Ref: <span className="font-mono text-forest-700">{application.reference}</span> • Submitted{' '}
              {formatDate(application.submissionDate)}
              {application.class?.name ? ` • Requested ${application.class.name}` : ''}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {application.studentId && (
            <Link
              href={`/dashboard/students/${application.studentId}`}
              className="inline-flex items-center gap-2 rounded-xl border border-warm-200 bg-card px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-forest-700 hover:bg-ivory-50"
            >
              <User size={14} /> Student record
            </Link>
          )}
          {canDecide && (
            <>
              <Button
                variant="outline"
                disabled={submitting}
                onClick={() => setDecisionIntent('REJECT')}
                leftIcon={<XCircle size={15} />}
              >
                Reject
              </Button>
              <Button
                variant="outline"
                disabled={submitting}
                onClick={() => setDecisionIntent('WAITLIST')}
              >
                Waitlist
              </Button>
              <Button
                disabled={submitting}
                isLoading={submitting}
                onClick={() => setDecisionIntent('ADMIT')}
                leftIcon={<CheckCircle size={15} />}
              >
                Recommend admission
              </Button>
            </>
          )}
          {canIssueOffer && (
            <Button onClick={() => setOfferOpen(true)} leftIcon={<ClipboardList size={15} />}>
              Issue admission offer
            </Button>
          )}
          {issuedOffer && (
            <Button
              variant="outline"
              disabled={submitting}
              isLoading={submitting}
              onClick={() => acceptOffer(issuedOffer.id)}
            >
              Record offer acceptance
            </Button>
          )}
          {canConfirm && (
            <Button
              variant="success"
              disabled={submitting}
              isLoading={submitting}
              onClick={confirmAdmission}
              leftIcon={<ShieldCheck size={15} />}
            >
              Complete final enrollment
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <section className="rounded-xl border border-warm-200 bg-card p-5 shadow-sm sm:p-6">
            <h2 className="mb-6 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-charcoal-900">
              <User size={16} className="text-forest-700" /> Applicant bio-data
            </h2>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <ProfileField
                label="Full name"
                value={`${application.firstName} ${application.middleName || ''} ${application.lastName}`}
              />
              <ProfileField label="Date of birth" value={formatDate(application.dateOfBirth)} />
              <ProfileField label="Gender" value={application.gender} />
              <ProfileField label="Requested class" value={application.class?.name} />
              <ProfileField label="Academic year" value={application.academicYear?.name} />
              <ProfileField label="Admission campaign" value={application.campaign?.name} />
              <ProfileField label="Email" value={application.email} />
              <ProfileField label="Phone" value={application.phone} />
            </div>
            {application.notes && (
              <div className="mt-6 rounded-xl bg-ivory-50 p-4">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-warm-400">Notes</p>
                <p className="mt-1 text-sm font-medium text-warm-600">{application.notes}</p>
              </div>
            )}
          </section>

          <section className="rounded-xl border border-warm-200 bg-card p-5 shadow-sm sm:p-6">
            <h2 className="mb-6 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-charcoal-900">
              <Users size={16} className="text-terracotta-600" /> Guardian contacts
            </h2>
            {guardians.length === 0 ? (
              <EmptyState
                icon={<Users className="h-7 w-7" />}
                title="No guardian recorded"
                description="This application arrived without guardian contact details."
              />
            ) : (
              <div className="space-y-3">
                {guardians.map((guardian) => (
                  <div
                    key={guardian.id}
                    className="flex flex-col gap-3 rounded-xl border border-warm-100 bg-ivory-50 p-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="flex min-w-0 items-center gap-4">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-card text-xs font-semibold text-warm-400 shadow-sm">
                        {guardian.firstName?.[0]}
                        {guardian.lastName?.[0]}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-charcoal-900">
                          {guardian.firstName} {guardian.lastName}
                        </p>
                        <p className="text-[11px] font-bold uppercase tracking-tight text-warm-400">
                          {guardian.relationship}
                          {guardian.isPrimary ? ' • Primary' : ''}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                      <div className="mr-2 text-right">
                        <p className="text-[11px] font-semibold text-charcoal-900">{guardian.email || '—'}</p>
                        <p className="text-[11px] font-bold uppercase text-warm-400">{guardian.phone || '—'}</p>
                      </div>
                      {guardian.email && (
                        <a
                          href={`mailto:${guardian.email}`}
                          aria-label={`Email ${guardian.firstName} ${guardian.lastName}`}
                          className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-warm-200 bg-card text-warm-500 transition-all hover:text-forest-700"
                        >
                          <Mail size={15} />
                        </a>
                      )}
                      {guardian.phone && (
                        <a
                          href={`tel:${guardian.phone}`}
                          aria-label={`Call ${guardian.firstName} ${guardian.lastName}`}
                          className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-warm-200 bg-card text-warm-500 transition-all hover:text-forest-700"
                        >
                          <Phone size={15} />
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="rounded-xl border border-warm-200 bg-card p-5 shadow-sm sm:p-6">
            <h2 className="mb-5 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-charcoal-900">
              <ClipboardList size={16} className="text-forest-700" /> Decision history
            </h2>
            {decisions.length === 0 ? (
              <p className="rounded-lg border border-dashed border-warm-200 p-6 text-center text-[11px] font-semibold uppercase tracking-wide text-warm-400">
                No decisions recorded yet
              </p>
            ) : (
              <div className="space-y-2">
                {decisions.map((decision) => (
                  <div
                    key={decision.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-warm-100 bg-ivory-50/60 p-4"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-charcoal-900">
                        {String(decision.decision).replace(/_/g, ' ')}
                      </p>
                      <p className="text-[11px] font-bold uppercase tracking-tight text-warm-400">
                        {personName(decision.decisionMaker)} • {formatDateTime(decision.decisionDate)}
                      </p>
                      {decision.reason && (
                        <p className="mt-1 text-[11px] font-medium text-warm-500">{decision.reason}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        <div className="space-y-6">
          <section className="rounded-xl border border-warm-200 bg-card p-5 shadow-sm sm:p-6">
            <h2 className="mb-5 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-charcoal-900">
              <FileText size={16} className="text-warning-600" /> Documents
            </h2>
            {documents.length === 0 ? (
              <p className="rounded-lg border border-dashed border-warm-200 p-6 text-center text-[11px] font-semibold uppercase tracking-wide text-warm-400">
                No documents uploaded
              </p>
            ) : (
              <div className="space-y-3">
                {documents.map((document) => (
                  <div
                    key={document.id}
                    className="flex items-center justify-between gap-3 rounded-xl border border-warm-100 bg-ivory-50 p-3"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-xs font-bold text-warm-700">{document.title}</p>
                      <p className="text-[10px] font-semibold uppercase tracking-tight text-warm-400">
                        {String(document.documentType ?? 'Document').replace(/_/g, ' ')}
                        {document.verificationStatus
                          ? ` • ${String(document.verificationStatus).replace(/_/g, ' ')}`
                          : ''}
                      </p>
                    </div>
                    {document.fileUrl ? (
                      <a
                        href={document.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={`Open ${document.title}`}
                        className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-warm-200 bg-card text-forest-700 transition-all hover:bg-sage-50"
                      >
                        <Download size={14} />
                      </a>
                    ) : (
                      <span className="shrink-0 rounded-lg bg-warm-100 px-2 py-1 text-[9px] font-semibold uppercase tracking-wide text-warm-400">
                        No file
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="rounded-xl border border-warm-200 bg-card p-5 shadow-sm sm:p-6">
            <h2 className="mb-5 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-charcoal-900">
              <ClipboardList size={16} className="text-terracotta-600" /> Admission offers
            </h2>
            {offers.length === 0 ? (
              <p className="rounded-lg border border-dashed border-warm-200 p-6 text-center text-[11px] font-semibold uppercase tracking-wide text-warm-400">
                No offer issued
              </p>
            ) : (
              <div className="space-y-3">
                {offers.map((offer) => (
                  <div key={offer.id} className="rounded-xl border border-warm-100 bg-ivory-50 p-4">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-mono text-xs font-semibold text-forest-700">{offer.reference}</p>
                      <span className="rounded-full bg-card px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-warm-500">
                        {String(offer.status).replace(/_/g, ' ')}
                      </span>
                    </div>
                    <p className="mt-2 text-[11px] font-semibold text-warm-500">
                      Expires {formatDate(offer.expiryDate)}
                      {offer.acceptanceDate ? ` • Accepted ${formatDate(offer.acceptanceDate)}` : ''}
                    </p>
                    {offer.conditions && (
                      <p className="mt-2 text-[11px] font-medium text-warm-500">{offer.conditions}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="rounded-xl bg-charcoal-900 p-5 text-white shadow-sm sm:p-6">
            <h2 className="mb-6 text-sm font-semibold uppercase tracking-wide">Processing pipeline</h2>
            <div className="space-y-6">
              <TimelineItem active label="Submission received" time={formatDateTime(application.submissionDate)} />
              <TimelineItem active={decisions.length > 0} label="Decision recorded" />
              <TimelineItem
                active={['OFFERED', 'ACCEPTED', 'ENROLLED'].includes(status)}
                label="Admission offer"
              />
              <TimelineItem active={['ACCEPTED', 'ENROLLED'].includes(status)} label="Offer accepted" />
              <TimelineItem active={status === 'ENROLLED'} label="Enrolled student" last />
            </div>
          </section>
        </div>
      </div>

      {decisionIntent && (
        <DecisionModal
          intent={decisionIntent}
          applicationId={applicationId}
          applicantName={`${application.firstName} ${application.lastName}`}
          onClose={() => setDecisionIntent(null)}
          onSaved={(message) => {
            setDecisionIntent(null);
            showFeedback('SUCCESS', message);
            loadApplication();
          }}
        />
      )}

      {offerOpen && (
        <OfferModal
          applicationId={applicationId}
          className={application.class?.name}
          onClose={() => setOfferOpen(false)}
          onSaved={() => {
            setOfferOpen(false);
            showFeedback('SUCCESS', 'Admission offer issued.');
            loadApplication();
          }}
        />
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    SUBMITTED: 'bg-sage-50 text-forest-800',
    UNDER_REVIEW: 'bg-warning-50 text-warning-700',
    SCREENING: 'bg-warning-50 text-warning-700',
    INTERVIEW_SCHEDULED: 'bg-warning-50 text-warning-700',
    DOCUMENTS_REQUIRED: 'bg-danger-50 text-danger-700',
    DECISION_PENDING: 'bg-terracotta-50 text-terracotta-700',
    OFFERED: 'bg-terracotta-50 text-terracotta-700',
    ACCEPTED: 'bg-sage-50 text-forest-700',
    WAITLISTED: 'bg-warm-100 text-warm-600',
    REJECTED: 'bg-warm-100 text-warm-500',
    ENROLLED: 'bg-success-600 text-white shadow-md',
  };

  return (
    <span
      className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-wide ${
        styles[status] || 'bg-ivory-50 text-warm-500'
      }`}
    >
      {status.replace(/_/g, ' ')}
    </span>
  );
}

function ProfileField({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="space-y-1.5">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-warm-400">{label}</p>
      <p className="text-base font-semibold text-charcoal-900">{value || '—'}</p>
    </div>
  );
}

function TimelineItem({
  label,
  time,
  active,
  last,
}: {
  label: string;
  time?: string;
  active?: boolean;
  last?: boolean;
}) {
  return (
    <div className="relative flex gap-4">
      {!last && (
        <div
          className={`absolute bottom-0 left-2.5 top-5 w-0.5 ${active ? 'bg-forest-500' : 'bg-white/10'}`}
        />
      )}
      <div
        className={`z-10 h-5 w-5 rounded-full border-4 ${
          active ? 'border-forest-500/20 bg-forest-500' : 'border-white/10 bg-charcoal-900'
        }`}
      />
      <div className="-mt-0.5">
        <p className={`text-xs font-semibold uppercase tracking-wide ${active ? 'text-white' : 'text-warm-500'}`}>
          {label}
        </p>
        {time && <p className="mt-1 text-[11px] font-bold uppercase text-warm-400">{time}</p>}
      </div>
    </div>
  );
}

function DecisionModal({
  intent,
  applicationId,
  applicantName,
  onClose,
  onSaved,
}: {
  intent: DecisionIntent;
  applicationId: string;
  applicantName: string;
  onClose: () => void;
  onSaved: (message: string) => void;
}) {
  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const copy: Record<DecisionIntent, { title: string; action: string; message: string }> = {
    ADMIT: {
      title: 'Recommend admission',
      action: 'Record recommendation',
      message: `${applicantName} has been recommended for admission. Issue an offer next.`,
    },
    REJECT: {
      title: 'Reject application',
      action: 'Reject application',
      message: 'Application rejected.',
    },
    WAITLIST: {
      title: 'Waitlist application',
      action: 'Waitlist application',
      message: 'Application moved to the waitlist.',
    },
  };

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (saving) return;
    if (intent === 'REJECT' && reason.trim().length < 3) {
      setError('Give a reason for rejecting this application.');
      return;
    }
    if (
      intent === 'REJECT' &&
      !window.confirm(`Reject the application from ${applicantName}? This cannot be undone.`)
    ) {
      return;
    }
    setSaving(true);
    setError('');
    try {
      await apiFetch(`/admissions/applications/${applicationId}/decision`, {
        method: 'POST',
        body: JSON.stringify({
          decision: intent,
          reason: reason.trim() || undefined,
          notes: notes.trim() || undefined,
        }),
      });
      onSaved(copy[intent].message);
    } catch (err: any) {
      setError(err?.message || 'Could not record the decision.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      isOpen
      onClose={onClose}
      title={copy[intent].title}
      footerActions={
        <>
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button
            type="submit"
            form="decision-form"
            variant={intent === 'REJECT' ? 'danger' : 'primary'}
            isLoading={saving}
          >
            {copy[intent].action}
          </Button>
        </>
      }
    >
      <form id="decision-form" onSubmit={submit} className="space-y-4">
        {error && (
          <p role="alert" className="rounded-lg bg-danger-50 p-3 text-xs font-semibold text-danger-700">
            {error}
          </p>
        )}
        <p className="rounded-lg bg-ivory-50 p-3 text-[11px] font-medium text-warm-500">
          {intent === 'ADMIT'
            ? 'Recording a recommendation moves the application to DECISION_PENDING. You will then issue a formal offer.'
            : 'The decision is stored in the application history with your name and the date.'}
        </p>
        <div className="space-y-1.5">
          <label htmlFor="decision-reason" className="block text-xs font-semibold text-charcoal-800">
            Reason {intent === 'REJECT' ? '*' : '(optional)'}
          </label>
          <textarea
            id="decision-reason"
            rows={3}
            required={intent === 'REJECT'}
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            className="w-full resize-none rounded-lg border border-warm-300 bg-card p-3 text-sm text-charcoal-900 focus:border-forest-600 focus:outline-none focus:ring-2 focus:ring-forest-600/20"
          />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="decision-notes" className="block text-xs font-semibold text-charcoal-800">
            Internal notes
          </label>
          <textarea
            id="decision-notes"
            rows={2}
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            className="w-full resize-none rounded-lg border border-warm-300 bg-card p-3 text-sm text-charcoal-900 focus:border-forest-600 focus:outline-none focus:ring-2 focus:ring-forest-600/20"
          />
        </div>
      </form>
    </Modal>
  );
}

function OfferModal({
  applicationId,
  className,
  onClose,
  onSaved,
}: {
  applicationId: string;
  className?: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [expiryDate, setExpiryDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() + 14);
    return date.toISOString().slice(0, 10);
  });
  const [conditions, setConditions] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (saving) return;
    if (!expiryDate) {
      setError('Choose an expiry date for the offer.');
      return;
    }
    if (new Date(`${expiryDate}T23:59:59`).getTime() < Date.now()) {
      setError('The offer expiry date must be in the future.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await apiFetch(`/admissions/applications/${applicationId}/offer`, {
        method: 'POST',
        body: JSON.stringify({
          expiryDate: new Date(`${expiryDate}T23:59:59`).toISOString(),
          conditions: conditions.trim() || undefined,
        }),
      });
      onSaved();
    } catch (err: any) {
      setError(err?.message || 'Could not issue the offer.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      isOpen
      onClose={onClose}
      title="Issue admission offer"
      footerActions={
        <>
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" form="offer-form" isLoading={saving}>
            Issue offer
          </Button>
        </>
      }
    >
      <form id="offer-form" onSubmit={submit} className="space-y-4">
        {error && (
          <p role="alert" className="rounded-lg bg-danger-50 p-3 text-xs font-semibold text-danger-700">
            {error}
          </p>
        )}
        <p className="rounded-lg bg-ivory-50 p-3 text-[11px] font-medium text-warm-500">
          The offer is issued for {className || 'the requested class'} and moves the application to OFFERED.
        </p>
        <Input
          label="Offer expiry date *"
          type="date"
          required
          value={expiryDate}
          onChange={(event) => setExpiryDate(event.target.value)}
        />
        <div className="space-y-1.5">
          <label htmlFor="offer-conditions" className="block text-xs font-semibold text-charcoal-800">
            Conditions
          </label>
          <textarea
            id="offer-conditions"
            rows={3}
            value={conditions}
            onChange={(event) => setConditions(event.target.value)}
            placeholder="e.g. Report card and birth certificate must be presented"
            className="w-full resize-none rounded-lg border border-warm-300 bg-card p-3 text-sm text-charcoal-900 focus:border-forest-600 focus:outline-none focus:ring-2 focus:ring-forest-600/20"
          />
        </div>
      </form>
    </Modal>
  );
}
